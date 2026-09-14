---
id: 78
title: "AI Agent 学习计划 - Day 74：项目二 - Reviewer Agent 实现"
slug: "ai-agent-day74-project2-reviewer-agent"
date: "2026-09-13"
tags: ["AI Agent", "实战项目", "项目二", "Reviewer Agent", "代码审查", "Vercel AI SDK", "结构化输出", "Zod", "学习计划"]
excerpt: "项目二第四步：实现 Reviewer Agent——读取 PM 派发的 task（含验收标准）与 Coder 落盘的代码文件，做一次「独立代码审查」，并强制以结构化 JSON 报告输出（是否通过、问题清单、改进建议）。让 Agent 之间的互相检查从「口头承诺」变成「可机器消费的结论」，为 Day 76 的 Supervisor 闭环编排打底。"
readingTime: 15
---

# Day 74：项目二 - Reviewer Agent 实现

## 一、目标

Day 72 的 **PM Agent** 派发结构化 task（含验收标准），Day 73 的 **Coder Agent** 把代码真正写进了文件。但「写完」≠「写对」。今天实现 **Reviewer Agent**：读取 PM 的 task 与 Coder 落盘的文件，做一次**独立代码审查**，输出一份**结构化审查报告**。

> 关键价值：不能让 Coder 自嗨式交付。独立审查能在「合入主干」前捕获 bug、风格问题、安全隐患、与验收标准不符的地方。这正是软件工程中 Code Review 的 Agent 化（呼应 Day 67 项目一里的 review/fix 思路）。

## 二、让审查结论可机器消费

如果让模型「自由写一段审查意见」，下游 Supervisor 很难判断「到底过没过」。所以今天的核心是**强制结构化输出**——用 Zod schema 约束模型返回固定形状：

```ts
// src/agents/reviewer.ts
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

// 审查维度枚举
const Severity = z.enum(['blocker', 'major', 'minor', 'nit'])

const reviewSchema = z.object({
  approved: z.boolean().describe('是否满足全部验收标准、且无 blocker/major 问题'),
  score: z.number().min(0).max(100).describe('代码质量评分'),
  summary: z.string().describe('一句话总体结论'),
  issues: z.array(z.object({
    file: z.string(),
    line: z.number().nullable(),
    severity: Severity,
    category: z.enum(['correctness', 'security', 'readability', 'error-handling', 'acceptance']),
    comment: z.string(),
  })),
})

const { experimental_output } = await generateText({
  model: openai('gpt-4o'),
  prompt: buildReviewPrompt(task, code),
  experimental_output: reviewSchema,
})
// experimental_output 已是强类型对象，可直接 if(!output.approved) 重试
```

> `experimental_output`（Vercel AI SDK 结构化输出，等价于 Day 31 的 `withStructuredOutput`）会要求模型按 schema 输出，失败自动纠错重抽，比手写 JSON 解析稳得多（呼应 Day 30/31）。

## 三、给 Reviewer 装上「眼睛」

审查必须基于**真实文件内容**，所以复用 Day 73 的 fs 工具，让 Reviewer 能读取 Coder 的产物：

```ts
import { readFileSync, readdirSync } from 'node:fs'

const readFile = {
  description: '读取 Coder 落盘的代码文件（限 sandbox 目录）',
  parameters: z.object({ path: z.string() }),
  execute: async ({ path }) => {
    if (!path.startsWith(SANDBOX)) throw new Error('路径越界')
    return readFileSync(path, 'utf8')
  },
}

const listFiles = {
  description: '列出 sandbox 下全部文件，定位 Coder 的产物',
  parameters: z.object({ dir: z.string() }),
  execute: async ({ dir }) => readdirSync(resolve(SANDBOX, dir)),
}
```

`buildReviewPrompt` 把三样东西拼进 system：① PM 的验收标准（来自 task.acceptanceCriteria）；② 文件清单；③ 让模型按需 `readFile` 后再下结论的指令。

## 四、审查的四个维度

| 维度 | 看什么 | 对应前面模块 |
|------|--------|--------------|
| 功能正确性 | 是否满足 task 的验收标准 | Day 72 PM 验收点 |
| 安全性 | 有无注入/越权/路径穿越/硬编码密钥 | Day 47 代码执行沙箱、Day 67 |
| 错误处理 | 异常是否兜底、错误信息是否泄露 | Day 3 async/await 错误处理 |
| 可读性/测试 | 命名、结构、是否有对应测试 | Day 75 Tester 铺垫 |

## 五、接入闭环（为 Day 76 铺垫）

`approved=false` 时，不要直接丢弃，而是把 `issues` 回传给 Coder 修正后**再审**：

```
PM(task) → Coder(write) → Reviewer(read+review)
                               │
                    approved=false ──→ Coder(fix by issues) → 复审
                               │
                    approved=true  ──→ 进入 Tester / 合并
```

这正是一个最小化的 **Supervisor 编排**（呼应 Day 44 层级管理、Day 41 顺序链）：判断节点控制流转方向。

## 六、常见坑

1. **让模型自由文本输出**：下游无法 `if(!approved)` 自动决策——务必用结构化输出（呼应 Day 30/31）。
2. **读错文件 / 读不到**：Reviewer 必须 `listFiles` 定位 Coder 真实产物，别凭文件名猜。
3. **超大文件爆上下文**：长文件应分片读取或只 `readFile` 相关片段，避免 token 爆炸。
4. **验收标准写得太虚**：PM 的 acceptanceCriteria 要可验证，Reviewer 才判得准（呼应 Day 72）。
5. **漏掉安全维度**：只查功能不查安全，等于没审（呼应 Day 47/67）。
6. **把 review 当绝对真理**：blocker 才阻断，minor/nit 仅建议，避免过度阻塞。
7. **官方站不可访问**：Vercel AI SDK 文档用国内镜像 https://ai-sdk.com.cn/ 。

## 七、今日实践任务

1. 基于 Day 73 的 Coder 产物，实现 `reviewer.ts`：复用 `readFile/listFiles` 工具 + `experimental_output` 结构化审查。
2. 准备一个故意留 bug 的小函数（如 `divide` 不处理除零），跑 Reviewer，确认 `approved=false` 且 issues 命中。
3. 串起「Coder 写 → Reviewer 审 → 不通过则回传 issues 给 Coder 修正 → 复审」的最小闭环。
4. 在 README 补一张「项目二 Agent 拓扑图」：PM → Coder → Reviewer →（Tester）→ Supervisor。

> 学习资料（国内可访问）：Vercel AI SDK 中文文档 - 结构化输出 https://ai-sdk.com.cn/docs/ai-sdk-core/generating-structured-data ；Vercel AI SDK 工具调用 https://ai-sdk.com.cn/docs/ai-sdk-core/tools-and-tool-calling
