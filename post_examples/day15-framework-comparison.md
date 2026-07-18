---
id: "17"
title: "AI Agent 学习计划 Day 15：框架选型对比 — LangChain.js / Vercel AI SDK / AutoGen / CrewAI"
slug: "ai-agent-day15-framework-comparison"
date: "2026-07-16"
tags: ["AI Agent", "框架", "LangChain", "Vercel AI SDK", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第十五天，阶段二启动。对比四大主流 Agent 框架的定位与适用场景：LangChain.js（生态最丰富）、Vercel AI SDK（轻量流式、前端友好）、AutoGen（微软多 Agent 协作）、CrewAI（角色扮演式多 Agent），并给出选型对比维度表与本计划的框架使用策略。"
readingTime: 28
---

# AI Agent 学习计划 Day 15：框架选型对比

> 📅 日期：2026-07-16  
> 🎯 阶段二：核心框架（Day 15-35）启动  
> 📊 学习进度：Day 15 / 84（17.9%）

## 前言

阶段一我们理解了 Agent 的「原理」。从今天起进入阶段二——**用真实框架把 Agent 造出来**。但动手前先要「选兵器」：现在 Agent 框架多如牛毛，盲目上手容易踩坑。今天对比四个最具代表性的框架，帮你建立选型直觉。

---

## 一、四大框架定位

### 1.1 LangChain.js —— 生态最丰富

- **定位**：Agent / LLM 应用的全套工具箱。
- **强项**：链式编排（LCEL）、海量集成（LLM/向量库/工具）、检索（RAG）成熟。
- **弱项**：抽象层多，初学者易晕；包体偏大。
- **适合**：需要 RAG、复杂链、大量第三方集成的后端 Agent。

### 1.2 Vercel AI SDK —— 轻量、流式、前端友好

- **定位**：为「前端 + AI」而生的轻量 SDK。
- **强项**：`useChat` 等 React 钩子、统一多模型接口、流式开箱即用、体积小。
- **弱项**：复杂 Agent 编排能力不如 LangChain；偏前端场景。
- **适合**：Next.js / React 应用里快速接入流式对话与简单 Agent。

### 1.3 AutoGen（微软）—— 多 Agent 协作

- **定位**：让多个 Agent「对话」来完成任务。
- **强项**：Conversation 多 Agent 编排、人机协同（Human-in-the-loop）、代码执行。
- **弱项**：Node 生态相对 Python 弱；概念较重。
- **适合**：研究型、需要多角色分工讨论的复杂任务。

### 1.4 CrewAI —— 角色扮演式多 Agent

- **定位**：用「团队（Crew）+ 角色（Agent）+ 任务（Task）」组织多 Agent。
- **强项**：声明式定义团队，开箱即用的多 Agent 流水线。
- **弱项**：偏 Python 优先；灵活度低于手写编排。
- **适合**：把工作流拆成多个「岗位」自动跑（如调研→写作→审校）。

---

## 二、选型对比维度表

| 维度 | LangChain.js | Vercel AI SDK | AutoGen | CrewAI |
|------|-------------|---------------|---------|--------|
| 主要语言 | TypeScript | TypeScript | Python/TS | Python |
| 单 Agent | ✅ 强 | ✅ 轻量 | ✅ | ✅ |
| 多 Agent | ⚠️ 需 LangGraph | ⚠️ 需自己编排 | ✅ 原生 | ✅ 原生 |
| 流式输出 | ✅ | ✅ 最佳 | ⚠️ | ⚠️ |
| RAG/检索 | ✅ 最强 | ⚠️ 基础 | ⚠️ | ⚠️ |
| 前端集成 | 一般 | ✅ 最佳 | 弱 | 弱 |
| 学习曲线 | 较陡 | 平缓 | 中 | 平缓 |

---

## 三、本计划的框架使用策略

结合我们是 **TypeScript / Node.js** 技术栈，且目标是从入门到实战，本计划采用「先深后广」：

```text
Day 16-25  LangChain.js 主攻
            ├── Model I/O（Prompt/Model/OutputParser）
            ├── Chains / LCEL
            ├── Tools & Tool Calling
            ├── Memory
            └── Agents / LangGraph 入门

Day 26-33  Vercel AI SDK 主攻
            ├── 统一模型接口
            ├── useChat / 流式 UI
            ├── Tool Calling
            └── 与前端结合（Next.js）

Day 34-35  整合：用两个框架各写一个完整 Agent 对比体感
```

**为什么先 LangChain.js？** 它的抽象最完整，学完能理解 Agent 的全套组件；**再用 Vercel AI SDK** 则能体会「轻量 + 流式 + 前端」的爽感，二者互补。

> AutoGen / CrewAI 偏 Python 且核心是「多 Agent 编排」，本计划以 TS 为主线，故作为概念了解，不深入编码（感兴趣可自行拓展）。

---

## 四、最小对比：同一个 Agent，两种写法

用「问 LLM 一个问题」展示两者风格差异：

**LangChain.js**

```typescript
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })
const prompt = ChatPromptTemplate.fromTemplate('用一句话解释：{topic}')
const chain = prompt.pipe(model).pipe(new StringOutputParser())
const answer = await chain.invoke({ topic: '什么是 AI Agent' })
```

**Vercel AI SDK**

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const { text } = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: '用一句话解释：什么是 AI Agent',
})
```

两者都能完成任务，但 LangChain 强调「链的可组合」，Vercel 强调「一行调用 + 前端友好」。

---

## 五、学习资料

以下站点均已验证可访问（国内镜像 / 中文）：

| 资源 | 链接 | 说明 |
|------|------|------|
| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | 官方中文镜像 |
| LangChain 中文文档 | https://langchain-doc.cn/ | 中文手册 |
| Vercel AI SDK 中文文档 | https://ai-sdk.com.cn/docs/introduction | 官方中文镜像 |
| Vercel AI SDK 6 完整教程（腾讯云） | https://cloud.tencent.com/developer/article/2630363 | 实战教程 |
| Vercel AI SDK 完整深入教程（掘金） | https://juejin.cn/post/7604761524977500169 | 深入讲解 |
| 2026 AI Agent 框架终极对比（掘金） | https://juejin.cn/post/7636584182789718058 | 横向对比 |
| 2026 多 Agent 框架横评 | https://www.holysheep.ai/articles/zh-langchain-vs-autogen-vs-crewai-vs-langgraph-2026-d-2026-06-24-0030.html | 多框架评测 |
| 2026 AI Agent 框架横向对比（CSDN） | https://blog.csdn.net/2501_91483426/article/details/161573784 | 对比文章 |

---

## 六、明日预告

**Day 16：LangChain.js Model I/O（上）— LLM 调用与 Prompt 模板**

正式动手 LangChain.js。我们会拆开 Model I/O 三层结构（Model / Prompt / OutputParser），学会用 `ChatOpenAI` 调模型、用 `ChatPromptTemplate` 组织提示词，并用 LCEL 的 `pipe` 把组件串起来。

> 🚀 Day 15 完成！选对框架，事半功倍。接下来 10 天，我们扎进 LangChain.js，把 Agent 的每个零件都拆开看一遍。
