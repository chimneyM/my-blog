---
id: "31"
title: "Vercel AI SDK - AI Core（下）：streamText 与流式响应"
slug: "ai-agent-day27-vercel-ai-core-lower"
date: "2026-07-28"
tags: ["AI Agent", "Vercel AI SDK", "streamText", "流式响应", "TypeScript"]
excerpt: "深入 Vercel AI SDK 的 streamText：流式生成原理、textStream/fullStream/partialTextStream 的区别、前端消费流式响应的方式、中断与错误控制，以及与 generateText 的选型对比。"
readingTime: 12
---

## 为什么需要流式响应

在 Day 26 我们学习了 `generateText`，它是「攒齐全部文本再返回」。这对 CLI 脚本没问题，但对聊天类产品体验很差：

- 用户盯着空白屏等待数秒，容易以为卡死
- 长文本（几百字）首字延迟（TTFT）明显
- 无法中途取消、无法做打字机动效

`streamText` 解决的就是**首字延迟**问题：模型每生成一个 token 就立即推给前端，体验上「边想边打字」。它本质是对 LLM 的 SSE（Server-Sent Events）流式输出的封装。

## 包结构回顾

```bash
npm install ai @ai-sdk/openai zod
```

`streamText` 来自核心包 `ai`，provider 包只负责把请求改成流式格式，用法与 `generateText` 几乎一致。

## 1. streamText 基本用法

```ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = streamText({
  model: openai('gpt-4o-mini'),
  prompt: '用三句话介绍什么是流式响应',
});

// 异步迭代拿到每个 token 片段
for await (const delta of result.textStream) {
  process.stdout.write(delta);
}
```

`streamText` 是**同步返回**一个结果对象（不会 await 流式完成），真正的流在 `.textStream` 等属性上消费。这是它和 `generateText` 最大的心智区别：`generateText` 返回 Promise，而 `streamText` 立即返回「控制器」。

## 2. 三种读取流的入口（重点区分）

`streamText` 的结果对象暴露多个流，用途不同，千万别混用：

| 属性 | 类型 | 用途 |
| --- | --- | --- |
| `textStream` | `AsyncIterableStream<string>` | 只拿文本增量，最常用 |
| `fullStream` | `AsyncIterableStream<...>` | 拿完整事件流（text-delta / tool-call / finish / error 等），用于精细控制 |
| `partialTextStream` | `AsyncIterableStream<string>` | 每次推送「截至当前的全部累积文本」而非增量 |

`textStream` 给的是**增量片段**（delta），`partialTextStream` 给的是**累积全文**。前者适合「边收边拼」，后者适合「直接用当前全文渲染」。绝大多数场景用 `textStream` 即可。

`fullStream` 适合需要感知工具调用、结束原因、用量等元事件的高级场景：

```ts
for await (const part of result.fullStream) {
  if (part.type === 'text-delta') {
    process.stdout.write(part.textDelta);
  } else if (part.type === 'finish') {
    console.log('\n结束原因:', part.finishReason, '用量:', part.usage);
  }
}
```

## 3. 在服务端把流转成 HTTP 响应

Node 服务端要把流推给浏览器，标准做法是用 `toUIMessageStreamResponse()`（新版本）或 `toDataStreamResponse()`：

```ts
// app/api/chat/route.ts（Next.js App Router 示例）
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    prompt,
  });

  return result.toUIMessageStreamResponse();
}
```

这个方法会自动设置 `Content-Type: text/plain; charset=utf-8`、完成分块编码、并在客户端断开时自动中止底层请求（省 token）。

## 4. 前端消费流式响应

原生 `fetch` + `ReadableStream` 即可消费，无需额外库：

```ts
const res = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ prompt: '讲个冷笑话' }),
});

const reader = res.body!.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  document.getElementById('output')!.textContent += chunk;
}
```

> 下一站（Day 28）会介绍 Vercel 提供的 `useChat` React Hook，它把上面的 reader 逻辑封装好，还自动管理消息列表、重新生成、中断按钮，大幅减少样板代码。今天先把「流到底是怎么一字节一字节来的」理解透。

## 5. 中断与错误控制

```ts
const controller = new AbortController();

const result = streamText({
  model: openai('gpt-4o-mini'),
  prompt: '写一篇 5000 字小说',
  abortSignal: controller.signal, // 用户点「停止」时调用 controller.abort()
  onError: ({ error }) => {
    console.error('流式出错:', error);
  },
});

// 用户取消
controller.abort();
```

注意：`streamText` **不会**因为客户端断开而自动停止，必须显式传 `abortSignal` 才能在用户关闭页面时省下算力。这一点在生产环境很重要，否则后端会一直跑完整个长文本。

## 6. streamText vs generateText 选型

| 维度 | generateText | streamText |
| --- | --- | --- |
| 首字延迟 | 高（全生成完才返回） | 低（边生成边推） |
| 适用场景 | 摘要、抽取、批处理、Agent 内部决策 | 聊天 UI、长文生成、打字机效果 |
| 返回值 | Promise<结果> | 同步结果对象 + 流 |
| 拿到完整文本 | 直接 `.text` | 需 `await result.text` 聚合 |

经验法则：**给用户看的、可能很长的 → 流式；程序内部用的、要拿确定结果再处理的 → generateText。**

## 7. 常见坑

1. **把 streamText 当 Promise await**：`const r = await streamText(...)` 是错误的，`streamText` 不是 async 函数，直接返回对象。要拿完整文本才用 `await result.text`。
2. **textStream 与 partialTextStream 混用**：前者是增量、后者是累积全文，重复拼接会内容翻倍。
3. **忘记传 abortSignal**：用户关页面后端仍在跑，浪费额度。
4. **漏装 provider 包**：`Cannot find module '@ai-sdk/openai'`，`ai` 核心包不含任何模型。
5. **Node 版本过低**：Vercel AI SDK v4+ 需要 Node 18+，Web Stream API 才完整。
6. **消费一半就丢弃流**：若不读完 `textStream`（或 handleErrorMode 默认 throw），未捕获错误会抛到 unhandledRejection。生产环境建议包一层 try/catch 或 `onError`。

## 小结

`streamText` 是 Vercel AI SDK 做聊天体验的核心。记住三件事：①它同步返回「流控制器」而非 Promise；②`textStream` 拿增量、`partialTextStream` 拿全文、`fullStream` 拿事件；③配合 `toUIMessageStreamResponse()` + `fetch` reader 即可端到端流式，别忘了 `abortSignal` 中断。Day 28 我们将用 `useChat` 把它变成声明式的前端组件。
