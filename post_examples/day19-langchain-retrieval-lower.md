---
id: "23"
title: "AI Agent 学习计划 Day 19：LangChain.js Retrieval（下）— 嵌入（Embeddings）与向量存储"
slug: "ai-agent-day19-langchain-retrieval-lower"
date: "2026-07-20"
tags: ["AI Agent", "LangChain", "RAG", "Embeddings", "Vector Store", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第十九天。完成 Retrieval 第二步：把切好的文本块用 Embedding 模型变成向量，并存入向量数据库。覆盖 Embedding 原理、OpenAI/本地嵌入、余弦相似度、MemoryVectorStore 与 Chroma/Pinecone 等主流向量库，以及完整「嵌入 + 入库」实战。"
readingTime: 33
---

# AI Agent 学习计划 Day 19：LangChain.js Retrieval（下）

> 📅 日期：2026-07-20  
> 🎯 阶段二：核心框架（Day 15-35）  
> 📊 学习进度：Day 19 / 84（22.6%）

## 前言

昨天我们把长文档切成了语义完整的 chunk（小块）。但机器并不「懂」这些文字——它只能比较数字。今天要做的，就是**把文本变成一串数字（向量）**，让「意思相近」的文本在向量空间里「距离更近」。这就是 Embeddings（嵌入）+ 向量存储，也是 RAG 检索的核心。

---

## 一、Embedding 是什么

```text
文本：  "公司年假是几天？"
Embedding → [0.12, -0.45, 0.88, ..., 0.03]   (1536 维向量)

文本：  "员工休假制度规定..."
Embedding → [0.11, -0.41, 0.85, ..., 0.05]   (语义相近 → 向量也相近)

文本：  "今天天气真好"
Embedding → [0.92, 0.33, -0.12, ..., -0.77]  (语义远 → 向量也远)
```

Embedding 模型（如 OpenAI `text-embedding-3-small`）把任意文本映射到一个高维向量空间，**语义相似的文本，向量余弦距离更近**。检索时我们就「找最近的几个向量」，等价于「找最相关的几段文字」。

---

## 二、在 LangChain.js 中使用 Embeddings

### 2.1 OpenAI Embeddings（最常用）

```typescript
import { OpenAIEmbeddings } from '@langchain/openai'

const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small', // 1536 维；large 为 3072 维
  apiKey: process.env.OPENAI_API_KEY,
})

// 单条
const vec = await embeddings.embedQuery('公司年假是几天？')
// 批量（切块用 embedDocuments，更便宜）
const vecs = await embeddings.embedDocuments(['块1', '块2', '块3'])
```

> `embedQuery` 用于用户提问，`embedDocuments` 用于文档块（批量有价格优惠）。

### 2.2 本地 / 开源嵌入（隐私、免 API）

```typescript
import { HuggingFaceTransformersEmbeddings } from '@langchain/community'

const embeddings = new HuggingFaceTransformersEmbeddings({
  model: 'Xenova/bge-small-zh-v1.5', // 中文友好，本地跑
})
```

> 适合内网/隐私场景；首次会下载模型，速度比 API 慢但零成本。

---

## 三、向量存储 Vector Store

嵌入后的向量 + 原文，需要存进**向量数据库**，才能高效做近邻检索。LangChain 用统一接口 `VectorStore`：

```typescript
interface VectorStore {
  addDocuments(docs)          // 入库（内部自动 embed）
  similaritySearch(query, k)  // 按相似度取前 k 条
  asRetriever()                // 转成 Retriever，接入链
}
```

### 3.1 内存版 MemoryVectorStore（开发/演示首选）

```typescript
import { MemoryVectorStore } from 'langchain/vectorstores/memory'

const vectorStore = await MemoryVectorStore.fromDocuments(
  chunks,        // 昨天切好的 Document[]
  embeddings     // 上面的 embeddings 实例
)

const results = await vectorStore.similaritySearch('年假几天？', 3)
results.forEach(r => console.log(r.pageContent, r.metadata))
```

> 内存存储，重启即清空，**最适合本地跑通流程**，无需装数据库。

### 3.2 Chroma（本地持久化）

```typescript
import { Chroma } from '@langchain/community/vectorstores/chroma'

const vectorStore = await Chroma.fromDocuments(chunks, embeddings, {
  collectionName: 'handbook',
  url: 'http://localhost:8000', // 本地 Chroma 服务
})
```

### 3.3 Pinecone（托管云，生产级）

```typescript
import { PineconeStore } from '@langchain/community/vectorstores/pinecone'
import { Pinecone } from '@pinecone-database/pinecone'

const client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
const index = client.Index('handbook')

const vectorStore = await PineconeStore.fromDocuments(chunks, embeddings, {
  pineconeIndex: index,
})
```

> 选型：开发用 `MemoryVectorStore`；要持久化本地用 `Chroma`；要弹性扩展/托管用 `Pinecone`/`Qdrant`。

---

## 四、完整实战：加载 → 切分 → 嵌入 → 入库 → 检索

```typescript
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'

// 1. 加载
const rawDocs = await new PDFLoader('./docs/handbook.pdf').load()

// 2. 切分
const chunks = await new RecursiveCharacterTextSplitter({
  chunkSize: 600,
  chunkOverlap: 80,
}).splitDocuments(rawDocs)

// 3. 嵌入 + 入库
const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })
const store = await MemoryVectorStore.fromDocuments(chunks, embeddings)

// 4. 检索
const hits = await store.similaritySearch('年假有几天？', 3)
console.log(hits[0].pageContent) // 命中「休假制度」相关块
```

> 这就是 RAG 的「写」侧（indexing）。Day 20 我们会把 `store.asRetriever()` 接入 Chain，实现「用户提问 → 检索 → 注入 Prompt → 模型作答」的完整闭环。

---

## 五、相似度怎么算（了解即可）

向量库默认用**余弦相似度**：

```
cosine(A, B) = (A · B) / (|A| × |B|)
```

值域 [-1, 1]，越接近 1 越相似。`similaritySearch` 内部即按此排序取 top-k。

---

## 六、常见坑

1. **查询用 `embedQuery`、文档用 `embedDocuments`**：混用会导致向量空间不一致，检索变差。
2. **Embedding 模型与检索模型要一致**：入库和查询必须用同一个 embedding 模型，否则语义空间错位。
3. **中文选对模型**：OpenAI `text-embedding-3-small` 支持多语言；本地可选 `bge-small-zh` 等中文优化模型。
4. **向量维度要匹配**：`text-embedding-3-small` = 1536 维，建库（如 Pinecone）时索引维度须一致。
5. **官方站不可访问**：用 `js.langchain.com.cn` / `langchain.nodejs.cn` 中文镜像。

---

## 七、学习资料

以下站点均已验证可访问（国内镜像 / 中文）：

| 资源 | 链接 | 说明 |
|------|------|------|
| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | 总入口，含 Vector Stores 章节 |
| LangChain 中文文档 | https://langchain-doc.cn/ | 概念与 How-to 中文版 |
| LangChain 中文网 | https://langchain.nodejs.cn/docs/concepts/ | 概念文档（含 Embeddings） |
| js.langchain.ac.cn 向量存储 | https://js.langchain.ac.cn/docs/integrations/vectorstores/ | 各向量库集成列表 |
| OpenAI Embeddings 指南（中文镜像） | https://docsopen.ai/guides/embeddings/ | Embeddings 用法 |
| 菜鸟教程 AI Agent 教程 | https://www.runoob.com/ai-agent/ai-agent-tutorial.html | 入门总览 |

---

## 八、明日预告

**Day 20：LangChain.js Chains（上）— 顺序链与 LLM 链**

检索原料齐了，下一步是把「检索 → 拼接 Prompt → 调用模型」编排成一个**可复用、可组合的链（Chain）**。我们学 LCEL 的 `RunnableSequence`、把 Retriever 接进 Prompt、写出第一个完整的 RAG 问答链。

> 🚀 Day 19 完成！你已打通 RAG 的「写」侧（加载 → 切分 → 嵌入 → 入库）。明天，我们用 Chain 把它们串成能回答问题的 Agent。
