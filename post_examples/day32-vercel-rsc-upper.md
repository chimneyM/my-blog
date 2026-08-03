---
id: "36"
title: "Vercel AI SDK - RSC Integration（上）：React Server Components 集成"
slug: "ai-agent-day32-vercel-rsc-upper"
date: "2026-08-02"
tags: ["AI Agent", "Vercel AI SDK", "RSC", "React Server Components", "streamUI"]
excerpt: "进入 Vercel AI SDK 的 RSC 集成：在 React Server Components 里直接调用 generateText/streamText，用 createStreamableUI 与 streamUI 把 AI 生成内容作为组件流式渲染，理解「服务端组件即 Agent 运行环境」的范式。"
readingTime: 11
---

## 回顾与今天的目标

Day 26-31 我们走完了 Vercel AI SDK 的「核心生成 + 流式 UI + 工具调用」。前端的 `useChat` 走的是「客户端组件 + 独立 API Route 转发流」模式。

今天进入 **RSC（React Server Components）集成**：在**服务端组件**里直接跑模型，把 AI 输出当成 React 组件渲染。这是 Vercel AI SDK 区别于其他框架的一大特色——AI 生成的不只是文本，可以是**组件树**。

## 1. 为什么用 RSC 跑 AI

传统 `useChat` 模式：
- 前端发请求 → API Route 跑模型 → 流回前端 → 前端组件渲染。
- 问题是：AI 生成的内容「只是字符串/parts」，要渲染成富组件还得前端自己 map。

RSC 模式：
- 服务端组件直接 `await generateText(...)`，把结果作为 **React 节点**返回。
- 更妙的是 `streamUI`：模型可以**返回组件**（如「查天气」→ 直接返回一个 `<WeatherCard>`），服务端流式推到客户端，客户端无缝挂载。
- 适合「AI 生成结构化 UI」的场景（表单、图表、卡片），而非纯聊天。

## 2. 核心 API：`createStreamableUI` 与 `streamUI`

Vercel AI SDK 的 RSC 能力在 `@ai-sdk/rsc` 包：

```tsx
// app/actions.tsx（服务端 Action）
import { createStreamableUI } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function askAI(input: string) {
  const stream = createStreamableUI(<div>思考中…</div>);

  (async () => {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: input,
    });
    // 把生成结果作为 React 节点更新到流
    stream.update(<div>{text}</div>);
    stream.done();
  })();

  return stream.value; // 一个可挂到组件树的异步 UI
}
```

- `createStreamableUI(initial)`：创建一个「会变的 UI」，初始占位，后续 `update()` 替换内容，`done()` 收尾。
- 返回 `stream.value` 是一个 React 节点，客户端用 `<Suspense>` 包住即可边等边渲染。

## 3. `streamUI`：让模型直接「生成组件」

更高级的是 `streamUI`——配合工具调用，模型能返回**指定 React 组件**作为 tool result：

```tsx
import { streamUI } from 'ai/rsc';
import { z } from 'zod';

const result = await streamUI({
  model: openai('gpt-4o-mini'),
  prompt: '上海天气怎么样？用卡片展示',
  text: ({ content }) => <div>{content}</div>, // 纯文本 fallback
  tools: {
    showWeather: {
      description: '展示天气卡片',
      parameters: z.object({ city: z.string() }),
      // 工具返回的是一个 React 组件！
      generate: async function* ({ city }) {
        yield <div>查询 {city} 中…</div>;
        const data = await fetchWeather(city);
        return <WeatherCard data={data} />;
      },
    },
  },
});

// result.value 是直接可用的 React 节点（可能是 WeatherCard）
return result.value;
```

- `streamUI` 把「工具调用」升级为「组件生成」：模型决定调 `showWeather` → 该工具 `generate` 返回一个 `<WeatherCard>` 组件 → 服务端流式推到客户端。
- 这是「AI 生成 UI」的核心范式，比 `useChat` 的 `tool-invocation` part 更进一步——直接是组件而非中间态。

## 4. 客户端如何消费 RSC 流

```tsx
// app/page.tsx（客户端）
'use client';
import { useState } from 'react';
import { askAI } from './actions';

export default function Page() {
  const [ui, setUi] = useState<React.ReactNode>(null);
  return (
    <div>
      <button onClick={async () => setUi(await askAI('你好'))}>问 AI</button>
      <Suspense fallback={<p>加载…</p>}>{ui}</Suspense>
    </div>
  );
}
```

- 客户端只负责「触发 + 挂结果」，AI 逻辑全在服务端 Action，安全（API Key 不暴露）。
- 用 `<Suspense>` 包裹，流未到时显示 fallback，到了自动替换。

## 5. RSC 模式 vs useChat 模式选型

| 维度 | useChat（API Route） | RSC（streamUI/createStreamableUI） |
|------|----------------------|-------------------------------------|
| 渲染内容 | 文本/parts，前端 map | 直接是 React 组件 |
| AI 位置 | API Route（独立） | Server Component / Action |
| 适用 | 聊天机器人 | AI 生成结构化 UI（卡片/表单/图表） |
| Key 暴露 | 服务端 Route 持有 | 服务端 Action 持有 |
| 复杂度 | 低 | 中（需理解 RSC 流式） |

## 6. 常见坑

- **在客户端组件里 import `ai/rsc`** → RSC API 只能在服务端用；确保 `actions.tsx` 不被 `'use client'` 标记。
- **忘了 `<Suspense>`** → 流式 UI 节点无法优雅等待，直接报错或空白。
- **`streamUI` 的 `generate` 返回非组件** → 必须返回 React 节点，否则客户端挂载失败。
- **API Key 放客户端** → RSC 模式的意义就是服务端持有密钥，别在 `'use client'` 里初始化 model。
- **Node/Next 版本过低** → RSC 需要较新 Next.js（≥13.4 App Router）；官方站不可访问时用镜像。

## 学习资料与延伸

- Vercel AI SDK RSC 文档（国内镜像）：https://ai-sdk.com.cn/docs/ai-sdk-rsc
- Vercel AI SDK 官方 RSC 文档：https://sdk.vercel.ai/docs/ai-sdk-rsc
- Next.js RSC 官方文档：https://nextjs.org/docs/app/building-your-application/rendering/server-components
- 中文实战教程（掘金）：https://juejin.cn/post/7604761524977500169

## 今日小练习

用 `@ai-sdk/rsc` 的 `createStreamableUI` 做一个最简服务端 Action：接收问题 → `generateText` 生成回答 → 流式更新一个 `<div>`。在客户端页面用按钮触发并用 `<Suspense>` 渲染，体会「服务端组件即 Agent 运行环境」的范式。
