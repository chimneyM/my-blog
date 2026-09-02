---
id: 67
title: "AI Agent 学习计划 - Day 63：项目一 - 引用溯源功能"
slug: "ai-agent-day63-project1-source-citations"
date: "2026-09-02"
tags: ["AI Agent", "实战项目", "项目一", "引用溯源", "SourceCard", "Vercel AI SDK", "RAG", "学习计划"]
excerpt: "项目一第七步：在 Day 62 的 Chat 界面里加引用溯源。把 Day 59 写进 metadata 的 source 展示成可点开的 SourceCard，让每个回答都能查证「这句话来自哪份文档的哪一段」，解决 RAG 回答不可信、无法溯源的痛点。"
readingTime: 15
---

# Day 63：项目一 - 引用溯源功能

## 一、目标

Day 62 让用户能流式对话了，但回答是「裸」的——他不知道答案出自哪份文档。今天加 **引用溯源（Citation / Source Card）**：每个回答下方列出它依据的文档片段（来源文件 + 原文摘录），可点开查看。

> RAG 的核心价值之一是「可溯源、可查证」。没有引用的知识库问答 = 黑盒，用户不敢信。今天把 Day 59 存进 `metadata.source / text` 的价值真正用起来。

## 二、后端：检索时顺带返回 sources

先让 `retrieve` 同时回传「拼进 Prompt 的 context」和「结构化来源列表」：

```ts
// lib/retrieve.ts
export async function retrieve(question: string, topK = 4) {
  // ... 同 Day 60/61，query 召回 matches
  const chunks = res.matches
    .filter((m) => m.metadata?.text)
    .map((m, i) => ({
      text: m.metadata!.text as string,
      source: (m.metadata!.source as string) || '未知来源',
    }))

  const context = chunks.map((c) => c.text).join('\n\n---\n\n')
  const sources = chunks.map((c, i) => ({ id: i + 1, source: c.source, snippet: c.text.slice(0, 200) }))
  return { context, sources }
}
```

## 三、把 sources 随流发回前端

Vercel AI SDK v5 用 `createUIMessageStream` 合并文本流 + 自定义 `data-sources` 数据部件：

```ts
// app/api/chat/route.ts
import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { retrieve } from '@/lib/retrieve'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const { context, sources } = lastUser ? await retrieve(lastUser.content) : { context: '', sources: [] }

  const system = [
    '你是基于私有知识库作答的助手，只使用【参考资料】回答，不要编造。',
    '若资料无相关内容，明确说「根据现有资料无法回答」。',
    '',
    '【参考资料】',
    context || '（无相关参考资料）',
  ].join('\n')

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system,
    messages: convertToModelMessages(messages),
  })

  // 自定义 UI 消息流：先写 sources 数据部件，再合并文本流
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: 'data-sources', data: sources }) // 前端可据此渲染 SourceCard
      writer.merge(result.toUIMessageStream())
    },
  })
  return createUIMessageStreamResponse({ stream })
}
```

> 学习资料（国内可访问镜像）：Vercel AI SDK UI 中文文档 https://ai-sdk.com.cn/docs/ai-sdk-ui ；Vercel AI Chatbot 参考实现 https://github.com/vercel/ai-chatbot

## 四、前端：渲染 SourceCard

在 `ChatMessage` 里读取 `data-sources` 部件并渲染成卡片列表：

```tsx
// components/SourceCard.tsx
export function SourceCard({ sources }: { sources: { id: number; source: string; snippet: string }[] }) {
  if (!sources?.length) return null
  return (
    <div className="sources">
      <div className="sources-title">📚 引用来源（{sources.length}）</div>
      {sources.map((s) => (
        <details key={s.id} className="source-item">
          <summary>{s.id}. {s.source}</summary>
          <p>{s.snippet}…</p>
        </details>
      ))}
    </div>
  )
}
```

```tsx
// ChatMessage.tsx 中
const sourcePart = message.parts.find((p) => p.type === 'data-sources')
return (
  <div className={`msg ${message.role}`}>
    {message.parts.map((p, i) =>
      p.type === 'text' ? <span key={i}>{p.text}</span> : null,
    )}
    {/* 来源卡片挂在消息底部 */}
    {sourcePart && 'data' in sourcePart && <SourceCard sources={sourcePart.data as any} />}
  </div>
)
```

## 五、让引用更「扎眼」（进阶）

- **行内引用角标**：让 LLM 在答案里用 `[1][2]` 标注引用编号，前端把编号映射回 `sources` 数组，做成可点击上标（Vercel AI Chatbot 的做法）。
- **去重**：同一来源被多个 chunk 命中时，按 `source` 去重合并，避免卡片重复。
- **可点击跳转**：若来源是网页/文档定位，可把 `source` 换成带锚点的链接。

## 六、常见坑

- **只存 text 不存 source**：Day 59 入库时 `metadata` 漏了 `source`，今天 `sources` 全是「未知来源」——入库阶段就该把文件名写进 metadata。
- **sources 不随流返回**：检索到了却不 `writer.write({type:'data-sources'})`，前端读不到，引用功能「假死」。
- **`data-sources` 标记 transient**：v5 里数据部件默认会被保留；若误设 `transient:true` 则在流结束后消失，刷新就没了——需要持久展示就别设 transient。
- **前端用 `content` 读 sources**：sources 是自定义 `data-*` 部件，在 `message.parts` 里、不在 `content`，遍历 parts 按 `type` 过滤。
- **引用编号和来源对不上**：行内 `[1]` 若让模型自由编号，与 `sources` 数组下标错位，需约定「按检索返回顺序编号」。
- **官方站不可访问**：资料统一用国内镜像 `ai-sdk.com.cn` 与 `github.com/vercel/ai-chatbot`，别硬连 `sdk.vercel.ai`。

## 七、今日实践任务

1. 改造 `retrieve` 同时返回 `sources`（含 source 文件名 + 摘录），确认 Day 59 入库时 `metadata.source` 已写入。
2. 在 `route.ts` 用 `createUIMessageStream` 把 `sources` 作 `data-sources` 部件随流返回。
3. 写 `SourceCard` 组件，在 `ChatMessage` 底部渲染引用列表（用 `<details>` 折叠摘录）。
4. 跑通：问一个问题，回答下方出现「📚 引用来源 N」，点开能看到对应文档片段。

> 明日（Day 64）做多轮对话上下文管理：让系统记住历史、控制上下文窗口，避免长对话爆 token。
