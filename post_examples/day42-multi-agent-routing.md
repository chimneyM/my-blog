---
id: "46"
title: "多 Agent 编排（二）：路由分发模式"
slug: "ai-agent-day42-multi-agent-routing"
date: "2026-08-12"
tags: ["AI Agent", "阶段三进阶", "多Agent", "路由", "Router", "意图分发", "LangChain"]
excerpt: "多 Agent 编排第二篇：路由分发模式（Router）。用一个 Router Agent 分析用户意图，把请求分发到最匹配的专业 Agent（如数学/检索/闲聊），避免所有问题都走同一长链路。覆盖为什么需要路由、RunnableBranch 条件分支、withStructuredOutput 语义路由、多专业 Agent 实战、与顺序链（Day 41）的选型对比、常见坑。"
readingTime: 14
---

## 回顾与今天的目标

- Day 41：顺序链（Sequential）——多个 Agent 固定顺序接力，前输出即后输入。适合**流程确定**的任务。
- **今天（Day 42）**：路由分发模式（Router）——流程**不确定**，需要「看情况走不同分支」。用一个 Router Agent 判断用户意图，分发到最合适的专业 Agent（数学 / 检索 / 闲聊 …）。

顺序链是「一条流水线」，路由是「一个调度台」。现实 Agent 系统往往两者结合：先用路由分发，再各自顺序处理。

## 1. 为什么需要路由

| 场景 | 顺序链 | 路由 |
| --- | --- | --- |
| 用户问数学题 | 也走 研究→写作 | ✅ 直接走 math Agent，省两步 |
| 用户问知识库 | 也走全流程 | ✅ 走 RAG Agent |
| 用户闲聊 | 也走全流程 | ✅ 走 chat Agent，不浪费检索成本 |
| 意图清晰单一 | 合适 | 更合适（按需分发） |

路由的核心价值：**避免所有请求都塞进同一条重链路**，按意图精准调度，省钱省时。

## 2. 路由的两种实现

### （1）硬路由：RunnableBranch（条件函数）

适合「能靠规则/关键词判断」的分发，零额外 LLM 调用：

```ts
import { RunnableBranch } from '@langchain/core/runnables'
import { RunnableSequence } from '@langchain/core/runnables'

const route = RunnableBranch.from([
  [(input) => /计算|等于|求值/.test(input.question), mathChain],
  [(input) => /知识库|文档|资料/.test(input.question), ragChain],
  chatChain, // 默认兜底分支（必填）
])

const result = await route.invoke({ question: '帮我算 3+5 的 2 倍' })
```

> **注意**：`RunnableBranch.from` 最后一个必须是**无条件的兜底分支**，否则未命中会报错。

### （2）软路由：语义路由（Router Agent 用 LLM 选目的地）

意图模糊、规则覆盖不了时，让 LLM 先「分类」，再映射子链。这是真正的「Router Agent」：

```ts
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'

const llm = new ChatOpenAI({ model: 'gpt-4o-mini' })

// 1) Router：用 withStructuredOutput 让 LLM 输出目的地标签
const routerSchema = z.object({
  destination: z.enum(['math', 'rag', 'chat']).describe('意图分类'),
  reason: z.string(),
})
const router = llm.withStructuredOutput(routerSchema)

// 2) 目的地 → 子链映射
const chainMap = { math: mathChain, rag: ragChain, chat: chatChain }

const { destination } = await router.invoke(
  `判断用户意图：${question}`
)
const result = await chainMap[destination].invoke({ question })
```

> 语义路由多一次 LLM 调用（分类），但能处理口语化、混合意图，灵活度远高于硬路由。

## 3. 多专业 Agent 实战（math / rag / chat）

```ts
// 三个专业子链（复用 Day 20 顺序链写法）
const mathChain = ChatPromptTemplate.fromTemplate('你是数学助手，只算不解释：{question}')
  .pipe(llm)
const ragChain = RunnableSequence.from([ /* Day 39 的 检索→拼接→回答 */ ])
const chatChain = ChatPromptTemplate.fromTemplate('你是闲聊助手：{question}')
  .pipe(llm)

// 组合：Router 选目的地 → 走对应子链
async function dispatch(question: string) {
  const { destination } = await router.invoke(`分类：${question}`)
  return chainMap[destination].invoke({ question })
}
```

## 4. 路由 vs 顺序链 选型

| 维度 | 顺序链（Day 41） | 路由（Day 42） |
| --- | --- | --- |
| 流程 | 固定顺序 | 按意图分支 |
| 适用 | 步骤确定（研究→写→审） | 入口多元（问答/闲聊/计算） |
| 成本 | 每步都跑 | 只跑命中的分支 |
| 复杂度 | 低 | 中（需维护映射表） |

> 工业实践常「路由 + 顺序」组合：Router 分发后，每个专业 Agent 内部再用顺序链处理。

## 5. 常见坑

- **缺默认兜底分支**：`RunnableBranch.from` 末尾必须放无条件的 `chatChain`，否则未命中意图会抛错。
- **条件顺序敏感**：硬路由按数组顺序判定，更具体的规则要放前面，避免被宽泛规则先命中。
- **语义路由多一次调用**：分类也要花钱花时，高频场景考虑硬路由或缓存分类结果。
- **子链输入键不一致**：math/rag/chat 的 prompt 变量要统一（都用 `{question}`），否则分发后报缺变量。
- **路由标签漂移**：LLM 分类输出不在 enum 内（如大小写），用 Zod enum + 兜底收敛。
- **过度路由**：两三个分支硬拆成十个，映射表维护成本飙升，适度即可。
- **官方站不可访问**：LangChain 路由文档国内可能受限，优先中文镜像。

## 学习资料与网站（国内可访问镜像）

- LangChain JS 中文文档（Chains/路由）：https://js.langchain.com.cn/docs/
- LangChain 中文文档：https://langchain-doc.cn/
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html
- 掘金 多 Agent 编排实战：https://juejin.cn/post/7357554457913966627

## 学习建议

- 先写硬路由（关键词规则）跑通结构，再换成语义路由体会「LLM 分类」的灵活性。
- 务必加默认兜底分支（chatChain），并测一个「完全不相关」的问题验证兜底生效。
- 把路由分发的结果（destination + reason）打印出来，观察 LLM 分类是否稳定，为 Day 43 协作模式做准备。

⏰ 预计学习时长：2.5 小时
