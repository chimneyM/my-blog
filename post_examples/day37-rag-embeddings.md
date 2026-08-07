---
id: "41"
title: "RAG 核心流程（下）：向量嵌入 Embeddings"
slug: "ai-agent-day37-rag-embeddings"
date: "2026-08-07"
tags: ["AI Agent", "阶段三进阶", "RAG", "Embeddings", "向量嵌入", "OpenAI Embeddings", "语义检索"]
excerpt: "RAG 第二步：把切分后的文本变成高维语义向量。搞懂 Embedding 原理（文本→向量，语义相近则向量相近）、OpenAI Embeddings 模型选择、embedQuery vs embedDocuments 的区别、本地嵌入模型（HuggingFaceTransformers）的隐私优势，以及维度匹配、中英文选型等高频坑。"
readingTime: 14
---

## 回顾与今天的目标

昨天（Day 36）我们把文档切成了小块 chunk。今天进入 RAG 链路的第二步：**把文本变成向量（Embedding）**。

没有这一步，chunk 只是一堆字符串；有了它，计算机才能「理解」语义、做相似度检索。

## 1. Embedding 是什么

Embedding 模型把一个 token / 一段文本映射成一个**高维浮点向量**（如 1536 维）：
- 语义相近的文本 → 向量在空间中距离更近（余弦相似度高）。
- 语义无关的文本 → 向量距离远。

```
"猫喜欢鱼"  → [0.12, -0.34, 0.88, ...]  (1536维)
"狗爱吃肉"  → [0.10, -0.30, 0.85, ...]  (距离很近)
"今天天气晴" → [0.91, 0.22, -0.44, ...] (距离很远)
```

这让「用户问题」和「知识库段落」能在同一个向量空间里比对，找最相关的那块。

## 2. OpenAI Embeddings

```ts
import { OpenAIEmbeddings } from '@langchain/openai'

const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',  // 1536维，便宜够用
  // model: 'text-embedding-3-large' // 3072维，更准但更贵
})
```

**两个核心方法：**
- `embedDocuments(texts: string[])` → 批量嵌入文档 chunk（用于建库）。
- `embedQuery(text: string)` → 嵌入用户查询（用于检索）。

```ts
const vectors = await embeddings.embedDocuments(chunks.map(c => c.pageContent))
const queryVec = await embeddings.embedQuery('如何重置密码？')
```

## 3. 本地嵌入模型（隐私 / 免 API）

如果不想把数据发给 OpenAI，可以用本地模型（基于 `@langchain/community` + `transformers.js` 或 Ollama）：

```ts
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers'

const localEmbeddings = new HuggingFaceTransformersEmbeddings({
  model: 'Xenova/text-embedding-all-MiniLM-L6-v2',  // 384维，本地跑
})
```

优点：数据不出本机、无调用成本；缺点：精度通常低于 OpenAI 大模型、首次下载模型较慢。

## 4. 维度与选型经验

| 模型 | 维度 | 场景 |
| --- | --- | --- |
| text-embedding-3-small | 1536 | 默认首选，性价比高 |
| text-embedding-3-large | 3072 | 对精度敏感、语料专业 |
| all-MiniLM-L6-v2（本地） | 384 | 本地/隐私/原型验证 |

> ⚠️ **建库和检索必须用同一个模型、同一维度**，否则向量空间不一致，相似度计算毫无意义。

## 5. 完整「切分 → 嵌入」串联

```ts
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from '@langchain/openai'

const rawDocs = await new PDFLoader('手册.pdf').load()
const chunks = await new RecursiveCharacterTextSplitter({
  chunkSize: 400, chunkOverlap: 50,
}).splitDocuments(rawDocs)

const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })
const vectors = await embeddings.embedDocuments(chunks.map(c => c.pageContent))
console.log(`已为 ${vectors.length} 个 chunk 生成向量，每维 ${vectors[0].length}`)
```

下一步（Day 38）：把 `vectors` 存进向量数据库（MemoryVectorStore / Chroma / Pinecone），做相似度检索。

## 6. 常见坑

- **查询与文档用了不同模型**：`embedQuery` 和 `embedDocuments` 必须同源，否则检索全错。
- **维度不匹配**：向量库建表维度要和实际模型一致（如 1536），否则写入报错。
- **中文选模**：中文语义建议用 text-embedding-3 系列或专门中文模型（如 bge-large-zh），纯英文小模型对中文效果差。
- **批量超限**：`embedDocuments` 一次别塞太多，注意 OpenAI 的 token / 条数限制，分批并发更稳。
- **官方站不可访问**：OpenAI 文档用国内镜像 docsopen.ai 替代。

## 学习资料与网站（国内可访问镜像）
- OpenAI Embeddings 中文文档（社区版）：https://docsopen.ai/guides/embeddings
- LangChain JS 中文文档：https://js.langchain.com.cn/docs/
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html
- 掘金 向量嵌入入门：https://juejin.cn/post/7289762560219127866

## 学习建议
- 今天动手跑通 `embedDocuments` + `embedQuery`，把两个向量算一下余弦相似度（可用 `computeCosineSimilarity`），亲眼验证「语义相近 → 距离近」。
- 对比「用 small 模型」和「本地 MiniLM」对同一句中文的检索结果差异，建立模型选型直觉。
- 别急着接向量库，先把「文本→向量」这一步玩熟。

⏰ 预计学习时长：2.5 小时
