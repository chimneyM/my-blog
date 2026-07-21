---
id: "24"
title: "AI Agent 学习计划 Day 20：LangChain.js Chains（上）— 顺序链与 LLM 链"
slug: "ai-agent-day20-langchain-chains-upper"
date: "2026-07-21"
tags: ["AI Agent", "LangChain", "Chains", "LCEL", "RAG", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第二十天。进入 LangChain Chains 模块：用 LCEL（LangChain Expression Language）把组件编排成可复用、可组合的链。覆盖 Runnable 统一接口、pipe 管道符、RunnableSequence / RunnablePassthrough、LLM 链与第一个完整 RAG 问答链（Retriever → Prompt → Model）。"
readingTime: 33
---

# AI Agent 学习计划 Day 20：LangChain.js Chains（上）

> 📅 日期：2026-07-21  
> 🎯 阶段二：核心框架（Day 15-35）  
> 📊 学习进度：Day 20 / 84（23.8%）

## 前言

前四天我们备齐了 RAG 的所有「零件」：模型（Day 16-17）、文档加载与切分（Day 18）、嵌入与向量库（Day 19）。但零件散落一地没法用——今天我们用 **Chains（链）** 把它们**串起来**：检索相关文档 → 拼进 Prompt → 调模型作答。LangChain 用来编排的语法叫 **LCEL（LangChain Expression Language）**，核心是「管道符 `|` 」。

---

## 一、Runnable：所有组件的统一接口

LCEL 的基石是 `Runnable` 接口。模型、Prompt、Retriever、甚至一个普通函数，只要实现了 `invoke / batch / stream / pipe`，就能互相用 `|` 连接：

```text
Runnable 通用方法：
  .invoke(input)        → 单次调用，返回结果
  .batch([...])         → 批量调用
  .stream(input)        → 流式调用
  .pipe(anotherRunnable) → 拼接成新链
```

这意味着**模型能接 Prompt、Prompt 能接 Retriever、Retriever 能接函数**——一切皆 Runnable，自由组合。

---

## 二、pipe 管道符：LCEL 的语法糖

```typescript
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { StringOutputParser } from '@langchain/core/output_parsers'

const prompt = ChatPromptTemplate.fromTemplate('用一句话解释：{topic}')
const model = new ChatOpenAI({ model: 'gpt-4o-mini' })
const parser = new StringOutputParser()

// 用 | 把三个 Runnable 串成链
const chain = prompt | model | parser

const answer = await chain.invoke({ topic: '什么是向量数据库' })
console.log(answer)
```

`prompt | model | parser` 等价于 `prompt.pipe(model).pipe(parser)`，读起来像 Unix 管道：前一个输出自动喂给后一个输入。

---

## 三、RunnableSequence：显式顺序链

`|` 底层就是 `RunnableSequence`，也可以显式写：

```typescript
import { RunnableSequence } from '@langchain/core/runnables'

const chain = RunnableSequence.from([
  prompt,
  model,
  parser,
])

await chain.invoke({ topic: 'RAG 是什么' })
```

> 当链较复杂（含分支、命名步骤）时，用 `RunnableSequence.from([...])` 更清晰。

---

## 四、RunnablePassthrough：透传 / 注入上下文

有时中间步骤需要把原始输入「透传」下去，或用 `assign` 往对象里塞字段：

```typescript
import { RunnablePassthrough } from '@langchain/core/runnables'

// 透传：输入原样向后传
const chain = RunnableSequence.from([
  RunnablePassthrough.assign({
    context: async (input) => {
      const docs = await retriever.invoke(input.question)
      return docs.map(d => d.pageContent).join('\n')
    },
  }),
  prompt,
  model,
  parser,
])
```

`RunnablePassthrough.assign({ context })` 会在流经时**动态检索**并把结果挂到 `{ context }` 字段，再交给 prompt 模板。

---

## 五、第一个完整 RAG 问答链

把前四天成果组装成「能回答问题」的链：

```typescript
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables'

const retriever = vectorStore.asRetriever({ k: 3 }) // Day 19 的 store

const prompt = ChatPromptTemplate.fromTemplate(`
根据以下上下文回答问题。如果上下文没有答案，回答「不知道」。
上下文：
{context}

问题：{question}
`)

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })

const ragChain = RunnableSequence.from([
  {
    context: (input) => retriever.invoke(input.question),
    question: (input) => input.question,
  },
  prompt,
  model,
  new StringOutputParser(),
])

const answer = await ragChain.invoke({
  question: '公司年假有几天？',
})
console.log(answer) // 基于《员工手册》真实内容作答
```

> 注意：这里 `context` 和 `question` 用对象形式并行取值（函数写法），比 `assign` 更直观。`retriever.invoke` 返回 `Document[]`，prompt 里用 `{context}` 需要它在模板里已是字符串——实际可加 `.then(docs => docs.map(d=>d.pageContent).join('\n'))`，或在 prompt 前接一步格式化。

---

## 六、链的组合能力（为什么重要）

| 能力 | 说明 |
|------|------|
| 可组合 | 链本身也是 Runnable，能继续 `|` 别的链 |
| 可流式 | `.stream()` 直接拿到逐字输出，无需改代码 |
| 可批量 | `.batch([q1,q2,q3])` 并发处理多个问题 |
| 可观测 | 配合 LangSmith 追踪每一步输入输出 |

这一步让「RAG」从概念变成**可运行的程序**——你已拥有第一个真正「开卷回答」的 Agent 雏形。

---

## 七、常见坑

1. **输入键不匹配**：prompt 模板用 `{question}`，链的输入就必须带 `question` 字段，否则报 `Missing value for prompt variable`。
2. **retriever 输出未转字符串**：`retriever.invoke` 返回 `Document[]`，需 `.map(d => d.pageContent).join('\n')` 再进 prompt。
3. **混用 `|` 与 `.pipe`**：两者等价，但对象式 `{context, question}` 不能用 `|`，要放进 `RunnableSequence.from([...])` 或 `RunnablePassthrough.assign`。
4. **忘记导出/复用**：把 `ragChain` 抽成函数 `buildRagChain(store)`，明天路由链会复用。
5. **官方站不可访问**：中文镜像 `js.langchain.com.cn` / `langchain.nodejs.cn`。

---

## 八、学习资料

以下站点均已验证可访问（国内镜像 / 中文）：

| 资源 | 链接 | 说明 |
|------|------|------|
| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | 总入口，含 LCEL / Chains 章节 |
| LangChain 中文文档 | https://langchain-doc.cn/ | 概念与 How-to 中文版 |
| LangChain 中文网 | https://langchain.nodejs.cn/docs/concepts/ | 概念文档（含 LCEL） |
| js.langchain.ac.cn LCEL 如何使用 | https://js.langchain.ac.cn/docs/concepts/lcel/ | LCEL 概念 |
| js.langchain.ac.cn 链式调用 | https://js.langchain.ac.cn/docs/how_to/sequence/ | 顺序链 How-to |
| 菜鸟教程 AI Agent 教程 | https://www.runoob.com/ai-agent/ai-agent-tutorial.html | 入门总览 |

---

## 九、明日预告

**Day 21：LangChain.js Chains（下）— 路由链**

顺序链所有问题走同一条路。但真实 Agent 需要「看人下菜」：数学题走计算器、闲聊走普通模型、检索类走 RAG。明天学 **Router Chain（路由链）** 与 `RunnableBranch`，让 Agent 根据问题类型自动分发到不同子链。

> 🚀 Day 20 完成！你写出了第一个完整 RAG 问答链——检索、拼 Prompt、调模型一气呵成。明天，让它学会「分情况处理」。
