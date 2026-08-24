---
id: 58
title: "AI Agent 学习计划 - Day 54：记忆系统（三）长期记忆"
slug: "ai-agent-day54-memory-long-term"
date: "2026-08-24"
tags: ["AI Agent", "记忆系统", "长期记忆", "向量数据库", "摘要", "学习计划"]
excerpt: "长期记忆让 Agent「跨会话不忘」——把重要信息存入向量数据库 + 摘要，按需语义检索召回。今天讲清长期记忆的写入/检索链路、与 RAG（Day 36-39）的同源复用，以及记忆的增删改与遗忘策略。"
readingTime: 14
---

# Day 54：记忆系统（三）— 长期记忆（向量数据库 + 摘要）

## 一、为什么需要长期记忆

短期/工作记忆都随会话结束消失，而 Agent 要**跨天、跨用户记住偏好、经验、知识**：

- 用户画像（「我习惯用中文回复」）
- 历史经验（「上次这个 bug 这么修的」）
- 领域知识沉淀（相当于私人知识库）

做法 = **向量数据库存语义片段 + 摘要压缩**，本质就是 Day 36-39 学过的 RAG 检索链路。

## 二、写入链路

```
重要信息 → 摘要/切分 → Embedding → 存入向量库（带 metadata）
```

```ts
// 用 Day 19 的 MemoryVectorStore 即可
await vectorStore.addDocuments([
  new Document({ pageContent: '用户偏好：中文回复、简洁', metadata: { type: 'profile', userId } }),
])
```

## 三、检索链路（语义召回）

```ts
const hits = await vectorStore.similaritySearch(query, 3) // Top-3 相关记忆
// 拼回 prompt 作为长期记忆上下文
```

- 与 Day 39 检索完全同源，可复用 `asRetriever()`
- 生产用 Pinecone/Chroma（Day 38），开发用 MemoryVectorStore

## 四、增删改与遗忘策略

| 操作 | 做法 |
|------|------|
| 增 | 重要结论/偏好实时写入 |
| 查 | 每轮 query 语义检索 Top-K |
| 改 | 更新 metadata 或覆盖旧片段 |
| 删/遗忘 | 过期记忆按 TTL 清理，防噪声累积 |

## 五、三层记忆体系回顾（Day 52-54 汇总）

| 层 | 范围 | 存储 | 对应模块 |
|----|------|------|----------|
| 工作记忆 | 单次任务 | Scratchpad/对象 | Day 53 |
| 短期记忆 | 本轮对话 | messages 数组 | Day 52 |
| 长期记忆 | 跨会话 | 向量库+摘要 | Day 54（今日） |

## 六、常见坑

| 坑 | 后果 | 规避 |
|----|------|------|
| 什么都存 | 噪声干扰检索 | 只存高价值信息 |
| 嵌入模型不一致 | 召回失准 | 与 RAG 用同一模型 |
| 永不清理 | 库膨胀变慢 | 加 TTL/遗忘策略 |
| 敏感信息入向量库 | 隐私泄露 | 脱敏后再存 |
| 官方站不可访问 | 卡文档 | 用国内镜像 |

## 七、今日实践任务

1. 用 MemoryVectorStore 建一个「用户偏好」长期记忆，写入 3 条并语义检索验证
2. 把 Day 53 的工作记忆提炼结果沉淀进长期记忆
3. 给长期记忆加一条「遗忘」函数（按 userId + TTL 清理），写进 README

🔗 学习资料（国内可访问镜像）：
- Pinecone 文档：https://docs.pinecone.io/ ✅
- LangChain JS 中文 Retrieval：https://js.langchain.com.cn/docs/ ✅
- LangChain 中文文档 Memory：https://langchain-doc.cn/ ✅
- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅
