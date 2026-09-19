---
id: 84
title: "AI Agent 学习计划 - Day 80：项目三 - 自定义工具开发"
slug: "ai-agent-day80-project3-custom-tools"
date: "2026-09-19"
tags: ["AI Agent", "实战项目", "项目三", "MCP", "自定义工具", "Zod", "Tool Calling", "学习计划"]
excerpt: "项目三 Day 80：在 Day 79 的 MCP 服务器骨架上，暴露自定义业务工具给 Agent 调用。覆盖 tool 注册范式（Zod 入参 + 异步 handler + 结构化返回）、工具设计三原则（名字/描述/ schema 决定 Agent 会不会用对）、错误处理（用 isError 而非 throw）、MCP 日志与 annotations 安全提示，呼应 Day 30/31 Tool Calling 与 Day 77 工具发现。"
readingTime: 15
---

# Day 80：项目三 - 自定义工具开发

## 一、目标

Day 79 我们搭好了 MCP 服务器骨架并跑通 `hello`。今天在骨架上**暴露真正的自定义业务工具**——这是 MCP server 的核心价值：把你的能力用标准协议暴露给任意 Agent（包括 Day 77 的项目二）。

> 关键转变：你写的不再是一段函数，而是「Agent 能自主发现并正确调用的工具」——工具的设计质量直接决定 Agent 会不会用对。

## 二、tool 注册范式（呼应 Day 30/31）

```ts
server.tool(
  'calculator',                          // 工具名：短、动词化
  '安全的四则运算计算器',                   // 描述：Agent 靠它判断是否该调用
  { expression: z.string().describe('如 "3*(4+5)"') }, // Zod schema，必带 describe
  async ({ expression }) => {
    const result = evalSafe(expression)  // 实际实现注意沙箱（Day 47）
    return { content: [{ type: 'text', text: String(result) }] }
  }
)
```

- **入参用 Zod 声明**：既是校验（呼应 Day 31），也是 Agent 看到的 schema。
- **返回 `content` 数组**：标准 MCP 内容块，支持 `text`/`image`/`resource`。
- **handler 是异步的**：可查库、调 API、读文件（Day 81/82 展开）。

## 三、工具设计三原则（决定 Agent 用不用得对）

1. **名字动词化、无歧义**：`getWeather` 优于 `weather`；避免 `process` 这类泛词。
2. **描述写清「何时用 + 入参含义 + 返回」**：Agent 完全靠 description 做工具选择（呼应 Day 30 的 tool 描述重要性）。
3. **schema 必带 `describe`、约束要严**：用 `z.enum`/`z.number().int().positive()` 缩小合法范围，减少 Agent 传错。

## 四、错误处理与可观测

```ts
async ({ x }) => {
  if (x <= 0) {
    return { content: [{ type: 'text', text: 'x 必须为正' }], isError: true } // ✅ 别 throw
  }
  server.sendLoggingMessage({ level: 'info', data: `处理 x=${x}` })  // ✅ MCP 日志通道
  return { content: [{ type: 'text', text: String(doWork(x)) }] }
}
```

- **别 `throw`**：抛错会让客户端协议中断；返回 `{ isError: true }` 让 Agent 自行重试/换工具。
- **用 `server.sendLoggingMessage`**：日志走 MCP 协议通道，不直接 `console.log`（呼应 Day 77/79 stdio 护栏）。
- **annotations 安全提示**：`destructiveHint`/`readOnlyHint` 告诉客户端该工具是否改状态，便于护栏（呼应 Day 44/77 安全）。

## 五、今日可加的 2–3 个示例工具

- `calculator`（四则运算，沙箱执行，呼应 Day 47）
- `codebase_search`（在仓库里按关键词 grep，呼应 Day 73）
- `fetch_web` 轻封装（带超时，呼应 Day 49）

注册后用 Day 77 的 `connectMCP` 接入项目二，验证 `listTools` 能看到它们、调用能返回结果。

## 六、常见坑

1. **描述太含糊**：Agent 不知道何时调，改了参数也白搭。
2. **无/弱 inputSchema**：Agent 自由发挥传错参（务必 Zod + describe）。
3. **用 throw 代替 isError**：客户端协议崩溃，体验差。
4. **console.log 调试**：stdio 模式污染协议帧（呼应 Day 79）。
5. **有副作用却标 readOnly**：客户端护栏误判，误执行破坏操作。
6. **官方站不可访问**：MCP 协议规范（中文） https://mcp-docs.cn/ ；MCP SDK npm `@modelcontextprotocol/sdk`。

> 学习资料：MCP 协议规范（中文） https://mcp-docs.cn/ ；SDK 包 `@modelcontextprotocol/sdk`

## 七、今日实践任务

1. 在 Day 79 的 `src/index.ts` 里把 `hello` 升级为 3 个真实工具：`calculator`、`codebase_search`、`fetch_web`。
2. 每个工具严格用 Zod + `describe`，有副作用的标 `destructiveHint`/`readOnlyHint`。
3. 错误处理一律 `isError`，日志走 `sendLoggingMessage`；用 Day 77 客户端 `connectMCP` 联调，确认 `listTools` 可见且调用正常。
4. 写一段 README「工具清单」说明每个工具的用途与入参；复盘：自定义工具与 Day 30/31 的 Vercel AI SDK `tool()` 在「设计理念」上的异同。
5. 为 Day 81 数据库工具预留下 `query_db` 的接口签名。

> 学习资料（国内可访问）：MCP 协议规范（中文） https://mcp-docs.cn/ ；MCP Servers 示例仓库 https://github.com/modelcontextprotocol/servers
