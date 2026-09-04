---
id: 69
title: "AI Agent 学习计划 - Day 65：项目一 - 测试与优化"
slug: "ai-agent-day65-project1-testing-optimization"
date: "2026-09-04"
tags: ["AI Agent", "实战项目", "项目一", "测试", "Vitest", "性能优化", "RAG", "学习计划"]
excerpt: "项目一第九步：用 Vitest 给 RAG 链路写单测（mock 掉真实 LLM/向量库），并做流式与检索的性能优化。让「能跑」变成「跑得稳、跑得快」，是项目从 demo 走向可用的一道分水岭。"
readingTime: 15
---

# Day 65：项目一 - 测试与优化

## 一、目标

Day 57-64 把项目一的 RAG 全链路（上传→切分→入库→检索→流式→引用→多轮）都打通了。今天做两件事让它从「能跑的 demo」变成「可信赖的产品」：

1. **测试**：用 Vitest 给 `retrieve`、切分、`/api/chat` 写单测，**mock 掉真实 LLM 与向量库**，避免又慢又烧钱又 flaky。
2. **优化**：降低流式首字延迟（TTFT）、缓存 Embedding、复用客户端单例、控制批量并发。

> 学习资料（国内可访问）：Vitest 中文文档 https://cn.vitest.dev/ ；Vitest 官方 https://vitest.dev/

## 二、为什么必须 mock 外部依赖

真实测试直接调 OpenAI + Pinecone 会：① 每次花真钱 ② 网络抖动导致随机失败 ③ 慢（一次几秒）。单测要的是「确定性 + 毫秒级」。

Vitest 配合 `ai` 包提供的 `MockLanguageModelV1` 可伪造模型；向量库用内存版 `MemoryVectorStore` 或手写 stub。

## 三、单测 1：retrieve 函数（用内存向量库）

```ts
// lib/retrieve.test.ts
import { describe, it, expect } from 'vitest'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OpenAIEmbeddings } from '@langchain/openai'
import { retrieve } from './retrieve' // 改造：retrieve 接收 store 参数便于注入

describe('retrieve', () => {
  it('返回 context 与 sources', async () => {
    const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })
    const store = await MemoryVectorStore.fromTexts(
      ['密码重置步骤：进入设置-安全-重置。', '退款政策：7天内可申请。'],
      [{ source: '手册A.md' }, { source: '手册B.md' }],
      embeddings,
    )
    const { context, sources } = await retrieve(store, '如何重置密码？')
    expect(context).toContain('重置')
    expect(sources[0].source).toBe('手册A.md')
  })

  it('无相关内容时 sources 为空', async () => {
    const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })
    const store = await MemoryVectorStore.fromTexts(['天气晴。'], [{ source: 'x' }], embeddings)
    const { sources } = await retrieve(store, '如何退款？')
    expect(sources.length).toBe(0)
  })
})
```

> 注：把 `retrieve` 改成「接收 vectorStore 参数」而非内部硬编码 new Pinecone，是**依赖注入**的关键一步，测试才好注入内存库（呼应项目工程化 Day 4）。

## 四、单测 2：/api/chat 路由（mock 模型）

```ts
// app/api/chat/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { MockLanguageModelV1 } from '@ai-sdk/provider/test'

// 伪造一个固定回字的模型
const mockModel = new MockLanguageModelV1({ defaultObjectGenerationModelId: 'mock' })

// mock './retrieve' 返回固定 sources，避免真检索
vi.mock('@/lib/retrieve', () => ({
  retrieve: async () => ({ context: 'FAKE_CTX', sources: [{ id: 1, source: 's.md', snippet: 'x' }] }),
}))

describe('POST /api/chat', () => {
  it('返回带 sources 的 UI Message Stream', async () => {
    const res = await POST(new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/plain') // UI stream 协议
  })
})
```

## 五、优化点

| 优化项 | 做法 | 收益 |
|--------|------|------|
| Embedding 缓存 | 相同 query/chunk 的向量结果记 Map 或 Redis | 省 API 调用、降延迟 |
| 客户端单例 | `pinecone` / `embeddings` 模块级 `let instance` 复用 | 避免每请求重连 |
| 批量 embedDocuments | 切分后一次性 `embedDocuments(chunks)` | 比逐个快数倍（Day 59） |
| 并发控制 | 批量入库用 `pLimit` 限并发（如 10） | 防触发 Pinecone 限流 |
| 降 TTFT | system 精简 + 提前 retrieve + 流式首字即吐 | 用户感知更快 |
| topK 调参 | 3–5 之间按命中率调 | 召回质量/噪声平衡 |

```ts
// lib/singleton.ts —— 客户端单例，防每请求重建
import { Pinecone } from '@pinecone-database/pinecone'
let _pc: Pinecone | null = null
export const getPinecone = () => (_pc ??= new Pinecone({ apiKey: process.env.PINECONE_API_KEY! }))
```

## 六、常见坑

- **测试直连真实 API**：又慢又烧钱又随机失败，CI 跑崩；务必 mock 模型与向量库。
- **`retrieve` 硬编码 `new Pinecone`**：无法注入测试用的内存库——先改成依赖注入（传 store）。
- **只测「返回 200」不断言内容**：要断言 `context` 含关键词、`sources` 非空，才有意义。
- **Embedding 不缓存**：相同问题反复 embed，浪费且拖慢。
- **每请求 new Pinecone 客户端**：连接开销累积，高并发直接挂；用单例。
- **过早优化**：先写测试锁住行为，再针对性优化，别一上来就搞复杂缓存。
- **官方站不可访问**：Vitest 文档用国内镜像 `cn.vitest.dev`，别硬连 `vitest.dev`（若受限）。

## 七、今日实践任务

1. 给 `retrieve` 做依赖注入改造（接收 vectorStore），写 2 个单测（命中 / 未命中）。
2. 用 `MockLanguageModelV1` + `vi.mock('@/lib/retrieve')` 给 `/api/chat` 写路由测试，断言返回 UI Message Stream。
3. 抽出 `getPinecone()` / `getEmbeddings()` 单例，验证连续请求不再重建客户端。
4. （进阶）给切分函数加测试，校验 chunkSize/overlap 边界；给 Embedding 加一层 Map 缓存。

> 明日（Day 66）做项目一部署与文档：Next.js 部署到 Vercel + 写 README，让项目一可对外交付。
