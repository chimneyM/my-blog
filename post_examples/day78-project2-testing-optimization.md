---
id: 82
title: "AI Agent 学习计划 - Day 78：项目二 - 测试与优化（项目二收官）"
slug: "ai-agent-day78-project2-testing-optimization"
date: "2026-09-17"
tags: ["AI Agent", "实战项目", "项目二", "端到端测试", "性能优化", "Vitest", "可观测", "学习计划"]
excerpt: "项目二收官日：把 Day 71-77 拼起来的多 Agent 编程助手做端到端测试与性能优化。覆盖端到端测试金字塔（单 Agent 单测 / 双 Agent 集成 / 全链路 e2e）、用 Vitest 给编排器写回归用例、性能优化（并发跑 task、MCP 连接复用、token 与成本监控、流式/缓存）、可观测（EventEmitter 埋点 + 结构化日志）、从 Demo 到可交付的收尾清单，呼应 Day 65/75 测试与 Day 23/44/76 护栏。"
readingTime: 16
---

# Day 78：项目二 - 测试与优化（项目二收官）

## 一、目标

Day 71–77 我们逐步搭起了**多 Agent 协作编程助手**：PM 拆任务 → Coder 写代码 → Reviewer 审代码 → Tester 写测试 → Supervisor 编排 → MCP 工具接入。今天是**项目二收官日**：把它从「能跑的 demo」变成「可测试、可优化、可交付」的系统。

> 关键认知：Agent 系统比普通软件更「非确定性」，所以测试与可观测不是加分项，而是**能否信任它替你写代码的前提**（呼应 Day 65/75 的测试观、Day 44 的护栏观）。

## 二、端到端测试金字塔

普通测试金字塔照用，只是每层针对 Agent：

| 层级 | 测什么 | 做法 |
|------|--------|------|
| 单 Agent 单测 | 单个 Agent 输入→输出是否稳定 | 用**固定 fixture** mock LLM 返回，断言结构化输出（呼应 Day 30/31 Zod） |
| 双 Agent 集成 | 如 Coder→Reviewer 接力是否正确 | mock 上游，验证下游收到正确入参 |
| 全链路 e2e | Supervisor 跑通「需求→交付」 | 用廉价的本地小模型或 mock provider，跑一个真实小需求（呼应 Day 76） |
| 回归测试 | 已知 bug 不再复发 | 把每次发现的失败 case 落成 fixture（呼应 Day 65） |

```ts
// 用 mock provider 跑 e2e，避免每次烧真 LLM
import { mockLanguageModel } from './test/mock'
const fakeLLM = mockLanguageModel({
  'PM': { tasks: [{ id: 't1', desc: '实现 add', acceptanceCriteria: [...] }] },
  'Coder': { files: { 'add.ts': 'export const add=(a,b)=>a+b' } },
})
await expect(supervisor('实现 add', { model: fakeLLM }))
  .resolves.toMatchObject([{ passed: true }])
```

## 三、性能优化（呼应 Day 8/23/44/76）

1. **并发跑独立 task**：Supervisor 对互相独立的 task 用 `Promise.all`（呼应 Day 8 并行），别串行等。
2. **MCP 连接复用**：Day 77 的 `connectMCP` 在编排启动时连一次、全程复用，别每个 Agent 重连（呼应 Day 50 Client 1:1）。
3. **token 与成本监控**：为每个子 Agent 累计 `usage`，超阈值中止并告警（呼应 Day 44 成本熔断、Day 76 熔断）。
4. **流式与缓存**：PM 拆出的 task 可缓存；重复需求走缓存跳过 LLM（呼应 Day 27/29 流式、Day 24 记忆）。
5. **限流与退避**：LLM 429 时指数退避重试，别一把梭（呼应 Day 12/22 工具重试）。

## 四、可观测（呼应 Day 7/76）

用 Day 7 的 EventEmitter 在编排关键节点埋点，输出结构化日志，让「黑盒 Agent」变「白盒」：

```ts
bus.on('stage', ({ taskId, stage, ms, tokens }) =>
  console.log(JSON.stringify({ taskId, stage, ms, tokens })))
// 后续可接 Prometheus / 文件日志做告警
```

> 没有可观测，你永远不知道一次失败是 LLM 抽风、工具报错还是编排 bug——这是生产 Agent 的生死线。

## 五、从 Demo 到可交付的收尾清单

- [ ] 端到端测试跑绿、关键回归 case 已固化
- [ ] README 含完整 Agent 拓扑图 + 运行方式 + 示例输出（Day 76/77 已铺垫）
- [ ] MCP server 用 stderr 打日志、远程鉴权已开（Day 77 护栏）
- [ ] 成本/超时熔断参数已配置、可观测日志可查
- [ ] 一个 `npm run demo` 一键跑通「需求→审查→测试全绿」

## 六、常见坑

1. **只测 happy path**：非确定性系统要在 fixture 里覆盖「Reviewer 不通过」「Tester 红」等分支（呼应 Day 75）。
2. **e2e 真烧 LLM**：回归测试必须用 mock provider，否则又慢又贵又 flaky。
3. **并发不隔离**：并行 task 共享同一 sandbox 目录会互相覆盖——每个 task 独立子目录（呼应 Day 73 路径沙箱）。
4. **MCP 反复重连**：连接未复用，延迟与资源翻倍。
5. **无成本监控**：一次失控编排烧掉一周预算（呼应 Day 44）。
6. **官方站不可访问**：Vitest 中文 https://cn.vitest.dev/ ，Vercel AI SDK 中文 https://ai-sdk.com.cn/ 。

## 七、今日实践任务

1. 给 `orchestrator.ts` 写 3 个层级的 Vitest 用例：① PM 结构化输出单测（mock LLM）；② Coder→Reviewer 集成；③ 全链路 e2e（廉价 mock provider 跑 `debounce` 需求）。
2. 把 Supervisor 改成并发跑独立 task（`Promise.all`），并加每个子 Agent 的 token 累计 + 超限中止。
3. 接上 EventEmitter 结构化日志，跑一遍 demo 看是否全程可观测。
4. 核对收尾清单全部打勾，产出一份「项目二交付说明」段落写进 README——**项目二正式收官**。
5. 复盘：项目二验证了哪些前面模块（Day 7/8/12/13/22/30/44/50/65/75），为 Day 79 项目三（独立 MCP 工具服务器）做衔接。

> 学习资料（国内可访问）：Vitest 中文文档 https://cn.vitest.dev/ ；Vercel AI SDK 中文 https://ai-sdk.com.cn/docs ；MCP 协议规范（中文） https://mcp-docs.cn/
