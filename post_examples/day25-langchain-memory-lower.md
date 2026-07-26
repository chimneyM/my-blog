---
id: "29"
title: "AI Agent 学习计划 Day 25：LangChain.js Memory（下）— 向量记忆"
slug: "ai-agent-day25-langchain-memory-lower"
date: "2026-07-26"
tags: ["AI Agent", "LangChain", "Memory", "VectorMemory", "VectorStore", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第二十五天。Memory 模块收官：向量记忆（Vector Memory）。当对话/知识多到 Buffer/Summary 都装不下时，把记忆存进向量数据库，按需语义检索最相关的历史片段喂给模型，实现「长期记忆 + 精准召回」。覆盖 VectorStoreRetrieverMemory 原理、与 Day 19 向量库的衔接、完整实战、与 Buffer/Summary 的选型对比及常见坑。"
readingTime: 33
---

# AI Agent 学习计划 Day 25：LangChain.js Memory（下）

> 📅 日期：2026-07-26  
> 🎯 阶段二：核心框架（Day 15-35）  
> 📊 学习进度：Day 25 / 84（29.8%）

## 前言

昨天学了 Buffer（原样缓存）和 Summary（摘要压缩）——它们都活在内存里，对话一多还是装不下，而且「旧话题」很快被新话题挤出去。

真正的长期记忆应该像人脑：不是记住全部，而是**需要时能想起相关的**。这就是**向量记忆（Vector Memory）**——把记忆存入向量库，按语义检索最相关片段。这正是我们 Day 18/19 学的 RAG 技术直接复用。

## 一、向量记忆的核心思想

普通记忆把「全部历史」塞进 prompt；向量记忆只把「和当前问题最相关的历史」塞进去：

```
新问题时 → 把 query 嵌入成向量 → 在记忆向量库里检索 Top-K 相似历史 → 把命中片段 + 新问题一起喂给模型
```

好处：
- **无限容量**：记忆落库（Chroma/MemoryVectorStore/Pinecone），不受上下文窗口限制。
- **精准召回**：只取相关片段，token 省、噪声低。
- **长期跨会话**：记忆可持久化，关掉再开还能「记得」。

## 二、VectorStoreRetrieverMemory（legacy）

```ts
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { VectorStoreRetrieverMemory } from "langchain/memory";

const embeddings = new OpenAIEmbeddings();
const vectorStore = new MemoryVectorStore(embeddings);
const memory = new VectorStoreRetrieverMemory({
  vectorStore,
  memoryKey: "history", // 检索结果注入 prompt 的键
  // k: 3,  // 默认返回 Top-3 相关片段
});

// 存记忆（每条 input/output 会被嵌入存储）
await memory.saveContext(
  { input: "我最喜欢的语言是 TypeScript。" },
  { output: "记下了，TypeScript 是你的最爱。" }
);
await memory.saveContext(
  { input: "我在做一个 AI Agent 项目。" },
  { output: "好的，关注你的 Agent 项目。" }
);

// 检索：会语义匹配到「TypeScript」这条
const vars = await memory.loadMemoryVariables({
  input: "我之前说最喜欢哪门语言来着？",
});
console.log(vars.history); // 命中相关片段，而非全部对话
```

## 三、现代 LCEL 做法（推荐）：自己接 Retriever

新版更推荐直接用 Day 18/19 的 `VectorStore` + `asRetriever()`，把检索结果拼进 prompt：

```ts
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";

const embeddings = new OpenAIEmbeddings();
const store = await MemoryVectorStore.fromDocuments(
  [
    new Document({ pageContent: "用户最喜欢的语言是 TypeScript。" }),
    new Document({ pageContent: "用户在做 AI Agent 项目。" }),
  ],
  embeddings
);
const retriever = store.asRetriever({ k: 2 });

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "参考以下相关记忆回答用户：\n{context}"],
  ["human", "{input}"],
]);
const model = new ChatOpenAI({ model: "gpt-4o-mini" });
const chain = prompt.pipe(model);

const docs = await retriever.invoke("我最喜欢哪门语言？");
const res = await chain.invoke({
  context: docs.map((d) => d.pageContent).join("\n"),
  input: "我最喜欢哪门语言？",
});
console.log(res.content);
```

## 四、三种记忆选型对比

| 记忆类型 | 容量 | 成本 | 适合场景 |
|---------|------|------|---------|
| Buffer Memory | 小（线性增长） | 低 | 短对话、demo |
| Summary Memory | 中 | 中（每次多一次 LLM 调用） | 中等长度、要保关键信息 |
| **Vector Memory** | 大（落库） | 中（嵌入+检索） | 长期记忆、知识型 Agent、跨会话 |

实践中常**组合使用**：用 Buffer 保最近几轮、用 Vector 召回久远相关、用 Summary 压缩中段。

## 五、常见坑

1. **legacy `VectorStoreRetrieverMemory` 已弃用** → 新项目直接用 `VectorStore.asRetriever()` 拼 prompt，更可控。
2. **存了不检索** → saveContext 后没在 prompt 里注入 `vars.history`/检索结果，记忆形同虚设。
3. **嵌入模型不一致** → 记忆写入与检索用的 Embeddings 必须是同一个模型，否则语义不匹配。
4. **k 设太大** → 召回无关片段淹没上下文；一般 3~5 足够，可配合 score 阈值过滤。
5. **忘记持久化** → MemoryVectorStore 是内存库，进程重启即丢；要长期记忆请用 Chroma/Pinecone 持久化。
6. **敏感信息入向量库** → 记忆可能含隐私，落库前需脱敏或加密。

## 六、今日小结

- 向量记忆 = 把记忆存入向量库、按语义检索相关片段，解决「容量无限 + 精准召回」的长期记忆需求。
- 本质是 Day 18/19 RAG 技术在记忆场景的直接复用。
- legacy `VectorStoreRetrieverMemory` 已弃用，现代做法：`VectorStore.asRetriever()` + 拼 prompt。
- 生产常组合 Buffer + Summary + Vector 三件套；注意模型一致、k 值、持久化、脱敏。

---

🔗 **学习资料与网站**（均为国内可访问镜像）：
- LangChain JS/TS 中文文档：https://js.langchain.com.cn/docs/
- LangChain 中文网 记忆模块：https://langchain.nodejs.cn/docs/concepts/memory/
- LangChain 中文文档 Memory 概述：https://langchain-doc.cn/v1/python/langchain/memory.html
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html
- （向量库衔接，见 Day 19）LangChain 中文网 向量存储：https://langchain.nodejs.cn/docs/concepts/vectorstores/

💡 **学习建议**：
- 把 Day 24 的 LCEL messages 数组版，改造成「Vector Memory」：把历史存进 MemoryVectorStore，每次回答前先检索相关片段拼进 system prompt。
- 对比实验：问一个「一周前聊过的冷门话题」，看 Buffer（可能已滚出窗口）vs Vector（能召回）的差异，体会长期记忆价值。
- 想想你的知识库问答项目（Day 57+）如何复用今天的向量记忆思路。

⏰ 预计学习时长：2 小时

---

进度：Day 25 / 84（29.8%）  
下一站：Day 26 —— Vercel AI SDK - AI Core（上）：统一 LLM 调用接口与 generateText
