---
id: 75
title: "AI Agent 学习计划 - Day 71：项目二启动 - 多 Agent 协作编程助手"
slug: "ai-agent-day71-project2-kickoff"
date: "2026-09-10"
tags: ["AI Agent", "实战项目", "项目二", "多Agent", "Vercel AI SDK", "MCP", "Node.js", "学习计划"]
excerpt: "项目二启动：从「单体 RAG 流水线」升级到「多角色 Agent 协作编程」。规划技术栈（Node.js + Vercel AI SDK + MCP），梳理 PM/Coder/Reviewer/Tester 四种角色与 Supervisor 编排范式，搭建工程骨架，并回顾 MCP 协议如何让 Agent 调用工具标准化。"
readingTime: 15
---

# Day 71：项目二启动 - 多 Agent 协作编程助手

## 一、目标

项目一（Day 57-70）是**单体 RAG 流水线**：一条「检索→注入→生成」的线。项目二升级为 **多 Agent 协作**：让多个有角色的 Agent（PM / Coder / Reviewer / Tester）像一个小团队一样协作写代码，由一个 Supervisor 编排。

> 项目一的难点是「把知识喂准」，项目二的难点是「让多个 Agent 各司其职、不互相踩脚」。

## 二、技术栈与为什么是 Node.js

- **Node.js + TypeScript**：项目二是**自主编程 Agent**（更像后端服务 / CLI），不依赖 React UI，用 Node 跑编排循环最合适（呼应 Day 5-9 的 Stream/Event/HTTP 基础）。
- **Vercel AI SDK**（`ai` + `@ai-sdk/openai`）：统一 LLM 调用、`generateText`/`streamText`、`tool()` 定义工具（呼应 Day 26-31）。
- **MCP SDK**（`@modelcontextprotocol/sdk`）：让 Agent 通过标准协议调用外部工具（读文件、跑命令、查 GitHub），不用把每个工具硬编码进代码（呼应 Day 50/51）。

## 三、角色与编排范式（Day 72-76 逐步落地）

| 角色 | 职责 | 对应学习日 |
|---|---|---|
| PM Agent | 理解需求、拆任务、定验收标准 | Day 72 |
| Coder Agent | 按任务写代码 | Day 73 |
| Reviewer Agent | 代码审查、给修改意见 | Day 74 |
| Tester Agent | 写测试、跑测试 | Day 75 |
| Supervisor | 管理循环：PM 规划 → Coder 写 → Reviewer 审 → Tester 测 → 不通过则退回 | Day 76 |

编排采用 **Supervisor 层级管理模式**（呼应 Day 44）：Supervisor 不直接写代码，只做任务分发与质量门禁。

## 四、工程骨架

```text
project2/
├─ src/
│  ├─ agents/      # pm.ts / coder.ts / reviewer.ts / tester.ts
│  ├─ orchestrator/ # supervisor.ts 编排循环
│  ├─ mcp/         # MCP client 连接工具服务器
│  └─ tools/       # 本地 tool() 定义
├─ mcp-servers/    # 复用的 MCP 服务器（Day 77/79+）
├─ package.json
└─ tsconfig.json
```

初始化：

```bash
npm init -y && npm i ai @ai-sdk/openai @modelcontextprotocol/sdk zod
npm i -D typescript tsx
```

## 五、MCP 为什么关键

项目一的工具（检索）是我们手写死在代码里的。项目二要对接**文件读写、shell、GitHub、数据库**等多种工具——若每个都硬编码会爆炸。MCP（Model Context Protocol，Day 50/51）把「工具暴露」标准化：任何 MCP Server 注册的工具，Agent 都能即插即用。Day 77 会正式接入。

> 关键认知：**Agent 的能力上限 ≈ 它能调用的工具质量**。MCP 是给 Agent「装机量」的扩展坞。

## 六、今日实践任务

1. 初始化 `project2` 工程，装好 `ai` / `@ai-sdk/openai` / `@modelcontextprotocol/sdk` / `zod`，配 `tsconfig` + `tsx` 运行。
2. 画出 Supervisor 编排循环图（PM→Coder→Reviewer→Tester→退回/通过）。
3. 先用 `generateText` 跑通一个最小 PM Agent：输入一句需求，输出结构化任务清单（JSON）。
4. 在 README 写明项目二目标与技术栈，作为作品集第二块。

> **明日（Day 72）PM Agent 实现**：让 PM 把一句话需求拆成带验收标准的任务列表（用 Zod schema 约束输出结构）。

## 七、参考

- Vercel AI SDK 文档：https://sdk.vercel.ai/docs （中文镜像：https://ai-sdk.com.cn/docs）
- MCP 协议规范：https://modelcontextprotocol.io/
- Vercel AI SDK UI 中文文档：https://ai-sdk.com.cn/docs/ai-sdk-ui
