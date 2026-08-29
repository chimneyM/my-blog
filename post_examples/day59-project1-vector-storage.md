---
id: 63
title: "AI Agent 学习计划 - Day 59：项目一 - 向量化存储"
slug: "ai-agent-day59-project1-vector-storage"
date: "2026-08-29"
tags: ["AI Agent", "实战项目", "项目一", "向量化", "Embeddings", "Pinecone", "RAG", "学习计划"]
excerpt: "项目一第三步：把 Day 58 切好的 chunk 用 OpenAI Embeddings 转成向量，写入 Pinecone 向量库。这是 RAG 链路的核心——让知识可被语义检索。今天覆盖 Embedding 概念、OpenAI 嵌入模型选型、Pinecone 索引创建与 upsert、以及国内可访问的替代方案。"
readingTime: 16
---

# Day 59：项目一 - 向量化存储

## 一、目标

在 Day 58 完成「文档上传 + 自动切分」后，今天实现 **向量化存储**：把切好的 chunk 用 Embedding 模型转成高维向量，写入向量数据库（Pinecone），让知识库可以被语义检索。

> 切分（Day 58）解决「怎么拆」，今天解决「怎么存」——把文本变成向量，才能做相似度检索。下一步 Day 60 就基于这个向量库做语义检索。

整体链路：**文档 → 切分(Day58) → 嵌入(今天) → 向量库(今天) → 检索(Day60) → 注入 Prompt(Day60)**。

## 二、Embedding 是什么

Embedding 是把文本映射成一组浮点数的过程：

```ts
"今天天气不错"  ──Embedding模型──▶  [0.12, -0.34, 0.88, ...]  // 1536 维向量
```

- 语义相近的文本，向量在空间中距离也近（余弦相似度接近 1）。
- 这是 RAG 能「按意思找文档」的根本原因，而非关键词匹配。

```ts
import { OpenAIEmbeddings } from '@langchain/openai'

const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small', // 1536 维，性价比高
  apiKey: process.env.OPENAI_API_KEY,
})

// 单条查询向量
const queryVec = await embeddings.embedQuery('如何重置密码？')
// 批量文档向量（比逐条 embedDocuments 更省 token、更快）
const docVecs = await embeddings.embedDocuments(chunks.map(c => c.pageContent))
```

> 注意：`embedQuery` 用于用户问题，`embedDocuments` 用于文档 chunk，二者必须用**同一个模型**，否则向量空间不一致，相似度计算无意义。

## 三、OpenAI 嵌入模型选型

| 模型 | 维度 | 特点 | 场景 |
|------|------|------|------|
| `text-embedding-3-small` | 1536 | 便宜、快、效果够用 | 绝大多数知识库首选 |
| `text-embedding-3-large` | 3072 | 精度更高 | 对召回要求极高的场景 |
| `text-embedding-ada-002` | 1536 | 旧版 | 兼容老项目 |

> 选型经验：先用 `small` 跑通整个链路，效果不够再换 `large`。维度要和 Pinecone 索引创建时的 `dimension` 严格一致。

## 四、Pinecone 向量库

Pinecone 是托管向量数据库，免运维、支持相似度检索与 metadata 过滤。

### 1. 初始化客户端与索引

```ts
import { Pinecone } from '@pinecone-database/pinecone'

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })

// 首次创建索引（dimension 必须和 Embedding 模型一致）
const indexName = 'kb-demo'
if (!(await pc.listIndexes()).indexes?.some(i => i.name === indexName)) {
  await pc.createIndex({
    name: indexName,
    dimension: 1536,            // text-embedding-3-small
    metric: 'cosine',           // 余弦相似度
    spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
  })
}
const index = pc.index(indexName)
```

### 2. 把 chunk 写入向量库（upsert）

```ts
import { v4 as uuid } from 'uuid'

const vectors = await Promise.all(
  chunks.map(async (doc, i) => ({
    id: uuid(), // 每个 chunk 唯一 id
    values: await embeddings.embedQuery(doc.pageContent),
    metadata: {
      text: doc.pageContent,
      source: doc.metadata.source, // 为 Day 63 引用溯源预留
      chunkIndex: i,
    },
  }))
)

await index.upsert(vectors)
```

> `metadata` 里存原文 `text` 和 `source`：检索时直接拿回原文拼进 Prompt，无需再回查原始文件。

## 五、完整 ingest 链路（Day58 + Day59 串起来）

```ts
// app/api/ingest/route.ts（整合切分 + 嵌入 + 入库）
export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file') as File
  const buffer = Buffer.from(await file.arrayBuffer())

  // 1. 加载（复用 Day 58 Loader）
  const docs = await loadDocument(file.name, buffer)
  // 2. 切分（Day 58）
  const chunks = await splitDocuments(docs)
  // 3. 嵌入 + 入库（今天）
  const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
  const index = pc.index('kb-demo')

  const vectors = await Promise.all(chunks.map(async (doc, i) => ({
    id: uuid(),
    values: await embeddings.embedQuery(doc.pageContent),
    metadata: { text: doc.pageContent, source: doc.metadata.source, chunkIndex: i },
  })))
  await index.upsert(vectors)

  return Response.json({ ok: true, count: vectors.length })
}
```

## 六、国内可访问的替代方案（无需海外 Key / 网络）

Pinecone 是海外 SaaS，若网络或 Key 受限，可用以下国内可访问替代：

- **本地向量库 Chroma / MemoryVectorStore**：完全本地运行，免 API Key，开发调试首选（参考 Day 38）。
  - LangChain 中文文档：https://js.langchain.com.cn/docs/
- **本地 Embedding 模型**：`HuggingFaceTransformersEmbeddings`（bge-small-zh 等中文模型）免 OpenAI Key，隐私友好。
  - 菜鸟教程 AI Agent 实战：https://www.runoob.com/ai-agent/ai-agent-tutorial.html
- **国内大模型 Embedding API**：百度文心、阿里通义千问、智谱 GLM 均提供 Embedding 接口与中文文档。

## 七、常见坑

1. **维度不匹配**：Pinecone 索引 `dimension` 和 Embedding 模型维度必须一致，否则 upsert 报错。
2. **查询/文档用了不同 Embedding 模型**：相似度计算失效，召回全错。
3. **metadata 只存 id 不存 text**：检索回来还要再查原文，多一次 IO；建议直接把 `text` 放 metadata。
4. **批量过大**：一次 upsert 上千条可能超时，按 100 条/批分批。
5. **忘了 `source` 字段**：Day 63 引用溯源拿不到出处。
6. **官方站不可访问**：OpenAI / Pinecone 官方文档按用户偏好用国内镜像（js.langchain.com.cn / 菜鸟教程）替代。
7. **Key 硬编码 / 泄露**：必须走 `process.env`，不要写进前端代码。

## 八、今日实践任务

1. 在 Day 58 工程里接入 `OpenAIEmbeddings` + `Pinecone`，打通「上传 → 切分 → 嵌入 → upsert」全链路。
2. 上传一份自己的文档（PDF/MD），打印 `upsert` 返回的 chunk 数量，确认入库成功。
3. 用 `index.query({ topK: 3, vector: 查询向量 })` 手动验证能按语义召回相关 chunk（为 Day 60 探路）。
4. 若海外 Key 受限，改用 Chroma 本地向量库 + 本地 Embedding 模型重跑一遍，对比效果。

---

> 进度：Day 59 / 84（70.2%）。下一步 Day 60：语义检索实现（相似度检索 + 上下文注入到 Prompt）。
