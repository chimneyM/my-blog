---
id: "40"
title: "RAG 核心流程（上）：文档加载与切分"
slug: "ai-agent-day36-rag-document-splitting"
date: "2026-08-06"
tags: ["AI Agent", "阶段三进阶", "RAG", "文档加载", "文本切分", "RecursiveCharacterTextSplitter"]
excerpt: "进入阶段三「进阶能力」第一天：拆解 RAG（检索增强生成）第一步——文档加载与切分。搞懂为什么需要切分、RecursiveCharacterTextSplitter 的递归分隔逻辑、chunkSize/chunkOverlap 调参经验，以及语义切分 vs 固定长度切分的取舍。"
readingTime: 14
---

## 回顾与今天的目标

阶段二我们掌握了「框架怎么调模型」。阶段三（Day 36-56）进入**真实 Agent 的核心能力**：RAG、多 Agent 编排、工具集成、记忆系统。

今天从 **RAG（Retrieval-Augmented Generation，检索增强生成）** 的第一步讲起——**把知识文档变成可被向量检索的小块**。这是让 Agent「开卷考试」而非「凭记忆瞎编」的关键。

## 1. 为什么需要切分（Chunking）

RAG 的完整链路是：`文档 → 切分 → 嵌入 → 入库 → 检索 → 注入 Prompt → 生成`。

为什么不能直接把整本文档塞给嵌入模型？
- **嵌入模型有 token 上限**（如 `text-embedding-3-small` 约 8191 token），长文档会被截断。
- **检索粒度太粗**：整本文档作为一条向量，语义太杂，检索精准度差。
- **上下文窗口贵**：把不相关的大段文本都喂给 LLM 是浪费 token。

切分就是把文档切成**语义相对完整、长度适中**的 chunk，让「检索→注入」更精准。

## 2. Document 数据结构

LangChain 里一切知识的最小单元是 `Document`：

```ts
interface Document {
  pageContent: string        // 文本正文
  metadata: {                // 来源/页码/章节等，检索后可溯源
    source?: string
    page?: number
    [key: string]: any
  }
}
```

## 3. 文档加载（Document Loaders）

框架提供几十种 Loader，常见：

| Loader | 用途 |
| --- | --- |
| `TextLoader` | `.txt` 纯文本 |
| `PDFLoader` | PDF（需 `pdf-parse` 依赖） |
| `WebBaseLoader` | 网页 URL（基于 `cheerio`） |
| `CSVLoader` | 表格数据，按行切 |
| `JSONLoader` | JSON，按路径提取 |

```ts
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
const loader = new PDFLoader('2026年报.pdf')
const docs = await loader.load()   // Document[]
```

## 4. 文本切分器（Text Splitters）

### 4.1 朴素硬切的问题
按固定字符数直接 `slice` 会**把一句话、一个词切断**，破坏语义。所以需要「在自然的边界切」。

### 4.2 RecursiveCharacterTextSplitter（首选）
它的核心思路：**按分隔符优先级逐层递归切**。

分隔符优先级（默认）：
```ts
['\n\n', '\n', ' ', '']   // 段落 → 换行 → 空格 → 字符
```

逻辑：先用 `\n\n` 切，如果某块仍超过 `chunkSize`，再用 `\n` 切，再超再用空格……直到满足长度。这保证**尽量在段落/句子边界切**，语义损失最小。

```ts
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,        // 每块目标字符数（中文约 300-500 字较稳）
  chunkOverlap: 50,      // 相邻块重叠，避免跨块语义断裂
})

const chunks = await splitter.splitDocuments(docs)  // Document[]
console.log(chunks[0].pageContent, chunks[0].metadata)
```

### 4.3 其他切分器
- **CharacterTextSplitter**：按单一分隔符硬切，简单但不智能。
- **TokenTextSplitter**：按 token 数切，贴合嵌入模型计费口径（推荐用于英文）。
- **MarkdownTextSplitter / LatexTextSplitter**：尊重文档结构（标题/公式）切。
- **语义切分（Semantic Chunking，预览）**：用嵌入模型判断「语义边界」再切，精度最高但慢，Day 40 会展开。

## 5. chunkSize / chunkOverlap 调参经验

| 场景 | chunkSize | chunkOverlap | 理由 |
| --- | --- | --- | --- |
| 中文问答 | 300-500 字 | 10-15% | 中文信息密度高，块小更精准 |
| 英文技术文档 | 800-1000 token | 15-20% | 英文词短，可稍大 |
| 代码文件 | 按函数/类切 | 小 | 用 Markdown/Code 切分器更合适 |

**原则**：块太大→检索不精准；块太小→上下文碎片化、跨块信息丢失。`overlap` 让相邻块共享边缘，缓解「答案被切断在两块之间」。

## 6. 完整「加载 → 切分」实战

```ts
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

const loader = new PDFLoader('产品手册.pdf')
const rawDocs = await loader.load()

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400,
  chunkOverlap: 50,
})
const chunks = await splitter.splitDocuments(rawDocs)

console.log(`共切出 ${chunks.length} 块`)
console.log('第 1 块来源:', chunks[0].metadata)
```

> 下一步（Day 37-39）：把这些 chunk 用 Embeddings 变成向量，存进向量库，再做相似度检索。

## 7. 常见坑

- **依赖缺失**：`PDFLoader` 忘装 `pdf-parse`、`WebBaseLoader` 忘装 `cheerio` → 运行时才报错。
- **overlap ≥ chunkSize**：重叠比块还大，死循环风险。
- **中文字符计数**：`chunkSize` 按字符算，中文一个字=1 字符，但嵌入模型按 token，汉字约 1-2 token/字，别照搬英文经验值。
- **metadata 丢失**：切分后 metadata 默认继承，但自定义 loader 容易漏传 `source`，导致后面无法溯源。
- **官方站不可访问**：LangChain 文档用国内镜像 js.langchain.com.cn。

## 学习资料与网站
- LangChain JS 中文文档（文档加载）：https://js.langchain.com.cn/docs/
- LangChain 中文文档：https://langchain-doc.cn/
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html
- 掘金 RecursiveCharacterTextSplitter 实战：https://juejin.cn/post/7348766635905409056

## 学习建议
- 今天先**只做加载+切分**，别急着上嵌入，把 `chunks` 打印出来肉眼看切得合不合理。
- 亲自调 `chunkSize`：分别试 200 / 500 / 1000，观察同一段文字被怎么切，建立「块大小」的直觉。
- 用一份你自己的 PDF（合同/手册/笔记）做实验，比用教程示例更有体感。

⏰ 预计学习时长：2.5 小时
