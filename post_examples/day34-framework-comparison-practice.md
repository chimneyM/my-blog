---
id: "38"
title: "阶段二总结 - 框架对比实践：LangChain.js vs Vercel AI SDK"
slug: "ai-agent-day34-framework-comparison-practice"
date: "2026-08-04"
tags: ["AI Agent", "阶段二总结", "LangChain.js", "Vercel AI SDK", "框架对比", "Agent demo"]
excerpt: "阶段二收官：系统性对比 LangChain.js 与 Vercel AI SDK 的设计哲学、适用场景、核心 API 映射，并动手完成一个「最小通用 Agent demo」——同时用两套框架实现「带工具调用的多轮问答」，沉淀可复用的选型决策表。"
readingTime: 13
---

## 回顾与今天的目标

阶段二（Day 15-35）我们啃下了两大框架：
- **Day 16-25 LangChain.js**：Model I/O、Retrieval、Chains、Agents、Memory，强调「框架帮你跑完整个链路」。
- **Day 26-33 Vercel AI SDK**：AI Core、Streaming UI、Tool Calling、RSC，强调「轻量、贴近手写 Agent Loop」。

今天做**收官对比 + 实践**：把两套框架放进同一张决策表，并用**同一个需求**（带工具调用的多轮问答 Agent）各写一版，看清差异本质。

## 1. 设计哲学对比

| 维度 | LangChain.js | Vercel AI SDK |
|------|--------------|---------------|
| 定位 | 全栈 Agent 框架（生态最大） | 轻量生成/流式原语（前端友好） |
| 抽象层级 | 高（Chain/Agent/Retriever 开箱即用） | 低（generate/stream/tool 原语，你自己编排） |
| 流式 | 需包一层 / 中间件 | 一等公民（textStream/partialTextStream/tool-invocation） |
| 前端 | 较少内置 UI | `useChat`/`streamUI` 深度集成 React |
| 多 Agent | LangGraph（专用编排层） | 自己用 maxSteps/分支实现 |
| RAG | 文档加载/切分/向量库全家桶 | 需自行组合（或用 LangChain retriever） |
| 学习曲线 | 陡（概念多、版本迭代快） | 缓（API 少、直觉强） |
| 适合 | 复杂 RAG、多步 Agent、生产级管线 | 聊天 UI、AI 生成组件、快速原型 |

**一句话**：LangChain 是「瑞士军刀套装」，Vercel AI SDK 是「锋利的水果刀」。复杂管线选前者，前端流式聊天选后者。

## 2. 核心 API 映射表

| 能力 | LangChain.js | Vercel AI SDK |
|------|--------------|---------------|
| 文本生成 | `model.invoke(prompt)` | `generateText({ model, prompt })` |
| 流式 | `model.stream()` | `streamText()` → `textStream` |
| 工具 | `@tool` + `initializeAgentExecutorWithOptions` | `tool()` + `tools` + `maxSteps` |
| 提示模板 | `ChatPromptTemplate` | 直接字符串 / 自行封装 |
| 记忆 | `BufferMemory` / messages 数组 | 自行维护 `messages` 数组 |
| 链式编排 | `RunnableSequence` / `RunnableBranch` | 自行函数组合 |
| 前端 | 自行搭 | `useChat` / `streamUI` |

## 3. 同一个需求，两种实现

**需求**：用户问「上海天气如何？如果 >30 度告诉我东京天气」，Agent 需调天气工具、可能多轮。

### Vercel AI SDK 版（更短）

```ts
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const weather = tool({
  description: '获取城市天气',
  parameters: z.object({ city: z.string() }),
  execute: async ({ city }) => fetchWeather(city),
});

const { text, steps } = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: '上海天气如何？如果 >30 度告诉我东京天气',
  tools: { weather },
  maxSteps: 5, // 自动多轮工具循环
});
console.log(text, steps);
```

### LangChain.js 版（更结构化）

```ts
import { ChatOpenAI } from '@langchain/openai';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const weather = tool(async ({ city }) => fetchWeather(city), {
  name: 'weather',
  description: '获取城市天气',
  schema: z.object({ city: z.string() }),
});

const llm = new ChatOpenAI({ model: 'gpt-4o-mini' });
const agent = createToolCallingAgent({
  llm,
  tools: [weather],
  prompt: ChatPromptTemplate.fromMessages([
    ['system', '你是一个助手'],
    ['placeholder', '{chat_history}'],
    ['human', '{input}'],
    ['placeholder', '{agent_scratchpad}'],
  ]),
});
const executor = new AgentExecutor({ agent, tools: [weather], maxIterations: 5 });
const res = await executor.invoke({ input: '上海天气如何？>30度告诉我东京天气' });
console.log(res.output);
```

**对比直觉**：Vercel 版像「写业务代码」，LangChain 版像「配置一个 Agent 对象」。前者灵活透明，后者结构清晰、易扩展（换 retriever、加 memory 都现成）。

## 4. 选型决策树（沉淀给自己）

```
需要现成 RAG 全家桶 / 多 Agent 编排 / 生产级管线？
  ├─ 是 → LangChain.js (+ LangGraph)
  └─ 否 → 主要做聊天/AI 生成 UI、重视前端流式体验？
            ├─ 是 → Vercel AI SDK（useChat / streamUI）
            └─ 否 → 两者皆可，按团队熟悉度选；
                     想轻量可控选 Vercel，想生态完整选 LangChain
```

## 5. 小型 Agent demo 实践任务

今天动手：用**你更想深入的框架**，实现一个「最小通用 Agent」：
- 至少挂 2 个工具（如 calculator + weather/search）；
- 支持多轮工具调用（Vercel 用 `maxSteps`，LangChain 用 `maxIterations`）；
- 支持多轮对话记忆（Vercel 自己维护 messages，LangChain 用 BufferMemory 或 messages 数组）；
- 把 Day 12 的 ReAct Agent Loop 思想真正跑通。

把代码提交到你的练习仓库，作为阶段二成果物。

## 6. 常见坑

- **两端混用却不清边界** → 可在 Vercel 项目里 import LangChain 的 retriever（互补），但别重复造轮子。
- **为用 LangChain 而用 LangChain** → 简单聊天用 Vercel 三行搞定，别上重框架。
- **demo 不沉淀** → 阶段二结束务必留一份可运行 demo，阶段三（RAG/多 Agent）会复用。
- **API Key 暴露** → 无论哪套，key 都只在服务端；前端走 API Route / Server Action。
- **官方站不可访问** → 文档用国内镜像：LangChain 中文 js.langchain.com.cn / langchain-doc.cn，Vercel AI SDK 中文 ai-sdk.com.cn。

## 学习资料与延伸

- LangChain.js Templates（官方模板库）：https://github.com/langchain-ai/langchainjs-templates
- Vercel AI Chatbot（完整参考实现）：https://github.com/vercel/ai-chatbot
- Vercel AI SDK 中文文档：https://ai-sdk.com.cn/docs/introduction
- LangChain JS/TS 中文文档：https://js.langchain.com.cn/docs/
- 2026 AI Agent 框架终极对比（掘金）：https://juejin.cn/post/7636584182789718058

## 今日小练习

按上面的选型决策树，给自己定一个「阶段三 RAG 项目」的技术栈（提示：RAG 全家桶倾向 LangChain，但若项目已是 Next.js + Vercel AI SDK 也可混用其流式 UI + LangChain retriever）。然后完成「最小通用 Agent demo」并提交。
