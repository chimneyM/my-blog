---
id: "34"
title: "Vercel AI SDK - Tool Calling（上）：结构化工具定义与调用"
slug: "ai-agent-day30-vercel-tool-calling-upper"
date: "2026-07-31"
tags: ["AI Agent", "Vercel AI SDK", "Tool Calling", "tool()", "Zod", "函数调用"]
excerpt: "Agent 的真正能力来自「调用工具」。今天正式进入 Vercel AI SDK 的工具调用：用 tool() 定义结构化工具（名称/描述/入参 schema）、在 generateText/streamText 中挂载、解析 model 返回的 toolCalls 并在本地执行，跑通「模型→工具→结果→模型」的第一次工具循环。"
readingTime: 12
---

## 回顾与今天的目标

Day 26-29 我们打通了 Vercel AI SDK 的「文本生成」与「流式 UI」。但一个只会聊天的模型不是 Agent——Agent 的精髓是**能调用外部工具**（查天气、算数学、查数据库、调 API、读写文件）。

Day 12 我们用 OpenAI 原生 Function Calling 讲过工具调用范式；今天用 **Vercel AI SDK 的 `tool()` 封装**把这套范式落到更省心的代码里，并重点讲清楚**结构化工具定义**与**一次完整的工具循环**。

## 1. 为什么需要工具调用

LLM 本质是「概率文本生成器」，它本身：
- 不知道实时信息（天气、股价、最新新闻）
- 不擅长精确计算（大数乘法、日期差）
- 不能直接操作外部系统（数据库、文件系统、第三方 API）

工具调用（Tool Calling）让模型在生成文本之外，还能**输出「我要调用哪个工具 + 什么参数」的结构化指令**，由我们本地执行后把结果喂回去。这就是 Agent Loop 的核心。

## 2. `tool()` 函数：结构化定义工具

Vercel AI SDK 用 `tool()` 把「工具」抽象成一个对象，包含三要素：

```ts
import { tool } from 'ai';
import { z } from 'zod';

const weatherTool = tool({
  // ① 名称：模型靠它识别要调哪个工具（建议动宾、清晰）
  description: '获取指定城市的当前天气（温度、天气状况）',
  // ② 入参 schema：用 zod 描述参数，SDK 会自动生成 JSON Schema 给模型
  parameters: z.object({
    city: z.string().describe('城市名称，如 "上海"'),
    unit: z.enum(['celsius', 'fahrenheit']).default('celsius'),
  }),
  // ③ 执行函数：真正干活的地方（可以 async，可访问 DB/API）
  execute: async ({ city, unit }) => {
    const data = await fetchWeather(city, unit); // 你的实现
    return data; // 返回对象，SDK 会序列化给模型
  },
});
```

要点：
- **`description` 写清楚**：模型靠描述判断「何时该用这个工具」。含糊的描述（如"处理数据"）会导致该调不调、或不该调乱调。
- **`parameters` 用 zod**：`zod` 同时承担「参数校验」与「生成 JSON Schema 给模型」两件事；`describe()` 让模型理解每个字段含义。
- **`execute` 是本地代码**：工具真正的能力（网络请求、DB 查询）在这里发生，模型只决定「调不调、传什么参」。

> 如果你不想用 zod，也可直接传 `parameters: { type: 'object', properties: {...}, required: [...] }` 的原生 JSON Schema，但 zod 更顺手且自带校验。

## 3. 把工具挂到模型调用上

在 `generateText` / `streamText` 里通过 `tools` 字段挂载：

```ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text, toolCalls, toolResults } = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: '上海现在天气怎么样？适合穿短袖吗？',
  tools: { weather: weatherTool }, // 多个工具用对象挂上
});
```

- 如果模型判断**不需要工具**，则 `toolCalls` 为空，直接返回 `text`。
- 如果模型**需要工具**，则 `toolCalls` 里会有 `{ toolName: 'weather', args: { city: '上海' } }`，`text` 通常为空（模型在等工具结果）。

## 4. 模型返回 toolCalls → 本地执行 → 结果回灌

`tool()` 里写了 `execute`，Vercel AI SDK 会**自动**执行并把结果放进 `toolResults`。但更可控的做法是**手动循环**（尤其当你要在回灌前做鉴权/日志/限流时）：

