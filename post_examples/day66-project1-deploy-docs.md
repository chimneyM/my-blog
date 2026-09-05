---
id: 70
title: "AI Agent 学习计划 - Day 66：项目一 - 部署与文档"
slug: "ai-agent-day66-project1-deploy-docs"
date: "2026-09-05"
tags: ["AI Agent", "实战项目", "项目一", "部署", "Vercel", "README", "环境变量", "学习计划"]
excerpt: "项目一第十步：把知识库问答系统部署到 Vercel 并写好 README，让项目从「本地能跑」变成「别人也能跑、线上可访问」。覆盖环境变量管理、流式函数的 maxDuration、Pinecone 索引维度对齐、README 必备章节与常见坑。"
readingTime: 15
---

# Day 66：项目一 - 部署与文档

## 一、目标

Day 57-65 把项目一的 RAG 全链路（上传→切分→入库→检索→流式→引用→多轮→测试优化）都做完了。今天是 **收口交付**：把它部署到 Vercel 并写好 README，让别人 `git clone` 后也能跑起来、线上可访问。

> 一个 AI 项目的「完成」，标志不是本地能跑，而是：① 线上可访问 ② 别人按 README 能复现 ③ 密钥不泄露。

## 二、部署到 Vercel

1. 把项目推到 GitHub（我们每天的笔记已经走这套流程）。
2. Vercel 控制台「Import Project」选该仓库，Framework 选 Next.js（自动识别）。
3. **配置环境变量**（Production / Preview / Development 三套都要）：
   - `OPENAI_API_KEY`
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX`（如 `kb-demo`）
4. Deploy。Next.js 默认 `output` 自动适配 Vercel，无需额外配置。

> 关键点：**密钥只在 Vercel 后台填，绝不写进仓库**。本地用 `.env.local`（已被 `.gitignore` 忽略），线上用 Vercel 环境变量（呼应 Day 61 的 Key 泄露坑）。

## 三、流式函数的 maxDuration（必看）

Day 61 提过：Vercel -serverless 函数默认 10s 超时，长答案会被掐断。Hobby 计划最长 60s，需在 `route.ts` 顶部声明：

```ts
// app/api/chat/route.ts
export const maxDuration = 30 // 单位秒，Hobby 上限 60
export const runtime = 'nodejs'
```

`runtime = 'nodejs'` 确保能用 Node API（如 `Buffer`、Pinecone SDK），别误用 `edge`（edge 不支持部分 Node 库）。

## 四、Pinecone 索引维度对齐

部署后第一问可能报错 `dimension mismatch`。原因：`text-embedding-3-small` 维度是 **1536**，但索引建成了别的维度。

```bash
# 建索引时务必指定 1536
pc.createIndex({ name: 'kb-demo', dimension: 1536, metric: 'cosine' })
```

> 隐患：Day 59 若本地用的是不同模型（如 `text-embedding-ada-002` = 1536，或本地模型 384），上线必须和入库完全一致，否则检索为 0 命中。

## 五、README 必备章节

一个能交付的 README 至少要有：

```md
# 智能知识库问答系统

基于 Next.js + Vercel AI SDK + LangChain.js + Pinecone 的 RAG 问答。

## 技术栈
- 前端：Next.js App Router + useChat
- 后端：Next.js Route Handler + streamText
- 检索：LangChain.js 切分 + OpenAI Embeddings + Pinecone
- 流式：Vercel AI SDK UI Message Stream

## 快速开始
1. `npm install`
2. 复制 `.env.example` 为 `.env.local` 并填入 OPENAI_API_KEY / PINECONE_API_KEY
3. 创建 Pinecone 索引（dimension=1536）
4. `npm run ingest`  # 把 docs/ 下的文档切分入库
5. `npm run dev`     # 访问 http://localhost:3000

## 架构流程
用户问题 → embedQuery → Pinecone 检索 TopK → 注入 System Prompt
→ streamText 流式生成（toUIMessageStreamResponse）→ 前端打字机 + SourceCard

## API
POST /api/chat  body: { messages: UIMessage[] }  → UI Message Stream（含 data-sources）
```

> 部署前务必先跑 `npm run ingest` 把文档入库——空索引下问答永远「无相关资料」，容易误以为是部署坏了。

## 六、常见坑

- **密钥提交进仓库**：`.env.local` 没进 `.gitignore`，API key 泄露；上线前用 `git ls-files | grep env` 自查。
- **Vercel 没配环境变量**：部署成功但问答 500，控制台报 `PINECONE_API_KEY is not defined`。
- **`maxDuration` 没设/设太小**：长答案流式到 10s 被截断（呼应 Day 61）。
- **误用 `runtime='edge'`**：Pinecone/OpenAI SDK 依赖 Node，edge 运行时会报不支持的 API。
- **索引维度不一致**：本地和线上 embedding 模型不同 → 检索 0 命中。
- **没先入库就部署**：空索引下所有问答「无资料」，以为是 bug。
- **官方站不可访问**：部署文档用 Next.js 官方 https://nextjs.org/docs/app/building-your-application/deploying（国内一般可访问），别硬连受限镜像。

## 七、今日实践任务

1. 在 Vercel 导入仓库，配齐 `OPENAI_API_KEY` / `PINECONE_API_KEY` / `PINECONE_INDEX` 三套环境变量。
2. 确认 `route.ts` 有 `export const maxDuration = 30` 与 `runtime='nodejs'`。
3. 写 `.env.example`（只列变量名不填值）+ 完整 README（技术栈/快速开始/架构流程/API）。
4. 部署后在线上问一个问题，确认：① 能流式回答 ② 出现 SourceCard 引用 ③ 无密钥泄露。

> 明日（Day 67）做项目一「项目完善与总结」：代码 review、补 bug、整体收尾，为 Day 69 复盘与 Day 70 展示做准备。
