---
id: "39"
title: "阶段二复习与代码整理：LangChain.js + Vercel AI SDK 沉淀"
slug: "ai-agent-day35-phase2-review"
date: "2026-08-05"
tags: ["AI Agent", "阶段二复习", "LangChain.js", "Vercel AI SDK", "代码整理"]
excerpt: "阶段二（Day 15-35）收官复习日：把 LangChain.js 与 Vercel AI SDK 两套框架的代码示例、心智模型做一次系统性整理，形成可复用的笔记目录与速查表，为阶段三 RAG / 多 Agent / 工具集成打地基。"
readingTime: 11
---

## 回顾与今天的目标

阶段二（Day 15-35）我们走完了两大框架：
- **Day 16-25 LangChain.js**：Model I/O、Retrieval、Chains、Agents、Memory——「框架帮你跑完整个链路」。
- **Day 26-33 Vercel AI SDK**：AI Core、Streaming UI、Tool Calling、RSC——「轻量、贴近手写 Agent Loop」。

今天不学新概念，而是**整理代码 + 建立速查心智模型**，把散落的知识点收拢成可复用的资产。

## 1. 两套框架的「一句话心智模型」

| 维度 | LangChain.js | Vercel AI SDK |
| --- | --- | --- |
| 定位 | 瑞士军刀套装（开箱即用的链/记忆/检索） | 水果刀（贴近原语，自己拼装） |
| 核心抽象 | Runnable（LCEL pipe） | `generateText` / `streamText` 返回控制器 |
| 记忆 | legacy Memory 类已弃用，现代用 messages 数组 | 天然用 messages 数组，配合 `useChat` |
| 前端 | 无内建 UI，自己接 | `@ai-sdk/react` 的 `useChat` 开箱即用 |
| 适合 | 复杂 RAG / 多步编排 / 想少写样板 | 轻量流式 Chat / 前端驱动 / 想完全掌控 |

> 关键结论：**不是二选一**。RAG 重检索用 LangChain 方便，流式 Chat 用 Vercel AI SDK 顺手，真实项目常混用。

## 2. 代码整理清单（建议今天落地）

把前 20 天写的 demo 归到统一目录：

```
ai-agent-playground/
├── langchain/
│   ├── 01-model-io.ts        # ChatOpenAI + PromptTemplate + OutputParser
│   ├── 02-retrieval.ts       # 加载→切分→嵌入→入库→检索
│   ├── 03-chains.ts          # RunnableSequence / RunnableBranch 路由
│   ├── 04-agents.ts          # createToolCallingAgent + 自定义工具
│   └── 05-memory.ts          # messages 数组 + MessagesPlaceholder
└── vercel-ai/
    ├── 01-generate-text.ts   # generateText 三种用法
    ├── 02-stream-text.ts     # streamText + 原生流消费
    ├── 03-use-chat/          # 前端聊天组件（Next.js）
    └── 04-tool-calling.ts    # tool() + maxSteps 多轮
```

每个文件顶部写 3 行注释：**做什么 / 关键 API / 坑点**，半年后回看也能秒懂。

## 3. 必背速查表

**LangChain.js 高频片段**
```ts
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'

const chain = RunnableSequence.from([
  ChatPromptTemplate.fromMessages([['system', '你是一个助手'], ['human', '{input}']]),
  new ChatOpenAI({ model: 'gpt-4o-mini' }),
  new StringOutputParser(),
])
await chain.invoke({ input: '你好' })
```

**Vercel AI SDK 高频片段**
```ts
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const { text } = await generateText({
  model: openai('gpt-4o-mini'),
  messages: [{ role: 'user', content: '你好' }],
})
```

## 4. 常见坑回顾（阶段二高频翻车点）

- **混用框架边界**：在 Vercel 里硬套 LangChain 的 Memory 类 → 直接维护 messages 数组更干净。
- **provider 包漏装**：`generateText` 报 "model not found" 多半是没装 `@ai-sdk/openai`。
- **Node 版本过低**：Vercel AI SDK 要求 Node 18+，流式 API 依赖原生 fetch。
- **未消费完流**：`streamText` 返回的流不读取会内存泄漏，前端务必消费到底。
- **ReAct 解析脆弱**：优先用原生 tool calling（`createToolCallingAgent`），别迷信 ReAct 文本解析。

## 5. 今日实践任务

1. 按上面的目录结构，把前 20 天的 demo 搬进 `ai-agent-playground`。
2. 为每个文件补「做什么 / 关键 API / 坑点」三行注释。
3. 写一份 `README.md`，用一张表说清「什么场景用哪套框架」。

---

## 学习建议
- 复习日最容易「看了就过」，**动手整理代码**比再看一遍文档收益高 3 倍。
- 把速查片段存进你的代码片段工具（VS Code Snippets / Raycast），下次写 Agent 直接调。
- 官方站点（js.langchain.com / sdk.vercel.ai）国内可能不可访问，收藏中文镜像：
  - LangChain JS 中文：https://js.langchain.com.cn/docs/
  - Vercel AI SDK 中文：https://ai-sdk.com.cn/docs/introduction

⏰ 预计学习时长：2 小时（动手整理为主）