```ts
import { generateText, tool } from 'ai';

// 不带 execute，只定义「契约」，执行我们自己控制
const weatherOnly = tool({
  description: '获取指定城市的当前天气',
  parameters: z.object({ city: z.string() }),
});

let response = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: '上海现在天气怎么样？',
  tools: { weather: weatherOnly },
});

// 第一次：模型返回 toolCalls，但还没结果
for (const call of response.toolCalls ?? []) {
  if (call.toolName === 'weather') {
    const result = await fetchWeather(call.args.city); // 本地执行
    response = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: '上海现在天气怎么样？',
      tools: { weather: weatherOnly },
      // 把工具调用 + 执行结果作为 messages 回灌给模型
      messages: [
        ...response.messages,
        {
          role: 'tool',
          content: [
            { type: 'tool-result', toolCallId: call.toolCallId, result },
          ],
        },
      ],
    });
  }
}
console.log(response.text); // 最终自然语言回答
```

关键：
- 工具结果以 `role: 'tool'` 的消息回灌，且必须带 `toolCallId` 与原始 `toolCalls` 对应（SDK 靠 id 配对）。
- 这一步就是 Day 12 讲的「Agent Loop」：模型决策 → 我们执行 → 结果回传 → 模型再决策，直到产出最终答案。

## 5. 流式场景下的工具调用

`streamText` 同样支持 `tools`，前端能看到「工具调用中」的中间态（回顾 Day 29 的 `tool-invocation` part）：

```ts
const result = streamText({
  model: openai('gpt-4o-mini'),
  prompt: '北京和东京谁更热？',
  tools: { weather: weatherTool }, // 带 execute 时自动执行
});

// 服务端转发 UI Message Stream，前端 useChat 的 message.parts
// 会自然出现 type: 'tool-invocation' 的 part，可展示「正在查询北京天气…」
return result.toUIMessageStreamResponse();
```

带 `execute` 的 `streamText` 会在流内部自动完成「调用→执行→回灌→续生成」，前端无需手动循环，体验最佳。

## 6. 与 LangChain tool 的对比

| 维度 | Vercel AI SDK `tool()` | LangChain `@tool` |
|------|------------------------|-------------------|
| 入参定义 | zod / JSON Schema | zod（`@tool` 装饰器） |
| 执行 | `execute` 字段 / 手动循环 | 函数体即执行 |
| 自动执行 | 带 `execute` 时自动 | AgentExecutor 统一调度 |
| 模型绑定 | `tools` 字段挂到 generate/stream | 绑到 Agent |
| 流式工具态 | `tool-invocation` part 天然可见 | 需 verbose / 中间件 |

结论：Vercel AI SDK 更轻、更贴近「手动编排 Agent Loop」；LangChain 更偏「框架帮你跑完整个 Agent」。两者工具定义理念一致（名称/描述/schema/执行）。

## 7. 常见坑

- **`description` 太含糊** → 模型该调不调或乱调；写清「何时用、解决什么」。
- **`parameters` 缺 `describe`** → 模型传参错位（如把城市名当成了国家）。
- **工具名含空格/特殊字符** → 部分模型不友好，建议 `camelCase` 或 `kebab-case`。
- **`execute` 抛错没兜底** → 整个调用链崩；务必 `try/catch` 并返回结构化错误给模型，让它自我纠正。
- **回灌漏了 `toolCallId`** → 模型无法把结果与调用配对，会报错或乱答。
- **忘记限流/鉴权** → 工具能调外部 API/花真钱，生产环境务必加权限校验与速率限制。
- **Node 版本过低** → `ai` 包需要较新 Node，部署前确认运行环境版本。
- **官方站不可访问** → 文档用国内镜像 `ai-sdk.com.cn`，下文链接已替换。

## 学习资料与延伸

- Vercel AI SDK 工具与工具调用（国内镜像）：https://ai-sdk.com.cn/docs/ai-sdk-core/tools-and-tool-calling
- Vercel AI SDK 官方 Tools 文档：https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling
- 完整深入教程（腾讯云）：https://cloud.tencent.com/developer/article/2630363
- 中文实战教程（掘金）：https://juejin.cn/post/7604761524977500169

## 今日小练习

定义一个 `calculator` 工具（支持 `expression` 字符串，用 `eval` 的安全子集或 `math.js` 计算），挂到 `generateText`，问模型「(12 + 8) * 3 等于多少」，观察 `toolCalls` 与最终 `text`，并手动走一遍「回灌 tool-result」的循环。
