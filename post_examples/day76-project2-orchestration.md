---
id: 80
title: "AI Agent 学习计划 - Day 76：项目二 - Agent 编排整合（Supervisor 模式）"
slug: "ai-agent-day76-project2-orchestration"
date: "2026-09-15"
tags: ["AI Agent", "实战项目", "项目二", "Supervisor", "多 Agent 编排", "Vercel AI SDK", "AutoGen", "学习计划"]
excerpt: "项目二收口日：用 Supervisor 把 Day 72-75 的 PM / Coder / Reviewer / Tester 四个 Agent 串成端到端闭环——解析需求→PM 拆 task→每个 task 走 Coder→Reviewer(不通过则回修)→Tester(全绿)→汇总交付。覆盖 Supervisor 两种落地姿势（手搓 orchestrator 函数 / AutoGen GroupChat）、状态机、并发与重试护栏、事件可观测，呼应 Day 41-44 多 Agent 拓扑与 Day 7 EventEmitter。"
readingTime: 16
---

# Day 76：项目二 - Agent 编排整合（Supervisor 模式）

## 一、目标

Day 72–75 我们已经造好了四个各司其职的 Agent：**PM**（拆任务）、**Coder**（写代码）、**Reviewer**（审代码）、**Tester**（写测试跑测试）。但它们还散着。今天用 **Supervisor（主管）** 把它们编排成一个**端到端可运行的编程助手**——输入一句需求，输出「通过审查且测试全绿」的代码。

> 这正是 Day 44 讲的**层级管理模式**的工程落地：Supervisor 负责规划、分派、汇总与状态裁决，子 Agent 只管把一件事做好。

## 二、整体流水线（状态机视角）

```
需求 ──▶ [planning] ──▶ PM 拆出 tasks[]
                        │
         对每个 task 循环 ──▶ [coding]   Coder 写文件
                              │
                       [reviewing] Reviewer 审（结构化输出）
                              │
                  approved? ──否──▶ 回传 issues 给 Coder 重寫（限 N 次）
                              │是
                       [testing]  Tester 写测试并跑
                              │
                  全绿? ──否──▶ 回传失败给 Coder/Tester 修正
                              │是
         所有 task 完成 ──▶ [done] 汇总交付报告
```

每个状态就是一个明确的「谁在干活 + 退出条件」，比让一个巨型 Agent 一口气干完更可控、可观测、可重试（呼应 Day 41 顺序链、Day 42 路由、Day 43 讨论、Day 44 Supervisor）。

## 三、Supervisor 的两种落地姿势

### 姿势 A：手搓 Orchestrator 函数（推荐，最稳）

把 Day 72–75 每个 Agent 导出成 `async (input) => output` 的纯函数，Supervisor 只是一个**普通 TS 函数**按顺序/条件调用它们——不用再让 LLM 当「调度器」：

```ts
// src/orchestrator.ts
import { runPM } from './agents/pm'
import { runCoder } from './agents/coder'
import { runReviewer } from './agents/reviewer'
import { runTester } from './agents/tester'

export async function supervisor(requirement: string) {
  const tasks = await runPM(requirement)          // Day 72
  const results = []
  for (const task of tasks) {
    let code = await runCoder(task)               // Day 73
    for (let i = 0; i < 3; i++) {
      const review = await runReviewer(task, code) // Day 74
      if (review.approved) break
      code = await runCoder({ ...task, feedback: review.issues }) // 回修
    }
    const test = await runTester(task, code)       // Day 75
    results.push({ task, passed: test.green })
  }
  return results
}
```

> 优点：流程是人写的、可断点调试、成本可预测；LLM 只在子 Agent 内部做「思考」，Supervisor 只做「控制流」。这是生产里最常用、最不容易翻车的形态。

### 姿势 B：LLM 当 Supervisor（AutoGen GroupChat）

让一个 LLM Agent 自己决定「下一步谁发言」。适合探索性强、流程不固定的场景：

```ts
// 伪代码（AutoGen 风格，呼应 Day 44）
const group = new GroupChat({
  agents: [pm, coder, reviewer, tester, supervisor],
  speaker_selection_method: 'auto', // 由 supervisor 选下一个发言者
  max_round: 20,
})
await group.run('实现并测试一个 debounce 函数')
```

> 优点灵活，缺点是**成本与延迟不可控、容易跑飞**，生产环境务必加 `max_round` 兜底（呼应 Day 44 坑点）。

## 四、并发、重试与可观测护栏

| 护栏 | 做法 | 呼应 |
|------|------|------|
| 多个 task 并行 | `Promise.all` / worker_threads（Day 8）跑互相独立的 task | Day 8 子进程/线程 |
| 修正次数上限 | Reviewer/Tester 回修循环 `i < 3`，超限标 failed 人工介入 | Day 23 maxIterations |
| 事件可观测 | 用 EventEmitter（Day 7）发 `stage-changed`/`agent-done` 事件，统一打日志 | Day 7 EventEmitter |
| 成本熔断 | 累计 token / 轮数超过阈值即中止并报告 | Day 44 成本失控 |

```ts
import { EventEmitter } from 'node:events'
const bus = new EventEmitter()
bus.on('stage', ({ task, stage }) => console.log(`[${task.id}] → ${stage}`))
```

## 五、常见坑

1. **无限循环**：Reviewer 永远不通过 → 必须设回修上限并转人工（呼应 Day 44）。
2. **Supervisor 也写成巨无霸**：它只做调度，别把 PM/Coder 逻辑塞进去。
3. **上下文膨胀**：每个子 Agent 只传自己需要的片段，别把全链路历史一股脑喂进去（呼应 Day 24/52 记忆）。
4. **错误不传播**：子 Agent 抛错要被 orchestrator 捕获并记录，否则整体假成功。
5. **没有最终裁决**：必须有一个明确的 `done`/汇总步骤产出交付物，而不是各 Agent 各说各话。
6. **成本失控**：LLM 当 Supervisor 时不设 `max_round` 极易烧钱（呼应 Day 44）。
7. **官方站不可访问**：AutoGen 文档用 GitHub https://github.com/microsoft/autogen ，Vercel AI SDK 用国内镜像 https://ai-sdk.com.cn/ 。

## 六、今日实践任务

1. 把 Day 72–75 的四个 Agent 各自导出为 `async` 函数，写 `orchestrator.ts` 串起 Supervisor 流水线（姿势 A）。
2. 用一个真实小需求（如「实现并测试一个 `debounce` 函数」）跑通：看到 PM 拆 task → Coder 写 → Reviewer 审 → Tester 全绿 → 汇总。
3. 故意让 Coder 留 bug，验证 Reviewer 不通过 → 回修循环 → 最终仍收敛；确认 `i < 3` 上限生效。
4. 给 orchestrator 接上 EventEmitter 日志，输出一份 Markdown 交付报告（含每个 task 的审查结论与测试结果）。
5. 更新 README，画出自 Day 71 起的完整「项目二 Agent 拓扑 + Supervisor 编排」架构图（明日 Day 77 将接入 MCP 工具，让 Coder/Reviewer 能调用真实外部工具）。

> 学习资料（国内可访问）：AutoGen GitHub https://github.com/microsoft/autogen ；Vercel AI SDK 中文文档 https://ai-sdk.com.cn/docs ；LangChain.js Templates https://github.com/langchain-ai/langchainjs-templates
