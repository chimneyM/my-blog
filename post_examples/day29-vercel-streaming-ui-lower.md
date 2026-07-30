---
id: "33"
title: "Vercel AI SDK - Streaming UI（下）：前端组件集成"
slug: "ai-agent-day29-vercel-streaming-ui-lower"
date: "2026-07-30"
tags: ["AI Agent", "Vercel AI SDK", "前端组件", "useChat", "消息渲染"]
excerpt: "深入 useChat 的前端集成：用 message.parts 自定义渲染文本/工具调用/附件、消息角色与样式、加载与错误处理、打字机光标、附件上传与多模态、以及在 Next.js 中的目录组织。"
readingTime: 12
---

## 回顾与今天的目标

Day 28 我们跑通了 `useChat` 的最小聊天页。但真实产品远不止「渲染纯文本」：要自定义每条消息的样式、展示工具调用过程、上传文件（图片/文档）、处理加载与错误。今天聚焦**前端组件集成**。

## 1. message 的数据结构：用 parts 而非直接读 content

`useChat` 返回的 `messages` 中，每条 `UIMessage` 现在推荐用 `parts` 数组渲染（比 `content` 字符串更结构化，能区分文本、工具调用、文件等）：

```tsx
{messages.map((message) => (
  <div key={message.id} className={message.role === 'user' ? 'user' : 'assistant'}>
    {message.parts.map((part, i) => {
      if (part.type === 'text') return <span key={i}>{part.text}</span>;
      if (part.type === 'tool-invocation')
        return <ToolCard key={i} call={part.toolInvocation} />;
      return null;
    })}
  </div>
))}
```

`parts` 的好处：流式期间文本会持续更新，而工具调用（Day 30/31 才讲定义，今天先了解渲染形态）以独立 part 存在，UI 可单独展示「正在调用天气工具…」这类中间态。

## 2. 自定义消息组件与样式

把每条消息抽成独立组件，便于复用与做思考气泡：

```tsx
function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`msg ${isUser ? 'msg-user' : 'msg-ai'}`}>
      <Avatar role={message.role} />
      <div className="bubble">
        {message.parts.map(/* 按 part.type 渲染 */)}
      </div>
    </div>
  );
}
```

要点：
- 用 `role` 区分左右对齐与配色（user 靠右、assistant 靠左）
- AI 消息可加打字机光标：当 `status === 'streaming'` 且是最后一条 assistant 消息时，在文本末尾加闪烁 `▍`

## 3. 加载、错误与空态

```tsx
const { messages, status, error, reload } = useChat();

if (status === 'submitted') return <Spinner />;   // 已发送、等待首字
if (error) return <ErrorBox onRetry={reload} />;    // 出错可 reload 重试
if (messages.length === 0) return <EmptyHint />;    // 首屏引导
```

`status` 四态：`submitted`（已提交、等首字）→ `streaming`（流式输出中）→ `ready`（完成）→ `error`。用 `reload()` 可在不新增用户输入的情况下重新请求（重新生成）。

## 4. 附件上传与多模态

`useChat` 原生支持 `experimental_attachments`：

```tsx
const { messages, input, handleInputChange, handleSubmit, experimental_attachments, setAttachments } = useChat();

// 选择文件后设置
const onFile = (e) => setAttachments(Array.from(e.target.files ?? []));

<form onSubmit={(e) => handleSubmit(e, { experimental_attachments: attachments })}>
  <input type="file" multiple onChange={onFile} />
  <input value={input} onChange={handleInputChange} />
</form>
```

服务端 `streamText` 的 `messages` 会自动带上附件（图片以 `image` part 传入），模型若为多模态（如 `gpt-4o`）即可「看图说话」。注意前端要展示已选附件缩略图，并在发送后清空 `setAttachments([])`。

## 5. 在 Next.js 中的目录组织

```
app/
  api/chat/route.ts        # 服务端流（'use server' 不需要，route 默认服务端）
  chat/page.tsx            # 'use client' 聊天页，调用 useChat
components/
  ChatMessage.tsx          # 单条消息组件
  ToolCard.tsx             # 工具调用卡片（Day 30/31 用到）
  ChatInput.tsx            # 输入框 + 附件
```

把 UI 拆成 `ChatMessage` / `ChatInput` / `ToolCard`，主页面只负责组装 `useChat` 状态，可读性高、易测试。

## 6. 与 Day 28 的衔接

| 维度 | Day 28（基础） | Day 29（集成） |
| --- | --- | --- |
| 渲染 | 直接 `{m.content}` | `m.parts` 按类型自定义 |
| 消息样式 | 朴素 div | 角色对齐/气泡/头像 |
| 交互 | 仅发送/停止 | 附件上传、重新生成、错误重试 |
| 多模态 | 不支持 | 图片附件 + 多模态模型 |

**先有 Day 28 的骨架，再在 Day 29 上加肉**，避免一上来就堆样式导致逻辑混乱。

## 7. 常见坑

1. **还用 `content` 而非 `parts`**：旧版 `content` 是字符串，新版推荐 `parts` 才能渲染工具调用/附件，混用会丢信息。
2. **附件发完不清理**：`setAttachments([])` 要在 `handleSubmit` 后调用，否则下次发送会重复带旧文件。
3. **key 用 index**：`parts.map` 同样要用稳定 key（part 内部无 id 时可用 `i`，但 messages 必须用 `m.id`）。
4. **文件过大未限制**：上传前校验类型/大小，否则请求体爆炸、模型拒收。
5. **多模态模型不匹配**：传图片却用纯文本模型（如 `gpt-3.5`），会报错或无视图片。
6. **忘记 `'use client'`**：含 `useChat` 的组件必须客户端组件。

## 小结

Day 29 把 `useChat` 从「能跑」提升到「像产品」：用 `message.parts` 按类型自定义渲染、`status`/`error`/`reload` 做完整交互态、附件上传打通多模态。记住：①用 `parts` 不用 `content`；②附件发完清空、校验大小；③组件拆分（ChatMessage/ChatInput/ToolCard）。Day 30 起进入 Tool Calling，前面的 `tool-invocation` part 就会真正派上用场。
