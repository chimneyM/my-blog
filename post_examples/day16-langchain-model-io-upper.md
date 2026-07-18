---
id: "18"
title: "AI Agent 学习计划 Day 16：LangChain.js Model I/O（上）— LLM 调用与 Prompt 模板"
slug: "ai-agent-day16-langchain-model-io-upper"
date: "2026-07-17"
tags: ["AI Agent", "LangChain", "Model I/O", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第十六天。深入 LangChain.js 的 Model I/O 三层模型（Prompt → Model → OutputParser）：用 ChatOpenAI 初始化模型与常用参数、理解 System/Human/AI 消息类型、掌握 PromptTemplate / ChatPromptTemplate / FewShot / MessagePlaceholder，并用 LCEL 的 pipe 把组件串联成链。"
readingTime: 32
---

# AI Agent 学习计划 Day 16：LangChain.js Model I/O（上）

> 📅 日期：2026-07-17  
> 🎯 阶段二：核心框架（Day 15-35）  
> 📊 学习进度：Day 16 / 84（19.0%）

## 前言

昨天定好了兵器——LangChain.js。今天动手拆它的第一个核心模块：**Model I/O**。几乎所有 Agent 能力（对话、工具调用、规划）都建立在「把 Prompt 喂给模型、再把模型输出解析出来」这一环上。理解 Model I/O，就理解了 LangChain 的「输入→推理→输出」主链路。

---

## 一、Model I/O 三层结构

```text
        ┌─────────────┐
输入 ──▶│  PromptTemplate │  把变量渲染成最终提示词
        └──────┬──────┘
               │ 渲染后的 messages
        └──────┬──────┘
               │
        ┌──────▼─────┐
        │   Model     │  ChatOpenAI 等，调用 LLM
        └──────┬──────┘
               │ 模型原始输出（AIMessage）
        ┌──────▼─────┐
        │OutputParser │ 把输出解析成可用结构
        └──────┬──────┘
               │
输出 ──▶  结构化结果 / 文本
```

记住这三层：**Prompt（怎么问）→ Model（谁来答）→ OutputParser（怎么用答案）**。

---

## 二、Model：用 ChatOpenAI 调模型

### 2.1 初始化与常用参数

```typescript
import { ChatOpenAI } from '@langchain/openai'

const model = new ChatOpenAI({
  model: 'gpt-4o-mini', // 模型名
  temperature: 0.7,     // 0=确定性，越高越随机
  maxTokens: 1024,      // 最大输出长度
  // apiKey 默认读 process.env.OPENAI_API_KEY
})

const res = await model.invoke('用一句话介绍 LangChain')
console.log(res.content)
```

> 用 `model.invoke(input)` 得到的是 `AIMessage` 对象，`res.content` 才是文本。也可以用 `await model.call(...)` 的老写法，但推荐 `invoke`。

### 2.2 消息类型（System / Human / AI）

LangChain 用消息对象表达角色，对应 Day 10 学的消息角色：

```typescript
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages'

const messages = [
  new SystemMessage('你是一个严谨的 TypeScript 专家。'),
  new HumanMessage('什么是泛型？'),
  // AIMessage 通常来自模型回复，也可手动构造多轮
  new AIMessage('泛型是……'),
  new HumanMessage('能给个例子吗？'),
]

const res = await model.invoke(messages)
```

---

## 三、Prompt：模板化地「提问」

### 3.1 PromptTemplate（单段文本）

```typescript
import { PromptTemplate } from '@langchain/core/prompts'

const tpl = PromptTemplate.fromTemplate('请解释 {concept}，用 {level} 难度的语言。')

const prompt = await tpl.format({ concept: '闭包', level: '入门' })
// → "请解释 闭包，用 入门 难度的语言。"
```

### 3.2 ChatPromptTemplate（多角色对话）

Agent 几乎都用对话模板：

```typescript
import { ChatPromptTemplate } from '@langchain/core/prompts'

const chatTmpl = ChatPromptTemplate.fromMessages([
  ['system', '你是一个{role}，回答要简洁。'],
  ['human', '{question}'],
])

const messages = await chatTmpl.formatMessages({
  role: '编程助手',
  question: 'TypeScript 和 JavaScript 的区别？',
})
// messages 是 [SystemMessage, HumanMessage]
```

### 3.3 FewShot（少样本示例）

给模型看几个例子，它学得更快——对应 Day 11 的 Few-shot Prompting：

```typescript
import { FewShotPromptTemplate, PromptTemplate } from '@langchain/core/prompts'

const exampleTpl = PromptTemplate.fromTemplate('输入：{input}\n输出：{output}')

const fewShot = new FewShotPromptTemplate({
  examplePrompt: exampleTpl,
  examples: [
    { input: 'happy', output: 'positive' },
    { input: 'sad', output: 'negative' },
  ],
  prefix: '把情绪分类为 positive / negative：',
  suffix: '输入：{text}\n输出：',
  inputVariables: ['text'],
})

const prompt = await fewShot.format({ text: 'excited' })
```

### 3.4 MessagePlaceholder（动态插入消息列表）

做多轮对话或 Agent 历史时，用占位符把「一整段消息数组」塞进去：

```typescript
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'

const chatTmpl = ChatPromptTemplate.fromMessages([
  ['system', '你是助手。'],
  new MessagesPlaceholder('history'), // 运行时用消息数组填充
  ['human', '{input}'],
])

const messages = await chatTmpl.formatMessages({
  history: [new HumanMessage('我是小明'), new AIMessage('你好小明')],
  input: '我刚说我叫什么？',
})
```

---

## 四、LCEL：用 pipe 串联组件

LangChain 的表达式语言（LCEL）用 `.pipe()` 把组件连成「链」，像管道一样流动：

```typescript
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })
const chatTmpl = ChatPromptTemplate.fromMessages([
  ['system', '你是一个{role}'],
  ['human', '{question}'],
])

// Prompt → Model → 解析器
const chain = chatTmpl.pipe(model).pipe(new StringOutputParser())

const answer = await chain.invoke({
  role: 'TypeScript 专家',
  question: '什么是装饰器？',
})
console.log(answer)
```

`chain.invoke(input)` 会自动：渲染 Prompt → 调用 Model → 解析输出。这就是 LangChain 的「组合即编程」。

> `pipe` 还能 `await chain.stream(...)` 流式输出，也能 `chain.batch([...])` 批量跑，非常灵活。

---

## 五、关键注意点

1. **导入路径**：模型来自 `@langchain/openai`，提示词/解析器来自 `@langchain/core`。
2. **invoke vs stream**：需要实时输出用 `chain.stream()`；普通用 `chain.invoke()`。
3. **变量必须匹配**：模板里的 `{xxx}` 在 `format/invoke` 时都要提供，否则报错。
4. **中文文档**：优先用 `js.langchain.com.cn`，不要用官方 `.com`（国内可能不可访问）。

---

## 六、学习资料

以下站点均已验证可访问（国内镜像 / 中文）：

| 资源 | 链接 | 说明 |
|------|------|------|
| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | 官方中文镜像 |
| ChatOpenAI 集成 中文文档 | https://docs.langchain.org.cn/oss/javascript/integrations/chat/openai | ChatOpenAI 参数 |
| ChatOpenAI \| Langchain JavaScript 教程 | https://js.langchain.ac.cn/docs/integrations/chat/openai/ | 调用示例 |
| LangChain.js 入门教程 - 模型调用 | https://langchainjs-learn.vercel.app/03-模型调用.html | 上手教程 |
| LangChain 最详细教程 Model I/O（二）Prompt Template（CSDN） | https://blog.csdn.net/m0_74977182/article/details/153922895 | Prompt 详解 |
| LangChain 框架入门03 PromptTemplate（知乎） | https://zhuanlan.zhihu.com/p/1929913456557003553 | 入门 |
| 保姆级 LangChain 入门（知乎） | https://zhuanlan.zhihu.com/p/1921985393626167192 | 总览 |

---

## 七、明日预告

**Day 17：LangChain.js Model I/O（下）— 输出解析（Output Parsers）**

今天我们把「Prompt → Model」打通了。明天看最后一环 OutputParser：如何把模型的自由文本变成 JSON、结构化对象，从而能被代码可靠使用（`StringOutputParser` / `JsonOutputParser` / `StructuredOutputParser` + Zod / `withStructuredOutput`）。

> 🚀 Day 16 完成！你已经能用 LangChain 把「提示词 → 模型 → 文本」串成一条链。明天我们让模型输出「机器能读懂」的结构。
