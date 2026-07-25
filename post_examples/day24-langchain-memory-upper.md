---
id: "28"
title: "AI Agent 学习计划 Day 24：LangChain.js Memory（上）— Buffer Memory 与 Summary Memory"
slug: "ai-agent-day24-langchain-memory-upper"
date: "2026-07-25"
tags: ["AI Agent", "LangChain", "Memory", "BufferMemory", "SummaryMemory", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第二十四天。Agent 不能「金鱼记忆」——今天进入 LangChain.js 的 Memory 模块（上）：理解为什么 LLM 需要记忆、消息列表如何作为短期记忆、ConversationBufferMemory 原样保存全部对话、ConversationSummaryMemory 用 LLM 把历史压缩成摘要省 token，以及现代 LCEL 做法（把 messages 数组直接喂给模型），并给出多轮对话实战与常见坑。"
readingTime: 33
---

# AI Agent 学习计划 Day 24：LangChain.js Memory（上）

> 📅 日期：2026-07-25  
> 🎯 阶段二：核心框架（Day 15-35）  
> 📊 学习进度：Day 24 / 84（28.6%）

## 前言

前两天的 Agent 有个致命缺陷：每次调用都是「失忆」的。你问「我叫什么？」，它答不上来——因为 LLM 本身无状态，每次请求只看到当前这条消息。

要让 Agent 记住上下文，就得引入 **Memory（记忆）**。今天是 Memory 模块上半场：Buffer Memory（原样缓存）与 Summary Memory（摘要压缩）。

## 一、为什么 LLM 需要记忆？

LLM 是无状态的：它的「记忆」完全来自你塞进 `messages` 数组里的历史。对话越长，数组越大，token 越贵、越容易超出上下文窗口。

记忆系统要解决两件事：
1. **多轮连贯**：让模型知道「刚才聊到哪了」。
2. **成本控制**：历史太长时，要么截断，要么压缩成摘要。

## 二、ConversationBufferMemory（原样缓存）

最简单：把每一轮 human/ai 消息原样存下来，下次一并传给模型。

```ts
import { ConversationBufferMemory } from "langchain/memory";
import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";

const memory = new ConversationBufferMemory();
const model = new ChatOpenAI({ model: "gpt-4o-mini" });
const chain = new ConversationChain({ llm: model, memory });

await chain.invoke({ input: "我叫小明。" });
const res = await chain.invoke({ input: "我刚才说我叫什么？" });
console.log(res.response); // 小明
```

`memory.buffer` 里就是完整的对话字符串。优点是实现简单、信息零丢失；缺点是**线性增长**，聊 50 轮就爆 token。

## 三、ConversationSummaryMemory（摘要压缩）

用另一个 LLM 调用，把历史「总结」成一段越来越精炼的摘要，只把摘要 + 最近几轮传给模型：

```ts
import { ConversationSummaryMemory } from "langchain/memory";

const memory = new ConversationSummaryMemory({ llm: model });

await memory.saveContext(
  { input: "我叫小明，喜欢游泳。" },
  { output: "好的，已记住。" }
);
await memory.saveContext(
  { input: "我住在北京。" },
  { output: "收到，北京。" }
);

const vars = await memory.loadMemoryVariables({});
console.log(vars.history); // 一段 LLM 生成的摘要：用户叫小明，喜欢游泳，住北京。
```

适合**长对话**场景——聊得越久越省 token。代价是每次存上下文都多一次 LLM 调用（成本 + 延迟），且摘要可能「忘掉」细节。

> 还有中间形态 `ConversationSummaryBufferMemory`：保留最近 N 轮原文 + 更早的摘要，兼顾细节与成本，是生产常用选择。

## 四、现代 LCEL 做法（推荐）

新版 LangChain 更推荐**直接管理 messages 数组**，而非用 legacy 的 `Memory` 类：

```ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个有记忆的助手。"],
  new MessagesPlaceholder("history"), // 历史消息占位
  ["human", "{input}"],
]);

const model = new ChatOpenAI({ model: "gpt-4o-mini" });
const chain = prompt.pipe(model);

// 自己维护 history 数组
let history: (HumanMessage | AIMessage)[] = [];

const res1 = await chain.invoke({ input: "我叫小红。", history });
history.push(new HumanMessage("我叫小红。"));
history.push(new AIMessage(res1.content as string));

const res2 = await chain.invoke({ input: "我刚说我叫什么？", history });
console.log(res2.content);
```

这种方式灵活、透明，配合 LangGraph 的 `MessageState` 还能做「摘要裁剪」等高级策略。

## 五、常见坑

1. **忘记把 history 传进 prompt** → 用 `MessagesPlaceholder("history")` 但 invoke 时漏了 `history` 键，模型仍失忆。
2. **Buffer Memory 无限增长** → 长对话爆上下文窗口；要么换 Summary，要么手动截断 `history.slice(-6)`。
3. **Summary Memory 摘要丢失细节** → 关键信息（如用户名）被压缩掉；重要事实建议单独用 `buffer` 或外部存储。
4. **legacy Memory 类已弃用** → `langchain/memory` 的 `ConversationXxxMemory` 在新版被标记 legacy，新项目优先 LCEL messages 数组。
5. **消息顺序错乱** → history 必须是 Human/Ai 交替且以合理顺序传入，否则模型理解错乱。
6. **多用户串号** → 记忆是「按会话」隔离的，必须给每个用户/会话单独维护一份 `history` 或 `memory` 实例（keyed by sessionId）。

## 六、今日小结

- LLM 无状态，记忆 = 塞进 `messages` 的历史；记忆解决「连贯」与「成本」两件事。
- `ConversationBufferMemory`：原样缓存，简单但线性增长。
- `ConversationSummaryMemory`：LLM 压缩摘要，省 token 但可能丢细节；`SummaryBufferMemory` 折中。
- 现代做法：直接维护 messages 数组 + `MessagesPlaceholder`，更灵活、契合 LangGraph。
- 生产务必按 sessionId 隔离记忆，避免用户串号。

---

🔗 **学习资料与网站**（均为国内可访问镜像）：
- LangChain JS/TS 中文文档：https://js.langchain.com.cn/docs/
- LangChain 中文网 记忆模块（Memory）：https://langchain.nodejs.cn/docs/concepts/memory/
- LangChain 中文文档 Memory 概述：https://langchain-doc.cn/v1/python/langchain/memory.html
- www.langchain.com.cn Memory 文档：https://www.langchain.com.cn/docs/modules/data_connection/memory/
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html

💡 **学习建议**：
- 先跑通 `ConversationBufferMemory` 多轮对话（感受「它终于记得我名字了」），再换成 `ConversationSummaryMemory` 对比 token 消耗。
- 亲手用 LCEL messages 数组维护一份 `history`，这是后续做带记忆 Agent / LangGraph 的基础。
- 思考一个真实场景：客服机器人如何按 userId 隔离记忆？这决定了你的记忆架构。

⏰ 预计学习时长：2 小时

---

进度：Day 24 / 84（28.6%）  
下一站：Day 25 —— LangChain.js Memory（下）：向量记忆
