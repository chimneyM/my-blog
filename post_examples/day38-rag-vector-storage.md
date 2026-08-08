---
id: "42"
title: "RAG 核心流程（三）：向量存储 VectorStore"
slug: "ai-agent-day38-rag-vector-storage"
date: "2026-08-08"
tags: ["AI Agent", "阶段三进阶", "RAG", "向量存储", "Pinecone", "Chroma", "Qdrant", "MemoryVectorStore"]
excerpt: "RAG 第三步：把嵌入向量持久化并建立索引，支持相似度检索。对比 MemoryVectorStore（开发首选）/ Chroma（本地持久化）/ Pinecone（托管云）三种向量库，跑通「加载→切分→嵌入→入库」全链路，并点出维度匹配、元数据过滤、中文索引等高频坑。"
readingTime: 14
---

## 回顾与今天的目标

- Day 36：文档加载 + 切分 → 得到 `chunks`。
- Day 37：向量嵌入 → 把每个 chunk 变成高维向量。
- **今天（Day 38）**：把「向量 + 原文 + metadata」存进**向量数据库（VectorStore）**，并建立索引以便后续相似度检索。

没有 VectorStore，每次检索都得重新算一遍全库相似度——既慢又贵。VectorStore 把向量索引化，让「给定查询向量，秒回 Top-K 最相关 chunk」成为可能。

## 1. VectorStore 统一接口

LangChain 用统一的 `VectorStore` 抽象，核心方法：
- `addDocuments(documents)` / `addVectors(vectors, documents)`：写入。
- `similaritySearch(query, k)`：按文本查询返回 Top-K 文档。
- `asRetriever()`：包装成 Retriever，供 Chain 直接调用（Day 39 用到）。

## 2. 三种向量库选型

| 方案 | 部署 | 持久化 | 适用 |
| --- | --- | --- | --- |
| **MemoryVectorStore** | 内存 | ❌ 重启即丢 | 本地开发、快速验证、单测 |
| **Chroma** | 本地/自建 | ✅ 本地磁盘 | 中小项目、私有化、免 API |
| **Pinecone** | 云端托管 | ✅ 云端 | 生产环境、海量数据、低运维 |

### 2.1 MemoryVectorStore（今天首选，零依赖）
```ts
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OpenAIEmbeddings } from '@langchain/openai'

const store = await MemoryVectorStore.fromDocuments(
  chunks,                       // Day36 的切分结果
  new OpenAIEmbeddings({ model: 'text-embedding-3-small' })
)
const hits = await store.similaritySearch('如何重置密码？', 3)
console.log(hits.map(h => h.pageContent))
```

### 2.2 Chroma（本地持久化）
```ts
import { Chroma } from '@langchain/community/vectorstores/chroma'

const store = await Chroma.fromDocuments(chunks, embeddings, {
  collectionName: 'my-kb',
  url: 'http://localhost:8000',   // 需先 docker run chromadb
})
```
重启后可用 `Chroma.fromExistingCollection(embeddings, { collectionName })` 重新加载。

### 2.3 Pinecone（云端托管）
```ts
import { PineconeStore } from '@langchain/community/vectorstores/pinecone'
import { Pinecone } from '@pinecone-database/pinecone'

const client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
const index = client.Index('my-kb')   // 维度须与嵌入模型一致(如1536)
const store = await PineconeStore.fromDocuments(chunks, embeddings, { pineconeIndex: index })
```
> Pinecone 文档：https://docs.pinecone.io/ （官方站，国内可能受限，可用社区镜像或搜索中文教程）

## 3. 完整「加载 → 切分 → 嵌入 → 入库」全链路

```ts
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'

const raw = await new PDFLoader('手册.pdf').load()
const chunks = await new RecursiveCharacterTextSplitter({
  chunkSize: 400, chunkOverlap: 50,
}).splitDocuments(raw)

const store = await MemoryVectorStore.fromDocuments(
  chunks,
  new OpenAIEmbeddings({ model: 'text-embedding-3-small' })
)
console.log(`✓ 已入库 ${chunks.length} 个 chunk`)
```

下一步（Day 39）：用 `store.similaritySearch` / `asRetriever()` 做检索，并把命中文本注入 Prompt 让 LLM 回答。

## 4. 常见坑

- **维度不匹配**：Pinecone 索引维度必须 = 嵌入模型维度（small=1536 / large=3072），建错索引会写入失败。
- **嵌入模型不一致**：建库和检索必须同一模型，否则向量空间错乱（Day 37 已强调）。
- **metadata 过滤**：向量库支持按 metadata 过滤（如 `source`、`date`），但 Chroma/Pinecone 的过滤语法不同，别混用。
- **MemoryVectorStore 不持久**：仅开发用，别在生产当数据库。
- **中文分词索引**：Chroma/Pinecone 对中文检索靠向量语义，无需分词；但混合检索（Day 40）时关键词部分要注意中文分词。
- **官方站不可访问**：Pinecone/Chroma 官方文档国内可能受限，优先用中文教程或社区镜像。

## 学习资料与网站（国内可访问镜像）
- LangChain JS 中文文档（向量存储）：https://js.langchain.com.cn/docs/
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html
- 掘金 Chroma 入门实战：https://juejin.cn/post/7242705497316053030
- Pinecone 官方文档：https://docs.pinecone.io/ （可能受限，可用社区镜像）
- Chroma 官方文档：https://docs.trychroma.com/ （可能受限，可用社区镜像）

## 学习建议
- 今天用 **MemoryVectorStore** 跑通全链路最省事，别一上来就折腾 Pinecone 账号。
- 入库后立刻 `similaritySearch` 几个问题，确认「问什么、回什么」合理，再往下走。
- 给 chunk 的 metadata 加上 `source` 字段，为 Day 63「引用溯源」提前铺路。

⏰ 预计学习时长：2.5 小时
