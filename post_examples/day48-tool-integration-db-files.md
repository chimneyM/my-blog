---
id: 52
title: "AI Agent 学习计划 - Day 48：工具集成（三）数据库与文件操作工具"
slug: "ai-agent-day48-tool-integration-db-files"
date: "2026-08-18"
tags: ["AI Agent", "工具集成", "数据库", "文件操作", "Prisma", "学习计划"]
excerpt: "让 Agent 真正「读写世界」——数据库查询与文件操作工具把 LLM 从对话玩具变成能落地业务系统的生产力。今天覆盖 SQL 查询、API 调用封装、文件读写解析，以及用 Prisma 安全访问数据库。"
readingTime: 13
---

# Day 48：工具集成（三）— 数据库与文件操作工具

## 一、为什么 Agent 需要数据库与文件操作

搜索工具（Day 46）让 Agent「看世界」，代码执行（Day 47）让 Agent「动手算」，而**数据库与文件操作**让 Agent 能**持久化读写业务数据**：

- 业务系统真实价值都在数据库里（订单、用户、日志），Agent 必须能查
- 文件是最通用的数据载体（CSV/Excel/PDF/日志），Agent 要能读会写
- 这是企业级 Agent（如数据分析助手、运维助手）落地的必备能力
- 与前面工具组合：搜索拿外部情报 → 代码算结果 → 数据库存结论 → 文件导出报表

> 工具集的「三角」：看世界（搜索）+ 动手算（代码）+ 读写存（DB/文件）。

## 二、数据库查询工具

### 2.1 直接用 SQL（最灵活，但需防注入）

```ts
import { tool } from 'ai'
import { z } from 'zod'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const queryDb = tool({
  description: '对业务数据库执行只读 SQL 查询（SELECT），返回 JSON 结果',
  parameters: z.object({
    sql: z.string().describe('一条只读 SELECT 语句'),
  }),
  execute: async ({ sql }) => {
    // 安全护栏：强制只读
    if (!/^\s*select/i.test(sql)) throw new Error('仅允许 SELECT 查询')
    const { rows } = await pool.query(sql)
    return rows
  },
})
```

### 2.2 用 Prisma（类型安全，推荐生产）

Prisma 把数据库表映射成 TypeScript 类型，避免手写 SQL 拼接：

```ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const getOrders = tool({
  description: '按用户 ID 查询最近订单',
  parameters: z.object({
    userId: z.string(),
    limit: z.number().default(10),
  }),
  execute: async ({ userId, limit }) =>
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
})
```

- 优点：类型提示、自动防注入、迁移管理、多数据库适配（Postgres/MySQL/SQLite）
- 文档：https://www.prisma.io/docs ✅

## 三、文件操作工具

### 3.1 读文件（文本 / CSV / JSON 解析）

```ts
import { readFile, writeFile } from 'node:fs/promises'
import { parse } from 'csv-parse/sync' // CSV 解析

const readCsv = tool({
  description: '读取项目内 CSV 文件并解析为对象数组',
  parameters: z.object({ path: z.string() }),
  execute: async ({ path }) => {
    const text = await readFile(path, 'utf8')
    return parse(text, { columns: true, skip_empty_lines: true })
  },
})
```

### 3.2 写文件（导出报表 / 生成配置）

```ts
const writeReport = tool({
  description: '把分析结果写入 Markdown 报告文件',
  parameters: z.object({
    path: z.string(),
    content: z.string(),
  }),
  execute: async ({ path, content }) => {
    await writeFile(path, content, 'utf8')
    return { ok: true, path }
  },
})
```

## 四、与 RAG / 多 Agent 组合

- **RAG 补数据**：文件读取可作为 Day 36-39 RAG 的 Loader 来源（PDFLoader/CSVLoader）
- **多 Agent 落地**：Researcher Agent 查库 → Writer Agent 写文件 → Reviewer 校验（呼应 Day 45）
- **API 调用封装**：把第三方 REST 接口封成 tool（为 Day 49 外部 API 做铺垫）

## 五、常见坑

| 坑 | 后果 | 规避 |
|----|------|------|
| 直接拼接用户输入进 SQL | SQL 注入 | 用参数化查询 / Prisma |
| 工具拿到写权限（INSERT/DELETE） | 误删数据 | 默认只读，写操作加人工确认 |
| 读超大文件进上下文 | 爆 token | 流式/分页/只取头部 |
| 文件路径未做白名单 | 越权读 `/etc/passwd` | 限制根目录 + 路径校验 |
| 写文件覆盖原文件 | 数据丢失 | 写新文件名 + 备份 |
| 官方站不可访问 | 卡文档 | 用国内镜像 prisma.nodejs.cn |

## 六、今日实践任务

1. 用 Prisma 连接一个 SQLite 库，封装 2 个查询 tool
2. 写一个读 CSV → 用代码（Day 47）算汇总 → 写 Markdown 报告 的端到端链
3. 给数据库 tool 加「只读 + 人工确认写」护栏，写进 README

🔗 学习资料（国内可访问镜像）：
- Prisma 官方文档：https://www.prisma.io/docs ✅
- Prisma 中文社区：https://prisma.nodejs.cn/ ✅
- LangChain JS 中文：https://js.langchain.com.cn/docs/ ✅
- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅
