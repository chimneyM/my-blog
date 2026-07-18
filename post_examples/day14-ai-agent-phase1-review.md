---
id: "16"
title: "AI Agent 学习计划 Day 14：阶段一总结与复习 — TypeScript + Node.js + AI Agent 基础"
slug: "ai-agent-day14-phase1-review"
date: "2026-07-15"
tags: ["AI Agent", "复习", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第十四天，阶段一收官复习。用一张「知识地图」串联 Day 1-13 全部要点：TypeScript 类型/装饰器/异步/工程化、Node.js Stream/EventLoop/EventEmitter/子进程/HTTP、AI Agent 概念与 Memory/Planning，并给出一个贯穿全阶段的最小 Agent CLI 综合练习。"
readingTime: 30
---

# AI Agent 学习计划 Day 14：阶段一总结与复习

> 📅 日期：2026-07-15  
> 🎯 阶段一：基础入门（Day 1-14）收官  
> 📊 学习进度：Day 14 / 84（16.7%）

## 前言

今天是我们 84 天学习计划的第一个里程碑——**阶段一（基础入门）收官**。过去 13 天，我们从 TypeScript 类型系统一路打到了 AI Agent 的 Memory 与 Planning。内容很多，今天用一张「知识地图」把它们串起来，并动手写一个**贯穿全阶段的最小 Agent CLI**，把所有知识点用一次。

---

## 一、阶段一知识地图

### 1.1 TypeScript 基础（Day 1-4）

| 天数 | 主题 | 在 Agent 中的作用 |
|------|------|-----------------|
| Day 1 | 类型系统与类型推断 | 工具参数、消息结构的类型安全 |
| Day 2 | 装饰器 | 依赖注入、Agent 能力装配 |
| Day 3 | async/await 与 Promise | Agent 每一步都是异步（调 LLM、跑工具） |
| Day 4 | 模块系统与工程化 | 项目骨架、路径别名、环境变量 |

### 1.2 Node.js 基础（Day 5-9）

| 天数 | 主题 | 在 Agent 中的作用 |
|------|------|-----------------|
| Day 5 | Stream 与 Buffer | LLM 流式响应 |
| Day 6 | Event Loop | 并发工具调用调度 |
| Day 7 | EventEmitter | 事件驱动的多 Agent 协作 |
| Day 8 | 子进程与 Worker Threads | 并行多 Agent、代码沙箱 |
| Day 9 | HTTP/HTTPS | Agent 与 LLM/工具 API 通信 |

### 1.3 AI Agent 概念（Day 10-13）

| 天数 | 主题 | 核心要点 |
|------|------|---------|
| Day 10 | Agent 定义与 LLM | Agent = 感知+大脑+行动+记忆 |
| Day 11 | Prompt Engineering | 与 LLM 高效沟通的技艺 |
| Day 12 | Function Calling | LLM 原生工具调用 |
| Day 13 | Memory 与 Planning | 经验 + 章法，让 Agent 能成事 |

### 1.4 一张图看懂全局

```text
构建 AI Agent 的能力栈
┌──────────────────────────────────────────────┐
│  应用层：Agent / 多 Agent / RAG              │
├──────────────────────────────────────────────┤
│  框架层（阶段二）：LangChain.js / Vercel AI  │
├──────────────────────────────────────────────┤
│  概念层：Agent / Memory / Planning / Tools   │
├──────────────────────────────────────────────┤
│  运行时层：Node.js（Stream/EventLoop/HTTP）  │
├──────────────────────────────────────────────┤
│  语言层：TypeScript（类型/异步/工程化）       │
└──────────────────────────────────────────────┘
```

---

## 二、最小 Agent CLI 综合练习

把前面所学串起来：一个支持 **ReAct + Function Calling + EventEmitter + Stream 流式** 的最小 Agent。

```typescript
// mini-agent-cli.ts
import { EventEmitter } from 'node:events'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const bus = new EventEmitter() // Day 7：事件总线

// 工具（Day 12：Function Calling）
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'calculator',
      description: '计算数学表达式',
      parameters: {
        type: 'object',
        properties: { expr: { type: 'string' } },
        required: ['expr'],
      },
    },
  },
]

bus.on('tool', (name: string) => console.log(`🔧 调用工具: ${name}`))

async function runAgent(goal: string) {
  const messages: any[] = [
    { role: 'system', content: '你是 ReAct Agent，按需调用工具后给出最终答案。' },
    { role: 'user', content: goal },
  ]

  for (let step = 0; step < 10; step++) {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      stream: true, // Day 5：流式输出
    })

    let content = ''
    for await (const chunk of res) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      content += delta
      process.stdout.write(delta) // 流式打印
    }

    // 简化演示：若 LLM 请求调用工具，则执行（真实场景需解析 tool_calls）
    if (content.includes('calculator')) {
      bus.emit('tool', 'calculator')
      messages.push({ role: 'assistant', content })
      messages.push({ role: 'tool', content: '计算结果: 42', tool_call_id: 'call_1' })
      continue
    }
    return content
  }
}

runAgent('帮我算一下 (123 + 456) * 2 等于多少？').then(() => process.exit(0))
```

这个几十行的例子，把阶段一的关键点都用上了：

- **TypeScript**：类型标注与接口（`tools` 的 `type: 'function' as const`）。
- **EventEmitter（Day 7）**：用事件总线解耦「工具调用」与「日志输出」。
- **Stream（Day 5）**：`stream: true` 实时打印 LLM 输出。
- **HTTP（Day 9）**：OpenAI SDK 底层就是 HTTPS 请求。
- **async/await（Day 3）**：Agent 循环每一步都是异步。
- **Function Calling（Day 12）**：工具定义与调用。
- **ReAct / Planning（Day 13）**：循环推理—行动—观察。

---

## 三、阶段一自检清单

- [ ] 能用 TypeScript 泛型与装饰器组织 Agent 代码
- [ ] 理解 Event Loop，能解释「并发工具调用」如何调度
- [ ] 能用 Stream 实现 LLM 流式输出
- [ ] 能解释 Agent = LLM + 工具 + 记忆 + 规划
- [ ] 能徒手写一个最小 ReAct 循环

如果以上都能打勾，恭喜你，阶段一过关！

---

## 四、学习资料

| 资源 | 链接 | 说明 |
|------|------|------|
| TypeScript 中文网 在线演练场 | https://ts.nodejs.cn/play/ | 在线练手 |
| 48 道 TypeScript 练习题（掘金） | https://juejin.cn/post/7062903623470514207 | 巩固 TS |
| learn-typescript 中文教程（GitHub） | https://github.com/mqyqingfeng/learn-typescript | 系统教程 |
| Node.js 中文网 | http://nodejs.cn/api/ | 中文 API 文档 |

---

## 五、明日预告

**Day 15：框架选型对比 — LangChain.js / Vercel AI SDK / AutoGen / CrewAI**

阶段二正式开始！我们要在动手前先「选兵器」：四大主流 Agent 框架分别适合什么场景？本计划为什么先用 LangChain.js、再用 Vercel AI SDK？明天给你一张清晰的选型地图。

> 🎉 阶段一完成！14 天里你从 TypeScript 一路打到了 AI Agent 概念。接下来 21 天（Day 15-35），我们将在真实框架里把 Agent 造出来。
