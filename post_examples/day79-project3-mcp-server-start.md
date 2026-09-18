---
id: 83
title: "AI Agent 学习计划 - Day 79：项目三启动 - MCP 工具服务器"
slug: "ai-agent-day79-project3-mcp-server-start"
date: "2026-09-18"
tags: ["AI Agent", "实战项目", "项目三", "MCP", "工具服务器", "@modelcontextprotocol/sdk", "TypeScript", "学习计划"]
excerpt: "项目三启动：用 TypeScript + @modelcontextprotocol/sdk 从零搭一个标准 MCP 工具服务器（角色反转——从 Day 77 的「消费方」变成「提供方」）。覆盖为什么自己造 MCP server、MCP 三大原语（Tools/Resources/Prompts）、技术栈与项目脚手架、stdio/Streamable HTTP 两种传输、5 天项目规划，并呼应 Day 1/5/7/30/50/51/77。"
readingTime: 15
---

# Day 79：项目三启动 - MCP 工具服务器

## 一、目标

Day 50/51 我们学了 MCP 概念与服务器开发，Day 77 在项目二里**消费**了（接入）MCP 工具服务器。今天项目三启动：**角色反转——我们用 TypeScript + `@modelcontextprotocol/sdk` 从零造一个标准的、可被任意 MCP 客户端接入的工具服务器**。它将成为你所有 Agent（项目二、未来任意支持 MCP 的客户端）统一的能力后端。

> 项目三贯穿 Day 79–83：今天搭骨架与规划，Day 80 自定义工具、Day 81 数据库查询工具、Day 82 API/文件工具、Day 83 标准合规与测试。

## 二、为什么自己造 MCP Server（而非继续手写工具）

| 维度 | 手写工具（Day 73 本地 fs） | 标准 MCP Server |
|------|--------------------------|------------------|
| 复用 | 绑死在某个 Agent 代码里 | 任意 MCP 客户端（Claude / 项目二 / Cursor）即插即用 |
| 部署 | 随应用一起 | 独立进程，远程可托管（Streamable HTTP） |
| 安全边界 | 难隔离 | 进程级隔离，客户端只拿到「工具声明」不碰源码 |
| 标准化 | 各自一套 schema | 统一 protocol version + JSON-RPC，生态互通 |

> 一句话：把能力「产品化」，谁都能接——这正是 Day 50 说的 MCP 价值。

## 三、MCP 三大原语（今天要建立的认知骨架）

1. **Tools**：Agent 可调用的函数（我们项目三的主角，Day 80–82 实现）。
2. **Resources**：可读取的数据源（如 `file://`、`db://` 的只读 URI）。
3. **Prompts**：预置的提示词模板（给 Agent 的「最佳实践」）。

今天先以 Tools 为主，Resources/Prompts 作为规划项。

## 四、技术栈与脚手架

```bash
npm init -y && npm i @modelcontextprotocol/sdk zod
npm i -D typescript @types/node
```

```ts
// src/index.ts —— 最小可用骨架
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new McpServer({ name: 'my-tools', version: '1.0.0' })

// Day 80 起在这里注册 tools / resources / prompts
server.tool('hello', '打个招呼', { name: z.string() }, async ({ name }) => ({
  content: [{ type: 'text', text: `Hello ${name}` }],
}))

const transport = new StdioServerTransport()
await server.connect(transport)   // 注意：注册完成后再 connect
```

> 关键细节：`console.log` 会污染 stdio 通道，**所有日志必须走 stderr**（呼应 Day 77 护栏）；`connect` 之前务必注册完工具。

## 五、两种传输方式（呼应 Day 77）

- **stdio**：本地子进程，项目三默认用这个（Day 77 客户端 `connectMCP` 就是这么接的）。
- **Streamable HTTP**：远程托管，需鉴权（呼应 Day 44/77 安全护栏）。项目三后期可升级。

## 六、5 天项目规划

| Day | 内容 |
|-----|------|
| 79（今天） | 脚手架 + 架构 + 1 个 hello 工具验证链路 |
| 80 | 自定义业务工具（暴露给 Agent 调用，Day 30/31 Zod 校验） |
| 81 | 数据库查询工具（Prisma，呼应 Day 48/81） |
| 82 | API 调用 + 文件操作工具（呼应 Day 49/82） |
| 83 | 标准合规（protocol version）、功能测试、与项目二联调 |

## 七、常见坑

1. **注册顺序错**：`connect` 之后才 `tool()` → 客户端看不到工具（Day 77 也提过）。
2. **用 console.log 调试**：stdio 模式会破坏 JSON-RPC 帧，必须 stderr。
3. **inputSchema 缺失/不严格**：导致 Agent 传参失败（务必 Zod，呼应 Day 31）。
4. **protocol version 不匹配**：与客户端握手失败，先对齐最新稳定版。
5. **传输层与客户端不一致**：客户端用 stdio，server 却监听 HTTP（呼应 Day 77）。
6. **官方站不可访问**：MCP 协议规范中文 https://mcp-docs.cn/ ；MCP Servers 仓库 https://github.com/modelcontextprotocol/servers ；SDK npm `@modelcontextprotocol/sdk`。

## 八、今日实践任务

1. 初始化一个 TypeScript 项目，装好 `@modelcontextprotocol/sdk` + `zod`。
2. 写最小 `src/index.ts`，注册 1 个 `hello` 工具（Zod 入参），用 stdio 启动。
3. 用 Day 77 项目二的 `connectMCP('my-tools', { command })` 接上它，跑通 `hello` 调用——验证「你造的 server 能被你的 Agent 用」。
4. 在 README 画出项目三架构图（Tools/Resources/Prompts + stdio + 未来 HTTP），列出 Day 80–83 待实现工具清单。
5. 复盘：项目三如何把 Day 50/51 理论、Day 77 消费经验、Day 1/30/31 的 TS/Zod 能力串成「可交付产品」。

> 学习资料（国内可访问）：MCP 协议规范（中文） https://mcp-docs.cn/ ；MCP Servers 示例仓库 https://github.com/modelcontextprotocol/servers
