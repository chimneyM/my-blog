---
id: "35"
title: "Vercel AI SDK - Tool Calling（下）：Zod 参数校验与多工具编排"
slug: "ai-agent-day31-vercel-tool-calling-lower"
date: "2026-08-01"
tags: ["AI Agent", "Vercel AI SDK", "Tool Calling", "Zod", "多工具", "maxSteps"]
excerpt: "在上集 tool() 基础上，深入 Zod 参数校验（类型/范围/枚举约束、校验失败自动纠错）、maxSteps 自动多轮工具循环、多工具并行编排，以及工具调用链路中的错误处理与可观测性，跑通一个带计算器+天气+搜索的多工具 Agent。"
readingTime: 12
---

## 回顾与今天的目标

Day 30 我们用 `tool()` 定义了第一个工具，并手动走了一遍「模型返回 toolCalls → 本地执行 → role:'tool' 回灌」的 Agent Loop。今天把工具调用做扎实：

1. **Zod 校验**：让工具有「强类型护城河」，参数不对模型自己改；
2. **`maxSteps` 自动循环**：告别手写 for 循环，SDK 帮你跑完多轮工具调用；
3. **多工具编排**：一个 Agent 同时挂多个工具，模型自主选；
4. **错误处理与可观测**：工具抛错如何优雅回传、如何看到完整调用轨迹。

## 1. Zod 参数校验：让工具「说不了」

Day 30 提到 `parameters` 用 zod 描述入参，它不仅生成 JSON Schema 给模型看，**执行前还会真校验**。你可以加约束，模型传错时 SDK 会把错误回传给模型，让它自我纠正：

```ts
import { z } from 'zod';

const divideTool = tool({
  description: '计算两数相除（除数不能为 0）',
  parameters: z.object({
    a: z.number().describe('被除数'),
    b: z.number().describe('除数，必须非零'),
    // 用 refine 加业务约束：除数不能为 0
  }).refine((v) => v.b >= 1e-9 || v.b <= -1e-9, {
    message: '除数 b 不能为 0',
  }),
  execute: async ({ a, b }) => ({ quotient: a / b }),
});
```

要点：
- `z.number()` / `z.string()` / `z.enum(['celsius','fahrenheit'])`：基础类型与枚举，模型传错类型直接被拦。
- `.describe()`：同时是给模型看的字段说明，也是给代码看的注释。
- `.refine()` / `.superRefine()`：跨字段业务规则（如「结束日期晚于开始日期」）。
- **校验失败回传模型**：Vercel AI SDK 在 `execute` 前跑 zod，失败会把错误作为 `tool-result` 回灌，模型看到后会换参数重试——这就是「自我纠正」的底层机制。

> 经验：约束写得太严（如正则卡死格式）会让模型反复失败；太松又失去校验意义。给 `description` 写清楚「合法示例」比纯正则更稳。

## 2. `maxSteps`：自动多轮工具循环

Day 30 我们手写 `for` 循环回灌 `tool-result`。Vercel AI SDK 提供 `maxSteps` 让它**自动**跑完「调工具→拿结果→再决策→再调」的循环：

```ts
import { generateText } from 'ai';

const { text, steps } = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: '北京现在多少度？如果高于 30 度，再告诉我东京的天气对比一下。',
  tools: { weather: weatherTool },
  // 最多自动跑 5 轮工具循环；不设这个默认只跑 1 轮（即只调一次就停）
  maxSteps: 5,
});

// steps 里能看到每一轮的 toolCalls / toolResults / text
steps.forEach((s, i) => {
  console.log(`第 ${i + 1} 轮工具调用：`, s.toolCalls);
});
```

- `maxSteps` 控制「模型可以连续调几次工具」。设 `1` 等于 Day 30 的手写单轮；设大一点才能做多步推理（先查 A 再依据 A 查 B）。
- `steps` 数组是完整轨迹，调试/审计/可观测都靠它。
- `streamText` 同样支持 `maxSteps`，前端 `useChat` 会逐步收到各轮 `tool-invocation` part。

## 3. 多工具编排：一个 Agent 挂多个工具

把多个 `tool()` 放进 `tools` 对象，模型根据问题**自主选择**调用哪个（甚至同轮并行调多个）：

```ts
const { text, toolCalls } = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: '帮算一下 (128 + 64) * 2，再查下上海天气，最后搜一下「Vercel AI SDK」最新版本。',
  tools: {
    calculator: calculatorTool, // 自定义计算
    weather: weatherTool,       // 天气
    search: searchTool,         // 搜索
  },
  maxSteps: 6,
});
```

- 模型会判断「这句话需要哪些工具」，无需你 if-else 分发（这正是 Agent 优于硬编排 Chain 的地方，回顾 Day 21 路由链）。
- 同一条消息里多个工具可**并行**调用（取决于模型输出与 provider 支持）；`toolCalls` 是数组，按顺序或并行执行由你控制。
- 工具间数据流转：若 B 工具依赖 A 的结果，靠 `maxSteps` 多轮自然衔接（A 跑完回灌，模型再决定调 B）。

## 4. 错误处理与可观测性

工具执行可能抛错（网络超时、API 限流、参数非法）。正确做法：

```ts
const safeTool = tool({
  description: '调用外部搜索 API',
  parameters: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    try {
      const res = await searchAPI(query);
      return { results: res };
    } catch (err) {
      // 不要 throw 到顶层崩链；返回结构化错误，模型能据此重试/换策略
      return { error: `搜索失败：${err.message}` };
    }
  },
});
```

- **返回错误而非抛异常**：让模型看到 `error` 字段并自我纠正（换个 query、或改用其他工具）。
- **`steps` 轨迹**：线上排查靠 `steps` 看哪一轮、哪个工具出错。
- **`onStepFinish` 回调**：每轮结束打日志/埋点：

```ts
await streamText({
  model: openai('gpt-4o-mini'),
  prompt,
  tools: { weather, calculator },
  maxSteps: 5,
  onStepFinish: ({ toolCalls, toolResults, text }) => {
    console.log('step done', { toolCalls, toolResults });
  },
});
```

## 5. 与 LangChain 工具对比回顾

| 维度 | Vercel AI SDK | LangChain |
|------|---------------|-----------|
| 多轮循环 | `maxSteps` 一行搞定 | AgentExecutor `maxIterations` |
| 参数校验 | zod 原生 | zod + `@tool` |
| 多工具 | `tools` 对象 | 工具数组绑 Agent |
| 轨迹可观测 | `steps` 数组 | `returnIntermediateSteps` |
| 流式工具态 | `tool-invocation` part | verbose/中间件 |

## 6. 常见坑

- **漏设 `maxSteps`** → 模型只调一次工具就停，多步任务做不完（默认 1 轮）。
- **`maxSteps` 过大** → 可能陷入反复调工具的死循环，烧 token；配合 `stopWhen`/步数上限克制使用。
- **校验失败直接 throw** → 整个调用崩；应返回结构化错误给模型。
- **工具名冲突/描述雷同** → 模型选错工具；名称与描述要有区分度。
- **并行工具共享可变状态** → 竞态；工具尽量无副作用或加锁。
- **Node 版本过低 / 官方站不可访问** → 同前，用镜像 `ai-sdk.com.cn`。

## 学习资料与延伸

- Vercel AI SDK 工具与工具调用（国内镜像）：https://ai-sdk.com.cn/docs/ai-sdk-core/tools-and-tool-calling
- Vercel AI SDK 官方 Tools 文档：https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling
- 完整深入教程（腾讯云）：https://cloud.tencent.com/developer/article/2630363
- 中文实战教程（掘金）：https://juejin.cn/post/7604761524977500169

## 今日小练习

定义一个 `calculator`（支持四则运算）、`weather`（查天气）、`search`（模拟搜索）三个工具，挂到 `generateText` 并设 `maxSteps: 6`，问模型一个需要「先算再查再搜」的复合问题，打印 `steps` 观察模型如何选择与串联三个工具。
