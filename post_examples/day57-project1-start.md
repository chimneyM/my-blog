---
id: 61
title: "AI Agent 学习计划 - Day 57：项目一启动 - 智能知识库问答系统"
slug: "ai-agent-day57-project1-start"
date: "2026-08-27"
tags: ["AI Agent", "实战项目", "项目一", "知识库问答", "Next.js", "技术栈", "学习计划"]
excerpt: "阶段四实战开启！项目一「智能知识库问答系统」是 RAG + 记忆 + 流式 UI 的完整落地。今天做项目规划、技术栈选型（Next.js + LangChain.js + Pinecone + OpenAI），并初始化工程骨架。"
readingTime: 16
---

# Day 57：项目一启动 — 智能知识库问答系统

## 一、项目目标

做一个能「读懂你私有文档并对话」的问答系统：用户上传 PDF/Markdown/网页，系统切分嵌入入库，对话时检索相关知识生成带引用的答案。

> 这是 Day 36-40（RAG）+ Day 52/54（记忆）+ Day 27/28（流式 UI）的**端到端整合**，是阶段三能力的最直接落地。

## 二、技术栈

| 层 | 选型 | 对应学过的模块 |
|----|------|----------------|
| 框架 | Next.js（App Router） | Day 61-66 流式 Route |
| LLM | OpenAI GPT-4o | Day 10/16/26 |
| 编排 | LangChain.js | Day 16-25 |
| 向量库 | Pinecone（云端）/ Chroma（本地） | Day 38-39 |
| 嵌入 | OpenAI Embeddings | Day 37 |
| 前端流式 | Vercel AI SDK `useChat` | Day 27-29 |
| 语言 | TypeScript | Day 1-4 |

## 三、目录骨架规划

```
project1-kb/
├─ app/
│  ├─ api/
│  │  ├─ ingest/route.ts      # 文档上传+切分+入库 (Day 58)
│  │  └─ chat/route.ts        # 流式问答 (Day 61)
│  ├─ page.tsx                # 对话界面 (Day 62)
├─ lib/
│  ├─ vectorstore.ts          # Pinecone 封装 (Day 59)
│  ├─ retriever.ts            # 检索 (Day 60)
│  └─ memory.ts               # 多轮记忆 (Day 64)
├─ components/SourceCard.tsx  # 引用溯源 (Day 63)
├─ .env.local                 # API Key
└─ README.md
```

## 四、今天要落地的初始化

1. `npx create-next-app@latest` 选 TS + App Router + Tailwind
2. 装依赖：`langchain @langchain/openai @langchain/pinecone pinecone @ai-sdk/openai ai`
3. 配 `.env.local`：`OPENAI_API_KEY`、`PINECONE_API_KEY`、`PINECONE_INDEX`
4. 跑通一个最小 `/api/chat` 返回 `streamText` 的 hello 流式响应（验证链路）

## 五、与前面模块的衔接

- **Day 36-40 RAG**：切分→嵌入→检索全用上
- **Day 52/54 记忆**：多轮对话历史 + 长期偏好
- **Day 27-29 流式 UI**：`useChat` 实时渲染
- **Day 63 引用**：把检索到的 chunk 作为 SourceCard 展示

## 六、常见坑（项目启动期）

| 坑 | 后果 | 规避 |
|----|------|------|
| Next 版本与 AI SDK 不兼容 | 报错 | 锁 ai@4.x + @ai-sdk/openai 对应版 |
| Pinecone 索引维度不匹配 | 写入失败 | Embedding 维度（如 1536）与索引一致 |
| API Key 进前端 | 泄露 | 只在 route 服务端用，走 env |
| 本地没 GPU | 嵌入慢 | 用 OpenAI 云端 Embedding |
| 官方站不可访问 | 卡文档 | 用国内镜像 |

## 七、今日实践任务

1. 初始化 Next.js 工程，装齐依赖
2. 配好 `.env.local`，写最小 `/api/chat` 流式 hello 验证
3. 画一张项目一架构图 + 写 README 开头（目标/技术栈/目录）

🔗 学习资料（国内可访问镜像）：
- Next.js 官方文档：https://nextjs.org/docs ✅（国内可走 https://nextjs.org/ 或社区镜像）
- Vercel AI Chatbot 参考：https://github.com/vercel/ai-chatbot ✅
- LangChain JS 中文文档：https://js.langchain.com.cn/docs/ ✅
- Pinecone 文档：https://docs.pinecone.io/ ✅
- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅
