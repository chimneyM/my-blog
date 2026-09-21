---
id: 85
title: "AI Agent 学习计划 - Day 81：项目三 - 数据库查询工具"
slug: "ai-agent-day81-project3-db-tool"
date: "2026-09-20"
tags: ["AI Agent", "实战项目", "项目三", "MCP", "数据库工具", "Prisma", "安全", "学习计划"]
excerpt: "项目三 Day 81：用 Prisma 给 MCP 服务器加一个数据库查询工具 query_db，让 Agent 安全读数据。覆盖为什么 Agent 要能查库、Prisma 接入（schema/Client 单例/生成）、只读工具设计（表白名单/参数化/行数上限/分页）、返回结构化结果，并呼应 Day 48 数据库工具与 Day 54 长期记忆。"
readingTime: 14
---

# Day 81：项目三 - 数据库查询工具

## 一、目标

Day 80 我们暴露了 `calculator`/`codebase_search`/`fetch_web` 这类「计算/检索」工具。今天加一个**数据库查询工具 `query_db`**——让 Agent 能基于真实业务数据回答与操作（呼应 Day 48 数据库与文件操作工具、Day 54 长期记忆向量库）。

> 价值：Agent 不再只靠训练数据「瞎猜」，而是能查你系统的实时状态（订单、用户、日志）。但**数据库是高风险资源**，设计核心是「安全只读」。

## 二、Prisma 接入（TypeScript 友好）

```bash
npm i prisma @prisma/client
npx prisma init          # 生成 schema.prisma
npx prisma generate      # 生成类型安全的 Client
```

```ts
// src/db.ts —— Client 单例，避免连接泄漏（呼应 Day 80 连接单例思想）
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()
```

```prisma
// schema.prisma 示例
model User { id Int @id @default(autoincrement()) name String email String @unique }
model Post { id Int @id @default(autoincrement()) title String authorId Int }
```

## 三、query_db 工具设计（安全只读）

```ts
const ALLOWED = new Set(['User', 'Post'])        // 表白名单
server.tool('query_db',
  '按条件查询数据库（只读，限白名单表）',
  { table: z.enum(['User', 'Post']), where: z.record(z.any()).optional(), limit: z.number().int().positive().max(100).default(20) },
  async ({ table, where, limit }) => {
    if (!ALLOWED.has(table)) return { content: [{ type: 'text', text: '无权限' }], isError: true }
    const rows = await (prisma as any)[table.toLowerCase()].findMany({ where, take: limit })
    return { content: [{ type: 'text', text: JSON.stringify(rows) }] }
  }
)
```

- **表白名单 + 参数化**：不用字符串拼 SQL，杜绝注入（呼应 Day 48 SQL 查询）。
- **`limit` 上限 + 分页**：防止一次捞全表把上下文撑爆（呼应 Day 24 上下文窗口）。
- **只读**：连只读账号；`destructiveHint: false`、`readOnlyHint: true`（呼应 Day 80 annotations）。

## 四、常见坑

1. **暴露写权限**：Agent 一个误判就 `DELETE` 全表——务必只读账号 + 只注册读方法。
2. **SQL 注入**：手拼 SQL 致命；用 Prisma 参数化或严格白名单。
3. **返回过大**：全表返回撑爆上下文；强制 `limit` + 分页。
4. **Client 未单例**：每次调用 new 一个 → 连接池耗尽。
5. **console.log 敏感数据**：stdio 模式日志会进协议帧；走 `sendLoggingMessage` 并脱敏（呼应 Day 79/80）。
6. **官方站不可访问**：Prisma 中文 https://prisma.nodejs.cn/ ；MCP 协议规范中文 https://mcp-docs.cn/

## 五、今日实践任务

1. 初始化 Prisma，定义 `User`/`Post` 两个示例表，`generate` 出 Client。
2. 在 Day 80 服务器上加 `query_db`（表白名单 + `limit` 上限 + 只读 + `isError` 容错）。
3. 用 Day 77 客户端 `connectMCP` 联调，让 Agent 能 `query_db({table:'User', limit:5})` 拿到结果。
4. README 增补「数据库工具」说明（白名单表、只读策略）；复盘：Agent 查库相比 Day 54 向量记忆，各自适合什么场景？
5. 为 Day 82 的 `fetch_api`/`file_*` 工具预留接口。

> 学习资料（国内可访问）：Prisma 中文文档 https://prisma.nodejs.cn/docs ；MCP 协议规范（中文） https://mcp-docs.cn/
