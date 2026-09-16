---
id: 81
title: "AI Agent 学习计划 - Day 77：项目二 - MCP 工具集成"
slug: "ai-agent-day77-project2-mcp-integration"
date: "2026-09-16"
tags: ["AI Agent", "实战项目", "项目二", "MCP", "工具集成", "MCP Client", "Supervisor", "学习计划"]
excerpt: "项目二进阶：把外部 MCP 工具服务器接入 Day 76 的 Supervisor 编排，让 Coder/Reviewer/Tester 不再只靠手写 fs 函数，而是调用标准协议暴露的 MCP 工具（文件/数据库/API/安全扫描）。覆盖 MCP 客户端连接（stdio / Streamable HTTP）、工具发现与注入 Agent、与前面模块串接、安全护栏，呼应 Day 50-51 MCP 入门与开发。"
readingTime: 15
---

# Day 77：项目二 - MCP 工具集成

## 一、目标

Day 73–75 的 Coder / Reviewer / Tester 用的工具（读文件、跑测试）都是**写在 Agent 代码里的本地函数**。今天把 **MCP 工具服务器**接进 Day 76 的 Supervisor 编排——让这些 Agent 通过**标准协议**调用外部工具（数据库、文件、第三方 API、lint/安全扫描），把能力边界从「自己写的几行函数」扩展到「任意 MCP server 提供的工具」。

> 这正是 Day 50 讲的 **N×M 集成痛点**的终极解法：工具以协议服务器形式独立部署，Agent 侧只写一次客户端就能复用（呼应 Day 50-51）。

## 二、为什么用 MCP 而非手写工具

| 维度 | 手写工具（Day 73-75） | MCP 工具服务器 |
|------|----------------------|----------------|
| 复用 | 每个 Agent 复制一份 | 多 Agent/多应用共享一个 server |
| 部署 | 跟随主程序 | 独立进程/服务，可远程 |
| 扩展 | 改代码重发 | 加一个 server 即可 |
| 标准化 | 各写各的 schema | 统一 JSON-RPC + Tool 协议 |

> 结论：手写工具适合「专用、内联」的小能力；MCP 适合「要让多个 Agent 乃至别的客户端共用」的能力。项目二走到这一步，正好用 MCP 把工具层抽出去。

## 三、MCP 客户端接入（两种传输）

```ts
// src/mcp/client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
// 远程用：import { StreamableHTTPClientTransport } from '.../streamableHttp.js'

export async function connectMCP(command: string, args: string[]) {
  const transport = new StdioClientTransport({ command, args })
  const client = new Client({ name: 'coding-assistant', version: '1.0' }, { capabilities: {} })
  await client.connect(transport)
  const { tools } = await client.listTools() // 工具发现
  return { client, tools }                    // 把 tools 注入 Agent
}
```

- **stdio**：本地子进程，最快、零网络，适合本项目内的文件/数据库工具（呼应 Day 51）。
- **Streamable HTTP**：远程 server，**必须鉴权**（呼应 Day 50 安全坑），适合云端共享工具。

## 四、把 MCP 工具注入 Supervisor 编排

Day 76 的 `orchestrator.ts` 里，Supervisor 启动时连 MCP server，发现工具后转成 Vercel AI SDK 的 `tool()` 注册给子 Agent：

```ts
const { client, tools: mcpTools } = await connectMCP('npx', ['-y', 'my-mcp-server'])
// mcpTools: [{ name, description, inputSchema }] → 适配为 Vercel AI SDK tool
const coderTools = [writeFile, readFile, ...toVercelTools(mcpTools)]
// Coder 现在能调用 MCP 暴露的文件/数据库工具，而非仅本地 fs
```

> 与前面模块串接：Coder 通过 MCP 的「文件/数据库」工具落盘（替代 Day 73 本地 fs）；Reviewer 通过 MCP 的「lint/安全扫描」工具做检查；Tester 通过 MCP 的「运行环境」工具跑测试。Supervisor 不再关心工具从哪来，只管把它们注入对应 Agent（呼应 Day 76 编排）。

## 五、安全护栏（呼应 Day 50-51/47）

1. **远程 MCP 必鉴权**：Streamable HTTP 传输不鉴权 = 任意人可调用你的工具（呼应 Day 50）。
2. **工具白名单**：只把需要的工具注入 Agent，别一股脑全给（最小能力面，呼应 Day 47）。
3. **stdio 日志不污染 stdout**：MCP server 的 `console.log` 会塞进 stdio 通道破坏协议——server 端必须用 stderr 打日志（呼应 Day 51）。
4. **Client 一对一**：一个 Client 连一个 Server，别多路复用导致消息串台（呼应 Day 50）。
5. **超时与熔断**：MCP 调用也要设 timeout，避免远端卡死拖垮编排（呼应 Day 76 成本熔断）。

## 六、常见坑

1. **stdio 日志污染 stdout**：server 端 `console.log` 必崩协议，统一走 stderr（呼应 Day 51）。
2. **忘了把 MCP tools 注入 Agent**：连上了却没 `toVercelTools` 适配，Agent 调不到。
3. **远程不鉴权**：暴露工具即暴露能力，必须 token/域名白名单。
4. **Client 非 1:1**：多 Agent 共用一个 Client 实例会串消息。
5. **工具名冲突**：MCP 工具名与本地工具重名，调用时歧义——加前缀区分。
6. **官方站不可访问**：MCP 文档用国内镜像 https://mcp-docs.cn/ ，Servers 列表用 GitHub https://github.com/modelcontextprotocol/servers 。

## 七、今日实践任务

1. 基于 Day 51 的 MCP server（或官方 filesystem server），在 `orchestrator.ts` 里用 `connectMCP` 连上并 `listTools`。
2. 把发现的工具适配成 Vercel AI SDK `tool()`，注入 Coder Agent，**替代 Day 73 的本地 fs 函数**，跑通「需求→Coder 用 MCP 工具写文件→Reviewer→Tester」端到端。
3. 故意让 MCP server 打一条 `console.log`，观察协议是否崩，确认已改到 stderr。
4. 更新 README 拓扑图，标注「MCP 工具层」与 Supervisor 的注入关系（明日 Day 78 做端到端测试与性能优化）。

> 学习资料（国内可访问）：MCP 协议规范（中文） https://mcp-docs.cn/ ；MCP Servers 列表 https://github.com/modelcontextprotocol/servers ；Vercel AI SDK 中文文档 https://ai-sdk.com.cn/docs
