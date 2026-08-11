---
id: "43"
title: "RAG 核心流程（四）：相似度检索与上下文注入"
slug: "ai-agent-day39-rag-retrieval-context"
date: "2026-08-09"
tags: ["AI Agent", "阶段三进阶", "RAG", "检索", "上下文注入", "Retriever"]
excerpt: "RAG 第四步：用 asRetriever / similaritySearch 把用户问题转成向量、召回 Top-K 相关 chunk，并把命中文本拼进 Prompt 让 LLM 基于证据回答。覆盖检索器接口、MMR 多样性、带分数检索、上下文窗口拼接与引用溯源，点出空召回、chunk 过大、上下文污染等高频坑。"
readingTime: 14
---

## 回顾与今天的目标

- Day 36：文档加载 + 切分 → 得到 `chunks`。
- Day 37：向量嵌入 → 把每个 chunk 变成高维向量。
- Day 38：向量存储 → 把「向量 + 原文 + metadata」落库建索引。
- **今天（Day 39）**：用 `store.asRetriever()` / `similaritySearch` 做**检索**，并把命中文本**注入 Prompt**，让 LLM 基于证据回答。这是 RAG 从「存」到「用」的关键一跃。

没有检索，向量库只是个孤岛；检索做不好，LLM 就会拿到无关文本产生幻觉。

## 1. 检索器（Retriever）统一接口

LangChain 用 `Retriever` 抽象「给查询、返回文档」这一动作，Chain 可以直接 `await retriever.invoke(query)`：

- `store.asRetriever({ k: 4 })`：把 VectorStore 包装成 Retriever，最常用。
- `retriever.invoke(query)`：返回 `Document[]`（含 `pageContent` 与 `metadata`）。
- `similaritySearch(query, k)`：VectorStore 自带方法，直接拿 Top-K 文档。

```ts
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OpenAIEmbeddings } from '@langchain/openai'

const store = await MemoryVectorStore.fromDocuments(
  chunks,
  new OpenAIEmbeddings({ model: 'text-embedding-3-small' })
)

// 方式一：asRetriever（推荐，可被 Chain 直接调用）
const retriever = store.asRetriever({ k: 4 })
const docs = await retriever.invoke('如何重置密码？')

// 方式二：similaritySearch
const docs2 = await store.similaritySearch('如何重置密码？', 4)
```

## 2. 检索进阶：MMR 多样性与带分数

- **MMR（最大边际相关）**：`asRetriever({ searchType: 'mmr', searchKwargs: { fetchK: 20, lambda: 0.5 } })`，先取 20 个相似结果，再贪心挑选「既相关又不重复」的 Top-K，避免召回内容高度雷同。
- **带分数检索**：`similaritySearchWithScore(query, k)` 返回 `[doc, score]`，可按阈值过滤低质量命中（余弦相似度越接近 1 越相关）。

```ts
const retriever = store.asRetriever({
  searchType: 'mmr',
  k: 4,
  searchKwargs: { fetchK: 20, lambda: 0.5 },
})
const hits = await store.similaritySearchWithScore('退款流程是什么？', 4)
hits.forEach(([doc, score]) => console.log(score.toFixed(3), doc.pageContent.slice(0, 40)))
```

## 3. 上下文注入：把命中文本拼进 Prompt

检索到的 chunk 要拼成「上下文」塞进 LLM 的 System/Human 消息，这是 RAG 的核心拼接逻辑：

```ts
import { ChatPromptTemplate } from '@langchain/core/prompts'

const prompt = ChatPromptTemplate.fromMessages([
  ['system', '你是知识库助手，只根据下面提供的「上下文」回答，不知道就说不知道。\n\n上下文：\n{context}'],
  ['human', '{question}'],
])

const docs = await retriever.invoke(question)
const context = docs.map((d, i) => `[${i + 1}] ${d.pageContent}`).join('\n\n')

const messages = await prompt.formatMessages({ context, question })
const answer = await chatModel.invoke(messages)
```

完整 RAG 链（LCEL）通常这样串联：`retriever → 拼接 context → prompt → model → parser`（Day 20 已学过顺序链）。

## 4. 引用溯源（为 Day 63 铺路）

把 `metadata.source` 一起拼进上下文，让 LLM 回答时带上出处：

```ts
const context = docs
  .map((d, i) => `[${i + 1}] (来源: ${d.metadata.source})\n${d.pageContent}`)
  .join('\n\n')
```

前端可据此渲染 SourceCard（Day 63 项目一引用溯源功能）。

## 5. 常见坑

- **空召回 / 召回无关**：查询向量与文档向量模型不一致（Day 37 强调），或 chunk 切得太碎丢失语义。
- **chunk 过大**：Top-K 拼起来超出上下文窗口，导致截断或成本飙升；按需调小 `k` 或 `chunkSize`。
- **上下文污染**：把不相关的 chunk 全塞进去，反而干扰 LLM 判断，MMR + 分数阈值能缓解。
- **query 未做改写**：用户口语化提问与文档书面语不匹配，可加 Query Transform（Day 40）。
- **中文召回弱**：纯向量检索对关键词（如专有名词、编号）不敏感，需要 Day 40 的混合检索补强。
- **官方站不可访问**：LangChain 检索文档国内可能受限，优先用中文镜像（见资料）。

## 学习资料与网站（国内可访问镜像）

- LangChain JS 中文文档（检索）：https://js.langchain.com.cn/docs/
- LangChain 中文文档（Retrievers）：https://langchain-doc.cn/
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html
- 掘金 RAG 检索增强实战：https://juejin.cn/post/7289762560219127866

## 学习建议

- 今天务必跑通「检索 → 拼接 → 回答」最小闭环，用几个真实问题验证召回质量。
- 给 chunk 的 metadata 保留 `source`，从 Day 39 起就养成「带出处回答」的习惯。
- 对比 `k=2` 与 `k=6` 的回答差异，体会上下文多少对准确性的影响。

⏰ 预计学习时长：2.5 小时
