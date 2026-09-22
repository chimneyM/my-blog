---
id: 87
title: "AI Agent 学习计划 - Day 83：项目三 - 标准 MCP 协议实现与测试"
slug: "ai-agent-day83-project3-compliance-testing"
date: "2026-09-22"
tags: ["AI Agent", "实战项目", "项目三", "MCP", "协议合规", "功能测试", "联调", "学习计划"]
excerpt: "项目三收官日（Day 79-83 最后一天）：把 MCP 工具服务器从「能用」做成「合规 + 可测 + 可联调」。覆盖协议合规自查表（version/工具三要素/capabilities/错误处理/日志通道）、功能测试（Vitest 单测 handler + MCP Inspector/e2e 联调）、与 Day 77 项目二闭环（自造 server 被自己 Agent 调用）、可选的 Streamable HTTP 远程升级，并呼应 Day 50/65/77/78/79。"
readingTime: 15
---

# Day 83：项目三 - 标准 MCP 协议实现与测试

## 一、目标

Day 79–82 我们造好了 MCP 服务器、注册了 7 个工具。今天是**项目三收官日**：把它从「能跑」升级为「**合规、可测、能与真实客户端联调**」——这也是生产级 MCP server 的及格线。

> 核心认知：MCP 的价值在于「标准」。只有协议合规，任意 MCP 客户端（Claude / 项目二 / Cursor）才能零改造接入（呼应 Day 50/79）。

## 二、协议合规自查表（Day 82 已预置）

| 检查项 | 要求 |
|--------|------|
| protocol version | 与客户端对齐到稳定版，别硬编码旧值 |
| 工具三要素 | 每个 tool 必须有 `name` / `description` / `inputSchema`（Zod 生成） |
| capabilities | 正确声明 `tools` 能力；有 resources/prompts 也一并声明 |
| JSON-RPC 方法 | `initialize` / `tools/list` / `tools/call` 等按规范实现（SDK 已封装） |
| 错误处理 | 业务失败返回 `{ isError: true }`，不 `throw`（呼应 Day 80） |
| 日志通道 | 调试走 `server.sendLoggingMessage`，绝不 `console.log`（呼应 Day 79/80） |
| 注册时机 | **`connect()` 之前**完成所有工具/资源注册（呼应 Day 79） |

## 三、功能测试（三层，呼应 Day 65/78）

1. **handler 单测（Vitest）**：对 `calculator`/`query_db` 等 handler 注入 mock（db client、fetch），断言入参校验与返回值、以及 `isError` 分支。
2. **MCP 协议层测试**：用官方 **MCP Inspector** 或自己写 client 脚本，跑 `listTools`（断言 7 个工具都在）+ 逐个 `callTool`（断言 content 结构）。
3. **端到端联调**：用 Day 77 的 `connectMCP` 把项目三接进项目二，让 Supervisor/Coder/Reviewer 真实调用你的工具——**「自造的 server 被自己的 Agent 用起来」才是闭环**（呼应 Day 77/78 e2e）。

```ts
// e2e 片段：复用 Day 77 客户端
const tools = await client.listTools()
expect(tools.tools.map(t => t.name)).toEqual(expect.arrayContaining(['calculator','query_db','fetch_api','file_write']))
const r = await client.callTool({ name: 'calculator', arguments: { expression: '3*4' } })
expect(r.content[0].text).toBe('12')
```

## 四、可选加分：传输升级到 Streamable HTTP

把 stdio 换成 **Streamable HTTP** 远程托管，让 server 独立部署、多客户端共享，并加鉴权（呼应 Day 44/77 安全护栏）。这是把「本地 demo」变「可对外服务」的关键一步。

## 五、常见坑

1. **protocol version 不匹配**：与客户端握手失败→先对齐稳定版。
2. **注册在 connect 之后**：客户端看不到工具（呼应 Day 79）。
3. **测试只测 happy path**：`isError`/边界（空表、超大返回、越权路径）必须覆盖。
4. **未做真实客户端联调**：SDK 跑通 ≠ 任意客户端能接；一定要 listTools/callTool 实测。
5. **console.log 调试**：stdio 模式破坏协议帧（呼应 Day 79）。
6. **官方站不可访问**：MCP 协议规范（中文） https://mcp-docs.cn/ ；MCP Inspector https://github.com/modelcontextprotocol/inspector

## 六、今日实践任务（项目三收官）

1. 逐项核对「协议合规自查表」，补齐缺失项（version、capabilities、日志通道等）。
2. 补一套 Vitest：① handler 单测（mock db/fetch）覆盖正常+`isError` 分支；② 一个 e2e 脚本用 client 跑 `listTools`+`callTool` 验证 7 工具。
3. 用 Day 77 的 `connectMCP` 把项目三接进项目二，跑通「需求→Agent 调你的工具→产出」，形成闭环。
4. （加分）尝试把传输从 stdio 升到 Streamable HTTP + 鉴权。
5. 产出「项目三交付说明」+ README 拓扑图（架构/工具清单/合规状态/与项目二关系）——**项目三正式收官**，为 Day 84 总作品集做准备。

> 学习资料（国内可访问）：MCP 协议规范（中文） https://mcp-docs.cn/ ；MCP Inspector 仓库 https://github.com/modelcontextprotocol/inspector
