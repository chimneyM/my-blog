---
id: "44"
title: "RAG 优化：混合检索与 Reranking"
slug: "ai-agent-day40-rag-hybrid-reranking"
date: "2026-08-10"
tags: ["AI Agent", "阶段三进阶", "RAG", "混合检索", "Reranking", "Query Transform"]
excerpt: "RAG 第五步优化：单一向量检索召回不稳，引入「关键词(BM25) + 向量」混合检索提升覆盖，再用 Reranker 对候选重排序挑出最相关 Top-K，并用 Query Transform 做查询改写。覆盖 EnsembleRetriever、CrossEncoder 重排、多查询扩展与常见问题定位。"
readingTime: 15
---

## 回顾与今天的目标

- Day 36-38：切分 → 嵌入 → 入库，完成 RAG 的「写」链路。
- Day 39：相似度检索 + 上下文注入，完成「读」链路，跑通最小 RAG。
- **今天（Day 40）**：优化检索质量。纯向量检索对**专有名词、编号、罕见词**不敏感，容易漏召回。我们用**混合检索（Hybrid）+ Reranking（重排序）** 补强，并引入 **Query Transform（查询改写）**。

> 工业级 RAG 的召回率，往往不是靠换更好的嵌入模型，而是靠「混合检索 + 重排」这套组合拳。

## 1. 为什么需要混合检索

| 检索方式 | 擅长 | 短板 |
| --- | --- | --- |
| 向量检索（Dense） | 语义相似（"怎么退钱" ↔ "退款流程"） | 关键词、编号、专有名词易漏 |
| 关键词检索（BM25/Sparse） | 精确匹配术语、编号、API 名 | 同义改写无能为力 |

**混合检索 = 向量检索 ∪ 关键词检索**，两者结果融合（RRF 倒数排名融合）后取并集，兼顾语义与字面。

```ts
import { EnsembleRetriever } from 'langchain/retrievers/ensemble'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
// BM25 可用 @langchain/community 的 BM25Retriever 或本地 lucene

const vectorRetriever = vectorStore.asRetriever({ k: 6 })
const keywordRetriever = new BM25Retriever({ k: 6 }) // 伪代码示意

const ensemble = new EnsembleRetriever({
  retrievers: [vectorRetriever, keywordRetriever],
  weights: [0.6, 0.4], // 向量权重略高
})
const hits = await ensemble.invoke('API key 过期 403 报错怎么处理？')
```

## 2. Reranking（重排序）

混合检索返回的候选可能较多且噪声大，**Reranker（通常是 Cross-Encoder）** 对「query + 每个候选」逐对打分，重新排序后只保留最相关的 Top-K（如 3-5 个），显著提升精度。

```ts
import { CohereRerank } from '@langchain/cohere' // 或本地 CrossEncoder
// 伪代码示意重排流程
const candidates = await ensemble.invoke(question)       // 取 20 个候选
const reranked = await cohereRerank.rank(question, candidates, { topN: 4 })
const context = reranked.map(d => d.pageContent).join('\n\n')
```

> Reranker 比嵌入模型更「懂」相关性，但慢且贵，所以只在召回后的少量候选上跑。

## 3. Query Transform（查询改写）

用户提问往往模糊、省略上下文，直接检索效果差。常见三种改写：

- **Multi-Query（多查询扩展）**：让 LLM 把一个问题拆成多个不同角度的子查询，分别检索后合并。
- **Step-back（退一步）**：生成更抽象的上位问题，捕捉宏观上下文。
- **Rewrite（重写）**：结合对话历史把指代（"它"、"这个方法"）补全成完整查询。

```ts
// Multi-Query 示意：用 LLM 生成 3 个变体问题
const variants = await multiQueryChain.invoke(question) // ["原问题", "角度2", "角度3"]
const allDocs = (await Promise.all(variants.map(q => retriever.invoke(q)))).flat()
const deduped = deduplicate(allDocs)
```

## 4. 评估与问题定位

- **召回率不足**：看是否漏了关键词 → 加 BM25 混合检索。
- **精度不足 / 答非所问**：候选太多噪声 → 加重排、降 topN。
- **多跳问题答不出**：单 chunk 信息不全 → 用 Multi-Query 或多文档拼接。
- **中文专有名词弱**：混合检索的 BM25 部分对中文需先做分词（如 jieba）。

## 5. 常见坑

- **融合权重拍脑袋**：weights 需根据数据调，向量 0.5/关键词 0.5 是起点。
- **Reranker topN 过大**：重排后还留 10 个，上下文污染依旧。
- **BM25 未做中文分词**：中文连写导致关键词匹配失效。
- **Query Transform 过度扩展**：生成太多子查询，成本与噪声双增。
- **只在训练集调优**：用真实用户 query 评估，别只看样例。
- **官方站不可访问**：Cohere/LangChain 高级检索文档国内可能受限，优先中文镜像。

## 学习资料与网站（国内可访问镜像）

- LangChain JS 中文文档（高级检索）：https://js.langchain.com.cn/docs/
- LangChain 中文文档：https://langchain-doc.cn/
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html
- 掘金 RAG 混合检索与重排序实战：https://juejin.cn/post/7348766635905409056

## 学习建议

- 先确认纯向量检索的短板（找个带编号/术语的问题试），再引入混合检索，体感更直观。
- Reranker 优先用托管 API（Cohere）跑通流程，再考虑本地 CrossEncoder 降本。
- 把 Query Transform 当成「可选增强」，主链路稳定后再加，避免复杂度爆炸。

⏰ 预计学习时长：3 小时
