---
id: "25"
title: "AI Agent 学习计划 Day 21：LangChain.js Chains（下）— 路由链"
slug: "ai-agent-day21-langchain-chains-lower"
date: "2026-07-22"
tags: ["AI Agent", "LangChain", "Chains", "Router", "RunnableBranch", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第二十一天。完成 Chains 模块：学会让 Agent「看人下菜」——用路由链（Router Chain / RunnableBranch）根据问题类型自动分发到不同子链。覆盖为什么需要路由、MultiPromptChain 旧式路由、LCEL 现代写法 RunnableBranch、语义路由（LLM 选择目的地），以及数学/检索/闲聊三类子链实战。"
readingTime: 34
---

# AI Agent 学习计划 Day 21：LangChain.js Chains（下）

> 📅 日期：2026-07-22  
> 🎯 阶段二：核心框架（Day 15-35）  
> 📊 学习进度：Day 21 / 84（25.0%）

## 前言

昨天我们学会了用顺序链把组件串成一条路：所有问题都走「检索 → 拼 Prompt → 作答」。但真实 Agent 不会这么死板——数学题该走计算器、知识问答走 RAG、闲聊走普通模型。**路由链（Router Chain）** 就是让 Agent「看人下菜」：先判断意图，再分发到最合适的子链。这是 Agent 智能化的关键一步。

---

## 一、为什么需要路由

```text
不加路由（所有问题一条路）：
  用户：「帮我算 123 × 456」→ RAG 检索不到 → 模型硬算易错
  用户：「讲个笑话」        → RAG 检索无意义 → 浪费

加路由（按意图分发）：
  数学题   → 计算器子链
  知识问答 → RAG 子链（昨天写的）
  闲聊      → 普通 LLM 子链
```

路由让每条请求都走「最对」的路，准确率更高、成本更省。

---

## 二、旧式路由：MultiPromptChain

LangChain 早期提供 `MultiPromptChain`，用 LLM 在多个「命名 Prompt」里挑最匹配的：

```typescript
import { MultiPromptChain } from 'langchain/chains'
import { OpenAI } from '@langchain/openai'

const promptDescriptions = [
  {
    name: '物理',
    description: '适用于物理问题，如力、能量、运动',
    prompt: ChatPromptTemplate.fromTemplate('你是个物理老师。{input}'),
  },
  {
    name: '数学',
    description: '适用于数学计算问题',
    prompt: ChatPromptTemplate.fromTemplate('你是个数学老师，请逐步计算。{input}'),
  },
]

const chain = MultiPromptChain.fromLLM(new OpenAI(), promptDescriptions)
await chain.invoke({ input: '牛顿第二定律是什么？' }) // → 路由到「物理」
```

> `description` 是给「路由 LLM」看的分类依据。缺点：API 较老、不够灵活，现代更推荐 LCEL 的 `RunnableBranch`。

---

## 三、现代路由：RunnableBranch（LCEL 首选）

`RunnableBranch` 用**条件函数**决定走哪条分支，最清晰可控：

```typescript
import { RunnableBranch } from '@langchain/core/runnables'

const branch = RunnableBranch.from([
  {
    // 条件：问题含数字运算 → 走数学链
    condition: (input) => /\d+\s*[\+\-\*\/]\s*\d+/.test(input.question),
    chain: mathChain,
  },
  {
    // 条件：命中知识库关键词 → 走 RAG 链
    condition: (input) => isKnowledgeQuestion(input.question),
    chain: ragChain,
  },
  // 默认分支（兜底）：普通闲聊
  generalChain,
])

await branch.invoke({ question: '123 * 456 等于多少？' }) // → mathChain
```

- 每个分支是 `{ condition, chain }`
- 最后一个**无 condition** 的即默认分支（必须提供，作兜底）
- 条件函数返回 `true` 即用对应 `chain`，按顺序匹配

---

## 四、语义路由：让 LLM 来选择目的地

规则条件（正则/关键词）太死板。更强大的是**让 LLM 做分类**，输出一个目的地标签，再映射子链：

```typescript
import { RunnableSequence } from '@langchain/core/runnables'
import { z } from 'zod'

// 1. 路由分类器：用 withStructuredOutput 让模型选目的地
const router = model.withStructuredOutput(
  z.object({
    destination: z.enum(['math', 'rag', 'chat']).describe('问题类型'),
    reason: z.string(),
  })
).pipe(
  // 2. 把标签映射到具体子链
  (decision) => {
    const map = { math: mathChain, rag: ragChain, chat: generalChain }
    return map[decision.destination]
  }
)

// 3. 组合：先路由，再执行选中的子链
const app = RunnableSequence.from([
  { question: (i) => i.question, category: (i) => router.invoke(i.question) },
  // 这里 category 是子链本身，需要 invoke
  async (input) => input.category.invoke(input),
])

await app.invoke({ question: '我们公司年假几天？' }) // → ragChain
```

> 语义路由比正则更强：能理解「帮我算下这组数据的标准差」也是数学类。代价是多一次 LLM 调用（可用小模型降本）。

---

## 五、完整实战：三类子链路由

```typescript
import { RunnableBranch, RunnableSequence } from '@langchain/core/runnables'

// 三个子链（前面已构建）
const mathChain = promptMath | model | parser
const ragChain  = buildRagChain(store)          // Day 20
const chatChain = promptChat | model | parser

const routerChain = RunnableBranch.from([
  {
    condition: (i) => /计算|算一下|等于|×|\*/.test(i.question),
    chain: mathChain,
  },
  {
    condition: (i) => /年假|手册|制度|公司/.test(i.question),
    chain: ragChain,
  },
  chatChain, // 兜底
])

const app = RunnableSequence.from([
  { question: (i) => i.question },
  routerChain,
])

console.log(await app.invoke({ question: '年假有几天？' }))   // RAG
console.log(await app.invoke({ question: '3.14 * 100 = ?' })) // 数学
console.log(await app.invoke({ question: '你好呀' }))          // 闲聊
```

---

## 六、路由链 vs 顺序链（何时用哪个）

| 场景 | 用顺序链 | 用路由链 |
|------|---------|---------|
| 所有请求走同一流程 | ✅ | |
| 需按类型分流 | | ✅ |
| 流程固定、线性 | ✅ | |
| 多专家/多工具切换 | | ✅ |

> 实际 Agent = 路由链（外层分发） + 顺序链（内层处理）的组合。

---

## 七、常见坑

1. **忘记默认分支**：`RunnableBranch` 必须提供无 condition 的兜底链，否则无匹配时报错。
2. **条件顺序敏感**：分支按数组顺序匹配，第一个 `true` 即命中，把「更具体」的条件放前面。
3. **语义路由多一次调用**：可用 `gpt-4o-mini` 做路由器降本；别用大模型分类浪费钱。
4. **子链输入键不一致**：路由后子链拿到的输入要和子链 `.invoke` 期望的键一致。
5. **官方站不可访问**：中文镜像 `js.langchain.com.cn` / `langchain.nodejs.cn`。

---

## 八、学习资料

以下站点均已验证可访问（国内镜像 / 中文）：

| 资源 | 链接 | 说明 |
|------|------|------|
| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | 总入口，含 Chains / Routing |
| LangChain 中文文档 | https://langchain-doc.cn/ | 概念与 How-to 中文版 |
| LangChain 中文网 | https://langchain.nodejs.cn/docs/concepts/ | 概念文档 |
| js.langchain.ac.cn 路由链 | https://js.langchain.ac.cn/docs/how_to/routing/ | 路由 How-to |
| js.langchain.ac.cn 链式调用 | https://js.langchain.ac.cn/docs/how_to/sequence/ | 顺序链 How-to |
| 菜鸟教程 AI Agent 教程 | https://www.runoob.com/ai-agent/ai-agent-tutorial.html | 入门总览 |

---

## 九、明日预告

**Day 22：LangChain.js Agents（上）— ReAct Agent 与 Tool 调用**

路由链还是「静态分支」。真正自主的 Agent 能**自己决定调哪个工具、调几次**：ReAct（推理+行动）范式让模型边思考边调工具，直到得出答案。明天我们接入真实 Tool，写出第一个会「动手」的 Agent。

> 🚀 Day 21 完成！你的 Agent 现在会「分情况处理」了。明天，让它学会自己调用工具。
