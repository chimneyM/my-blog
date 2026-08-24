---
id: 55
title: "AI Agent 学习计划 - Day 51：MCP 服务器开发（@modelcontextprotocol/sdk）"
slug: "ai-agent-day51-mcp-server-dev"
date: "2026-08-21"
tags: ["AI Agent", "MCP", "MCP Server", "TypeScript", "工具开发", "学习计划"]
excerpt: "动手写第一个 MCP Server——用 @modelcontextprotocol/sdk 通过 stdio 暴露一个计算器工具。今天覆盖 SDK 安装、Server 初始化、用 zod 定义 tool、连接测试（MCP Inspector），把 Day 50 的概念落成代码。"
readingTime: 15
---

# Day 51：MCP 服务器开发 — 用 @modelcontextprotocol/sdk 暴露第一个工具

## 一、目标

把 Day 50 的架构概念变成可运行代码：**写一个 stdio 模式的 MCP Server，对外暴露一个 `add` 计算器工具**，并能被 Host（如 Claude Desktop 或 MCP Inspector）发现调用。

## 二、最小 Server 骨架（TypeScript + SDK）

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const server = new McpServer({ name: 'demo-server', version: '1.0.0' })

// 注册一个工具：两数相加
server.tool(
  'add',
  '计算 a + b',
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: 'text', text: String(a + b) }],
  }),
)

// 通过 stdio 启动（注意：日志必须走 stderr，否则污染协议流）
const transport = new StdioServerTransport()
await server.connect(transport)
```

## 三、关键 API 解析

| API | 作用 |
|-----|------|
| `McpServer` | 服务端实例，注册 tool/resource/prompt |
| `server.tool(name, desc, schema, handler)` | 注册工具，handler 返回 `{ content: [...] }` |
| `StdioServerTransport` | stdio 传输层（本地子进程） |
| `server.connect(transport)` | 启动并监听 |

## 四、用 MCP Inspector 调试

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Inspector 是官方可视化调试器，能看到工具列表、手动调用、查看返回，是开发期必备。

## 五、对接 Host（以 Claude Desktop 为例）

在 `claude_desktop_config.json` 加：

```json
{
  "mcpServers": {
    "demo": {
      "command": "node",
      "args": ["/path/dist/index.js"]
    }
  }
}
```

重启 Host 后，你的 `add` 工具就出现在工具列表里，Agent 可主动调用。

## 六、常见坑

| 坑 | 后果 | 规避 |
|----|------|------|
| console.log 写 stdout | 协议解析失败 | 日志一律 stderr / 文件 |
| zod schema 与 handler 参数不一致 | 调用报错 | 保持 shape 同名 |
| 忘记 `await connect` | Server 不启动 | 顶层 await 或 async main |
| ESM/CJS 混用 | import 报错 | package.json 设 `"type":"module"` |
| 官方站不可访问 | 卡文档 | 用 mcp-docs.cn 镜像 |

## 七、今日实践任务

1. 用 SDK 写出上方案例并 `npx tsc` 编译跑通
2. 用 Inspector 调用 `add` 验证返回
3. 加一个 `get_weather(city)` 占位工具（返回模拟数据），为 Day 80 自定义工具打底

🔗 学习资料（国内可访问镜像）：
- MCP 官方文档：https://modelcontextprotocol.io/ ✅
- MCP 中文文档：https://mcp-docs.cn/ ✅
- MCP Servers 仓库：https://github.com/modelcontextprotocol/servers ✅
- 掘金 从零开发 MCP Server：https://juejin.cn/post/7481593384082472994 ✅
