---
id: 66
title: "AI Agent 学习计划 - Day 62：项目一 - 对话界面开发"
slug: "ai-agent-day62-project1-chat-ui"
date: "2026-09-01"
tags: ["AI Agent", "实战项目", "项目一", "对话界面", "useChat", "Vercel AI SDK UI", "流式渲染", "学习计划"]
excerpt: "项目一第六步：用 Vercel AI SDK 的 useChat 把 Day 61 的流式对话 API 渲染成打字机 Chat 界面。这是用户真正「看得见、能对话」的入口，含消息渲染、输入提交、流式打字机、空态处理与组件拆分。"
readingTime: 15
---

# Day 62：项目一 - 对话界面开发

## 一、目标

Day 61 后端已经能流式返回 UI Message Stream。今天做**前端 Chat 界面**：用 `useChat` 把这股流渲染成带打字机效果的对话窗口，让用户能输入问题、看到逐字生成的回答。

> 链路收口：**前端 useChat 提交 → /api/chat 流式检索+生成（Day61）→ 前端打字机渲染**。做完今天，项目一「能问、能答、能流式」的 MVP 就完整了，Day 63 再补引用溯源。

## 二、为什么用 useChat（而不是手写 fetch + 流解析）

手写流式三大样板（fetch ReadableStream、手动解析 SSE/UI Message、维护 `messages` 状态）在 Day 27/28 踩过。`useChat`（`@ai-sdk/react`）一键包办：

- 自动维护 `messages` 状态 + 打字机增量渲染
- `handleSubmit` / `input` / `handleInputChange` 开箱即用
- `status` 暴露 `submitted / streaming / ready / error` 四态，方便做加载/错误/重试
- `stop()` 支持中断生成（呼应 Day 27 的 `abortSignal`）
- 与后端 `toUIMessageStreamResponse()` 协议天然对齐

> 学习资料（国内可访问镜像）：Vercel AI SDK UI 中文文档 https://ai-sdk.com.cn/docs/ai-sdk-ui/using-chat

## 三、最小可用：Chat 页面

```tsx
// app/page.tsx
'use client' // 必须：useChat 是客户端 Hook
import { useChat } from '@ai-sdk/react'

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat()

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            <strong>{m.role === 'user' ? '你' : '助手'}：</strong>
            {m.parts.map((p, i) =>
              p.type === 'text' ? <span key={i}>{p.text}</span> : null,
            )}
          </div>
        ))}
        {status === 'submitted' && <div className="hint">思考中…</div>}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="问问知识库…"
        />
        <button type="submit" disabled={status === 'streaming'}>
          发送
        </button>
      </form>
    </div>
  )
}
```

## 四、结构化渲染：message.parts 而非 content

新版 SDK 消息正文在 `message.parts`（Day 29 强调过），不要用旧的 `message.content`：

```tsx
// ChatMessage.tsx
{message.parts.map((part, i) => {
  if (part.type === 'text') return <span key={i}>{part.text}</span>
  // 后续接入工具调用时还能渲染 tool-invocation
  if (part.type === 'tool-invocation') return <ToolCard key={i} call={part.toolInvocation} />
  return null
})}
```

- `parts` 是有序数组，文本和工具调用混排时能按出现顺序渲染（为 Day 71+ 多 Agent 工具态铺路）。
- 用 `message.id` 作 key，别用 `index`（重渲染会错位）。

## 五、组件拆分与目录组织

把页面拆小，便于 Day 63 加引用卡片、Day 64 加历史：

```
app/
  page.tsx            # 渲染 <Chat/>
  api/chat/route.ts   # Day 61 的流式 API
components/
  Chat.tsx            # 组合 ChatWindow + ChatInput
  ChatWindow.tsx      # messages 列表 + 滚动到底
  ChatMessage.tsx     # 单条消息（parts 渲染）
  ChatInput.tsx       # input + 提交 + 发送中禁用
```

`Chat.tsx` 持有 `useChat`，向下传 `messages / input / handleSubmit` 等 props，子组件只管展示，逻辑集中、易测试。

## 六、空态 / 加载 / 错误 / 重试

```tsx
const { messages, status, error, reload } = useChat()

if (messages.length === 0)
  return <Empty title="试试问：如何重置密码？" />

if (status === 'streaming') showTypingCursor()   // 打字机光标
if (status === 'error')                           // 出错给重试
  return <button onClick={() => reload()}>回答中断，点击重试</button>

if (status === 'submitted') showSpinner()         // 已提交、等待首字
```

- `status` 四态：`submitted`（已发、等首字）→ `streaming`（流式输出中）→ `ready`（完成）→ `error`（失败）。
- `reload()` 用同样的输入重新请求，适合「网络抖动 / 回答被截断」时一键重试。
- 打字机光标：在最后一条 `assistant` 消息尾部加一个 CSS 闪烁 `▍`，视觉上就是逐字输出。

## 七、常见坑

- **漏 `'use client'`**：`useChat` 是客户端 Hook，页面文件顶部必须加，否则报错。
- **`message.content` 而非 `parts`**：新版 SDK 用 `parts`，读 `content` 拿不到文本或类型不对。
- **`key={index}`**：消息重排会错位，必须用 `message.id`。
- **没处理 `status` 四态**：不显示加载/错误，用户以为卡死；用 `reload` 兜底重试。
- **输入框在 `streaming` 不禁用**：流式中断与输入交叉会乱序，发送中禁用提交。
- **官方站不可访问**：UI 文档统一用国内镜像 `ai-sdk.com.cn/docs/ai-sdk-ui`，别硬连 `sdk.vercel.ai`。
- **API 路由未返回 UI Message Stream**：若后端没用 `toUIMessageStreamResponse()`，`useChat` 解析不了，表现为一直 `submitted` 转圈（与 Day 61 配对）。

## 八、今日实践任务

1. 实现 `app/page.tsx` 用 `useChat` 渲染对话，区分 user/assistant 气泡。
2. 拆出 `ChatWindow / ChatMessage / ChatInput` 三个组件，目录如第五节。
3. 用 `message.parts` 渲染文本，加打字机光标；根据 `status` 显示「思考中 / 流式 / 错误重试」。
4. 跑起来：连 Day 61 的 `/api/chat`，输入问题，确认逐字吐字、可中断、出错能 `reload`。

> 明日（Day 63）在 `ChatMessage` 里加 SourceCard，把 Day 59 存进 metadata 的 `source` 展示成「引用溯源」，让回答可查证。
