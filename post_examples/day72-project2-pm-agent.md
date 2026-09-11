---
id: 76
title: "AI Agent 学习计划 - Day 72：项目二 - PM Agent 实现"
slug: "ai-agent-day72-project2-pm-agent"
date: "2026-09-11"
tags: ["AI Agent", "实战项目", "项目二", "PM Agent", "Vercel AI SDK", "generateObject", "Zod", "结构化输出", "学习计划"]
excerpt: "项目二第二步：实现 PM Agent——把一句话需求拆成带验收标准的结构化任务列表。用 Vercel AI SDK 的 generateObject + Zod schema 拿到机器可消费的 JSON，让下游 Coder/Reviewer/Tester 直接读结构而非自由文本，避免多 Agent 协作中的「语义漂移」。"
readingTime: 14
---

# Day 72：项目二 - PM Agent 实现

## 一、目标

项目二（Day 71 启动）的 Supervisor 编排循环第一步是 **PM Agent**：把用户的一句话需求，拆解成**带验收标准的结构化任务列表**，交给下游 Coder/Reviewer/Tester。

> 多 Agent 协作最容易翻车的点：Agent 之间用「自然语言」传话，越传越歪。解法是用**结构化输出**当「契约」，下游只认结构不认散文。

## 二、为什么用结构化输出

- 自由文本任务（如「请实现登录功能」）下游 Agent 难以精确消费，容易漏验收点。
- 用 Zod schema 约束输出为 JSON，PM 产出的每个 task 都含 `title / description / acceptanceCriteria / dependencies / complexity`，下游角色直接读取字段。
- Vercel AI SDK 提供 `generateObject({ schema })` 直接返回类型安全的对象（呼应 Day 26 的 `generateText`、Day 31 的 Zod 校验）。

## 三、核心实现

```ts
// src/agents/pm.ts
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const TaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  acceptanceCriteria: z.array(z.string()),
  dependencies: z.array(z.string()).default([]),
  complexity: z.enum(['S', 'M', 'L']),
})

const PlanSchema = z.object({
  tasks: z.array(TaskSchema),
})

export async function planWithPM(requirement: string) {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: PlanSchema,
    system: '你是资深技术 PM。把需求拆成可独立开发、可验证的任务。',
    prompt: requirement,
  })
  return object.tasks // 结构化任务列表，下游直接消费
}
```

## 四、PM Prompt 设计要点

- **角色锁定**：明确「你是 PM，不写代码，只做拆分与验收定义」。
- **验收标准驱动**：每个 task 必须给出 `acceptanceCriteria`，否则 Reviewer/Tester 无法判断完成（呼应 Day 74/75）。
- **依赖关系**：`dependencies` 让 Supervisor 能排出执行顺序（拓扑排序），避免 Coder 在依赖未就绪时动手。
- **复杂度标注**：`complexity` 帮助 Supervisor 决定是否需要拆得更细或并行。

## 五、与项目一的区别

项目一没有「规划」环节，输入就是固定的知识库问答。项目二的 PM Agent 是**动态规划**：同一句需求每次可能拆出不同任务，这正是 Agent 自主性的体现（呼应 Day 13 的 Planning / ReAct）。

## 六、今日实践任务

1. 实现 `planWithPM`，用 `generateObject` + `PlanSchema` 产出任务列表。
2. 给 3 句不同需求（如「做个待办应用」「加用户登录」「导出 CSV」）各跑一次，检查任务是否带验收标准与依赖。
3. 把返回结构打印成清晰的计划树，作为 Supervisor 的输入。

> **明日（Day 73）Coder Agent 实现**：让 Coder 读取 PM 产出的单个 task，结合 MCP/工具写出代码（呼应 Day 73 `tool()` 与 Day 12/30 的 Function Calling）。

## 七、参考

- Vercel AI SDK generateText / generateObject 文档：https://sdk.vercel.ai/docs（中文镜像：https://ai-sdk.com.cn/docs）
- Vercel AI SDK Tools（tool 与 Zod 校验）：https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling
- Zod 文档：https://zod.dev/
