---
id: "32"
title: "Vercel AI SDK - Streaming UI（上）：流式渲染到前端与 useChat"
slug: "ai-agent-day28-vercel-streaming-ui-upper"
date: "2026-07-29"
tags: ["AI Agent", "Vercel AI SDK", "useChat", "流式渲染", "React"]
excerpt: "用 useChat Hook 把流式响应变成声明式的 React 聊天界面：自动管理消息列表、流式打字机渲染、停止/重新生成，并理解服务端与前端如何协同。"
readingTime: 12
---

## 为什么需要 useChat

Day 27 我们用手写 `fetch` + `ReadableStream` 消费流式响应，能用但样板代码多：要自己维护消息数组、拼接增量文本、处理 loading 态、做中断按钮。Vercel AI SDK 的 `ai/rsc`/`@ai-sdk/react` 提供了 `useChat` Hook，把这些全部封装掉。

`useChat` 的核心价值：**把「流」变成「状态」**——你只声明要渲染消息列表，Hook 自动处理流式更新、发送请求、错误与中断。

## 包与依赖

```bash
npm install ai @ai-sdk/openai @ai-sdk/react zod
```

- 服务端：`ai` + provider 包
- 前端：`@ai-sdk/react`（提供 `useChat`）

## 1. 服务端：暴露一个流式接口

沿用 Day 27 的 `streamText` + `toUIMessageStreamResponse()`，只是这次按 `useChat` 约定读取请求体里的 `messages`：

```ts
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json(); // useChat 自动以 messages 格式发送

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,                       // 直接透传历史消息
    system: '你是一个友善的助手',
  });

  return result.toUIMessageStreamResponse();
}
```

关键点：`useChat` 发的请求体是 `{ messages: UIMessage[] }`，所以服务端直接 `req.json().messages` 即可，无需自己设计协议。

## 2. 前端：useChat 声明式聊天

```tsx
'use client';
import { useChat } from '@ai-sdk/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, status, stop } =
    useChat();

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role === 'user' ? '我' : 'AI'}:</strong>
          {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} placeholder="说点什么…" />
        {status === 'streaming' ? (
          <button type="button" onClick={stop}>停止</button>
        ) : (
          <button type="submit">发送</button>
        )}
      </form>
    </div>
  );
}
```

就这样，**打字机效果自动出现**——`messages` 里 AI 消息的 `content` 会随着流持续更新，React 重渲染即可。`status` 字段（`submitted`/`streaming`/`ready`/`error`）帮你切换「停止/发送」按钮与 loading 态，`stop()` 内部调用 `abortSignal` 中断请求（正是 Day 27 强调的生产要点）。

## 3. useChat 返回的常用字段

| 字段 | 说明 |
| --- | --- |
| `messages` | `UIMessage[]`，含 role/content/parts，流式期间自动更新 |
| `input` / `handleInputChange` | 输入框受控值 |
| `handleSubmit` | 提交表单，自动把 input 作为 user 消息发送并触发请求 |
| `status` | 当前状态：submitted / streaming / ready / error |
| `stop` | 中断当前流式请求 |
| `reload` | 不带新输入重新请求（重新生成） |
| `append` | 手动追加一条消息（如预设 system 提示或快捷指令） |
| `error` | 出错时的错误对象 |

## 4. 自定义请求（带额外参数）

```tsx
const { messages, input, handleInputChange, handleSubmit } = useChat({
  body: { temperature: 0.7 },            // 附加到请求 body
  onError: (e) => console.error(e),
  api: '/api/chat',                        // 自定义端点（默认就是 /api/chat）
});
```

`body` 里的内容会合并进 POST 请求体，服务端 `req.json()` 可一并读取（注意 distinguish：`messages` 由 Hook 注入，你的自定义字段单独取）。

## 5. 与 Day 27 的关系

| 维度 | Day 27 手写流 | Day 28 useChat |
| --- | --- | --- |
| 消息状态管理 | 自己维护数组 | Hook 自动维护 |
| 流式渲染 | 手动 reader + 拼接 | 自动 |
| 中断 | 手动 `abortSignal` | `stop()` 封装好 |
| 重新生成 | 自己实现 | `reload()` |
| 适用 | 理解原理 / 非 React 场景 | 生产级 React 聊天 UI |

**建议先吃透 Day 27 的底层流，再上 useChat**，否则容易把 Hook 当黑盒、出错无从排查。

## 6. 常见坑

1. **忘记 `'use client'`**：`useChat` 是客户端 Hook，组件必须标 `'use client'`（App Router）。
2. **服务端没返回 UI Message Stream**：必须用 `toUIMessageStreamResponse()`（旧版 `toDataStreamResponse`），否则 `useChat` 解析失败。
3. **messages 历史没透传给模型**：服务端要把 `messages` 传给 `streamText`，否则每轮都丢失上下文。
4. **重复 key**：map `messages` 要用 `m.id`，别用 index，流式期间顺序会变。
5. **Node 版本过低**：`@ai-sdk/react` 同样需 Node 18+。
6. **误用 generateText**：聊天 UI 必须用 `streamText`，否则没有打字机效果。

## 小结

`useChat` 把「流式响应」升级为「声明式聊天状态」，自动处理消息列表、流式渲染、停止与重新生成。记住三件事：①服务端用 `streamText(...).toUIMessageStreamResponse()` 并透传 `messages`；②前端 `'use client'` + `useChat()` 直接渲染 `messages`；③切换按钮用 `status`/`stop()`。明天（Day 29 下篇）深入前端组件集成（自定义渲染、工具调用 UI、附件上传）。
