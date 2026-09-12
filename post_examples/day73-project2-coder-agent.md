---
id: 77
title: "AI Agent 学习计划 - Day 73：项目二 - Coder Agent 实现"
slug: "ai-agent-day73-project2-coder-agent"
date: "2026-09-12"
tags: ["AI Agent", "实战项目", "项目二", "Coder Agent", "Vercel AI SDK", "tool calling", "ReAct", "Zod", "学习计划"]
excerpt: "项目二第三步：实现 Coder Agent——读取 PM 产出的单个 task，通过 tool() 工具（writeFile/readFile/listFiles）真正把代码写进文件，而非只在文本里「回答代码」。用 generateText + tools + maxSteps 跑 ReAct 循环，并在落盘前做路径沙箱约束，为 Day 77 接入 MCP 工具打底。"
readingTime: 15
---

# Day 73：项目二 - Coder Agent 实现

## 一、目标

Day 72 的 PM Agent 产出结构化 task，今天实现 **Coder Agent**：读取一个 task（含验收标准），**真正把代码写进文件**，而不是只在文本里「贴出代码」。下游 Reviewer/Tester 才能直接读文件检查。

> 关键区别：Coder 的输出不是一段 markdown 代码块，而是**落盘的文件**。Agent 必须借助工具（tool calling）才能改变外部世界（呼应 Day 12/30 Function Calling）。

## 二、用工具让 Agent 「动手」

Vercel AI SDK 的 `generateText` 支持 `tools` + `maxSteps`，让模型进入 ReAct 循环：思考 → 调工具 → 观察 → 继续（呼应 Day 13 ReAct、Day 22）。

```ts
// src/agents/coder.ts
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const writeFile = {
  description: '把代码写入项目内某个文件',
  parameters: z.object({ path: z.string(), content: z.string() }),
  execute: async ({ path, content }) => {
    if (!path.startsWith('src/')) throw new Error('只允许写入 src/ 目录')
    writeFileSync(path, content)
    return { ok: true, path }
  },
}
const readFile = {
  description: '读取已有文件内容',
  parameters: z.object({ path: z.string() }),
  execute: async ({ path }) => readFileSync(path, 'utf8'),
}
const listFiles = {
  description: '列出目录下文件',
  parameters: z.object({ dir: z.string() }),
  execute: async ({ dir }) => readdirSync(dir),
}

export async function codeWithCoder(task: Task) {
  const { text, steps } = await generateText({
    model: openai('gpt-4o'),
    tools: { writeFile, readFile, listFiles },
    maxSteps: 12,
    system: '你是 Coder。依据 task 与验收标准实现代码，用工具读/写文件，不超出范围。',
    prompt: `任务：${task.title}\n描述：${task.description}\n验收：${task.acceptanceCriteria.join('\n')}`,
  })
  return { summary: text, steps } // 落盘的文件已被工具写入 src/
}
```

## 三、为什么必须「工具写文件」

- 若 Coder 只在 `text` 里返回代码，Supervisor 还得自己解析 markdown 提取、落盘，易错且脆弱。
- 让 `writeFile` 工具直接落盘，文件即产物，Reviewer/Tester 直接 `readFile` 检查，闭环清晰。
- `parameters` 用 Zod 约束（呼应 Day 31），模型不会传错参。

## 四、沙箱与约束（安全前置）

- **路径白名单**：只允许写 `src/` 等约定目录，防止模型越权改写系统文件（呼应 Day 47/67 安全）。
- 暂不开放 shell 执行（跑命令、装依赖），那属于 Day 77 的 MCP 工具，届时再放开并加更严限制。
- `maxSteps` 设上限，避免 Agent 无限循环写文件烧 token。

## 五、与项目一的联系

项目一的工具是「检索」且只读；项目二的 Coder 工具是「写文件」且会改变状态——这是 Agent 从「问答」走向「执行」的本质跃迁（呼应 Day 10 Agent 定义：能执行动作的智能体）。

## 六、今日实践任务

1. 实现 `codeWithCoder`，定义 `writeFile`/`readFile`/`listFiles` 三个工具（先本地 fs 版）。
2. 给 Day 72 PM 产出的某个 task 跑一遍，确认代码真的写进了 `src/`。
3. 加路径白名单 + `maxSteps` 上限，验证越权写入会被拒绝。
4. 打印 Coder 的 `steps`，观察 ReAct 循环（读→写→再读）过程。

> **明日（Day 74）Reviewer Agent 实现**：让 Reviewer 读取 Coder 落盘的文件，对照验收标准做代码审查、给出修改意见（呼应 Day 67 的 review 思路，但这次是另一个 Agent）。

## 七、参考

- Vercel AI SDK Tools（tool 与 Zod 校验）：https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling（中文镜像：https://ai-sdk.com.cn/docs/ai-sdk-core/tools-and-tool-calling）
- Vercel AI SDK 文档：https://sdk.vercel.ai/docs
- Node.js fs 文档：https://nodejs.org/api/fs.html
