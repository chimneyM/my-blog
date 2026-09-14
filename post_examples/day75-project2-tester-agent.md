---
id: 79
title: "AI Agent 学习计划 - Day 75：项目二 - Tester Agent 实现"
slug: "ai-agent-day75-project2-tester-agent"
date: "2026-09-14"
tags: ["AI Agent", "实战项目", "项目二", "Tester Agent", "自动化测试", "Vitest", "ReAct", "tool calling", "学习计划"]
excerpt: "项目二第五步：实现 Tester Agent——为 Coder 产出的代码自动编写并运行测试（Vitest）。Agent 借助 writeTestFile / runTests / readTestOutput 等工具进入 ReAct 循环：生成测试 → 运行 → 读失败 → 修测试或修被测代码 → 再跑，直到全绿。重点强调测试必须 mock 外部依赖（呼应 Day 65），并复用 PM 的验收标准设计用例。"
readingTime: 15
---

# Day 75：项目二 - Tester Agent 实现

## 一、目标

PM 派 task、Coder 写实现、Reviewer 做审查（Day 74），今天补上质量闭环的最后一环——**Tester Agent**：为 Coder 的代码**自动编写并运行测试**，用红绿循环证明「代码真的能跑、且符合验收标准」。

> 关键区别：Tester 不是「读代码猜它能跑」，而是**真正执行测试并读结果**。它既能写测试，也能在测试失败时回修被测试代码（或测试本身），形成自我修正闭环（呼应 Day 13 ReAct、Day 22/30 工具循环）。

## 二、给 Tester 装上「手脚」

Tester 需要三类工具：写测试、跑测试、看结果。

```ts
// src/agents/tester.ts
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const writeTestFile = {
  description: '把测试代码落盘为 <name>.test.ts',
  parameters: z.object({ path: z.string(), code: z.string() }),
  execute: async ({ path, code }) => {
    if (!path.endsWith('.test.ts')) throw new Error('测试文件须以 .test.ts 结尾')
    writeFileSync(resolve(SANDBOX, path), code, 'utf8')
    return `已写入 ${path}`
  },
}

const runTests = {
  description: '在 sandbox 内只运行指定的测试文件',
  parameters: z.object({ path: z.string() }),
  execute: async ({ path }) =>
    execSync(`npx vitest run ${path} --reporter=json`, {
      cwd: SANDBOX,
      timeout: 60_000,
    }).toString(),
}
```

> `runTests` 用 `vitest run`（单次、非 watch）且**只跑改动的测试文件**，避免全量回归拖慢循环；`timeout` 防止死循环测试卡死（呼应 Day 47 沙箱超时护栏）。

## 三、ReAct 循环：生成 → 运行 → 读失败 → 修正

```ts
const { text, steps } = await generateText({
  model: openai('gpt-4o'),
  tools: { writeTestFile, runTests, readFile },
  maxSteps: 8, // 允许「写测试→跑→修→再跑」多轮
  system: `你是测试工程师。基于以下验收标准写 Vitest 用例并运行：
${task.acceptanceCriteria}
规则：测试外部依赖必须 mock；失败就读 runTests 输出修正；直到全绿。`,
  prompt: `被测代码文件：${filePath}`,
})
```

模型会自己决定：先 `writeTestFile` 写用例 → 调 `runTests` 看结果 → 若 `execSync` 抛错（非零退出）则读错误、修正测试或源文件 → 再 `runTests`，直到退出码为 0。这就是 Day 13/22/30 反复讲的 **Agent Loop**：观察结果、决定下一步动作。

## 四、测试设计原则（呼应前面模块）

| 原则 | 说明 | 呼应 |
|------|------|------|
| 对照验收标准写用例 | 每条 acceptanceCriteria 至少一个用例 | Day 72 PM |
| 外部依赖必须 mock | 不直连真实 API/DB，用 vi.mock | Day 65 测试与优化 |
| 覆盖边界与异常 | 除零、空输入、超时、类型错误 | Day 3 错误处理 |
| 单测隔离 | 每个被测单元独立、可重复 | Day 65 |

```ts
// 示例：mock 外部依赖（呼应 Day 65）
import { vi, describe, it, expect } from 'vitest'
vi.mock('../src/db', () => ({ query: vi.fn().mockResolvedValue([{ id: 1 }]) }))
```

## 五、安全与成本护栏

1. **只跑指定测试文件**：绝不 `vitest run` 全量，避免误伤其他模块、拖慢循环。
2. **沙箱路径**：`writeTestFile` 必须校验 `path` 在 `SANDBOX` 内，禁止写到生产目录（呼应 Day 47/73 路径白名单）。
3. **禁止任意命令**：`runTests` 只允许固定的 `vitest run` 调用，不能让模型 `exec` 任意 shell（呼应 Day 47 安全）。
4. **maxSteps 上限**：限制修正轮数，防止无限重试烧 token（呼应 Day 23 maxIterations）。

## 六、常见坑

1. **测试直连真实 API**：慢、烧钱、flaky——务必 `vi.mock`（呼应 Day 65）。
2. **无限重试不收敛**：测试永远红 → 设 `maxSteps` 上限并让模型在卡住时改测试而非源文件。
3. **runTests 超时**：长测试要调大 `timeout`，否则被 SIGTERM 误判失败。
4. **读不到失败栈**：让 `runTests` 返回 JSON reporter 输出，模型才能精确定位断言哪行挂了。
5. **测试写进生产目录**：路径白名单校验，与源码目录隔离。
6. **只测 happy path**：漏边界/异常，等于没测（呼应 Day 3）。
7. **官方站不可访问**：Vitest 文档用国内镜像 https://cn.vitest.dev/ 。

## 七、今日实践任务

1. 在 `tester.ts` 实现 `writeTestFile / runTests / readFile` 三件套 + `maxSteps` 循环。
2. 找一个 Day 73 Coder 写的函数，让 Tester 自动生成测试并跑绿；故意改坏源码，确认 Tester 能红并定位。
3. 把 Tester 接到 Day 74 Reviewer 之后：Reviewer 通过 → Tester 补测试 → 全绿才算「可合并」。
4. 更新 README 拓扑图，补上 Tester 节点与「全绿」终态（为 Day 76 Supervisor 编排做最终准备）。

> 学习资料（国内可访问）：Vitest 官方中文文档 https://cn.vitest.dev/ ；Vitest GitHub https://github.com/vitest-dev/vitest ；Vercel AI SDK 工具调用 https://ai-sdk.com.cn/docs/ai-sdk-core/tools-and-tool-calling
