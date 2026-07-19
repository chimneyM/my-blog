---
id: "22"
title: "AI Agent 学习计划 Day 18：LangChain.js Retrieval（上）— 文档加载与切分"
slug: "ai-agent-day18-langchain-retrieval-upper"
date: "2026-07-19"
tags: ["AI Agent", "LangChain", "RAG", "Retrieval", "Text Splitter", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第十八天。进入 LangChain.js Retrieval 模块：理解 RAG 为什么需要检索、Document 数据结构、各类 Document Loader（文本/PDF/Web/CSV/Notion），并重点掌握文档切分神器 RecursiveCharacterTextSplitter（分隔符层级、chunkSize、chunkOverlap）与其他切分策略。"
readingTime: 32
---

# AI Agent 学习计划 Day 18：LangChain.js Retrieval（上）

> 📅 日期：2026-07-19  
> 🎯 阶段二：核心框架（Day 15-35）  
> 📊 学习进度：Day 18 / 84（21.4%）

## 前言

前三天我们学完了 Model I/O 三层（Prompt → Model → OutputParser），模型已经能「听懂指令、吐出结构」。但真正让 AI Agent 拥有**领域知识**的，是 Retrieval（检索）——也就是 RAG（Retrieval-Augmented Generation，检索增强生成）。

大模型本身有个致命短板：**训练数据有截止日期，且无法访问你的私有文档**。Retrieval 的做法是——把外部知识「喂」给模型：先加载文档、切成小块、需要时按需检索相关片段，注入 Prompt。今天我们先拿下 Retrieval 的第一步：**文档加载** 与 **文档切分**。

---

## 一、为什么需要 Retrieval / RAG

```text
没有检索（纯大模型）：
  用户：我们公司年假政策是几天？
  模型：我无法访问贵公司内部制度……（瞎编或拒答）

有检索（RAG）：
  1. 加载《员工手册.pdf》→ 切分成若干 chunk
  2. 用户提问 → 检索出「年假」相关 chunk
  3. 把 chunk 拼进 Prompt → 模型基于真实文档作答
```

Retrieval 让模型「开卷考试」，答案可溯源、可更新（换文档即可），还能大幅减少幻觉。

---

## 二、核心数据结构：Document

LangChain 里一切被加载/切分的内容，统一抽象成 `Document`：

```typescript
import { Document } from '@langchain/core/documents'

const doc = new Document({
  pageContent: '这是一段文本内容……',
  metadata: { source: 'handbook.pdf', page: 3 },
})
```

- `pageContent`：文本正文
- `metadata`：来源、页码、作者等，检索时可用于过滤与溯源

Loader 与 Splitter 的输入输出，本质都是 `Document[]`。

---

## 三、文档加载 Document Loaders

LangChain 提供大量开箱即用的 Loader，统一实现 `load()` / `loadAndSplit()`。

### 3.1 文本文件 —— TextLoader

```typescript
import { TextLoader } from 'langchain/document_loaders/fs/text'

const loader = new TextLoader('./docs/handbook.txt')
const docs = await loader.load() // Document[]
```

### 3.2 PDF —— PDFLoader

```typescript
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'

const loader = new PDFLoader('./docs/handbook.pdf')
const docs = await loader.load() // 每页一个 Document（默认按页）
```

> PDF 解析依赖 `pdf-parse` 等底层库；页面多、扫描件多时建议配合 OCR。

### 3.3 网页 —— WebBaseLoader

```typescript
import { WebBaseLoader } from '@langchain/community/document_loaders/web/cheerio'

const loader = new WebBaseLoader('https://js.langchain.com.cn/docs/')
const docs = await loader.load() // 用 cheerio 抓取正文
```

### 3.4 CSV / JSON / 数据库

- `CSVLoader`：把每行变一个 Document，`column` 选项指定作为正文列
- `JSONLoader`：按 `jq` 风格路径抽取字段
- 数据库/Memory/S3 等均有对应 Loader（`@langchain/community` 下）

---

## 四、文档切分 Text Splitters（重点）

模型有上下文窗口限制，且检索要「精准命中」，所以**必须把长文档切成小块（chunk）**。

### 4.1 朴素切法的问题

```text
按固定长度 1000 字符硬切：
  chunk1: "...营收增长主要来源于[被切断] 海外业务，该业务..."
  chunk2: "在东南亚市场占有率达到 30%..."   ← 语义被切断，检索时拆散
```

硬切会**切断语义**，导致一个完整知识点被劈成两半。

### 4.2 RecursiveCharacterTextSplitter（推荐默认）

它按「分隔符优先级」递归切分，**优先在段落/句子边界断开**，尽可能保留语义完整：

```typescript
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,       // 每块最大字符数
  chunkOverlap: 50,     // 相邻块重叠字符数（保留上下文衔接）
})

const docs = await splitter.splitDocuments(rawDocs)
// 或直接从文本：const chunks = await splitter.splitText(longText)
```

**分隔符层级（默认，从粗到细）**：

```typescript
['\n\n', '\n', ' ', '']   // 段落 → 换行 → 空格 → 字符
```

切分逻辑：先尝试按 `\n\n`（段落）切；若某块仍超 `chunkSize`，再按 `\n` 切；还不够再按空格、最后按字符。这样**优先在自然的段落/句子边界断开**。

### 4.3 关键参数怎么调

| 参数 | 作用 | 经验值 |
|------|------|--------|
| `chunkSize` | 单块最大长度 | 中文 300–800 字符；英文 500–1000 token |
| `chunkOverlap` | 块间重叠 | 建议 `chunkSize` 的 10%–20%，避免割裂 |
| `separators` | 自定义分隔符 | 代码可用 `['\n\n','\n',';',' ']` |

> 太小 → 上下文碎片、检索噪声多；太大 → 单块信息杂、超出窗口。需要结合**嵌入模型**的最佳输入长度实验调优（Day 19 会讲 Embeddings）。

### 4.4 其他切分器

- `CharacterTextSplitter`：只按单一分隔符（如 `\n\n`），不递归
- `TokenTextSplitter`：按 token 而非字符切，更贴合模型计数（注意 `chunkSize` 单位变成 token）
- `MarkdownTextSplitter` / `LatexTextSplitter`：按文档结构（标题/公式）切，保留格式语义
- **语义切分（预览）**：用 Embedding 判断「是否该断开」，让每块是完整语义单元（Day 36+ 深入 RAG 时再展开）

---

## 五、完整实战：加载 PDF → 切分

```typescript
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

// 1. 加载
const loader = new PDFLoader('./docs/handbook.pdf')
const rawDocs = await loader.load()

// 2. 切分
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 600,
  chunkOverlap: 80,
})
const chunks = await splitter.splitDocuments(rawDocs)

// 3. 查看结果
console.log(`共切成 ${chunks.length} 块`)
console.log(chunks[0].pageContent.slice(0, 100))
console.log('metadata:', chunks[0].metadata) // 保留来源页码
```

> 这套「加载 → 切分」产出的 `chunks`，就是 Day 19 嵌入成向量、Day 20 存进向量库、Day 21 做相似度检索的原料。

---

## 六、常见坑

1. **Loader 没装对应底层依赖**：`PDFLoader` 需要 `pdf-parse`，`WebBaseLoader` 需要 `cheerio`，记得 `npm i` 对应包。
2. **chunkOverlap ≥ chunkSize**：会导致死循环/重复，overlap 必须明显小于 size。
3. **中文 chunkSize 用「字符」而非「token」**：`RecursiveCharacterTextSplitter` 默认按字符，中文每个字算 1 字符，按英文经验值会偏大，需下调。
4. **metadata 丢失**：自定义 Loader 时务必把 `source/page` 写进 metadata，否则检索命中后无法溯源。
5. **官方文档站点不可访问**：用中文镜像 `js.langchain.com.cn` / `langchain.nodejs.cn`，避免 `js.langchain.com` 打不开。

---

## 七、学习资料

以下站点均已验证可访问（国内镜像 / 中文）：

| 资源 | 链接 | 说明 |
|------|------|------|
| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | 总入口，含 Retrieval 章节 |
| LangChain 中文文档 | https://langchain-doc.cn/ | 概念与 How-to 中文版 |
| LangChain 中文网 | https://langchain.nodejs.cn/docs/concepts/ | 概念文档（含文本切分） |
| LangChain.js 文本切分 How-to | https://js.langchain.com.cn/docs/how_to/ | 官方 how-to 中文镜像 |
| js.langchain.ac.cn 文档加载 | https://js.langchain.ac.cn/docs/integrations/document_loaders/ | Loader 集成列表 |
| 菜鸟教程 AI Agent 教程 | https://www.runoob.com/ai-agent/ai-agent-tutorial.html | 入门总览 |

---

## 八、明日预告

**Day 19：LangChain.js Retrieval（下）— 嵌入（Embeddings）与向量存储**

切好的文本块只是字符串，机器不懂「语义相近」。下一步我们用 Embedding 模型把每块文本变成一串向量（数字），再存进向量数据库（如内存版 / Chroma / Pinecone）。这样「语义检索」才成为可能——用户问「年假几天」，能召回「休假制度」那块，哪怕字面不重合。

> 🚀 Day 18 完成！你已掌握 RAG 流水线最前端的「加载 + 切分」。明天，我们让文本变成向量。
