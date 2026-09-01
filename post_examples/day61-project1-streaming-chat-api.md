---
id: 65
title: "AI Agent 学习计划 - Day 61：项目一 - 流式对话 API"
slug: "ai-agent-day61-project1-streaming-chat-api"
date: "2026-08-31"
tags: ["AI Agent", "实战项目", "项目一", "流式对话", "Vercel AI SDK", "streamText", "RAG", "学习计划"]
excerpt: "项目一第五步：把 Day 60 的语义检索链接入 Vercel AI SDK 的 streamText，做成一个流式对话 API Route。这是「检索 → 生成 → 流式返回」全链路打通的关键一步，也是 Day 62 前端 Chat 组件的数据来源。"
readingTime: 15
---

# Day 61：项目一 - 流式对话 API

## 一、目标

Day 59 把 chunk 写进了向量库，Day 60 实现了语义检索。今天把它们**串进对话 API**：用户发消息 → 检索相关 chunk → 注入 System Prompt → 用 `streamText` 流式生成回答 → 以 UI Message Stream 协议返回，供 Day 62 前端直接 `useChat` 消费。

> 到目前为止的链路：**问题 → embedQuery → Pinecone query → 召回 chunk → 拼上下文 → Prompt → LLM（Day61 流式）→ 前端打字机（Day62）**。今天完成后端「检索 + 生成 + 流式」闭环。

## 二、为什么用 Vercel AI SDK 的 streamText

- 项目一前端计划用 `useChat`（Day 28/29 学过），它依赖**标准 UI Message Stream 协议**；`streamText(...).toUIMessageStreamResponse()` 直接吐出该协议，前后端零适配。
- 流式首字延迟（TTFT）低，长答案体验好（呼应 Day 27）。
- 检索逻辑与生成解耦：检索是普通 async 函数，先拿到 `context` 字符串再喂给 `streamText`。

> 学习资料（国内可访问镜像，官方 sdk.vercel.ai 可能受限）：Vercel AI SDK 中文文档 Streaming https://ai-sdk.com.cn/docs/ai-sdk-core/generating-text

## 三、后端实现：Next.js Route Handler

```ts
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText, convertToModelMessages } from 'ai'
import { retrieve } from '@/lib/retrieve' // Day 60 的检索函数

export const maxDuration = 30 // Vercel 流式函数超时

export async function POST(req: Request) {
  const { messages } = await req.json()

  // 1. 取最后一条用户问题做检索
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const context = lastUser ? await retrieve(lastUser.content) : ''

  // 2. 构造带证据的 System Prompt
  const system = [
    '你是一个基于私有知识库作答的助手。',
    '只使用下面「参考资料」中的内容回答，不要编造。',
    '如果资料里没有相关信息，明确说「根据现有资料无法回答」。',
    '',
    '【参考资料】',
    context || '（无相关参考资料）',
  ].join('\n')

  // 3. 流式生成 + 标准协议返回
  const result = streamText({
    model: openai('gpt-4o-mini'),
    system,
    messages: convertToModelMessages(messages), // 转成 SDK 内部消息格式
  })

  return result.toUIMessageStreamResponse()
}
```

要点：
- `convertToModelMessages`：把前端 `useChat` 的 UI Message（`role/content/parts`）转成 SDK 需要的 `ModelMessage`，避免前端/后端消息结构不一致（呼应 Day 28）。
- `toUIMessageStreamResponse()`：把流自动包成前端可消费的 UI Message Stream，含 `role/parts` 等字段。
- `maxDuration`：流式函数默认 10s，长答案会被掐断，务必调大。

## 四、检索函数（复用 Day 60）

```ts
// lib/retrieve.ts
import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'

export async function retrieve(question: string, topK = 4): Promise<string> {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
  const index = pc.index('kb-demo')
  const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })

  const queryVec = await embeddings.embedQuery(question)
  const res = await index.query({
    topK,
    vector: queryVec,
    includeMetadata: true,
  })

  return res.matches
    .map((m) => m.metadata?.text as string)
    .filter(Boolean)
    .join('\n\n---\n\n')
}
```

## 五、本地联调

用 curl 直接验证流式是否通（无需等前端）：

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"如何重置密码？"}]}'
```

能看到逐字吐出即成功。也可在路由里临时 `console.log(context)` 确认检索真的召回了内容。

## 六、常见坑

- **忘记 `convertToModelMessages`**：前端 `useChat` 的 `messages` 含 `parts`，直接传 `streamText({messages})` 会类型报错或行为异常。
- **System Prompt 没注入上下文**：检索结果拿到却没拼进 `system`，变成纯闲聊，RAG 白做。
- **`maxDuration` 不够**：长答案到 10s 被截断，出现「回答突然没了」。
- **检索与生成同模型混用**：检索用 `text-embedding-3-small`，生成用 `gpt-4o-mini`，二者职责不同别搞混（生成模型不能当 embedding 用）。
- **Key 泄露**：`OPENAI_API_KEY` / `PINECONE_API_KEY` 走 `.env.local`，别提交进仓库。
- **`toUIMessageStreamResponse` 与手写 `ReadableStream` 混用**：选了 `useChat` 就全程用 SDK 标准协议，别自己再拼 SSE（呼应 Day 27/28）。
- **官方站不可访问**：学习资料统一用国内镜像 `ai-sdk.com.cn`，不要硬连 `sdk.vercel.ai`。

## 七、今日实践任务

1. 实现 `app/api/chat/route.ts`，接入 Day 60 的 `retrieve`，用 `toUIMessageStreamResponse()` 返回。
2. 用 curl 联调，确认：① 召回了相关 chunk；② 回答是流式逐字返回；③ 资料无相关内容时回答「无法回答」。
3. 在 System Prompt 里加一句「用中文回答」，验证注入生效。
4. 给 `maxDuration` 设为 30，避免长答案被截断。

> 明日（Day 62）用 `useChat` 把这条流渲染成打字机 Chat 界面，项目一「能对话」的骨架就完整了。
