---
id: "15"
title: "AI Agent 学习计划 Day 13：AI Agent 概念 — Memory 与 Planning"
slug: "ai-agent-day13-memory-planning"
date: "2026-07-14"
tags: ["AI Agent", "记忆", "规划", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第十三天。深入 Agent 两大核心能力：记忆系统（短期记忆/长期记忆/工作记忆/情景记忆、记忆管理策略与向量检索）与规划能力（任务分解、Chain-of-Thought / Tree-of-Thought 多步推理、ReAct 的 Thought-Action-Observation 循环、Plan-and-Execute、反思机制 Reflexion、动态重规划），并讲解 Memory + Planning 如何协同让 Agent 完成复杂任务。"
readingTime: 35
---

# AI Agent 学习计划 Day 13：AI Agent 概念 — Memory 与 Planning

> 📅 日期：2026-07-14  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 13 / 84（15.5%）

## 前言

Day 10 我们建立了 Agent 的整体认知：Agent = LLM（大脑）+ 工具（手）+ 记忆（心）+ 规划（思维）。Day 11、12 原计划深入 Prompt Engineering 与 Function Calling——这两个能力是 Agent 与 LLM 高效沟通、调用工具的基础。今天我们把焦点放到 Agent 另外两个决定「能否成事」的核心能力上：**记忆（Memory）** 与 **规划（Planning）**。

如果说 LLM 是「聪明的大脑」，工具是「能干的手」，那么：

- **记忆** 让 Agent 拥有「经验」——不会转头就忘；
- **规划** 让 Agent 拥有「章法」——面对复杂目标不会手足无措。

两者结合，Agent 才能从「一问一答的聊天机器人」进化为「能独立完成复杂任务的智能体」。

---

## 一、Agent 的记忆系统（Memory）

LLM 本身是无状态的：每次 API 调用，它只看到你传给它的 `messages` 数组，调用结束即「失忆」。要让 Agent 跨轮次、跨会话保持上下文，必须引入记忆系统。

### 1.1 四类记忆

业界通常把 Agent 记忆划分为四个层次：

| 记忆类型 | 类比 | 实现方式 | 容量 | 持久性 |
|---------|------|---------|------|--------|
| **短期记忆 Short-term** | 正在想的事 | LLM 上下文窗口（messages 数组） | 有限（几 K~几百 K Token） | 会话内 |
| **工作记忆 Working** | 草稿本 | Scratchpad / 状态对象 | 可变 | 任务内 |
| **长期记忆 Long-term** | 长期经验 | 向量数据库 + 摘要 | 近乎无限 | 永久 |
| **情景记忆 Episodic** | 过去的经历 | 结构化事件存储 | 无限 | 永久 |

### 1.2 短期记忆与上下文压缩

短期记忆直接对应 LLM 的上下文窗口。当对话变长，超过窗口限制时会被截断，导致「前面说过的话忘了」。

**解决策略——摘要压缩（Compaction）：**

```typescript
class ShortTermMemory {
  private messages: Message[] = []
  private readonly maxTokens = 8000

  add(msg: Message) {
    this.messages.push(msg)
    if (this.tokenCount() > this.maxTokens) {
      this.compress()
    }
  }

  // 把最早的 N 条消息摘要后，与最近消息合并
  private async compress() {
    const old = this.messages.slice(0, -10)
    const recent = this.messages.slice(-10)
    const summary = await llm.summarize(old)
    this.messages = [
      { role: 'system', content: `历史摘要：${summary}` },
      ...recent,
    ]
  }
}
```

### 1.3 长期记忆与向量检索

长期记忆让 Agent「记得过去」。典型做法是把文本切块、向量化后存入向量数据库（如 Chroma、Qdrant、pgvector），需要时做相似度检索。

```typescript
// 长期记忆：写入与检索
interface LongTermMemory {
  add(text: string, metadata?: Record<string, unknown>): Promise<void>
  recall(query: string, topK?: number): Promise<string[]>
}

async function remember(memory: LongTermMemory, fact: string) {
  await memory.add(fact, { type: 'user-preference', ts: Date.now() })
}

async function recall(memory: LongTermMemory, question: string) {
  // 相似度检索相关记忆，注入到 prompt
  const hits = await memory.recall(question, 5)
  return hits.join('\n')
}
```

> **关键点**：长期记忆检索到的内容会被拼回上下文（短期记忆），形成「长期 → 短期」的回流。这是 RAG（检索增强生成）的核心思想，我们会在阶段三深入。

### 1.4 工作记忆与情景记忆

- **工作记忆**：保存当前任务的中间状态、推理草稿（Scratchpad）。ReAct 模式里的 `Thought` 就写在这里。
- **情景记忆**：记录「我之前是怎么完成这类任务的」。Agent 从过去成功/失败的经验中学习，避免重复踩坑。

### 1.5 记忆管理策略小结

1. **写入策略**：什么值得记？（用户偏好、关键事实、任务结论）
2. **压缩策略**：短期记忆超限时摘要；长期记忆定期合并去重。
3. **检索策略**：长期记忆用向量相似度召回，而非全量塞回。
4. **遗忘策略**：过期信息设 TTL 自动清理，避免噪声累积。

---

## 二、Agent 的规划能力（Planning）

规划是把「一个模糊的大目标」拆成「一串可执行的小步骤」的能力。没有规划，Agent 遇到多步任务就会卡住。

### 2.1 任务分解（Task Decomposition）

最朴素的规划就是把任务拆成子任务，再递归拆到「单步可执行」。

```text
目标：调研并输出一份「2026 年 AI Agent 框架对比」报告

规划：
  ├── 1. 检索主流框架（LangChain / Vercel AI SDK / AutoGen / CrewAI）
  ├── 2. 整理每个框架的定位、优缺点、适用场景
  ├── 3. 设计对比维度表
  ├── 4. 撰写报告正文
  └── 5. 校对并输出
```

### 2.2 Chain-of-Thought（思维链）

让 LLM 在给出答案前「把思考过程写出来」，显著提升复杂推理准确率。

```text
无 CoT：
  Q: 球场有 23 人，走了 11 人，又来了 7 人，现在几人？
  A: 19

有 CoT：
  Q: ...
  A: 逐步算：23 - 11 = 12，12 + 7 = 19。答案是 19。
```

在 Agent 里，CoT 是「先想清楚再动手」的基础。

### 2.3 Tree-of-Thought（思维树）

CoT 是单链推理；ToT 则让 LLM 同时探索多条推理分支，评估后选择最优路径——适合需要「试错与回溯」的问题（如谜题、规划）。

```text
       根问题
      /   |   \
   分支A  分支B  分支C
    |      |      |
  评估→ 剪枝   评估→ 保留
              |
           继续展开...
```

### 2.4 ReAct：Thought-Action-Observation 循环

ReAct（Reasoning + Acting）是 Agent 最经典的范式，把「推理」和「行动」交织在一起：

```text
Thought: 用户问 2026 最新 GPT 模型，我的训练数据可能不含，需搜索
Action: web_search("OpenAI GPT 最新模型 2026")
Observation: [结果] OpenAI 于 2026 发布 GPT-5 ...
Thought: 已确认最新是 GPT-5，可以作答
Final Answer: 2026 年 OpenAI 最新模型是 GPT-5。
```

```typescript
// ReAct 最简循环骨架
async function reactLoop(goal: string, tools: Tool[]) {
  const scratchpad = ''
  for (let i = 0; i < MAX_STEPS; i++) {
    const out = await llm({
      system: REACT_PROMPT,
      user: `目标：${goal}\n${scratchpad}`,
    })
    if (out.finish) return out.answer
    const obs = await runTool(tools, out.action, out.actionInput)
    scratchpad += `\nThought: ${out.thought}\nAction: ${out.action}\nObservation: ${obs}`
  }
}
```

### 2.5 Plan-and-Execute

ReAct 是「走一步看一步」；Plan-and-Execute 则先**一次性制定完整计划**，再逐步执行。优点是全局视野好，缺点是计划可能中途失效，需要配合「动态重规划」。

```text
Planner LLM:  制定完整计划 → [步骤1, 步骤2, 步骤3, ...]
Executor:     逐步执行，每步把结果回传
Replanner:    若某步失败/环境变化，重新规划剩余步骤
```

### 2.6 Reflexion：反思机制

Reflexion 让 Agent 在任务结束后「复盘」：哪里做错了？为什么？把反思写回记忆，下次改进。

```typescript
async function reflect(trajectory: Step[], result: 'success' | 'fail') {
  const lesson = await llm(`基于以下执行轨迹与结果，总结一条可复用的经验：
轨迹：${trajectory}
结果：${result}`)
  await memory.add(lesson, { type: 'episodic' })
}
```

### 2.7 动态重规划（Dynamic Replanning）

现实任务充满意外。好的 Agent 会根据执行反馈调整计划：

```typescript
interface Planner {
  createPlan(goal: string): Plan
  replan(plan: Plan, completed: Step[], lastResult: ToolResult): Plan
}
```

---

## 三、Memory + Planning 协同

记忆与规划不是孤立的，它们彼此增强：

```text
┌─────────────────────────────────────────────┐
│         Memory × Planning 协同闭环           │
│                                               │
│  长期记忆 ──检索──▶ 规划时参考历史经验         │
│     ▲                    │                    │
│     │                    ▼                    │
│  执行结果 ──写入── 情景记忆（复盘经验）         │
│     ▲                    │                    │
│     │                    ▼                    │
│  工作记忆 ◀──规划产出步骤 / 推理草稿           │
│     │                                        │
│     └──短期记忆承载当前轮上下文                │
└─────────────────────────────────────────────┘
```

一句话：**规划决定「做什么」，记忆提供「凭什么做 / 做过什么」**。两者结合，Agent 才能稳定完成长周期、多步骤的复杂任务。

---

## 四、学习资料

以下站点均已验证可访问（国内镜像 / 中文）：

| 资源 | 链接 | 说明 |
|------|------|------|
| LangChain 中文文档 - 记忆概述 | https://langchain-doc.cn/v1/python/langgraph/memory.html | 记忆模块总览 |
| LangChain 中文文档 - 短期记忆 | https://langchain-doc.cn/v1/python/langchain/short-term-memory.html | 短期记忆实现 |
| Memory 记忆 \| LangChain 中文学习手册 | https://www.langchain.online/langchain/memory | 中文手册 |
| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | JS 版本文档 |
| ReAct 推理与行动融合（知乎） | https://zhuanlan.zhihu.com/p/1935762059888419552 | ReAct 原理 |
| ReAct Agent 终极指南（掘金） | https://juejin.cn/post/7518707715129688064 | 实战 |
| ReAct Agent 原理与实战（腾讯云） | https://cloud.tencent.com/developer/article/2571430 | 原理+代码 |
| AI Agent 架构设计 React/Plan-Exec/Reflect（腾讯云） | https://cloud.tencent.com.cn/developer/article/2655650 | 三种范式对比 |
| LangChain Agent 架构设计详解（掘金） | https://juejin.cn/post/7535015508150517770 | 架构落地 |
| 规划与工具调用原理（SegmentFault） | https://segmentfault.com/a/1190000047522016 | 规划原理 |

---

## 五、明日预告

**Day 14：阶段一总结与复习**

明天是阶段一的收官日。我们会用一张「知识地图」串联 Day 1-13 的全部要点（TypeScript 类型/装饰器/异步/工程化、Node Stream/EventLoop/EventEmitter/子进程/HTTP、Agent 概念/Memory/Planning），并给出一个贯穿全阶段的最小 Agent CLI 综合练习。

> 🚀 Day 13 完成！记忆让 Agent「有经验」，规划让 Agent「有章法」。理解这两大能力，你就掌握了 Agent 从「会聊天」到「能办事」的关键一跃。
