---
id: 64
title: "AI Agent 学习计划 - Day 60：项目一 - 语义检索实现"
slug: "ai-agent-day60-project1-semantic-retrieval"
date: "2026-08-30"
tags: ["AI Agent", "实战项目", "项目一", "语义检索", "RAG", "上下文注入", "Pinecone", "学习计划"]
excerpt: "项目一第四步：基于 Day 59 写入的向量库做相似度检索，并把召回的 chunk 注入 Prompt 让 LLM 基于证据回答。这是 RAG 的「检索→生成」闭环关键一步，直接决定问答质量。"
readingTime: 16
---

# Day 60：项目一 - 语义检索实现

## 一、目标

在 Day 59 把 chunk 写入向量库后，今天实现 **语义检索**：把用户问题 Embedding 后，在 Pinecone 中找最相似的 chunk，再把原文注入 Prompt 让 LLM 基于证据回答。

> 这是 RAG「检索 → 生成」闭环的关键一步。检索质量直接决定问答上限——召回不到，LLM 再强也只能瞎编。

整体链路：**用户问题 → embedQuery → Pinecone query → 召回 chunk → 拼接上下文 → Prompt → LLM 回答（Day61 流式）**。

## 二、相似度检索（Pinecone query）

```ts
import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
const index = pc.index('kb-demo')
const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })

// 1. 把用户问题转成向量（必须和入库同一模型）
const queryVec = await embeddings.embedQuery('如何重置密码？')

// 2. 检索 Top-K 最相似 chunk
const res = await index.query({
  topK: 4,
  vector: queryVec,
  includeMetadata: true, // 带回 metadata.text / source
})

// 3. 取出原文
const contexts = res.matches.map(m => m.metadata!.text as string)
const sources = res.matches.map(m => m.metadata!.source as string)
```

> `topK` 常见取值 3-6：太小召回不全，太大引入噪声、撑爆上下文、增加成本。

## 三、上下文注入（Context Injection）

把召回的 chunk 拼成一段上下文，塞进 Prompt 的 `{context}` 占位符：

```ts
import { ChatPromptTemplate } from '@langchain/core/prompts'

const prompt = ChatPromptTemplate.fromMessages([
  ['system', `你是知识库助手，只根据下面提供的上下文回答，不知道就说不知道，不要编造。
上下文：
{context}`],
  ['human', '{question}'],
])

const contextText = contexts.join('\n\n---\n\n')

const chain = prompt.pipe(model).pipe(new StringOutputParser())
const answer = await chain.invoke({ context: contextText, question: '如何重置密码？' })
```

> 关键约束「不知道就说不知道，不要编造」能显著降低幻觉；这是 RAG 相比直接问 LLM 的核心价值。

## 四、用 LangChain VectorStore 简化（推荐）

Day 38 学过的 `VectorStoreRetriever` 能一行封装「query → 检索 → 拼上下文」：

```ts
import { PineconeStore } from '@langchain/pinecone'

const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index })
const retriever = vectorStore.asRetriever({ k: 4 }) // 自动 embedQuery + query

const docs = await retriever.invoke('如何重置密码？')
const contextText = docs.map(d => d.pageContent).join('\n\n---\n\n')
// docs[i].metadata.source 即为溯源信息（Day 63 用）
```

> `asRetriever({ k })` 把检索器标准化，可直接接进 Day 20 学的 LCEL 链，复用率高。

## 五、带分数过滤（提升精度）

Pinecone `query` 返回 `score`（余弦相似度 0-1），可设阈值过滤低相关内容：

```ts
const res = await index.query({ topK: 6, vector: queryVec, includeMetadata: true })
const good = res.matches.filter(m => (m.score ?? 0) > 0.75) // 只保留高相关
if (good.length === 0) {
  // 召回不足 → 直接告知用户知识库未覆盖，避免硬答
}
```

## 六、常见坑

1. **查询与入库用了不同 Embedding 模型**：向量空间不一致，score 全低、召回错乱。
2. **topK 过大**：噪声 chunk 稀释答案，还浪费 token。
3. **漏掉「不知道就说不知道」约束**：LLM 拿不到证据时硬编，幻觉率飙升。
4. **chunk 太大**：单个 chunk 塞进上下文占满窗口，挤压真正相关片段。
5. **上下文与问题顺序错**：把 context 放 system、question 放 human，别反。
6. **中文召回弱**：中文文档建议用中文 Embedding 模型（bge-zh），或 `text-embedding-3-small` 实测足够时再用。
7. **官方站不可访问**：OpenAI / Pinecone 官方文档按用户偏好用国内镜像（js.langchain.com.cn / 菜鸟教程）替代。

## 七、今日实践任务

1. 在 Day 59 工程上加 `/api/retrieve`：接收问题 → embedQuery → Pinecone query → 返回召回 chunk 与 sources。
2. 用 Day 59 上传的文档提问，确认能召回相关 chunk（打印 `score` 观察相关性）。
3. 组装 Prompt 让 LLM 基于上下文回答，对比「有 RAG」vs「无 RAG」的回答差异，体会检索价值。
4. 调 `topK`（3/4/6）与 `score` 阈值，记录召回质量变化。

---

> 进度：Day 60 / 84（71.4%）。下一步 Day 61：流式对话 API（把今天的检索链接入 Vercel AI SDK 的 streamText，实现边检索边生成）。
