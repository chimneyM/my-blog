---
id: 62
title: "AI Agent 学习计划 - Day 58：项目一 - 文档上传与自动切分"
slug: "ai-agent-day58-project1-ingest"
date: "2026-08-28"
tags: ["AI Agent", "实战项目", "项目一", "文档上传", "RAG", "切分", "学习计划"]
excerpt: "项目一第二步：实现文档上传 API，并用 RecursiveCharacterTextSplitter 自动切分。这是 RAG 链路的入口——切分质量直接决定检索效果。今天覆盖 Next.js Route Handler 接收文件、Loader 加载、切分策略与参数调优。"
readingTime: 16
---

# Day 58：项目一 - 文档上传与自动切分

## 一、目标

在 Day 57 工程基础上，实现 `/api/ingest`：接收用户上传的文档（PDF/MD/TXT），加载内容并自动切分成适合嵌入的 chunk，**为 Day 59 向量化存储铺好数据**。

> 切分（Chunking）是 RAG 质量的第一道关卡——切太碎丢上下文，切太大噪点多。今天重点理解 `RecursiveCharacterTextSplitter`。

## 二、文档加载（Loader）

LangChain 对不同格式有现成 Loader：

```ts
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { MarkdownLoader } from '@langchain/community/document_loaders/fs/markdown'

const loader = new PDFLoader(fileBufferOrPath)
const docs = await loader.load() // Document[]，每页一个
```

## 三、自动切分（核心）

```ts
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,      // 每块约 1000 字符
  chunkOverlap: 200,    // 相邻块重叠 200，保连贯
  separators: ['\n\n', '\n', '。', '，', ' '], // 优先在语义边界切
})

const chunks = await splitter.splitDocuments(docs)
// chunks: Document[]，带 pageContent + metadata
```

- `separators` 按优先级尝试，优先在段落/句号处断，避免把一句话劈两半
- `chunkOverlap` 让相邻块有重叠，检索时不会因边界丢信息

## 四、Route Handler 实现（Next.js）

```ts
// app/api/ingest/route.ts
export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file') as File
  const buffer = Buffer.from(await file.arrayBuffer())
  // 1. 选 Loader（按扩展名）
  // 2. load()
  // 3. splitDocuments()
  // 4. 暂存 chunks 到内存/临时表，供 Day 59 入库
  return Response.json({ chunks: chunks.length })
}
```

> 注意：前端直传文件时，Loader 需支持 buffer（或先落临时文件）。生产可改用 Vercel Blob 存原文件。

## 五、切分策略选择（呼应 Day 36）

| 策略 | 适用 |
|------|------|
| 固定长度 | 通用、简单 |
| 递归字符（今日） | 大多数文档默认首选 |
| 语义切分 | 长文、需保意群（可用 Embedding 辅助） |

## 六、常见坑

| 坑 | 后果 | 规避 |
|----|------|------|
| chunkSize 过大（>2k） | 检索噪点多 | 1000 左右起步，按效果调 |
| 无 overlap | 边界信息丢失 | 设 10-20% overlap |
| 中文按空格切 | 切得乱 | separators 加 `。，、` |
| 大文件同步处理 | 超时 | 流式/后台任务，返回 taskId |
| Loader 不匹配格式 | 解析空 | 按扩展名分发 Loader |
| 官方站不可访问 | 卡文档 | 用国内镜像 |

## 七、今日实践任务

1. 在 Day 57 工程上加 `/api/ingest`，支持 PDF/MD/TXT 上传
2. 用 RecursiveCharacterTextSplitter 切分，打印 chunk 数量与样例
3. 调参实验：chunkSize 500 vs 1000 vs 2000，观察切分粒度差异，写进 README

🔗 学习资料（国内可访问镜像）：
- LangChain JS 中文 文档加载：https://js.langchain.com.cn/docs/ ✅
- LangChain 中文 Text Splitter：https://langchain-doc.cn/ ✅
- Next.js Route Handler 文档：https://nextjs.org/docs/app/building-your-application/routing/route-handlers ✅
- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅
