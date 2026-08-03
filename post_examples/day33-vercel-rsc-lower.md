---
id: "37"
title: "Vercel AI SDK - RSC Integration（下）：流式 RSC 渲染"
slug: "ai-agent-day33-vercel-rsc-lower"
date: "2026-08-03"
tags: ["AI Agent", "Vercel AI SDK", "RSC", "流式渲染", "streamUI", "React"]
excerpt: "深入流式 RSC 渲染：用 streamUI 实现「边生成边渲染组件」、工具生成组件的分阶段 yield、与 createStreamableUI 的组合、客户端 useUIState/useActionsState 管理交互状态，跑通一个流式 AI 卡片生成器。"
readingTime: 11
---

## 回顾与今天的目标

Day 32 我们认识了 RSC 集成：`createStreamableUI` 把 AI 结果当作 React 节点流式返回，`streamUI` 让工具直接「生成组件」。今天把**流式**做透——真正体验「模型边想、UI 边长」的丝滑。

阶段二（Day 15-35）今天收官（明天 Day 34 是阶段二总结），所以今天也是 Vercel AI SDK 模块的最后一块拼图。

## 1. `streamUI` 的流式本质：分阶段 yield 组件

`streamUI` 的工具 `generate` 可以是**异步生成器**（`async function*`），用 `yield` 逐步吐出中间组件，最后 `return` 最终组件。模型调用该工具时，客户端会**依次收到这些组件**，实现边查边渲染：

```tsx
tools: {
  showStock: {
    description: '展示股票卡片',
    parameters: z.object({ symbol: z.string() }),
    generate: async function* ({ symbol }) {
      yield <div>正在查询 {symbol}…</div>;          // 第一阶段：加载态
      const quote = await fetchQuote(symbol);
      yield <div>拿到报价，绘制中…</div>;            // 第二阶段：处理态
      return <StockCard data={quote} />;            // 最终：完整卡片
    },
  },
},
```

- 每个 `yield` 都会推到客户端替换当前 UI；
- `return` 的是「终结态」组件；
- 这就是 RSC 流式相比 `useChat` 文本流的最大优势：**组件级渐进渲染**，而非纯文本累积。

## 2. 组合：`createStreamableUI` + `streamUI`

实践中常把两者结合：外层用 `createStreamableUI` 管整体容器，内层 `streamUI` 管动态组件：

```tsx
export async function generateUI(input: string) {
  const ui = createStreamableUI(<Spinner />);
  (async () => {
    const result = await streamUI({
      model: openai('gpt-4o-mini'),
      prompt: input,
      text: ({ content }) => <p>{content}</p>,
      tools: { /* ...showWeather/showStock... */ },
    });
    ui.update(result.value); // 把 streamUI 产出的组件挂进外层容器
    ui.done();
  })();
  return ui.value;
}
```

- 外层 `createStreamableUI` 负责「骨架 + 占位」；
- 内层 `streamUI` 负责「模型决策 + 组件生成」；
- 客户端只消费一个 `ui.value`，结构清晰。

## 3. 客户端状态管理：`useUIState` / `useActionsState`

RSC 模式下，AI 生成的 UI 历史需要管理。`ai/rsc` 提供 `createAI` 上下文 + hooks：

```tsx
// app/ai.tsx（服务端+客户端共享上下文）
'use client';
import { createAI } from 'ai/rsc';
export const AI = createAI({
  actions: { generateUI },          // 暴露给客户端的 Action
  initialAIState: [],
  initialUIState: [],
});

// 客户端组件
'use client';
import { useUIState, useActions } from 'ai/rsc';
import { AI } from './ai';

function Chat() {
  const [messages, setMessages] = useUIState<typeof AI>();
  const [generateUI] = useActions<typeof AI>();
  // messages 就是历史生成的 UI 节点数组，可直接渲染
  return (
    <AI>
      <div>{messages.map((m, i) => <div key={i}>{m}</div>)}</div>
      <button onClick={async () => {
        const ui = await generateUI('上海天气');
        setMessages([...messages, ui]);
      }}>问</button>
    </AI>
  );
}
```

- `useUIState`：AI 生成的 UI 历史（每个元素是一个 React 节点）；
- `useActions`：调用服务端 Action；
- `createAI`：把两者与初始状态包成 Context，包裹在 `<AI>` 里即可用。

## 4. 完整流式 AI 卡片生成器

把上面拼起来：用户输入 → 服务端 `generateUI` 用 `streamUI` 调工具生成卡片 → 客户端 `useUIState` 累积显示。模型可依据问题自主选择返回「天气卡 / 股票卡 / 纯文本」，全程流式。

## 5. RSC 流式 vs 传统流式选型再回顾

| 场景 | 推荐 |
|------|------|
| 聊天机器人（文本为主） | `useChat` + API Route |
| AI 生成结构化 UI（卡片/表单/图表） | `streamUI` + RSC |
| 需要 UI 历史/多轮交互 | `createAI` + `useUIState` |
| 极简 demo / 纯服务端渲染 | `createStreamableUI` |

## 6. 常见坑

- **`generate` 不是 `async function*` 却 yield** → 语法报错；要流式必须 `async function*` 且用 `yield`。
- **客户端直接 `await streamUI`** → `streamUI` 在服务端跑，客户端只消费 `useUIState`/Action 返回值。
- **`createAI` 的 `actions` 暴露了不该暴露的函数** → 仅暴露安全 Action，敏感逻辑留在服务端。
- **忘记 `<AI>` 包裹** → `useUIState`/`useActions` 取不到 Context，报 null。
- **Node/Next 版本过低 / 官方站不可访问** → 同前，用镜像 `ai-sdk.com.cn`。

## 学习资料与延伸

- Vercel AI SDK RSC 文档（国内镜像）：https://ai-sdk.com.cn/docs/ai-sdk-rsc
- Vercel AI SDK 官方 RSC 文档：https://sdk.vercel.ai/docs/ai-sdk-rsc
- Next.js App Router 流式渲染：https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
- 中文实战教程（掘金）：https://juejin.cn/post/7604761524977500169

## 今日小练习

基于 Day 32 的 `createStreamableUI` demo，升级为 `streamUI`：定义一个 `showWeather` 工具（异步生成器，先 yield「查询中」再 return `<WeatherCard>`），让模型根据「用卡片展示上海天气」自动调用并返回组件，在客户端用 `useUIState` 累积历史。明天 Day 34 将做阶段二 LangChain vs Vercel AI SDK 对比总结。
