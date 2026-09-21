---
id: 86
title: "AI Agent 学习计划 - Day 82：项目三 - API 调用与文件操作工具"
slug: "ai-agent-day82-project3-api-file-tools"
date: "2026-09-21"
tags: ["AI Agent", "实战项目", "项目三", "MCP", "API工具", "文件操作", "安全沙箱", "学习计划"]
excerpt: "项目三 Day 82：给 MCP 服务器加 API 调用与文件操作工具，项目三工具集收口。覆盖 fetch_api（AbortController 超时/重试退避/鉴权头，呼应 Day 9/49）、file_read/file_write（路径沙箱防穿越、写操作标 destructiveHint，呼应 Day 73）、密钥安全（不进 prompt）、常见坑，并为 Day 83 标准合规与测试铺路。"
readingTime: 14
---

# Day 82：项目三 - API 调用与文件操作工具

## 一、目标

Day 80/81 我们做了「计算/检索/查库」工具。今天补齐项目三工具集的最后一公里：**对外 API 调用** 与 **文件读写**，让 Agent 能联网取数、落地产物（呼应 Day 49 外部 API 与 Webhook、Day 73 文件操作）。这是 Day 79–83 工具开发的收口日，Day 83 将做标准合规与测试。

## 二、fetch_api（联网取数，呼应 Day 9/49）

```ts
server.tool('fetch_api',
  '调用外部 HTTP API（带超时与重试）',
  { url: z.string().url(), method: z.enum(['GET','POST']).default('GET'),
    headers: z.record(z.string()).optional(), body: z.string().optional() },
  async ({ url, method, headers, body }) => {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 10_000)   // 超时保护（呼应 Day 9）
    try {
      const res = await fetch(url, { method, headers, body, signal: ctrl.signal })
      const text = await res.text()
      return { content: [{ type: 'text', text: `${res.status}\n${text.slice(0, 4000)}` }] }
    } catch (e) {
      return { content: [{ type: 'text', text: String(e) }], isError: true }
    } finally { clearTimeout(t) }
  }
)
```

- **超时必加**：`AbortController` 防止 Agent 卡死在挂掉的外部服务（呼应 Day 9 HTTP）。
- **重试退避**：5xx/429 时指数退避，别一把梭（呼应 Day 12/22 工具重试）。
- **鉴权头从环境变量取**：`Authorization` 不要写进 prompt（见安全段）。

## 三、file_read / file_write（文件落地，呼应 Day 73）

```ts
const ROOT = '/srv/agent-workspace'            // 路径沙箱根目录
const safe = (p: string) => path.resolve(ROOT, p).startsWith(ROOT) // 防 ../ 穿越
server.tool('file_read', '读取工作区内文件（只读）', { path: z.string() },
  async ({ path: p }) => {
    if (!safe(p)) return { content: [{ type: 'text', text: '越权' }], isError: true }
    return { content: [{ type: 'text', text: await fs.readFile(path.join(ROOT, p), 'utf8') }] }
  })
server.tool('file_write', '写入工作区内文件', { path: z.string(), content: z.string() },
  async ({ path: p, content }) => {
    if (!safe(p)) return { content: [{ type: 'text', text: '越权' }], isError: true }
    await fs.writeFile(path.join(ROOT, p), content)
    return { content: [{ type: 'text', text: 'ok' }] }
  })
```

- **路径沙箱**：`safe()` 校验解析后仍在 `ROOT` 内，挡住 `../` 穿越（呼应 Day 73 路径沙箱）。
- **写操作标 `destructiveHint: true`**：提示客户端这是有副作用的工具，需护栏/确认（呼应 Day 80 annotations）。

## 四、密钥安全（红线）

- API Key 一律走**环境变量 / 服务端配置**，绝不出现在工具描述或 prompt 里——否则会被回显到日志或上下文。
- `fetch_api` 的鉴权头由 server 端注入，Agent 只传 `url`/`body`。

## 五、常见坑

1. **fetch 不超时**：外部挂死导致 Agent 卡住 → 必加 `AbortController`。
2. **明文密钥进 prompt**：泄露到日志/上下文 → 密钥走服务端。
3. **路径穿越**：`../etc/passwd` 读系统文件 → `safe()` 沙箱校验。
4. **写操作无 hint/无确认**：危险操作被无脑执行 → `destructiveHint: true` + 客户端护栏。
5. **返回不截断**：大响应撑爆上下文 → 截断 + 摘要。
6. **官方站不可访问**：MCP 协议规范中文 https://mcp-docs.cn/ ；Prisma 中文 https://prisma.nodejs.cn/

## 六、今日实践任务

1. 在 Day 80/81 服务器上加 `fetch_api`（超时+重试）与 `file_read`/`file_write`（路径沙箱 + 写标 hint）。
2. 密钥走环境变量；用 Day 77 客户端联调，让 Agent 能 `fetch_api` 取数据、`file_write` 落地产物。
3. **汇总 README「全部工具清单」**：calculator / codebase_search / fetch_web / query_db / fetch_api / file_read / file_write，标注各自只读/危险属性。
4. 复盘项目三工具集如何把 Day 9/12/30/48/49/73/80 的能力「产品化」为标准 MCP 协议。
5. 为 Day 83 做准备：写出「标准合规自查表」+ 一个 `listTools` 自动化测试脚本。

> 学习资料（国内可访问）：MCP 协议规范（中文） https://mcp-docs.cn/ ；Prisma 中文文档 https://prisma.nodejs.cn/docs
