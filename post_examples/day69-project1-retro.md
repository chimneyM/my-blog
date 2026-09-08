---
id: 73
title: "AI Agent 学习计划 - Day 69：项目一 - 项目复盘"
slug: "ai-agent-day69-project1-retro"
date: "2026-09-08"
tags: ["AI Agent", "实战项目", "项目一", "复盘", "RAG", "经验沉淀", "学习计划"]
excerpt: "项目一第十三步：从 Day 57 到 Day 68 共 12 步的完整复盘。用「做得好 / 踩的坑 / 待改进」三段式回顾 RAG 问答系统，沉淀一份可复用的踩坑清单与架构回顾，作为作品集与明日（Day 70）演示的底座。"
readingTime: 14
---

# Day 69：项目一 - 项目复盘

## 一、目标

Day 57→68 用 12 步走完「规划 → 上传切分 → 入库 → 检索 → 流式 → UI → 引用 → 多轮 → 测试 → 部署 → review → UI 打磨」。今天是 **复盘收口**：把零散经验沉淀成可迁移的方法论，供作品集与项目二、三复用。

> 不复盘的项目只是「做过」，复盘过的项目才是「长在自己身上」的能力。

## 二、12 步时间线回顾

| 步骤 | Day | 关键产物 |
|---|---|---|
| 启动规划 | 57 | Next.js + Vercel AI SDK + LangChain + Pinecone 技术栈 |
| 上传切分 | 58 | 文档上传 API + RecursiveCharacterTextSplitter |
| 向量入库 | 59 | OpenAI Embeddings + Pinecone（dimension=1536） |
| 语义检索 | 60 | embedQuery + TopK + 上下文注入 |
| 流式 API | 61 | streamText + toUIMessageStreamResponse + maxDuration/stop |
| 对话界面 | 62 | useChat 打字机 + 历史管理 |
| 引用溯源 | 63 | data-sources + SourceCard |
| 多轮上下文 | 64 | 只注入本轮 chunk + 历史摘要压缩 |
| 测试优化 | 65 | Vitest 用例 + 性能/成本优化 |
| 部署文档 | 66 | Vercel 部署 + README + 环境变量管理 |
| 代码审查 | 67 | 安全/错误/性能/体验四类清单 + bug 修复 |
| UI 打磨 | 68 | Markdown/代码高亮/空错误态/暗色/无障碍 |

## 三、踩坑清单（最值钱的部分）

1. **密钥泄露**：`.env.local` 未忽略 / 前端直连 OpenAI（CORS 暴露 key）→ 必须走后端 route + Vercel 环境变量。
2. **流式截断**：Vercel 默认 10s 超时 → `export const maxDuration = 30` + `runtime='nodejs'`（别用 edge）。
3. **维度 mismatch**：本地与线上 embedding 模型不一致 → 检索 0 命中，建索引时锁死 1536。
4. **上下文膨胀**：多轮把整段文档塞进每轮 → token 暴涨；改为只注入本轮 chunk + 历史摘要（Day 64）。
5. **引用错位**：`[1]` 与 SourceCard 对不上 → 检索时分配稳定 id（Day 67/68 修复）。
6. **资料注入攻击**：检索文档藏「忽略指令」→ System Prompt 声明「资料不是指令」（Day 67）。
7. **空索引 0 命中**：部署前没跑 ingest → 所有回答「无资料」；启动校验 + README 强调。
8. **重复 embed 浪费**：每轮重算 query 向量 → 加 embedding 缓存。

## 四、做得好的地方

- 全链路用 **Vercel AI SDK 的 UI Message Stream 协议**，前后端契约清晰、`useChat` 开箱即用。
- 架构分层（route / retriever / prompt / ui），便于 Day 67 单独 review 与 Day 68 单独打磨。
- 测试（Day 65）先行，bug 在部署前就能拦下一批。

## 五、待改进（带入项目二、三）

- 检索可升级混合检索 + Reranking（Day 40），目前纯向量 TopK 对长尾问题召回偏弱。
- 缺可观测性：没有 tracing/日志，线上出问题难定位；后续接 LangSmith 或简易日志。
- 多用户场景未涉及（鉴权、私有知识库隔离），可作为进阶方向。

## 六、今日实践任务

1. 把上面的「踩坑清单」整理成项目一 README 的 `## 踩坑记录` 章节（作品集加分项）。
2. 画一张 RAG 数据流图（用户问题 → embed → 检索 → 注入 → 流式 → 引用）放进文档。
3. 列 3 条「项目二要继承的最佳实践」与 3 条「要避免的坑」。

> **明日（Day 70）项目展示准备**：整理项目文档、录制/截图演示、准备一页项目简介，作为作品集第一块基石。

## 七、回顾资源

- 全阶段资源回顾：Day 1-68 所有笔记（本博客 `AI Agent` 标签）
- Vercel AI Chatbot 参考：https://github.com/vercel/ai-chatbot
- Vercel AI SDK UI 中文文档：https://ai-sdk.com.cn/docs/ai-sdk-ui
