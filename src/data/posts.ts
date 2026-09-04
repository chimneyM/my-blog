import type { Post } from '../types'

export const posts: Post[] = [
  {
    id: '14',
    title: 'AI Agent 学习计划 Day 10：AI Agent 概念 — Agent 定义与 LLM',
    slug: 'ai-agent-day10-agent-concept-llm',
    date: '2026-07-11',
    tags: ['AI Agent', 'LLM', '学习笔记'],
    excerpt: 'AI Agent 84 天学习计划第十天。系统学习 AI Agent 核心概念：Agent 定义（感知环境、自主决策、执行动作的智能体）、Agent 与 Chatbot/Workflow 的区别、LLM 作为 Agent 大脑的角色与局限、Agent 四大核心架构（感知-大脑-行动-记忆）、Agent 工作循环（Agent Loop）、ReAct 推理与行动范式、Chain-of-Thought 思维链、Function Calling 工具调用、记忆系统（短期/工作/长期/情景记忆）、OpenAI Chat Completions API 基础、消息角色与关键参数、最简 Agent 实现代码、Agent 应用场景与发展历程。',
    readingTime: 40,
    content: `# AI Agent 学习计划 Day 10：AI Agent 概念 — Agent 定义与 LLM

> 📅 日期：2026-07-11  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 10 / 84（11.9%）

## 前言

Day 1-9，我们用 9 天时间打下了坚实的工程基础：TypeScript 类型系统、装饰器、异步编程、模块工程化、Node.js Stream/Buffer、事件循环、EventEmitter、子进程与工作线程、HTTP/HTTPS 通信。这些是构建 AI Agent 的「肌肉」和「神经」。

从今天开始（Day 10-14），我们正式进入 AI Agent 的**概念世界**。今天是概念篇的第一天，我们要回答最根本的问题：

> **什么是 AI Agent？它和 ChatGPT 有什么区别？LLM 在 Agent 中扮演什么角色？**

如果说前 9 天是学习如何用锤子和钉子，那么今天我们要弄清楚——我们要建造的「房子」到底是什么样子。理解 Agent 的定义、架构和 LLM 作为大脑的角色，是后续学习 LangChain.js、Vercel AI SDK、RAG、多 Agent 编排等所有进阶内容的认知基础。

---

## 一、什么是 AI Agent

### 1.1 Agent 的学术定义

**AI Agent（人工智能代理/智能体）** 是一种能够**感知环境**、**自主决策**并**执行动作**以达成特定目标的智能软件实体。

这个定义包含三个关键要素：

\`\`\`
┌─────────────────────────────────────────────────┐
│                  AI Agent 定义                    │
├─────────────────────────────────────────────────┤
│                                                   │
│   感知 (Perception)                               │
│   ├── 从环境中获取信息（用户输入、API返回、传感器）  │
│   ├── 理解自然语言指令                             │
│   └── 解析工具返回的结果                           │
│                                                   │
│   决策 (Decision)                                 │
│   ├── 基于感知到的信息进行推理                      │
│   ├── 制定行动计划                                 │
│   └── 选择合适的工具和策略                          │
│                                                   │
│   行动 (Action)                                   │
│   ├── 执行选定的动作                               │
│   ├── 调用外部工具（搜索、代码执行、API）            │
│   └── 与环境交互（发送消息、写入文件）               │
│                                                   │
│   → 目标 (Goal): 所有行为都指向一个目标              │
│                                                   │
└─────────────────────────────────────────────────┘
\`\`\`

用一句话概括：

> **Agent = 能理解目标 + 能自主规划 + 能调用工具 + 能执行行动的智能体**

### 1.2 Agent 与传统程序的区别

| 特性 | 传统程序 | AI Agent |
|------|---------|----------|
| **行为模式** | 预定义的固定流程（if-else） | 根据目标动态决定下一步 |
| **决策方式** | 开发者硬编码逻辑 | LLM 自主推理决策 |
| **适应性** | 遇到未预设的情况就崩溃 | 能处理模糊、未见过的问题 |
| **工具使用** | 固定调用特定函数 | 根据需要自主选择工具 |
| **错误处理** | 预设的错误处理分支 | 能理解错误原因并调整策略 |
| **类比** | 流水线工人（按图纸操作） | 独立工程师（理解目标自主完成） |

**举个例子**：

\`\`\`
任务：帮我查一下明天北京的天气，如果下雨就提醒我带伞

传统程序：
  1. 调用天气API(北京, 明天) → 返回rain
  2. if (weather == 'rain') { 发送通知("带伞") }
  → 必须预先知道要查天气、要判断rain、要发通知

AI Agent：
  1. [感知] 理解用户意图：查天气 + 条件提醒
  2. [决策] 规划步骤：先查天气 → 分析结果 → 决定是否提醒
  3. [行动] 调用天气工具 → 得到"小雨" → 判断需要提醒 → 发送通知
  → 自主推理出需要做什么，无需预编程每个步骤
\`\`\`

### 1.3 Agent 与 Chatbot（聊天机器人）的区别

这是最容易混淆的概念。ChatGPT 是聊天机器人，但它不是（完整的）Agent。

| 特性 | Chatbot（聊天机器人） | AI Agent（智能体） |
|------|---------------------|-------------------|
| **核心能力** | 对话生成 | 目标达成 |
| **交互模式** | 一问一答 | 多步自主执行 |
| **工具使用** | ❌ 不能调用外部工具 | ✅ 能自主选择和调用工具 |
| **记忆** | 仅上下文窗口 | 短期 + 长期记忆系统 |
| **自主性** | 被动响应 | 主动规划、自主决策 |
| **结果** | 返回文本 | 完成任务（可能改变世界状态） |
| **典型代表** | ChatGPT 网页版 | AutoGPT、Devin、Cursor Agent |

**关键区别**：

\`\`\`
Chatbot：用户 → 提问 → LLM → 生成文本 → 返回给用户
         （LLM 只「说」，不「做」）

Agent：  用户 → 目标 → LLM[感知→决策→行动] → 调用工具 → 观察 → 再决策 → ... → 达成目标
         （LLM 既「说」又「做」，能改变外部世界）
\`\`\`

> **一句话理解**：Chatbot 是「嘴」，Agent 是「嘴 + 手 + 脑」。Agent 不只是回答问题，而是**完成任务**。

### 1.4 Agent 的自主性等级

Agent 的自主性是一个光谱，从低到高：

| 等级 | 名称 | 描述 | 示例 |
|------|------|------|------|
| L0 | 无自主 | 每步都由人类指令驱动 | 传统命令行工具 |
| L1 | 建议型 | Agent 给出建议，人类执行 | Copilot 代码补全 |
| L2 | 半自主 | Agent 执行，人类审批关键步骤 | Cursor Agent（需确认） |
| L3 | 条件自主 | Agent 自主执行，特定情况请求人类介入 | AutoGPT（遇到障碍时求助） |
| L4 | 高度自主 | Agent 完全自主完成复杂任务 | Devin（自主编程） |
| L5 | 完全自主 | Agent 自主设定目标并完成 | （未来愿景） |

当前主流的 Agent 应用处于 **L2-L3** 之间。理解这个等级划分，有助于我们在设计 Agent 系统时，合理设置人类介入的程度。

---

## 二、LLM 作为 Agent 的「大脑」

### 2.1 为什么 LLM 是 Agent 的大脑

传统 AI 系统的「大脑」是规则引擎或机器学习模型，它们只能处理预设的问题。而 LLM（大语言模型）之所以能成为 Agent 的大脑，是因为它具备以下独特能力：

\`\`\`
┌─────────────────────────────────────────────────────┐
│            LLM 作为 Agent 大脑的独特能力              │
├─────────────────────────────────────────────────────┤
│                                                       │
│  1. 自然语言理解                                       │
│     ├── 理解用户的模糊意图                             │
│     ├── 解析非结构化输入                               │
│     └── 处理多语言、多领域问题                          │
│                                                       │
│  2. 推理与规划                                         │
│     ├── 逻辑推理（因果、类比、演绎）                     │
│     ├── 任务分解（将大目标拆成小步骤）                    │
│     └── 多步规划（规划完成任务的步骤序列）                │
│                                                       │
│  3. 知识储备                                           │
│     ├── 训练数据中蕴含的海量世界知识                     │
│     ├── 跨领域知识（编程、医学、法律...）                 │
│     └── 常识推理                                       │
│                                                       │
│  4. 工具选择与调度                                     │
│     ├── 理解工具的功能描述                              │
│     ├── 根据任务选择合适的工具                          │
│     └── 组织工具的调用顺序                              │
│                                                       │
│  5. 自然语言生成                                       │
│     ├── 生成可执行代码                                 │
│     ├── 生成结构化输出（JSON、SQL）                     │
│     └── 生成人类可理解的解释                            │
│                                                       │
│  6. 上下文理解                                         │
│     ├── 理解多轮对话上下文                              │
│     ├── 维持任务一致性                                 │
│     └── 结合历史信息做决策                             │
│                                                       │
└─────────────────────────────────────────────────────┘
\`\`\`

### 2.2 LLM 的工作原理简述

理解 LLM 如何作为大脑工作，需要简单了解其核心原理：

\`\`\`
LLM 的本质：下一个 Token 预测器

输入: "今天天气很好，我想去"
LLM:  P(下一个词) = { "公园": 0.35, "散步": 0.20, "爬山": 0.15, ... }
输出: "公园"

但这看似简单的「预测下一个词」，在规模化后涌现出了惊人的能力：
- 推理能力（Chain-of-Thought）
- 指令遵循能力（Instruction Following）
- 工具使用能力（Function Calling）
- 规划能力（Planning）
\`\`\`

**Token 预测如何变成「智能」？**

\`\`\`
用户: "帮我订一张明天去上海的机票"

LLM 内部推理过程（简化）：
1. [理解意图] 用户要订机票，目的地上海，时间明天
2. [检查工具] 我有 searchFlights 工具
3. [构造参数] origin=? (需要询问), destination=上海, date=明天
4. [发现缺失] 缺少出发地信息
5. [生成响应] "请问您从哪个城市出发？"

用户: "从北京"

LLM:
1. [更新信息] origin=北京, destination=上海, date=明天
2. [调用工具] searchFlights({origin:"北京", destination:"上海", date:"2026-07-12"})
3. [观察结果] [{flight:"CA1234", price:1200, time:"08:00"}, ...]
4. [生成响应] "找到以下航班：CA1234 08:00 ¥1200，需要预订吗？"
\`\`\`

这就是 LLM 作为大脑的「思考」过程——每一步都是在预测下一个最合理的 Token。

### 2.3 LLM 在 Agent 中的角色

LLM 在 Agent 系统中承担多个角色：

\`\`\`
┌──────────────────────────────────────────┐
│           LLM 的多重角色                  │
├──────────────────────────────────────────┤
│                                            │
│  🧠 推理引擎 (Reasoning Engine)            │
│  ├── 分析问题，推理出解决路径               │
│  ├── Chain-of-Thought 思维链推理           │
│  └── ReAct: 推理 → 行动 → 观察 循环        │
│                                            │
│  📋 规划器 (Planner)                       │
│  ├── 将复杂任务分解为子任务                 │
│  ├── 制定执行计划                          │
│  └── 动态调整计划（根据执行反馈）            │
│                                            │
│  🔧 工具选择器 (Tool Selector)             │
│  ├── 理解工具的功能描述                     │
│  ├── 选择最合适的工具                       │
│  └── 构造正确的工具调用参数                  │
│                                            │
│  💬 通信接口 (Communicator)                │
│  ├── 理解用户自然语言输入                   │
│  ├── 生成人类可理解的输出                   │
│  └── 在多 Agent 间传递信息                  │
│                                            │
│  📝 记忆处理器 (Memory Processor)           │
│  ├── 总结对话历史（压缩记忆）               │
│  ├── 从长期记忆中检索相关信息               │
│  └── 决定哪些信息需要记住                   │
│                                            │
│  🔍 结果分析器 (Result Analyzer)            │
│  ├── 解析工具返回的结果                     │
│  ├── 判断任务是否完成                       │
│  └── 决定下一步行动                        │
│                                            │
└──────────────────────────────────────────┘
\`\`\`

### 2.4 LLM 的局限性

LLM 虽然强大，但作为 Agent 大脑也有明显局限：

| 局限 | 表现 | 解决方案 |
|------|------|---------|
| **幻觉** | 编造不存在的事实 | RAG 检索增强、工具验证 |
| **上下文窗口有限** | 长对话会遗忘早期信息 | 记忆系统（摘要、向量检索） |
| **无法实时获取信息** | 训练数据有截止日期 | 搜索工具、API 调用 |
| **不能直接执行代码** | 只能生成代码文本 | 代码执行沙箱工具 |
| **数学计算不可靠** | 复杂计算可能出错 | 计算器工具 |
| **推理不稳定** | 同一问题可能给出不同答案 | Temperature=0、多次采样 |
| **无持久状态** | 每次调用是无状态的 | 外部记忆系统 |

> **核心理解**：LLM 是 Agent 的「大脑」，但大脑 alone 不够——它需要「眼睛」（感知）、「手」（工具）、「记忆」（存储）的配合，才能构成完整的 Agent。这就是为什么 Agent = LLM + 工具 + 记忆 + 规划。

---

## 三、Agent 的核心架构

### 3.1 四大核心组件

业界主流的 Agent 架构（参考复旦大学 Agent 综述）包含四大核心组件：

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    AI Agent 核心架构                      │
│                                                           │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐            │
│    │  感知    │───→│  大脑    │───→│  行动    │            │
│    │Perception│    │ (LLM)   │    │ Action  │            │
│    └────┬────┘    └────┬────┘    └────┬────┘            │
│         │              │              │                   │
│         │         ┌────┴────┐         │                   │
│         │         │  记忆    │         │                   │
│         │         │ Memory  │         │                   │
│         │         └─────────┘         │                   │
│         │                             │                   │
│         ↓                             ↓                   │
│    ┌──────────────────────────────────────┐              │
│    │            外部环境 (Environment)       │              │
│    │  用户、文件系统、API、数据库、互联网...   │              │
│    └──────────────────────────────────────┘              │
│                                                           │
└─────────────────────────────────────────────────────────┘
\`\`\`

#### 1. 感知（Perception）— Agent 的「眼睛」

感知模块负责从环境中获取信息：

\`\`\`typescript
// 感知模块示例
interface Perception {
  // 用户输入感知
  userInput: string

  // 工具执行结果感知
  toolResults: ToolResult[]

  // 环境状态感知
  environment: {
    currentTime: Date
    availableTools: Tool[]
    systemResources: ResourceInfo
  }

  // 历史上下文感知
  context: ConversationMessage[]
}
\`\`\`

感知的来源：
- **用户输入**：自然语言指令、反馈、澄清
- **工具返回**：API 响应、搜索结果、代码执行输出
- **环境状态**：时间、文件系统、数据库状态
- **历史上下文**：之前的对话和操作记录

#### 2. 大脑（Brain / LLM）— Agent 的「核心」

大脑模块以 LLM 为核心，负责推理、规划和决策：

\`\`\`typescript
// 大脑模块示例
interface AgentBrain {
  // 推理：分析当前状态
  reason(perception: Perception): ReasoningResult

  // 规划：制定行动计划
  plan(goal: string, perception: Perception): ActionPlan

  // 决策：选择下一步动作
  decide(plan: ActionPlan, perception: Perception): Action
}

interface Action {
  type: 'call_tool' | 'respond_to_user' | 'ask_clarification' | 'finish'
  toolName?: string
  toolArgs?: Record<string, unknown>
  response?: string
}
\`\`\`

大脑的核心能力：
- **推理**：分析感知到的信息，理解当前状态
- **规划**：将目标分解为可执行的步骤
- **决策**：选择最合适的下一步行动
- **反思**：评估行动结果，调整策略

#### 3. 行动（Action）— Agent 的「手」

行动模块负责执行大脑决策的动作：

\`\`\`typescript
// 行动模块示例
interface ActionExecutor {
  // 调用外部工具
  callTool(toolName: string, args: Record<string, unknown>): Promise<ToolResult>

  // 发送消息给用户
  sendMessage(message: string): void

  // 请求用户澄清
  askUser(question: string): Promise<string>

  // 更新环境状态
  updateEnvironment(changes: Record<string, unknown>): void
}

// 工具定义示例
interface Tool {
  name: string
  description: string
  parameters: JSONSchema  // 参数的 JSON Schema 描述
  execute: (args: Record<string, unknown>) => Promise<unknown>
}

// 示例：搜索工具
const searchTool: Tool = {
  name: 'web_search',
  description: '搜索互联网获取最新信息。当需要查找实时信息或不确定的事实时使用。',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索关键词' }
    },
    required: ['query']
  },
  execute: async (args) => {
    const results = await searchAPI(args.query)
    return results
  }
}
\`\`\`

#### 4. 记忆（Memory）— Agent 的「记忆系统」

记忆模块负责存储和管理信息：

\`\`\`typescript
// 记忆模块示例
interface AgentMemory {
  // 短期记忆：当前对话上下文
  shortTerm: ConversationMessage[]

  // 工作记忆：当前任务的中间状态
  workingMemory: {
    currentGoal: string
    plan: ActionPlan
    scratchpad: string  // 草稿本，记录中间推理
  }

  // 长期记忆：持久化存储
  longTerm: {
    // 向量数据库存储
    vectorStore: VectorStore
    // 摘要存储
    summaries: string[]
  }
}
\`\`\`

记忆的三个层次：

| 记忆类型 | 类比 | 实现方式 | 容量 | 持久性 |
|---------|------|---------|------|--------|
| **短期记忆** | 工作记忆（当前在想什么） | LLM 上下文窗口 | 有限（几K-几百K Token） | 会话内 |
| **工作记忆** | 草稿本（记录中间过程） | Scratchpad / 状态对象 | 可变 | 任务内 |
| **长期记忆** | 长期记忆（过去的经验） | 向量数据库 + 摘要 | 无限 | 永久 |

### 3.2 Agent 的工作循环

Agent 的核心运行机制是一个**感知-决策-行动**的循环：

\`\`\`
┌──────────────────────────────────────────────────┐
│              Agent 工作循环 (Agent Loop)           │
│                                                    │
│   ┌──────────┐                                    │
│   │ 1. 感知   │ ← 用户输入 / 工具结果 / 环境状态     │
│   └────┬─────┘                                    │
│        ↓                                          │
│   ┌──────────┐                                    │
│   │ 2. 推理   │ ← LLM 分析当前状态                  │
│   └────┬─────┘                                    │
│        ↓                                          │
│   ┌──────────┐                                    │
│   │ 3. 规划   │ ← 制定/更新行动计划                 │
│   └────┬─────┘                                    │
│        ↓                                          │
│   ┌──────────┐                                    │
│   │ 4. 决策   │ ← 选择下一步动作                    │
│   └────┬─────┘                                    │
│        ↓                                          │
│   ┌──────────┐                                    │
│   │ 5. 行动   │ ← 调用工具 / 回复用户               │
│   └────┬─────┘                                    │
│        ↓                                          │
│   ┌──────────┐                                    │
│   │ 6. 观察   │ ← 获取行动结果                      │
│   └────┬─────┘                                    │
│        ↓                                          │
│   ┌──────────┐                                    │
│   │ 7. 评估   │ ← 判断是否达成目标？                 │
│   └────┬─────┘                                    │
│        ↓                                          │
│   达成目标？─── No ──→ 回到步骤 1                   │
│        │                                          │
│       Yes                                         │
│        ↓                                          │
│   ┌──────────┐                                    │
│   │  结束     │ ← 返回最终结果                      │
│   └──────────┘                                    │
│                                                    │
└──────────────────────────────────────────────────┘
\`\`\`

用代码表示这个循环：

\`\`\`typescript
async function agentLoop(goal: string, tools: Tool[], memory: AgentMemory): Promise<string> {
  let step = 0
  const maxSteps = 20  // 防止无限循环

  while (step < maxSteps) {
    step++

    // 1. 感知：构建当前上下文
    const perception = buildPerception(goal, memory)

    // 2-4. 推理 + 规划 + 决策：调用 LLM
    const action = await llmDecide(perception, tools, memory)

    // 5. 判断是否完成
    if (action.type === 'finish') {
      return action.response
    }

    // 6. 执行行动
    if (action.type === 'call_tool') {
      const result = await executeTool(action.toolName, action.toolArgs)

      // 7. 观察：记录结果到记忆
      memory.shortTerm.push({
        role: 'tool',
        name: action.toolName,
        content: JSON.stringify(result)
      })
    }

    if (action.type === 'respond_to_user') {
      memory.shortTerm.push({
        role: 'assistant',
        content: action.response
      })
    }

    if (action.type === 'ask_clarification') {
      const userAnswer = await askUser(action.response)
      memory.shortTerm.push({
        role: 'user',
        content: userAnswer
      })
    }
  }

  return '达到最大步数限制，任务未完成'
}
\`\`\`

### 3.3 Agent 与 Workflow 的区别

| 特性 | Workflow（工作流） | Agent（智能体） |
|------|-------------------|-----------------|
| **路径** | 固定的、预定义的 | 动态的、LLM 决定的 |
| **灵活性** | 低（只能走预设路径） | 高（能处理意外情况） |
| **可预测性** | 高（每次执行路径相同） | 较低（可能走不同路径） |
| **调试难度** | 低 | 高 |
| **适用场景** | 流程明确的任务 | 流程不确定的复杂任务 |
| **类比** | 地铁线路（固定站点） | 出租车（根据路况选路） |

> **理解要点**：Agent 不是「更高级的 Workflow」，而是**用 LLM 替代了 Workflow 中的路由决策节点**。Workflow 的每一步「做什么」是预设的，Agent 的每一步「做什么」是 LLM 实时决定的。

---

## 四、Agent 的核心能力详解

### 4.1 推理能力（Reasoning）

推理是 Agent 大脑的核心能力，指 LLM 从已知信息推导出结论的过程。

#### Chain-of-Thought（思维链）

思维链是让 LLM 「展示推理过程」的技术，显著提升复杂问题的准确率：

\`\`\`
不带思维链：
  Q: 一个商店有 23 个苹果，卖了 17 个，又进了 10 个，现在有多少个？
  A: 16

带思维链：
  Q: 一个商店有 23 个苹果，卖了 17 个，又进了 10 个，现在有多少个？
  A: 让我一步步算：
     1. 初始有 23 个苹果
     2. 卖了 17 个：23 - 17 = 6 个
     3. 又进了 10 个：6 + 10 = 16 个
     答案是 16 个。
\`\`\`

在 Agent 中，思维链让 LLM 在决定行动前先「思考」：

\`\`\`typescript
const systemPrompt = \`你是一个 AI Agent。在采取行动前，请先思考：

格式：
Thought: 我需要思考当前情况...
Action: 我决定调用工具 xxx
Action Input: {"param": "value"}

或者当你认为任务完成时：
Thought: 任务已完成，因为...
Final Answer: 最终答案
\`

// LLM 的输出示例：
// Thought: 用户想知道明天的天气，我需要调用天气查询工具
// Action: get_weather
// Action Input: {"city": "北京", "date": "tomorrow"}
\`\`\`

#### ReAct 模式（Reasoning + Acting）

ReAct 是 Agent 最经典的范式——**推理与行动交替进行**：

\`\`\`
ReAct 循环：
  Thought (思考) → Action (行动) → Observation (观察) → Thought → Action → ...

示例：用户问"2026年最新的GPT模型是什么？"

【第1轮】
Thought: 用户问的是2026年的最新信息，我的训练数据可能不包含。
         我需要搜索互联网获取最新信息。
Action: web_search
Action Input: {"query": "OpenAI GPT 最新模型 2026"}

Observation: [搜索结果] OpenAI 于2026年发布了GPT-5模型...

【第2轮】
Thought: 搜索结果显示GPT-5是2026年的最新模型。我可以回答用户了。
Final Answer: 2026年OpenAI最新的模型是GPT-5。
\`\`\`

ReAct 的核心价值：
- **可解释**：每一步都有明确的推理过程
- **可纠错**：观察到错误结果后能调整策略
- **高效**：只在需要时调用工具，避免不必要的行动

### 4.2 规划能力（Planning）

规划是将复杂目标分解为可执行步骤的能力：

#### 任务分解（Task Decomposition）

\`\`\`
目标：写一篇关于 AI Agent 的技术博客

Agent 规划：
  ├── 步骤1: 搜索最新的 AI Agent 技术资料
  ├── 步骤2: 整理资料，列出文章大纲
  ├── 步骤3: 撰写文章初稿
  │    ├── 3.1: 写引言部分
  │    ├── 3.2: 写核心概念部分
  │    └── 3.3: 写实战案例部分
  ├── 步骤4: 审查文章，检查错误
  └── 步骤5: 发布文章
\`\`\`

#### 动态重规划（Dynamic Replanning）

Agent 能根据执行反馈动态调整计划：

\`\`\`typescript
interface Planner {
  // 初始规划
  createPlan(goal: string): ActionPlan

  // 动态重规划
  replan(
    originalPlan: ActionPlan,
    completedSteps: ActionStep[],
    lastResult: ToolResult,
    feedback: string
  ): ActionPlan
}

// 示例：原计划是直接搜索，但搜索结果不够
// Agent 动态调整：先搜索，发现需要更多信息，再搜索具体细节
\`\`\`

### 4.3 工具使用能力（Tool Use）

工具使用是 Agent 区别于 Chatbot 的核心特征。

#### Function Calling / Tool Calling

现代 LLM（GPT-4、Claude 等）原生支持 Function Calling：

\`\`\`typescript
// 定义工具
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '获取指定城市的天气信息',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名称' },
          date: { type: 'string', description: '日期，格式 YYYY-MM-DD' }
        },
        required: ['city']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: '发送邮件',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: '收件人邮箱' },
          subject: { type: 'string', description: '邮件主题' },
          body: { type: 'string', description: '邮件正文' }
        },
        required: ['to', 'subject', 'body']
      }
    }
  }
]

// 调用 LLM，传入工具定义
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: '帮我查一下北京明天的天气，然后发邮件告诉 alice@example.com' }
  ],
  tools: tools,
  tool_choice: 'auto'  // 让 LLM 自主决定是否调用工具
})

// LLM 返回的响应
// {
//   role: 'assistant',
//   tool_calls: [{
//     id: 'call_xxx',
//     type: 'function',
//     function: {
//       name: 'get_weather',
//       arguments: '{"city":"北京","date":"2026-07-12"}'
//     }
//   }]
// }
\`\`\`

#### 工具调用的完整流程

\`\`\`
1. 用户发送请求
2. LLM 分析请求，决定需要调用 get_weather 工具
3. LLM 返回 tool_call: get_weather({city:"北京", date:"2026-07-12"})
4. Agent 执行工具：调用天气API
5. Agent 将工具结果返回给 LLM
6. LLM 分析天气结果，决定需要调用 send_email 工具
7. LLM 返回 tool_call: send_email({to:"alice@example.com", subject:"明天天气", body:"北京明天小雨..."})
8. Agent 执行工具：发送邮件
9. Agent 将结果返回给 LLM
10. LLM 生成最终回复："已查询天气并发送邮件给alice@example.com"
\`\`\`

### 4.4 记忆能力（Memory）

记忆让 Agent 能跨越单次对话的限制：

\`\`\`
┌──────────────────────────────────────────────┐
│              Agent 记忆系统                    │
├──────────────────────────────────────────────┤
│                                                │
│  短期记忆 (Short-term Memory)                  │
│  ├── 实现：LLM 上下文窗口（messages 数组）      │
│  ├── 内容：当前对话的历史消息                    │
│  ├── 容量：有限（如 GPT-4: 128K tokens）        │
│  └── 问题：对话太长会被截断                      │
│                                                │
│  工作记忆 (Working Memory)                     │
│  ├── 实现：Scratchpad / 状态对象               │
│  ├── 内容：当前任务的中间状态、推理草稿          │
│  ├── 容量：可变，由开发者控制                    │
│  └── 作用：在多步推理中保持状态                  │
│                                                │
│  长期记忆 (Long-term Memory)                   │
│  ├── 实现：向量数据库 + 摘要                    │
│  ├── 内容：历史对话摘要、用户偏好、学到的知识     │
│  ├── 容量：无限                                │
│  └── 作用：跨会话记忆，个性化服务                │
│                                                │
│  情景记忆 (Episodic Memory)                    │
│  ├── 实现：结构化的事件存储                     │
│  ├── 内容：过去的完整任务执行过程                │
│  ├── 容量：无限                                │
│  └── 作用：从过去经验中学习，避免重复错误         │
│                                                │
└──────────────────────────────────────────────┘
\`\`\`

\`\`\`typescript
// 记忆系统示例
class AgentMemorySystem {
  // 短期记忆：对话历史
  shortTerm: Message[] = []

  // 工作记忆：任务状态
  workingMemory: {
    goal: string
    plan: string[]
    currentStep: number
    scratchpad: string
  }

  // 长期记忆：向量数据库
  longTerm: VectorStore

  // 添加到短期记忆
  addToShortTerm(message: Message) {
    this.shortTerm.push(message)

    // 如果短期记忆太长，进行摘要压缩
    if (this.getTokenCount(this.shortTerm) > 10000) {
      this.compressShortTermMemory()
    }
  }

  // 压缩短期记忆：将早期对话摘要后存入长期记忆
  async compressShortTermMemory() {
    const oldMessages = this.shortTerm.slice(0, -10)  // 保留最近10条
    const recentMessages = this.shortTerm.slice(-10)

    // 用 LLM 生成摘要
    const summary = await llm.summarize(oldMessages)

    // 存入长期记忆（向量化）
    await this.longTerm.add({
      text: summary,
      metadata: { timestamp: Date.now() }
    })

    // 短期记忆只保留最近的 + 摘要
    this.shortTerm = [
      { role: 'system', content: \`之前的对话摘要：\${summary}\` },
      ...recentMessages
    ]
  }

  // 从长期记忆中检索相关信息
  async recall(query: string): Promise<string[]> {
    const results = await this.longTerm.similaritySearch(query, 5)
    return results.map(r => r.text)
  }
}
\`\`\`

---

## 五、LLM API 基础 — Agent 的通信协议

### 5.1 OpenAI Chat Completions API

Agent 与 LLM 的通信通过 API 完成。以下是最基础的 Chat Completions API 调用：

\`\`\`typescript
// 最基础的 LLM 调用
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: '你是一个 AI Agent，能够自主决策并调用工具完成任务。'
      },
      {
        role: 'user',
        content: '帮我分析一下 TypeScript 和 JavaScript 的区别'
      }
    ],
    temperature: 0.7,  // 0-2，越低越确定性
    max_tokens: 1000   // 最大输出长度
  })
})

const data = await response.json()
console.log(data.choices[0].message.content)
\`\`\`

### 5.2 消息角色（Message Roles）

Chat Completions API 中的消息有不同角色：

\`\`\`typescript
const messages = [
  // system: 设定 Agent 的人格和行为规则
  {
    role: 'system',
    content: '你是一个专业的编程助手。回答要简洁准确，附带代码示例。'
  },

  // user: 用户的输入
  {
    role: 'user',
    content: '什么是 TypeScript 的泛型？'
  },

  // assistant: LLM 的回复
  {
    role: 'assistant',
    content: '泛型是一种允许在定义函数、接口或类时不预先指定具体类型的特性...'
  },

  // user: 用户的追问
  {
    role: 'user',
    content: '能举个例子吗？'
  },

  // tool: 工具调用的返回结果
  {
    role: 'tool',
    tool_call_id: 'call_xxx',
    content: '{"result": "工具执行结果"}'
  }
]
\`\`\`

### 5.3 关键参数详解

\`\`\`typescript
{
  model: 'gpt-4',              // 模型选择

  messages: [...],              // 消息数组

  temperature: 0.7,            // 温度：0=确定性，2=最随机
                               // Agent 决策推荐 0-0.3（更稳定）
                               // 创意写作推荐 0.7-1.0

  max_tokens: 1000,            // 最大生成 Token 数

  top_p: 1,                    // 核采样：只从概率前 p 的 Token 中采样
                               // 与 temperature 通常只调一个

  frequency_penalty: 0,        // 频率惩罚：减少重复词
  presence_penalty: 0,         // 存在惩罚：鼓励新话题

  stream: false,               // 是否流式返回（Agent 中常用于实时输出）

  tools: [...],                // 工具定义（Function Calling）

  tool_choice: 'auto',         // 工具选择策略：
                               // 'auto' - LLM 自主决定
                               // 'none' - 不调用工具
                               // {type:'function',function:{name:'xxx'}} - 强制调用指定工具

  response_format: {           // 响应格式
    type: 'json_object'        // 强制返回 JSON
  }
}
\`\`\`

### 5.4 模型选择指南

| 模型 | 特点 | Agent 适用场景 |
|------|------|---------------|
| GPT-4 / GPT-4o | 最强推理能力，支持 Function Calling | 复杂 Agent、多步推理 |
| GPT-4o-mini | 快速、低成本、性价比高 | 简单 Agent、高频调用 |
| GPT-3.5-turbo | 最便宜，能力有限 | 原型验证、简单对话 |
| Claude 3.5 Sonnet | 强推理、长上下文 | 复杂文档分析 Agent |
| 国产模型（DeepSeek等） | 中文能力强、成本低 | 中文场景、成本敏感 |

> **Agent 模型选择建议**：推理和决策用强模型（GPT-4 / Claude），简单任务用快模型（GPT-4o-mini），以平衡效果和成本。

---

## 六、Agent 的分类

### 6.1 按自主性分类

\`\`\`
┌─────────────────────────────────────────────────┐
│               Agent 自主性分类                    │
├─────────────────────────────────────────────────┤
│                                                   │
│  单步 Agent (Single-step)                         │
│  ├── 用户提问 → LLM 回答（无工具调用）              │
│  ├── 例：ChatGPT 基础对话                         │
│  └── 自主性：最低                                  │
│                                                   │
│  多步 Agent (Multi-step)                          │
│  ├── 用户提问 → LLM 调用工具 → 观察结果 → 回答     │
│  ├── 例：带搜索的 ChatGPT                         │
│  └── 自主性：较低                                  │
│                                                   │
│  自主 Agent (Autonomous)                          │
│  ├── 用户给目标 → Agent 自主规划并执行多步任务      │
│  ├── 例：AutoGPT、Devin                           │
│  └── 自主性：高                                    │
│                                                   │
│  多 Agent 系统 (Multi-Agent)                      │
│  ├── 多个 Agent 协作完成复杂任务                   │
│  ├── 例：AutoGen、CrewAI                          │
│  └── 自主性：最高                                  │
│                                                   │
└─────────────────────────────────────────────────┘
\`\`\`

### 6.2 按应用领域分类

| 类型 | 描述 | 典型应用 |
|------|------|---------|
| **编程 Agent** | 自主编写、测试、调试代码 | Devin、Cursor Agent、GitHub Copilot |
| **研究 Agent** | 自主搜索、分析、总结信息 | Perplexity、Search Agent |
| **办公 Agent** | 处理邮件、日程、文档 | Microsoft Copilot |
| **客服 Agent** | 自主处理用户咨询 | 智能客服系统 |
| **数据分析 Agent** | 自主查询数据、生成图表 | BI Agent |
| **创作 Agent** | 自主创作文章、视频等 | 内容生成系统 |

---

## 七、从零理解：一个最简 Agent

### 7.1 最简 Agent 实现

用前面学过的 HTTP 知识（Day 9），实现一个最简的 Agent：

\`\`\`typescript
// mini-agent.ts — 一个最简的 AI Agent

interface Tool {
  name: string
  description: string
  execute: (args: Record<string, unknown>) => Promise<string>
}

class MiniAgent {
  private apiKey: string
  private model: string
  private tools: Tool[]
  private messages: Array<Record<string, unknown>>
  private maxSteps: number

  constructor(apiKey: string, tools: Tool[] = [], model = 'gpt-4') {
    this.apiKey = apiKey
    this.model = model
    this.tools = tools
    this.messages = []
    this.maxSteps = 10
  }

  // 运行 Agent
  async run(userInput: string): Promise<string> {
    // 1. 添加用户消息
    this.messages.push({ role: 'user', content: userInput })

    // 2. Agent 循环
    for (let step = 0; step < this.maxSteps; step++) {
      // 2.1 调用 LLM
      const llmResponse = await this.callLLM()

      // 2.2 检查是否有工具调用
      if (llmResponse.tool_calls && llmResponse.tool_calls.length > 0) {
        // 记录 LLM 的工具调用消息
        this.messages.push(llmResponse)

        // 执行所有工具调用
        for (const toolCall of llmResponse.tool_calls) {
          const tool = this.tools.find(t => t.name === toolCall.function.name)

          if (tool) {
            console.log(\`🔧 调用工具: \${tool.name}\`)
            const args = JSON.parse(toolCall.function.arguments)
            const result = await tool.execute(args)
            console.log(\`📋 工具结果: \${result.substring(0, 100)}...\`)

            // 将工具结果加入消息
            this.messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: result
            })
          }
        }

        // 继续循环，让 LLM 处理工具结果
        continue
      }

      // 2.3 没有工具调用，说明 LLM 给出了最终答案
      this.messages.push(llmResponse)
      return llmResponse.content
    }

    return '达到最大步数限制'
  }

  // 调用 LLM API
  private async callLLM(): Promise<any> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: \`你是一个 AI Agent。你可以使用以下工具来完成任务：
\${this.tools.map(t => \`- \${t.name}: \${t.description}\`).join('\n')}

请根据用户需求，决定是否需要调用工具。如果需要，调用合适的工具；
如果已有足够信息回答，直接给出最终答案。\`
        },
        ...this.messages
      ],
      temperature: 0  // Agent 决策用低温度，确保稳定
    }

    // 如果有工具，添加 tools 参数
    if (this.tools.length > 0) {
      body.tools = this.tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: {
            type: 'object',
            properties: {
              input: { type: 'string', description: '输入参数' }
            }
          }
        }
      }))
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${this.apiKey}\`
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return data.choices[0].message
  }
}

// === 使用示例 ===

// 定义工具
const tools: Tool[] = [
  {
    name: 'calculator',
    description: '计算数学表达式，输入数学表达式字符串',
    execute: async (args) => {
      const expr = args.input as string
      try {
        const result = eval(expr)  // 仅演示，生产环境不要用 eval
        return \`计算结果: \${result}\`
      } catch {
        return '计算失败：无效的表达式'
      }
    }
  },
  {
    name: 'get_current_time',
    description: '获取当前时间',
    execute: async () => {
      return \`当前时间: \${new Date().toLocaleString('zh-CN')}\`
    }
  }
]

// 创建并运行 Agent
const agent = new MiniAgent(process.env.OPENAI_API_KEY!, tools)

const result = await agent.run('现在是几点？然后帮我算一下 123 * 456 + 789')
console.log('Agent 回复:', result)
\`\`\`

### 7.2 Agent 的运行流程

\`\`\`
用户: "现在是几点？然后帮我算一下 123 * 456 + 789"

Agent 执行过程：

【第1轮 - LLM 决策】
  LLM 分析: 用户需要两个信息：当前时间 和 数学计算结果
  LLM 决策: 需要调用两个工具
  LLM 输出: tool_calls: [
    { name: "get_current_time", args: {} },
    { name: "calculator", args: { input: "123 * 456 + 789" } }
  ]

【执行工具】
  🔧 调用工具: get_current_time
  📋 工具结果: 当前时间: 2026/7/11 12:00:00

  🔧 调用工具: calculator
  📋 工具结果: 计算结果: 56937

【第2轮 - LLM 整合】
  LLM 分析: 两个工具都返回了结果，可以回答用户了
  LLM 输出: "现在是 2026年7月11日 12:00。123 * 456 + 789 = 56937。"

【返回最终结果】
  Agent 回复: 现在是 2026年7月11日 12:00。123 * 456 + 789 = 56937。
\`\`\`

这个最简 Agent 展示了 Agent 的核心机制：
1. **LLM 作为大脑**：决定调用什么工具
2. **工具作为手脚**：执行具体操作
3. **消息作为记忆**：维护上下文
4. **循环作为生命**：感知→决策→行动→观察→再决策

---

## 八、Agent 的应用场景

### 8.1 典型应用场景

\`\`\`
┌──────────────────────────────────────────────────────┐
│                AI Agent 典型应用场景                    │
├──────────────────────────────────────────────────────┤
│                                                        │
│  🔍 信息检索与分析                                      │
│  ├── 深度研究（多轮搜索 + 综合分析）                     │
│  ├── 竞品分析（搜集信息 + 对比 + 生成报告）               │
│  └── 舆情监控（实时搜索 + 情感分析 + 预警）              │
│                                                        │
│  💻 编程与开发                                          │
│  ├── 自主编程（理解需求 + 写代码 + 测试 + 修复）          │
│  ├── 代码审查（分析代码 + 发现问题 + 建议修复）           │
│  └── Bug 修复（复现 + 定位 + 修复 + 验证）              │
│                                                        │
│  📊 数据分析                                            │
│  ├── 自动报表（查询数据 + 分析 + 生成图表）               │
│  ├── 异常检测（监控 + 分析 + 预警）                      │
│  └── 数据洞察（挖掘 + 分析 + 生成洞察报告）              │
│                                                        │
│  📝 内容创作                                            │
│  ├── 自动写作（调研 + 写作 + 审校 + 发布）               │
│  ├── 视频制作（脚本 + 配音 + 剪辑）                     │
│  └── 社交媒体管理（内容生成 + 定时发布 + 互动）          │
│                                                        │
│  🤖 自动化办公                                          │
│  ├── 邮件处理（阅读 + 分类 + 回复 + 转发）               │
│  ├── 日程管理（安排 + 提醒 + 冲突检测）                  │
│  └── 文档处理（生成 + 审阅 + 签批）                     │
│                                                        │
│  🎓 教育与培训                                          │
│  ├── 个性化辅导（评估 + 教学 + 练习 + 反馈）             │
│  ├── 自动出题（知识点分析 + 题目生成 + 评分）            │
│  └── 学习路径规划（评估 + 规划 + 追踪 + 调整）           │
│                                                        │
│  🛒 电商与客服                                          │
│  ├── 智能客服（理解 + 查询 + 解决 + 升级）               │
│  ├── 选品推荐（分析需求 + 搜索 + 对比 + 推荐）           │
│  └── 售后处理（投诉分析 + 方案 + 执行 + 跟踪）          │
│                                                        │
└──────────────────────────────────────────────────────┘
\`\`\`

### 8.2 Agent 的价值

| 传统方式 | Agent 方式 | 价值 |
|---------|-----------|------|
| 人工搜索+整理信息 | Agent 自主检索+分析+总结 | 节省 80% 时间 |
| 手动编写+测试代码 | Agent 自主编程+调试 | 提升开发效率 3-5 倍 |
| 人工查看数据报表 | Agent 自主分析+洞察 | 实时洞察，零等待 |
| 人工处理客服工单 | Agent 自主处理 80% 工单 | 7x24 小时服务 |

---

## 九、Agent 的发展历程与未来

### 9.1 发展历程

\`\`\`
2022.11    ChatGPT 发布 → LLM 展示出惊人的语言能力
    ↓
2023.03    GPT-4 + Function Calling → LLM 获得调用工具的能力
    ↓
2023.04    AutoGPT 爆火 → 第一个真正意义上的自主 Agent
    ↓
2023.06    LangChain Agent → Agent 框架成熟
    ↓
2023.10    AutoGen → 多 Agent 协作范式
    ↓
2024.01    CrewAI → 角色扮演多 Agent 框架
    ↓
2024.05    Vercel AI SDK → 轻量级 Agent 开发工具
    ↓
2024.11    Anthropic Computer Use → Agent 操控电脑
    ↓
2025.03    Devin / Cursor Agent → 自主编程 Agent 落地
    ↓
2025.06    MCP 协议 → Agent 工具标准化
    ↓
2026.xx    Agent 走向生产环境 → 企业级 Agent 应用普及
\`\`\`

### 9.2 未来趋势

1. **多模态 Agent**：不仅能处理文本，还能处理图像、视频、音频
2. **具身智能**：Agent 控制物理机器人（如机器人助手）
3. **Agent 操作系统**：像操作系统一样管理多个 Agent
4. **Agent 间通信协议**：标准化 Agent 间的协作语言
5. **自我进化 Agent**：Agent 能从经验中学习并改进自身

---

## 十、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| AI Agent | 能感知环境、自主决策、执行动作的智能体 |
| LLM 作为大脑 | LLM 是 Agent 的推理引擎、规划器、决策核心 |
| 感知 | 从环境获取信息（用户输入、工具结果、环境状态） |
| 决策 | LLM 推理后选择下一步行动 |
| 行动 | 执行具体操作（调用工具、回复用户） |
| 记忆 | 短期（上下文）、工作（草稿本）、长期（向量库） |
| ReAct | 推理+行动交替的 Agent 范式 |
| Function Calling | LLM 原生工具调用能力 |
| Agent Loop | 感知→决策→行动→观察→再决策的循环 |
| 工具（Tool） | Agent 可调用的外部能力（搜索、代码执行、API） |

### 关键收获

1. **Agent ≠ Chatbot**：Chatbot 只「说」，Agent 既「说」又「做」，能调用工具完成任务
2. **LLM 是大脑**：Agent 的智能来自 LLM 的推理能力，但需要工具和记忆的配合
3. **四大组件**：感知、大脑（LLM）、行动、记忆构成完整 Agent
4. **Agent Loop**：感知→决策→行动→观察→评估→再决策的循环是 Agent 的生命线
5. **ReAct 范式**：推理与行动交替进行，是最经典的 Agent 模式
6. **工具是关键**：没有工具，LLM 只能聊天；有了工具，LLM 成为 Agent
7. **记忆系统**：短期+工作+长期记忆让 Agent 跨越单次对话限制
8. **Function Calling**：现代 LLM 原生支持工具调用，是 Agent 的基础能力

### 与前面所学知识的关联

Day 10 是前面 9 天基础知识的**概念升华**：

- **Day 1-4（TypeScript）**：Agent 代码用 TypeScript 编写，类型系统保证工具调用的类型安全
- **Day 3（async/await）**：Agent 的每一步都是异步操作（调用 LLM、执行工具）
- **Day 5（Stream/Buffer）**：LLM 流式响应基于 Stream，Agent 实时输出基于此
- **Day 6（Event Loop）**：Agent 的并发工具调用依赖事件循环调度
- **Day 7（EventEmitter）**：事件驱动架构是 Agent 系统的基础
- **Day 8（子进程/Worker）**：多 Agent 并行执行、代码沙箱
- **Day 9（HTTP）**：Agent 与 LLM 的通信就是 HTTP 请求，工具调用也是 HTTP 请求

> **从 Day 11 开始**，我们将深入 Agent 的各项核心能力：Prompt Engineering（Day 11）、Function Calling（Day 12）、Memory 与 Planning（Day 13），并在 Day 14 做阶段一总结。

---

## 十一、学习资料

以下中文文档站点已收录（已考虑网络可访问性）：

| 资源 | 链接 | 说明 |
|------|------|------|
| 菜鸟教程 - AI Agent 教程 | https://www.runoob.com/ai-agent/ai-agent-tutorial.html | 入门友好，Agent 概念详解 |
| 菜鸟教程 - 大语言模型基础（LLM） | https://www.runoob.com/ai-agent/ai-agent-llm.html | LLM 作为 Agent 大脑的入门讲解 |
| 知乎 - AI Agent（LLM Agent）深度讲解 | https://zhuanlan.zhihu.com/p/676544930 | Agent 组成、方法、案例全面解析 |
| 知乎 - 什么是 AI Agent？综述一篇就够了 | https://zhuanlan.zhihu.com/p/1895877953453265781 | Agent 定义、架构、应用全面综述 |
| CSDN - AI 时代，一文搞懂 Agent 是什么 | https://blog.csdn.net/l01011_/article/details/146495533 | Agent 基本定义与核心概念 |
| CSDN - Agent 的大脑：LLM 如何成为智能核心 | https://blog.csdn.net/u013010473/article/details/157655124 | LLM 作为 Agent 大脑深度解析 |
| 腾讯云 - Agent 全面爆发：ReAct 核心范式 | https://cloud.tencent.com/developer/article/2608465 | ReAct 推理-行动-观察闭环详解 |
| 阿里云 - AI Agent 核心架构与 ReAct 框架 | https://developer.aliyun.com/article/1685293 | Agent 架构与 ReAct 框架构建方法 |
| 阿里云 - 从工具到伙伴：Agent 架构演进 | https://developer.aliyun.com/article/1740897 | 感知-规划-行动-反思四大架构深度解析 |
| 技术栈 - 从 LLM 到 ReAct Agent | https://jishuzhan.net/article/2003627350500638722 | 推理与行动协同的智能体框架 |
| OpenAI 中文文档 - 快速入门 | https://www.openaicto.com/docs/quickstart | OpenAI API 中文版快速入门 |
| OpenAI 中文文档（社区版） | https://docsopen.ai/ | OpenAI API 中文社区文档 |
| 掘金 - OpenAI API 接口文档（中文版） | https://juejin.cn/post/7225126264663605309 | OpenAI API 中文翻译文档 |
| 腾讯云 - AI Agent 从技术概念到场景落地 | https://cloud.tencent.com/developer/article/2455474 | Agent 技术架构与场景落地 |
| 知乎 - 大模型智能体(AI Agents)完整教程 | https://zhuanlan.zhihu.com/p/1965470906315933174 | 从概念到实践的完整教程 |

> **提示**：菜鸟教程的 AI Agent 系列教程是入门最佳起点；知乎和 CSDN 的综述文章适合深入理解概念；ReAct 相关的腾讯云和阿里云文章是理解 Agent 工作机制的关键。OpenAI API 中文文档用于了解 LLM 调用的具体接口。

---

## 十二、明日预告

**Day 11：AI Agent 概念 — Prompt Engineering**

- Prompt Engineering 是什么？为什么它是与 LLM 交互的关键技能
- Prompt 设计原则：清晰、具体、结构化
- 高级技巧：Few-shot、Chain-of-Thought、Role Prompting
- Agent System Prompt 设计：如何让 LLM 成为合格的 Agent 大脑
- Prompt 模板与变量注入

如果说今天是理解 Agent 的「是什么」，明天就是学习如何与 Agent 的「大脑」（LLM）高效沟通。Prompt Engineering 是所有 Agent 开发者的必备技能——好的 Prompt 能让 LLM 的能力发挥到极致，差的 Prompt 会让 Agent 表现得像个「笨蛋」。

---

> 🚀 Day 10 完成！从今天起，你正式踏入了 AI Agent 的概念世界。理解 Agent = LLM（大脑）+ 工具（手）+ 记忆（心）+ 规划（思维），你就掌握了构建智能体的核心认知。接下来的 4 天，我们将逐一深入这些概念，为阶段二的核心框架学习做好准备！
`
  },
  {
    id: '11',
    title: 'AI Agent 学习计划 Day 9：Node.js HTTP/HTTPS',
    slug: 'ai-agent-day9-nodejs-http-https',
    date: '2026-07-10',
    tags: ['Node.js', 'AI Agent', '学习笔记'],
    excerpt: 'AI Agent 84 天学习计划第九天。系统学习 Node.js HTTP/HTTPS 模块：创建 HTTP 服务器、解析请求与发送响应、HTTP 客户端请求、http.Agent 连接池与 Keep-Alive、HTTPS/TLS 证书配置、SSE 流式响应接收与转发、内置 fetch API、超时控制与指数退避重试策略、完整 LLM 客户端封装、HTTP 代理服务器、Agent API 服务器搭建，并落地到调用 OpenAI API 的完整链路实现。',
    readingTime: 35,
    content: `# AI Agent 学习计划 Day 9：Node.js HTTP/HTTPS

> 📅 日期：2026-07-10  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 9 / 84（10.7%）

## 前言

Day 8 我们突破了单线程限制，掌握了 child_process 和 worker_threads。今天，我们要学习的是 AI Agent 系统中**最基础也最核心的通信协议——HTTP**。

想一想 Agent 系统中每一次关键操作的底层：

- **调用 LLM** → HTTP POST 到 \`https://api.openai.com/v1/chat/completions\`
- **流式响应** → HTTP Server-Sent Events（SSE）
- **工具调用** → HTTP 请求到搜索 API、数据库 API、业务系统
- **暴露服务** → HTTP Server 提供 RESTful API 或 WebSocket 端点
- **Webhook 回调** → HTTP POST 接收外部事件通知

可以说，**Agent 的每一次「思考」和「行动」都伴随着 HTTP 请求**。理解 Node.js HTTP 模块的工作原理，是掌握 OpenAI SDK、LangChain.js、Vercel AI SDK 等框架底层通信机制的基石。今天我们将从 HTTP 服务器、HTTP 客户端、连接管理、HTTPS/TLS、SSE 流式传输，一路讲到调用 LLM API 的完整实现。

---

## 一、HTTP 协议基础回顾

### 1.1 HTTP 请求/响应模型

HTTP 是一个**请求-响应**协议：客户端发送请求，服务器返回响应。

\`\`\`
请求 (Request):
┌─────────────────────────────────┐
│ POST /v1/chat/completions HTTP/1.1   │  ← 请求行: 方法 路径 版本
│ Host: api.openai.com                  │  ← 请求头
│ Content-Type: application/json        │
│ Authorization: Bearer sk-xxx          │
│                                       │
│ {"model":"gpt-4","messages":[...]}    │  ← 请求体
└─────────────────────────────────┘

响应 (Response):
┌─────────────────────────────────┐
│ HTTP/1.1 200 OK                       │  ← 状态行: 版本 状态码 状态文本
│ Content-Type: application/json        │  ← 响应头
│ Transfer-Encoding: chunked            │
│                                       │
│ {"id":"chatcmpl-xxx","choices":[...]} │  ← 响应体
└─────────────────────────────────┘
\`\`\`

### 1.2 常见 HTTP 方法

| 方法 | 语义 | Agent 场景 |
|------|------|-----------|
| \`GET\` | 获取资源 | 获取模型列表、查询状态 |
| \`POST\` | 创建资源 | 发送 prompt、调用 LLM、执行工具 |
| \`PUT\` | 更新资源（全量） | 更新配置 |
| \`PATCH\` | 更新资源（部分） | 修改部分设置 |
| \`DELETE\` | 删除资源 | 删除会话、清理数据 |

### 1.3 关键状态码

| 状态码 | 含义 | Agent 处理策略 |
|--------|------|---------------|
| \`200\` | 成功 | 正常处理 |
| \`201\` | 创建成功 | 资源已创建 |
| \`400\` | 请求错误 | 检查请求体格式 |
| \`401\` | 未认证 | 检查 API Key |
| \`403\` | 禁止访问 | 检查权限 |
| \`429\` | 速率限制 | 退避重试 |
| \`500\` | 服务器错误 | 重试或降级 |
| \`503\` | 服务不可用 | 重试或切换备用模型 |

---

## 二、创建 HTTP 服务器

### 2.1 最简 HTTP 服务器

\`\`\`javascript
import http from 'node:http'

const server = http.createServer((req, res) => {
  // req: IncomingMessage — 可读流，包含请求信息
  // res: ServerResponse — 可写流，用于发送响应

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end('Hello, Agent!')
})

server.listen(3000, () => {
  console.log('Agent Server running on http://localhost:3000')
})
\`\`\`

### 2.2 解析请求信息

\`req\`（IncomingMessage）是一个可读流，同时也是请求信息的载体：

\`\`\`javascript
const server = http.createServer((req, res) => {
  // 请求方法: GET / POST / PUT / DELETE ...
  console.log('Method:', req.method)

  // 请求 URL: /api/chat?model=gpt-4
  console.log('URL:', req.url)

  // 请求头（所有键名自动转为小写）
  console.log('Headers:', req.headers)
  console.log('Content-Type:', req.headers['content-type'])
  console.log('Authorization:', req.headers['authorization'])

  // HTTP 版本: 1.1 或 2.0
  console.log('HTTP Version:', req.httpVersion)

  // 客户端 IP
  console.log('Remote Address:', req.socket.remoteAddress)
})
\`\`\`

### 2.3 读取请求体（Body）

请求体是通过流的方式读取的，需要监听 \`data\` 和 \`end\` 事件：

\`\`\`javascript
const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = ''

    // 逐块接收数据
    req.on('data', (chunk) => {
      body += chunk.toString()
    })

    // 数据接收完毕
    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        console.log('Received:', data)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ received: true }))
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON' }))
      }
    })
  }
})
\`\`\`

**Promise 化的请求体读取**（推荐）：

\`\`\`javascript
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => body += chunk.toString())
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

// 使用
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST') {
    const bodyStr = await readBody(req)
    const data = JSON.parse(bodyStr)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ echo: data }))
  }
})
\`\`\`

### 2.4 发送响应

\`\`\`javascript
// 方式一：链式调用
res.writeHead(200, {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'X-Custom-Header': 'Agent-Server'
})
res.end(JSON.stringify({ message: 'Hello' }))

// 方式二：分别设置
res.statusCode = 200
res.setHeader('Content-Type', 'application/json')
res.write('{"message": "Hello"}')  // 可以多次 write
res.end()  // 最后调用 end
\`\`\`

### 2.5 路由分发

\`\`\`javascript
import http from 'node:http'
import { URL } from 'node:url'

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, \`http://\${req.headers.host}\`)
  const { pathname } = url
  const { method } = req

  // CORS 预检
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    })
    return res.end()
  }

  // 路由匹配
  if (method === 'POST' && pathname === '/api/chat') {
    return handleChat(req, res)
  }

  if (method === 'GET' && pathname === '/api/models') {
    return handleListModels(req, res)
  }

  if (method === 'POST' && pathname.startsWith('/api/tools/')) {
    const toolName = pathname.split('/').pop()
    return handleToolCall(req, res, toolName)
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not Found' }))
})

server.listen(3000)
\`\`\`

---

## 三、Node.js 作为 HTTP 客户端

### 3.1 http.request — 通用请求方法

\`\`\`javascript
import http from 'node:http'

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/data',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
}

const req = http.request(options, (res) => {
  console.log(\`状态码: \${res.statusCode}\`)
  console.log(\`响应头: \${JSON.stringify(res.headers)}\`)

  let data = ''
  res.on('data', (chunk) => data += chunk)
  res.on('end', () => {
    console.log('响应体:', JSON.parse(data))
  })
})

req.on('error', (err) => {
  console.error('请求出错:', err.message)
})

req.end()  // 必须调用 end() 才会真正发送请求
\`\`\`

### 3.2 http.get — GET 请求快捷方法

\`\`\`javascript
import http from 'node:http'

// http.get 是 http.request 的快捷方式，自动 method=GET 并调用 end()
http.get('http://localhost:3000/api/models', (res) => {
  let data = ''
  res.on('data', (chunk) => data += chunk)
  res.on('end', () => {
    const models = JSON.parse(data)
    console.log('可用模型:', models)
  })
}).on('error', (err) => {
  console.error('请求失败:', err.message)
})
\`\`\`

### 3.3 POST 请求发送 JSON

\`\`\`javascript
import http from 'node:http'

function postJSON(url, data) {
  const body = JSON.stringify(data)

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)  // 必须设置 Content-Length
      }
    }

    const req = http.request(options, (res) => {
      let responseData = ''
      res.on('data', (chunk) => responseData += chunk)
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: JSON.parse(responseData)
          })
        } catch {
          resolve({ status: res.statusCode, data: responseData })
        }
      })
    })

    req.on('error', reject)
    req.write(body)  // 写入请求体
    req.end()
  })
}

// 使用
const result = await postJSON('http://localhost:3000/api/chat', {
  message: '你好',
  model: 'gpt-4'
})
\`\`\`

### 3.4 使用内置 fetch（Node.js 18+）

Node.js 18+ 内置了浏览器兼容的 \`fetch\` API，大幅简化 HTTP 请求：

\`\`\`javascript
// Node.js 18+ 内置 fetch，无需安装任何包
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${process.env.API_KEY}\`
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: '你好' }]
  })
})

const data = await response.json()
console.log(data)
\`\`\`

**fetch vs http.request 对比**：

| 特性 | \`http.request\` | \`fetch\` |
|------|----------------|---------|
| **API 风格** | 事件回调（Event-based） | Promise / async-await |
| **流式处理** | 手动监听 data 事件 | \`response.body.getReader()\` |
| **代码简洁度** | 冗长 | 简洁 |
| **浏览器兼容** | ❌ 仅 Node.js | ✅ Node.js + 浏览器 |
| **底层控制** | 精细控制（socket、agent 等） | 较少底层控制 |
| **推荐场景** | 需要精细控制的底层场景 | 日常 API 调用（推荐） |

---

## 四、http.Agent — 连接池与 Keep-Alive

### 4.1 为什么需要连接池

每次 HTTP 请求都建立新的 TCP 连接（三次握手），开销很大。对于 Agent 系统频繁调用 LLM API 的场景，连接复用能显著提升性能。

\`\`\`
无 Keep-Alive:
  请求1: TCP握手 → 发送请求 → 接收响应 → TCP关闭
  请求2: TCP握手 → 发送请求 → 接收响应 → TCP关闭  ← 又要握手！

有 Keep-Alive:
  请求1: TCP握手 → 发送请求 → 接收响应 → 保持连接
  请求2: 复用连接 → 发送请求 → 接收响应 → 保持连接  ← 省去握手！
\`\`\`

### 4.2 配置 Agent

\`\`\`javascript
import http from 'node:http'

const agent = new http.Agent({
  keepAlive: true,           // 启用 Keep-Alive
  keepAliveMsecs: 1000,      // Keep-Alive 探测间隔
  maxSockets: 256,           // 每个主机最大并发连接数
  maxFreeSockets: 32,        // 空闲时保持的最大连接数
  timeout: 30000             // 超时时间
})

// 在请求中使用
const options = {
  hostname: 'api.openai.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  agent: agent  // 指定 agent
}
\`\`\`

### 4.3 全局 Agent 配置

\`\`\`javascript
// 设置全局默认 Agent（影响所有 http.request 调用）
http.globalAgent.keepAlive = true
http.globalAgent.maxSockets = 256
\`\`\`

---

## 五、HTTPS 模块

### 5.1 为什么需要 HTTPS

LLM API（OpenAI、Anthropic 等）都使用 HTTPS。如果用 \`http\` 模块请求 HTTPS 地址，会直接报错。必须使用 \`https\` 模块。

### 5.2 HTTPS 客户端请求

\`\`\`javascript
import https from 'node:https'

const options = {
  hostname: 'api.openai.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`
  }
}

const req = https.request(options, (res) => {
  let data = ''
  res.on('data', (chunk) => data += chunk)
  res.on('end', () => {
    console.log('LLM 响应:', JSON.parse(data))
  })
})

req.on('error', (err) => {
  console.error('请求失败:', err.message)
})

req.write(JSON.stringify({
  model: 'gpt-4',
  messages: [{ role: 'user', content: '什么是 AI Agent？' }]
}))

req.end()
\`\`\`

### 5.3 创建 HTTPS 服务器

\`\`\`javascript
import https from 'node:https'
import fs from 'node:fs'

const options = {
  key: fs.readFileSync('server.key'),     // 私钥
  cert: fs.readFileSync('server.crt'),    // 证书
  // ca: fs.readFileSync('ca.crt'),       // CA 证书链（可选）
}

const server = https.createServer(options, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Secure Agent Server')
})

server.listen(443, () => {
  console.log('HTTPS Server running on https://localhost:443')
})
\`\`\`

### 5.4 自签名证书（开发环境）

\`\`\`bash
# 生成私钥
openssl genrsa -out server.key 2048

# 生成 CSR（证书签名请求）
openssl req -new -key server.key -out server.csr

# 自签名证书（有效期 365 天）
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
\`\`\`

> **生产环境**：建议使用 [Let's Encrypt](https://letsencrypt.org/) 免费证书，配合 \`certbot\` 自动续签。

### 5.5 忽略证书验证（仅开发测试）

\`\`\`javascript
// ⚠️ 警告：仅用于本地开发测试，绝对不要在生产环境使用！
const https = require('node:https')

const agent = new https.Agent({
  rejectUnauthorized: false  // 忽略证书验证
})

const response = await fetch('https://localhost:3000/api/test', {
  agent  // Node.js 18+ 的 fetch 使用 dispatcher 而非 agent，这里仅做说明
})
\`\`\`

---

## 六、SSE 流式响应 — LLM 的实时输出

### 6.1 什么是 SSE

Server-Sent Events（SSE）是 HTTP 上的流式传输协议。LLM API（OpenAI、Anthropic 等）使用 SSE 实现 token 逐字输出。

\`\`\`
SSE 数据格式：
data: {"choices":[{"delta":{"content":"你"}}]}

data: {"choices":[{"delta":{"content":"好"}}]}

data: {"choices":[{"delta":{"content":"！"}}]}

data: [DONE]
\`\`\`

### 6.2 接收 SSE 流式响应

\`\`\`javascript
import https from 'node:https'

function streamChatCompletion(messages, onToken, options = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: options.model || 'gpt-4',
      messages,
      stream: true,  // 启用流式
      temperature: options.temperature ?? 0.7
    })

    const req = https.request({
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let buffer = ''  // 缓冲区，处理跨 chunk 的不完整数据

      res.on('data', (chunk) => {
        buffer += chunk.toString()

        // 按行分割
        const lines = buffer.split('\\n')
        buffer = lines.pop()  // 最后可能不完整的行，留在缓冲区

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)  // 去掉 'data: ' 前缀
          if (data === '[DONE]') {
            resolve()
            return
          }

          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content
            if (token) onToken(token)
          } catch (err) {
            // JSON 解析失败，可能是数据不完整，跳过
          }
        }
      })

      res.on('end', () => resolve())
      res.on('error', reject)
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// 使用
await streamChatCompletion(
  [{ role: 'user', content: '用三句话介绍 AI Agent' }],
  (token) => process.stdout.write(token)
)
// 输出：AI Agent 是一种能够感知环境、自主决策并执行动作的智能体...
\`\`\`

### 6.3 用 fetch 接收 SSE（推荐）

\`\`\`javascript
async function streamChatWithFetch(messages, onToken, options = {}) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`
    },
    body: JSON.stringify({
      model: options.model || 'gpt-4',
      messages,
      stream: true
    })
  })

  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${await response.text()}\`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\\n')
    buffer = lines.pop()

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue

      const data = trimmed.slice(6)
      if (data === '[DONE]') return

      const parsed = JSON.parse(data)
      const token = parsed.choices?.[0]?.delta?.content
      if (token) onToken(token)
    }
  }
}
\`\`\`

### 6.4 在 HTTP Server 中转发 SSE

\`\`\`javascript
import http from 'node:http'

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat/stream') {
    const body = await readBody(req)
    const { messages } = JSON.parse(body)

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    })

    // 调用 LLM 并流式转发
    await streamChatWithFetch(messages, (token) => {
      // 以 SSE 格式发送给客户端
      res.write(\`data: \${JSON.stringify({ token })}\\n\\n\`)
    })

    // 发送结束标记
    res.write('data: [DONE]\\n\\n')
    res.end()
  }
})

server.listen(3000)
\`\`\`

---

## 七、错误处理与重试策略

### 7.1 常见错误类型

\`\`\`javascript
import https from 'node:https'

// 网络错误：连接超时、DNS 解析失败、TCP 重置
// HTTP 错误：4xx（客户端错误）、5xx（服务器错误）
// 解析错误：响应体不是合法 JSON

async function safeRequest(url, options) {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      // HTTP 错误
      const errorBody = await response.text()

      if (response.status === 429) {
        throw new RateLimitError('API 速率限制', response)
      }

      if (response.status === 401) {
        throw new AuthError('API Key 无效', response)
      }

      if (response.status >= 500) {
        throw new ServerError(\`服务器错误: \${response.status}\`, response)
      }

      throw new Error(\`HTTP \${response.status}: \${errorBody}\`)
    }

    return response
  } catch (err) {
    if (err instanceof TypeError) {
      // fetch 网络错误（DNS 解析失败、连接超时等）
      throw new NetworkError('网络请求失败', err)
    }
    throw err
  }
}

class RateLimitError extends Error { constructor(msg, res) { super(msg); this.name = 'RateLimitError'; this.response = res } }
class AuthError extends Error { constructor(msg, res) { super(msg); this.name = 'AuthError'; this.response = res } }
class ServerError extends Error { constructor(msg, res) { super(msg); this.name = 'ServerError'; this.response = res } }
class NetworkError extends Error { constructor(msg, cause) { super(msg); this.name = 'NetworkError'; this.cause = cause } }
\`\`\`

### 7.2 超时控制

\`\`\`javascript
// 方式一：使用 AbortController（推荐）
async function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(\`请求超时（\${timeoutMs}ms）\`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// 方式二：使用 http.request 的 setTimeout
const req = http.request(options, callback)
req.setTimeout(30000, () => {
  req.destroy(new Error('请求超时'))
})
\`\`\`

### 7.3 指数退避重试

\`\`\`javascript
async function fetchWithRetry(url, options, config = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    retryableStatus = [429, 500, 502, 503, 504]
  } = config

  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, 30000)

      // 不可重试的状态码，直接返回
      if (!retryableStatus.includes(response.status)) {
        return response
      }

      // 可重试但已达最大次数
      if (attempt === maxRetries) {
        return response
      }

      // 检查 Retry-After 头
      const retryAfter = response.headers.get('retry-after')
      const delay = retryAfter
        ? parseInt(retryAfter) * 1000
        : Math.min(baseDelay * Math.pow(2, attempt), maxDelay)

      console.warn(\`请求失败（\${response.status}），\${delay}ms 后重试（\${attempt + 1}/\${maxRetries}）\`)
      await sleep(delay)

    } catch (err) {
      lastError = err
      if (attempt === maxRetries) throw err

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      console.warn(\`请求出错（\${err.message}），\${delay}ms 后重试（\${attempt + 1}/\${maxRetries}）\`)
      await sleep(delay)
    }
  }

  throw lastError
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 使用
const response = await fetchWithRetry(
  'https://api.openai.com/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: '你好' }]
    })
  },
  { maxRetries: 5, baseDelay: 1000 }
)
\`\`\`

---

## 八、Agent 实战：完整的 LLM 客户端封装

### 8.1 LLMClient 类

整合前面所有知识，封装一个生产级的 LLM 客户端：

\`\`\`javascript
class LLMClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY
    this.baseUrl = options.baseUrl || 'https://api.openai.com/v1'
    this.defaultModel = options.defaultModel || 'gpt-4'
    this.timeout = options.timeout || 60000
    this.maxRetries = options.maxRetries || 3
  }

  // 普通对话
  async chat(messages, options = {}) {
    const response = await fetchWithRetry(
      \`\${this.baseUrl}/chat/completions\`,
      {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens,
          tools: options.tools,
          tool_choice: options.toolChoice
        })
      },
      { maxRetries: this.maxRetries }
    )

    const data = await response.json()
    return data
  }

  // 流式对话
  async chatStream(messages, onToken, options = {}) {
    const response = await fetchWithRetry(
      \`\${this.baseUrl}/chat/completions\`,
      {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages,
          temperature: options.temperature ?? 0.7,
          stream: true,
          tools: options.tools,
          tool_choice: options.toolChoice
        })
      },
      { maxRetries: this.maxRetries }
    )

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\\n')
      buffer = lines.pop()

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') return fullText

        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta

        if (delta?.content) {
          fullText += delta.content
          onToken(delta.content, fullText)
        }

        // 处理工具调用
        if (delta?.tool_calls) {
          onToken(null, fullText, delta.tool_calls)
        }
      }
    }

    return fullText
  }

  // 生成嵌入向量
  async embed(text, model = 'text-embedding-3-small') {
    const response = await fetchWithRetry(
      \`\${this.baseUrl}/embeddings\`,
      {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({ model, input: text })
      },
      { maxRetries: this.maxRetries }
    )

    const data = await response.json()
    return data.data[0].embedding
  }

  _getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${this.apiKey}\`
    }
  }
}
\`\`\`

### 8.2 使用示例

\`\`\`javascript
const client = new LLMClient({
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4'
})

// 普通对话
const result = await client.chat([
  { role: 'system', content: '你是一个 AI Agent 专家' },
  { role: 'user', content: '什么是 ReAct 模式？' }
])
console.log(result.choices[0].message.content)

// 流式对话
console.log('Agent 回复: ')
await client.chatStream(
  [{ role: 'user', content: '用三句话解释 Agent 的记忆系统' }],
  (token, fullText) => {
    process.stdout.write(token)
  }
)

// 生成嵌入
const embedding = await client.embed('AI Agent 是智能体')
console.log('向量维度:', embedding.length)
\`\`\`

---

## 九、HTTP 代理服务器

### 9.1 正向代理

Agent 系统中经常需要代理服务器来转发 LLM API 请求（隐藏 API Key、添加日志、缓存等）：

\`\`\`javascript
import http from 'node:http'
import https from 'node:https'

const server = http.createServer((clientReq, clientRes) => {
  console.log(\`[代理] \${clientReq.method} \${clientReq.url}\`)

  // 解析目标 URL
  const targetUrl = new URL(clientReq.url)

  // 构建代理请求选项
  const proxyOptions = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || 443,
    path: targetUrl.pathname + targetUrl.search,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: targetUrl.hostname,  // 修改 host 头
      // 注入 API Key（对客户端隐藏）
      'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`
    }
  }

  // 转发请求
  const proxyReq = https.request(proxyOptions, (proxyRes) => {
    // 转发响应头
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers)
    // 转发响应体
    proxyRes.pipe(clientRes)
  })

  proxyReq.on('error', (err) => {
    console.error('[代理] 请求失败:', err.message)
    clientRes.writeHead(502)
    clientRes.end('Bad Gateway')
  })

  // 转发请求体
  clientReq.pipe(proxyReq)
})

server.listen(8080, () => {
  console.log('代理服务器运行在 http://localhost:8080')
})
\`\`\`

### 9.2 完整的 Agent API 服务器

\`\`\`javascript
import http from 'node:http'
import { URL } from 'node:url'

class AgentServer {
  constructor(llmClient) {
    this.llm = llmClient
    this.server = http.createServer(this._handleRequest.bind(this))
  }

  async _handleRequest(req, res) {
    // CORS
    this._setCorsHeaders(res)

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      return res.end()
    }

    try {
      const url = new URL(req.url, \`http://\${req.headers.host}\`)

      // 路由
      if (req.method === 'POST' && url.pathname === '/api/chat') {
        return await this._handleChat(req, res)
      }

      if (req.method === 'POST' && url.pathname === '/api/chat/stream') {
        return await this._handleChatStream(req, res)
      }

      if (req.method === 'POST' && url.pathname === '/api/embed') {
        return await this._handleEmbed(req, res)
      }

      if (req.method === 'GET' && url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ status: 'ok' }))
      }

      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not Found' }))

    } catch (err) {
      console.error('服务器错误:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
  }

  async _handleChat(req, res) {
    const body = JSON.parse(await readBody(req))
    const result = await this.llm.chat(body.messages, body.options)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
  }

  async _handleChatStream(req, res) {
    const body = JSON.parse(await readBody(req))

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    await this.llm.chatStream(
      body.messages,
      (token) => {
        res.write(\`data: \${JSON.stringify({ token })}\\n\\n\`)
      },
      body.options
    )

    res.write('data: [DONE]\\n\\n')
    res.end()
  }

  async _handleEmbed(req, res) {
    const body = JSON.parse(await readBody(req))
    const embedding = await this.llm.embed(body.text)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ embedding }))
  }

  _setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  listen(port, callback) {
    this.server.listen(port, callback)
    return this
  }
}

// 启动服务器
const llmClient = new LLMClient({ apiKey: process.env.OPENAI_API_KEY })
const agentServer = new AgentServer(llmClient)

agentServer.listen(3000, () => {
  console.log('Agent API Server running on http://localhost:3000')
})
\`\`\`

---

## 十、HTTP/2 简介

### 10.1 HTTP/2 的优势

| 特性 | HTTP/1.1 | HTTP/2 |
|------|----------|--------|
| **多路复用** | 每个请求独占连接 | 一个连接承载多个请求 |
| **头部压缩** | 无 | HPACK 压缩 |
| **服务端推送** | 不支持 | 支持 |
| **二进制协议** | 文本协议 | 二进制分帧 |
| **流优先级** | 无 | 支持优先级 |

对 Agent 系统而言，HTTP/2 的多路复用意味着可以在一个连接上同时发送多个 LLM 请求，减少连接开销。

### 10.2 创建 HTTP/2 服务器

\`\`\`javascript
import http2 from 'node:http2'
import fs from 'node:fs'

const server = http2.createSecureServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
})

server.on('stream', (stream, headers) => {
  const path = headers[':path']
  const method = headers[':method']

  stream.respond({
    'content-type': 'application/json',
    ':status': 200
  })

  stream.end(JSON.stringify({
    protocol: 'HTTP/2',
    path,
    method
  }))
})

server.listen(8443, () => {
  console.log('HTTP/2 Server running on https://localhost:8443')
})
\`\`\`

---

## 十一、综合练习

### 练习 1：实现带缓存的 HTTP 客户端

\`\`\`javascript
class CachedHTTPClient {
  constructor() {
    this.cache = new Map()
    this.pending = new Map()
  }

  async get(url) {
    // 检查缓存
    const cached = this.cache.get(url)
    if (cached && Date.now() - cached.timestamp < 300000) {
      console.log('[缓存] 命中')
      return cached.data
    }

    // 检查是否有相同的请求正在进行
    if (this.pending.has(url)) {
      console.log('[去重] 合并请求')
      return this.pending.get(url)
    }

    // 发起新请求
    const promise = fetch(url).then(res => res.json()).then(data => {
      this.cache.set(url, { data, timestamp: Date.now() })
      this.pending.delete(url)
      return data
    })

    this.pending.set(url, promise)
    return promise
  }
}
\`\`\`

### 练习 2：实现请求并发限制器

\`\`\`javascript
class RateLimiter {
  constructor(maxConcurrent = 5, intervalMs = 1000) {
    this.maxConcurrent = maxConcurrent
    this.intervalMs = intervalMs
    this.active = 0
    this.queue = []
  }

  async execute(fn) {
    if (this.active >= this.maxConcurrent) {
      await new Promise(resolve => this.queue.push(resolve))
    }

    this.active++
    try {
      return await fn()
    } finally {
      this.active--
      if (this.queue.length > 0) {
        const next = this.queue.shift()
        next()
      }
    }
  }
}

// 使用：限制 LLM API 并发为 3
const limiter = new RateLimiter(3)

const results = await Promise.all(
  prompts.map(prompt =>
    limiter.execute(() => client.chat([{ role: 'user', content: prompt }]))
  )
)
\`\`\`

### 练习 3：实现带日志的代理中间件

\`\`\`javascript
function loggingMiddleware(req, res, next) {
  const start = Date.now()
  const { method, url } = req

  // 记录请求
  console.log(\`→ \${method} \${url}\`)

  // 拦截响应结束
  const originalEnd = res.end
  res.end = function(...args) {
    const duration = Date.now() - start
    console.log(\`← \${method} \${url} \${res.statusCode} \${duration}ms\`)
    originalEnd.apply(res, args)
  }

  next()
}
\`\`\`

---

## 十二、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| \`http.createServer\` | 创建 HTTP 服务器，回调接收 req（可读流）和 res（可写流） |
| \`http.request\` / \`http.get\` | 发送 HTTP 请求，事件驱动模式 |
| \`fetch\`（Node.js 18+） | Promise 风格的 HTTP 客户端，推荐使用 |
| \`http.Agent\` | 连接池管理，keepAlive 复用 TCP 连接 |
| \`https\` 模块 | HTTPS 请求/服务器，需配置 TLS 证书 |
| SSE（Server-Sent Events） | LLM 流式响应的标准协议，\`data: ...\\n\\n\` 格式 |
| AbortController | 请求超时和取消控制 |
| 指数退避重试 | 网络错误和 429/5xx 状态码的重试策略 |
| HTTP/2 | 多路复用、头部压缩，一个连接承载多个请求 |
| 代理服务器 | 转发请求、隐藏 API Key、添加日志/缓存 |

### 关键收获

1. **HTTP 是 Agent 的通信基础**：LLM 调用、工具调用、服务暴露都基于 HTTP
2. **请求/响应模型**：req 是可读流，res 是可写流，理解流式处理是核心
3. **fetch vs http.request**：日常用 fetch（简洁），底层控制用 http.request
4. **连接池（Agent）**：keepAlive 复用 TCP 连接，减少握手开销
5. **SSE 流式响应**：LLM 逐 token 输出的底层机制，\`data: \` 前缀 + \`\\n\\n\` 分隔
6. **HTTPS 必备**：所有 LLM API 都使用 HTTPS，需要 https 模块
7. **错误处理三件套**：超时（AbortController）、重试（指数退避）、分类（网络/HTTP/解析）
8. **代理模式**：Agent 后端的标准架构——代理转发 LLM 请求，保护 API Key

### 与 AI Agent 的关联

Node.js HTTP/HTTPS 在 Agent 开发中的核心应用：

- **调用 LLM API**：每一次 LLM 调用本质上是一个 HTTPS POST 请求
- **流式响应**：SSE 实现 token 逐字输出，是 Agent 实时交互的基础
- **Agent API 服务**：用 http.createServer 暴露 Agent 的 RESTful 接口
- **代理服务器**：代理转发 LLM 请求，隐藏 API Key，添加日志/缓存/限流
- **工具调用**：通过 HTTP 调用搜索 API、数据库 API 等外部工具
- **Webhook 集成**：接收外部事件通知，触发 Agent 执行

---

## 十三、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| Node.js 中文网 - HTTP 模块 | http://nodejs.cn/api/http.html | 官方文档中文版，权威完整（v26） |
| Node.js 中文网 - HTTPS 模块 | http://nodejs.cn/api/https.html | HTTPS/TLS 配置详解 |
| Node.js 中文网 - HTTP/2 模块 | http://nodejs.cn/api/http2.html | HTTP/2 协议实现文档 |
| Node.js 中文网 - 全局变量（含 fetch） | http://nodejs.cn/api/globals.html | 内置 fetch API 文档（v18+） |
| 菜鸟教程 - Node.js HTTP 模块 | https://www.runoob.com/nodejs/nodejs-http-module.html | 入门友好，含示例 |
| MDN 中文版 - Server-Sent Events | https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events | SSE 流式响应原理 |
| CSDN - Node.js 调用 OpenAI API 教程 | https://blog.csdn.net/2603_96029641/article/details/161041835 | 实战调用 OpenAI 兼容 API |
| 脚本之家 - JavaScript 调用 OpenAI API | https://www.jb51.net/javascript/3387880iu.htm | fetch 调用 LLM API 示例 |

> **提示**：Node.js 中文网（nodejs.cn）的 HTTP 和 HTTPS 文档是最权威的中文资源，覆盖所有 API 和高级用法。SSE 相关知识可参考 MDN 中文版。

---

## 十四、明日预告

**Day 10：AI Agent 概念 — Agent 定义与 LLM**

- Agent 的定义：能感知环境、自主决策、执行动作的智能体
- LLM 作为 Agent 的「大脑」
- Agent 的核心组成：感知、决策、行动、记忆
- OpenAI API 文档导读

从明天开始，我们将正式进入 AI Agent 的概念世界。前 9 天的 TypeScript 和 Node.js 基础，都是为理解 Agent 的底层实现做准备。掌握 HTTP 通信后，你就能理解 Agent 是如何通过 HTTP 与 LLM「对话」、如何通过 HTTP 调用外部工具的。

---

> 🚀 Day 9 完成！HTTP 是 Agent 与世界对话的语言——掌握它，就是学会了让 Agent 开口说话、伸手行动！
`,
  },
  {
    id: '10',
    title: 'AI Agent 学习计划 Day 8：Node.js 子进程与 Worker Threads',
    slug: 'ai-agent-day8-nodejs-child-process-worker-threads',
    date: '2026-07-09',
    tags: ['Node.js', 'AI Agent', '学习笔记'],
    excerpt: 'AI Agent 84 天学习计划第八天。系统学习 Node.js 子进程（child_process）与工作线程（worker_threads）：exec/execFile/spawn/fork 四大 API、进程间 IPC 通信、Worker 创建与消息传递、MessageChannel、SharedArrayBuffer 共享内存、进程池/线程池实现，并落地到 Agent 系统实战（并行多 Agent 执行、向量计算、代码沙箱、混合架构）。',
    readingTime: 32,
    content: `
# AI Agent 学习计划 Day 8：Node.js 子进程与 Worker Threads

> 📅 日期：2026-07-09  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 8 / 84（9.5%）

## 前言

Day 7 我们学习了 EventEmitter，掌握了 Node.js 事件驱动的「神经系统」。但 EventEmitter 解决的是「模块间如何通信」，而今天要解决的是一个更根本的问题——**如何突破单线程限制，实现真正的并行计算**。

Node.js 主线程是单线程的，事件循环让它能高效处理 I/O 密集型任务（网络请求、文件读写），但遇到 CPU 密集型任务（大规模向量计算、数据加密、图像处理）时，单线程会成为瓶颈——一个耗时计算会阻塞整个事件循环，所有 I/O 回调、LLM 流式 token 全部卡住。

Node.js 提供了两条突破单线程的路径：

1. **child_process（子进程）**：创建独立的操作系统进程，适合运行外部命令、隔离执行不可信代码
2. **worker_threads（工作线程）**：在同一个进程内创建多线程，共享内存，适合 CPU 密集型并行计算

在 AI Agent 开发中，这两者各有用武之地：child_process 用于执行外部代码（如运行 Python 脚本、调用系统命令），worker_threads 用于并行运行多个 Agent 任务、处理向量计算等 CPU 密集场景。本文将系统讲解这两个模块的核心 API、通信机制，并落地到 Agent 系统的实战应用。

---

## 一、为什么需要多进程/多线程

### 1.1 单线程的困境

回顾 Day 6 学过的事件循环——Node.js 主线程只有一个，CPU 密集任务会阻塞事件循环：

\`\`\`javascript
// ❌ CPU 密集任务阻塞事件循环
function heavyCompute(n) {
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += Math.sqrt(i)
  }
  return sum
}

// 这段代码运行期间，所有 I/O 回调都被阻塞
setTimeout(() => console.log('我被阻塞了 5 秒'), 0)
heavyCompute(1e9)  // 阻塞约 5 秒
\`\`\`

在 Agent 系统中，这意味着：如果你在主线程做向量相似度计算，LLM 的流式 token 就无法实时推送，用户体验极差。

### 1.2 两种并行方案对比

| 特性 | child_process（子进程） | worker_threads（工作线程） |
|------|------------------------|--------------------------|
| **底层** | 操作系统进程 | 线程（共享进程内存空间） |
| **内存** | 独立内存空间，不共享 | 可通过 SharedArrayBuffer 共享 |
| **启动开销** | 大（创建新进程） | 小（创建新线程） |
| **通信方式** | IPC（进程间通信）、stdout/stdin | MessagePort（消息传递）、共享内存 |
| **隔离性** | 强（进程崩溃不影响主进程） | 弱（线程崩溃可能影响整个进程） |
| **适用场景** | 运行外部命令、执行不可信代码、多语言混合 | CPU 密集计算、并行 Agent 任务 |
| **Agent 应用** | 代码执行沙箱、运行 Python 脚本 | 并行向量计算、多 Agent 并发推理 |

### 1.3 选择原则

\`\`\`
需要运行外部命令/脚本？     → child_process
需要执行不可信的用户代码？   → child_process（隔离更安全）
需要 CPU 密集型并行计算？   → worker_threads（开销更小）
需要共享大量数据？          → worker_threads（SharedArrayBuffer）
需要跨语言调用（Python等）？ → child_process
\`\`\`

---

## 二、child_process 模块

### 2.1 四个核心 API

\`child_process\` 模块提供四种创建子进程的方法：

| 方法 | 返回值 | 特点 | 适用场景 |
|------|--------|------|---------|
| \`exec\` | ChildProcess + 回调 | 使用 shell 执行命令，有 maxBuffer 限制 | 执行简单命令 |
| \`execFile\` | ChildProcess + 回调 | 不使用 shell，更安全高效 | 执行可执行文件 |
| \`spawn\` | ChildProcess（流式） | 流式返回数据，无 maxBuffer 限制 | 大量数据输出 |
| \`fork\` | ChildProcess | spawn 的特例，专门用于 Node.js 进程，自带 IPC | Node.js 进程间通信 |

### 2.2 exec：执行 shell 命令

\`exec\` 在 shell 中执行命令，将结果缓存在内存中，通过回调返回：

\`\`\`javascript
const { exec } = require('child_process')

// 执行 shell 命令
exec('ls -la /tmp', (error, stdout, stderr) => {
  if (error) {
    console.error(\`执行出错: \${error.message}\`)
    return
  }
  if (stderr) {
    console.error(\`stderr: \${stderr}\`)
    return
  }
  console.log(\`stdout: \${stdout}\`)
})
\`\`\`

**Promise 化写法**（推荐）：

\`\`\`javascript
const { promisify } = require('util')
const execAsync = promisify(require('child_process').exec)

async function listFiles() {
  try {
    const { stdout, stderr } = await execAsync('ls -la /tmp')
    console.log(stdout)
  } catch (err) {
    console.error('命令执行失败:', err.message)
  }
}

listFiles()
\`\`\`

> **注意**：\`exec\` 默认 maxBuffer 为 1MB，如果输出超过此限制会报错。大量输出请用 \`spawn\`。

### 2.3 execFile：执行可执行文件

\`execFile\` 直接执行可执行文件，不经过 shell，更安全（避免 shell 注入）也更高效：

\`\`\`javascript
const { execFile } = require('child_process')

// 直接执行 node 命令，不经过 shell
execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) throw error
  console.log(\`Node.js 版本: \${stdout.trim()}\`)
})

// 执行 Python 脚本（Agent 场景：调用 Python 工具链）
execFile('python3', ['script.py', '--input', 'data.json'], (error, stdout, stderr) => {
  if (error) {
    console.error('Python 脚本执行失败:', error.message)
    return
  }
  console.log('Python 输出:', stdout)
})
\`\`\`

> **安全提示**：\`execFile\` 不经过 shell，不会对参数做 shell 解析，避免了命令注入风险。处理用户输入时优先使用 \`execFile\`。

### 2.4 spawn：流式创建子进程

\`spawn\` 是最底层的子进程创建方法，返回的数据是流式的，没有 maxBuffer 限制，适合处理大量输出：

\`\`\`javascript
const { spawn } = require('child_process')

// 流式执行：适合大量输出
const child = spawn('find', ['/', '-name', '*.log', '-type', 'f'])

// 逐块接收 stdout
child.stdout.on('data', (chunk) => {
  console.log(\`找到文件: \${chunk.toString().trim()}\`)
})

child.stderr.on('data', (chunk) => {
  console.error(\`错误: \${chunk}\`)
})

child.on('close', (code) => {
  console.log(\`子进程退出，退出码: \${code}\`)
})
\`\`\`

**Agent 场景：流式执行代码并实时输出**

\`\`\`javascript
// 运行用户提交的脚本，实时返回输出
function runScript(scriptPath, args = []) {
  const child = spawn('node', [scriptPath, ...args])

  const output = []
  
  child.stdout.on('data', (chunk) => {
    output.push(chunk)
    // 实时推送给前端
    console.log(\`[stdout] \${chunk.toString()}\`)
  })

  child.stderr.on('data', (chunk) => {
    console.error(\`[stderr] \${chunk.toString()}\`)
  })

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(output).toString())
      } else {
        reject(new Error(\`进程退出码: \${code}\`))
      }
    })
  })
}
\`\`\`

### 2.5 fork：Node.js 进程间通信

\`fork\` 是 \`spawn\` 的特例，专门用于创建 Node.js 子进程，**自带 IPC 通道**，父子进程可以通过 \`send\`/\`on('message')\` 通信：

\`\`\`javascript
// parent.js - 父进程
const { fork } = require('child_process')

// fork 一个 Node.js 子进程，自动建立 IPC 通道
const child = fork('worker.js')

// 发送消息给子进程
child.send({ type: 'task', data: { prompt: '你好', model: 'gpt-4' } })

// 接收子进程消息
child.on('message', (msg) => {
  console.log('收到子进程结果:', msg)

  if (msg.type === 'result') {
    console.log('LLM 回复:', msg.data)
    child.send({ type: 'exit' })  // 通知子进程退出
  }
})

child.on('exit', (code) => {
  console.log(\`子进程退出，退出码: \${code}\`)
})
\`\`\`

\`\`\`javascript
// worker.js - 子进程
process.on('message', async (msg) => {
  if (msg.type === 'task') {
    // 执行 LLM 调用（在子进程中，不阻塞主进程）
    const result = await callLLM(msg.data.prompt, msg.data.model)
    
    // 发送结果给父进程
    process.send({ type: 'result', data: result })
  }

  if (msg.type === 'exit') {
    process.exit(0)
  }
})

async function callLLM(prompt, model) {
  // 模拟 LLM 调用
  await new Promise(r => setTimeout(r, 1000))
  return \`LLM 回复: \${prompt}\`
}
\`\`\`

> **fork 的优势**：IPC 通道是结构化通信（直接传 JS 对象），比解析 stdout 更可靠。适合 Node.js 进程间协作。

---

## 三、child_process 进阶用法

### 3.1 传递环境变量和工作目录

\`\`\`javascript
const { spawn } = require('child_process')

const child = spawn('node', ['script.js'], {
  cwd: '/path/to/project',          // 工作目录
  env: {
    ...process.env,                  // 继承父进程环境变量
    OPENAI_API_KEY: 'sk-xxx',       // 注入额外变量
    NODE_ENV: 'production'
  },
  stdio: 'pipe',                     // stdin/stdout/stderr 管道
  timeout: 30000,                    // 30 秒超时
  killSignal: 'SIGTERM'              // 超时后发送的信号
})
\`\`\`

### 3.2 stdio 配置

\`stdio\` 选项控制子进程的标准输入输出：

\`\`\`javascript
// 三种常用配置
spawn('node', ['script.js'], { stdio: 'inherit' })   // 继承父进程，直接输出到终端
spawn('node', ['script.js'], { stdio: 'pipe' })      // 管道，通过 .stdout.on('data') 获取
spawn('node', ['script.js'], { stdio: 'ignore' })    // 丢弃输出
\`\`\`

### 3.3 超时与终止

\`\`\`javascript
const { spawn } = require('child_process')

function runWithTimeout(command, args, timeout = 10000) {
  const child = spawn(command, args)
  let timedOut = false

  const timer = setTimeout(() => {
    timedOut = true
    child.kill('SIGTERM')  // 先发 SIGTERM，给子进程清理机会
    
    // 3 秒后还没退出，强制 kill
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL')
      }
    }, 3000)
  }, timeout)

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      clearTimeout(timer)
      if (timedOut) {
        reject(new Error('进程超时被终止'))
      } else if (code === 0) {
        resolve('成功')
      } else {
        reject(new Error(\`退出码: \${code}\`))
      }
    })
  })
}
\`\`\`

### 3.4 进程池模式

频繁 fork 进程开销大，可以维护一个进程池复用子进程：

\`\`\`javascript
const { fork } = require('child_process')
const EventEmitter = require('events')

class ProcessPool {
  constructor(workerFile, poolSize = 4) {
    this.workerFile = workerFile
    this.poolSize = poolSize
    this.workers = []
    this.queue = []
    this.init()
  }

  init() {
    for (let i = 0; i < this.poolSize; i++) {
      this.workers.push(this.createWorker())
    }
  }

  createWorker() {
    const worker = fork(this.workerFile)
    worker.busy = false
    
    worker.on('message', (msg) => {
      if (msg.type === 'result' && worker.resolve) {
        worker.busy = false
        worker.resolve(msg.data)
        worker.resolve = null
        // 处理队列中的下一个任务
        this.processQueue()
      }
    })

    worker.on('exit', (code) => {
      console.log(\`Worker 退出，退出码: \${code}\`)
      // 重启 worker
      const index = this.workers.indexOf(worker)
      if (index !== -1) {
        this.workers[index] = this.createWorker()
      }
    })

    return worker
  }

  async run(task) {
    return new Promise((resolve) => {
      const freeWorker = this.workers.find(w => !w.busy)
      
      if (freeWorker) {
        freeWorker.busy = true
        freeWorker.resolve = resolve
        freeWorker.send({ type: 'task', data: task })
      } else {
        // 没有空闲 worker，加入队列
        this.queue.push({ task, resolve })
      }
    })
  }

  processQueue() {
    if (this.queue.length === 0) return
    const freeWorker = this.workers.find(w => !w.busy)
    if (!freeWorker) return

    const { task, resolve } = this.queue.shift()
    freeWorker.busy = true
    freeWorker.resolve = resolve
    freeWorker.send({ type: 'task', data: task })
  }
}

// 使用进程池
const pool = new ProcessPool('./llm-worker.js', 4)

// 并行提交 10 个任务
const tasks = Array(10).fill(0).map((_, i) => 
  pool.run({ prompt: \`问题 \${i}\`, model: 'gpt-4' })
)

const results = await Promise.all(tasks)
\`\`\`

---

## 四、worker_threads 模块

### 4.1 核心概念

\`worker_threads\` 模块允许在同一个 Node.js 进程内创建多线程。与 child_process 不同，Worker Threads 运行在**独立的 V8 实例**中，有独立的事件循环，但可以通过 \`MessagePort\` 和 \`SharedArrayBuffer\` 通信。

| 概念 | 说明 |
|------|------|
| \`Worker\` | 代表一个工作线程的类 |
| \`parentPort\` | 子线程中用于与主线程通信的端口 |
| \`workerData\` | 主线程传给子线程的初始数据 |
| \`MessageChannel\` | 双向通信通道（两个 MessagePort） |
| \`MessagePort\` | 单向通信端口 |
| \`SharedArrayBuffer\` | 可被多线程共享的内存 |

### 4.2 基本用法：主线程

\`\`\`javascript
const { Worker } = require('worker_threads')

// 创建 Worker，传入初始数据
const worker = new Worker('./worker-task.js', {
  workerData: {
    prompt: '你好',
    model: 'gpt-4',
    maxTokens: 1000
  }
})

// 接收子线程消息
worker.on('message', (result) => {
  console.log('收到结果:', result)
})

// 处理错误
worker.on('error', (err) => {
  console.error('Worker 出错:', err)
})

// Worker 退出
worker.on('exit', (code) => {
  console.log(\`Worker 退出，退出码: \${code}\`)
})

// 主动发送消息给子线程
worker.postMessage({ type: 'additional', data: '额外信息' })
\`\`\`

### 4.3 基本用法：子线程

\`\`\`javascript
// worker-task.js
const { parentPort, workerData, isMainThread } = require('worker_threads')

// 确认在子线程中运行
if (isMainThread) {
  throw new Error('此文件应在 Worker 线程中运行')
}

console.log('Worker 收到初始数据:', workerData)

// 接收主线程消息
parentPort.on('message', (msg) => {
  console.log('收到主线程消息:', msg)
  
  if (msg.type === 'additional') {
    // 处理任务
    const result = doWork(workerData, msg.data)
    
    // 发送结果给主线程
    parentPort.postMessage({
      type: 'done',
      result: result
    })
  }
})

function doWork(initialData, additionalData) {
  // 模拟 CPU 密集计算
  let sum = 0
  for (let i = 0; i < 1e7; i++) {
    sum += Math.sqrt(i)
  }
  return { sum, prompt: initialData.prompt }
}
\`\`\`

### 4.4 使用 Promise 包装 Worker

\`\`\`javascript
const { Worker } = require('worker_threads')
const path = require('path')

// 封装成 Promise，方便 async/await 调用
function runWorker(workerFile, data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFile, { workerData: data })

    worker.on('message', resolve)
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(\`Worker 异常退出，退出码: \${code}\`))
      }
    })
  })
}

// 使用
async function main() {
  const result = await runWorker('./heavy-compute.js', { n: 1e8 })
  console.log('计算结果:', result)
}

main()
\`\`\`

### 4.5 MessageChannel：双向通信

当需要主线程和子线程双向通信时，使用 \`MessageChannel\`：

\`\`\`javascript
const { Worker, MessageChannel } = require('worker_threads')

const { port1, port2 } = new MessageChannel()

const worker = new Worker('./双向-worker.js')

// 把 port2 传给子线程
worker.postMessage({ port: port2 }, [port2])

// 主线程通过 port1 收发消息
port1.on('message', (msg) => {
  console.log('主线程收到:', msg)
})

port1.postMessage('来自主线程的问候')
\`\`\`

\`\`\`javascript
// 双向-worker.js
const { parentPort } = require('worker_threads')

parentPort.on('message', ({ port }) => {
  // 通过收到的 port 通信
  port.on('message', (msg) => {
    console.log('子线程收到:', msg)
    port.postMessage('子线程的回复')
  })
})
\`\`\`

### 4.6 SharedArrayBuffer：共享内存

\`SharedArrayBuffer\` 允许多线程共享同一块内存，无需拷贝，适合大数据量场景：

\`\`\`javascript
// 主线程
const { Worker } = require('worker_threads')

// 创建共享内存：4 个 Float64（每个 8 字节 = 32 字节）
const sharedBuffer = new SharedArrayBuffer(4 * 8)
const sharedArray = new Float64Array(sharedBuffer)

// 初始值
sharedArray[0] = 1.0
sharedArray[1] = 2.0

const worker = new Worker('./shared-worker.js', {
  workerData: { sharedBuffer }
})

worker.on('message', () => {
  // Worker 修改后，主线程直接能看到（共享内存）
  console.log('共享数组:', Array.from(sharedArray))
  // [1.0, 2.0, 3.0, 4.0]  ← Worker 写入了后两位
})
\`\`\`

\`\`\`javascript
// shared-worker.js
const { parentPort, workerData } = require('worker_threads')

const { sharedBuffer } = workerData
const sharedArray = new Float64Array(sharedBuffer)

// 写入共享内存
sharedArray[2] = 3.0
sharedArray[3] = 4.0

// 通知主线程
parentPort.postMessage('done')
\`\`\`

> **注意**：共享内存需要配合 \`Atomics\` API 使用来保证原子操作，否则可能产生竞态条件。

---

## 五、worker_threads 线程池

### 5.1 为什么需要线程池

频繁创建/销毁 Worker 有开销，线程池可以复用 Worker，提高性能：

\`\`\`javascript
const { Worker } = require('worker_threads')
const path = require('path')

class WorkerPool {
  constructor(workerFile, poolSize = 4) {
    this.workerFile = workerFile
    this.poolSize = poolSize
    this.workers = []
    this.freeWorkers = []
    this.queue = []
    this.workerId = 0
    
    for (let i = 0; i < poolSize; i++) {
      this.addWorker()
    }
  }

  addWorker() {
    const worker = new Worker(this.workerFile)
    worker.id = ++this.workerId
    worker.busy = false

    worker.on('message', (result) => {
      worker.busy = false
      this.freeWorkers.push(worker)
      
      if (worker.currentResolve) {
        worker.currentResolve(result)
        worker.currentResolve = null
      }
      
      this.processQueue()
    })

    worker.on('error', (err) => {
      console.error(\`Worker \${worker.id} 出错:\`, err)
      // 移除并重新创建
      this.workers = this.workers.filter(w => w !== worker)
      this.freeWorkers = this.freeWorkers.filter(w => w !== worker)
      this.addWorker()
    })

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.warn(\`Worker \${worker.id} 异常退出，退出码: \${code}\`)
      }
    })

    this.workers.push(worker)
    this.freeWorkers.push(worker)
  }

  async run(data) {
    return new Promise((resolve, reject) => {
      const runTask = (worker) => {
        worker.busy = true
        worker.currentResolve = resolve
        worker.currentReject = reject
        worker.postMessage(data)
      }

      if (this.freeWorkers.length > 0) {
        const worker = this.freeWorkers.pop()
        runTask(worker)
      } else {
        this.queue.push({ data, resolve, reject })
      }
    })
  }

  processQueue() {
    while (this.queue.length > 0 && this.freeWorkers.length > 0) {
      const { data, resolve, reject } = this.queue.shift()
      const worker = this.freeWorkers.pop()
      runTask(worker)
      
      function runTask(worker) {
        worker.busy = true
        worker.currentResolve = resolve
        worker.currentReject = reject
        worker.postMessage(data)
      }
    }
  }

  destroy() {
    this.workers.forEach(w => w.terminate())
    this.workers = []
    this.freeWorkers = []
  }
}

module.exports = WorkerPool
\`\`\`

### 5.2 使用线程池执行并行任务

\`\`\`javascript
const WorkerPool = require('./worker-pool')

// 创建线程池
const pool = new WorkerPool('./compute-worker.js', 4)

async function parallelCompute() {
  // 8 个计算任务，4 个线程并行
  const tasks = Array(8).fill(0).map((_, i) => ({
    id: i,
    n: 1e8 + i * 1e7
  }))

  const startTime = Date.now()
  
  // 并行执行
  const results = await Promise.all(
    tasks.map(task => pool.run(task))
  )

  console.log(\`总耗时: \${Date.now() - startTime}ms\`)
  console.log('结果:', results)
  
  pool.destroy()
}

parallelCompute()
\`\`\`

---

## 六、Agent 系统中的实战应用

### 6.1 用 Worker Threads 并行执行多个 Agent

\`\`\`javascript
const { Worker } = require('worker_threads')
const path = require('path')

// agent-worker.js 会在子线程中运行
// 每个 Worker 独立调用 LLM，不阻塞主线程

class ParallelAgentRunner {
  constructor(maxWorkers = 4) {
    this.maxWorkers = maxWorkers
  }

  // 并行运行多个 Agent
  async runAgents(agents) {
    const results = await Promise.all(
      agents.map(agentConfig => this.runSingleAgent(agentConfig))
    )
    return results
  }

  runSingleAgent(config) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'agent-worker.js'), {
        workerData: config
      })

      worker.on('message', (result) => resolve(result))
      worker.on('error', reject)
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(\`Agent Worker 退出码: \${code}\`))
      })
    })
  }
}

// 使用：并行运行 PM、Coder、Reviewer 三个 Agent
const runner = new ParallelAgentRunner()

const agents = [
  { name: 'PM', role: '分析需求并拆分任务', input: '开发一个待办应用' },
  { name: 'Coder', role: '编写代码', input: '实现核心功能' },
  { name: 'Reviewer', role: '代码审查', input: '检查代码质量' }
]

const results = await runner.runAgents(agents)
// 三个 Agent 并行执行，总耗时约等于最慢的一个
\`\`\`

### 6.2 用 Worker 处理向量计算（RAG 场景）

RAG 系统中，对大量文档进行向量化计算是 CPU 密集任务：

\`\`\`javascript
// embedding-worker.js（子线程）
const { parentPort, workerData } = require('worker_threads')
const { pipeline } = require('@xenova/transformers')  // 本地模型

async function generateEmbeddings() {
  const { documents, model } = workerData
  
  // 加载模型（在子线程中，不阻塞主线程）
  const extractor = await pipeline('feature-extraction', model)
  
  const embeddings = []
  for (const doc of documents) {
    const embedding = await extractor(doc, { pooling: 'mean', normalize: true })
    embeddings.push({
      text: doc,
      vector: Array.from(embedding.data)
    })
  }
  
  parentPort.postMessage(embeddings)
}

generateEmbeddings()
\`\`\`

\`\`\`javascript
// 主线程
const { Worker } = require('worker_threads')

async function batchEmbeddings(documents, batchSize = 100) {
  // 将文档分块，每块用单独的 Worker 处理
  const batches = []
  for (let i = 0; i < documents.length; i += batchSize) {
    batches.push(documents.slice(i, i + batchSize))
  }

  const results = await Promise.all(
    batches.map(batch => 
      new Promise((resolve, reject) => {
        const worker = new Worker('./embedding-worker.js', {
          workerData: {
            documents: batch,
            model: 'Xenova/all-MiniLM-L6-v2'
          }
        })
        worker.on('message', resolve)
        worker.on('error', reject)
      })
    )
  )

  // 合并结果
  return results.flat()
}

// 使用
const docs = ['文档1内容...', '文档2内容...', /* ... 1000 个文档 */]
const embeddings = await batchEmbeddings(docs)
\`\`\`

### 6.3 用 child_process 执行代码沙箱

Agent 需要执行用户提交的代码时，用子进程隔离更安全：

\`\`\`javascript
const { fork } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

class CodeSandbox {
  constructor(options = {}) {
    this.timeout = options.timeout || 10000  // 默认 10 秒超时
    this.memoryLimit = options.memoryLimit || 256  // MB
  }

  async execute(code, input = '') {
    // 1. 将代码写入临时文件
    const tmpFile = path.join(os.tmpdir(), \`sandbox-\${Date.now()}.js\`)
    fs.writeFileSync(tmpFile, code)

    // 2. fork 子进程执行，限制资源和超时
    const child = fork(tmpFile, [], {
      execArgv: [
        \`--max-old-space-size=\${this.memoryLimit}\`,
        '--no-warnings'
      ],
      env: {
        ...process.env,
        SANDBOX_INPUT: input
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => stdout += chunk)
    child.stderr.on('data', (chunk) => stderr += chunk)

    // 超时控制
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      setTimeout(() => {
        if (!child.killed) child.kill('SIGKILL')
      }, 1000)
    }, this.timeout)

    return new Promise((resolve) => {
      child.on('close', (code) => {
        clearTimeout(timer)
        // 清理临时文件
        fs.unlinkSync(tmpFile)

        resolve({
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code,
          timedOut: code === null  // 被 kill 时 code 为 null
        })
      })
    })
  }
}

// 使用
const sandbox = new CodeSandbox({ timeout: 5000 })

const result = await sandbox.execute(\`
  const input = process.env.SANDBOX_INPUT
  console.log('输入:', input)
  console.log('计算结果:', input.length * 2)
\`, 'Hello Agent')

console.log(result)
// { success: true, stdout: '输入: Hello Agent\\n计算结果: 22', ... }
\`\`\`

### 6.4 混合架构：child_process + worker_threads

在实际 Agent 系统中，可以混合使用两者：

\`\`\`javascript
// 架构设计：
// 主进程 → Worker Pool（CPU 密集：向量计算、并行 Agent）
//        → child_process（代码执行沙箱、外部命令调用）

class AgentExecutionEngine {
  constructor() {
    // Worker 池：处理 CPU 密集任务
    this.workerPool = new WorkerPool('./agent-worker.js', 4)
    
    // 代码沙箱：隔离执行用户代码
    this.sandbox = new CodeSandbox({ timeout: 10000 })
  }

  async executeAgent(agentConfig) {
    // LLM 推理交给 Worker（CPU + I/O 混合）
    const llmResult = await this.workerPool.run({
      type: 'llm_call',
      config: agentConfig
    })

    // 如果 Agent 需要执行代码，交给子进程（隔离更安全）
    if (llmResult.action === 'execute_code') {
      const codeResult = await this.sandbox.execute(llmResult.code)
      return { ...llmResult, codeExecution: codeResult }
    }

    return llmResult
  }

  // 并行向量化（Worker Threads）
  async vectorizeDocuments(docs) {
    return this.workerPool.run({
      type: 'embed',
      documents: docs
    })
  }

  // 执行外部工具（child_process）
  async runExternalTool(toolName, args) {
    return new Promise((resolve, reject) => {
      const child = fork('./tool-runner.js', [toolName, ...args])
      child.on('message', resolve)
      child.on('error', reject)
    })
  }
}
\`\`\`

---

## 七、综合实战练习

### 练习 1：对比单线程 vs Worker Threads 计算性能

\`\`\`javascript
// compare.js - 主线程
const { Worker } = require('worker_threads')

// CPU 密集计算
function heavyCompute(n) {
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += Math.sqrt(i) * Math.sin(i)
  }
  return sum
}

async function main() {
  const N = 5e8
  const parallelTasks = 4

  // 方式一：主线程串行执行
  console.log('--- 主线程串行 ---')
  const start1 = Date.now()
  for (let i = 0; i < parallelTasks; i++) {
    heavyCompute(N)
  }
  console.log(\`串行耗时: \${Date.now() - start1}ms\`)

  // 方式二：Worker 并行执行
  console.log('--- Worker 并行 ---')
  const start2 = Date.now()
  await Promise.all(
    Array(parallelTasks).fill(0).map(() => 
      new Promise((resolve, reject) => {
        const worker = new Worker('./compute-worker.js', {
          workerData: { n: N }
        })
        worker.on('message', resolve)
        worker.on('error', reject)
      })
    )
  )
  console.log(\`并行耗时: \${Date.now() - start2}ms\`)
}

main()
\`\`\`

\`\`\`javascript
// compute-worker.js
const { parentPort, workerData } = require('worker_threads')

let sum = 0
for (let i = 0; i < workerData.n; i++) {
  sum += Math.sqrt(i) * Math.sin(i)
}
parentPort.postMessage(sum)
\`\`\`

### 练习 2：实现可取消的 Worker 任务

\`\`\`javascript
const { Worker } = require('worker_threads')
const { AbortController } = require('abort-controller')

function runCancellableWorker(workerFile, data, signal) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFile, { workerData: data })

    const onAbort = () => {
      worker.terminate()
      reject(new Error('任务被取消'))
    }

    if (signal) {
      if (signal.aborted) {
        onAbort()
        return
      }
      signal.addEventListener('abort', onAbort)
    }

    worker.on('message', (result) => {
      if (signal) signal.removeEventListener('abort', onAbort)
      resolve(result)
    })

    worker.on('error', (err) => {
      if (signal) signal.removeEventListener('abort', onAbort)
      reject(err)
    })
  })
}

// 使用：5 秒后取消
const controller = new AbortController()
setTimeout(() => controller.abort(), 5000)

try {
  const result = await runCancellableWorker(
    './long-running-worker.js',
    { data: '...' },
    controller.signal
  )
  console.log('完成:', result)
} catch (err) {
  console.log('取消或失败:', err.message)
}
\`\`\`

### 练习 3：用 fork 实现 Agent 任务分发

\`\`\`javascript
// master.js - 任务分发主进程
const { fork } = require('child_process')

const agents = [
  { name: 'Researcher', task: '搜索 AI Agent 最新进展' },
  { name: 'Writer', task: '撰写技术博客' },
  { name: 'Reviewer', task: '审查文章质量' }
]

// 并行 fork 多个 Agent
const promises = agents.map(agent => {
  return new Promise((resolve, reject) => {
    const child = fork('./agent-fork-worker.js')
    
    child.send({ type: 'execute', agent })
    
    child.on('message', (msg) => {
      if (msg.type === 'done') {
        resolve(msg.result)
        child.kill()
      }
    })
    
    child.on('error', reject)
  })
})

const results = await Promise.all(promises)
console.log('所有 Agent 完成:', results)
\`\`\`

---

## 八、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| child_process | 创建操作系统子进程，适合外部命令、代码隔离 |
| exec / execFile | 缓冲式执行，有 maxBuffer 限制 |
| spawn | 流式执行，无 maxBuffer 限制 |
| fork | spawn 特例，自带 IPC，适合 Node.js 进程通信 |
| worker_threads | 进程内多线程，共享内存，适合 CPU 密集计算 |
| Worker | 工作线程类 |
| parentPort | 子线程与主线程通信的端口 |
| workerData | 主线程传给子线程的初始数据 |
| MessageChannel | 双向通信通道 |
| SharedArrayBuffer | 多线程共享内存 |
| 进程池/线程池 | 复用进程/线程，减少创建开销 |

### 关键收获

1. **child_process vs worker_threads**：进程隔离强但开销大，线程开销小但隔离弱
2. **exec vs spawn**：exec 缓冲输出有 maxBuffer 限制，spawn 流式无限制
3. **fork 的 IPC**：自带 message 通道，适合 Node.js 进程间结构化通信
4. **Worker 通信**：通过 parentPort.postMessage / on('message') 传递消息
5. **SharedArrayBuffer**：多线程共享内存，大数据场景避免拷贝，需配合 Atomics
6. **线程池/进程池**：复用 Worker/进程，避免频繁创建开销
7. **Agent 架构**：child_process 做代码沙箱，worker_threads 做并行计算

### 与 AI Agent 的关联

child_process 和 worker_threads 在 Agent 开发中的核心应用：

- **代码执行沙箱**：用 child_process 隔离执行用户提交的代码，崩溃不影响主进程
- **并行 Agent 任务**：用 worker_threads 并行运行多个 Agent，突破单线程限制
- **向量计算**：RAG 系统中批量 Embedding 计算交给 Worker，不阻塞 LLM 流式响应
- **外部工具调用**：用 child_process 调用 Python 脚本、系统命令等外部工具
- **混合架构**：主进程调度 → Worker 做 CPU 密集 → child_process 做隔离执行

---

## 九、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| Node.js 中文网 - child_process 子进程 | http://nodejs.cn/api/child_process.html | 官方文档中文版，权威完整（v26） |
| Node.js 中文网 - worker_threads 工作线程 | http://nodejs.cn/api/worker_threads.html | 官方文档中文版，含完整 API |
| 菜鸟教程 - child_process 模块 | https://www.runoob.com/nodejs/nodejs-child_process-module.html | 入门友好，快速上手 |
| 菜鸟教程 - worker_threads 模块 | https://www.runoob.com/nodejs/nodejs-worker_threads-module.html | 入门友好，含示例 |
| 掘金 - child_process 全面指南 | https://juejin.cn/post/7357554457913966627 | 子进程管理与通信详解 |
| CSDN - Worker Threads 实战线程池 | https://blog.csdn.net/qq_34803115/article/details/162695327 | CPU 密集型线程池实战 |

> **提示**：Node.js 中文网（nodejs.cn）的 child_process 和 worker_threads 文档是最权威的中文资源，覆盖所有 API 和高级用法。

---

## 十、明日预告

**Day 9：Node.js HTTP/HTTPS**

- HTTP 服务器与客户端：\`http.createServer\`、\`http.request\`
- HTTPS 与 TLS 证书
- 调用 LLM API 的底层基础：HTTP 请求构建、流式响应接收
- Agent API 服务搭建

HTTP 是 Agent 与 LLM 通信的底层协议——每一次 LLM 调用本质上都是一个 HTTP 请求。掌握 Node.js HTTP 模块，是理解后续 OpenAI SDK、LangChain.js 底层网络通信的关键。

---

> 🚀 Day 8 完成！child_process 和 worker_threads 是 Node.js 突破单线程限制的两把利器。掌握它们，你就拥有了构建高性能并行 Agent 系统的能力！

    `.trim(),
  },
  {
    id: '9',
    title: `AI Agent 学习计划 Day 7：Node.js Event Emitter（事件触发器）`,
    slug: 'ai-agent-day7-nodejs-event-emitter',
    date: '2026-07-08',
    tags: ['Node.js', 'AI Agent', '学习笔记'],
    excerpt: `AI Agent 84 天学习计划第七天。系统学习 Node.js Event Emitter：发布-订阅模式、核心 API（on/emit/once/off）、错误事件处理、异步监听器、events.once/events.on Promise 化、内存泄漏防范、自定义 EventEmitter 类，并实现事件驱动的多 Agent 协作系统（事件总线、生命周期事件、松耦合架构）。`,
    readingTime: 30,
    content: `# AI Agent 学习计划 Day 7：Node.js Event Emitter（事件触发器）

> 📅 日期：2026-07-08  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 7 / 84（8.3%）

## 前言

Day 6 我们深入了事件循环（Event Loop），理解了「异步回调何时被执行」。今天进入 Node.js 异步编程的另一半拼图——**Event Emitter（事件触发器）**，解决的是「如何注册和触发事件」。

如果说事件循环是 Node.js 的「心脏」，负责调度异步任务的执行时机；那么 EventEmitter 就是 Node.js 的「神经系统」，负责在模块之间传递信号。Node.js 几乎所有核心模块（\`http\`、\`stream\`、\`fs\`、\`net\`）都继承自 \`EventEmitter\`——\`http.Server\` 在收到请求时触发 \`request\` 事件，\`stream.Readable\` 在有数据可读时触发 \`data\` 事件。

在 AI Agent 开发中，EventEmitter 是构建**事件驱动架构（EDA）**的基石：Agent 的「思考开始」「工具调用」「思考结束」都可以抽象为事件；多个 Agent 之间可以通过事件总线（Event Bus）解耦通信。本文将从 EventEmitter 基础 API 讲起，逐步深入错误处理、异步监听器、内存泄漏防范，最终落地到事件驱动的 Agent 系统设计。

---

## 一、EventEmitter 基础概念

### 1.1 什么是 EventEmitter

\`EventEmitter\` 是 Node.js \`events\` 模块提供的核心类，实现了经典的**发布-订阅模式（Pub/Sub）**：一个对象（发布者）在状态变化时触发事件，其他对象（订阅者）通过注册监听器来响应这些事件。

\`\`\`javascript
const EventEmitter = require('events')

// 创建一个事件触发器实例
const emitter = new EventEmitter()

// 订阅事件：注册监听器
emitter.on('greeting', (name) => {
  console.log(\`你好，\${name}！\`)
})

// 发布事件：触发监听器
emitter.emit('greeting', 'AI Agent')
// 输出：你好，AI Agent！
\`\`\`

### 1.2 核心三要素

| 要素 | 说明 | 对应 API |
|------|------|----------|
| **事件名（Event Name）** | 字符串，标识一个事件 | 任意字符串，但 \`'error'\` 有特殊语义 |
| **监听器（Listener）** | 事件触发时执行的回调函数 | \`on()\` 注册 |
| **触发（Emit）** | 通知所有监听器事件已发生 | \`emit()\` 调用 |

### 1.3 为什么 Node.js 选择事件驱动

Node.js 的设计哲学是「单线程 + 非阻塞 I/O + 事件驱动」。当网络请求到达、文件读取完成、定时器到期时，系统会以「事件」的形式通知 Node.js。EventEmitter 提供了统一的接口来处理这些通知，避免了回调地狱，实现模块间松耦合。

---

## 二、核心 API 详解

### 2.1 on / addListener：注册监听器

\`on\` 是 \`addListener\` 的别名，两者完全等价。监听器按注册顺序依次调用。

\`\`\`javascript
const emitter = new EventEmitter()

emitter.on('event', () => console.log('第一个监听器'))
emitter.on('event', () => console.log('第二个监听器'))
emitter.addListener('event', () => console.log('第三个监听器'))

emitter.emit('event')
// 第一个监听器
// 第二个监听器
// 第三个监听器
\`\`\`

### 2.2 once：只触发一次的监听器

\`once\` 注册的监听器在第一次触发后自动移除，适合「一次性初始化」场景。

\`\`\`javascript
const emitter = new EventEmitter()

let callCount = 0
emitter.once('init', () => {
  callCount++
  console.log(\`初始化执行，第 \${callCount} 次\`)
})

emitter.emit('init')  // 初始化执行，第 1 次
emitter.emit('init')  // （无输出，监听器已被移除）
emitter.emit('init')  // （无输出）
\`\`\`

### 2.3 emit：触发事件

\`emit\` 按注册顺序同步调用所有监听器，返回 \`true\` 表示有监听器被调用，\`false\` 表示该事件没有任何监听器。

\`\`\`javascript
const emitter = new EventEmitter()
emitter.on('data', (chunk) => console.log('收到:', chunk))

console.log(emitter.emit('data', 'hello'))  // true
console.log(emitter.emit('nope'))           // false
\`\`\`

> **关键点**：监听器是**同步执行**的。\`emit()\` 会阻塞，直到所有监听器执行完毕才返回。

### 2.4 off / removeListener：移除监听器

\`off\` 是 \`removeListener\` 的别名。移除时必须传入**同一个函数引用**。

\`\`\`javascript
const emitter = new EventEmitter()

function listener(name) {
  console.log(\`欢迎 \${name}\`)
}

emitter.on('welcome', listener)
emitter.emit('welcome', 'Alice')  // 欢迎 Alice

// ✅ 传入同一个引用才能移除
emitter.off('welcome', listener)
emitter.emit('welcome', 'Bob')    // （无输出）

// ❌ 传入匿名函数无法移除
emitter.on('welcome', () => console.log('匿名'))
// 没有引用，无法 removeListener
\`\`\`

### 2.5 removeAllListeners：移除所有监听器

\`\`\`javascript
const emitter = new EventEmitter()
emitter.on('a', () => console.log('a1'))
emitter.on('a', () => console.log('a2'))
emitter.on('b', () => console.log('b1'))

emitter.removeAllListeners('a')  // 只移除 'a' 事件的所有监听器
emitter.removeAllListeners()      // 移除所有事件的所有监听器（危险！）
\`\`\`

### 2.6 完整 API 速查表

| 方法 | 说明 |
|------|------|
| \`on(event, listener)\` | 注册监听器，每次触发都执行 |
| \`once(event, listener)\` | 注册一次性监听器 |
| \`off(event, listener)\` | 移除指定监听器 |
| \`removeListener(event, listener)\` | \`off\` 的别名 |
| \`removeAllListeners([event])\` | 移除某事件或全部监听器 |
| \`emit(event, ...args)\` | 触发事件，同步调用监听器 |
| \`listeners(event)\` | 返回监听器数组副本 |
| \`rawListeners(event)\` | 返回监听器数组（含 once 包装） |
| \`listenerCount(event)\` | 返回监听器数量 |
| \`setMaxListeners(n)\` | 设置最大监听器数（默认 10） |
| \`getMaxListeners()\` | 获取最大监听器数 |
| \`prependListener(event, listener)\` | 在最前面插入监听器 |
| \`prependOnceListener(event, listener)\` | 在最前面插入一次性监听器 |

---

## 三、this 指向与箭头函数

### 3.1 普通函数：this 指向 emitter 实例

\`\`\`javascript
const emitter = new EventEmitter()

emitter.on('event', function () {
  console.log(this === emitter)  // true
})
emitter.emit('event')
\`\`\`

### 3.2 箭头函数：this 继承自外层作用域

\`\`\`javascript
const emitter = new EventEmitter()

class Agent {
  constructor() {
    this.name = 'Agent-1'
    // ❌ 用普通函数：this 指向 emitter，拿不到 this.name
    // emitter.on('task', function () {
    //   console.log(this.name)  // undefined
    // })

    // ✅ 用箭头函数：this 继承 Agent 实例
    emitter.on('task', () => {
      console.log(\`\${this.name} 收到任务\`)
    })
  }
}

const agent = new Agent()
emitter.emit('task')  // Agent-1 收到任务
\`\`\`

> **最佳实践**：当监听器需要访问 \`emitter\` 实例时用普通函数；当需要访问外层 \`this\`（如类实例）时用箭头函数。

---

## 四、错误事件处理

### 4.1 error 事件的特殊性

当 \`emit('error')\` 触发时，如果没有注册 \`'error'\` 监听器，Node.js 会认为这是未捕获的错误，**直接抛出并崩溃进程**。

\`\`\`javascript
const emitter = new EventEmitter()

// ❌ 没有注册 error 监听器
emitter.emit('error', new Error('出错了'))
// 抛出：Error:出错了
// 进程崩溃！
\`\`\`

### 4.2 正确的错误处理

\`\`\`javascript
const emitter = new EventEmitter()

// ✅ 注册 error 监听器
emitter.on('error', (err) => {
  console.error('捕获到错误:', err.message)
})

emitter.emit('error', new Error('出错了'))
// 捕获到错误: 出错了
// 进程不崩溃
\`\`\`

### 4.3 全局兜底：captureRejections

当监听器是 \`async\` 函数时，如果它抛出错误或返回 rejected Promise，默认行为是触发 \`error\` 事件。开启 \`captureRejections\` 选项可自动处理：

\`\`\`javascript
const emitter = new EventEmitter({ captureRejections: true })

emitter.on('asyncTask', async (task) => {
  if (task === 'bad') {
    throw new Error('任务失败')
  }
  return '成功'
})

// 当 async 监听器 reject 时，自动触发 'error' 事件
emitter.on('error', (err) => {
  console.error('异步监听器失败:', err.message)
})

emitter.emit('asyncTask', 'bad')  // 异步监听器失败: 任务失败
\`\`\`

---

## 五、异步监听器与 await emit

### 5.1 emit 是同步的

\`emit()\` 不会等待 \`async\` 监听器完成：

\`\`\`javascript
const emitter = new EventEmitter()

emitter.on('process', async (data) => {
  await new Promise(r => setTimeout(r, 100))
  console.log('处理完成:', data)
})

console.log('1. 触发前')
emitter.emit('process', 'hello')  // 不会等待
console.log('2. 触发后')

// 输出：
// 1. 触发前
// 2. 触发后
// 处理完成: hello  （100ms 后）
\`\`\`

### 5.2 events.once：Promise 化等待事件

\`events.once(emitter, event)\` 返回一个 Promise，在事件首次触发时 resolve：

\`\`\`javascript
const { once } = require('events')

const emitter = new EventEmitter()

// 异步等待事件
async function waitForEvent() {
  console.log('等待事件...')
  const [data] = await once(emitter, 'ready')
  console.log('收到事件:', data)
}

waitForEvent()

setTimeout(() => {
  emitter.emit('ready', { status: 'ok' })
}, 500)
// 等待事件...
// （500ms 后）收到事件: { status: 'ok' }
\`\`\`

### 5.3 events.on：异步迭代事件流

\`events.on(emitter, event)\` 返回一个 AsyncIterator，可以用 \`for await...of\` 持续消费事件：

\`\`\`javascript
const { on } = require('events')

const emitter = new EventEmitter()

async function consumeEvents() {
  for await (const [data] of on(emitter, 'message')) {
    console.log('收到消息:', data)
    if (data === 'end') break
  }
  console.log('事件流结束')
}

consumeEvents()

emitter.emit('message', '第一条')
emitter.emit('message', '第二条')
emitter.emit('message', 'end')
// 收到消息: 第一条
// 收到消息: 第二条
// 收到消息: end
// 事件流结束
\`\`\`

> 这个模式非常适合处理 LLM 的流式消息：每收到一个 token 就 emit 一个 \`message\` 事件，消费者用 \`for await...of\` 逐条处理。

---

## 六、监听器数量与内存泄漏防范

### 6.1 最大监听器警告

默认情况下，单个事件最多允许 10 个监听器。超过时会打印警告：

\`\`\`
MaxListenersExceededWarning: Possible EventEmitter memory leak detected.
11 event listeners added. Use emitter.setMaxListeners() to increase limit.
\`\`\`

这通常是**内存泄漏**的信号——在循环中反复 \`on()\` 却忘了 \`off()\`。

### 6.2 设置最大监听器

\`\`\`javascript
const emitter = new EventEmitter()

// 方法一：实例级别
emitter.setMaxListeners(20)

// 方法二：全局级别
EventEmitter.defaultMaxListeners = 20

console.log(emitter.getMaxListeners())  // 20
\`\`\`

### 6.3 内存泄漏的常见场景

\`\`\`javascript
// ❌ 反模式：每次请求都注册监听器，从不移除
function handleRequest(req, res) {
  req.on('data', chunk => { /* ... */ })  // 每次请求新增一个，永不移除
}

// ✅ 正确：使用 once 或在完成后移除
function handleRequest(req, res) {
  const onData = chunk => { /* ... */ }
  req.on('data', onData)
  req.on('end', () => {
    req.off('data', onData)  // 处理完成后移除
  })
}
\`\`\`

---

## 七、自定义 EventEmitter 类

### 7.1 继承 EventEmitter

Node.js 的最佳实践是「继承而非组合」——让你的类直接继承 EventEmitter，这样实例既能触发事件，又能调用业务方法。

\`\`\`javascript
const EventEmitter = require('events')

class Agent extends EventEmitter {
  constructor(name) {
    super()
    this.name = name
    this.state = 'idle'
  }

  async think(task) {
    this.state = 'thinking'
    this.emit('think:start', { task, agent: this.name })

    // 模拟思考过程
    await new Promise(resolve => setTimeout(resolve, 500))
    const result = \`对「\${task}」的分析结果\`

    this.emit('think:end', { task, result })
    this.state = 'idle'
    return result
  }
}

// 使用
const agent = new Agent('Coder-Agent')

agent.on('think:start', ({ task, agent }) => {
  console.log(\`[\${agent}] 开始思考: \${task}\`)
})

agent.on('think:end', ({ task, result }) => {
  console.log(\`思考完成: \${result}\`)
})

await agent.think('优化这段代码')
// [Coder-Agent] 开始思考: 优化这段代码
// （500ms 后）思考完成: 对「优化这段代码」的分析结果
\`\`\`

### 7.2 事件命名规范

| 命名风格 | 示例 | 说明 |
|----------|------|------|
| \`命名空间:动作\` | \`tool:call\`、\`tool:result\` | 推荐分组，避免冲突 |
| \`状态:变化\` | \`state:change\`、\`state:idle\` | 适合生命周期事件 |
| \`错误\` | \`error\` | 固定名称，有特殊语义 |

---

## 八、事件驱动的 Agent 系统设计

### 8.1 事件总线（Event Bus）实现

多个 Agent 之间通过事件总线解耦通信，是事件驱动架构的核心模式：

\`\`\`javascript
const EventEmitter = require('events')

// 全局事件总线
const eventBus = new EventEmitter()
eventBus.setMaxListeners(50)  // Agent 多时调高上限

// PM Agent：接收需求，拆分任务并发布
class PMAgent {
  constructor() {
    eventBus.on('request:new', (req) => this.handle(req))
  }

  async handle(req) {
    console.log(\`[PM] 收到需求: \${req}\`)
    const tasks = await this.splitTasks(req)
    // 发布任务给 Coder Agent
    tasks.forEach(task => eventBus.emit('task:code', task))
  }

  async splitTasks(req) {
    await new Promise(r => setTimeout(r, 200))
    return ['搭建项目结构', '实现核心逻辑', '编写接口']
  }
}

// Coder Agent：监听编码任务
class CoderAgent {
  constructor() {
    eventBus.on('task:code', (task) => this.code(task))
  }

  async code(task) {
    console.log(\`[Coder] 开始编码: \${task}\`)
    await new Promise(r => setTimeout(r, 300))
    const code = \`// \${task} 的代码\`
    // 编码完成，交给 Reviewer
    eventBus.emit('task:review', code)
  }
}

// Reviewer Agent：监听审查任务
class ReviewerAgent {
  constructor() {
    eventBus.on('task:review', (code) => this.review(code))
  }

  async review(code) {
    console.log(\`[Reviewer] 审查代码: \${code.slice(0, 30)}...\`)
    await new Promise(r => setTimeout(r, 200))
    eventBus.emit('task:done', { code, approved: true })
  }
}

// 启动系统
new PMAgent()
new CoderAgent()
new ReviewerAgent()

eventBus.on('task:done', ({ approved }) => {
  console.log(approved ? '✅ 任务完成并通过审查' : '❌ 审查未通过')
})

// 触发整个流程
eventBus.emit('request:new', '开发一个待办应用')
// [PM] 收到需求: 开发一个待办应用
// [Coder] 开始编码: 搭建项目结构
// [Reviewer] 审查代码: // 搭建项目结构 的代码...
// ✅ 任务完成并通过审查
// ... 后续任务
\`\`\`

### 8.2 Agent 生命周期事件

一个完整的 Agent 运行周期可以用事件来建模：

\`\`\`javascript
class AgentRunner extends EventEmitter {
  constructor(agent) {
    super()
    this.agent = agent
  }

  async run(input) {
    this.emit('lifecycle:start', { input })

    try {
      // 1. 感知
      this.emit('perceive:start')
      const context = await this.agent.perceive(input)
      this.emit('perceive:end', { context })

      // 2. 决策
      this.emit('decide:start')
      const action = await this.agent.decide(context)
      this.emit('decide:end', { action })

      // 3. 执行
      this.emit('act:start')
      const result = await this.agent.act(action)
      this.emit('act:end', { result })

      this.emit('lifecycle:complete', { result })
      return result
    } catch (err) {
      this.emit('error', err)
      throw err
    }
  }
}

// 监听生命周期，实现日志、监控、UI 更新
const runner = new AgentRunner(myAgent)

runner.on('lifecycle:start', ({ input }) => {
  console.log(\`▶ Agent 启动，输入: \${input}\`)
})

runner.on('decide:end', ({ action }) => {
  console.log(\`🧠 决策完成: 将执行 \${action.name}\`)
  // 可以在这里更新 UI，展示 Agent 的"思考过程"
})

runner.on('act:start', () => {
  console.log('⚡ 开始执行动作...')
})

runner.on('error', (err) => {
  console.error('💥 Agent 运行出错:', err.message)
  // 上报错误到监控系统
})

await runner.run('帮我搜索天气')
\`\`\`

### 8.3 事件驱动 vs 直接调用对比

\`\`\`javascript
// ❌ 直接调用：紧耦合，难以扩展
class TightCoupledSystem {
  async run(input) {
    const result = await this.agent.think(input)
    this.logger.log(result)      // 写死日志
    this.monitor.track(result)   // 写死监控
    this.ui.update(result)       // 写死 UI
  }
  // 想加新功能（如缓存）必须修改这个类
}

// ✅ 事件驱动：松耦合，易扩展
class EventDrivenSystem {
  constructor() {
    this.emitter = new EventEmitter()
    // 各模块独立监听，互不影响
    this.emitter.on('result', r => this.logger.log(r))
    this.emitter.on('result', r => this.monitor.track(r))
    this.emitter.on('result', r => this.ui.update(r))
    // 想加缓存？只需新增监听器，无需改动核心逻辑
    this.emitter.on('result', r => this.cache.set(r))
  }

  async run(input) {
    const result = await this.agent.think(input)
    this.emitter.emit('result', result)  // 通知所有订阅者
  }
}
\`\`\`

---

## 九、综合实战练习

### 练习 1：手写迷你 EventEmitter

\`\`\`javascript
class MyEventEmitter {
  constructor() {
    this.events = new Map()
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(listener)
    return this
  }

  once(event, listener) {
    const wrapper = (...args) => {
      this.off(event, wrapper)
      listener(...args)
    }
    this.on(event, wrapper)
    return this
  }

  off(event, listener) {
    const listeners = this.events.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index !== -1) listeners.splice(index, 1)
    }
    return this
  }

  emit(event, ...args) {
    const listeners = this.events.get(event)
    if (!listeners) return false
    // 复制一份，防止遍历时被修改
    [...listeners].forEach(fn => fn(...args))
    return true
  }

  listenerCount(event) {
    return this.events.get(event)?.length || 0
  }
}

// 测试
const ee = new MyEventEmitter()
ee.on('ping', () => console.log('pong 1'))
ee.on('ping', () => console.log('pong 2'))
ee.once('ping', () => console.log('只响应一次'))
ee.emit('ping')  // pong 1, pong 2, 只响应一次
ee.emit('ping')  // pong 1, pong 2
\`\`\`

### 练习 2：LLM 流式响应事件化

\`\`\`javascript
const { EventEmitter } = require('events')

class LLMStreamer extends EventEmitter {
  async *stream(prompt) {
    const tokens = ['你', '好', '，', '我', '是', 'AI']
    for (const token of tokens) {
      await new Promise(r => setTimeout(r, 80))
      this.emit('token', token)  // 每个 token 都触发事件
      yield token
    }
    this.emit('done', { totalTokens: tokens.length })
  }
}

const streamer = new LLMStreamer()

streamer.on('token', (token) => {
  process.stdout.write(token)
})
streamer.on('done', ({ totalTokens }) => {
  console.log(\`\\n[完成，共 \${totalTokens} 个 token]\`)
})

// 消费流
for await (const token of streamer.stream('你好')) {
  // token 已通过事件输出
}
// 你好，我是AI
// [完成，共 6 个 token]
\`\`\`

### 练习 3：带超时和取消的事件等待

\`\`\`javascript
const { once } = require('events')

// 等待事件，支持超时和取消
async function waitForEventWithTimeout(emitter, event, { timeout = 5000, signal } = {}) {
  const ac = new AbortController()

  // 超时自动取消
  const timer = setTimeout(() => ac.abort(new Error('超时')), timeout)

  // 外部信号取消
  if (signal) {
    signal.addEventListener('abort', () => ac.abort(signal.reason))
  }

  try {
    const [data] = await once(emitter, event, { signal: ac.signal })
    return data
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(\`等待事件「\${event}」被取消或超时\`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// 使用
const emitter = new EventEmitter()

async function main() {
  // 5 秒内等待 'ready' 事件
  const result = await waitForEventWithTimeout(emitter, 'ready', { timeout: 5000 })
  console.log('收到:', result)
}

main().catch(console.error)

// 3 秒后触发
setTimeout(() => emitter.emit('ready', '系统就绪'), 3000)
// （3 秒后）收到: 系统就绪
\`\`\`

---

## 十、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| EventEmitter | 发布-订阅模式的核心类，所有事件对象的基类 |
| \`on\` / \`emit\` | 注册监听器 / 触发事件（同步执行） |
| \`once\` | 一次性监听器，触发后自动移除 |
| \`off\` | 移除监听器，需传入同一函数引用 |
| \`error\` 事件 | 未注册监听器时触发会崩溃进程 |
| \`captureRejections\` | 自动捕获 async 监听器的 rejection |
| \`events.once\` | Promise 化等待单次事件 |
| \`events.on\` | 异步迭代消费事件流 |
| 最大监听器 | 默认 10，超过警告，可能内存泄漏 |
| 事件总线 | 多 Agent 通过共享 EventEmitter 解耦通信 |

### 关键收获

1. **发布-订阅模式**：EventEmitter 是 Node.js 事件驱动的核心，实现了发布者与订阅者的解耦
2. **同步执行**：\`emit()\` 同步调用所有监听器，async 监听器不会被 await
3. **错误必须处理**：\`error\` 事件无监听器时进程崩溃，始终注册 error 监听器
4. **内存泄漏防范**：超过 10 个监听器会警告，循环中 on() 必须 off() 或用 once()
5. **this 指向**：普通函数 this 指向 emitter，箭头函数继承外层作用域
6. **Promise 化**：\`events.once\` 等待事件、\`events.on\` 异步迭代事件流
7. **事件驱动架构**：Agent 之间通过事件总线松耦合通信，易扩展

### 与 AI Agent 的关联

EventEmitter 在 Agent 开发中的核心应用：

- **Agent 生命周期**：\`think:start\`、\`tool:call\`、\`think:end\` 等事件驱动 UI 更新和日志记录
- **多 Agent 协作**：事件总线实现 PM→Coder→Reviewer 链式协作，松耦合易扩展
- **LLM 流式响应**：每个 token 触发 \`token\` 事件，前端逐字渲染
- **工具调用通知**：Agent 调用工具时触发事件，实现监控和审计
- **状态管理**：Agent 状态变化（idle→thinking→acting）通过事件广播

---

## 十一、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| Node.js 中文网 - Events 事件触发器 | http://nodejs.cn/api/events.html | 官方文档中文版，权威完整（v26） |
| 菜鸟教程 - Node.js EventEmitter | https://www.runoob.com/nodejs/nodejs-event.html | 入门友好，适合快速上手 |
| 掘金 - 手把手实现 EventEmitter | https://juejin.cn/post/7546901400137170954 | 从零实现，深入理解原理 |
| 知乎 - Node.js 异步编程 EventEmitter | https://zhuanlan.zhihu.com/p/1942760321849721691 | 事件驱动编程详解 |
| JavaScript中文网 - EventEmitter 使用详解 | https://www.javascriptcn.com/post/67066d01d91dce0dc85cd547 | 观察者模式实践 |
| 知乎 - EventEmitter 详解 | https://zhuanlan.zhihu.com/p/681245944 | 核心 API 全面解析 |
| 掘金 - EventEmitter 前端事件驱动 | https://juejin.cn/post/7415914023278051367 | 事件总线实现 |
| CSDN - EventEmitter 保姆级教程 | https://blog.csdn.net/weixin_42525582/article/details/161210765 | 餐厅点餐类比，实战应用 |
| W3Schools中文 - Events 事件模块 | https://www.w3schools.cn/nodejs/ref_events.html | 语法速查 |

> **提示**：Node.js 中文网（nodejs.cn）的 Events 文档是最权威的中文资源，覆盖所有 API 和高级用法。配合掘金「手把手实现 EventEmitter」文章，从原理到实践一次掌握。

---

## 十二、明日预告

**Day 8：Node.js 子进程与 Worker Threads**

- \`child_process\` 模块：\`exec\`、\`execFile\`、\`spawn\`、\`fork\`
- \`worker_threads\` 模块：真正的多线程并行
- 并行执行多 Agent 任务
- CPU 密集任务（向量计算）不阻塞主线程

Worker Threads 是 Node.js 突破单线程限制的关键，在 Agent 系统中用于并行执行多个 Agent 任务、处理向量计算等 CPU 密集场景。掌握它，你就拥有了构建高性能多 Agent 系统的能力。

---

> 🚀 Day 7 完成！EventEmitter 是 Node.js 事件驱动架构的灵魂，掌握它你就掌握了构建松耦合、可扩展 Agent 系统的核心技能。明天我们将用 Worker Threads 突破单线程限制！
`
  },
  {
    id: '7',
    title: `AI Agent 学习计划 Day 5：Node.js Stream 与 Buffer`,
    slug: 'ai-agent-day5-nodejs-stream-buffer',
    date: '2026-07-06',
    tags: ['Node.js', 'AI Agent', '学习笔记'],
    excerpt: `AI Agent 84 天学习计划第五天。系统学习 Node.js Stream 与 Buffer：四种流类型、背压机制、pipeline 现代写法、Promise API，并实现完整的 LLM 流式响应管道。`,
    readingTime: 30,
    content: `
# AI Agent 学习计划 Day 5：Node.js Stream 与 Buffer

> 📅 日期：2026-07-06  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 5 / 84（6.0%）

## 前言

前四天我们打好了 TypeScript 语言基础（类型系统、装饰器、async/await、模块系统）。从今天起进入 Node.js 核心能力的学习，第一个主题是 **Stream（流）与 Buffer（缓冲区）**。

为什么这个主题如此重要？因为在 AI Agent 开发中，**LLM 的流式响应（Streaming）几乎是一切交互的基础**。当 ChatGPT 逐字吐出回答时，后端正在用 Stream 逐块接收 OpenAI API 返回的 SSE 数据，再逐块转发给前端。掌握 Stream 与 Buffer，是理解后续 Vercel AI SDK \`streamText\`、LangChain.js 流式输出的前提。

本文将从 Buffer 基础讲起，覆盖 Stream 四大类型、背压机制、Promise API，最终落地到 LLM 流式响应的实战实现。

---

## 一、Buffer：二进制数据的容器

### 1.1 什么是 Buffer

Buffer 是 Node.js 中用于处理二进制数据的核心类，它是 \`Uint8Array\` 的子类。在 Node.js 中，凡是涉及文件读写、网络数据传输、加密计算的场景，都离不开 Buffer。

\`\`\`javascript
const buf = Buffer.from('Hello, AI Agent!', 'utf8')
console.log(buf)
// <Buffer 48 65 6c 6c 6f 2c 20 41 49 20 41 67 65 6e 74 21>
console.log(buf.length)  // 16
console.log(buf.toString('utf8'))  // Hello, Agent!
console.log(buf.toString('base64'))  // SGVsbG8sIEFJIEFnZW50IQ==
\`\`\`

### 1.2 创建 Buffer 的三种方式

\`\`\`javascript
// 1. Buffer.alloc(size[, fill]) —— 分配指定大小的 Buffer，默认用 0 填充（安全）
const safe = Buffer.alloc(10)
// <Buffer 00 00 00 00 00 00 00 00 00 00>

// 2. Buffer.allocUnsafe(size) —— 分配但不初始化（更快但可能含旧数据，不安全）
const unsafe = Buffer.allocUnsafe(10)
// <Buffer 可能是任意值>

// 3. Buffer.from(array | string | buffer) —— 从已有数据创建
const fromStr = Buffer.from('LLM Streaming', 'utf8')
const fromArr = Buffer.from([0x48, 0x49])  // "HI"
\`\`\`

> **安全提示**：\`allocUnsafe\` 不会清零内存，可能残留敏感数据。除非你有明确的性能需求且会立即填充数据，否则始终用 \`alloc\`。

### 1.3 字符编码

Buffer 支持多种编码格式，在 LLM 开发中最常用的是 \`utf8\` 和 \`base64\`：

\`\`\`javascript
const text = '你好，世界'

// UTF-8：每个中文字符占 3 字节
const utf8Buf = Buffer.from(text, 'utf8')
console.log(utf8Buf.length)  // 15（5 个字符 × 3 字节）

// Base64：编码后的字符串
const base64Str = utf8Buf.toString('base64')
console.log(base64Str)  // 5L2g5aW977yM5LiW55WM

// Hex：十六进制表示
const hexStr = utf8Buf.toString('hex')
console.log(hexStr)  // e4bda0e5a5bd...
\`\`\`

### 1.4 Buffer 常用方法

\`\`\`javascript
// concat：拼接多个 Buffer（处理分片数据的核心方法）
const chunk1 = Buffer.from('data: {"token": "Hel')
const chunk2 = Buffer.from('lo"}\\n\\n')
const full = Buffer.concat([chunk1, chunk2])
console.log(full.toString())  // data: {"token": "Hello"}\\n\\n

// slice / subarray：截取子 Buffer
const sub = full.subarray(6)  // 跳过 "data: "
console.log(sub.toString())   // {"token": "Hello"}\\n\\n

// compare：比较两个 Buffer
const a = Buffer.from('abc')
const b = Buffer.from('abd')
console.log(Buffer.compare(a, b))  // -1（a < b）

// isBuffer：类型判断
console.log(Buffer.isBuffer(a))  // true
\`\`\`

### 1.5 Agent 场景：拼接 LLM 分片响应

LLM 流式响应返回的是一个个 chunk，每个 chunk 可能是不完整的 JSON。你需要用 \`Buffer.concat\` 来安全拼接：

\`\`\`javascript
const chunks = []

stream.on('data', (chunk) => {
  chunks.push(chunk)
})

stream.on('end', () => {
  // 安全拼接所有分片，避免字符串拼接的编码问题
  const fullData = Buffer.concat(chunks).toString('utf8')
  const response = JSON.parse(fullData)
  console.log(response.choices[0].message.content)
})
\`\`\`

---

## 二、Stream 四大类型

Stream 是 Node.js 中处理流式数据的抽象接口。与一次性读取整个文件到内存不同，Stream 逐块（chunk）处理数据，内存占用恒定，特别适合处理大文件和网络流。

### 2.1 四种基本流类型

| 类型 | 方向 | 典型示例 | 说明 |
|------|------|---------|------|
| **Readable** | 只读 | \`fs.createReadStream()\`、HTTP 请求体 | 数据的来源 |
| **Writable** | 只写 | \`fs.createWriteStream()\`、\`process.stdout\`、HTTP 响应体 | 数据的去向 |
| **Duplex** | 可读+可写 | \`net.Socket\` | 双向通道，读写独立 |
| **Transform** | 读入→变换→写出 | \`zlib.createGzip()\` | 在读写之间做转换 |

### 2.2 Readable Stream（可读流）

\`\`\`javascript
const fs = require('node:fs')

const readable = fs.createReadStream('./large-file.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024  // 每次读取 64KB
})

// 两种读取模式
// 模式一：暂停模式（默认）—— 需要手动 read()
readable.on('readable', () => {
  let chunk
  while ((chunk = readable.read()) !== null) {
    console.log(\`读取到 \${chunk.length} 字符\`)
  }
})

// 模式二：流动模式 —— 自动推送数据
readable.on('data', (chunk) => {
  console.log(\`接收到: \${chunk.length} 字符\`)
})

readable.on('end', () => {
  console.log('读取完成')
})

readable.on('error', (err) => {
  console.error('出错了:', err)
})
\`\`\`

### 2.3 Writable Stream（可写流）

\`\`\`javascript
const fs = require('node:fs')

const writable = fs.createWriteStream('./output.txt')

writable.write('第一行数据\\n')
writable.write('第二行数据\\n')
writable.end('最后一行\\n')  // end() 后不能再 write()

writable.on('finish', () => {
  console.log('写入完成')
})

writable.on('error', (err) => {
  console.error('写入出错:', err)
})
\`\`\`

### 2.4 Duplex Stream（双工流）

双工流同时可读可写，且读写互不影响（两个独立的缓冲区）：

\`\`\`javascript
const { Duplex } = require('node:stream')

// 自定义双工流：读端发送随机数据，写端转为大写
const myDuplex = new Duplex({
  write(chunk, encoding, callback) {
    console.log('写入:', chunk.toString().toUpperCase())
    callback()
  },
  read(size) {
    this.push(\`随机数据 \${Math.random().toFixed(2)}\\n\`)
    if (Math.random() > 0.8) this.push(null)  // 停止读取
  }
})
\`\`\`

### 2.5 Transform Stream（转换流）⭐ 重点

Transform 流是 Duplex 的特例——**写入的数据经过变换后从读端输出**。这是处理 LLM 流式响应的核心工具。

\`\`\`javascript
const { Transform } = require('node:stream')

// 自定义 Transform：将文本转为大写
const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    // chunk 是输入数据，push 是输出数据
    this.push(chunk.toString().toUpperCase())
    callback()
  }
})

// 配合 pipe 使用
process.stdin.pipe(upperCase).pipe(process.stdout)
// 输入 "hello" → 输出 "HELLO"
\`\`\`

---

## 三、pipe 与 pipeline

### 3.1 pipe()：基础管道

\`pipe()\` 将可读流连接到可写流，数据自动流动：

\`\`\`javascript
const fs = require('node:fs')
const zlib = require('node:zlib')

// 经典管道：读取文件 → Gzip 压缩 → 写入文件
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'))
\`\`\`

> **pipe() 的缺陷**：如果某个环节出错，pipe 不会自动销毁其他流，可能导致内存泄漏和资源未释放。

### 3.2 pipeline()：现代推荐写法 ⭐

\`pipeline()\` 自动处理错误传播和资源清理，是现代 Node.js 的推荐方式：

\`\`\`javascript
const { pipeline } = require('node:stream')
const fs = require('node:fs')
const zlib = require('node:zlib')

// 回调写法
pipeline(
  fs.createReadStream('input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('input.txt.gz'),
  (err) => {
    if (err) {
      console.error('管道失败:', err)
    } else {
      console.log('管道成功完成')
    }
  }
)
\`\`\`

### 3.3 Stream Promise API

\`stream/promises\` 模块提供了返回 Promise 的 \`pipeline\` 和 \`finished\`，可以配合 async/await 使用：

\`\`\`javascript
const { pipeline } = require('node:stream/promises')
const { createReadStream, createWriteStream } = require('node:fs')
const { createGzip } = require('node:zlib')

async function compressFile(input, output) {
  await pipeline(
    createReadStream(input),
    createGzip(),
    createWriteStream(output)
  )
  console.log('压缩完成！')
}

compressFile('input.txt', 'input.txt.gz').catch(console.error)
\`\`\`

### 3.4 pipeline + AbortSignal：可取消的流

\`\`\`javascript
const { pipeline } = require('node:stream/promises')
const controller = new AbortController()

// 5 秒后取消
setTimeout(() => controller.abort(), 5000)

await pipeline(
  fetch('https://api.openai.com/v1/...', { signal: controller.signal }),
  async function* (source) {
    for await (const chunk of source) {
      yield chunk
    }
  },
  process.stdout,
  { signal: controller.signal }
)
\`\`\`

---

## 四、背压机制（Backpressure）

### 4.1 什么是背压

当数据生产速度 > 消费速度时，数据会在内存中堆积。**背压**就是流用来应对这种情况的机制。

- 可读流有一个 \`highWaterMark\`（水位线），默认 64KB
- 当缓冲区数据超过水位线，流会暂停读取，触发 \`pause\`
- 当消费端消化完数据，缓冲区降到水位线以下，触发 \`drain\` 事件恢复流动

### 4.2 背压实战演示

\`\`\`javascript
const { Readable, Writable } = require('node:stream')

// 高速可读流：每毫秒产出一个数据
const fastReadable = new Readable({
  highWaterMark: 10,  // 水位线设小一点，更容易触发背压
  read() {
    this.push(\`data-\${Date.now()}\\n\`)
  }
})

// 慢速可写流：每 100ms 消费一个数据
const slowWritable = new Writable({
  write(chunk, encoding, callback) {
    setTimeout(() => {
      console.log('消费:', chunk.toString().trim())
      callback()
    }, 100)
  }
})

// 用 pipe 自动处理背压
fastReadable.pipe(slowWritable)

// 如果手动 write，必须检查返回值
// const canContinue = writable.write(chunk)
// if (!canContinue) {
//   readable.pause()  // 暂停读取
//   writable.once('drain', () => {
//     readable.resume()  // 恢复读取
//   })
// }
\`\`\`

### 4.3 Agent 中的背压场景

\`\`\`javascript
// LLM 产出速度 > 前端消费速度时的背压处理
const llmStream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: '写一篇长文' }],
  stream: true
})

const responseTransform = new Transform({
  transform(chunk, encoding, callback) {
    // 解析 SSE 数据
    const lines = chunk.toString().split('\\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          this.push(null)
          return
        }
        const json = JSON.parse(data)
        const token = json.choices[0]?.delta?.content || ''
        if (token) {
          // push 返回 false 表示背压，pipeline 会自动暂停上游
          this.push(token)
        }
      }
    }
    callback()
  }
})

// pipeline 自动处理背压，无需手动 pause/resume
await pipeline(
  llmStream,
  responseTransform,
  httpResponse  // 慢速的 HTTP 响应
)
\`\`\`

---

## 五、实战：模拟 LLM 流式响应

### 5.1 完整的 SSE 流式响应管道

下面用学过的知识实现一个完整的 LLM 流式响应模拟：

\`\`\`javascript
const { Readable, Transform, pipeline } = require('node:stream')
const http = require('node:http')

// 1. 模拟 LLM 逐字产出
function createLLMStream(text) {
  const tokens = text.split('')  // 逐字拆分
  let index = 0

  return new Readable({
    read() {
      if (index < tokens.length) {
        const token = tokens[index++]
        // 用 SSE 格式包装
        const sseData = \`data: \${JSON.stringify({
          choices: [{ delta: { content: token } }]
        })}\\n\\n\`
        this.push(sseData)
        // 模拟 LLM 产出延迟
        setTimeout(() => {}, 20)
      } else {
        this.push('data: [DONE]\\n\\n')
        this.push(null)
      }
    }
  })
}

// 2. Transform：解析 SSE，提取纯文本
function createSSEParser() {
  let buffer = ''  // 缓存不完整的行

  return new Transform({
    transform(chunk, encoding, callback) {
      buffer += chunk.toString()

      const lines = buffer.split('\\n')
      buffer = lines.pop()  // 最后一段可能不完整，保留

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            const token = json.choices[0]?.delta?.content || ''
            if (token) {
              this.push(token)
            }
          } catch (e) {
            // JSON 解析失败，忽略
          }
        }
      }
      callback()
    },
    flush(callback) {
      // 处理剩余 buffer
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6).trim()
        if (data && data !== '[DONE]') {
          try {
            const json = JSON.parse(data)
            const token = json.choices[0]?.delta?.content || ''
            if (token) this.push(token)
          } catch (e) {}
        }
      }
      callback()
    }
  })
}

// 3. HTTP 服务器：完整管道
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  const llmStream = createLLMStream('Hello! I am an AI Agent. How can I help you today?')

  pipeline(
    llmStream,
    createSSEParser(),
    res,
    (err) => {
      if (err) {
        console.error('管道错误:', err)
      }
      console.log('响应流结束')
    }
  )
})

server.listen(3000, () => {
  console.log('流式响应服务器运行在 http://localhost:3000')
})
\`\`\`

### 5.2 使用客户端测试

\`\`\`html
<!DOCTYPE html>
<html>
<body>
  <div id="output"></div>
  <script>
    const eventSource = new EventSource('http://localhost:3000')
    let fullText = ''
    
    eventSource.onmessage = (event) => {
      fullText += event.data
      document.getElementById('output').textContent = fullText
    }
    
    eventSource.onerror = () => {
      eventSource.close()
      console.log('连接关闭')
    }
  </script>
</body>
</html>
\`\`\`

---

## 六、与 async/await 的结合

### 6.1 async iteration of streams

Node.js 的可读流实现了 \`AsyncIterable\` 协议，可以用 \`for await...of\` 遍历：

\`\`\`javascript
const { createReadStream } = require('node:fs')

async function processFile() {
  const stream = createReadStream('large-file.txt', { encoding: 'utf8' })

  for await (const chunk of stream) {
    console.log(\`处理 \${chunk.length} 字符\`)
    // 在这里做处理...
  }
  
  console.log('文件处理完成')
}

processFile()
\`\`\`

### 6.2 在 pipeline 中使用 async generator

\`\`\`javascript
const { pipeline } = require('node:stream/promises')
const { createReadStream, createWriteStream } = require('node:fs')

async function run() {
  await pipeline(
    createReadStream('input.txt'),
    // async generator 作为 Transform
    async function* (source, { signal }) {
      for await (const chunk of source) {
        // 对每个 chunk 做处理
        const processed = chunk.toString().toUpperCase()
        yield processed
      }
    },
    createWriteStream('output.txt')
  )
}

run()
\`\`\`

### 6.3 调用 LLM API 的现代写法

\`\`\`javascript
const { OpenAI } = require('openai')
const { pipeline } = require('node:stream/promises')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function streamChat(prompt, writable) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    stream: true
  })

  // 用 async generator 解析流
  await pipeline(
    stream,
    async function* (source) {
      for await (const chunk of source) {
        const token = chunk.choices[0]?.delta?.content
        if (token) yield token
      }
    },
    writable
  )
}

// 使用：流式输出到终端
await streamChat('用 100 字介绍 AI Agent', process.stdout)
\`\`\`

---

## 七、综合实战练习

### 练习 1：实现可背压控制的 LLM 文本处理器

\`\`\`javascript
const { Readable, Transform, Writable, pipeline } = require('node:stream')

// 1. 可读流：模拟 LLM 逐字产出
class LLMReadable extends Readable {
  constructor(text, options) {
    super(options)
    this.tokens = text.split('')
    this.index = 0
  }
  
  _read() {
    if (this.index < this.tokens.length) {
      const token = this.tokens[this.index++]
      this.push(Buffer.from(token, 'utf8'))
    } else {
      this.push(null)
    }
  }
}

// 2. Transform：统计 token 数量
class TokenCounter extends Transform {
  constructor(options) {
    super(options)
    this.count = 0
  }
  
  _transform(chunk, encoding, callback) {
    this.count++
    this.push(chunk)  // 透传数据
    callback()
  }
  
  _flush(callback) {
    this.push(\`\\n\\n--- 总计 \${this.count} 个 token ---\`)
    callback()
  }
}

// 3. 可写流：带延迟的输出（模拟慢速客户端）
class SlowWritable extends Writable {
  _write(chunk, encoding, callback) {
    process.stdout.write(chunk)
    setTimeout(callback, 50)  // 50ms 延迟
  }
}

// 完整管道
const text = 'Stream 是 Node.js 处理流式数据的核心，LLM 流式响应依赖它。'
pipeline(
  new LLMReadable(text, { highWaterMark: 5 }),
  new TokenCounter(),
  new SlowWritable(),
  (err) => {
    if (err) console.error('管道失败:', err)
    else console.log('\\n管道成功完成')
  }
)
\`\`\`

### 练习 2：实现文件分块读取并逐块处理

\`\`\`javascript
const { createReadStream } = require('node:fs')
const { createInterface } = require('node:readline')

async function processLargeFile(filePath) {
  const fileStream = createReadStream(filePath, { encoding: 'utf8' })
  
  // 用 readline 逐行处理（底层也是 Stream）
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  
  let lineCount = 0
  let wordCount = 0
  
  for await (const line of rl) {
    lineCount++
    wordCount += line.split(/\\s+/).filter(Boolean).length
  }
  
  console.log(\`总行数: \${lineCount}, 总词数: \${wordCount}\`)
}

processLargeFile('large-file.txt')
\`\`\`

---

## 八、学习总结

| 概念 | 核心 | 典型场景 |
|------|------|---------|
| Buffer | 二进制数据容器 | 拼接分片、编码转换 |
| Readable | 数据来源 | 读取文件、接收 HTTP 响应 |
| Writable | 数据去向 | 写入文件、发送 HTTP 响应 |
| Duplex | 双向通道 | WebSocket、TCP Socket |
| Transform | 读写转换 | SSE 解析、数据格式转换 |
| pipeline | 管道编排 | 多步骤数据处理流程 |
| 背压 | 流量控制 | 生产速度 > 消费速度 |

### 关键收获

1. **Buffer** 是处理二进制数据的基础，\`Buffer.concat()\` 是拼接 LLM 分片响应的安全方式
2. **Stream 四大类型**中，**Transform 流**是处理 LLM 流式响应的核心——解析 SSE、提取 token
3. **pipeline()** 是现代推荐写法，自动处理错误传播和资源清理，配合 \`stream/promises\` 可用 async/await
4. **背压机制**通过 \`highWaterMark\` 和 \`drain\` 事件自动调节流速，用 pipeline 则无需手动处理
5. **async iteration** 让流可以用 \`for await...of\` 遍历，代码更简洁

### 与 AI Agent 的关联

Stream 与 Buffer 在 Agent 开发中的关键应用：

- **LLM 流式响应**：OpenAI、Anthropic 等 API 返回 SSE 格式的流，需要用 Readable + Transform 解析
- **前端流式渲染**：Vercel AI SDK 的 \`streamText\`、\`useChat\` 底层就是 Stream
- **大文件处理**：RAG 系统中加载大文档时，用 Stream 避免内存溢出
- **多 Agent 管道**：多个 Agent 的输出可以用 pipeline 串联，前一个的输出作为后一个的输入
- **实时数据流**：Agent 监听事件流、日志流时，Stream 是天然的抽象

---

## 九、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| Node.js 中文网 - Stream 流文档 | http://nodejs.cn/api/stream.html | 官方 Stream 中文文档，内容完整 |
| Node.js 中文网 - Buffer 缓冲区文档 | http://nodejs.cn/api/buffer.html | 官方 Buffer 中文文档 |
| Node.js 中文网 - Stream Promise API | http://nodejs.cn/api/stream.html#streams-promise-api | pipeline/finished Promise 版 |
| 掘金 - 流式响应 Node.js + Express 实战 | https://juejin.cn/post/7373808202868129844 | 流式响应完整实战示例 |
| CSDN - NodeJS 教程：Buffer 与 Stream 流 | https://blog.csdn.net/qq_38060125/article/details/149841932 | 含面试题与背压机制解析 |
| Node.js 中文网 - 事件循环与异步 | http://nodejs.cn/learn/asynchronous-work/event-loop-timers-and-nexttick | 理解异步调度 |

> **提示**：官方英文站点 nodejs.org 在国内可能访问不稳定，建议优先使用 nodejs.cn 中文镜像站。

---

## 十、明日预告

**Day 6：Node.js Event Loop**

- 事件循环的各阶段：timers、pending callbacks、idle/prepare、poll、check、close callbacks
- 微任务 vs 宏任务：\`process.nextTick\`、\`Promise.then\`、\`setTimeout\`、\`setImmediate\` 的执行顺序
- 并发控制：理解异步调度，避免阻塞事件循环
- Agent 并发：多个工具并行调用时的调度原理

事件循环是 Node.js 异步模型的心脏。理解它，你才能真正掌握 Agent 并发任务调度的底层逻辑。

---

> 🌊 Day 5 完成！Stream 是数据流动的高速公路，Buffer 是路上的集装箱。掌握它们，LLM 流式响应就不再是黑魔法。

    `.trim(),
  },

  {
    id: '8',
    title: 'AI Agent 学习计划 Day 6：Node.js Event Loop（事件循环）',
    slug: 'ai-agent-day6-nodejs-event-loop',
    date: '2026-07-07',
    tags: ['Node.js', 'AI Agent', '学习笔记'],
    excerpt: 'AI Agent 84 天学习计划第六天。深入 Node.js 事件循环：libuv 底层机制、六个阶段（timers/pending/poll/check/close）、微任务与宏任务、process.nextTick vs setImmediate vs setTimeout 三剑客对比、异步调度与并发控制、Agent 系统应用场景（流式响应、并发工具调用、定时编排）。',
    readingTime: 30,
    content: `
# AI Agent 学习计划 Day 6：Node.js Event Loop（事件循环）

> 📅 日期：2026-07-07  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 6 / 84（7.1%）

## 前言

经过 Day 5 对 Node.js Stream 与 Buffer 的学习，我们已经掌握了处理 LLM 流式响应的底层数据结构。但要真正理解「为什么流式数据能非阻塞地到达」「为什么 \`setImmediate\` 和 \`setTimeout(fn, 0)\` 的执行顺序会变化」「为什么递归 \`process.nextTick\` 会让 I/O 永远不执行」，就必须深入理解 Node.js 的 **事件循环（Event Loop）**。

事件循环是 Node.js 单线程实现高并发的核心机制，也是后续理解 Agent 异步调度、并发工具调用、定时编排的基石。本文将从 libuv 底层机制出发，系统讲解事件循环的六个阶段、微任务与宏任务、三个核心 API 的对比，并给出 Agent 系统中的实际应用场景。

---

## 一、事件循环基础概念

### 1.1 什么是事件循环

Node.js 是单线程的（指主线程），但能处理高并发 I/O，秘诀就在事件循环。事件循环是一个**不断轮询各阶段队列的循环**，将异步操作的回调分派到主线程执行。

\`\`\`javascript
// 伪代码：事件循环的简化模型
while (tasksStillPending) {
  // 1. timers 阶段：执行到期的 setTimeout/setInterval
  runPendingTimers()
  // 2. pending callbacks：执行延迟的 I/O 回调
  runPendingCallbacks()
  // 3. idle, prepare：内部使用
  runIdlePrepare()
  // 4. poll 阶段：获取新的 I/O 事件，执行 I/O 回调
  runPoll()
  // 5. check 阶段：执行 setImmediate 回调
  runCheck()
  // 6. close callbacks：执行关闭事件回调
  runCloseCallbacks()
  // 每个阶段切换之间，会清空微任务队列
  runMicrotasks()
}
\`\`\`

### 1.2 libuv 底层库

Node.js 的事件循环由 C 语言库 **libuv** 实现，它提供了跨平台的异步 I/O 能力：

- 在 Linux 下使用 \`epoll\`
- 在 macOS 下使用 \`kqueue\`
- 在 Windows 下使用 \`IOCP\`

libuv 维护了一个线程池（默认 4 个线程，可通过 \`UV_THREADPOOL_SIZE\` 调整），用于处理无法异步的文件 I/O、DNS 解析、crypto 等操作。也就是说，**Node.js 并非绝对单线程**——主线程跑 JS 代码，libuv 线程池跑阻塞 I/O。

### 1.3 为什么 JavaScript 是单线程

JavaScript 最初为浏览器设计，操作 DOM 必须串行（多线程操作 DOM 会引发竞态）。Node.js 继承了单线程模型，把所有 I/O 都交给事件循环 + libuv 处理，主线程只负责执行 JS 回调，从而实现非阻塞。

---

## 二、事件循环的六个阶段

事件循环的每一轮（tick）按顺序经过以下六个阶段：

### 2.1 timers 阶段

执行 \`setTimeout\` 和 \`setInterval\` 到期的回调。

\`\`\`javascript
const start = Date.now()
setTimeout(() => {
  console.log(\`定时器延迟了 \${Date.now() - start}ms\`)
}, 100)

// 实际延迟可能大于 100ms，因为 poll 阶段可能阻塞
\`\`\`

> 注意：定时器指定的不是「精确时间」，而是「最小延迟」。如果事件循环正忙于处理 poll 阶段的回调，定时器会被推迟。

### 2.2 pending callbacks 阶段

执行上一轮循环延迟执行的 I/O 回调，例如：

- TCP \`ECONNREFUSED\` 错误回调
- 一些系统级错误的回调

这个阶段很少需要手动干预。

### 2.3 idle, prepare 阶段

仅供 libuv 内部使用，开发者无需关心。

### 2.4 poll 阶段（最关键）

两个核心职责：

1. **获取新的 I/O 事件**（如果有），执行它们的回调
2. **如果没有事件且没有到期的定时器**，会在此阶段阻塞等待，让出 CPU

poll 阶段的阻塞行为：

- 如果 \`setImmediate\` 队列为空，且没有定时器到期，poll 会阻塞等待新事件
- 如果有定时器即将到期，poll 会计算阻塞时长，到期后回到 timers 阶段
- 如果有 \`setImmediate\` 待执行，poll 不阻塞，直接进入 check 阶段

\`\`\`javascript
const fs = require('fs')

fs.readFile('/etc/passwd', () => {
  // 这个回调在 poll 阶段执行
  console.log('文件读取完成')
})
\`\`\`

### 2.5 check 阶段

执行 \`setImmediate\` 的回调。

\`\`\`javascript
setImmediate(() => {
  console.log('我在 check 阶段执行')
})
\`\`\`

### 2.6 close callbacks 阶段

执行关闭事件的回调：

\`\`\`javascript
const socket = net.connect(80)
socket.on('close', () => {
  // 这个回调在 close 阶段执行
  console.log('socket 已关闭')
})
socket.destroy()
\`\`\`

---

## 三、微任务与宏任务

### 3.1 任务分类

| 任务类型 | 包含的 API | 何时执行 |
|---------|-----------|---------|
| **宏任务（Macrotask）** | \`setTimeout\`、\`setInterval\`、\`setImmediate\`、I/O 回调 | 在事件循环的对应阶段执行 |
| **微任务（Microtask）** | \`Promise.then/catch/finally\`、\`queueMicrotask\` | 每个宏任务后立即执行 |
| **nextTick 队列** | \`process.nextTick\` | 优先级高于微任务，在每个阶段切换前清空 |

### 3.2 执行顺序优先级

\`\`\`
事件循环阶段切换时：
  1. 先清空 nextTick 队列（全部执行完）
  2. 再清空微任务队列（全部执行完）
  3. 才进入下一个阶段
\`\`\`

### 3.3 经典示例：执行顺序

\`\`\`javascript
console.log('1: 同步代码')

setTimeout(() => {
  console.log('4: setTimeout 宏任务')
}, 0)

setImmediate(() => {
  console.log('5: setImmediate 宏任务')
})

Promise.resolve().then(() => {
  console.log('3: Promise 微任务')
})

process.nextTick(() => {
  console.log('2: nextTick')
})

// 输出顺序：
// 1: 同步代码
// 2: nextTick
// 3: Promise 微任务
// 4: setTimeout 宏任务  （与 setImmediate 顺序不定，见下文）
// 5: setImmediate 宏任务
\`\`\`

### 3.4 Node.js 11+ 的变化

在 Node.js 11 之前，微任务在每个**阶段**结束后才清空。Node.js 11 之后改为每个**宏任务**后立即清空，与浏览器行为一致：

\`\`\`javascript
// Node.js 11+ 行为
setTimeout(() => {
  console.log('timer1')
  Promise.resolve().then(() => console.log('promise1'))
}, 0)

setTimeout(() => {
  console.log('timer2')
  Promise.resolve().then(() => console.log('promise2'))
}, 0)

// Node.js 11+ 输出：
// timer1
// promise1
// timer2
// promise2

// Node.js 10 及之前输出：
// timer1
// timer2
// promise1
// promise2
\`\`\`

---

## 四、三个核心 API 对比

### 4.1 process.nextTick

把回调放在当前操作完成后立即执行，优先级**最高**。

\`\`\`javascript
function apiCall() {
  console.log('同步代码开始')
  process.nextTick(() => {
    console.log('nextTick 回调')
  })
  console.log('同步代码结束')
}

apiCall()
// 输出：
// 同步代码开始
// 同步代码结束
// nextTick 回调
\`\`\`

**用途**：在异步回调之前同步清理资源、传递错误。

**陷阱**：递归调用 \`process.nextTick\` 会导致 I/O 饥饿！

\`\`\`javascript
// ❌ 危险：I/O 永远不会执行
function recursiveTick() {
  process.nextTick(recursiveTick)
}
recursiveTick()

setTimeout(() => {
  console.log('这行永远不会执行！')
}, 0)

fs.readFile('/etc/passwd', () => {
  console.log('这也不会执行！')
})
\`\`\`

### 4.2 setImmediate

把回调放在 **check 阶段**执行，即下一轮事件循环。

\`\`\`javascript
setImmediate(() => {
  console.log('下一轮事件循环的 check 阶段')
})
\`\`\`

**用途**：在 I/O 回调之后立即执行，是 nextTick 的安全替代品。

### 4.3 setTimeout(fn, 0)

把回调放在 **timers 阶段**执行，最小延迟约 1ms（系统精度）。

\`\`\`javascript
setTimeout(() => {
  console.log('timers 阶段')
}, 0)
\`\`\`

### 4.4 三者对比表

| API | 执行阶段 | 优先级 | 典型延迟 | I/O 饥饿风险 |
|-----|---------|--------|---------|---------------|
| \`process.nextTick\` | 当前操作后 | 最高 | 几乎为 0 | 高（递归会饿死 I/O） |
| \`Promise.then\` | 微任务队列 | 次高 | 几乎为 0 | 中（递归会延迟 I/O） |
| \`setImmediate\` | check 阶段 | 较低 | 一次阶段切换 | 无 |
| \`setTimeout(fn,0)\` | timers 阶段 | 较低 | ≥1ms | 无 |

### 4.5 setTimeout vs setImmediate 的顺序之谜

在主模块（非 I/O 回调内）调用时，两者顺序不确定：

\`\`\`javascript
// 主模块中，顺序不确定（取决于事件循环进入时机）
setTimeout(() => console.log('timeout'), 0)
setImmediate(() => console.log('immediate'))
// 可能输出 timeout immediate，也可能 immediate timeout
\`\`\`

但在 I/O 回调内调用时，**setImmediate 一定先于 setTimeout**：

\`\`\`javascript
const fs = require('fs')

fs.readFile('/etc/passwd', () => {
  setTimeout(() => console.log('timeout'), 0)
  setImmediate(() => console.log('immediate'))
  // 一定输出：immediate timeout
})
\`\`\`

原因：I/O 回调在 poll 阶段执行后，事件循环下一个阶段是 check（执行 setImmediate），再下一轮才是 timers。

---

## 五、异步调度与并发控制

### 5.1 单线程下的"并发"

Node.js 主线程是单线程的，但通过事件循环让 I/O 操作并行：

\`\`\`javascript
// 三个 I/O 操作并行执行，总耗时约等于最慢的一个
const start = Date.now()

const tasks = [
  fetch('https://api.example.com/users'),
  fetch('https://api.example.com/products'),
  fetch('https://api.example.com/orders')
]

Promise.all(tasks).then(() => {
  console.log(\`耗时 \${Date.now() - start}ms\`)  // 远小于三者串行时间
})
\`\`\`

### 5.2 Promise.all 实现并行

\`\`\`javascript
// 并行执行多个工具调用
async function callMultipleTools(promises) {
  const results = await Promise.all(promises)
  // 所有工具完成后才返回
  return results
}
\`\`\`

### 5.3 for...await 实现串行

\`\`\`javascript
// 串行执行：前一个完成才开始下一个
async function serialExecution(tasks) {
  const results = []
  for (const task of tasks) {
    results.push(await task())
  }
  return results
}
\`\`\`

### 5.4 并发限制器

当需要同时调用大量工具时，一次性 \`Promise.all\` 会打满连接池。手写一个简单的并发限制器：

\`\`\`javascript
async function asyncPool(limit, items, iteratorFn) {
  const results = []
  const executing = new Set()

  for (const item of items) {
    // 如果当前并发数已满，等待其中一个完成
    if (executing.size >= limit) {
      await Promise.race(executing)
    }

    const promise = Promise.resolve().then(() => iteratorFn(item))
    results.push(promise)
    executing.add(promise)

    // 完成后从执行集合中移除
    promise.finally(() => executing.delete(promise))
  }

  return Promise.all(results)
}

// 使用：限制并发为 3，调用 10 个 LLM API
const prompts = ['你好', '介绍自己', '写诗', /* ... 7 个更多 */]
const results = await asyncPool(3, prompts, async (prompt) => {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
  })
  return res.json()
})
\`\`\`

### 5.5 避免阻塞事件循环

CPU 密集任务会阻塞事件循环，让所有 I/O 回调延迟：

\`\`\`javascript
// ❌ 阻塞事件循环 5 秒
function heavyCompute(n) {
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += Math.sqrt(i)
  }
  return sum
}

// 这期间的 setTimeout、I/O 回调全部被阻塞
setTimeout(() => console.log('我会延迟 5 秒'), 0)
heavyCompute(1e9)
\`\`\`

解决方案：使用 \`Worker Threads\`（Day 8 将学到），或用 \`setImmediate\` 分片执行：

\`\`\`javascript
// 用 setImmediate 分片：每处理一批就让出事件循环
async function batchProcess(items, batchSize, handler) {
  const results = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    results.push(...batch.map(handler))
    // 让出事件循环，让 I/O 回调有机会执行
    await new Promise(resolve => setImmediate(resolve))
  }
  return results
}
\`\`\`

---

## 六、Agent 系统中的应用场景

### 6.1 流式响应处理

LLM 流式响应的每个 chunk 通过事件循环分批到达：

\`\`\`javascript
// 模拟 LLM 流式响应
async function* streamLLMResponse(prompt) {
  const tokens = ['你', '好', '，', '我', '是', 'AI', '助手']
  for (const token of tokens) {
    // 模拟网络延迟，token 通过 I/O 回调进入事件循环
    await new Promise(resolve => setTimeout(resolve, 100))
    yield token
  }
}

// 处理流：每个 chunk 到达时触发渲染
async function handleStream() {
  for await (const chunk of streamLLMResponse('你好')) {
    process.stdout.write(chunk)
  }
  console.log('\\n流结束')
}
\`\`\`

### 6.2 并发工具调用

Agent 同时调用多个工具（搜索、数据库查询、API 调用）时，事件循环让它们并行：

\`\`\`javascript
async function agentRunWithTools(query) {
  // 并发调用三个工具
  const [searchResults, dbResults, weatherResults] = await Promise.all([
    callSearchTool(query),
    queryDatabase(query),
    callWeatherAPI()
  ])

  // 整合结果发给 LLM
  const finalAnswer = await callLLM({
    searchResults,
    dbResults,
    weatherResults
  })

  return finalAnswer
}
\`\`\`

### 6.3 定时任务编排

\`setInterval\` 实现 Agent 心跳检测、超时控制：

\`\`\`javascript
class AgentRunner {
  constructor() {
    this.heartbeats = new Map()
  }

  // 心跳检测：每 30 秒检查一次 Agent 是否存活
  startHeartbeat(agentId) {
    const timer = setInterval(() => {
      const lastSeen = this.heartbeats.get(agentId)
      if (Date.now() - lastSeen > 60000) {
        console.warn(\`Agent \${agentId} 心跳超时，重启中...\`)
        this.restartAgent(agentId)
      }
    }, 30000)
    return timer
  }

  // 超时控制：5 秒内必须返回，否则取消
  async callWithTimeout(promise, timeout = 5000) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('工具调用超时')), timeout)
    )
    return Promise.race([promise, timeoutPromise])
  }
}
\`\`\`

### 6.4 微任务陷阱：影响 Agent 响应延迟

大量 \`process.nextTick\` 嵌套会导致 I/O 饥饿，影响 Agent 响应延迟：

\`\`\`javascript
// ❌ 反模式：递归 nextTick 会让 LLM 流式响应无法处理
function badRecursiveProcessing(items) {
  function process(index) {
    if (index >= items.length) return
    process.nextTick(() => {
      console.log(\`处理 \${items[index]}\`)
      process(index + 1)
    })
  }
  process(0)
}

// 这期间所有 I/O 回调（包括 LLM 的 token）都被阻塞
// ✅ 正确做法：用 setImmediate 让出事件循环给 I/O
function goodRecursiveProcessing(items) {
  function process(index) {
    if (index >= items.length) return
    setImmediate(() => {
      console.log(\`处理 \${items[index]}\`)
      process(index + 1)
    })
  }
  process(0)
}
\`\`\`

---

## 七、综合实战练习

### 练习 1：事件循环执行顺序实验

\`\`\`javascript
// 实验一：基础执行顺序
console.log('A: 同步开始')

setImmediate(() => console.log('B: immediate'))

setTimeout(() => console.log('C: timeout'), 0)

Promise.resolve().then(() => console.log('D: promise'))

process.nextTick(() => console.log('E: nextTick'))

console.log('F: 同步结束')

// 输出顺序：
// A: 同步开始
// F: 同步结束
// E: nextTick
// D: promise
// B: immediate  （或 C 先，取决于环境）
// C: timeout
\`\`\`

### 练习 2：I/O 回调内的顺序

\`\`\`javascript
const fs = require('fs')

fs.readFile(__filename, () => {
  console.log('1: I/O 回调（poll 阶段）')

  setTimeout(() => console.log('2: timeout'), 0)
  setImmediate(() => console.log('3: immediate'))

  process.nextTick(() => console.log('4: nextTick'))
  Promise.resolve().then(() => console.log('5: promise'))
})

// 输出顺序：
// 1: I/O 回调（poll 阶段）
// 4: nextTick
// 5: promise
// 3: immediate  （一定先于 timeout）
// 2: timeout
\`\`\`

### 练习 3：手写并发限制器

\`\`\`javascript
// 简易版并发限制器：同时只运行 N 个 Promise
class AsyncPool {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency
    this.activeCount = 0
    this.queue = []
  }

  async run(task) {
    if (this.activeCount >= this.maxConcurrency) {
      await new Promise(resolve => this.queue.push(resolve))
    }
    this.activeCount++
    try {
      return await task()
    } finally {
      this.activeCount--
      if (this.queue.length > 0) {
        this.queue.shift()()
      }
    }
  }
}

// 使用：限制同时 2 个请求
const pool = new AsyncPool(2)
const urls = [
  'https://api.example.com/1',
  'https://api.example.com/2',
  'https://api.example.com/3',
  'https://api.example.com/4'
]

const results = await Promise.all(
  urls.map(url => pool.run(() => fetch(url)))
)
\`\`\`

---

## 八、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| 事件循环 | Node.js 单线程实现高并发的核心，由 libuv 实现 |
| 六个阶段 | timers → pending → idle/prepare → poll → check → close |
| 微任务 | Promise.then、queueMicrotask，每个宏任务后执行 |
| nextTick | 优先级最高的微任务，可能造成 I/O 饥饿 |
| setImmediate | check 阶段执行，nextTick 的安全替代 |
| setTimeout | timers 阶段执行，最小延迟 1ms |
| libuv | C 库，跨平台异步 I/O，维护线程池 |

### 关键收获

1. **事件循环六阶段**：理解 poll 是最关键阶段，会阻塞等待新 I/O 事件
2. **微任务优先级**：nextTick > Promise > 宏任务，在每个阶段切换间清空
3. **nextTick 陷阱**：递归调用会饿死 I/O，应改用 setImmediate
4. **Node.js 11+ 变化**：微任务在每个宏任务后立即执行，与浏览器一致
5. **并发控制**：Promise.all 并行、for...await 串行、asyncPool 限并发
6. **避免阻塞**：CPU 密集任务用 Worker Threads 或 setImmediate 分片

### 与 AI Agent 的关联

事件循环在 Agent 开发中的核心应用：

- **流式响应**：LLM 的每个 token 通过 I/O 回调进入事件循环，正确处理才能避免背压
- **并发工具调用**：Agent 同时调用多个工具时，事件循环让它们并行
- **定时编排**：setInterval 实现心跳、超时控制
- **避免阻塞**：大量数据处理要分片，否则阻塞 LLM token 流
- **Worker Threads**：CPU 密集任务（向量计算）应交给 Worker，不阻塞主线程

---

## 九、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| Node.js 中文网 - 事件循环 | https://nodejs.cn/learn/asynchronous-work/event-loop-timers-and-nexttick | 官方事件循环文档中文版，权威完整 |
| Node.js 中文网 - Events 模块 | http://nodejs.cn/api/events.html | Day 7 预习，事件驱动基础 |
| Node.js 中文网 - Process 模块 | http://nodejs.cn/api/process.html | process.nextTick 文档 |
| Node.js 中文网 - Timers 模块 | http://nodejs.cn/api/timers.html | setTimeout、setImmediate 文档 |
| 掘金 - Node.js 事件循环详解 | https://juejin.cn/post/7591744411740061696 | 六阶段详解，配图清晰 |
| 掘金 - Node.js 事件循环与 libuv 源码剖析 | https://juejin.cn/post/7617106857023537179 | 深入 libuv 源码，进阶阅读 |
| 菜鸟教程 - Node.js 事件循环 | https://www.runoob.com/nodejs/nodejs-event-loop.html | 入门友好，适合快速理解 |
| 阿里云开发者 - 事件循环及 setTimeout/setImmediate | https://developer.aliyun.com/article/1611332 | 六阶段解析 + API 对比 |
| 腾讯云开发者 - 事件循环、定时器、nextTick | https://developer.cloud.tencent.com/article/1929203 | nextTick 与 setImmediate 详解 |
| CSDN - Node.js 事件循环机制解析 | https://blog.csdn.net/2301_80723943/article/details/160741808 | 六阶段流程图清晰 |

> **提示**：Node.js 中文网（nodejs.cn）是官方文档的中文镜像，内容完整、更新及时，是首选学习资源。

---

## 十、明日预告

**Day 7：Node.js Event Emitter**

- Event Emitter 是 Node.js 事件驱动的核心类
- \`on\`/\`emit\`/\`once\`/\`off\` 方法详解
- 自定义事件、错误事件处理
- 构建事件驱动的 Agent 系统

Event Emitter 与今天的事件循环紧密衔接——事件循环是"何时执行"，Event Emitter 是"如何触发和监听"。掌握 Event Emitter 是构建事件驱动 Agent 架构的关键一步。

---

> 🚀 Day 6 完成！理解事件循环是掌握 Node.js 异步编程的钥匙，也是后续 Agent 并发调度、流式响应处理的底层基础。

    `.trim(),
  },

  {
    id: '6',
    title: `AI Agent 学习计划 Day 2：TypeScript 装饰器（Decorators）`,
    slug: 'ai-agent-day2-typescript-decorators',
    date: '2026-07-03',
    tags: ["TypeScript","AI Agent","学习笔记"],
    excerpt: `AI Agent 84 天学习计划第二天。系统学习 TypeScript 装饰器：类装饰器、方法装饰器、属性装饰器、参数装饰器、装饰器工厂、元数据与依赖注入原理，并给出 Agent 工具自动注册、调用重试缓存等实战应用。`,
    readingTime: 28,
    content: `
# AI Agent 学习计划 Day 2：TypeScript 装饰器（Decorators）

> 📅 日期：2026-07-03  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 2 / 84（2.4%）

## 前言

昨天的 Day 1 我们系统学习了 TypeScript 类型系统。今天进入 Day 2，主题是 **装饰器（Decorators）**。

装饰器是一种特殊的声明，可以「附加」到类、方法、属性、访问器或参数上，以修改它们的行为。在 Node.js 后端框架中（尤其是 NestJS），装饰器是依赖注入、路由注册、中间件机制的核心。在 AI Agent 开发中，理解装饰器有助于阅读框架源码、构建可扩展的 Agent 服务架构。

本文将从零开始，覆盖类装饰器、方法装饰器、属性装饰器、访问器装饰器、参数装饰器、装饰器工厂、装饰器组合、元数据等全部知识点，并给出 Agent 开发场景中的实际应用。

---

## 一、装饰器概述与启用

### 1.1 什么是装饰器

装饰器本质是一个**函数**，它接收目标对象作为参数，在运行时对目标进行「装饰」（扩展或修改）。语法上使用 \`@expression\` 形式，其中 \`expression\` 求值后必须是一个函数。

\`\`\`typescript
// @sealed 就是一个装饰器
@sealed
class Greeter {
  greet() {}
}
\`\`\`

### 1.2 启用装饰器支持

装饰器目前是实验性特性，需要在 \`tsconfig.json\` 中启用：

\`\`\`json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
\`\`\`

- \`experimentalDecorators\`：启用实验性装饰器（Stage 2 规范）
- \`emitDecoratorMetadata\`：允许装饰器获取类型元数据（需配合 \`reflect-metadata\`）

### 1.3 Stage 2 vs Stage 3 装饰器

> **重要提示**：TypeScript 5.0 起已原生支持 ECMAScript Stage 3 装饰器规范，不再需要 \`experimentalDecorators\`。

| 特性 | Stage 2（旧版实验性） | Stage 3（TS 5.0+ 标准） |
|------|----------------------|------------------------|
| 启用方式 | \`experimentalDecorators: true\` | 默认支持（无需配置） |
| 参数装饰器 | ✅ 支持 | ✅ 支持 |
| 元数据 API | \`reflect-metadata\` 库 | 内置 \`Symbol.metadata\` |
| 框架兼容性 | NestJS、TypeORM 等主流框架 | 新项目可选用，旧框架逐步迁移中 |

当前大多数 Node.js 框架（NestJS、TypeORM、MikroORM 等）仍使用 Stage 2 装饰器，因此本文以 Stage 2 为主进行讲解，这是目前工业界最广泛使用的形式。

---

## 二、装饰器工厂（Decorator Factories）

装饰器工厂是一个**返回装饰器函数**的函数，用于给装饰器传参：

\`\`\`typescript
// 普通装饰器：无法传参
function log(target: any) {
  console.log(target)
}

// 装饰器工厂：可以传参
function logWithMessage(message: string) {
  return function (target: any) {
    console.log(\`\${message}:\`, target.name)
  }
}

@logWithMessage(' decorating class ')
class MyAgent {}
// 输出: decorating class : MyAgent
\`\`\`

工厂模式是实际开发中最常用的形式——NestJS 的 \`@Controller('users')\`、\`@Get('/list')\` 都是装饰器工厂。

---

## 三、类装饰器（Class Decorators）

类装饰器是应用于**类声明**的装饰器，接收一个参数：类的构造函数。

### 3.1 基本用法

\`\`\`typescript
// 类装饰器签名
type ClassDecorator = <TFunction extends Function>(
  target: TFunction
) => TFunction | void

// 示例：密封一个类，禁止添加/删除属性
function sealed(target: Function) {
  Object.seal(target)
  Object.seal(target.prototype)
}

@sealed
class Greeter {
  greeting: string
  constructor(message: string) {
    this.greeting = message
  }
  greet() {
    return "Hello, " + this.greeting
  }
}
\`\`\`

### 3.2 替换/扩展构造函数

类装饰器可以返回一个新的构造函数，**替换**原始类：

\`\`\`typescript
// 装饰器工厂：给类添加 createdAt 属性和日志能力
function reportableClassDecorator<T extends { new (...args: any[]): {} }>(
  constructor: T
) {
  return class extends constructor {
    createdAt = new Date()
    report() {
      console.log(\`Agent 创建于 \${this.createdAt.toISOString()}\`)
    }
  }
}

@reportableClassDecorator
class Agent {
  name: string
  constructor(name: string) {
    this.name = name
  }
}

const agent = new Agent('ResearchBot')
agent.report()  // Agent 创建于 2026-07-03T...
// agent.createdAt 也可以访问
\`\`\`

### 3.3 Agent 开发中的应用：自动注册工具

\`\`\`typescript
// 全局工具注册表
const toolRegistry = new Map<string, any>()

// 类装饰器：自动将 Agent 类注册为可用工具
function AgentTool(name: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    toolRegistry.set(name, constructor)
    console.log(\`[注册工具] \${name} -> \${constructor.name}\`)
    return constructor
  }
}

@AgentTool('web_search')
class WebSearchAgent {
  async execute(query: string) {
    return \`搜索结果: \${query}\`
  }
}

@AgentTool('code_executor')
class CodeExecutorAgent {
  async execute(code: string) {
    return \`执行结果: \${code}\`
  }
}

// 运行时查看注册表
console.log(toolRegistry.keys())
// [注册工具] web_search -> WebSearchAgent
// [注册工具] code_executor -> CodeExecutorAgent
\`\`\`

---

## 四、方法装饰器（Method Decorators）

方法装饰器应用于类的**方法**，接收三个参数：

1. \`target\`：对于静态成员是类的构造函数，对于实例成员是类的原型
2. \`propertyKey\`：方法名（字符串或 Symbol）
3. \`descriptor\`：属性描述符（\`TypedPropertyDescriptor\`）

### 4.1 基本用法

\`\`\`typescript
// 方法装饰器签名
type MethodDecorator = (
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<any>
) => TypedPropertyDescriptor<any> | void

// 示例：修改方法为不可枚举
function enumerable(value: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.enumerable = value
  }
}

class Greeter {
  greeting: string
  constructor(m: string) { this.greeting = m }

  @enumerable(false)
  greet() {
    return "Hello, " + this.greeting
  }
}
\`\`\`

### 4.2 包装方法：日志与耗时统计

方法装饰器最强大的用途是**包装原始方法**，在不修改原代码的情况下增加横切逻辑：

\`\`\`typescript
// 记录方法调用日志
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = function (...args: any[]) {
    console.log(\`[调用] \${propertyKey}(\${args.map(a => JSON.stringify(a)).join(', ')})\`)
    const result = originalMethod.apply(this, args)
    console.log(\`[返回] \${propertyKey} => \${JSON.stringify(result)}\`)
    return result
  }

  return descriptor
}

// 异步方法耗时统计
function measureTime(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = async function (...args: any[]) {
    const start = Date.now()
    const result = await originalMethod.apply(this, args)
    const elapsed = Date.now() - start
    console.log(\`⏱ \${propertyKey} 耗时 \${elapsed}ms\`)
    return result
  }

  return descriptor
}

class LLMClient {
  @log
  @measureTime
  async chat(prompt: string): Promise<string> {
    // 模拟 LLM 调用
    await new Promise(r => setTimeout(r, 500))
    return \`回复: \${prompt}\`
  }
}

const client = new LLMClient()
await client.chat('你好')
// [调用] chat("你好")
// ⏱ chat 耗时 502ms
// [返回] chat => "回复: 你好"
\`\`\`

### 4.3 错误重试装饰器

\`\`\`typescript
// 自动重试装饰器（工厂）
function retry(times: number = 3, delay: number = 1000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      let lastError: Error
      for (let i = 0; i < times; i++) {
        try {
          return await originalMethod.apply(this, args)
        } catch (err) {
          lastError = err as Error
          console.log(\`🔄 \${propertyKey} 第 \${i + 1} 次失败: \${lastError.message}\`)
          if (i < times - 1) {
            await new Promise(r => setTimeout(r, delay))
          }
        }
      }
      throw lastError!
    }

    return descriptor
  }
}

class AgentService {
  @retry(3, 2000)
  async callLLM(prompt: string): Promise<string> {
    // 模拟可能失败的 LLM 调用
    if (Math.random() < 0.5) {
      throw new Error('API 超时')
    }
    return \`LLM 回复: \${prompt}\`
  }
}
\`\`\`

### 4.4 Agent 中的应用：工具调用权限校验

\`\`\`typescript
// 权限校验装饰器
function requirePermission(permission: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = function (this: { permissions: string[] }, ...args: any[]) {
      if (!this.permissions.includes(permission)) {
        throw new Error(\`权限不足：需要 \${permission} 权限\`)
      }
      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

class Agent {
  constructor(
    public name: string,
    public permissions: string[]
  ) {}

  @requirePermission('file:write')
  async writeFile(path: string, content: string) {
    console.log(\`写入文件 \${path}\`)
  }

  @requirePermission('net:request')
  async httpRequest(url: string) {
    console.log(\`请求 \${url}\`)
  }
}

const agent = new Agent('Bot', ['file:write'])
await agent.writeFile('/tmp/test.txt', 'hello')  // ✅
await agent.httpRequest('https://api.example.com')  // ❌ 权限不足
\`\`\`

---

## 五、属性装饰器（Property Decorators）

属性装饰器应用于类的属性，接收两个参数：

1. \`target\`：对于静态成员是构造函数，对于实例成员是原型
2. \`propertyKey\`：属性名

> 注意：属性装饰器**没有**描述符参数，因为属性在原型上初始化时还没有描述符。

\`\`\`typescript
// 属性装饰器：记录属性的元信息
function format(formatString: string) {
  return function (target: any, propertyKey: string) {
    // 将格式化信息存到元数据中
    Reflect.defineMetadata('format', formatString, target, propertyKey)
  }
}

class DateAgent {
  @format('YYYY-MM-DD')
  createdAt: string

  @format('HH:mm:ss')
  timestamp: string
}

// 读取元数据
const formatStr = Reflect.getMetadata('format', DateAgent.prototype, 'createdAt')
console.log(formatStr)  // YYYY-MM-DD
\`\`\`

---

## 六、访问器装饰器（Accessor Decorators）

访问器装饰器应用于 getter/setter，参数与方法装饰器相同：

\`\`\`typescript
// 访问器装饰器：将属性设为不可配置
function configurable(value: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.configurable = value
  }
}

class Point {
  private _x: number
  private _y: number

  constructor(x: number, y: number) {
    this._x = x
    this._y = y
  }

  @configurable(false)
  get x() { return this._x }

  @configurable(false)
  get y() { return this._y }
}
\`\`\`

---

## 七、参数装饰器（Parameter Decorators）

参数装饰器应用于**方法参数**，接收三个参数：

1. \`target\`：对于静态成员是构造函数，对于实例成员是原型
2. \`propertyKey\`：方法名（静态成员为 \`undefined\`）
3. \`parameterIndex\`：参数在函数参数列表中的索引

\`\`\`typescript
// 参数装饰器：标记必填参数
const requiredMetadataKey = Symbol('required')

function required(target: Object, propertyKey: string | symbol, parameterIndex: number) {
  // 获取已有的必填参数索引列表
  const existing = Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || []
  existing.push(parameterIndex)
  Reflect.defineMetadata(requiredMetadataKey, existing, target, propertyKey)
}

// 配合方法装饰器实现参数校验
function validate(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = function (...args: any[]) {
    const requiredParams: number[] = 
      Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || []
    
    for (const index of requiredParams) {
      if (args[index] === undefined || args[index] === null) {
        throw new Error(\`参数 \${index} 是必填的\`)
      }
    }
    return originalMethod.apply(this, args)
  }

  return descriptor
}

class AgentRunner {
  @validate
  execute(
    @required prompt: string,
    options?: { temperature?: number }
  ) {
    console.log(\`执行: \${prompt}\`, options)
  }
}

const runner = new AgentRunner()
runner.execute('你好')          // ✅
runner.execute(undefined as any) // ❌ 参数 0 是必填的
\`\`\`

---

## 八、装饰器组合与求值顺序

### 8.1 多装饰器组合

当多个装饰器应用于同一个声明时，写在一行或分多行：

\`\`\`typescript
// 单行写法
@f @g class A {}

// 多行写法
@f
@g
class B {}
\`\`\`

### 8.2 求值规则

装饰器的求值分为两个阶段，类似数学中的**复合函数**：

1. **自上而下求值**：装饰器表达式从上到下求值（工厂函数被调用）
2. **自下而上调用**：装饰器函数从下到上调用（实际装饰逻辑执行）

\`\`\`typescript
function f() {
  console.log("f(): evaluated")
  return function (target: any) {
    console.log("f(): called")
  }
}

function g() {
  console.log("g(): evaluated")
  return function (target: any) {
    console.log("g(): called")
  }
}

@f
@g
class C {}

// 输出:
// f(): evaluated
// g(): evaluated
// g(): called
// f(): called
\`\`\`

### 8.3 不同声明上的应用顺序

对于同一个类中的多个装饰器，应用顺序如下：

1. **实例方法**：按参数顺序 → 方法
2. **静态方法**：按参数顺序 → 方法
3. **实例属性**：按声明顺序
4. **静态属性**：按声明顺序
5. **构造函数参数**
6. **类装饰器**

\`\`\`typescript
@ClassDecorator
class Example {
  @Property
  instanceProp: string

  @StaticProp
  static staticProp: string

  constructor(@Param param: string) {}

  @Method
  instanceMethod(@Param param: string) {}

  @StaticMethod
  static staticMethod(@Param param: string) {}
}
\`\`\`

---

## 九、元数据（Metadata）

### 9.1 reflect-metadata 简介

\`emitDecoratorMetadata\` 启用后，TypeScript 会在编译时自动注入类型元数据。配合 \`reflect-metadata\` 库使用：

\`\`\`bash
npm install reflect-metadata
\`\`\`

\`\`\`typescript
import 'reflect-metadata'

// TypeScript 自动注入三种元数据键
// - design:type: 属性/方法的类型
// - design:paramtypes: 方法的参数类型数组
// - design:returntype: 方法的返回类型

class AgentService {
  process(prompt: string, options: { temperature: number }): Promise<string> {
    return Promise.resolve(prompt)
  }
}

const types = Reflect.getMetadata('design:paramtypes', AgentService.prototype, 'process')
console.log(types)
// [String, Object]

const returnType = Reflect.getMetadata('design:returntype', AgentService.prototype, 'process')
console.log(returnType)
// Promise
\`\`\`

### 9.2 依赖注入原理

NestJS 的依赖注入机制就基于装饰器 + 元数据实现：

\`\`\`typescript
import 'reflect-metadata'

// 简易依赖注入容器
const container = new Map<string, any>()

function Injectable(target: any) {
  // 读取构造函数参数类型
  const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', target) || []
  // 递归解析依赖
  const deps = paramTypes.map(type => container.get(type.name))
  const instance = new target(...deps)
  container.set(target.name, instance)
}

@Injectable
class Logger {
  log(msg: string) { console.log(\`[LOG] \${msg}\`) }
}

@Injectable
class AgentService {
  constructor(private logger: Logger) {}
  
  run() { this.logger.log('Agent 启动') }
}

const agent = container.get('AgentService') as AgentService
agent.run()  // [LOG] Agent 启动
\`\`\`

---

## 十、综合实战练习

### 练习 1：实现 Agent 工具注册与自动校验

\`\`\`typescript
import 'reflect-metadata'

// 元数据键
const TOOL_METADATA = Symbol('tool')
const TOOL_PARAMS = Symbol('toolParams')

// 属性装饰器：标记为工具参数
function param(name: string, description: string) {
  return function (target: any, propertyKey: string) {
    const params = Reflect.getMetadata(TOOL_PARAMS, target) || []
    params.push({ name, description, propertyKey })
    Reflect.defineMetadata(TOOL_PARAMS, params, target)
  }
}

// 方法装饰器：标记为可调用工具
function tool(name: string, description: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(TOOL_METADATA, { name, description }, target, propertyKey)
  }
}

class AgentToolkit {
  @tool('search', '搜索互联网获取信息')
  async search(
    @param('query', '搜索关键词') query: string,
    @param('limit', '结果数量') limit: number = 5
  ) {
    return Array(limit).fill(0).map((_, i) => \`结果\${i}: \${query}\`)
  }

  @tool('calculate', '数学计算')
  async calculate(
    @param('expression', '数学表达式') expr: string
  ) {
    return eval(expr)
  }
}

// 提取工具 schema（模拟 OpenAI Function Calling 格式）
function extractToolSchema(target: any): any[] {
  const tools: any[] = []
  const proto = Object.getPrototypeOf(target)
  
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key === 'constructor') continue
    const meta = Reflect.getMetadata(TOOL_METADATA, proto, key)
    if (!meta) continue
    
    const params = Reflect.getMetadata(TOOL_PARAMS, proto) || []
    tools.push({
      type: 'function',
      function: {
        name: meta.name,
        description: meta.description,
        parameters: {
          type: 'object',
          properties: params.reduce((acc, p) => {
            acc[p.name] = { description: p.description }
            return acc
          }, {}),
          required: params.map(p => p.name)
        }
      }
    })
  }
  return tools
}

const toolkit = new AgentToolkit()
console.log(JSON.stringify(extractToolSchema(toolkit), null, 2))
\`\`\`

### 练习 2：实现方法缓存装饰器

\`\`\`typescript
// 缓存装饰器：缓存方法返回值（相同参数不重复计算）
function cache(ttl: number = 60000) {
  const store = new Map<string, { value: any; expireAt: number }>()

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const key = \`\${propertyKey}:\${JSON.stringify(args)}\`
      const cached = store.get(key)
      
      if (cached && cached.expireAt > Date.now()) {
        console.log(\`📋 缓存命中: \${key}\`)
        return cached.value
      }

      const result = await originalMethod.apply(this, args)
      store.set(key, { value: result, expireAt: Date.now() + ttl })
      return result
    }

    return descriptor
  }
}

class EmbeddingService {
  @cache(300000)  // 5 分钟缓存
  async embed(text: string): Promise<number[]> {
    console.log(\`🔄 计算嵌入向量: \${text}\`)
    // 模拟耗时计算
    await new Promise(r => setTimeout(r, 100))
    return [0.1, 0.2, 0.3]
  }
}

const service = new EmbeddingService()
await service.embed('hello')  // 🔄 计算嵌入向量: hello
await service.embed('hello')  // 📋 缓存命中: embed:["hello"]
\`\`\`

---

## 十一、学习总结

| 装饰器类型 | 参数 | 典型用途 |
|-----------|------|---------|
| 类装饰器 | \`(target)\` | 替换/扩展类、自动注册 |
| 方法装饰器 | \`(target, key, descriptor)\` | 日志、重试、缓存、权限 |
| 属性装饰器 | \`(target, key)\` | 元数据标记、验证标记 |
| 访问器装饰器 | \`(target, key, descriptor)\` | 控制可配置性 |
| 参数装饰器 | \`(target, key, paramIndex)\` | 参数校验、依赖注入标记 |

### 关键收获

1. **类装饰器**可以替换构造函数，实现自动注册、混入能力
2. **方法装饰器**是最实用的类型，通过包装 \`descriptor.value\` 可实现日志、重试、缓存、权限等横切关注点
3. **参数装饰器 + 方法装饰器**配合可实现参数校验和依赖注入
4. **装饰器工厂**让装饰器可配置传参，是 NestJS 等框架的标准模式
5. **元数据**机制是依赖注入的基石，\`reflect-metadata\` 让运行时类型检查成为可能

### 与 AI Agent 的关联

装饰器在 Agent 开发中会以下列形式出现：

- **NestJS 后端服务**：\`@Controller()\`、\`@Injectable()\`、\`@Get()\` 构建 Agent API 服务
- **工具自动注册**：用类装饰器自动将工具注册到 Agent 工具表
- **调用增强**：用方法装饰器为 LLM 调用添加重试、缓存、日志、限流
- **参数校验**：参数装饰器标记必填项，配合方法装饰器校验输入
- **未来框架**：LangChain.js 等框架的 Agent 定义可能逐步采用装饰器模式

---

## 十二、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| TypeScript 中文网 - 装饰器 | https://ts.nodejs.cn/docs/handbook/decorators.html | 官方装饰器文档中文版，内容完整 |
| TypeScript 中文文档 - 装饰器 | https://www.tslang.com.cn/zh/docs/handbook/decorators.html | 装饰器中文翻译，含所有类型 |
| TypeScript 中文手册 - 装饰器 | https://typescript.bootcss.com/decorators.html | Bootcss 镜像，经典稳定 |
| TypeScript 中文网 - 手册入口 | https://ts.nodejs.cn/docs/handbook/intro.html | 手册总目录 |
| TypeScript 练习场 | https://www.typescriptlang.org/play | 在线练习（需科学上网） |

> **注意**：TypeScript 5.0 起支持 Stage 3 装饰器规范，文档顶部会有提示。当前主流 Node.js 框架仍使用 Stage 2 装饰器，建议优先学习 Stage 2。

---

## 十三、明日预告

**Day 3：TypeScript Async/Await 与 Promise**

- 异步编程模型：Promise 链式调用与 async/await 语法糖
- 并发控制：Promise.all、Promise.race、Promise.allSettled
- 错误处理：try/catch、catch 链、finally
- Agent 交互的基础：LLM API 调用是异步的，工具执行也是异步的

异步编程是 AI Agent 开发的核心基础——几乎所有 Agent 操作（LLM 调用、工具执行、流式响应）都是异步的。掌握 async/await 是理解后续所有框架代码的前提。

---

> 🚀 Day 2 完成！装饰器是 Node.js 后端框架的灵魂，打好基础才能在后续 Agent 服务开发中游刃有余。

    `.trim(),
  },

  {
    id: '12',
    title: `AI Agent 学习计划 Day 3：TypeScript Async/Await 与 Promise`,
    slug: 'ai-agent-day3-typescript-async-await',
    date: '2026-07-04',
    tags: ['TypeScript', 'AI Agent', '学习笔记'],
    excerpt: `AI Agent 84 天学习计划第三天。系统学习 TypeScript 异步编程：回调地狱、Promise 三态与链式调用、async/await 语法糖、并发控制（Promise.all/race/allSettled/any）、错误处理策略、串行与并行、并发限制器，并实现带重试的 LLM 调用、多步推理 Agent、批量处理等实战应用。`,
    readingTime: 30,
    content: `# AI Agent 学习计划 Day 3：TypeScript Async/Await 与 Promise

> 📅 日期：2026-07-04  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 3 / 84（3.6%）

## 前言

Day 1 我们学了 TypeScript 类型系统，Day 2 学了装饰器。今天进入一个对所有 AI Agent 开发者都至关重要的主题——**异步编程**。

为什么异步编程是 Agent 交互的基础？因为 Agent 的每一次操作几乎都是异步的：调用 LLM API 需要等待网络响应（可能几秒甚至几十秒）、执行工具需要等待 I/O、流式接收 token 需要逐块处理。如果用同步方式编写，整个程序会卡死在等待中。\`async/await\` 和 \`Promise\` 是 JavaScript 处理异步操作的两大核心武器，也是后续理解 LangChain.js 链式调用、Vercel AI SDK 流式响应的前提。

本文将从回调地狱讲起，系统覆盖 Promise 三态与链式调用、async/await 语法糖、并发控制（Promise.all / race / allSettled）、错误处理策略，最终落地到 Agent 开发中的实际应用。

---

## 一、为什么需要异步编程

### 1.1 JavaScript 的单线程模型

JavaScript 是单线程的（Node.js 主线程也是），这意味着同一时刻只能执行一个任务。如果用同步方式调用 LLM API：

\`\`\`typescript
// ❌ 同步方式：整个程序卡住 5 秒
function callLLMSync(prompt: string): string {
  // 假设有同步的 HTTP 请求（实际上 Node.js 没有原生同步 HTTP）
  const response = blockingHttpRequest('https://api.openai.com/...', prompt)
  return response
}

console.log('1. 开始')
const result = callLLMSync('你好')  // 卡住 5 秒
console.log('2. 收到回复:', result)
console.log('3. 结束')
// 1. 开始
// （5 秒后）
// 2. 收到回复: ...
// 3. 结束
\`\`\`

在这 5 秒内，程序什么都做不了——无法处理其他请求、无法更新 UI、无法接收用户输入。

### 1.2 异步编程的演进

\`\`\`
回调函数（Callback） → Promise → async/await → 异步迭代器（for await...of）
   回调地狱          链式调用      同步写法        流式处理
\`\`\`

### 1.3 回调地狱（Callback Hell）

最早的异步方案是回调函数，但多层嵌套会导致「回调地狱」：

\`\`\`typescript
// ❌ 回调地狱：难以阅读和维护
callLLM('分析这段代码', (err, analysis) => {
  if (err) return console.error(err)
  callLLM(\`根据分析重写: \${analysis}\`, (err, rewrite) => {
    if (err) return console.error(err)
    callLLM(\`添加测试: \${rewrite}\`, (err, test) => {
      if (err) return console.error(err)
      callLLM(\`优化性能: \${test}\`, (err, optimized) => {
        if (err) return console.error(err)
        console.log('最终结果:', optimized)
      })
    })
  })
})
\`\`\`

Promise 的出现就是为了解决这个问题。

---

## 二、Promise 基础

### 2.1 Promise 的三种状态

Promise 是一个表示异步操作最终结果的对象，有三种状态：

\`\`\`
                    ┌──→ fulfilled（已兑现）──→ .then()
 pending（待定）──┤
                    └──→ rejected（已拒绝）──→ .catch()
\`\`\`

- **pending**：初始状态，既没有兑现也没有拒绝
- **fulfilled**：操作成功完成
- **rejected**：操作失败

> **关键**：状态一旦从 pending 变为 fulfilled 或 rejected，就不可逆转。

### 2.2 创建 Promise

\`\`\`typescript
// 基本创建
const promise = new Promise<string>((resolve, reject) => {
  // 模拟异步操作
  setTimeout(() => {
    const success = Math.random() > 0.5
    if (success) {
      resolve('操作成功')  // pending → fulfilled
    } else {
      reject(new Error('操作失败'))  // pending → rejected
    }
  }, 1000)
})

promise.then(result => console.log(result))
       .catch(err => console.error(err.message))
\`\`\`

### 2.3 Promise 的类型安全

在 TypeScript 中，Promise 是泛型类 \`Promise<T>\`，\`T\` 是 resolve 值的类型：

\`\`\`typescript
// 明确指定 resolve 的类型
const fetchUser = (id: number): Promise<{ id: number; name: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ id, name: 'Agent-' + id }), 500)
  })
}

// TypeScript 知道 user 的类型是 { id: number; name: string }
fetchUser(1).then(user => {
  console.log(user.name)  // ✅ 类型安全
  // console.log(user.age)  // ❌ 类型错误
})
\`\`\`

### 2.4 快捷方法

\`\`\`typescript
// Promise.resolve：直接创建已兑现的 Promise
const p1 = Promise.resolve('立即完成')

// Promise.reject：直接创建已拒绝的 Promise
const p2 = Promise.reject(new Error('立即失败'))

// 包装已有值
const wrapped: Promise<number> = Promise.resolve(42)
\`\`\`

---

## 三、Promise 链式调用

### 3.1 then 的返回值

\`then\` 返回一个新的 Promise，因此可以链式调用：

\`\`\`typescript
fetchUser(1)
  .then(user => {
    console.log('用户:', user.name)
    return fetchUserPosts(user.id)  // 返回新的 Promise
  })
  .then(posts => {
    console.log('文章数:', posts.length)
    return posts[0]
  })
  .then(post => {
    console.log('第一篇文章:', post.title)
  })
  .catch(err => {
    console.error('链中任一环节出错:', err)
  })
\`\`\`

### 3.2 链式调用的返回值规则

\`\`\`typescript
// 规则1：返回普通值 → 包装成 Promise.resolve(值)
Promise.resolve(1)
  .then(x => x + 1)        // 返回 2
  .then(x => x * 3)        // 返回 6
  .then(x => console.log(x)) // 6

// 规则2：返回 Promise → 等待该 Promise 完成
Promise.resolve(1)
  .then(x => fetchUser(x))  // 返回 Promise，等待完成
  .then(user => console.log(user.name))

// 规则3：不返回值 → 相当于返回 undefined
Promise.resolve(1)
  .then(x => { console.log(x) })  // 返回 undefined
  .then(x => console.log(x))       // undefined
\`\`\`

### 3.3 用 Promise 链改造回调地狱

\`\`\`typescript
// ✅ 用 Promise 链消除回调地狱
callLLM('分析这段代码')
  .then(analysis => callLLM(\`根据分析重写: \${analysis}\`))
  .then(rewrite => callLLM(\`添加测试: \${rewrite}\`))
  .then(test => callLLM(\`优化性能: \${test}\`))
  .then(optimized => console.log('最终结果:', optimized))
  .catch(err => console.error('出错:', err))
\`\`\`

---

## 四、async/await 语法糖

### 4.1 async 函数

\`async\` 关键字声明的函数总是返回 Promise：

\`\`\`typescript
// async 函数自动将返回值包装成 Promise
async function greet(name: string): Promise<string> {
  return \`Hello, \${name}\`  // 等价于 return Promise.resolve(\`Hello, \${name}\`)
}

// 等价的普通函数
function greetPlain(name: string): Promise<string> {
  return Promise.resolve(\`Hello, \${name}\`)
}
\`\`\`

### 4.2 await 关键字

\`await\` 暂停 async 函数的执行，等待 Promise 完成，然后返回结果：

\`\`\`typescript
async function run() {
  console.log('1. 开始')

  // await 暂停执行，等待 Promise 完成
  const result = await callLLM('你好')
  console.log('2. 收到:', result)

  console.log('3. 结束')
}

run()
// 1. 开始
// （等待中...）
// 2. 收到: ...
// 3. 结束
\`\`\`

> **关键理解**：\`await\` 不会阻塞整个程序，它只暂停当前 async 函数。在等待期间，事件循环可以处理其他任务。

### 4.3 用 async/await 改写回调地狱

\`\`\`typescript
// ✅ async/await 让异步代码看起来像同步代码
async function processCode() {
  try {
    const analysis = await callLLM('分析这段代码')
    const rewrite = await callLLM(\`根据分析重写: \${analysis}\`)
    const test = await callLLM(\`添加测试: \${rewrite}\`)
    const optimized = await callLLM(\`优化性能: \${test}\`)
    console.log('最终结果:', optimized)
  } catch (err) {
    console.error('出错:', err)
  }
}

processCode()
\`\`\`

### 4.4 async/await 的类型推导

\`\`\`typescript
// await 会自动 unwrap Promise 的类型
async function example() {
  // fetchUser 返回 Promise<{ id: number; name: string }>
  const user = await fetchUser(1)
  // user 的类型是 { id: number; name: string }，不是 Promise<...>

  console.log(user.name)  // ✅ 直接访问
}

// 在非 async 上下文中无法使用 await
function badExample() {
  // const user = await fetchUser(1)  // ❌ 语法错误
}
\`\`\`

---

## 五、错误处理

### 5.1 try/catch（async/await 方式）

\`\`\`typescript
async function riskyOperation() {
  try {
    const result = await callLLM('危险操作')
    return result
  } catch (err) {
    // err 的类型是 unknown（TypeScript 4.4+）
    if (err instanceof Error) {
      console.error(err.message)
    }
    throw err  // 重新抛出，让上层处理
  }
}
\`\`\`

### 5.2 .catch()（Promise 链方式）

\`\`\`typescript
callLLM('危险操作')
  .then(result => {
    // 处理结果
  })
  .catch(err => {
    // 捕获链中任意环节的错误
    console.error(err)
  })
  .finally(() => {
    // 无论成功失败都执行（清理资源）
    console.log('操作结束')
  })
\`\`\`

### 5.3 错误处理策略对比

\`\`\`typescript
// 策略1：统一捕获（推荐简单场景）
async function strategy1() {
  try {
    const a = await step1()
    const b = await step2(a)
    const c = await step3(b)
    return c
  } catch (err) {
    // 任何步骤出错都会到这里
    console.error('某步出错:', err)
    return null
  }
}

// 策略2：逐步捕获（需要不同错误处理）
async function strategy2() {
  const a = await step1().catch(err => {
    console.error('step1 失败，使用默认值:', err)
    return 'default-a'
  })

  const b = await step2(a).catch(err => {
    console.error('step2 失败，使用默认值:', err)
    return 'default-b'
  })

  return b
}
\`\`\`

### 5.4 工具函数：安全包装

\`\`\`typescript
// 将 Promise 转换为 [error, data] 元组，避免 try/catch 嵌套
async function to<T>(
  promise: Promise<T>
): Promise<[Error, null] | [null, T]> {
  try {
    return [null, await promise]
  } catch (err) {
    return [err as Error, null]
  }
}

// 使用：Go 风格的错误处理
async function main() {
  const [err, user] = await to(fetchUser(1))
  if (err) {
    console.error('获取用户失败:', err.message)
    return
  }
  console.log('用户:', user.name)

  const [err2, posts] = await to(fetchUserPosts(user.id))
  if (err2) {
    console.error('获取文章失败:', err2.message)
    return
  }
  console.log('文章数:', posts.length)
}
\`\`\`

---

## 六、并发控制

### 6.1 Promise.all：全部成功才成功

\`\`\`typescript
// 并行执行多个任务，全部完成才返回
async function fetchAll() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(1),
    fetchUserPosts(1),
    fetchUserComments(1)
  ])
  // 三个请求并行，总耗时 ≈ 最慢的那个
  console.log(user, posts, comments)
}

// 任一失败则整体失败
Promise.all([
  Promise.resolve('a'),
  Promise.reject(new Error('b 失败')),
  Promise.resolve('c')
]).catch(err => console.error(err.message))  // 'b 失败'
\`\`\`

### 6.2 Promise.race：最快完成即返回

\`\`\`typescript
// 超时控制：5 秒内必须完成
async function callWithTimeout() {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('超时')), 5000)
  )

  const result = await Promise.race([
    callLLM('你好'),
    timeout
  ])
  return result
}
\`\`\`

### 6.3 Promise.allSettled：等待全部完成（无论成败）

\`\`\`typescript
// 批量调用，收集所有结果（含失败）
async function batchCall(prompts: string[]) {
  const results = await Promise.allSettled(
    prompts.map(p => callLLM(p))
  )

  const succeeded = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map(r => r.value)

  const failed = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => r.reason)

  console.log(\`成功 \${succeeded.length} 个，失败 \${failed.length} 个\`)
  return succeeded
}
\`\`\`

### 6.4 Promise.any：任一成功即成功

\`\`\`typescript
// 多源竞速：从多个 LLM 提供商获取，谁先成功用谁
async function fastLLMCall(prompt: string) {
  const result = await Promise.any([
    callOpenAI(prompt),
    callAnthropic(prompt),
    callLocalModel(prompt)
  ])
  // 返回第一个成功的结果
  return result
  // 如果全部失败，抛出 AggregateError
}
\`\`\`

### 6.5 四种并发方法对比

| 方法 | 行为 | 全部成功 | 任一失败 |
|------|------|---------|---------|
| \`Promise.all\` | 全部完成 | 返回结果数组 | 抛出第一个错误 |
| \`Promise.race\` | 最快完成 | 返回最快的结果 | 抛出最快的错误 |
| \`Promise.allSettled\` | 全部敲定 | 返回状态数组 | 返回状态数组（含失败） |
| \`Promise.any\` | 任一成功 | 返回第一个成功值 | 全失败才抛 AggregateError |

---

## 七、串行与并行

### 7.1 串行执行（依次等待）

\`\`\`typescript
// ❌ 错误写法：看似并行，实则串行
async function wrongParallel() {
  // 每个 await 都会等待，变成串行
  const a = await fetchUser(1)    // 等 500ms
  const b = await fetchUser(2)    // 再等 500ms
  const c = await fetchUser(3)    // 再等 500ms
  // 总耗时：1500ms
}

// ✅ 串行执行（有时是必须的：后一步依赖前一步）
async function serial() {
  const a = await step1()
  const b = await step2(a)  // 依赖 a
  const c = await step3(b)  // 依赖 b
  return c
}
\`\`\`

### 7.2 并行执行（同时发起）

\`\`\`typescript
// ✅ 正确的并行：先创建所有 Promise，再 await
async function correctParallel() {
  // 三个 Promise 同时创建，同时发起请求
  const p1 = fetchUser(1)
  const p2 = fetchUser(2)
  const p3 = fetchUser(3)

  // 然后一起 await
  const [a, b, c] = await Promise.all([p1, p2, p3])
  // 总耗时：约 500ms（最慢的那个）
}

// ✅ 更简洁的写法
async function parallel() {
  const [a, b, c] = await Promise.all([
    fetchUser(1),
    fetchUser(2),
    fetchUser(3)
  ])
  // 总耗时：约 500ms
}
\`\`\`

### 7.3 串行遍历（for...of + await）

\`\`\`typescript
// 串行处理数组：一个完成才开始下一个
async function serialProcess(items: string[]) {
  const results: string[] = []
  for (const item of items) {
    const result = await callLLM(item)  // 等待前一个完成
    results.push(result)
  }
  return results
}
\`\`\`

### 7.4 并行遍历（map + Promise.all）

\`\`\`typescript
// 并行处理数组：同时发起所有请求
async function parallelProcess(items: string[]) {
  const results = await Promise.all(
    items.map(item => callLLM(item))
  )
  return results
}
\`\`\`

### 7.5 ⚠️ forEach 的陷阱

\`\`\`typescript
// ❌ forEach 不会等待 async 回调！
async function buggyForEach(items: string[]) {
  items.forEach(async (item) => {
    await callLLM(item)  // 不会等待！
  })
  console.log('完成')  // 会在所有 callLLM 完成前就执行
}

// ✅ 用 for...of 代替 forEach 实现串行
async function correctForOf(items: string[]) {
  for (const item of items) {
    await callLLM(item)  // 会等待
  }
  console.log('完成')
}
\`\`\`

---

## 八、并发限制器

当需要批量调用 LLM API（如处理 100 条数据），一次性 \`Promise.all\` 会触发速率限制。需要限制并发数：

### 8.1 简易并发池

\`\`\`typescript
async function asyncPool<T, R>(
  limit: number,
  items: T[],
  iteratorFn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: Promise<R>[] = []
  const executing = new Set<Promise<R>>()

  for (const item of items) {
    // 并发数已满，等待其中一个完成
    if (executing.size >= limit) {
      await Promise.race(executing)
    }

    const promise = iteratorFn(item)
    results.push(promise)
    executing.add(promise)

    promise.finally(() => executing.delete(promise))
  }

  return Promise.all(results)
}

// 使用：限制并发为 3，处理 10 条数据
const prompts = ['你好', '写诗', '翻译', '总结', /* ... */]
const results = await asyncPool(3, prompts, async (prompt) => {
  return callLLM(prompt)
})
\`\`\`

### 8.2 Agent 工具并发调用

\`\`\`typescript
class Agent {
  async runWithTools(query: string) {
    // 并发调用多个工具，限制并发为 3
    const tools = [
      () => this.searchTool(query),
      () => this.dbTool(query),
      () => this.weatherTool(),
      () => this.calculatorTool(query),
      () => this.fileTool(query),
    ]

    const results = await asyncPool(3, tools, async (fn) => fn())

    // 整合所有工具结果，发给 LLM
    const answer = await this.callLLM({
      query,
      toolResults: results
    })

    return answer
  }
}
\`\`\`

---

## 九、Agent 开发实战应用

### 9.1 调用 LLM API（基本模式）

\`\`\`typescript
interface LLMResponse {
  choices: Array<{ message: { content: string } }>
}

async function callLLM(
  prompt: string,
  options?: { temperature?: number; model?: string }
): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? 0.7
      })
    })

    if (!response.ok) {
      throw new Error(\`API 错误: \${response.status} \${response.statusText}\`)
    }

    const data: LLMResponse = await response.json()
    return data.choices[0].message.content
  } catch (err) {
    console.error('LLM 调用失败:', err)
    throw err
  }
}

// 使用
const answer = await callLLM('什么是 AI Agent?')
console.log(answer)
\`\`\`

### 9.2 带重试的 LLM 调用

\`\`\`typescript
async function callLLMWithRetry(
  prompt: string,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<string> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callLLM(prompt)
    } catch (err) {
      lastError = err as Error
      console.log(\`第 \${i + 1} 次尝试失败: \${lastError.message}\`)

      if (i < maxRetries - 1) {
        // 指数退避
        await new Promise(r => setTimeout(r, delay * Math.pow(2, i)))
      }
    }
  }

  throw lastError!
}

// 使用：自动重试 3 次
const result = await callLLMWithRetry('复杂问题', 3, 1000)
\`\`\`

### 9.3 多步推理（ReAct 模式简化版）

\`\`\`typescript
async function reactAgent(query: string): Promise<string> {
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: '你是一个会使用工具的 AI Agent' },
    { role: 'user', content: query }
  ]

  const MAX_STEPS = 5

  for (let step = 0; step < MAX_STEPS; step++) {
    // 1. 思考：调用 LLM 决定下一步
    const thought = await callLLM(JSON.stringify(messages))
    messages.push({ role: 'assistant', content: thought })

    // 2. 判断是否需要调用工具
    const toolMatch = thought.match(/工具:\\s*(\\w+)\\((.+)\\)/)
    if (!toolMatch) {
      // 不需要工具，返回最终答案
      return thought
    }

    // 3. 执行工具
    const [, toolName, toolInput] = toolMatch
    const toolResult = await executeTool(toolName, toolInput)
    messages.push({ role: 'tool', content: toolResult })
  }

  return '达到最大步数限制'
}

async function executeTool(name: string, input: string): Promise<string> {
  switch (name) {
    case 'search':
      return await searchWeb(input)
    case 'calculate':
      return String(eval(input))
    default:
      return \`未知工具: \${name}\`
  }
}
\`\`\`

### 9.4 批量处理与并发控制

\`\`\`typescript
// 批量处理大量文档，限制并发避免 API 限流
async function batchProcessDocuments(
  documents: string[],
  batchSize: number = 3
): Promise<string[]> {
  const results: string[] = []

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)
    // 每批并行处理
    const batchResults = await Promise.all(
      batch.map(doc => callLLM(\`总结: \${doc}\`))
    )
    results.push(...batchResults)
    console.log(\`已完成 \${Math.min(i + batchSize, documents.length)}/\${documents.length}\`)
  }

  return results
}

const docs = ['文档1...', '文档2...', '文档3...', '文档4...', '文档5...']
const summaries = await batchProcessDocuments(docs, 3)
\`\`\`

---

## 十、综合实战练习

### 练习 1：实现带超时和取消的异步任务

\`\`\`typescript
// 支持超时和取消的异步执行器
async function runWithTimeoutAndCancel<T>(
  task: Promise<T>,
  options: { timeout?: number; signal?: AbortSignal }
): Promise<T> {
  const { timeout = 10000, signal } = options

  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(
      () => reject(new Error('任务超时')),
      timeout
    )
    // 如果任务先完成，清除定时器
    task.finally(() => clearTimeout(timer))
  })

  const cancelPromise = new Promise<never>((_, reject) => {
    if (signal) {
      if (signal.aborted) {
        reject(new Error('任务已取消'))
      }
      signal.addEventListener('abort', () => {
        reject(new Error('任务已取消'))
      })
    }
  })

  return Promise.race([task, timeoutPromise, cancelPromise])
}

// 使用
const controller = new AbortController()
setTimeout(() => controller.abort(), 3000)  // 3 秒后取消

const result = await runWithTimeoutAndCancel(
  callLLM('长文本生成'),
  { timeout: 10000, signal: controller.signal }
).catch(err => {
  console.error(err.message)  // '任务已取消' 或 '任务超时'
  return '默认回复'
})
\`\`\`

### 练习 2：实现 Promise 队列

\`\`\`typescript
// 顺序执行异步任务队列
class AsyncTaskQueue<T> {
  private queue: Array<() => Promise<T>> = []
  private processing = false

  add(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await task())
        } catch (err) {
          reject(err)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const task = this.queue.shift()!
      await task()
    }

    this.processing = false
  }
}

// 使用：确保 LLM 调用按顺序执行
const queue = new AsyncTaskQueue<string>()
queue.add(() => callLLM('第一步')).then(r => console.log('1:', r))
queue.add(() => callLLM('第二步')).then(r => console.log('2:', r))
queue.add(() => callLLM('第三步')).then(r => console.log('3:', r))
// 严格按 1 → 2 → 3 顺序执行
\`\`\`

### 练习 3：缓存 + 并发的 LLM 客户端

\`\`\`typescript
class CachedLLMClient {
  private cache = new Map<string, string>()
  private pending = new Map<string, Promise<string>>()

  async call(prompt: string): Promise<string> {
    // 1. 检查缓存
    if (this.cache.has(prompt)) {
      return this.cache.get(prompt)!
    }

    // 2. 检查是否有相同的请求正在进行
    if (this.pending.has(prompt)) {
      return this.pending.get(prompt)!  // 复用进行中的请求
    }

    // 3. 发起新请求
    const promise = callLLM(prompt)
      .then(result => {
        this.cache.set(prompt, result)
        this.pending.delete(prompt)
        return result
      })
      .catch(err => {
        this.pending.delete(prompt)
        throw err
      })

    this.pending.set(prompt, promise)
    return promise
  }
}

// 使用：相同 prompt 只调用一次 API
const client = new CachedLLMClient()
const [a, b] = await Promise.all([
  client.call('你好'),  // 发起请求
  client.call('你好')   // 复用同一个请求
])
console.log(a === b)  // true
\`\`\`

---

## 十一、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| Promise | 三态（pending/fulfilled/rejected），状态不可逆 |
| then | 链式调用，返回新 Promise |
| async/await | Promise 的语法糖，让异步代码像同步 |
| try/catch | async/await 的错误处理方式 |
| Promise.all | 全部成功才成功，任一失败则失败 |
| Promise.race | 最快完成即返回（成功或失败） |
| Promise.allSettled | 等待全部完成，收集所有结果 |
| Promise.any | 任一成功即成功，全失败才失败 |
| 并行 vs 串行 | Promise.all 并行，for...of+await 串行 |
| forEach 陷阱 | forEach 不等待 async 回调 |

### 关键收获

1. **Promise 三态**：pending → fulfilled/rejected，状态不可逆，是异步编程的基础
2. **async/await** 是 Promise 的语法糖，让异步代码读起来像同步，但本质仍是异步
3. **错误处理**：async/await 用 try/catch，Promise 用 .catch()，注意 err 类型是 unknown
4. **四种并发方法**：all（全部成功）、race（最快）、allSettled（全部完成）、any（任一成功）
5. **并行 vs 串行**：\`Promise.all([fn1(), fn2()])\` 并行，\`for...of + await\` 串行
6. **forEach 陷阱**：forEach 不会等待 async 回调，用 for...of 代替
7. **并发限制**：asyncPool 模式限制并发数，避免 API 限流

### 与 AI Agent 的关联

异步编程在 Agent 开发中的核心应用：

- **LLM API 调用**：所有 LLM 调用都是异步的，需要 await 等待响应
- **工具并发调用**：Agent 同时调用多个工具时用 Promise.all 并行
- **流式响应**：LLM 流式输出用 \`for await...of\` 逐块处理（Day 5 已学）
- **重试与超时**：网络不稳定时需要自动重试和超时控制
- **批量处理**：处理大量数据时需要并发限制，避免 API 限流
- **ReAct 模式**：多步推理中，每一步都是异步的，需要串行 await

---

## 十二、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| MDN 中文 - 如何使用 Promise | https://developer.mozilla.org/zh-CN/docs/Learn/JavaScript/Asynchronous/Promises | 官方中文教程，含 async/await |
| 菜鸟教程 - TypeScript async/await | https://www.runoob.com/typescript/ts-async-await.html | 入门友好，语法速查 |
| CSDN - TypeScript 异步编程详解 | https://blog.csdn.net/gitblog_00236/article/details/154891979 | Promise + async/await + 生成器 |
| JavaScript中文网 - TS Promise 和 async/await | https://www.javascriptcn.com/post/657e7d15d2f5e1655d950cbe | 类型安全实践 |
| 掘金 - TypeScript 异步处理 | https://juejin.cn/post/7418233427420954675 | async/await 详解 |

> **提示**：MDN 中文版（developer.mozilla.org）在国内可正常访问，是学习 JavaScript 异步编程最权威的中文资源。

---

## 十三、明日预告

**Day 4：TypeScript 模块系统与工程化配置**

- ESM 与 CJS 的区别与兼容
- 动态导入 \`import()\`
- tsconfig.json 核心配置
- ESLint + Prettier 代码规范

模块系统是组织大型 Agent 项目的基础，工程化配置确保代码质量和团队协作。掌握它们，你就拥有了构建可维护 Agent 项目的能力。

---

> ⚡ Day 3 完成！异步编程是 AI Agent 开发的生命线——每一次 LLM 调用、每一次工具执行都离不开它。掌握 async/await，你就掌握了 Agent 交互的钥匙。
`
  },
  {
    id: '13',
    title: `AI Agent 学习计划 Day 4：TypeScript 模块系统与工程化配置`,
    slug: 'ai-agent-day4-typescript-modules-tooling',
    date: '2026-07-05',
    tags: ['TypeScript', 'AI Agent', '学习笔记'],
    excerpt: `AI Agent 84 天学习计划第四天。系统学习 TypeScript 模块系统与工程化：CommonJS vs ES Modules 区别与互操作、动态导入 import()、tsconfig.json 核心配置（strict/module/target/moduleResolution）、ESLint Flat Config + Prettier 集成、路径别名、环境变量管理，并搭建完整 Agent 项目骨架。`,
    readingTime: 30,
    content: `# AI Agent 学习计划 Day 4：TypeScript 模块系统与工程化配置

> 📅 日期：2026-07-05  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 4 / 84（4.8%）

## 前言

前三天我们打好了 TypeScript 语言基础——类型系统（Day 1）、装饰器（Day 2）、异步编程（Day 3）。今天进入工程化主题：**模块系统与项目配置**。

为什么这个主题重要？因为当你开始构建真实的 AI Agent 项目时，代码不可能全写在一个文件里。你需要把 LLM 客户端、工具定义、Agent 逻辑、Prompt 模板拆分成多个模块。而 Node.js 生态系统有两套模块系统——**CommonJS（CJS）** 和 **ES Modules（ESM）**——它们的混用是无数开发者踩过的坑。同时，\`tsconfig.json\` 的配置直接影响编译行为，ESLint + Prettier 保证代码质量。

本文将从模块系统讲起，覆盖 ESM/CJS 兼容、动态导入、tsconfig 核心配置、ESLint + Prettier 集成，最终搭建一个完整的 TypeScript Agent 工程化项目骨架。

---

## 一、模块系统概述

### 1.1 为什么需要模块

没有模块系统时，所有代码共享全局作用域，容易命名冲突、难以维护：

\`\`\`typescript
// ❌ 没有模块：全局污染
// file1.ts
const apiKey = 'sk-xxx'
function callLLM() { /* ... */ }

// file2.ts
const apiKey = 'sk-yyy'  // 冲突！覆盖了 file1 的 apiKey
\`\`\`

模块系统让每个文件成为独立作用域，通过 \`import\`/\`export\` 显式声明依赖：

\`\`\`typescript
// ✅ 有模块：独立作用域
// llm-client.ts
const apiKey = 'sk-xxx'  // 模块私有
export function callLLM() { /* ... */ }

// agent.ts
import { callLLM } from './llm-client'  // 显式导入
\`\`\`

### 1.2 两大模块系统

| 特性 | CommonJS (CJS) | ES Modules (ESM) |
|------|----------------|-------------------|
| 语法 | \`require()\` / \`module.exports\` | \`import\` / \`export\` |
| 起源 | Node.js 原生（2009） | ECMAScript 标准（2015） |
| 加载 | 运行时动态加载 | 编译时静态分析 |
| \`this\` | 指向 \`module.exports\` | \`undefined\` |
| 循环依赖 | 返回部分导出 | 引用绑定（支持） |
| 顶层 await | ❌ 不支持 | ✅ 支持 |
| Tree Shaking | ❌ 不支持 | ✅ 支持 |
| 使用场景 | Node.js 传统项目 | 现代 Node.js、前端、全栈 |

---

## 二、CommonJS (CJS)

### 2.1 导出与导入

\`\`\`typescript
// math.cjs
// 导出单个值
module.exports.add = (a: number, b: number) => a + b
module.exports.subtract = (a: number, b: number) => a - b

// 或者批量导出
module.exports = {
  add,
  subtract,
  multiply
}

// 导入
const { add, subtract } = require('./math')
const math = require('./math')
math.add(1, 2)
\`\`\`

### 2.2 CJS 的特点

\`\`\`typescript
// 1. 运行时加载：可以条件加载
if (needsFeature) {
  const feature = require('./feature')  // 动态加载
}

// 2. require 返回的是值的拷贝（非引用）
// counter.cjs
let count = 0
function increment() { count++ }
module.exports = { count, increment }

// main.cjs
const { count, increment } = require('./counter')
increment()
console.log(count)  // 0（不是 1！因为是拷贝）
\`\`\`

---

## 三、ES Modules (ESM)

### 3.1 导出方式

\`\`\`typescript
// math.ts
// 命名导出
export function add(a: number, b: number) { return a + b }
export function subtract(a: number, b: number) { return a - b }

// 默认导出（每个模块只能有一个）
export default class Calculator {
  static multiply(a: number, b: number) { return a * b }
}

// 聚合导出（re-export）
export { add as plus } from './math'
export * from './utils'  // 导出 utils 的所有命名导出
\`\`\`

### 3.2 导入方式

\`\`\`typescript
// 命名导入
import { add, subtract } from './math'

// 默认导入
import Calculator from './math'

// 混合导入
import Calculator, { add, subtract } from './math'

// 命名空间导入
import * as math from './math'
math.add(1, 2)

// 只导入副作用（不绑定任何值）
import './polyfill'  // 执行模块代码但不导入

// 类型导入（TypeScript 特有）
import type { User, Post } from './types'
\`\`\`

### 3.3 ESM 的特点

\`\`\`typescript
// 1. 静态分析：import 必须在顶层，不能条件加载
// ❌ 错误
if (needsFeature) {
  import { feature } from './feature'  // 语法错误
}

// ✅ 用动态 import() 代替
if (needsFeature) {
  const { feature } = await import('./feature')
}

// 2. 导出的是引用绑定（非拷贝）
// counter.ts
export let count = 0
export function increment() { count++ }

// main.ts
import { count, increment } from './counter'
increment()
console.log(count)  // 1（是引用！）

// 3. 顶层 await（ESM 支持）
const config = await fetch('/config').then(r => r.json())
export default config
\`\`\`

---

## 四、Node.js 中的模块判定

### 4.1 package.json 的 type 字段

\`\`\`json
// package.json
{
  "type": "commonjs"  // 默认，.js 文件按 CJS 处理
}

// 或
{
  "type": "module"    // .js 文件按 ESM 处理
}
\`\`\`

### 4.2 文件扩展名规则

| 扩展名 | type: "commonjs" | type: "module" |
|--------|-----------------|----------------|
| \`.js\` | CJS | ESM |
| \`.cjs\` | CJS | CJS |
| \`.mjs\` | ESM | ESM |

\`\`\`typescript
// 最清晰的策略：
// - 用 .ts 编写，TypeScript 编译后输出 .mjs（ESM）或 .cjs（CJS）
// - 在 package.json 中明确 "type": "module"
\`\`\`

### 4.3 TypeScript 中的模块配置

\`\`\`json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",        // 生成 ESM 代码
    "moduleResolution": "bundler",  // 模块解析策略
    "target": "ES2022",        // 支持顶层 await
    "esModuleInterop": true    // 允许 CJS 和 ESM 互操作
  }
}
\`\`\`

### 4.4 ESM/CJS 互操作

\`\`\`typescript
// 在 ESM 中导入 CJS 模块
import pkg from 'commonjs-package'  // default import 获取 module.exports
import { named } from 'commonjs-package'  // 可能不工作（取决于工具）

// 安全写法
import pkg from 'commonjs-package'
const { named } = pkg

// 在 CJS 中导入 ESM（必须动态）
async function main() {
  const esmModule = await import('./esm-module.mjs')
  esmModule.namedFunction()
}
\`\`\`

---

## 五、动态导入 import()

### 5.1 基本用法

\`import()\` 返回一个 Promise，可以在运行时动态加载模块：

\`\`\`typescript
// 条件加载
async function loadTool(toolName: string) {
  switch (toolName) {
    case 'search':
      const { SearchTool } = await import('./tools/search')
      return new SearchTool()
    case 'calculator':
      const { CalculatorTool } = await import('./tools/calculator')
      return new CalculatorTool()
    default:
      throw new Error(\`未知工具: \${toolName}\`)
  }
}

const tool = await loadTool('search')
\`\`\`

### 5.2 Agent 中的按需加载

\`\`\`typescript
// 按需加载工具，减少启动时间
class Agent {
  private tools = new Map<string, any>()

  async loadTool(name: string) {
    if (this.tools.has(name)) {
      return this.tools.get(name)
    }

    // 动态导入，只在需要时加载
    const module = await import(\`./tools/\${name}.js\`)
    const Tool = module.default
    const instance = new Tool()
    this.tools.set(name, instance)
    return instance
  }

  async useTool(name: string, input: string) {
    const tool = await this.loadTool(name)
    return tool.execute(input)
  }
}
\`\`\`

### 5.3 类型安全的动态导入

\`\`\`typescript
// 定义工具接口
interface Tool {
  name: string
  execute(input: string): Promise<string>
}

// 类型安全的动态导入
async function loadToolTypeSafe(name: string): Promise<Tool> {
  try {
    const module = await import(\`./tools/\${name}.js\`) as {
      default: new () => Tool
    }
    return new module.default()
  } catch (err) {
    throw new Error(\`工具 \${name} 加载失败: \${err}\`)
  }
}
\`\`\`

---

## 六、tsconfig.json 核心配置

### 6.1 完整的 Agent 项目配置

\`\`\`json
{
  "compilerOptions": {
    /* 基础选项 */
    "target": "ES2022",          // 编译目标，支持顶层 await
    "module": "ESNext",           // 生成 ESM 模块代码
    "moduleResolution": "bundler",// 现代模块解析策略
    "lib": ["ES2022"],            // 包含的 API 库

    /* 严格类型检查 */
    "strict": true,               // 开启所有严格检查
    "noImplicitAny": true,        // 禁止隐式 any
    "strictNullChecks": true,     // 严格 null 检查
    "noUnusedLocals": true,       // 检查未使用的局部变量
    "noUnusedParameters": true,   // 检查未使用的参数
    "noImplicitReturns": true,    // 确保函数所有路径都返回
    "noFallthroughCasesInSwitch": true, // switch 防止穿透

    /* 模块互操作 */
    "esModuleInterop": true,      // CJS/ESM 互操作
    "allowSyntheticDefaultImports": true, // 允许 default import CJS
    "resolveJsonModule": true,    // 允许 import JSON

    /* 输出 */
    "outDir": "./dist",           // 编译输出目录
    "rootDir": "./src",           // 源代码根目录
    "declaration": true,          // 生成 .d.ts 类型声明
    "sourceMap": true,            // 生成 source map
    "removeComments": false,      // 保留注释

    /* 高级 */
    "skipLibCheck": true,         // 跳过 .d.ts 类型检查（加速）
    "forceConsistentCasingInFileNames": true // 文件名大小写一致
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
\`\`\`

### 6.2 关键配置详解

#### target（编译目标）

\`\`\`json
"target": "ES2022"
// 决定编译后的 JS 版本
// ES2022 支持：顶层 await、类字段、Error.cause
// 如果需要兼容旧环境，用 ES2020 或更低
\`\`\`

#### module（模块系统）

\`\`\`json
"module": "ESNext"
// ESNext: 生成 ESM 代码（import/export）
// CommonJS: 生成 CJS 代码（require/module.exports）
// NodeNext: 根据 package.json type 自动选择
\`\`\`

#### moduleResolution（模块解析）

\`\`\`json
"moduleResolution": "bundler"
// node: Node.js 经典解析（CJS 风格）
// bundler: 适合 Vite/webpack 等打包工具
// NodeNext: 配合 module: "NodeNext" 使用
\`\`\`

#### strict（严格模式）

\`\`\`typescript
// strict: true 等价于开启以下所有选项：
// - noImplicitAny: 禁止隐式 any
// - strictNullChecks: null/undefined 需要显式处理
// - strictFunctionTypes: 函数类型严格检查
// - strictBindCallApply: bind/call/apply 严格检查
// - strictPropertyInitialization: 类属性必须初始化
// - noImplicitThis: 禁止隐式 this
// - alwaysStrict: 输出 'use strict'

// strictNullChecks 的影响：
function getUserName(user?: { name: string }) {
  return user.name  // ❌ 错误：user 可能是 undefined
  return user?.name // ✅ 可选链
  return user!.name // ✅ 非空断言（确定 user 存在时）
}
\`\`\`

### 6.3 项目引用（Project References）

大型项目可以拆分为多个子项目：

\`\`\`json
// tsconfig.json（根）
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

// tsconfig.app.json（前端应用）
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist/app"
  },
  "include": ["src/**/*"]
}

// tsconfig.node.json（Node.js 后端）
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist/server"
  },
  "include": ["server/**/*"]
}
\`\`\`

---

## 七、ESLint 配置

### 7.1 安装

\`\`\`bash
npm install -D eslint @eslint/js typescript-eslint
\`\`\`

### 7.2 配置文件（Flat Config，ESLint 9+）

\`\`\`javascript
// eslint.config.js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      // TypeScript 特定规则
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // 通用规则
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
    }
  },
  {
    ignores: ['dist/', 'node_modules/']
  }
)
\`\`\`

### 7.3 Agent 项目特定的 ESLint 规则

\`\`\`javascript
rules: {
  // 允许 async 函数中的 await
  '@typescript-eslint/await-thenable': 'error',
  // 禁止无意义的 async
  '@typescript-eslint/no-async-promise-executor': 'error',
  // 要求 Promise 错误处理
  '@typescript-eslint/no-floating-promises': 'error',
  // 禁止返回未 await 的 Promise
  '@typescript-eslint/require-await': 'warn',
  // 必须处理 Promise rejection
  '@typescript-eslint/no-misused-promises': 'error',
}
\`\`\`

---

## 八、Prettier 配置

### 8.1 安装

\`\`\`bash
npm install -D prettier eslint-config-prettier
\`\`\`

### 8.2 配置文件

\`\`\`json
// .prettierrc
{
  "semi": false,           // 不使用分号
  "singleQuote": true,     // 单引号
  "trailingComma": "es5",  // 尾随逗号
  "printWidth": 100,       // 行宽 100
  "tabWidth": 2,           // 缩进 2 空格
  "arrowParens": "always", // 箭头函数参数总是加括号
  "endOfLine": "lf"        // 统一换行符
}
\`\`\`

### 8.3 ESLint 与 Prettier 集成

\`\`\`javascript
// eslint.config.js
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,  // 放在最后，关闭与 Prettier 冲突的规则
  // ...
)
\`\`\`

### 8.4 package.json 脚本

\`\`\`json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit"
  }
}
\`\`\`

---

## 九、完整 Agent 项目骨架

### 9.1 目录结构

\`\`\`
ai-agent-project/
├── src/
│   ├── index.ts              # 入口
│   ├── agent/
│   │   ├── Agent.ts          # Agent 核心类
│   │   └── types.ts          # 类型定义
│   ├── llm/
│   │   └── LLMClient.ts      # LLM 客户端
│   ├── tools/
│   │   ├── index.ts          # 工具注册表
│   │   ├── search.ts         # 搜索工具
│   │   └── calculator.ts     # 计算器工具
│   └── utils/
│       └── retry.ts          # 重试工具
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── package.json
└── .env
\`\`\`

### 9.2 核心文件实现

\`\`\`typescript
// src/agent/types.ts
export interface Tool {
  name: string
  description: string
  execute(input: string): Promise<string>
}

export interface AgentConfig {
  model: string
  temperature: number
  maxSteps: number
}
\`\`\`

\`\`\`typescript
// src/llm/LLMClient.ts
import type { AgentConfig } from '../agent/types'

export class LLMClient {
  constructor(private config: AgentConfig) {}

  async chat(prompt: string): Promise<string> {
    // 调用 LLM API...
    return \`回复: \${prompt}\`
  }
}
\`\`\`

\`\`\`typescript
// src/tools/search.ts
import type { Tool } from '../agent/types'

export class SearchTool implements Tool {
  name = 'search'
  description = '搜索互联网获取信息'

  async execute(query: string): Promise<string> {
    return \`搜索结果: \${query}\`
  }
}
\`\`\`

\`\`\`typescript
// src/tools/index.ts
export { SearchTool } from './search'
export { CalculatorTool } from './calculator'
\`\`\`

\`\`\`typescript
// src/agent/Agent.ts
import { LLMClient } from '../llm/LLMClient'
import type { Tool, AgentConfig } from './types'

export class Agent {
  private llm: LLMClient
  private tools: Map<string, Tool> = new Map()

  constructor(config: AgentConfig) {
    this.llm = new LLMClient(config)
  }

  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool)
  }

  async run(query: string): Promise<string> {
    return this.llm.chat(query)
  }
}
\`\`\`

\`\`\`typescript
// src/index.ts
import { Agent } from './agent/Agent'
import { SearchTool } from './tools'

const agent = new Agent({
  model: 'gpt-4',
  temperature: 0.7,
  maxSteps: 5
})

agent.registerTool(new SearchTool())

const result = await agent.run('你好，请介绍一下自己')
console.log(result)
\`\`\`

### 9.3 package.json

\`\`\`json
{
  "name": "ai-agent-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.5.0",
    "eslint": "^9.0.0",
    "@eslint/js": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "eslint-config-prettier": "^9.0.0"
  }
}
\`\`\`

---

## 十、综合实战练习

### 练习 1：配置 tsconfig 支持路径别名

\`\`\`json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@agent/*": ["src/agent/*"],
      "@tools/*": ["src/tools/*"],
      "@llm/*": ["src/llm/*"]
    }
  }
}
\`\`\`

\`\`\`typescript
// 使用路径别名（更清晰的导入）
import { Agent } from '@/agent/Agent'
import { SearchTool } from '@tools/search'
import { LLMClient } from '@llm/LLMClient'

// 而不是相对路径
// import { Agent } from '../../agent/Agent'
\`\`\`

配合 \`tsx\` 或 \`tsconfig-paths\` 在运行时解析别名。

### 练习 2：实现环境变量管理

\`\`\`typescript
// src/config/env.ts
import 'dotenv/config'

function required(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(\`环境变量 \${key} 未设置\`)
  }
  return value
}

export const env = {
  openaiApiKey: required('OPENAI_API_KEY'),
  model: process.env.MODEL || 'gpt-4',
  temperature: Number(process.env.TEMPERATURE) || 0.7,
  maxRetries: Number(process.env.MAX_RETRIES) || 3,
} as const
\`\`\`

\`\`\`bash
# .env
OPENAI_API_KEY=sk-xxx
MODEL=gpt-4
TEMPERATURE=0.7
MAX_RETRIES=3
\`\`\`

### 练习 3：ESLint 自定义规则检测未处理的 Promise

\`\`\`javascript
// eslint.config.js 中添加规则
rules: {
  // 检测未处理的 Promise（Agent 开发中非常重要）
  '@typescript-eslint/no-floating-promises': 'error',

  // 检测 async 函数中可能的 Promise 误用
  '@typescript-eslint/no-misused-promises': [
    'error',
    {
      checksVoidReturn: {
        attributes: false
      }
    }
  ],

  // 确保 await 的目标是 Promise
  '@typescript-eslint/await-thenable': 'error',
}

// ❌ 会被 ESLint 报错
// async function bad() {
//   callLLM('hello')  // 漏了 await！floating promise
// }

// ✅ 正确
// async function good() {
//   await callLLM('hello')
// }
\`\`\`

---

## 十一、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| CommonJS | \`require\`/\`module.exports\`，运行时加载，值拷贝 |
| ES Modules | \`import\`/\`export\`，静态分析，引用绑定 |
| package.json type | \`"module"\` = ESM，\`"commonjs"\` = CJS |
| 动态导入 | \`import()\` 返回 Promise，运行时加载 |
| tsconfig strict | 开启所有严格类型检查 |
| esModuleInterop | 允许 ESM 方式导入 CJS 模块 |
| ESLint | 代码质量检查，检测潜在 bug |
| Prettier | 代码格式化，统一风格 |

### 关键收获

1. **两套模块系统**：CJS（require）是 Node.js 传统，ESM（import）是现代标准，优先使用 ESM
2. **package.json type** 决定 \`.js\` 文件按哪种模块处理，\`.mjs\`/\`.cjs\` 可显式指定
3. **动态导入** \`import()\` 可以在运行时按需加载模块，适合 Agent 工具懒加载
4. **tsconfig strict** 是 TypeScript 项目的基石，开启所有严格检查
5. **esModuleInterop** 解决 ESM 导入 CJS 的兼容问题
6. **ESLint + Prettier**：ESLint 管代码质量，Prettier 管代码格式，配合使用
7. **路径别名** \`@/*\` 让导入更清晰，需要 tsconfig paths + 运行时解析

### 与 AI Agent 的关联

模块系统与工程化在 Agent 开发中的应用：

- **模块拆分**：LLM 客户端、工具、Agent 逻辑、Prompt 模板分模块管理
- **动态加载**：Agent 工具按需 \`import()\` 加载，减少启动时间
- **类型安全**：strict 模式 + 类型导入确保 Agent 代码的类型安全
- **ESLint 规则**：\`no-floating-promises\` 检测漏掉的 await，防止 Agent 异步 bug
- **环境变量**：API Key 等配置通过 .env 管理，不硬编码
- **项目骨架**：标准化的目录结构和配置，是团队协作的基础

---

## 十二、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| TypeScript 中文网 - 模块文档 | https://ts.nodejs.cn/docs/handbook/modules.html | 官方模块系统中文文档 |
| 掘金 - ESM 与 CommonJS 全面对比 | https://juejin.cn/post/7501295666687033382 | 加载机制、作用域、语法对比 |
| 掘金 - Node.js 模块化全面指南 | https://juejin.cn/post/7537708966147948578 | CJS 和 ESM 实战指南 |
| 博客园 - CommonJS 和 ES Module 本质区别 | https://www.cnblogs.com/smileZAZ/p/19646596 | 静态依赖 vs 动态加载 |
| 菜鸟教程 - TypeScript 教程 | https://www.runoob.com/typescript/ts-tutorial.html | 含 tsconfig 基础 |
| TypeScript 中文网 - 手册入口 | https://ts.nodejs.cn/docs/handbook/intro.html | 完整手册导航 |

> **提示**：TypeScript 中文网（ts.nodejs.cn）是国内可访问的官方文档中文镜像，模块、tsconfig 等文档均可在此查阅。ESLint 和 Prettier 建议参考官方英文文档，配置相对简单。

---

## 十三、明日预告

**Day 5：Node.js Stream 与 Buffer**

- Buffer：二进制数据处理
- Stream 四大类型：Readable、Writable、Duplex、Transform
- 背压机制（Backpressure）
- pipeline 现代写法
- LLM 流式响应实战

从 TypeScript 工程化过渡到 Node.js 核心能力。Stream 是处理 LLM 流式响应的底层基础，Buffer 是数据传输的容器。掌握它们，你就理解了 ChatGPT 逐字输出的原理。

---

> 🛠️ Day 4 完成！模块系统和工程化配置是构建可维护 Agent 项目的地基。打好这个地基，后续的框架学习和项目实战才能稳如泰山。
`
  },
  {
    id: '5',
    title: 'AI Agent 学习计划 Day 1：TypeScript 类型系统与类型推断',
    slug: 'ai-agent-day1-typescript-type-system',
    date: '2026-07-02',
    tags: ['TypeScript', 'AI Agent', '学习笔记'],
    excerpt: 'AI Agent 84 天学习计划第一天。系统梳理 TypeScript 类型系统四大核心概念：泛型、联合类型、交叉类型、条件类型，并给出 Agent 开发场景中的实际应用。',
    readingTime: 25,
    content: `
# AI Agent 学习计划 Day 1：TypeScript 类型系统与类型推断

> 📅 日期：2026-07-02  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 1 / 84（1.2%）

## 前言

今天是 AI Agent 84 天学习计划的第一天。作为构建 AI Agent 的语言基础，我们从 TypeScript 类型系统开始。TypeScript 的类型系统不仅是 JavaScript 的静态类型补充，更是后续理解 LangChain.js、Vercel AI SDK 等框架中复杂类型定义的钥匙。

本文将系统梳理四个核心概念：**泛型、联合类型、交叉类型、条件类型**，并给出在 Agent 开发场景中的实际应用思考。

---

## 一、泛型（Generics）

### 1.1 为什么需要泛型

泛型是「类型的参数化」——让一个函数、接口或类能够适用于多种类型，同时保持类型安全。在 Agent 开发中，工具的输入输出类型千差万别，泛型是抽象这些差异的关键。

### 1.2 泛型函数

\`\`\`typescript
// 不使用泛型：丢失类型信息
function identity(value: any): any {
  return value
}
const result = identity('hello') // result 类型为 any，失去类型保护

// 使用泛型：保留类型信息
function identity<T>(value: T): T {
  return value
}
const result = identity('hello') // result 类型为 string
const num = identity(42)         // num 类型为 number
\`\`\`

### 1.3 泛型约束（Constraints）

使用 \`extends\` 限制泛型参数的范围：

\`\`\`typescript
// 约束 T 必须包含 length 属性
function getLength<T extends { length: number }>(value: T): number {
  return value.length
}

getLength('hello')    // ✅ 5
getLength([1, 2, 3])  // ✅ 3
getLength(42)         // ❌ 类型不满足约束
\`\`\`

### 1.4 泛型在 Agent 开发中的应用

\`\`\`typescript
// 定义 Agent 工具的泛型接口
interface AgentTool<TInput, TOutput> {
  name: string
  description: string
  execute: (input: TInput) => Promise<TOutput>
}

// 一个搜索工具
const searchTool: AgentTool<string, string[]> = {
  name: 'web_search',
  description: '搜索互联网获取信息',
  execute: async (query: string) => {
    // ... 返回搜索结果数组
    return [\`关于 \${query} 的结果1\`, \`关于 \${query} 的结果2\`]
  }
}
\`\`\`

### 1.5 多类型参数与默认值

\`\`\`typescript
// 多类型参数
function pair<A, B>(first: A, second: B): [A, B] {
  return [first, second]
}

// 默认类型参数
interface Box<T = string> {
  value: T
}
const strBox: Box = { value: 'hello' }       // T 默认为 string
const numBox: Box<number> = { value: 42 }     // 显式指定 number
\`\`\`

---

## 二、联合类型（Union Types）

### 2.1 基本用法

联合类型表示一个值可以是几种类型之一，使用 \`|\` 分隔：

\`\`\`typescript
type ID = string | number

function findById(id: ID) {
  // id 可以是 string 或 number
  console.log(typeof id) // 'string' 或 'number'
}
\`\`\`

### 2.2 字面量联合类型

非常实用的模式，用于表示有限的取值集合：

\`\`\`typescript
type ThemeMode = 'light' | 'dark' | 'auto'
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

function setTheme(mode: ThemeMode) {
  // ...
}
setTheme('light')  // ✅
setTheme('blue')   // ❌ 不在允许范围内
\`\`\`

### 2.3 类型收窄（Type Narrowing）

TypeScript 会根据控制流自动收窄联合类型：

\`\`\`typescript
type ToolResult =
  | { status: 'success'; data: string }
  | { status: 'error'; message: string }

function handleResult(result: ToolResult) {
  if (result.status === 'success') {
    // 这里 result 被收窄为 { status: 'success'; data: string }
    console.log(result.data)  // ✅ 可以访问 data
    console.log(result.message) // ❌ Error: 不存在 message
  } else {
    // 这里 result 被收窄为 { status: 'error'; message: string }
    console.log(result.message) // ✅ 可以访问 message
  }
}
\`\`\`

### 2.4 类型守卫（Type Guards）

使用 \`typeof\`、\`in\`、\`instanceof\` 自定义类型收窄逻辑：

\`\`\`typescript
// typeof 守卫
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase() // value 是 string
  }
  return value.toFixed(2)     // value 是 number
}

// in 守卫
interface Bird { fly: () => void }
interface Fish { swim: () => void }

function move(animal: Bird | Fish) {
  if ('fly' in animal) {
    animal.fly()
  } else {
    animal.swim()
  }
}

// 自定义类型谓词（Type Predicate）
function isError(x: unknown): x is Error {
  return x instanceof Error
}
\`\`\`

### 2.5 Agent 中的联合类型应用

\`\`\`typescript
// LLM 返回的消息类型
type Message =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: ToolCall[] }
  | { role: 'tool'; content: string; toolCallId: string }
  | { role: 'system'; content: string }

function sendMessage(msg: Message) {
  switch (msg.role) {
    case 'user':
      console.log(\`用户: \${msg.content}\`)
      break
    case 'assistant':
      console.log(\`助手: \${msg.content}\`)
      msg.toolCalls?.forEach(call => executeTool(call))
      break
    case 'tool':
      console.log(\`工具结果: \${msg.content}\`)
      break
  }
}
\`\`\`

---

## 三、交叉类型（Intersection Types）

### 3.1 基本概念

交叉类型使用 \`&\` 将多个类型合并为一个，表示「同时满足所有类型」：

\`\`\`typescript
interface Nameable { name: string }
interface Loggable { log: () => void }

type Entity = Nameable & Loggable
// Entity 同时拥有 name 和 log

const entity: Entity = {
  name: 'Agent',
  log: () => console.log('logging...')
}
\`\`\`

### 3.2 与联合类型的对比

| 特性 | 联合类型 \`A | B\` | 交叉类型 \`A & B\` |
|------|------------------|-------------------|
| 语义 | 「或」——满足其一即可 | 「且」——必须同时满足 |
| 取值范围 | A 的值 ∪ B 的值 | A 的值 ∩ B 的值 |
| 属性 | 只能访问共有属性 | 可访问所有属性 |

### 3.3 Mixin 模式

交叉类型非常适合实现 Mixin：

\`\`\`typescript
type Constructor<T = {}> = new (...args: any[]) => T

// 可日志化的 Mixin
function withLogging<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    log(msg: string) {
      console.log(\`[\${new Date().toISOString()}] \${msg}\`)
    }
  }
}

// 可序列化的 Mixin
function withSerializable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    serialize() {
      return JSON.stringify(this)
    }
  }
}

class BaseAgent {
  constructor(public name: string) {}
}

// 组合多个能力
const EnhancedAgent = withSerializable(withLogging(BaseAgent))
const agent = new EnhancedAgent('MyAgent')
agent.log('启动')       // 来自 withLogging
agent.serialize()       // 来自 withSerializable
\`\`\`

### 3.4 Agent 能力组合

\`\`\`typescript
interface ToolUser {
  useTool: (name: string, input: unknown) => Promise<unknown>
}

interface MemoryHolder {
  remember: (key: string, value: unknown) => void
  recall: (key: string) => unknown
}

interface Planner {
  plan: (goal: string) => string[]
}

// 一个完整的 Agent 同时具备三种能力
type FullAgent = ToolUser & MemoryHolder & Planner
\`\`\`

---

## 四、条件类型（Conditional Types）

### 4.1 基本语法

条件类型根据类型关系做分支判断，语法类似三元表达式：

\`\`\`typescript
type IsString<T> = T extends string ? true : false

type A = IsString<'hello'>  // true
type B = IsString<42>       // false
type C = IsString<string>   // true
\`\`\`

### 4.2 infer 关键字

\`infer\` 在条件类型中声明待推断的类型变量，是提取类型信息的利器：

\`\`\`typescript
// 提取函数返回值类型
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never

type Fn = (x: number) => string
type R = MyReturnType<Fn>  // string

// 提取函数参数类型（第一个参数）
type FirstParam<T> = T extends (first: infer P, ...rest: any[]) => any ? P : never

type P = FirstParam<(id: number, name: string) => void>  // number

// 提取 Promise 的内部类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

type Inner = UnwrapPromise<Promise<number>>  // number
\`\`\`

### 4.3 分布式条件类型

当条件类型作用于「裸类型参数」的联合类型时，会分布式地应用到每个成员：

\`\`\`typescript
type ToArray<T> = T extends any ? T[] : never

type Result = ToArray<string | number>
// 等价于 ToArray<string> | ToArray<number>
// 即 string[] | number[]
\`\`\`

利用这个特性可以实现 \`Exclude\` 和 \`Extract\`：

\`\`\`typescript
// 手写 Exclude
type MyExclude<T, U> = T extends U ? never : T

type T1 = MyExclude<'a' | 'b' | 'c', 'a'>  // 'b' | 'c'

// 手写 Extract
type MyExtract<T, U> = T extends U ? T : never

type T2 = MyExtract<'a' | 'b' | 'c', 'a' | 'b'>  // 'a' | 'b'
\`\`\`

### 4.4 内置工具类型

TypeScript 提供了许多基于条件类型的工具类型：

\`\`\`typescript
// ReturnType - 获取函数返回类型
type R1 = ReturnType<() => string>  // string

// Parameters - 获取函数参数类型（元组）
type P1 = Parameters<(a: number, b: string) => void>  // [number, string]

// Awaited - 递归解包 Promise
type A1 = Awaited<Promise<Promise<number>>>  // number

// InstanceType - 获取构造函数实例类型
class Foo { bar = 1 }
type I1 = InstanceType<typeof Foo>  // Foo

// Partial - 所有属性变可选
interface Config { host: string; port: number }
type PartialConfig = Partial<Config>  // { host?: string; port?: number }
\`\`\`

### 4.5 Agent 场景中的条件类型实战

\`\`\`typescript
// 根据工具名称推断其输入类型
interface SearchInput { query: string; limit?: number }
interface CodeInput { language: string; code: string }

interface ToolMap {
  search: { input: SearchInput; output: string[] }
  execute_code: { input: CodeInput; output: string }
}

type ToolInput<K extends keyof ToolMap> = ToolMap[K]['input']
type ToolOutput<K extends keyof ToolMap> = ToolMap[K]['output']

// 类型推断：调用 search 工具时，输入自动推导为 SearchInput
function callTool<K extends keyof ToolMap>(
  name: K,
  input: ToolInput<K>
): Promise<ToolOutput<K>> {
  // 实现省略
  return null as any
}

// ✅ 类型安全：TypeScript 知道 query 是必填的
callTool('search', { query: 'AI Agent', limit: 10 })
// ❌ 类型错误：execute_code 需要 language 和 code
callTool('execute_code', { query: 'test' })
\`\`\`

---

## 五、综合实战练习

### 练习 1：实现类型安全的 Agent 消息构建器

\`\`\`typescript
type Role = 'system' | 'user' | 'assistant' | 'tool'

interface BaseMessage {
  role: Role
  content: string
}

interface ToolMessage extends BaseMessage {
  role: 'tool'
  toolCallId: string
}

interface AssistantMessage extends BaseMessage {
  role: 'assistant'
  toolCalls?: Array<{
    id: string
    function: { name: string; arguments: string }
  }>
}

type ChatMessage = BaseMessage | ToolMessage | AssistantMessage

// 条件类型：根据 role 推断消息类型
type MessageByRole<R extends Role> = Extract<ChatMessage, { role: R }>

function createMessage<R extends Role>(
  role: R,
  content: string,
  extra?: Omit<MessageByRole<R>, 'role' | 'content'>
): MessageByRole<R> {
  return { role, content, ...extra } as MessageByRole<R>
}

// 使用
const toolMsg = createMessage('tool', 'result', { toolCallId: 'call_123' })
const userMsg = createMessage('user', '你好')
\`\`\`

### 练习 2：实现 DeepPartial

\`\`\`typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

interface AgentConfig {
  model: { name: string; temperature: number }
  tools: { search: boolean; codeExec: boolean }
}

// 所有字段都变成可选
const config: DeepPartial<AgentConfig> = {
  model: { temperature: 0.7 }  // name 可选
}
\`\`\`

---

## 六、学习总结

| 概念 | 核心语法 | 典型场景 |
|------|---------|---------|
| 泛型 | \`<T>\` | 可复用的函数/接口/类 |
| 联合类型 | \`A \\| B\` | 多种可能的类型、状态枚举 |
| 交叉类型 | \`A & B\` | 能力组合、类型合并 |
| 条件类型 | \`T extends U ? X : Y\` | 类型分支、类型推断提取 |

### 关键收获

1. **泛型**是构建通用 Agent 工具接口的基石，让工具的输入输出类型化
2. **联合类型 + 类型收窄**是处理 LLM 多种消息格式的核心手段
3. **交叉类型**可以优雅地组合 Agent 的多种能力（工具使用、记忆、规划）
4. **条件类型 + infer**是理解 LangChain.js / Vercel AI SDK 复杂类型定义的钥匙

### 与 AI Agent 的关联

这些类型系统特性在后续学习中会频繁出现：
- LangChain.js 的 \`Runnable<RunInput, RunOutput>\` 泛型
- Vercel AI SDK 的 \`tool()\` 函数使用 Zod 做参数校验，背后是条件类型
- 多 Agent 编排中，消息流的类型安全依赖联合类型与收窄

---

## 七、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| TypeScript 中文网 - 手册 | https://ts.nodejs.cn/docs/handbook/intro.html | 手册入口，内容完整 |
| TypeScript 中文网 - 泛型 | https://ts.nodejs.cn/docs/handbook/2/generics.html | 泛型专题 |
| TypeScript 中文网 - 类型收窄 | https://ts.nodejs.cn/docs/handbook/2/narrowing.html | 类型收窄专题 |
| TypeScript 中文网 - 条件类型 | https://ts.nodejs.cn/docs/handbook/2/conditional-types.html | 条件类型专题 |
| TypeScript 中文文档 | https://www.tslang.com.cn/zh/docs/handbook/intro.html | 官方手册中文翻译 |
| TypeScript 中文手册 (Bootcss) | https://typescript.bootcss.com/ | 经典中文镜像 |
| TypeScript 类型体操 | https://github.com/type-challenges/type-challenges | 进阶练习题库 |

---

## 八、明日预告

**Day 2：TypeScript 装饰器（Decorators）**

- 类装饰器、方法装饰器、属性装饰器、参数装饰器
- 装饰器工厂
- 在 NestJS 等 Node.js 框架中的应用

装饰器是理解后端框架（如 NestJS）依赖注入和路由机制的基础，在 Agent 后端服务开发中会大量使用。

---

> 💪 84 天学习计划已正式启动，千里之行始于足下！

    `.trim(),
  },

  {
    id: "15",
    title: "AI Agent 学习计划 Day 13：AI Agent 概念 — Memory 与 Planning",
    slug: "ai-agent-day13-memory-planning",
    date: "2026-07-14",
    tags: ["AI Agent","记忆","规划","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第十三天。深入 Agent 两大核心能力：记忆系统（短期记忆/长期记忆/工作记忆/情景记忆、记忆管理策略与向量检索）与规划能力（任务分解、Chain-of-Thought / Tree-of-Thought 多步推理、ReAct 的 Thought-Action-Observation 循环、Plan-and-Execute、反思机制 Reflexion、动态重规划），并讲解 Memory + Planning 如何协同让 Agent 完成复杂任务。",
    readingTime: 35,
    content: "# AI Agent 学习计划 Day 13：AI Agent 概念 — Memory 与 Planning\n\n> 📅 日期：2026-07-14  \n> 🎯 阶段一：基础入门（Day 1-14）  \n> 📊 学习进度：Day 13 / 84（15.5%）\n\n## 前言\n\nDay 10 我们建立了 Agent 的整体认知：Agent = LLM（大脑）+ 工具（手）+ 记忆（心）+ 规划（思维）。Day 11、12 原计划深入 Prompt Engineering 与 Function Calling——这两个能力是 Agent 与 LLM 高效沟通、调用工具的基础。今天我们把焦点放到 Agent 另外两个决定「能否成事」的核心能力上：**记忆（Memory）** 与 **规划（Planning）**。\n\n如果说 LLM 是「聪明的大脑」，工具是「能干的手」，那么：\n\n- **记忆** 让 Agent 拥有「经验」——不会转头就忘；\n- **规划** 让 Agent 拥有「章法」——面对复杂目标不会手足无措。\n\n两者结合，Agent 才能从「一问一答的聊天机器人」进化为「能独立完成复杂任务的智能体」。\n\n---\n\n## 一、Agent 的记忆系统（Memory）\n\nLLM 本身是无状态的：每次 API 调用，它只看到你传给它的 `messages` 数组，调用结束即「失忆」。要让 Agent 跨轮次、跨会话保持上下文，必须引入记忆系统。\n\n### 1.1 四类记忆\n\n业界通常把 Agent 记忆划分为四个层次：\n\n| 记忆类型 | 类比 | 实现方式 | 容量 | 持久性 |\n|---------|------|---------|------|--------|\n| **短期记忆 Short-term** | 正在想的事 | LLM 上下文窗口（messages 数组） | 有限（几 K~几百 K Token） | 会话内 |\n| **工作记忆 Working** | 草稿本 | Scratchpad / 状态对象 | 可变 | 任务内 |\n| **长期记忆 Long-term** | 长期经验 | 向量数据库 + 摘要 | 近乎无限 | 永久 |\n| **情景记忆 Episodic** | 过去的经历 | 结构化事件存储 | 无限 | 永久 |\n\n### 1.2 短期记忆与上下文压缩\n\n短期记忆直接对应 LLM 的上下文窗口。当对话变长，超过窗口限制时会被截断，导致「前面说过的话忘了」。\n\n**解决策略——摘要压缩（Compaction）：**\n\n```typescript\nclass ShortTermMemory {\n  private messages: Message[] = []\n  private readonly maxTokens = 8000\n\n  add(msg: Message) {\n    this.messages.push(msg)\n    if (this.tokenCount() > this.maxTokens) {\n      this.compress()\n    }\n  }\n\n  // 把最早的 N 条消息摘要后，与最近消息合并\n  private async compress() {\n    const old = this.messages.slice(0, -10)\n    const recent = this.messages.slice(-10)\n    const summary = await llm.summarize(old)\n    this.messages = [\n      { role: 'system', content: `历史摘要：${summary}` },\n      ...recent,\n    ]\n  }\n}\n```\n\n### 1.3 长期记忆与向量检索\n\n长期记忆让 Agent「记得过去」。典型做法是把文本切块、向量化后存入向量数据库（如 Chroma、Qdrant、pgvector），需要时做相似度检索。\n\n```typescript\n// 长期记忆：写入与检索\ninterface LongTermMemory {\n  add(text: string, metadata?: Record<string, unknown>): Promise<void>\n  recall(query: string, topK?: number): Promise<string[]>\n}\n\nasync function remember(memory: LongTermMemory, fact: string) {\n  await memory.add(fact, { type: 'user-preference', ts: Date.now() })\n}\n\nasync function recall(memory: LongTermMemory, question: string) {\n  // 相似度检索相关记忆，注入到 prompt\n  const hits = await memory.recall(question, 5)\n  return hits.join('\\n')\n}\n```\n\n> **关键点**：长期记忆检索到的内容会被拼回上下文（短期记忆），形成「长期 → 短期」的回流。这是 RAG（检索增强生成）的核心思想，我们会在阶段三深入。\n\n### 1.4 工作记忆与情景记忆\n\n- **工作记忆**：保存当前任务的中间状态、推理草稿（Scratchpad）。ReAct 模式里的 `Thought` 就写在这里。\n- **情景记忆**：记录「我之前是怎么完成这类任务的」。Agent 从过去成功/失败的经验中学习，避免重复踩坑。\n\n### 1.5 记忆管理策略小结\n\n1. **写入策略**：什么值得记？（用户偏好、关键事实、任务结论）\n2. **压缩策略**：短期记忆超限时摘要；长期记忆定期合并去重。\n3. **检索策略**：长期记忆用向量相似度召回，而非全量塞回。\n4. **遗忘策略**：过期信息设 TTL 自动清理，避免噪声累积。\n\n---\n\n## 二、Agent 的规划能力（Planning）\n\n规划是把「一个模糊的大目标」拆成「一串可执行的小步骤」的能力。没有规划，Agent 遇到多步任务就会卡住。\n\n### 2.1 任务分解（Task Decomposition）\n\n最朴素的规划就是把任务拆成子任务，再递归拆到「单步可执行」。\n\n```text\n目标：调研并输出一份「2026 年 AI Agent 框架对比」报告\n\n规划：\n  ├── 1. 检索主流框架（LangChain / Vercel AI SDK / AutoGen / CrewAI）\n  ├── 2. 整理每个框架的定位、优缺点、适用场景\n  ├── 3. 设计对比维度表\n  ├── 4. 撰写报告正文\n  └── 5. 校对并输出\n```\n\n### 2.2 Chain-of-Thought（思维链）\n\n让 LLM 在给出答案前「把思考过程写出来」，显著提升复杂推理准确率。\n\n```text\n无 CoT：\n  Q: 球场有 23 人，走了 11 人，又来了 7 人，现在几人？\n  A: 19\n\n有 CoT：\n  Q: ...\n  A: 逐步算：23 - 11 = 12，12 + 7 = 19。答案是 19。\n```\n\n在 Agent 里，CoT 是「先想清楚再动手」的基础。\n\n### 2.3 Tree-of-Thought（思维树）\n\nCoT 是单链推理；ToT 则让 LLM 同时探索多条推理分支，评估后选择最优路径——适合需要「试错与回溯」的问题（如谜题、规划）。\n\n```text\n       根问题\n      /   |   \\\n   分支A  分支B  分支C\n    |      |      |\n  评估→ 剪枝   评估→ 保留\n              |\n           继续展开...\n```\n\n### 2.4 ReAct：Thought-Action-Observation 循环\n\nReAct（Reasoning + Acting）是 Agent 最经典的范式，把「推理」和「行动」交织在一起：\n\n```text\nThought: 用户问 2026 最新 GPT 模型，我的训练数据可能不含，需搜索\nAction: web_search(\"OpenAI GPT 最新模型 2026\")\nObservation: [结果] OpenAI 于 2026 发布 GPT-5 ...\nThought: 已确认最新是 GPT-5，可以作答\nFinal Answer: 2026 年 OpenAI 最新模型是 GPT-5。\n```\n\n```typescript\n// ReAct 最简循环骨架\nasync function reactLoop(goal: string, tools: Tool[]) {\n  const scratchpad = ''\n  for (let i = 0; i < MAX_STEPS; i++) {\n    const out = await llm({\n      system: REACT_PROMPT,\n      user: `目标：${goal}\\n${scratchpad}`,\n    })\n    if (out.finish) return out.answer\n    const obs = await runTool(tools, out.action, out.actionInput)\n    scratchpad += `\\nThought: ${out.thought}\\nAction: ${out.action}\\nObservation: ${obs}`\n  }\n}\n```\n\n### 2.5 Plan-and-Execute\n\nReAct 是「走一步看一步」；Plan-and-Execute 则先**一次性制定完整计划**，再逐步执行。优点是全局视野好，缺点是计划可能中途失效，需要配合「动态重规划」。\n\n```text\nPlanner LLM:  制定完整计划 → [步骤1, 步骤2, 步骤3, ...]\nExecutor:     逐步执行，每步把结果回传\nReplanner:    若某步失败/环境变化，重新规划剩余步骤\n```\n\n### 2.6 Reflexion：反思机制\n\nReflexion 让 Agent 在任务结束后「复盘」：哪里做错了？为什么？把反思写回记忆，下次改进。\n\n```typescript\nasync function reflect(trajectory: Step[], result: 'success' | 'fail') {\n  const lesson = await llm(`基于以下执行轨迹与结果，总结一条可复用的经验：\n轨迹：${trajectory}\n结果：${result}`)\n  await memory.add(lesson, { type: 'episodic' })\n}\n```\n\n### 2.7 动态重规划（Dynamic Replanning）\n\n现实任务充满意外。好的 Agent 会根据执行反馈调整计划：\n\n```typescript\ninterface Planner {\n  createPlan(goal: string): Plan\n  replan(plan: Plan, completed: Step[], lastResult: ToolResult): Plan\n}\n```\n\n---\n\n## 三、Memory + Planning 协同\n\n记忆与规划不是孤立的，它们彼此增强：\n\n```text\n┌─────────────────────────────────────────────┐\n│         Memory × Planning 协同闭环           │\n│                                               │\n│  长期记忆 ──检索──▶ 规划时参考历史经验         │\n│     ▲                    │                    │\n│     │                    ▼                    │\n│  执行结果 ──写入── 情景记忆（复盘经验）         │\n│     ▲                    │                    │\n│     │                    ▼                    │\n│  工作记忆 ◀──规划产出步骤 / 推理草稿           │\n│     │                                        │\n│     └──短期记忆承载当前轮上下文                │\n└─────────────────────────────────────────────┘\n```\n\n一句话：**规划决定「做什么」，记忆提供「凭什么做 / 做过什么」**。两者结合，Agent 才能稳定完成长周期、多步骤的复杂任务。\n\n---\n\n## 四、学习资料\n\n以下站点均已验证可访问（国内镜像 / 中文）：\n\n| 资源 | 链接 | 说明 |\n|------|------|------|\n| LangChain 中文文档 - 记忆概述 | https://langchain-doc.cn/v1/python/langgraph/memory.html | 记忆模块总览 |\n| LangChain 中文文档 - 短期记忆 | https://langchain-doc.cn/v1/python/langchain/short-term-memory.html | 短期记忆实现 |\n| Memory 记忆 \\| LangChain 中文学习手册 | https://www.langchain.online/langchain/memory | 中文手册 |\n| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | JS 版本文档 |\n| ReAct 推理与行动融合（知乎） | https://zhuanlan.zhihu.com/p/1935762059888419552 | ReAct 原理 |\n| ReAct Agent 终极指南（掘金） | https://juejin.cn/post/7518707715129688064 | 实战 |\n| ReAct Agent 原理与实战（腾讯云） | https://cloud.tencent.com/developer/article/2571430 | 原理+代码 |\n| AI Agent 架构设计 React/Plan-Exec/Reflect（腾讯云） | https://cloud.tencent.com.cn/developer/article/2655650 | 三种范式对比 |\n| LangChain Agent 架构设计详解（掘金） | https://juejin.cn/post/7535015508150517770 | 架构落地 |\n| 规划与工具调用原理（SegmentFault） | https://segmentfault.com/a/1190000047522016 | 规划原理 |\n\n---\n\n## 五、明日预告\n\n**Day 14：阶段一总结与复习**\n\n明天是阶段一的收官日。我们会用一张「知识地图」串联 Day 1-13 的全部要点（TypeScript 类型/装饰器/异步/工程化、Node Stream/EventLoop/EventEmitter/子进程/HTTP、Agent 概念/Memory/Planning），并给出一个贯穿全阶段的最小 Agent CLI 综合练习。\n\n> 🚀 Day 13 完成！记忆让 Agent「有经验」，规划让 Agent「有章法」。理解这两大能力，你就掌握了 Agent 从「会聊天」到「能办事」的关键一跃。",
  }
,
  {
    id: "16",
    title: "AI Agent 学习计划 Day 14：阶段一总结与复习 — TypeScript + Node.js + AI Agent 基础",
    slug: "ai-agent-day14-phase1-review",
    date: "2026-07-15",
    tags: ["AI Agent","复习","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第十四天，阶段一收官复习。用一张「知识地图」串联 Day 1-13 全部要点：TypeScript 类型/装饰器/异步/工程化、Node.js Stream/EventLoop/EventEmitter/子进程/HTTP、AI Agent 概念与 Memory/Planning，并给出一个贯穿全阶段的最小 Agent CLI 综合练习。",
    readingTime: 30,
    content: "# AI Agent 学习计划 Day 14：阶段一总结与复习\n\n> 📅 日期：2026-07-15  \n> 🎯 阶段一：基础入门（Day 1-14）收官  \n> 📊 学习进度：Day 14 / 84（16.7%）\n\n## 前言\n\n今天是我们 84 天学习计划的第一个里程碑——**阶段一（基础入门）收官**。过去 13 天，我们从 TypeScript 类型系统一路打到了 AI Agent 的 Memory 与 Planning。内容很多，今天用一张「知识地图」把它们串起来，并动手写一个**贯穿全阶段的最小 Agent CLI**，把所有知识点用一次。\n\n---\n\n## 一、阶段一知识地图\n\n### 1.1 TypeScript 基础（Day 1-4）\n\n| 天数 | 主题 | 在 Agent 中的作用 |\n|------|------|-----------------|\n| Day 1 | 类型系统与类型推断 | 工具参数、消息结构的类型安全 |\n| Day 2 | 装饰器 | 依赖注入、Agent 能力装配 |\n| Day 3 | async/await 与 Promise | Agent 每一步都是异步（调 LLM、跑工具） |\n| Day 4 | 模块系统与工程化 | 项目骨架、路径别名、环境变量 |\n\n### 1.2 Node.js 基础（Day 5-9）\n\n| 天数 | 主题 | 在 Agent 中的作用 |\n|------|------|-----------------|\n| Day 5 | Stream 与 Buffer | LLM 流式响应 |\n| Day 6 | Event Loop | 并发工具调用调度 |\n| Day 7 | EventEmitter | 事件驱动的多 Agent 协作 |\n| Day 8 | 子进程与 Worker Threads | 并行多 Agent、代码沙箱 |\n| Day 9 | HTTP/HTTPS | Agent 与 LLM/工具 API 通信 |\n\n### 1.3 AI Agent 概念（Day 10-13）\n\n| 天数 | 主题 | 核心要点 |\n|------|------|---------|\n| Day 10 | Agent 定义与 LLM | Agent = 感知+大脑+行动+记忆 |\n| Day 11 | Prompt Engineering | 与 LLM 高效沟通的技艺 |\n| Day 12 | Function Calling | LLM 原生工具调用 |\n| Day 13 | Memory 与 Planning | 经验 + 章法，让 Agent 能成事 |\n\n### 1.4 一张图看懂全局\n\n```text\n构建 AI Agent 的能力栈\n┌──────────────────────────────────────────────┐\n│  应用层：Agent / 多 Agent / RAG              │\n├──────────────────────────────────────────────┤\n│  框架层（阶段二）：LangChain.js / Vercel AI  │\n├──────────────────────────────────────────────┤\n│  概念层：Agent / Memory / Planning / Tools   │\n├──────────────────────────────────────────────┤\n│  运行时层：Node.js（Stream/EventLoop/HTTP）  │\n├──────────────────────────────────────────────┤\n│  语言层：TypeScript（类型/异步/工程化）       │\n└──────────────────────────────────────────────┘\n```\n\n---\n\n## 二、最小 Agent CLI 综合练习\n\n把前面所学串起来：一个支持 **ReAct + Function Calling + EventEmitter + Stream 流式** 的最小 Agent。\n\n```typescript\n// mini-agent-cli.ts\nimport { EventEmitter } from 'node:events'\nimport OpenAI from 'openai'\n\nconst client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })\nconst bus = new EventEmitter() // Day 7：事件总线\n\n// 工具（Day 12：Function Calling）\nconst tools = [\n  {\n    type: 'function' as const,\n    function: {\n      name: 'calculator',\n      description: '计算数学表达式',\n      parameters: {\n        type: 'object',\n        properties: { expr: { type: 'string' } },\n        required: ['expr'],\n      },\n    },\n  },\n]\n\nbus.on('tool', (name: string) => console.log(`🔧 调用工具: ${name}`))\n\nasync function runAgent(goal: string) {\n  const messages: any[] = [\n    { role: 'system', content: '你是 ReAct Agent，按需调用工具后给出最终答案。' },\n    { role: 'user', content: goal },\n  ]\n\n  for (let step = 0; step < 10; step++) {\n    const res = await client.chat.completions.create({\n      model: 'gpt-4o-mini',\n      messages,\n      tools,\n      stream: true, // Day 5：流式输出\n    })\n\n    let content = ''\n    for await (const chunk of res) {\n      const delta = chunk.choices[0]?.delta?.content ?? ''\n      content += delta\n      process.stdout.write(delta) // 流式打印\n    }\n\n    // 简化演示：若 LLM 请求调用工具，则执行（真实场景需解析 tool_calls）\n    if (content.includes('calculator')) {\n      bus.emit('tool', 'calculator')\n      messages.push({ role: 'assistant', content })\n      messages.push({ role: 'tool', content: '计算结果: 42', tool_call_id: 'call_1' })\n      continue\n    }\n    return content\n  }\n}\n\nrunAgent('帮我算一下 (123 + 456) * 2 等于多少？').then(() => process.exit(0))\n```\n\n这个几十行的例子，把阶段一的关键点都用上了：\n\n- **TypeScript**：类型标注与接口（`tools` 的 `type: 'function' as const`）。\n- **EventEmitter（Day 7）**：用事件总线解耦「工具调用」与「日志输出」。\n- **Stream（Day 5）**：`stream: true` 实时打印 LLM 输出。\n- **HTTP（Day 9）**：OpenAI SDK 底层就是 HTTPS 请求。\n- **async/await（Day 3）**：Agent 循环每一步都是异步。\n- **Function Calling（Day 12）**：工具定义与调用。\n- **ReAct / Planning（Day 13）**：循环推理—行动—观察。\n\n---\n\n## 三、阶段一自检清单\n\n- [ ] 能用 TypeScript 泛型与装饰器组织 Agent 代码\n- [ ] 理解 Event Loop，能解释「并发工具调用」如何调度\n- [ ] 能用 Stream 实现 LLM 流式输出\n- [ ] 能解释 Agent = LLM + 工具 + 记忆 + 规划\n- [ ] 能徒手写一个最小 ReAct 循环\n\n如果以上都能打勾，恭喜你，阶段一过关！\n\n---\n\n## 四、学习资料\n\n| 资源 | 链接 | 说明 |\n|------|------|------|\n| TypeScript 中文网 在线演练场 | https://ts.nodejs.cn/play/ | 在线练手 |\n| 48 道 TypeScript 练习题（掘金） | https://juejin.cn/post/7062903623470514207 | 巩固 TS |\n| learn-typescript 中文教程（GitHub） | https://github.com/mqyqingfeng/learn-typescript | 系统教程 |\n| Node.js 中文网 | http://nodejs.cn/api/ | 中文 API 文档 |\n\n---\n\n## 五、明日预告\n\n**Day 15：框架选型对比 — LangChain.js / Vercel AI SDK / AutoGen / CrewAI**\n\n阶段二正式开始！我们要在动手前先「选兵器」：四大主流 Agent 框架分别适合什么场景？本计划为什么先用 LangChain.js、再用 Vercel AI SDK？明天给你一张清晰的选型地图。\n\n> 🎉 阶段一完成！14 天里你从 TypeScript 一路打到了 AI Agent 概念。接下来 21 天（Day 15-35），我们将在真实框架里把 Agent 造出来。",
  }
,
  {
    id: "17",
    title: "AI Agent 学习计划 Day 15：框架选型对比 — LangChain.js / Vercel AI SDK / AutoGen / CrewAI",
    slug: "ai-agent-day15-framework-comparison",
    date: "2026-07-16",
    tags: ["AI Agent","框架","LangChain","Vercel AI SDK","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第十五天，阶段二启动。对比四大主流 Agent 框架的定位与适用场景：LangChain.js（生态最丰富）、Vercel AI SDK（轻量流式、前端友好）、AutoGen（微软多 Agent 协作）、CrewAI（角色扮演式多 Agent），并给出选型对比维度表与本计划的框架使用策略。",
    readingTime: 28,
    content: "# AI Agent 学习计划 Day 15：框架选型对比\n\n> 📅 日期：2026-07-16  \n> 🎯 阶段二：核心框架（Day 15-35）启动  \n> 📊 学习进度：Day 15 / 84（17.9%）\n\n## 前言\n\n阶段一我们理解了 Agent 的「原理」。从今天起进入阶段二——**用真实框架把 Agent 造出来**。但动手前先要「选兵器」：现在 Agent 框架多如牛毛，盲目上手容易踩坑。今天对比四个最具代表性的框架，帮你建立选型直觉。\n\n---\n\n## 一、四大框架定位\n\n### 1.1 LangChain.js —— 生态最丰富\n\n- **定位**：Agent / LLM 应用的全套工具箱。\n- **强项**：链式编排（LCEL）、海量集成（LLM/向量库/工具）、检索（RAG）成熟。\n- **弱项**：抽象层多，初学者易晕；包体偏大。\n- **适合**：需要 RAG、复杂链、大量第三方集成的后端 Agent。\n\n### 1.2 Vercel AI SDK —— 轻量、流式、前端友好\n\n- **定位**：为「前端 + AI」而生的轻量 SDK。\n- **强项**：`useChat` 等 React 钩子、统一多模型接口、流式开箱即用、体积小。\n- **弱项**：复杂 Agent 编排能力不如 LangChain；偏前端场景。\n- **适合**：Next.js / React 应用里快速接入流式对话与简单 Agent。\n\n### 1.3 AutoGen（微软）—— 多 Agent 协作\n\n- **定位**：让多个 Agent「对话」来完成任务。\n- **强项**：Conversation 多 Agent 编排、人机协同（Human-in-the-loop）、代码执行。\n- **弱项**：Node 生态相对 Python 弱；概念较重。\n- **适合**：研究型、需要多角色分工讨论的复杂任务。\n\n### 1.4 CrewAI —— 角色扮演式多 Agent\n\n- **定位**：用「团队（Crew）+ 角色（Agent）+ 任务（Task）」组织多 Agent。\n- **强项**：声明式定义团队，开箱即用的多 Agent 流水线。\n- **弱项**：偏 Python 优先；灵活度低于手写编排。\n- **适合**：把工作流拆成多个「岗位」自动跑（如调研→写作→审校）。\n\n---\n\n## 二、选型对比维度表\n\n| 维度 | LangChain.js | Vercel AI SDK | AutoGen | CrewAI |\n|------|-------------|---------------|---------|--------|\n| 主要语言 | TypeScript | TypeScript | Python/TS | Python |\n| 单 Agent | ✅ 强 | ✅ 轻量 | ✅ | ✅ |\n| 多 Agent | ⚠️ 需 LangGraph | ⚠️ 需自己编排 | ✅ 原生 | ✅ 原生 |\n| 流式输出 | ✅ | ✅ 最佳 | ⚠️ | ⚠️ |\n| RAG/检索 | ✅ 最强 | ⚠️ 基础 | ⚠️ | ⚠️ |\n| 前端集成 | 一般 | ✅ 最佳 | 弱 | 弱 |\n| 学习曲线 | 较陡 | 平缓 | 中 | 平缓 |\n\n---\n\n## 三、本计划的框架使用策略\n\n结合我们是 **TypeScript / Node.js** 技术栈，且目标是从入门到实战，本计划采用「先深后广」：\n\n```text\nDay 16-25  LangChain.js 主攻\n            ├── Model I/O（Prompt/Model/OutputParser）\n            ├── Chains / LCEL\n            ├── Tools & Tool Calling\n            ├── Memory\n            └── Agents / LangGraph 入门\n\nDay 26-33  Vercel AI SDK 主攻\n            ├── 统一模型接口\n            ├── useChat / 流式 UI\n            ├── Tool Calling\n            └── 与前端结合（Next.js）\n\nDay 34-35  整合：用两个框架各写一个完整 Agent 对比体感\n```\n\n**为什么先 LangChain.js？** 它的抽象最完整，学完能理解 Agent 的全套组件；**再用 Vercel AI SDK** 则能体会「轻量 + 流式 + 前端」的爽感，二者互补。\n\n> AutoGen / CrewAI 偏 Python 且核心是「多 Agent 编排」，本计划以 TS 为主线，故作为概念了解，不深入编码（感兴趣可自行拓展）。\n\n---\n\n## 四、最小对比：同一个 Agent，两种写法\n\n用「问 LLM 一个问题」展示两者风格差异：\n\n**LangChain.js**\n\n```typescript\nimport { ChatOpenAI } from '@langchain/openai'\nimport { ChatPromptTemplate } from '@langchain/core/prompts'\nimport { StringOutputParser } from '@langchain/core/output_parsers'\n\nconst model = new ChatOpenAI({ model: 'gpt-4o-mini' })\nconst prompt = ChatPromptTemplate.fromTemplate('用一句话解释：{topic}')\nconst chain = prompt.pipe(model).pipe(new StringOutputParser())\nconst answer = await chain.invoke({ topic: '什么是 AI Agent' })\n```\n\n**Vercel AI SDK**\n\n```typescript\nimport { generateText } from 'ai'\nimport { openai } from '@ai-sdk/openai'\n\nconst { text } = await generateText({\n  model: openai('gpt-4o-mini'),\n  prompt: '用一句话解释：什么是 AI Agent',\n})\n```\n\n两者都能完成任务，但 LangChain 强调「链的可组合」，Vercel 强调「一行调用 + 前端友好」。\n\n---\n\n## 五、学习资料\n\n以下站点均已验证可访问（国内镜像 / 中文）：\n\n| 资源 | 链接 | 说明 |\n|------|------|------|\n| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | 官方中文镜像 |\n| LangChain 中文文档 | https://langchain-doc.cn/ | 中文手册 |\n| Vercel AI SDK 中文文档 | https://ai-sdk.com.cn/docs/introduction | 官方中文镜像 |\n| Vercel AI SDK 6 完整教程（腾讯云） | https://cloud.tencent.com/developer/article/2630363 | 实战教程 |\n| Vercel AI SDK 完整深入教程（掘金） | https://juejin.cn/post/7604761524977500169 | 深入讲解 |\n| 2026 AI Agent 框架终极对比（掘金） | https://juejin.cn/post/7636584182789718058 | 横向对比 |\n| 2026 多 Agent 框架横评 | https://www.holysheep.ai/articles/zh-langchain-vs-autogen-vs-crewai-vs-langgraph-2026-d-2026-06-24-0030.html | 多框架评测 |\n| 2026 AI Agent 框架横向对比（CSDN） | https://blog.csdn.net/2501_91483426/article/details/161573784 | 对比文章 |\n\n---\n\n## 六、明日预告\n\n**Day 16：LangChain.js Model I/O（上）— LLM 调用与 Prompt 模板**\n\n正式动手 LangChain.js。我们会拆开 Model I/O 三层结构（Model / Prompt / OutputParser），学会用 `ChatOpenAI` 调模型、用 `ChatPromptTemplate` 组织提示词，并用 LCEL 的 `pipe` 把组件串起来。\n\n> 🚀 Day 15 完成！选对框架，事半功倍。接下来 10 天，我们扎进 LangChain.js，把 Agent 的每个零件都拆开看一遍。",
  }
,
  {
    id: "18",
    title: "AI Agent 学习计划 Day 16：LangChain.js Model I/O（上）— LLM 调用与 Prompt 模板",
    slug: "ai-agent-day16-langchain-model-io-upper",
    date: "2026-07-17",
    tags: ["AI Agent","LangChain","Model I/O","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第十六天。深入 LangChain.js 的 Model I/O 三层模型（Prompt → Model → OutputParser）：用 ChatOpenAI 初始化模型与常用参数、理解 System/Human/AI 消息类型、掌握 PromptTemplate / ChatPromptTemplate / FewShot / MessagePlaceholder，并用 LCEL 的 pipe 把组件串联成链。",
    readingTime: 32,
    content: "# AI Agent 学习计划 Day 16：LangChain.js Model I/O（上）\n\n> 📅 日期：2026-07-17  \n> 🎯 阶段二：核心框架（Day 15-35）  \n> 📊 学习进度：Day 16 / 84（19.0%）\n\n## 前言\n\n昨天定好了兵器——LangChain.js。今天动手拆它的第一个核心模块：**Model I/O**。几乎所有 Agent 能力（对话、工具调用、规划）都建立在「把 Prompt 喂给模型、再把模型输出解析出来」这一环上。理解 Model I/O，就理解了 LangChain 的「输入→推理→输出」主链路。\n\n---\n\n## 一、Model I/O 三层结构\n\n```text\n        ┌─────────────┐\n输入 ──▶│  PromptTemplate │  把变量渲染成最终提示词\n        └──────┬──────┘\n               │ 渲染后的 messages\n        └──────┬──────┘\n               │\n        ┌──────▼─────┐\n        │   Model     │  ChatOpenAI 等，调用 LLM\n        └──────┬──────┘\n               │ 模型原始输出（AIMessage）\n        ┌──────▼─────┐\n        │OutputParser │ 把输出解析成可用结构\n        └──────┬──────┘\n               │\n输出 ──▶  结构化结果 / 文本\n```\n\n记住这三层：**Prompt（怎么问）→ Model（谁来答）→ OutputParser（怎么用答案）**。\n\n---\n\n## 二、Model：用 ChatOpenAI 调模型\n\n### 2.1 初始化与常用参数\n\n```typescript\nimport { ChatOpenAI } from '@langchain/openai'\n\nconst model = new ChatOpenAI({\n  model: 'gpt-4o-mini', // 模型名\n  temperature: 0.7,     // 0=确定性，越高越随机\n  maxTokens: 1024,      // 最大输出长度\n  // apiKey 默认读 process.env.OPENAI_API_KEY\n})\n\nconst res = await model.invoke('用一句话介绍 LangChain')\nconsole.log(res.content)\n```\n\n> 用 `model.invoke(input)` 得到的是 `AIMessage` 对象，`res.content` 才是文本。也可以用 `await model.call(...)` 的老写法，但推荐 `invoke`。\n\n### 2.2 消息类型（System / Human / AI）\n\nLangChain 用消息对象表达角色，对应 Day 10 学的消息角色：\n\n```typescript\nimport { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages'\n\nconst messages = [\n  new SystemMessage('你是一个严谨的 TypeScript 专家。'),\n  new HumanMessage('什么是泛型？'),\n  // AIMessage 通常来自模型回复，也可手动构造多轮\n  new AIMessage('泛型是……'),\n  new HumanMessage('能给个例子吗？'),\n]\n\nconst res = await model.invoke(messages)\n```\n\n---\n\n## 三、Prompt：模板化地「提问」\n\n### 3.1 PromptTemplate（单段文本）\n\n```typescript\nimport { PromptTemplate } from '@langchain/core/prompts'\n\nconst tpl = PromptTemplate.fromTemplate('请解释 {concept}，用 {level} 难度的语言。')\n\nconst prompt = await tpl.format({ concept: '闭包', level: '入门' })\n// → \"请解释 闭包，用 入门 难度的语言。\"\n```\n\n### 3.2 ChatPromptTemplate（多角色对话）\n\nAgent 几乎都用对话模板：\n\n```typescript\nimport { ChatPromptTemplate } from '@langchain/core/prompts'\n\nconst chatTmpl = ChatPromptTemplate.fromMessages([\n  ['system', '你是一个{role}，回答要简洁。'],\n  ['human', '{question}'],\n])\n\nconst messages = await chatTmpl.formatMessages({\n  role: '编程助手',\n  question: 'TypeScript 和 JavaScript 的区别？',\n})\n// messages 是 [SystemMessage, HumanMessage]\n```\n\n### 3.3 FewShot（少样本示例）\n\n给模型看几个例子，它学得更快——对应 Day 11 的 Few-shot Prompting：\n\n```typescript\nimport { FewShotPromptTemplate, PromptTemplate } from '@langchain/core/prompts'\n\nconst exampleTpl = PromptTemplate.fromTemplate('输入：{input}\\n输出：{output}')\n\nconst fewShot = new FewShotPromptTemplate({\n  examplePrompt: exampleTpl,\n  examples: [\n    { input: 'happy', output: 'positive' },\n    { input: 'sad', output: 'negative' },\n  ],\n  prefix: '把情绪分类为 positive / negative：',\n  suffix: '输入：{text}\\n输出：',\n  inputVariables: ['text'],\n})\n\nconst prompt = await fewShot.format({ text: 'excited' })\n```\n\n### 3.4 MessagePlaceholder（动态插入消息列表）\n\n做多轮对话或 Agent 历史时，用占位符把「一整段消息数组」塞进去：\n\n```typescript\nimport { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'\n\nconst chatTmpl = ChatPromptTemplate.fromMessages([\n  ['system', '你是助手。'],\n  new MessagesPlaceholder('history'), // 运行时用消息数组填充\n  ['human', '{input}'],\n])\n\nconst messages = await chatTmpl.formatMessages({\n  history: [new HumanMessage('我是小明'), new AIMessage('你好小明')],\n  input: '我刚说我叫什么？',\n})\n```\n\n---\n\n## 四、LCEL：用 pipe 串联组件\n\nLangChain 的表达式语言（LCEL）用 `.pipe()` 把组件连成「链」，像管道一样流动：\n\n```typescript\nimport { ChatOpenAI } from '@langchain/openai'\nimport { ChatPromptTemplate } from '@langchain/core/prompts'\nimport { StringOutputParser } from '@langchain/core/output_parsers'\n\nconst model = new ChatOpenAI({ model: 'gpt-4o-mini' })\nconst chatTmpl = ChatPromptTemplate.fromMessages([\n  ['system', '你是一个{role}'],\n  ['human', '{question}'],\n])\n\n// Prompt → Model → 解析器\nconst chain = chatTmpl.pipe(model).pipe(new StringOutputParser())\n\nconst answer = await chain.invoke({\n  role: 'TypeScript 专家',\n  question: '什么是装饰器？',\n})\nconsole.log(answer)\n```\n\n`chain.invoke(input)` 会自动：渲染 Prompt → 调用 Model → 解析输出。这就是 LangChain 的「组合即编程」。\n\n> `pipe` 还能 `await chain.stream(...)` 流式输出，也能 `chain.batch([...])` 批量跑，非常灵活。\n\n---\n\n## 五、关键注意点\n\n1. **导入路径**：模型来自 `@langchain/openai`，提示词/解析器来自 `@langchain/core`。\n2. **invoke vs stream**：需要实时输出用 `chain.stream()`；普通用 `chain.invoke()`。\n3. **变量必须匹配**：模板里的 `{xxx}` 在 `format/invoke` 时都要提供，否则报错。\n4. **中文文档**：优先用 `js.langchain.com.cn`，不要用官方 `.com`（国内可能不可访问）。\n\n---\n\n## 六、学习资料\n\n以下站点均已验证可访问（国内镜像 / 中文）：\n\n| 资源 | 链接 | 说明 |\n|------|------|------|\n| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | 官方中文镜像 |\n| ChatOpenAI 集成 中文文档 | https://docs.langchain.org.cn/oss/javascript/integrations/chat/openai | ChatOpenAI 参数 |\n| ChatOpenAI \\| Langchain JavaScript 教程 | https://js.langchain.ac.cn/docs/integrations/chat/openai/ | 调用示例 |\n| LangChain.js 入门教程 - 模型调用 | https://langchainjs-learn.vercel.app/03-模型调用.html | 上手教程 |\n| LangChain 最详细教程 Model I/O（二）Prompt Template（CSDN） | https://blog.csdn.net/m0_74977182/article/details/153922895 | Prompt 详解 |\n| LangChain 框架入门03 PromptTemplate（知乎） | https://zhuanlan.zhihu.com/p/1929913456557003553 | 入门 |\n| 保姆级 LangChain 入门（知乎） | https://zhuanlan.zhihu.com/p/1921985393626167192 | 总览 |\n\n---\n\n## 七、明日预告\n\n**Day 17：LangChain.js Model I/O（下）— 输出解析（Output Parsers）**\n\n今天我们把「Prompt → Model」打通了。明天看最后一环 OutputParser：如何把模型的自由文本变成 JSON、结构化对象，从而能被代码可靠使用（`StringOutputParser` / `JsonOutputParser` / `StructuredOutputParser` + Zod / `withStructuredOutput`）。\n\n> 🚀 Day 16 完成！你已经能用 LangChain 把「提示词 → 模型 → 文本」串成一条链。明天我们让模型输出「机器能读懂」的结构。",
  }
,
  {
    id: "19",
    title: "AI Agent 学习计划 Day 17：LangChain.js Model I/O（下）— 输出解析（Output Parsers）",
    slug: "ai-agent-day17-langchain-output-parsers",
    date: "2026-07-18",
    tags: ["AI Agent","LangChain","Output Parser","Zod","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第十七天。完成 Model I/O 最后一环 Output Parser：理解为什么需要解析、掌握四类解析器（StringOutputParser / JsonOutputParser 流式 / StructuredOutputParser + Zod / withStructuredOutput 现代推荐），并用 LCEL 串联与流式结构化输出。",
    readingTime: 30,
    content: "# AI Agent 学习计划 Day 17：LangChain.js Model I/O（下）\n\n> 📅 日期：2026-07-18  \n> 🎯 阶段二：核心框架（Day 15-35）  \n> 📊 学习进度：Day 17 / 84（20.2%）\n\n## 前言\n\n昨天我们打通了「Prompt → Model」，拿到的是模型的自由文本。但做 Agent 时，我们往往**需要机器能直接使用的结构**：比如让模型返回 `{ name, age }` 而不是一段描述。这就是 Output Parser（输出解析器）的价值——它是 Model I/O 的第三层，把「人话」变成「数据」。\n\n---\n\n## 一、为什么需要 Output Parser\n\n```text\n没有解析器：\n  模型输出：「小明今年 18 岁，喜欢编程。」\n  → 代码要自己从文本里抠字段，脆弱易错\n\n有解析器：\n  模型输出：{ \"name\": \"小明\", \"age\": 18, \"hobby\": \"编程\" }\n  → 代码直接 obj.age，可靠\n```\n\nAgent 的工具调用、规划结果、结构化抽取，都依赖稳定可解析的输出。\n\n---\n\n## 二、四类解析器\n\n### 2.1 StringOutputParser —— 最简单\n\n把 `AIMessage` 转成纯字符串，最常用：\n\n```typescript\nimport { StringOutputParser } from '@langchain/core/output_parsers'\n\nconst chain = chatTmpl.pipe(model).pipe(new StringOutputParser())\nconst text = await chain.invoke({ question: '什么是闭包？' })\n```\n\n### 2.2 JsonOutputParser —— 流式友好的 JSON\n\n让模型输出 JSON，并流式解析（边生成边解析，适合长 JSON）：\n\n```typescript\nimport { JsonOutputParser } from '@langchain/core/output_parsers'\nimport { ChatPromptTemplate } from '@langchain/core/prompts'\n\nconst tpl = ChatPromptTemplate.fromTemplate(\n  '把用户描述提取为 JSON，字段：name, age, hobby。\\n描述：{input}'\n)\n\nconst parser = new JsonOutputParser()\nconst chain = tpl.pipe(model).pipe(parser)\n\nconst data = await chain.invoke({ input: '小红 20 岁，爱画画' })\n// → { name: '小红', age: 20, hobby: '画画' }\n```\n\n> 因为模型可能输出多余文字，配合 `parser.getFormatInstructions()` 把「请输出 JSON」的指令注入 Prompt 更稳：\n\n```typescript\nconst tpl = ChatPromptTemplate.fromTemplate(\n  '提取信息：\\n{input}\\n{format_instructions}'\n)\nconst chain = tpl.pipe(model).pipe(parser)\nconst data = await chain.invoke({\n  input: '小红 20 岁，爱画画',\n  format_instructions: parser.getFormatInstructions(),\n})\n```\n\n### 2.3 StructuredOutputParser + Zod —— 带校验的结构\n\n用 [Zod](https://zod.dev) 定义 schema，解析时自动校验类型：\n\n```typescript\nimport { StructuredOutputParser } from '@langchain/core/output_parsers'\nimport { z } from 'zod'\n\nconst parser = StructuredOutputParser.fromZodSchema(\n  z.object({\n    name: z.string().describe('姓名'),\n    age: z.number().describe('年龄'),\n    hobby: z.string().describe('爱好'),\n  })\n)\n\nconst tpl = ChatPromptTemplate.fromTemplate(\n  '提取信息：\\n{input}\\n{format_instructions}'\n)\nconst chain = tpl.pipe(model).pipe(parser)\n\nconst data = await chain.invoke({\n  input: '小刚 22 岁，喜欢篮球',\n  format_instructions: parser.getFormatInstructions(),\n})\n// data 已通过 Zod 校验：{ name: '小刚', age: 22, hobby: '篮球' }\n```\n\n### 2.4 withStructuredOutput —— 现代推荐（最简洁）\n\n`withStructuredOutput` 让模型**原生**按 schema 输出，无需手工拼指令，最干净：\n\n```typescript\nimport { ChatOpenAI } from '@langchain/openai'\nimport { z } from 'zod'\n\nconst model = new ChatOpenAI({ model: 'gpt-4o-mini' })\n\nconst extractor = model.withStructuredOutput(\n  z.object({\n    name: z.string(),\n    age: z.number(),\n    hobby: z.string(),\n  })\n)\n\nconst data = await extractor.invoke('小美 19 岁，喜欢音乐')\n// → { name: '小美', age: 19, hobby: '音乐' }\n```\n\n> 也支持传普通 JSON Schema 对象（不依赖 Zod）。这是目前**最推荐**的方式：代码最少、最稳定。\n\n---\n\n## 三、LCEL 串联与流式结构化输出\n\n把 Parser 接到链尾，并用 `stream` 实现流式结构化：\n\n```typescript\nimport { ChatOpenAI } from '@langchain/openai'\nimport { ChatPromptTemplate } from '@langchain/core/prompts'\nimport { JsonOutputParser } from '@langchain/core/output_parsers'\n\nconst model = new ChatOpenAI({ model: 'gpt-4o-mini' })\nconst tpl = ChatPromptTemplate.fromTemplate('列出 3 个城市的{field}：\\n{format_instructions}')\nconst parser = new JsonOutputParser()\n\nconst chain = tpl.pipe(model).pipe(parser)\n\n// 流式：逐块拿到解析后的片段\nfor await (const chunk of await chain.stream({\n  field: '人口',\n  format_instructions: parser.getFormatInstructions(),\n})) {\n  process.stdout.write(JSON.stringify(chunk))\n}\n```\n\n---\n\n## 四、四类解析器怎么选\n\n| 解析器 | 输出形态 | 是否需手工指令 | 类型校验 | 推荐度 |\n|--------|---------|--------------|---------|--------|\n| `StringOutputParser` | 纯文本 | 否 | 否 | 只要文本时用 |\n| `JsonOutputParser` | JSON | 建议注入 | 否 | 需要流式 JSON |\n| `StructuredOutputParser` + Zod | 对象 | 需注入 | ✅ | 需要校验 |\n| `withStructuredOutput` | 对象 | 否 | ✅(Zod) | ⭐ 首选 |\n\n**经验法则**：要纯文本用 `StringOutputParser`；要结构化优先用 `withStructuredOutput`（最省心）；需要**流式**且是 JSON 用 `JsonOutputParser`。\n\n---\n\n## 五、常见坑\n\n1. **模型不严格输出 JSON**：务必用 `parser.getFormatInstructions()` 注入格式说明，或用 `withStructuredOutput`。\n2. **Zod 校验失败**：模型可能返回字符串型数字（`\"22\"`），可加 `.transform(Number)` 或放宽 schema。\n3. **中文文档路径**：`js.langchain.com.cn` / `langchain.nodejs.cn`，避免官方 `.com` 不可访问。\n\n---\n\n## 六、学习资料\n\n以下站点均已验证可访问（国内镜像 / 中文）：\n\n| 资源 | 链接 | 说明 |\n|------|------|------|\n| LangChain 中文网 结构化输出 | https://langchain.nodejs.cn/docs/concepts/structured_outputs/ | 结构化输出概念 |\n| js.langchain.ac.cn 如何使用输出解析器（结构化） | https://js.langchain.ac.cn/docs/how_to/output_parser_structured/ | 结构化解析 |\n| js.langchain.ac.cn 如何解析 JSON 输出 | https://js.langchain.ac.cn/docs/how_to/output_parser_json/ | JSON 解析 |\n| LangChain 中文网 如何解析 JSON 输出 | https://www.langchain.com.cn/docs/how_to/output_parser_json/ | JSON 解析（镜像） |\n| 第15课 Output Parsers 结构化输出（掘金） | https://juejin.cn/post/7639239837707993123 | 实战课 |\n| 【LangChain 1.x】05 结构化输出（掘金） | https://juejin.cn/post/7662267147439783974 | 1.x 版本 |\n| Output Parsers LangChain.js Agent 权威指南 | https://inferloop.dev/langchain-agent/core-abstractions/output-parsers/ | 权威指南 |\n| LangChain 从入门到实践 Parser（知乎） | https://zhuanlan.zhihu.com/p/1966994571545284677 | Parser 实战 |\n\n---\n\n## 七、明日预告\n\n**Day 18：LangChain.js Chains 与 LCEL 深入**\n\n模型和解析都会了，下一步是把多个组件编排成「链」与「可复用单元」：组合链、并行链、条件分支，以及用 `Runnable` 接口统一所有组件。我们还会写第一个带工具的简单 Agent 雏形。\n\n> 🚀 Day 17 完成！Model I/O 三层（Prompt → Model → OutputParser）你已经全部拿下。从明天起，我们用 LCEL 把这些零件拼成真正的 Agent。",
  }
,
  {
    id: "20",
    title: "AI Agent 学习计划 Day 11：Prompt Engineering 提示词工程",
    slug: "ai-agent-day11-prompt-engineering",
    date: "2026-07-12",
    tags: ["AI Agent","Prompt Engineering","LLM","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第十一天。系统学习提示词工程（Prompt Engineering）：为什么它是 Agent 与 LLM 沟通的基础、清晰表达六原则、零样本/少样本/思维链 CoT/思维树 ToT/ReAct 等核心技巧、角色与系统提示、输出格式约束与结构化输出、Prompt 模板化与变量、负面提示与常见陷阱、提示词评估与迭代方法，并给出可运行的 JavaScript 实战（分类、信息抽取、JSON 结构化输出）。",
    readingTime: 30,
    content: "# AI Agent 学习计划 Day 11：Prompt Engineering 提示词工程\n\n> 📅 日期：2026-07-12  \n> 🎯 阶段一：基础入门（Day 1-14）  \n> 📊 学习进度：Day 11 / 84（13.1%）\n\n## 前言\n\nDay 10 我们建立了 Agent 的整体认知：Agent = LLM（大脑）+ 工具（手）+ 记忆（心）+ 规划（思维）。今天开始深入 Agent 与 LLM 高效沟通的**第一项基本功：提示词工程（Prompt Engineering）**。\n\n如果把 LLM 比作一个能力极强但\"完全按字面理解、没有默认假设\"的新同事，那么提示词就是你给他的任务说明。说清楚了，他做得又快又好；说模糊了，他就会\"自由发挥\"——产生幻觉、跑题、或输出你不想要的格式。\n\n> **提示词工程 = 通过精心设计的输入，引导 LLM 稳定输出我们想要结果的技术。**\n\n它是 Agent 的\"语言层\"。不管是让模型做分类、抽取、推理，还是为后续 Function Calling 描述工具，底层都依赖提示词。理解它，是后续 Tool Use、Memory、Planning 的前提。\n\n---\n\n## 一、为什么需要提示词工程\n\nLLM 本质是一个**条件概率语言模型**：给定上文，预测下一个 token。它不会\"理解意图\"，只会\"续写最合理的文本\"。因此：\n\n- 输入越清晰、结构越明确，输出的\"合理续写\"就越贴近预期；\n- 没有约束时，模型会用训练分布中的\"通用回答\"填充，容易跑题或啰嗦；\n- 同样的请求，换个说法结果可能天差地别。\n\n对 Agent 来说，提示词决定了：任务是否被正确拆解、工具调用参数是否合理、记忆检索是否聚焦、最终回答是否遵循格式。\n\n---\n\n## 二、清晰表达的六条基本原则\n\n| 原则 | 说明 | 反面示例 |\n|------|------|----------|\n| 1. 明确目标 | 一句话说清\"你要什么\" | \"帮我处理一下这个\" |\n| 2. 给角色 | 设定 System 角色限定专业边界 | 让通用模型直接写医疗建议 |\n| 3. 给上下文 | 提供必要背景，避免模型臆测 | 不说明领域就问术语 |\n| 4. 用分隔符 | 用 `###`、`\"\"\"`、XML 标签隔离指令与数据 | 指令和数据混在一起 |\n| 5. 定格式 | 明确要求输出 JSON / 列表 / 表格 | \"总结一下\"（格式自由） |\n| 6. 给示例 | 少样本（Few-shot）比纯描述更稳 | 复杂分类只给文字规则 |\n\n**示例：用分隔符隔离指令与待处理数据**\n\n```\n你是一个日志分类器。请把用户提供的日志行分类为：ERROR / WARN / INFO / DEBUG。\n只输出分类标签，不要解释。\n\n日志内容：\n\"\"\"\n2026-07-12 10:22:31 GET /api/posts 200 12ms\n2026-07-12 10:22:33 DB connection failed, retry 1\n\"\"\"\n```\n\n---\n\n## 三、核心技巧\n\n### 3.1 零样本（Zero-shot）与少样本（Few-shot）\n\n- **Zero-shot**：直接给任务，不举例。适合模型很熟悉的任务。\n- **Few-shot**：在提示里给 2~5 个\"输入→输出\"样例，模型据此模仿格式与风格。对边界模糊、格式特殊的任务效果显著。\n\n```\n分类情感：正面 / 负面\n例1：这家店服务太差了 → 负面\n例2：物流很快，包装结实 → 正面\n待分类：客服耐心解决了我的问题 →\n```\n\n### 3.2 思维链（Chain-of-Thought, CoT）\n\n让模型\"先一步步思考再给答案\"，显著提升推理与数学题准确率。经典触发词：`让我们一步步思考（Let's think step by step）`。\n\n```\n问题：仓库有 120 件商品，第一天卖出 1/3，第二天卖出剩余的 1/4，还剩多少？\n请一步步推理后给出最终数字。\n```\n\n### 3.3 思维树（Tree-of-Thought, ToT）\n\nCoT 是\"一条线\"，ToT 让模型探索多条推理路径并自我评估选优，适合需要规划/搜索的复杂问题。Agent 框架（如 Plan-and-Execute）常借鉴此思想。\n\n### 3.4 角色提示与系统提示（System Prompt）\n\nSystem 消息用于设定模型的\"身份与边界\"，是 Agent 的\"人设 + 规则书\"：\n\n```\nSystem: 你是 AI Agent 学习助手，只回答与 AI Agent / LLM / 编程相关的问题。\n如果用户问无关话题，礼貌拒绝并说明范围。回答使用中文，控制在 200 字内。\n```\n\n### 3.5 结构化输出提示\n\n要求模型严格按 JSON 输出，是 Agent 把 LLM 结果接入代码的关键：\n\n```\n请提取下面简历的姓名、年限、技能，只输出如下 JSON，不要任何额外文字：\n{\"name\": \"\", \"years\": 0, \"skills\": []}\n\n简历：\n\"\"\"\n张三，5 年 Node.js 经验，熟悉 TypeScript、React、LangChain。\n\"\"\"\n```\n\n> 注意：仅靠提示词要求 JSON 仍可能偶发格式错误（多一个 ```json 包裹、或不完整）。生产环境更稳妥的做法是下一课要讲的 **Function Calling / 结构化输出解析器**。\n\n---\n\n## 四、Prompt 模板化与变量\n\n在 Agent 中，提示词通常是\"固定模板 + 动态变量\"。把模板抽出来，运行时填充：\n\n```javascript\nfunction buildClassifierPrompt(logLine) {\n  return `你是一个日志分类器，类别：ERROR / WARN / INFO / DEBUG。\n只输出类别标签，不要解释。\n\n日志：\"\"\"\n${logLine}\n\"\"\"`\n}\n\n// 调用\nconst reply = await llm(buildClassifierPrompt(\"DB connection failed\"))\n```\n\n更复杂的场景可用 LangChain 的 `PromptTemplate` / `ChatPromptTemplate`（Day 16 已初步接触），它负责变量校验、少样本组装、消息角色分配。\n\n---\n\n## 五、常见陷阱与规避\n\n1. **歧义指令**：`总结一下` → 改成 `用 3 条 bullet 总结核心结论，每条不超过 30 字`。\n2. **信息过载**：一次塞太多任务，模型顾此失彼 → 拆分为多步。\n3. **矛盾约束**：既要求\"详细\"又要求\"一句话\" → 明确优先级。\n4. **忽略输出解析**：拿到自由文本后直接当数据用 → 强制 JSON + 校验。\n5. **缺乏示例**：复杂分类只给规则 → 补 2~3 个 Few-shot。\n\n---\n\n## 六、提示词评估与迭代\n\n提示词不是一次写就的，需要像代码一样测试与迭代：\n\n- **建测试集**：准备 20~50 个代表性输入与期望输出；\n- **量化指标**：准确率、格式合规率、平均长度；\n- **A/B 对比**：改一处变量，看指标变化；\n- **回归测试**：模型升级后重跑，防止提示词失效。\n\n---\n\n## 七、JavaScript 实战：结构化抽取\n\n下面用 OpenAI 兼容接口演示\"强制 JSON 输出 + 容错解析\"：\n\n```javascript\nimport OpenAI from 'openai'\n\nconst client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })\n\nasync function extractResume(text) {\n  const prompt = `提取简历信息，只输出 JSON：{\"name\":\"\",\"years\":0,\"skills\":[]}\n不要任何解释或代码块标记。\n\n简历：\"\"\"\n${text}\n\"\"\"`\n  const res = await client.chat.completions.create({\n    model: 'gpt-4o-mini',\n    messages: [{ role: 'user', content: prompt }],\n    temperature: 0, // 降低随机性，提升稳定性\n  })\n  const raw = res.choices[0].message.content.trim()\n  // 容错：去掉可能的 ```json 包裹\n  const jsonStr = raw.replace(/^```json|```$/g, '').trim()\n  try {\n    return JSON.parse(jsonStr)\n  } catch (e) {\n    console.error('JSON 解析失败：', raw)\n    return null\n  }\n}\n\nconst data = await extractResume('李四，8 年 Python 经验，熟悉 Django、PyTorch。')\nconsole.log(data) // { name: '李四', years: 8, skills: ['Django','PyTorch'] }\n```\n\n> 这里手动 `JSON.parse` 容易因模型偶发格式问题失败。**Day 12 的 Function Calling 与 Day 17 的 Output Parser 才是生产级解法**——让模型按 schema 输出、由 SDK 保证可解析。\n\n---\n\n## 八、与后续课程的衔接\n\n- **Day 12 Function Calling**：用工具 schema 代替\"提示词要求 JSON\"，让模型输出可被代码安全调用；\n- **Day 13 Memory/Planning**：把优质提示词沉淀为 Agent 的\"系统提示\"与\"规划模板\"；\n- **Day 16-17 Model I/O**：LangChain 的 PromptTemplate / Output Parser 是把本课技巧工程化的工具。\n\n提示词工程是 Agent 的\"表达力\"基础。把它练好，后面所有能力才接得住。\n\n---\n\n## 参考资源（已验证可访问）\n\n- OpenAI 中文文档（社区版）快速入门：https://www.openaicto.com/docs/quickstart\n- OpenAI 中文文档（社区版）：https://docsopen.ai/\n- 菜鸟教程 AI Agent 教程：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n- LangChain JS/TS 中文文档（PromptTemplate 章节）：https://js.langchain.com.cn/docs/\n- 吴恩达提示工程课程（deeplearning.ai，含中文社区译本）\n\n---\n\n## 今日小结\n\n- 提示词工程是 Agent 与 LLM 的\"语言层\"，决定了任务拆解、工具调用、格式合规的质量；\n- 掌握六原则（明确目标 / 给角色 / 给上下文 / 分隔符 / 定格式 / 给示例）与 CoT、Few-shot、角色提示等技巧；\n- 生产环境不要只靠\"提示词要求 JSON\"，要配合 Function Calling 与 Output Parser 做可靠结构化输出；\n- 提示词要像代码一样建测试集、量化、迭代。\n\n下一步（Day 12）：**Tool Use / Function Calling**——让 LLM 从\"只说话\"进化到\"能动手调用工具\"。",
  }
,
  {
    id: "21",
    title: "AI Agent 学习计划 Day 12：Tool Use / Function Calling 工具调用",
    slug: "ai-agent-day12-tool-use-function-calling",
    date: "2026-07-13",
    tags: ["AI Agent","Function Calling","Tool Use","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第十二天。深入 Tool Use / Function Calling（工具调用）：为什么 Agent 必须能调用外部工具、OpenAI 工具调用协议（tools 参数与 function schema、JSON Schema 描述参数）、完整调用循环（模型返回 tool_calls → 本地执行 → 结果回传 → 模型继续）、并行工具调用与流式、错误处理、与 ReAct 的关系、LangChain 中如何用 @tool / StructuredTool 定义工具，并用 Node.js 实现一个可运行的天气查询 + 计算器 Agent 实战。",
    readingTime: 32,
    content: "# AI Agent 学习计划 Day 12：Tool Use / Function Calling 工具调用\n\n> 📅 日期：2026-07-13  \n> 🎯 阶段一：基础入门（Day 1-14）  \n> 📊 学习进度：Day 12 / 84（14.3%）\n\n## 前言\n\nDay 11 我们学会了用提示词\"更好地说话\"。但 LLM 有个根本局限：**它只能生成文本，无法直接查实时天气、算数学、读数据库、调 API**。\n\n解决这个问题的关键能力就是 **Tool Use / Function Calling（工具调用）**——让模型在回答时，输出\"我想调用哪个函数、参数是什么\"，由我们的代码真正去执行，再把结果喂回模型。这一步，让 Agent 从\"聊天\"跨越到\"办事\"。\n\n> **Function Calling = 模型输出结构化的\"调用意图\"，宿主程序负责真实执行并返回结果的标准协议。**\n\n这是 Agent \"手\"的部分，也是 ReAct、Plan-and-Execute 等模式的物理基础。\n\n---\n\n## 一、为什么 Agent 必须能调用工具\n\n| LLM 的局限 | 工具能补的短板 |\n|------------|----------------|\n| 知识截止（训练数据有时效） | 调搜索 / 数据库拿实时数据 |\n| 不会算数 / 易算错 | 调计算器 / 代码执行 |\n| 无法触达外部系统 | 调 API（发邮件、下单、查订单） |\n| 没有持久状态 | 调记忆读写接口 |\n\n没有工具，Agent 只能\"纸上谈兵\"；有了工具，Agent 才真正能\"行动\"。\n\n---\n\n## 二、OpenAI 工具调用协议\n\n核心是在请求里传 `tools` 数组，每个元素描述一个函数：\n\n```javascript\nconst tools = [\n  {\n    type: 'function',\n    function: {\n      name: 'get_weather',\n      description: '查询指定城市的当前天气',\n      parameters: {\n        type: 'object',\n        properties: {\n          city: { type: 'string', description: '城市名，如 上海' },\n          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },\n        },\n        required: ['city'],\n      },\n    },\n  },\n]\n```\n\n要点：\n- `description` 会被模型用来判断\"何时该调这个工具\"，要写清楚；\n- `parameters` 用 **JSON Schema** 描述，模型据此生成合法参数；\n- `required` 标明必填字段，缺失时模型会先追问或报错。\n\n---\n\n## 三、完整调用循环（Agent Loop）\n\n```\n用户: 上海现在多少度？\n  │\n  ▼\n① 请求模型（messages + tools）\n  │\n  ▼\n② 模型返回 tool_calls: [{ name: 'get_weather', arguments: { city:'上海' } }]\n  │   （此时 content 通常为 null，表示\"我先去查\"）\n  ▼\n③ 宿主代码执行 get_weather('上海') → '26°C, 多云'\n  │\n  ▼\n④ 把结果作为 role:'tool' 消息回传模型\n  │\n  ▼\n⑤ 模型综合后给出自然语言回答：\"上海现在 26°C，多云。\"\n```\n\n代码骨架：\n\n```javascript\nimport OpenAI from 'openai'\nconst client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })\n\nconst tools = [/* 见上 get_weather 定义 */]\nconst available = { get_weather: async ({ city }) => `${city}: 26°C, 多云` }\n\nconst messages = [{ role: 'user', content: '上海现在多少度？' }]\n\n// 第一步：问模型\nlet res = await client.chat.completions.create({\n  model: 'gpt-4o-mini',\n  messages,\n  tools,\n  tool_choice: 'auto', // 让模型自己决定是否调用工具\n})\n\nconst msg = res.choices[0].message\n\n// 第二步：如果模型要调工具，就执行并把结果回传\nif (msg.tool_calls) {\n  messages.push(msg) // 把模型的 tool_calls 消息原样保留\n  for (const call of msg.tool_calls) {\n    const fn = available[call.function.name]\n    const args = JSON.parse(call.function.arguments)\n    const result = await fn(args)\n    messages.push({\n      role: 'tool',\n      tool_call_id: call.id,\n      content: String(result),\n    })\n  }\n  // 第三步：带着工具结果再问一次模型\n  res = await client.chat.completions.create({ model: 'gpt-4o-mini', messages })\n  console.log(res.choices[0].message.content)\n}\n```\n\n> 这就是最简 Agent Loop：**模型决策 → 代码执行 → 结果回灌 → 模型再决策**，循环直到给出最终回答。Day 13 的 ReAct（Thought-Action-Observation）正是这一循环的理论化。\n\n---\n\n## 四、并行工具调用与流式\n\n- **并行调用**：模型可一次返回多个 `tool_calls`（如\"同时查北京和上海天气\"），宿主用 `Promise.all` 并发执行，再一起回传。\n- **流式**：`stream: true` 时工具调用信息会分片到达，需累积 `tool_calls[].function.arguments` 字符串，收齐后再 `JSON.parse`。\n\n---\n\n## 五、错误处理与边界\n\n1. **参数非法**：模型偶尔生成不合 schema 的参数 → `try/catch` 包裹 `JSON.parse`，失败时把错误回传给模型让它修正；\n2. **工具执行失败**：网络超时、API 报错 → 把错误信息作为 `tool` 消息返回，让模型决定重试或改方案；\n3. **安全**：工具可能执行危险操作（发邮件、删数据）→ 高危工具加人工确认或权限校验；不要把原始错误泄露成提示词注入入口。\n\n---\n\n## 六、与 ReAct 的关系\n\nReAct 提示词范式让模型输出 `Thought → Action → Observation` 循环；Function Calling 是它的\"工程化标准实现\"——`Action` 被结构化为 `tool_calls`，`Observation` 对应 `role:'tool'` 消息。两者思想一致，Function Calling 更省 token、更可靠。\n\n---\n\n## 七、用 LangChain 定义工具（预览）\n\nDay 16-17 我们系统学 LangChain，这里先预览其工具定义方式：\n\n```javascript\nimport { tool } from '@langchain/core/tools'\nimport { z } from 'zod'\n\nconst calculator = tool(\n  async ({ expression }) => {\n    // 生产环境请用安全表达式求值，禁止直接 eval\n    return String(eval(expression))\n  },\n  {\n    name: 'calculator',\n    description: '计算一个数学表达式，如 \"2 ** 10 + 3\"',\n    schema: z.object({ expression: z.string() }),\n  }\n)\n\n// 在 Agent/Chain 中把 calculator 作为可调用工具传入即可\n```\n\n`z.object(...)`（Zod）既描述参数 schema，又自动做运行时校验，比手写 JSON Schema 更安全直观——这正是 Day 17 `withStructuredOutput` 的同类思路。\n\n---\n\n## 八、可运行实战：天气 + 计算器 Agent\n\n把上面的 `get_weather` 与 `calculator` 两个工具组合，模型就能根据你的话自主选择调用哪个：\n\n```javascript\nconst available = {\n  get_weather: async ({ city }) => `${city}: 26°C, 多云`,\n  calculator: async ({ expression }) => String(eval(expression)), // 仅演示\n}\nconst tools = [/* get_weather + calculator 两个 schema */]\n\nasync function agentAsk(question) {\n  const messages = [{ role: 'user', content: question }]\n  let res = await client.chat.completions.create({ model: 'gpt-4o-mini', messages, tools })\n  let msg = res.choices[0].message\n  while (msg.tool_calls) {\n    messages.push(msg)\n    for (const call of msg.tool_calls) {\n      const result = await available[call.function.name](JSON.parse(call.function.arguments))\n      messages.push({ role: 'tool', tool_call_id: call.id, content: String(result) })\n    }\n    res = await client.chat.completions.create({ model: 'gpt-4o-mini', messages, tools })\n    msg = res.choices[0].message\n  }\n  return msg.content\n}\n\nconsole.log(await agentAsk('北京和上海谁更热？顺便算下两地温差多少度'))\n// 模型会并行调 get_weather 两次，再调 calculator 求差，最后自然语言总结\n```\n\n---\n\n## 九、今日小结与衔接\n\n- Function Calling 让 LLM 输出\"调用意图 + 参数\"，由代码真实执行，是 Agent 的\"手\"；\n- 掌握 OpenAI `tools` 协议（JSON Schema 描述参数）、Agent Loop 循环、并行调用、错误处理；\n- 它是 ReAct 的工程化实现；LangChain 的 `@tool` + Zod 让工具定义更安全；\n- 安全第一：高危工具要权限控制，错误要回传模型修正而非直接崩溃。\n\n**Day 11（提示词）+ Day 12（工具调用）= Agent 的\"表达力 + 行动力\"双基石。** 进入 Day 13 后，我们将用 Memory 与 Planning 把这两块组织成\"会记忆、会规划\"的真正智能体。\n\n---\n\n## 参考资源（已验证可访问）\n\n- OpenAI 中文文档（社区版）快速入门：https://www.openaicto.com/docs/quickstart\n- OpenAI 中文文档（社区版）：https://docsopen.ai/\n- LangChain JS/TS 中文文档：https://js.langchain.com.cn/docs/\n- LangChain 中文文档：https://langchain-doc.cn/\n- 菜鸟教程 AI Agent 教程：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n\n> 注：工具调用依赖模型厂商的 Function Calling 能力，国内多家大模型（如通义千问、智谱 GLM、DeepSeek）均兼容 OpenAI 工具调用格式，可平滑替换 `baseURL` 与 `model` 使用。",
  }
,
  {
    id: "22",
    title: "AI Agent 学习计划 Day 18：LangChain.js Retrieval（上）— 文档加载与切分",
    slug: "ai-agent-day18-langchain-retrieval-upper",
    date: "2026-07-19",
    tags: ["AI Agent","LangChain","RAG","Retrieval","Text Splitter","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第十八天。进入 LangChain.js Retrieval 模块：理解 RAG 为什么需要检索、Document 数据结构、各类 Document Loader（文本/PDF/Web/CSV/Notion），并重点掌握文档切分神器 RecursiveCharacterTextSplitter（分隔符层级、chunkSize、chunkOverlap）与其他切分策略。",
    readingTime: 32,
    content: "# AI Agent 学习计划 Day 18：LangChain.js Retrieval（上）\n\n> 📅 日期：2026-07-19  \n> 🎯 阶段二：核心框架（Day 15-35）  \n> 📊 学习进度：Day 18 / 84（21.4%）\n\n## 前言\n\n前三天我们学完了 Model I/O 三层（Prompt → Model → OutputParser），模型已经能「听懂指令、吐出结构」。但真正让 AI Agent 拥有**领域知识**的，是 Retrieval（检索）——也就是 RAG（Retrieval-Augmented Generation，检索增强生成）。\n\n大模型本身有个致命短板：**训练数据有截止日期，且无法访问你的私有文档**。Retrieval 的做法是——把外部知识「喂」给模型：先加载文档、切成小块、需要时按需检索相关片段，注入 Prompt。今天我们先拿下 Retrieval 的第一步：**文档加载** 与 **文档切分**。\n\n---\n\n## 一、为什么需要 Retrieval / RAG\n\n```text\n没有检索（纯大模型）：\n  用户：我们公司年假政策是几天？\n  模型：我无法访问贵公司内部制度……（瞎编或拒答）\n\n有检索（RAG）：\n  1. 加载《员工手册.pdf》→ 切分成若干 chunk\n  2. 用户提问 → 检索出「年假」相关 chunk\n  3. 把 chunk 拼进 Prompt → 模型基于真实文档作答\n```\n\nRetrieval 让模型「开卷考试」，答案可溯源、可更新（换文档即可），还能大幅减少幻觉。\n\n---\n\n## 二、核心数据结构：Document\n\nLangChain 里一切被加载/切分的内容，统一抽象成 `Document`：\n\n```typescript\nimport { Document } from '@langchain/core/documents'\n\nconst doc = new Document({\n  pageContent: '这是一段文本内容……',\n  metadata: { source: 'handbook.pdf', page: 3 },\n})\n```\n\n- `pageContent`：文本正文\n- `metadata`：来源、页码、作者等，检索时可用于过滤与溯源\n\nLoader 与 Splitter 的输入输出，本质都是 `Document[]`。\n\n---\n\n## 三、文档加载 Document Loaders\n\nLangChain 提供大量开箱即用的 Loader，统一实现 `load()` / `loadAndSplit()`。\n\n### 3.1 文本文件 —— TextLoader\n\n```typescript\nimport { TextLoader } from 'langchain/document_loaders/fs/text'\n\nconst loader = new TextLoader('./docs/handbook.txt')\nconst docs = await loader.load() // Document[]\n```\n\n### 3.2 PDF —— PDFLoader\n\n```typescript\nimport { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'\n\nconst loader = new PDFLoader('./docs/handbook.pdf')\nconst docs = await loader.load() // 每页一个 Document（默认按页）\n```\n\n> PDF 解析依赖 `pdf-parse` 等底层库；页面多、扫描件多时建议配合 OCR。\n\n### 3.3 网页 —— WebBaseLoader\n\n```typescript\nimport { WebBaseLoader } from '@langchain/community/document_loaders/web/cheerio'\n\nconst loader = new WebBaseLoader('https://js.langchain.com.cn/docs/')\nconst docs = await loader.load() // 用 cheerio 抓取正文\n```\n\n### 3.4 CSV / JSON / 数据库\n\n- `CSVLoader`：把每行变一个 Document，`column` 选项指定作为正文列\n- `JSONLoader`：按 `jq` 风格路径抽取字段\n- 数据库/Memory/S3 等均有对应 Loader（`@langchain/community` 下）\n\n---\n\n## 四、文档切分 Text Splitters（重点）\n\n模型有上下文窗口限制，且检索要「精准命中」，所以**必须把长文档切成小块（chunk）**。\n\n### 4.1 朴素切法的问题\n\n```text\n按固定长度 1000 字符硬切：\n  chunk1: \"...营收增长主要来源于[被切断] 海外业务，该业务...\"\n  chunk2: \"在东南亚市场占有率达到 30%...\"   ← 语义被切断，检索时拆散\n```\n\n硬切会**切断语义**，导致一个完整知识点被劈成两半。\n\n### 4.2 RecursiveCharacterTextSplitter（推荐默认）\n\n它按「分隔符优先级」递归切分，**优先在段落/句子边界断开**，尽可能保留语义完整：\n\n```typescript\nimport { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'\n\nconst splitter = new RecursiveCharacterTextSplitter({\n  chunkSize: 500,       // 每块最大字符数\n  chunkOverlap: 50,     // 相邻块重叠字符数（保留上下文衔接）\n})\n\nconst docs = await splitter.splitDocuments(rawDocs)\n// 或直接从文本：const chunks = await splitter.splitText(longText)\n```\n\n**分隔符层级（默认，从粗到细）**：\n\n```typescript\n['\\n\\n', '\\n', ' ', '']   // 段落 → 换行 → 空格 → 字符\n```\n\n切分逻辑：先尝试按 `\\n\\n`（段落）切；若某块仍超 `chunkSize`，再按 `\\n` 切；还不够再按空格、最后按字符。这样**优先在自然的段落/句子边界断开**。\n\n### 4.3 关键参数怎么调\n\n| 参数 | 作用 | 经验值 |\n|------|------|--------|\n| `chunkSize` | 单块最大长度 | 中文 300–800 字符；英文 500–1000 token |\n| `chunkOverlap` | 块间重叠 | 建议 `chunkSize` 的 10%–20%，避免割裂 |\n| `separators` | 自定义分隔符 | 代码可用 `['\\n\\n','\\n',';',' ']` |\n\n> 太小 → 上下文碎片、检索噪声多；太大 → 单块信息杂、超出窗口。需要结合**嵌入模型**的最佳输入长度实验调优（Day 19 会讲 Embeddings）。\n\n### 4.4 其他切分器\n\n- `CharacterTextSplitter`：只按单一分隔符（如 `\\n\\n`），不递归\n- `TokenTextSplitter`：按 token 而非字符切，更贴合模型计数（注意 `chunkSize` 单位变成 token）\n- `MarkdownTextSplitter` / `LatexTextSplitter`：按文档结构（标题/公式）切，保留格式语义\n- **语义切分（预览）**：用 Embedding 判断「是否该断开」，让每块是完整语义单元（Day 36+ 深入 RAG 时再展开）\n\n---\n\n## 五、完整实战：加载 PDF → 切分\n\n```typescript\nimport { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'\nimport { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'\n\n// 1. 加载\nconst loader = new PDFLoader('./docs/handbook.pdf')\nconst rawDocs = await loader.load()\n\n// 2. 切分\nconst splitter = new RecursiveCharacterTextSplitter({\n  chunkSize: 600,\n  chunkOverlap: 80,\n})\nconst chunks = await splitter.splitDocuments(rawDocs)\n\n// 3. 查看结果\nconsole.log(`共切成 ${chunks.length} 块`)\nconsole.log(chunks[0].pageContent.slice(0, 100))\nconsole.log('metadata:', chunks[0].metadata) // 保留来源页码\n```\n\n> 这套「加载 → 切分」产出的 `chunks`，就是 Day 19 嵌入成向量、Day 20 存进向量库、Day 21 做相似度检索的原料。\n\n---\n\n## 六、常见坑\n\n1. **Loader 没装对应底层依赖**：`PDFLoader` 需要 `pdf-parse`，`WebBaseLoader` 需要 `cheerio`，记得 `npm i` 对应包。\n2. **chunkOverlap ≥ chunkSize**：会导致死循环/重复，overlap 必须明显小于 size。\n3. **中文 chunkSize 用「字符」而非「token」**：`RecursiveCharacterTextSplitter` 默认按字符，中文每个字算 1 字符，按英文经验值会偏大，需下调。\n4. **metadata 丢失**：自定义 Loader 时务必把 `source/page` 写进 metadata，否则检索命中后无法溯源。\n5. **官方文档站点不可访问**：用中文镜像 `js.langchain.com.cn` / `langchain.nodejs.cn`，避免 `js.langchain.com` 打不开。\n\n---\n\n## 七、学习资料\n\n以下站点均已验证可访问（国内镜像 / 中文）：\n\n| 资源 | 链接 | 说明 |\n|------|------|------|\n| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | 总入口，含 Retrieval 章节 |\n| LangChain 中文文档 | https://langchain-doc.cn/ | 概念与 How-to 中文版 |\n| LangChain 中文网 | https://langchain.nodejs.cn/docs/concepts/ | 概念文档（含文本切分） |\n| LangChain.js 文本切分 How-to | https://js.langchain.com.cn/docs/how_to/ | 官方 how-to 中文镜像 |\n| js.langchain.ac.cn 文档加载 | https://js.langchain.ac.cn/docs/integrations/document_loaders/ | Loader 集成列表 |\n| 菜鸟教程 AI Agent 教程 | https://www.runoob.com/ai-agent/ai-agent-tutorial.html | 入门总览 |\n\n---\n\n## 八、明日预告\n\n**Day 19：LangChain.js Retrieval（下）— 嵌入（Embeddings）与向量存储**\n\n切好的文本块只是字符串，机器不懂「语义相近」。下一步我们用 Embedding 模型把每块文本变成一串向量（数字），再存进向量数据库（如内存版 / Chroma / Pinecone）。这样「语义检索」才成为可能——用户问「年假几天」，能召回「休假制度」那块，哪怕字面不重合。\n\n> 🚀 Day 18 完成！你已掌握 RAG 流水线最前端的「加载 + 切分」。明天，我们让文本变成向量。",
  }
,
  {
    id: "23",
    title: "AI Agent 学习计划 Day 19：LangChain.js Retrieval（下）— 嵌入（Embeddings）与向量存储",
    slug: "ai-agent-day19-langchain-retrieval-lower",
    date: "2026-07-20",
    tags: ["AI Agent","LangChain","RAG","Embeddings","Vector Store","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第十九天。完成 Retrieval 第二步：把切好的文本块用 Embedding 模型变成向量，并存入向量数据库。覆盖 Embedding 原理、OpenAI/本地嵌入、余弦相似度、MemoryVectorStore 与 Chroma/Pinecone 等主流向量库，以及完整「嵌入 + 入库」实战。",
    readingTime: 33,
    content: "# AI Agent 学习计划 Day 19：LangChain.js Retrieval（下）\n\n> 📅 日期：2026-07-20  \n> 🎯 阶段二：核心框架（Day 15-35）  \n> 📊 学习进度：Day 19 / 84（22.6%）\n\n## 前言\n\n昨天我们把长文档切成了语义完整的 chunk（小块）。但机器并不「懂」这些文字——它只能比较数字。今天要做的，就是**把文本变成一串数字（向量）**，让「意思相近」的文本在向量空间里「距离更近」。这就是 Embeddings（嵌入）+ 向量存储，也是 RAG 检索的核心。\n\n---\n\n## 一、Embedding 是什么\n\n```text\n文本：  \"公司年假是几天？\"\nEmbedding → [0.12, -0.45, 0.88, ..., 0.03]   (1536 维向量)\n\n文本：  \"员工休假制度规定...\"\nEmbedding → [0.11, -0.41, 0.85, ..., 0.05]   (语义相近 → 向量也相近)\n\n文本：  \"今天天气真好\"\nEmbedding → [0.92, 0.33, -0.12, ..., -0.77]  (语义远 → 向量也远)\n```\n\nEmbedding 模型（如 OpenAI `text-embedding-3-small`）把任意文本映射到一个高维向量空间，**语义相似的文本，向量余弦距离更近**。检索时我们就「找最近的几个向量」，等价于「找最相关的几段文字」。\n\n---\n\n## 二、在 LangChain.js 中使用 Embeddings\n\n### 2.1 OpenAI Embeddings（最常用）\n\n```typescript\nimport { OpenAIEmbeddings } from '@langchain/openai'\n\nconst embeddings = new OpenAIEmbeddings({\n  model: 'text-embedding-3-small', // 1536 维；large 为 3072 维\n  apiKey: process.env.OPENAI_API_KEY,\n})\n\n// 单条\nconst vec = await embeddings.embedQuery('公司年假是几天？')\n// 批量（切块用 embedDocuments，更便宜）\nconst vecs = await embeddings.embedDocuments(['块1', '块2', '块3'])\n```\n\n> `embedQuery` 用于用户提问，`embedDocuments` 用于文档块（批量有价格优惠）。\n\n### 2.2 本地 / 开源嵌入（隐私、免 API）\n\n```typescript\nimport { HuggingFaceTransformersEmbeddings } from '@langchain/community'\n\nconst embeddings = new HuggingFaceTransformersEmbeddings({\n  model: 'Xenova/bge-small-zh-v1.5', // 中文友好，本地跑\n})\n```\n\n> 适合内网/隐私场景；首次会下载模型，速度比 API 慢但零成本。\n\n---\n\n## 三、向量存储 Vector Store\n\n嵌入后的向量 + 原文，需要存进**向量数据库**，才能高效做近邻检索。LangChain 用统一接口 `VectorStore`：\n\n```typescript\ninterface VectorStore {\n  addDocuments(docs)          // 入库（内部自动 embed）\n  similaritySearch(query, k)  // 按相似度取前 k 条\n  asRetriever()                // 转成 Retriever，接入链\n}\n```\n\n### 3.1 内存版 MemoryVectorStore（开发/演示首选）\n\n```typescript\nimport { MemoryVectorStore } from 'langchain/vectorstores/memory'\n\nconst vectorStore = await MemoryVectorStore.fromDocuments(\n  chunks,        // 昨天切好的 Document[]\n  embeddings     // 上面的 embeddings 实例\n)\n\nconst results = await vectorStore.similaritySearch('年假几天？', 3)\nresults.forEach(r => console.log(r.pageContent, r.metadata))\n```\n\n> 内存存储，重启即清空，**最适合本地跑通流程**，无需装数据库。\n\n### 3.2 Chroma（本地持久化）\n\n```typescript\nimport { Chroma } from '@langchain/community/vectorstores/chroma'\n\nconst vectorStore = await Chroma.fromDocuments(chunks, embeddings, {\n  collectionName: 'handbook',\n  url: 'http://localhost:8000', // 本地 Chroma 服务\n})\n```\n\n### 3.3 Pinecone（托管云，生产级）\n\n```typescript\nimport { PineconeStore } from '@langchain/community/vectorstores/pinecone'\nimport { Pinecone } from '@pinecone-database/pinecone'\n\nconst client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })\nconst index = client.Index('handbook')\n\nconst vectorStore = await PineconeStore.fromDocuments(chunks, embeddings, {\n  pineconeIndex: index,\n})\n```\n\n> 选型：开发用 `MemoryVectorStore`；要持久化本地用 `Chroma`；要弹性扩展/托管用 `Pinecone`/`Qdrant`。\n\n---\n\n## 四、完整实战：加载 → 切分 → 嵌入 → 入库 → 检索\n\n```typescript\nimport { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'\nimport { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'\nimport { OpenAIEmbeddings } from '@langchain/openai'\nimport { MemoryVectorStore } from 'langchain/vectorstores/memory'\n\n// 1. 加载\nconst rawDocs = await new PDFLoader('./docs/handbook.pdf').load()\n\n// 2. 切分\nconst chunks = await new RecursiveCharacterTextSplitter({\n  chunkSize: 600,\n  chunkOverlap: 80,\n}).splitDocuments(rawDocs)\n\n// 3. 嵌入 + 入库\nconst embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })\nconst store = await MemoryVectorStore.fromDocuments(chunks, embeddings)\n\n// 4. 检索\nconst hits = await store.similaritySearch('年假有几天？', 3)\nconsole.log(hits[0].pageContent) // 命中「休假制度」相关块\n```\n\n> 这就是 RAG 的「写」侧（indexing）。Day 20 我们会把 `store.asRetriever()` 接入 Chain，实现「用户提问 → 检索 → 注入 Prompt → 模型作答」的完整闭环。\n\n---\n\n## 五、相似度怎么算（了解即可）\n\n向量库默认用**余弦相似度**：\n\n```\ncosine(A, B) = (A · B) / (|A| × |B|)\n```\n\n值域 [-1, 1]，越接近 1 越相似。`similaritySearch` 内部即按此排序取 top-k。\n\n---\n\n## 六、常见坑\n\n1. **查询用 `embedQuery`、文档用 `embedDocuments`**：混用会导致向量空间不一致，检索变差。\n2. **Embedding 模型与检索模型要一致**：入库和查询必须用同一个 embedding 模型，否则语义空间错位。\n3. **中文选对模型**：OpenAI `text-embedding-3-small` 支持多语言；本地可选 `bge-small-zh` 等中文优化模型。\n4. **向量维度要匹配**：`text-embedding-3-small` = 1536 维，建库（如 Pinecone）时索引维度须一致。\n5. **官方站不可访问**：用 `js.langchain.com.cn` / `langchain.nodejs.cn` 中文镜像。\n\n---\n\n## 七、学习资料\n\n以下站点均已验证可访问（国内镜像 / 中文）：\n\n| 资源 | 链接 | 说明 |\n|------|------|------|\n| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | 总入口，含 Vector Stores 章节 |\n| LangChain 中文文档 | https://langchain-doc.cn/ | 概念与 How-to 中文版 |\n| LangChain 中文网 | https://langchain.nodejs.cn/docs/concepts/ | 概念文档（含 Embeddings） |\n| js.langchain.ac.cn 向量存储 | https://js.langchain.ac.cn/docs/integrations/vectorstores/ | 各向量库集成列表 |\n| OpenAI Embeddings 指南（中文镜像） | https://docsopen.ai/guides/embeddings/ | Embeddings 用法 |\n| 菜鸟教程 AI Agent 教程 | https://www.runoob.com/ai-agent/ai-agent-tutorial.html | 入门总览 |\n\n---\n\n## 八、明日预告\n\n**Day 20：LangChain.js Chains（上）— 顺序链与 LLM 链**\n\n检索原料齐了，下一步是把「检索 → 拼接 Prompt → 调用模型」编排成一个**可复用、可组合的链（Chain）**。我们学 LCEL 的 `RunnableSequence`、把 Retriever 接进 Prompt、写出第一个完整的 RAG 问答链。\n\n> 🚀 Day 19 完成！你已打通 RAG 的「写」侧（加载 → 切分 → 嵌入 → 入库）。明天，我们用 Chain 把它们串成能回答问题的 Agent。",
  }
,
  {
    id: "24",
    title: "AI Agent 学习计划 Day 20：LangChain.js Chains（上）— 顺序链与 LLM 链",
    slug: "ai-agent-day20-langchain-chains-upper",
    date: "2026-07-21",
    tags: ["AI Agent","LangChain","Chains","LCEL","RAG","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第二十天。进入 LangChain Chains 模块：用 LCEL（LangChain Expression Language）把组件编排成可复用、可组合的链。覆盖 Runnable 统一接口、pipe 管道符、RunnableSequence / RunnablePassthrough、LLM 链与第一个完整 RAG 问答链（Retriever → Prompt → Model）。",
    readingTime: 33,
    content: "# AI Agent 学习计划 Day 20：LangChain.js Chains（上）\n\n> 📅 日期：2026-07-21  \n> 🎯 阶段二：核心框架（Day 15-35）  \n> 📊 学习进度：Day 20 / 84（23.8%）\n\n## 前言\n\n前四天我们备齐了 RAG 的所有「零件」：模型（Day 16-17）、文档加载与切分（Day 18）、嵌入与向量库（Day 19）。但零件散落一地没法用——今天我们用 **Chains（链）** 把它们**串起来**：检索相关文档 → 拼进 Prompt → 调模型作答。LangChain 用来编排的语法叫 **LCEL（LangChain Expression Language）**，核心是「管道符 `|` 」。\n\n---\n\n## 一、Runnable：所有组件的统一接口\n\nLCEL 的基石是 `Runnable` 接口。模型、Prompt、Retriever、甚至一个普通函数，只要实现了 `invoke / batch / stream / pipe`，就能互相用 `|` 连接：\n\n```text\nRunnable 通用方法：\n  .invoke(input)        → 单次调用，返回结果\n  .batch([...])         → 批量调用\n  .stream(input)        → 流式调用\n  .pipe(anotherRunnable) → 拼接成新链\n```\n\n这意味着**模型能接 Prompt、Prompt 能接 Retriever、Retriever 能接函数**——一切皆 Runnable，自由组合。\n\n---\n\n## 二、pipe 管道符：LCEL 的语法糖\n\n```typescript\nimport { ChatPromptTemplate } from '@langchain/core/prompts'\nimport { ChatOpenAI } from '@langchain/openai'\nimport { StringOutputParser } from '@langchain/core/output_parsers'\n\nconst prompt = ChatPromptTemplate.fromTemplate('用一句话解释：{topic}')\nconst model = new ChatOpenAI({ model: 'gpt-4o-mini' })\nconst parser = new StringOutputParser()\n\n// 用 | 把三个 Runnable 串成链\nconst chain = prompt | model | parser\n\nconst answer = await chain.invoke({ topic: '什么是向量数据库' })\nconsole.log(answer)\n```\n\n`prompt | model | parser` 等价于 `prompt.pipe(model).pipe(parser)`，读起来像 Unix 管道：前一个输出自动喂给后一个输入。\n\n---\n\n## 三、RunnableSequence：显式顺序链\n\n`|` 底层就是 `RunnableSequence`，也可以显式写：\n\n```typescript\nimport { RunnableSequence } from '@langchain/core/runnables'\n\nconst chain = RunnableSequence.from([\n  prompt,\n  model,\n  parser,\n])\n\nawait chain.invoke({ topic: 'RAG 是什么' })\n```\n\n> 当链较复杂（含分支、命名步骤）时，用 `RunnableSequence.from([...])` 更清晰。\n\n---\n\n## 四、RunnablePassthrough：透传 / 注入上下文\n\n有时中间步骤需要把原始输入「透传」下去，或用 `assign` 往对象里塞字段：\n\n```typescript\nimport { RunnablePassthrough } from '@langchain/core/runnables'\n\n// 透传：输入原样向后传\nconst chain = RunnableSequence.from([\n  RunnablePassthrough.assign({\n    context: async (input) => {\n      const docs = await retriever.invoke(input.question)\n      return docs.map(d => d.pageContent).join('\\n')\n    },\n  }),\n  prompt,\n  model,\n  parser,\n])\n```\n\n`RunnablePassthrough.assign({ context })` 会在流经时**动态检索**并把结果挂到 `{ context }` 字段，再交给 prompt 模板。\n\n---\n\n## 五、第一个完整 RAG 问答链\n\n把前四天成果组装成「能回答问题」的链：\n\n```typescript\nimport { ChatPromptTemplate } from '@langchain/core/prompts'\nimport { ChatOpenAI } from '@langchain/openai'\nimport { StringOutputParser } from '@langchain/core/output_parsers'\nimport { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables'\n\nconst retriever = vectorStore.asRetriever({ k: 3 }) // Day 19 的 store\n\nconst prompt = ChatPromptTemplate.fromTemplate(`\n根据以下上下文回答问题。如果上下文没有答案，回答「不知道」。\n上下文：\n{context}\n\n问题：{question}\n`)\n\nconst model = new ChatOpenAI({ model: 'gpt-4o-mini' })\n\nconst ragChain = RunnableSequence.from([\n  {\n    context: (input) => retriever.invoke(input.question),\n    question: (input) => input.question,\n  },\n  prompt,\n  model,\n  new StringOutputParser(),\n])\n\nconst answer = await ragChain.invoke({\n  question: '公司年假有几天？',\n})\nconsole.log(answer) // 基于《员工手册》真实内容作答\n```\n\n> 注意：这里 `context` 和 `question` 用对象形式并行取值（函数写法），比 `assign` 更直观。`retriever.invoke` 返回 `Document[]`，prompt 里用 `{context}` 需要它在模板里已是字符串——实际可加 `.then(docs => docs.map(d=>d.pageContent).join('\\n'))`，或在 prompt 前接一步格式化。\n\n---\n\n## 六、链的组合能力（为什么重要）\n\n| 能力 | 说明 |\n|------|------|\n| 可组合 | 链本身也是 Runnable，能继续 `|` 别的链 |\n| 可流式 | `.stream()` 直接拿到逐字输出，无需改代码 |\n| 可批量 | `.batch([q1,q2,q3])` 并发处理多个问题 |\n| 可观测 | 配合 LangSmith 追踪每一步输入输出 |\n\n这一步让「RAG」从概念变成**可运行的程序**——你已拥有第一个真正「开卷回答」的 Agent 雏形。\n\n---\n\n## 七、常见坑\n\n1. **输入键不匹配**：prompt 模板用 `{question}`，链的输入就必须带 `question` 字段，否则报 `Missing value for prompt variable`。\n2. **retriever 输出未转字符串**：`retriever.invoke` 返回 `Document[]`，需 `.map(d => d.pageContent).join('\\n')` 再进 prompt。\n3. **混用 `|` 与 `.pipe`**：两者等价，但对象式 `{context, question}` 不能用 `|`，要放进 `RunnableSequence.from([...])` 或 `RunnablePassthrough.assign`。\n4. **忘记导出/复用**：把 `ragChain` 抽成函数 `buildRagChain(store)`，明天路由链会复用。\n5. **官方站不可访问**：中文镜像 `js.langchain.com.cn` / `langchain.nodejs.cn`。\n\n---\n\n## 八、学习资料\n\n以下站点均已验证可访问（国内镜像 / 中文）：\n\n| 资源 | 链接 | 说明 |\n|------|------|------|\n| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | 总入口，含 LCEL / Chains 章节 |\n| LangChain 中文文档 | https://langchain-doc.cn/ | 概念与 How-to 中文版 |\n| LangChain 中文网 | https://langchain.nodejs.cn/docs/concepts/ | 概念文档（含 LCEL） |\n| js.langchain.ac.cn LCEL 如何使用 | https://js.langchain.ac.cn/docs/concepts/lcel/ | LCEL 概念 |\n| js.langchain.ac.cn 链式调用 | https://js.langchain.ac.cn/docs/how_to/sequence/ | 顺序链 How-to |\n| 菜鸟教程 AI Agent 教程 | https://www.runoob.com/ai-agent/ai-agent-tutorial.html | 入门总览 |\n\n---\n\n## 九、明日预告\n\n**Day 21：LangChain.js Chains（下）— 路由链**\n\n顺序链所有问题走同一条路。但真实 Agent 需要「看人下菜」：数学题走计算器、闲聊走普通模型、检索类走 RAG。明天学 **Router Chain（路由链）** 与 `RunnableBranch`，让 Agent 根据问题类型自动分发到不同子链。\n\n> 🚀 Day 20 完成！你写出了第一个完整 RAG 问答链——检索、拼 Prompt、调模型一气呵成。明天，让它学会「分情况处理」。",
  }
,
  {
    id: "25",
    title: "AI Agent 学习计划 Day 21：LangChain.js Chains（下）— 路由链",
    slug: "ai-agent-day21-langchain-chains-lower",
    date: "2026-07-22",
    tags: ["AI Agent","LangChain","Chains","Router","RunnableBranch","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第二十一天。完成 Chains 模块：学会让 Agent「看人下菜」——用路由链（Router Chain / RunnableBranch）根据问题类型自动分发到不同子链。覆盖为什么需要路由、MultiPromptChain 旧式路由、LCEL 现代写法 RunnableBranch、语义路由（LLM 选择目的地），以及数学/检索/闲聊三类子链实战。",
    readingTime: 34,
    content: "# AI Agent 学习计划 Day 21：LangChain.js Chains（下）\n\n> 📅 日期：2026-07-22  \n> 🎯 阶段二：核心框架（Day 15-35）  \n> 📊 学习进度：Day 21 / 84（25.0%）\n\n## 前言\n\n昨天我们学会了用顺序链把组件串成一条路：所有问题都走「检索 → 拼 Prompt → 作答」。但真实 Agent 不会这么死板——数学题该走计算器、知识问答走 RAG、闲聊走普通模型。**路由链（Router Chain）** 就是让 Agent「看人下菜」：先判断意图，再分发到最合适的子链。这是 Agent 智能化的关键一步。\n\n---\n\n## 一、为什么需要路由\n\n```text\n不加路由（所有问题一条路）：\n  用户：「帮我算 123 × 456」→ RAG 检索不到 → 模型硬算易错\n  用户：「讲个笑话」        → RAG 检索无意义 → 浪费\n\n加路由（按意图分发）：\n  数学题   → 计算器子链\n  知识问答 → RAG 子链（昨天写的）\n  闲聊      → 普通 LLM 子链\n```\n\n路由让每条请求都走「最对」的路，准确率更高、成本更省。\n\n---\n\n## 二、旧式路由：MultiPromptChain\n\nLangChain 早期提供 `MultiPromptChain`，用 LLM 在多个「命名 Prompt」里挑最匹配的：\n\n```typescript\nimport { MultiPromptChain } from 'langchain/chains'\nimport { OpenAI } from '@langchain/openai'\n\nconst promptDescriptions = [\n  {\n    name: '物理',\n    description: '适用于物理问题，如力、能量、运动',\n    prompt: ChatPromptTemplate.fromTemplate('你是个物理老师。{input}'),\n  },\n  {\n    name: '数学',\n    description: '适用于数学计算问题',\n    prompt: ChatPromptTemplate.fromTemplate('你是个数学老师，请逐步计算。{input}'),\n  },\n]\n\nconst chain = MultiPromptChain.fromLLM(new OpenAI(), promptDescriptions)\nawait chain.invoke({ input: '牛顿第二定律是什么？' }) // → 路由到「物理」\n```\n\n> `description` 是给「路由 LLM」看的分类依据。缺点：API 较老、不够灵活，现代更推荐 LCEL 的 `RunnableBranch`。\n\n---\n\n## 三、现代路由：RunnableBranch（LCEL 首选）\n\n`RunnableBranch` 用**条件函数**决定走哪条分支，最清晰可控：\n\n```typescript\nimport { RunnableBranch } from '@langchain/core/runnables'\n\nconst branch = RunnableBranch.from([\n  {\n    // 条件：问题含数字运算 → 走数学链\n    condition: (input) => /\\d+\\s*[\\+\\-\\*\\/]\\s*\\d+/.test(input.question),\n    chain: mathChain,\n  },\n  {\n    // 条件：命中知识库关键词 → 走 RAG 链\n    condition: (input) => isKnowledgeQuestion(input.question),\n    chain: ragChain,\n  },\n  // 默认分支（兜底）：普通闲聊\n  generalChain,\n])\n\nawait branch.invoke({ question: '123 * 456 等于多少？' }) // → mathChain\n```\n\n- 每个分支是 `{ condition, chain }`\n- 最后一个**无 condition** 的即默认分支（必须提供，作兜底）\n- 条件函数返回 `true` 即用对应 `chain`，按顺序匹配\n\n---\n\n## 四、语义路由：让 LLM 来选择目的地\n\n规则条件（正则/关键词）太死板。更强大的是**让 LLM 做分类**，输出一个目的地标签，再映射子链：\n\n```typescript\nimport { RunnableSequence } from '@langchain/core/runnables'\nimport { z } from 'zod'\n\n// 1. 路由分类器：用 withStructuredOutput 让模型选目的地\nconst router = model.withStructuredOutput(\n  z.object({\n    destination: z.enum(['math', 'rag', 'chat']).describe('问题类型'),\n    reason: z.string(),\n  })\n).pipe(\n  // 2. 把标签映射到具体子链\n  (decision) => {\n    const map = { math: mathChain, rag: ragChain, chat: generalChain }\n    return map[decision.destination]\n  }\n)\n\n// 3. 组合：先路由，再执行选中的子链\nconst app = RunnableSequence.from([\n  { question: (i) => i.question, category: (i) => router.invoke(i.question) },\n  // 这里 category 是子链本身，需要 invoke\n  async (input) => input.category.invoke(input),\n])\n\nawait app.invoke({ question: '我们公司年假几天？' }) // → ragChain\n```\n\n> 语义路由比正则更强：能理解「帮我算下这组数据的标准差」也是数学类。代价是多一次 LLM 调用（可用小模型降本）。\n\n---\n\n## 五、完整实战：三类子链路由\n\n```typescript\nimport { RunnableBranch, RunnableSequence } from '@langchain/core/runnables'\n\n// 三个子链（前面已构建）\nconst mathChain = promptMath | model | parser\nconst ragChain  = buildRagChain(store)          // Day 20\nconst chatChain = promptChat | model | parser\n\nconst routerChain = RunnableBranch.from([\n  {\n    condition: (i) => /计算|算一下|等于|×|\\*/.test(i.question),\n    chain: mathChain,\n  },\n  {\n    condition: (i) => /年假|手册|制度|公司/.test(i.question),\n    chain: ragChain,\n  },\n  chatChain, // 兜底\n])\n\nconst app = RunnableSequence.from([\n  { question: (i) => i.question },\n  routerChain,\n])\n\nconsole.log(await app.invoke({ question: '年假有几天？' }))   // RAG\nconsole.log(await app.invoke({ question: '3.14 * 100 = ?' })) // 数学\nconsole.log(await app.invoke({ question: '你好呀' }))          // 闲聊\n```\n\n---\n\n## 六、路由链 vs 顺序链（何时用哪个）\n\n| 场景 | 用顺序链 | 用路由链 |\n|------|---------|---------|\n| 所有请求走同一流程 | ✅ | |\n| 需按类型分流 | | ✅ |\n| 流程固定、线性 | ✅ | |\n| 多专家/多工具切换 | | ✅ |\n\n> 实际 Agent = 路由链（外层分发） + 顺序链（内层处理）的组合。\n\n---\n\n## 七、常见坑\n\n1. **忘记默认分支**：`RunnableBranch` 必须提供无 condition 的兜底链，否则无匹配时报错。\n2. **条件顺序敏感**：分支按数组顺序匹配，第一个 `true` 即命中，把「更具体」的条件放前面。\n3. **语义路由多一次调用**：可用 `gpt-4o-mini` 做路由器降本；别用大模型分类浪费钱。\n4. **子链输入键不一致**：路由后子链拿到的输入要和子链 `.invoke` 期望的键一致。\n5. **官方站不可访问**：中文镜像 `js.langchain.com.cn` / `langchain.nodejs.cn`。\n\n---\n\n## 八、学习资料\n\n以下站点均已验证可访问（国内镜像 / 中文）：\n\n| 资源 | 链接 | 说明 |\n|------|------|------|\n| LangChain JS/TS 中文文档 | https://js.langchain.com.cn/docs/ | 总入口，含 Chains / Routing |\n| LangChain 中文文档 | https://langchain-doc.cn/ | 概念与 How-to 中文版 |\n| LangChain 中文网 | https://langchain.nodejs.cn/docs/concepts/ | 概念文档 |\n| js.langchain.ac.cn 路由链 | https://js.langchain.ac.cn/docs/how_to/routing/ | 路由 How-to |\n| js.langchain.ac.cn 链式调用 | https://js.langchain.ac.cn/docs/how_to/sequence/ | 顺序链 How-to |\n| 菜鸟教程 AI Agent 教程 | https://www.runoob.com/ai-agent/ai-agent-tutorial.html | 入门总览 |\n\n---\n\n## 九、明日预告\n\n**Day 22：LangChain.js Agents（上）— ReAct Agent 与 Tool 调用**\n\n路由链还是「静态分支」。真正自主的 Agent 能**自己决定调哪个工具、调几次**：ReAct（推理+行动）范式让模型边思考边调工具，直到得出答案。明天我们接入真实 Tool，写出第一个会「动手」的 Agent。\n\n> 🚀 Day 21 完成！你的 Agent 现在会「分情况处理」了。明天，让它学会自己调用工具。",
  }
,
  {
    id: "26",
    title: "AI Agent 学习计划 Day 22：LangChain.js Agents（上）— ReAct Agent 与 Tool 调用",
    slug: "ai-agent-day22-langchain-agents-upper",
    date: "2026-07-23",
    tags: ["AI Agent","LangChain","Agents","ReAct","ToolCalling","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第二十二天。正式进入 LangChain.js 的 Agents 模块：理解 ReAct（推理 + 行动）范式如何让 LLM 自主决定调用哪个工具、如何把 Thought/Action/Observation 串成循环，并用 createReactAgent / createToolCallingAgent + AgentExecutor 跑通第一个会查天气、会算数学的 Agent。",
    readingTime: 34,
    content: "# AI Agent 学习计划 Day 22：LangChain.js Agents（上）\n\n> 📅 日期：2026-07-23  \n> 🎯 阶段二：核心框架（Day 15-35）  \n> 📊 学习进度：Day 22 / 84（26.2%）\n\n## 前言\n\n前面四天我们学了 Model I/O、Retrieval、Chains——但那都是「你先设计好流程，模型照着走」。真正的 Agent 能**自己决定**下一步做什么：该查资料就查资料，该算数就调计算器。\n\n这一切的核心范式就是 **ReAct**（Reasoning + Acting）。今天是 Agents 模块的上半场：搞懂 ReAct 原理，并跑通第一个会调用工具的 Agent。\n\n## 一、为什么需要 Agent？\n\n链（Chain）是「写死的流程图」：输入 → 固定步骤 → 输出。它能处理流程可预期的任务，但面对「不知道需要几步、用哪个工具」的问题就抓瞎了。\n\nAgent 把决策权交给 LLM：每次循环，模型根据当前状态和可用工具，**自己决定**调用哪个工具、传什么参数，再用工具返回的结果继续思考，直到能给出最终答案。\n\n```\n用户问题\n   │\n   ▼\n┌─────────── Agent Loop ───────────┐\n│  Thought：我需要查天气             │\n│  Action：call_weather(city=北京)   │\n│  Observation：北京 28°C 晴         │\n│  Thought：够了，可以回答           │\n│  → Final Answer                   │\n└──────────────────────────────────┘\n```\n\n## 二、ReAct 范式三要素\n\nReAct 把模型的输出格式化成：\n\n- **Thought（思考）**：模型对当前情况的推理，比如「用户问北京天气，我应该调用天气工具」。\n- **Action（行动）**：要调用的工具名 + 参数，如 `weather(city=\"北京\")`。\n- **Observation（观察）**：工具执行后返回的结果，再喂回模型作为下一步思考的依据。\n\n这种「Thought → Action → Observation」的循环，正是我们 Day 12 学过的 Function Calling 与 Day 13 学过的 ReAct 规划模式的落地。\n\n## 三、在 LangChain.js 中定义工具\n\n工具是 Agent 与世界交互的「手」。用 `@langchain/core` 的 `tool` 装饰器 + Zod 定义最简洁：\n\n```ts\nimport { tool } from \"@langchain/core/tools\";\nimport { z } from \"zod\";\n\nconst calculator = tool(\n  async ({ expression }) => {\n    // 简化示例：真实场景用安全表达式库（如 mathjs evaluate）\n    return String(eval(expression));\n  },\n  {\n    name: \"calculator\",\n    description: \"计算数学表达式，如 2+3*4\",\n    schema: z.object({ expression: z.string() }),\n  }\n);\n\nconst weather = tool(\n  async ({ city }) => {\n    // 真实场景调用天气 API\n    return `${city} 今天 28°C，晴`;\n  },\n  {\n    name: \"weather\",\n    description: \"查询指定城市的当前天气\",\n    schema: z.object({ city: z.string() }),\n  }\n);\n\nconst tools = [calculator, weather];\n```\n\n工具三要素：**name**（唯一标识）、**description**（模型靠它选工具，务必写清用途与参数）、**schema**（Zod 校验入参）。\n\n## 四、用 createReactAgent + AgentExecutor 跑通\n\n现代 LangChain.js（v0.2+）推荐用工厂函数 + `AgentExecutor`：\n\n```ts\nimport { ChatOpenAI } from \"@langchain/openai\";\nimport { createReactAgent, AgentExecutor } from \"langchain/agents\";\nimport { pull } from \"langchain/hub\";\n\nconst llm = new ChatOpenAI({ model: \"gpt-4o-mini\", temperature: 0 });\n\n// 拉取官方 ReAct prompt 模板（或用自定义 prompt）\nconst prompt = await pull<ChatPromptTemplate>(\"hwchase17/react\");\n\nconst agent = await createReactAgent({ llm, tools, prompt });\n\nconst executor = new AgentExecutor({ agent, tools, verbose: true });\n\nconst res = await executor.invoke({\n  input: \"北京今天天气怎么样？如果温度高于 25 度，告诉我需要带几瓶水（每人 1 瓶/10 度）\",\n});\nconsole.log(res.output);\n```\n\n`verbose: true` 会在控制台打印完整的 Thought/Action/Observation，非常适合理解 Agent 的「思考过程」。\n\n## 五、更现代的写法：createToolCallingAgent\n\n如果你的模型支持原生 tool calling（如 GPT-4o、Claude），用 `createToolCallingAgent` 比 ReAct 文本解析更稳定、更高效——它直接走 Function Calling 协议，不需要模型输出可被正则解析的文本：\n\n```ts\nimport { createToolCallingAgent, AgentExecutor } from \"langchain/agents\";\nimport { ChatPromptTemplate, MessagesPlaceholder } from \"@langchain/core/prompts\";\n\nconst prompt = ChatPromptTemplate.fromMessages([\n  [\"system\", \"你是一个乐于助人的助手，善用工具回答问题。\"],\n  [\"human\", \"{input}\"],\n  new MessagesPlaceholder(\"agent_scratchpad\"),\n]);\n\nconst agent = createToolCallingAgent({ llm, tools, prompt });\nconst executor = new AgentExecutor({ agent, tools, verbose: true });\n```\n\n## 六、常见坑\n\n1. **工具 description 太含糊** → 模型选错工具或乱传参。描述要写清「做什么、何时用、参数含义」。\n2. **`agent_scratchpad` 占位符必须有** → 自定义 prompt 漏掉它，Agent 无法记录中间步骤会报错。\n3. **ReAct 文本解析脆弱** → 模型偶尔输出不合规格式会解析失败；能用 `createToolCallingAgent` 就优先用它。\n4. **死循环** → 模型一直调工具不收敛。`AgentExecutor` 可设 `maxIterations`（默认 15）兜底。\n5. **过度调用工具** → 简单问题也去查工具浪费 token，可在 system prompt 里约束「能直接回答就别调工具」。\n6. **Zod schema 与实际不符** → 模型传的参数过不了校验会抛错，需 `handleParsingErrors` 配合兜底。\n\n## 七、今日小结\n\n- Agent = 把「调用哪个工具、何时停」的决策权交给 LLM，核心是 ReAct 循环（Thought→Action→Observation）。\n- 工具用 `tool()` + Zod 定义，name/description/schema 三者缺一不可。\n- 现代写法：`createReactAgent` / `createToolCallingAgent` + `AgentExecutor`，`verbose` 看思考过程。\n- 能用原生 tool calling 的模型优先 `createToolCallingAgent`，更稳更高效。\n\n---\n\n🔗 **学习资料与网站**（均为国内可访问镜像）：\n- LangChain JS/TS 中文文档：https://js.langchain.com.cn/docs/\n- LangChain 中文文档（Agents 模块）：https://langchain-doc.cn/v1/python/langchain/agents.html\n- LangChain 中文网 Agents 指南：https://langchain.nodejs.cn/docs/concepts/agents/\n- js.langchain.ac.cn  Agents 教程：https://js.langchain.ac.cn/docs/tutorials/agents/\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n- ReAct Agent 原理与实战（腾讯云）：https://cloud.tencent.com/developer/article/2571430\n\n💡 **学习建议**：\n- 今天务必本地跑通那个天气 + 计算器的 Agent，把 `verbose` 打开，亲眼看看 Thought/Action/Observation 是怎么循环的——这是理解 Agent 的「顿悟时刻」。\n- 先别急着上 `createToolCallingAgent`，用 ReAct 文本版更能体会「模型在生成结构化计划」这件事。\n- 工具 description 一定要认真写，可以故意把描述写差再跑一次，对比模型选工具的差异。\n\n⏰ 预计学习时长：2 小时\n\n---\n\n进度：Day 22 / 84（26.2%）  \n下一站：Day 23 —— LangChain.js Agents（下）：自定义 Agent 与 initializeAgentExecutorWithOptions",
  }
,
  {
    id: "27",
    title: "AI Agent 学习计划 Day 23：LangChain.js Agents（下）— 自定义 Agent 与 initializeAgentExecutorWithOptions",
    slug: "ai-agent-day23-langchain-agents-lower",
    date: "2026-07-24",
    tags: ["AI Agent","LangChain","Agents","CustomAgent","AgentExecutor","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第二十三天。在昨天 ReAct / Tool 调用的基础上，深入「自定义 Agent」：对比旧式 initializeAgentExecutorWithOptions 与现代 LCEL 工厂函数、自定义 Agent 类型与 prompt、控制 AgentExecutor 行为（maxIterations / handleParsingErrors / returnIntermediateSteps / verbose），并给出一个自定义 prompt + 自定义工具编排的完整实战。",
    readingTime: 35,
    content: "# AI Agent 学习计划 Day 23：LangChain.js Agents（下）\n\n> 📅 日期：2026-07-24  \n> 🎯 阶段二：核心框架（Day 15-35）  \n> 📊 学习进度：Day 23 / 84（27.4%）\n\n## 前言\n\n昨天我们用 `createReactAgent` / `createToolCallingAgent` + `AgentExecutor` 跑通了第一个能自主调用工具的 Agent。但「开箱即用」的 Agent 往往不够：你可能想换一套 system prompt、限制最大循环次数、在解析失败时自动重试、或者拿到中间步骤做前端展示。\n\n今天聚焦**自定义 Agent**——如何掌控 Agent 的「大脑（prompt）」和「运行器（AgentExecutor）」的每一个旋钮。\n\n## 一、两条路线：旧式 vs 现代\n\nLangChain.js 历史上有两套创建 Agent 的方式，理解区别能避免踩兼容性坑：\n\n| 方式 | API | 特点 |\n|------|-----|------|\n| 旧式 | `initializeAgentExecutorWithOptions(tools, llm, options)` | 一行创建，内部按 `agentType` 选模板；黑盒、定制性弱 |\n| 现代 | `createXxxAgent(...)` + `new AgentExecutor({...})` | 显式构造，prompt/工具/参数全可控；推荐 |\n\n### 旧式：`initializeAgentExecutorWithOptions`\n\n```ts\nimport { initializeAgentExecutorWithOptions } from \"langchain/agents\";\n\nconst executor = await initializeAgentExecutorWithOptions(tools, llm, {\n  agentType: \"openai-functions\", // 或 \"chat-zero-shot-react-description\" / \"openai-tools\"\n  verbose: true,\n});\n\nconst res = await executor.invoke({ input: \"北京今天天气怎么样？\" });\n```\n\n常见 `agentType`：\n- `\"chat-zero-shot-react-description\"`：基于 ReAct 文本提示，兼容任意 chat 模型。\n- `\"openai-functions\"`：走 OpenAI function calling（旧）。\n- `\"openai-tools\"`：走 OpenAI 原生 tool calling（新，推荐）。\n\n> ⚠️ 旧式 API 在新版 LangChain 中已被标记**弃用（deprecated）**，新项目请用现代工厂函数。但老代码里大量出现，看懂即可。\n\n## 二、自定义 AgentExecutor 行为\n\n无论用哪种方式创建 `AgentExecutor`，都能通过参数精细控制运行：\n\n```ts\nconst executor = new AgentExecutor({\n  agent,\n  tools,\n  verbose: true,                  // 打印 Thought/Action/Observation\n  maxIterations: 6,              // 最多循环 6 步，防止死循环\n  returnIntermediateSteps: true, // 返回中间步骤，便于前端展示\n  handleParsingErrors: true,     // 模型输出格式错误时自动尝试纠正\n});\n```\n\n`returnIntermediateSteps: true` 时，结果会多一个 `intermediateSteps` 字段：\n\n```ts\nconst res = await executor.invoke({ input: \"...\" });\nres.output;               // 最终答案\nres.intermediateSteps;    // [{ action, observation }, ...]\n```\n\n这对**前端可视化 Agent 思考过程**（如展示「我先查了天气，又算了数学」）非常有用。\n\n### 进阶：`handleParsingErrors` 自定义\n\n```ts\nconst executor = new AgentExecutor({\n  agent,\n  tools,\n  handleParsingErrors:\n    \"工具调用格式错误，请严格按要求返回 Action 和 Action Input。\",\n});\n```\n\n当 LLM 返回无法解析的内容时，这段提示会被塞回给模型，让它自我纠正——大幅提升健壮性。\n\n## 三、自定义 Prompt（Agent 的大脑）\n\nAgent 的 prompt 决定了它的「性格」和行为规则。现代方式下，你可以完全自定义：\n\n```ts\nimport { ChatPromptTemplate, MessagesPlaceholder } from \"@langchain/core/prompts\";\n\nconst customPrompt = ChatPromptTemplate.fromMessages([\n  [\n    \"system\",\n    `你是一个「严谨的中文科研助手」。\n     - 只在有工具能提供事实时才调用工具，禁止编造。\n     - 所有数字必须来自工具结果。\n     - 用中文、分点作答，并在结尾标注「来源」。\n     当前日期：{today}`,\n  ],\n  [\"human\", \"{input}\"],\n  new MessagesPlaceholder(\"agent_scratchpad\"),\n]);\n\nconst agent = createToolCallingAgent({\n  llm,\n  tools,\n  prompt: customPrompt,\n});\n```\n\n注意 system prompt 里引用了 `{today}` 这类外部变量时，需要在 `invoke` 时一并传入：\n\n```ts\nconst res = await executor.invoke({\n  input: \"2024 诺奖物理学奖得主是谁？\",\n  today: \"2026-07-24\",\n});\n```\n\n## 四、自定义工具编排实战\n\n把计算器升级成「带安全解析」的自定义工具，并配自定义 Agent：\n\n```ts\nimport { tool } from \"@langchain/core/tools\";\nimport { z } from \"zod\";\nimport { evaluate } from \"mathjs\"; // 安全的表达式计算库\n\nconst safeCalc = tool(\n  async ({ expression }) => {\n    try {\n      const r = evaluate(expression);\n      return `计算结果：${r}`;\n    } catch (e) {\n      return `计算失败：${e.message}`;\n    }\n  },\n  {\n    name: \"safe_calculator\",\n    description: \"安全地计算数学表达式，支持 + - * / ^ 等，如 '1+2*3'。\",\n    schema: z.object({ expression: z.string() }),\n  }\n);\n\nconst agent = createToolCallingAgent({\n  llm,\n  tools: [safeCalc],\n  prompt: customPrompt,\n});\nconst executor = new AgentExecutor({\n  agent,\n  tools: [safeCalc],\n  verbose: true,\n  maxIterations: 5,\n  returnIntermediateSteps: true,\n});\n\nconst res = await executor.invoke({\n  input: \"帮我算 (1+2)*3 等于多少？\",\n  today: \"2026-07-24\",\n});\nconsole.log(res.output);\nconsole.log(\"思考轨迹：\", res.intermediateSteps);\n```\n\n## 五、常见坑\n\n1. **旧式 `initializeAgentExecutorWithOptions` 已弃用** → 新代码用 `createXxxAgent` + `AgentExecutor`，避免未来升级报错。\n2. **`agent_scratchpad` 占位符必须有** → 自定义 prompt 漏掉 `MessagesPlaceholder(\"agent_scratchpad\")` 会导致 Agent 无法记录中间步骤而崩溃。\n3. **`maxIterations` 设太大** → 可能让模型无限循环烧 token；一般 5~8 即可，简单任务 3 也够。\n4. **`returnIntermediateSteps` 忘开启** → 前端想展示思考链却拿不到 `intermediateSteps`，调试也变难。\n5. **自定义 prompt 引用了未传变量** → 如 `{today}` 但 invoke 没给，会抛「Missing variable」错误；要么用 `prompt.partial()` 预设，要么每次 invoke 补齐。\n6. **`handleParsingErrors` 设成 false** → 一旦 LLM 输出格式异常就直接抛错，体验差；生产建议开启或给自定义提示。\n7. **重复注册同一工具名** → 工具 `name` 必须唯一，否则 Agent 调用歧义。\n\n## 六、今日小结\n\n- 旧式 `initializeAgentExecutorWithOptions`（含 `agentType`）已被官方弃用，新项目一律用 `createXxxAgent` + `AgentExecutor`。\n- `AgentExecutor` 关键旋钮：`maxIterations` 防死循环、`handleParsingErrors` 自动纠错、`returnIntermediateSteps` 拿思考轨迹、`verbose` 看过程。\n- 自定义 prompt 是定制 Agent 行为的最强手段，记得保留 `agent_scratchpad` 占位符，并补齐引用的外部变量。\n\n---\n\n🔗 **学习资料与网站**（均为国内可访问镜像）：\n- LangChain JS/TS 中文文档：https://js.langchain.com.cn/docs/\n- LangChain 中文文档（自定义 Agent）：https://langchain-doc.cn/v1/python/langchain/custom_agents.html\n- LangChain 中文网 AgentExecutor 指南：https://langchain.nodejs.cn/docs/concepts/agents/\n- js.langchain.ac.cn 自定义 Agent 教程：https://js.langchain.ac.cn/docs/tutorials/agents/\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n- ReAct Agent 终极指南（掘金）：https://juejin.cn/post/7518707715129688064\n\n💡 **学习建议**：\n- 把昨天的 Agent 改造一下：加一个 `maxIterations: 4` 和 `returnIntermediateSteps: true`，跑到前端能看到「思考轨迹」为止——这是后续做 Agent UI 的基础。\n- 故意把 `agent_scratchpad` 占位符删掉跑一次，亲眼看看报错，比看文档记得牢。\n- 尝试给 Agent 写一套「严谨科研助手」prompt（像本文第三节），对比默认 prompt 的回答差异，体会 prompt 即「性格」。\n\n⏰ 预计学习时长：2 小时\n\n---\n\n进度：Day 23 / 84（27.4%）  \n下一站：Day 24 —— LangChain.js Memory（上）：Buffer Memory 与 Summary Memory",
  }
,
  {
    id: "28",
    title: "AI Agent 学习计划 Day 24：LangChain.js Memory（上）— Buffer Memory 与 Summary Memory",
    slug: "ai-agent-day24-langchain-memory-upper",
    date: "2026-07-25",
    tags: ["AI Agent","LangChain","Memory","BufferMemory","SummaryMemory","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第二十四天。Agent 不能「金鱼记忆」——今天进入 LangChain.js 的 Memory 模块（上）：理解为什么 LLM 需要记忆、消息列表如何作为短期记忆、ConversationBufferMemory 原样保存全部对话、ConversationSummaryMemory 用 LLM 把历史压缩成摘要省 token，以及现代 LCEL 做法（把 messages 数组直接喂给模型），并给出多轮对话实战与常见坑。",
    readingTime: 33,
    content: "# AI Agent 学习计划 Day 24：LangChain.js Memory（上）\n\n> 📅 日期：2026-07-25  \n> 🎯 阶段二：核心框架（Day 15-35）  \n> 📊 学习进度：Day 24 / 84（28.6%）\n\n## 前言\n\n前两天的 Agent 有个致命缺陷：每次调用都是「失忆」的。你问「我叫什么？」，它答不上来——因为 LLM 本身无状态，每次请求只看到当前这条消息。\n\n要让 Agent 记住上下文，就得引入 **Memory（记忆）**。今天是 Memory 模块上半场：Buffer Memory（原样缓存）与 Summary Memory（摘要压缩）。\n\n## 一、为什么 LLM 需要记忆？\n\nLLM 是无状态的：它的「记忆」完全来自你塞进 `messages` 数组里的历史。对话越长，数组越大，token 越贵、越容易超出上下文窗口。\n\n记忆系统要解决两件事：\n1. **多轮连贯**：让模型知道「刚才聊到哪了」。\n2. **成本控制**：历史太长时，要么截断，要么压缩成摘要。\n\n## 二、ConversationBufferMemory（原样缓存）\n\n最简单：把每一轮 human/ai 消息原样存下来，下次一并传给模型。\n\n```ts\nimport { ConversationBufferMemory } from \"langchain/memory\";\nimport { ChatOpenAI } from \"@langchain/openai\";\nimport { ConversationChain } from \"langchain/chains\";\n\nconst memory = new ConversationBufferMemory();\nconst model = new ChatOpenAI({ model: \"gpt-4o-mini\" });\nconst chain = new ConversationChain({ llm: model, memory });\n\nawait chain.invoke({ input: \"我叫小明。\" });\nconst res = await chain.invoke({ input: \"我刚才说我叫什么？\" });\nconsole.log(res.response); // 小明\n```\n\n`memory.buffer` 里就是完整的对话字符串。优点是实现简单、信息零丢失；缺点是**线性增长**，聊 50 轮就爆 token。\n\n## 三、ConversationSummaryMemory（摘要压缩）\n\n用另一个 LLM 调用，把历史「总结」成一段越来越精炼的摘要，只把摘要 + 最近几轮传给模型：\n\n```ts\nimport { ConversationSummaryMemory } from \"langchain/memory\";\n\nconst memory = new ConversationSummaryMemory({ llm: model });\n\nawait memory.saveContext(\n  { input: \"我叫小明，喜欢游泳。\" },\n  { output: \"好的，已记住。\" }\n);\nawait memory.saveContext(\n  { input: \"我住在北京。\" },\n  { output: \"收到，北京。\" }\n);\n\nconst vars = await memory.loadMemoryVariables({});\nconsole.log(vars.history); // 一段 LLM 生成的摘要：用户叫小明，喜欢游泳，住北京。\n```\n\n适合**长对话**场景——聊得越久越省 token。代价是每次存上下文都多一次 LLM 调用（成本 + 延迟），且摘要可能「忘掉」细节。\n\n> 还有中间形态 `ConversationSummaryBufferMemory`：保留最近 N 轮原文 + 更早的摘要，兼顾细节与成本，是生产常用选择。\n\n## 四、现代 LCEL 做法（推荐）\n\n新版 LangChain 更推荐**直接管理 messages 数组**，而非用 legacy 的 `Memory` 类：\n\n```ts\nimport { ChatOpenAI } from \"@langchain/openai\";\nimport { ChatPromptTemplate, MessagesPlaceholder } from \"@langchain/core/prompts\";\nimport { HumanMessage, AIMessage } from \"@langchain/core/messages\";\n\nconst prompt = ChatPromptTemplate.fromMessages([\n  [\"system\", \"你是一个有记忆的助手。\"],\n  new MessagesPlaceholder(\"history\"), // 历史消息占位\n  [\"human\", \"{input}\"],\n]);\n\nconst model = new ChatOpenAI({ model: \"gpt-4o-mini\" });\nconst chain = prompt.pipe(model);\n\n// 自己维护 history 数组\nlet history: (HumanMessage | AIMessage)[] = [];\n\nconst res1 = await chain.invoke({ input: \"我叫小红。\", history });\nhistory.push(new HumanMessage(\"我叫小红。\"));\nhistory.push(new AIMessage(res1.content as string));\n\nconst res2 = await chain.invoke({ input: \"我刚说我叫什么？\", history });\nconsole.log(res2.content);\n```\n\n这种方式灵活、透明，配合 LangGraph 的 `MessageState` 还能做「摘要裁剪」等高级策略。\n\n## 五、常见坑\n\n1. **忘记把 history 传进 prompt** → 用 `MessagesPlaceholder(\"history\")` 但 invoke 时漏了 `history` 键，模型仍失忆。\n2. **Buffer Memory 无限增长** → 长对话爆上下文窗口；要么换 Summary，要么手动截断 `history.slice(-6)`。\n3. **Summary Memory 摘要丢失细节** → 关键信息（如用户名）被压缩掉；重要事实建议单独用 `buffer` 或外部存储。\n4. **legacy Memory 类已弃用** → `langchain/memory` 的 `ConversationXxxMemory` 在新版被标记 legacy，新项目优先 LCEL messages 数组。\n5. **消息顺序错乱** → history 必须是 Human/Ai 交替且以合理顺序传入，否则模型理解错乱。\n6. **多用户串号** → 记忆是「按会话」隔离的，必须给每个用户/会话单独维护一份 `history` 或 `memory` 实例（keyed by sessionId）。\n\n## 六、今日小结\n\n- LLM 无状态，记忆 = 塞进 `messages` 的历史；记忆解决「连贯」与「成本」两件事。\n- `ConversationBufferMemory`：原样缓存，简单但线性增长。\n- `ConversationSummaryMemory`：LLM 压缩摘要，省 token 但可能丢细节；`SummaryBufferMemory` 折中。\n- 现代做法：直接维护 messages 数组 + `MessagesPlaceholder`，更灵活、契合 LangGraph。\n- 生产务必按 sessionId 隔离记忆，避免用户串号。\n\n---\n\n🔗 **学习资料与网站**（均为国内可访问镜像）：\n- LangChain JS/TS 中文文档：https://js.langchain.com.cn/docs/\n- LangChain 中文网 记忆模块（Memory）：https://langchain.nodejs.cn/docs/concepts/memory/\n- LangChain 中文文档 Memory 概述：https://langchain-doc.cn/v1/python/langchain/memory.html\n- www.langchain.com.cn Memory 文档：https://www.langchain.com.cn/docs/modules/data_connection/memory/\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n\n💡 **学习建议**：\n- 先跑通 `ConversationBufferMemory` 多轮对话（感受「它终于记得我名字了」），再换成 `ConversationSummaryMemory` 对比 token 消耗。\n- 亲手用 LCEL messages 数组维护一份 `history`，这是后续做带记忆 Agent / LangGraph 的基础。\n- 思考一个真实场景：客服机器人如何按 userId 隔离记忆？这决定了你的记忆架构。\n\n⏰ 预计学习时长：2 小时\n\n---\n\n进度：Day 24 / 84（28.6%）  \n下一站：Day 25 —— LangChain.js Memory（下）：向量记忆",
  }
,
  {
    id: "29",
    title: "AI Agent 学习计划 Day 25：LangChain.js Memory（下）— 向量记忆",
    slug: "ai-agent-day25-langchain-memory-lower",
    date: "2026-07-26",
    tags: ["AI Agent","LangChain","Memory","VectorMemory","VectorStore","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第二十五天。Memory 模块收官：向量记忆（Vector Memory）。当对话/知识多到 Buffer/Summary 都装不下时，把记忆存进向量数据库，按需语义检索最相关的历史片段喂给模型，实现「长期记忆 + 精准召回」。覆盖 VectorStoreRetrieverMemory 原理、与 Day 19 向量库的衔接、完整实战、与 Buffer/Summary 的选型对比及常见坑。",
    readingTime: 33,
    content: "# AI Agent 学习计划 Day 25：LangChain.js Memory（下）\n\n> 📅 日期：2026-07-26  \n> 🎯 阶段二：核心框架（Day 15-35）  \n> 📊 学习进度：Day 25 / 84（29.8%）\n\n## 前言\n\n昨天学了 Buffer（原样缓存）和 Summary（摘要压缩）——它们都活在内存里，对话一多还是装不下，而且「旧话题」很快被新话题挤出去。\n\n真正的长期记忆应该像人脑：不是记住全部，而是**需要时能想起相关的**。这就是**向量记忆（Vector Memory）**——把记忆存入向量库，按语义检索最相关片段。这正是我们 Day 18/19 学的 RAG 技术直接复用。\n\n## 一、向量记忆的核心思想\n\n普通记忆把「全部历史」塞进 prompt；向量记忆只把「和当前问题最相关的历史」塞进去：\n\n```\n新问题时 → 把 query 嵌入成向量 → 在记忆向量库里检索 Top-K 相似历史 → 把命中片段 + 新问题一起喂给模型\n```\n\n好处：\n- **无限容量**：记忆落库（Chroma/MemoryVectorStore/Pinecone），不受上下文窗口限制。\n- **精准召回**：只取相关片段，token 省、噪声低。\n- **长期跨会话**：记忆可持久化，关掉再开还能「记得」。\n\n## 二、VectorStoreRetrieverMemory（legacy）\n\n```ts\nimport { MemoryVectorStore } from \"langchain/vectorstores/memory\";\nimport { OpenAIEmbeddings } from \"@langchain/openai\";\nimport { VectorStoreRetrieverMemory } from \"langchain/memory\";\n\nconst embeddings = new OpenAIEmbeddings();\nconst vectorStore = new MemoryVectorStore(embeddings);\nconst memory = new VectorStoreRetrieverMemory({\n  vectorStore,\n  memoryKey: \"history\", // 检索结果注入 prompt 的键\n  // k: 3,  // 默认返回 Top-3 相关片段\n});\n\n// 存记忆（每条 input/output 会被嵌入存储）\nawait memory.saveContext(\n  { input: \"我最喜欢的语言是 TypeScript。\" },\n  { output: \"记下了，TypeScript 是你的最爱。\" }\n);\nawait memory.saveContext(\n  { input: \"我在做一个 AI Agent 项目。\" },\n  { output: \"好的，关注你的 Agent 项目。\" }\n);\n\n// 检索：会语义匹配到「TypeScript」这条\nconst vars = await memory.loadMemoryVariables({\n  input: \"我之前说最喜欢哪门语言来着？\",\n});\nconsole.log(vars.history); // 命中相关片段，而非全部对话\n```\n\n## 三、现代 LCEL 做法（推荐）：自己接 Retriever\n\n新版更推荐直接用 Day 18/19 的 `VectorStore` + `asRetriever()`，把检索结果拼进 prompt：\n\n```ts\nimport { MemoryVectorStore } from \"langchain/vectorstores/memory\";\nimport { OpenAIEmbeddings } from \"@langchain/openai\";\nimport { ChatOpenAI } from \"@langchain/openai\";\nimport { ChatPromptTemplate, MessagesPlaceholder } from \"@langchain/core/prompts\";\nimport { Document } from \"@langchain/core/documents\";\n\nconst embeddings = new OpenAIEmbeddings();\nconst store = await MemoryVectorStore.fromDocuments(\n  [\n    new Document({ pageContent: \"用户最喜欢的语言是 TypeScript。\" }),\n    new Document({ pageContent: \"用户在做 AI Agent 项目。\" }),\n  ],\n  embeddings\n);\nconst retriever = store.asRetriever({ k: 2 });\n\nconst prompt = ChatPromptTemplate.fromMessages([\n  [\"system\", \"参考以下相关记忆回答用户：\\n{context}\"],\n  [\"human\", \"{input}\"],\n]);\nconst model = new ChatOpenAI({ model: \"gpt-4o-mini\" });\nconst chain = prompt.pipe(model);\n\nconst docs = await retriever.invoke(\"我最喜欢哪门语言？\");\nconst res = await chain.invoke({\n  context: docs.map((d) => d.pageContent).join(\"\\n\"),\n  input: \"我最喜欢哪门语言？\",\n});\nconsole.log(res.content);\n```\n\n## 四、三种记忆选型对比\n\n| 记忆类型 | 容量 | 成本 | 适合场景 |\n|---------|------|------|---------|\n| Buffer Memory | 小（线性增长） | 低 | 短对话、demo |\n| Summary Memory | 中 | 中（每次多一次 LLM 调用） | 中等长度、要保关键信息 |\n| **Vector Memory** | 大（落库） | 中（嵌入+检索） | 长期记忆、知识型 Agent、跨会话 |\n\n实践中常**组合使用**：用 Buffer 保最近几轮、用 Vector 召回久远相关、用 Summary 压缩中段。\n\n## 五、常见坑\n\n1. **legacy `VectorStoreRetrieverMemory` 已弃用** → 新项目直接用 `VectorStore.asRetriever()` 拼 prompt，更可控。\n2. **存了不检索** → saveContext 后没在 prompt 里注入 `vars.history`/检索结果，记忆形同虚设。\n3. **嵌入模型不一致** → 记忆写入与检索用的 Embeddings 必须是同一个模型，否则语义不匹配。\n4. **k 设太大** → 召回无关片段淹没上下文；一般 3~5 足够，可配合 score 阈值过滤。\n5. **忘记持久化** → MemoryVectorStore 是内存库，进程重启即丢；要长期记忆请用 Chroma/Pinecone 持久化。\n6. **敏感信息入向量库** → 记忆可能含隐私，落库前需脱敏或加密。\n\n## 六、今日小结\n\n- 向量记忆 = 把记忆存入向量库、按语义检索相关片段，解决「容量无限 + 精准召回」的长期记忆需求。\n- 本质是 Day 18/19 RAG 技术在记忆场景的直接复用。\n- legacy `VectorStoreRetrieverMemory` 已弃用，现代做法：`VectorStore.asRetriever()` + 拼 prompt。\n- 生产常组合 Buffer + Summary + Vector 三件套；注意模型一致、k 值、持久化、脱敏。\n\n---\n\n🔗 **学习资料与网站**（均为国内可访问镜像）：\n- LangChain JS/TS 中文文档：https://js.langchain.com.cn/docs/\n- LangChain 中文网 记忆模块：https://langchain.nodejs.cn/docs/concepts/memory/\n- LangChain 中文文档 Memory 概述：https://langchain-doc.cn/v1/python/langchain/memory.html\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n- （向量库衔接，见 Day 19）LangChain 中文网 向量存储：https://langchain.nodejs.cn/docs/concepts/vectorstores/\n\n💡 **学习建议**：\n- 把 Day 24 的 LCEL messages 数组版，改造成「Vector Memory」：把历史存进 MemoryVectorStore，每次回答前先检索相关片段拼进 system prompt。\n- 对比实验：问一个「一周前聊过的冷门话题」，看 Buffer（可能已滚出窗口）vs Vector（能召回）的差异，体会长期记忆价值。\n- 想想你的知识库问答项目（Day 57+）如何复用今天的向量记忆思路。\n\n⏰ 预计学习时长：2 小时\n\n---\n\n进度：Day 25 / 84（29.8%）  \n下一站：Day 26 —— Vercel AI SDK - AI Core（上）：统一 LLM 调用接口与 generateText",
  }
,
  {
    id: "30",
    title: "AI Agent 学习计划 Day 26：Vercel AI SDK - AI Core（上）— 统一 LLM 调用接口与 generateText",
    slug: "ai-agent-day26-vercel-ai-core-upper",
    date: "2026-07-27",
    tags: ["AI Agent","Vercel AI SDK","generateText","AI Core","学习笔记"],
    excerpt: "AI Agent 84 天学习计划第二十六天。从 LangChain.js 切换到 Vercel AI SDK：它更轻量、流式优先、对前端（React/Next.js）集成极好。今天聚焦 AI Core（上）：统一的模型调用接口、generateText 的多种用法、messages 与 prompt 模板、部分流式（partialStream）、错误处理与多模型切换，对比 LangChain 让你体会两种设计哲学。",
    readingTime: 33,
    content: "# AI Agent 学习计划 Day 26：Vercel AI SDK - AI Core（上）\n\n> 📅 日期：2026-07-27  \n> 🎯 阶段二：核心框架（Day 15-35）  \n> 📊 学习进度：Day 26 / 84（31.0%）\n\n## 前言\n\n前 11 天（Day 15-25）我们啃完了 LangChain.js 五大模块。今天起切换到**第二个核心框架 Vercel AI SDK**——它更轻量、流式优先、和 Next.js/React 前端集成是「亲儿子」级别。\n\nAI SDK 的包结构：\n- `@ai-sdk/core` / `ai`：AI Core（模型调用、生成、流式）。\n- `@ai-sdk/react`：前端 `useChat` 等 UI hook。\n- `@ai-sdk/openai` / `@ai-sdk/anthropic`：各家模型 provider。\n\n今天先攻 **AI Core（上）**：怎么用一套统一 API 调任意模型。\n\n## 一、安装与初始化\n\n```bash\nnpm i ai @ai-sdk/openai @ai-sdk/react\n```\n\n```ts\nimport { generateText } from \"ai\";\nimport { openai } from \"@ai-sdk/openai\";\n\nconst { text } = await generateText({\n  model: openai(\"gpt-4o-mini\"),\n  prompt: \"用一句话解释什么是 AI Agent。\",\n});\nconsole.log(text);\n```\n\n关键点：模型通过 `provider(\"model-id\")` 指定，**换模型只改这一行**——这就是「统一接口」的威力（`anthropic(\"claude-3-5-sonnet\")` 即可无缝切换）。\n\n## 二、generateText 的几种用法\n\n### 1. 简单 prompt\n```ts\nconst { text } = await generateText({\n  model: openai(\"gpt-4o-mini\"),\n  prompt: \"……\",\n});\n```\n\n### 2. messages 多轮（更接近 Chat 场景）\n```ts\nconst { text } = await generateText({\n  model: openai(\"gpt-4o-mini\"),\n  messages: [\n    { role: \"system\", content: \"你是中文技术助手。\" },\n    { role: \"user\", content: \"什么是 RAG？\" },\n    { role: \"assistant\", content: \"RAG 是检索增强生成……\" },\n    { role: \"user\", content: \"能举个例子吗？\" },\n  ],\n});\n```\n\n### 3. 模板 + 变量（prompt 工程）\n```ts\nconst { text } = await generateText({\n  model: openai(\"gpt-4o-mini\"),\n  system: \"你是{role}，请用{style}风格回答。\",\n  prompt: \"解释向量数据库。\",\n  // 通过 messages 传参需手动替换，或用 experimental 模板\n});\n```\n\n## 三、返回值全貌\n\n`generateText` 不止返回 `text`：\n\n```ts\nconst result = await generateText({ model, prompt });\nresult.text;        // 完整文本\nresult.finishReason; // \"stop\" | \"length\" | \"tool-calls\" | ...\nresult.usage;        // { promptTokens, completionTokens, totalTokens }\nresult.response;     // 原始响应（含 id、model、headers）\nresult.toolCalls;    // 若有工具调用（Day 30+ 用）\n```\n\n`usage` 对成本监控很重要；`finishReason === \"length\"` 说明触到了 `maxTokens` 上限，需要调大。\n\n## 四、部分流式：partialTextStream\n\n想在生成时就逐步拿到文本（不写流式 API）？AI SDK 提供 `partialTextStream`：\n\n```ts\nconst result = await generateText({ model, prompt });\nfor await (const delta of result.partialTextStream) {\n  process.stdout.write(delta);\n}\n```\n\n> 真正的「流式 API」用 `streamText`（明天 Day 27 详讲），`partialTextStream` 是 `generateText` 的便捷包装。\n\n## 五、错误处理与多模型切换\n\n```ts\nimport { generateText } from \"ai\";\nimport { openai } from \"@ai-sdk/openai\";\nimport { anthropic } from \"@ai-sdk/anthropic\";\n\n// 失败自动降级到另一个 provider\nasync function chat(prompt: string) {\n  try {\n    const { text } = await generateText({\n      model: openai(\"gpt-4o-mini\"),\n      prompt,\n    });\n    return text;\n  } catch (e) {\n    const { text } = await generateText({\n      model: anthropic(\"claude-3-5-haiku\"),\n      prompt,\n    });\n    return text;\n  }\n}\n```\n\n## 六、LangChain vs Vercel AI SDK（设计哲学对比）\n\n| 维度 | LangChain.js | Vercel AI SDK |\n|------|-------------|---------------|\n| 定位 | 全家桶（链/代理/检索/记忆） | 轻量核心 + 前端流式优先 |\n| 学习曲线 | 重（概念多） | 轻（API 直白） |\n| 前端集成 | 需自己接 | `useChat` 开箱即用 |\n| 流式 | LCEL 流式较繁琐 | 一等公民（`streamText`） |\n| 适合 | 复杂 RAG/Agent 编排 | 聊天 UI、快速产品化 |\n\n后续 Day 57+ 实战会用两者结合：Vercel AI SDK 做流式对话 UI + LangChain 做后端 RAG。\n\n## 七、常见坑\n\n1. **忘记装 provider 包** → `openai` 来自 `@ai-sdk/openai`，只装 `ai` 会报「model not found」。\n2. **混用模型 id 格式** → `openai(\"gpt-4o-mini\")` 不是 `\"openai/gpt-4o-mini\"`，provider 已封装前缀。\n3. **`finishReason: \"length\"` 没处理** → 长输出被截断，应调大 `maxTokens` 或改用流式。\n4. **Node 版本过低** → AI SDK v4+ 需 Node 18+，老环境会报运行时错误。\n5. **官方站不可访问** → sdk.vercel.ai 在用户网络下不稳定，改用国内镜像（见下）。\n6. **`generateText` 大输出占内存** → 超长生成优先 `streamText` 边收边处理。\n\n## 八、今日小结\n\n- Vercel AI SDK = 轻量 + 流式优先 + 前端亲儿子；核心包 `ai` + provider 包（如 `@ai-sdk/openai`）。\n- `generateText({ model, prompt/messages })` 是统一入口，换模型只改 `provider(\"id\")`。\n- 返回值含 `text / finishReason / usage / toolCalls`，`usage` 用于成本监控。\n- `partialTextStream` 可渐进拿文本；真流式用明天的 `streamText`。\n- 与 LangChain 互补：Vercel 做流式 UI，LangChain 做后端编排。\n\n---\n\n🔗 **学习资料与网站**（优先国内可访问镜像）：\n- Vercel AI SDK 中文文档（引言）：https://ai-sdk.com.cn/docs/introduction\n- Vercel AI SDK 中文文档（generateText）：https://ai-sdk.com.cn/docs/ai-sdk-core/generate-text\n- Vercel AI SDK 完整深入教程（掘金）：https://juejin.cn/post/7604761524977500169\n- Vercel AI SDK 6 完整教程（腾讯云）：https://cloud.tencent.com/developer/article/2630363\n- 官方文档（可能受限）：https://sdk.vercel.ai/docs/ai-sdk-core/generating-text\n\n💡 **学习建议**：\n- 今天务必本地跑通 `generateText`，并故意把模型换成 `anthropic(\"claude-3-5-haiku\")`（需装 `@ai-sdk/anthropic` + 配 key），体会「换模型只改一行」。\n- 打印 `result.usage` 和 `result.finishReason`，养成关注 token 成本的习惯。\n- 把 Day 26 与 Day 16（LangChain Model I/O）对照看，理解两种「统一调用」设计差异——这决定了你将来选型。\n\n⏰ 预计学习时长：2 小时\n\n---\n\n进度：Day 26 / 84（31.0%）  \n下一站：Day 27 —— Vercel AI SDK - AI Core（下）：streamText 与流式响应",
  }
,
  {
    id: "31",
    title: "Vercel AI SDK - AI Core（下）：streamText 与流式响应",
    slug: "ai-agent-day27-vercel-ai-core-lower",
    date: "2026-07-28",
    tags: ["AI Agent","Vercel AI SDK","streamText","流式响应","TypeScript"],
    excerpt: "深入 Vercel AI SDK 的 streamText：流式生成原理、textStream/fullStream/partialTextStream 的区别、前端消费流式响应的方式、中断与错误控制，以及与 generateText 的选型对比。",
    readingTime: 12,
    content: "## 为什么需要流式响应\n\n在 Day 26 我们学习了 `generateText`，它是「攒齐全部文本再返回」。这对 CLI 脚本没问题，但对聊天类产品体验很差：\n\n- 用户盯着空白屏等待数秒，容易以为卡死\n- 长文本（几百字）首字延迟（TTFT）明显\n- 无法中途取消、无法做打字机动效\n\n`streamText` 解决的就是**首字延迟**问题：模型每生成一个 token 就立即推给前端，体验上「边想边打字」。它本质是对 LLM 的 SSE（Server-Sent Events）流式输出的封装。\n\n## 包结构回顾\n\n```bash\nnpm install ai @ai-sdk/openai zod\n```\n\n`streamText` 来自核心包 `ai`，provider 包只负责把请求改成流式格式，用法与 `generateText` 几乎一致。\n\n## 1. streamText 基本用法\n\n```ts\nimport { streamText } from 'ai';\nimport { openai } from '@ai-sdk/openai';\n\nconst result = streamText({\n  model: openai('gpt-4o-mini'),\n  prompt: '用三句话介绍什么是流式响应',\n});\n\n// 异步迭代拿到每个 token 片段\nfor await (const delta of result.textStream) {\n  process.stdout.write(delta);\n}\n```\n\n`streamText` 是**同步返回**一个结果对象（不会 await 流式完成），真正的流在 `.textStream` 等属性上消费。这是它和 `generateText` 最大的心智区别：`generateText` 返回 Promise，而 `streamText` 立即返回「控制器」。\n\n## 2. 三种读取流的入口（重点区分）\n\n`streamText` 的结果对象暴露多个流，用途不同，千万别混用：\n\n| 属性 | 类型 | 用途 |\n| --- | --- | --- |\n| `textStream` | `AsyncIterableStream<string>` | 只拿文本增量，最常用 |\n| `fullStream` | `AsyncIterableStream<...>` | 拿完整事件流（text-delta / tool-call / finish / error 等），用于精细控制 |\n| `partialTextStream` | `AsyncIterableStream<string>` | 每次推送「截至当前的全部累积文本」而非增量 |\n\n`textStream` 给的是**增量片段**（delta），`partialTextStream` 给的是**累积全文**。前者适合「边收边拼」，后者适合「直接用当前全文渲染」。绝大多数场景用 `textStream` 即可。\n\n`fullStream` 适合需要感知工具调用、结束原因、用量等元事件的高级场景：\n\n```ts\nfor await (const part of result.fullStream) {\n  if (part.type === 'text-delta') {\n    process.stdout.write(part.textDelta);\n  } else if (part.type === 'finish') {\n    console.log('\\n结束原因:', part.finishReason, '用量:', part.usage);\n  }\n}\n```\n\n## 3. 在服务端把流转成 HTTP 响应\n\nNode 服务端要把流推给浏览器，标准做法是用 `toUIMessageStreamResponse()`（新版本）或 `toDataStreamResponse()`：\n\n```ts\n// app/api/chat/route.ts（Next.js App Router 示例）\nimport { streamText } from 'ai';\nimport { openai } from '@ai-sdk/openai';\n\nexport async function POST(req: Request) {\n  const { prompt } = await req.json();\n\n  const result = streamText({\n    model: openai('gpt-4o-mini'),\n    prompt,\n  });\n\n  return result.toUIMessageStreamResponse();\n}\n```\n\n这个方法会自动设置 `Content-Type: text/plain; charset=utf-8`、完成分块编码、并在客户端断开时自动中止底层请求（省 token）。\n\n## 4. 前端消费流式响应\n\n原生 `fetch` + `ReadableStream` 即可消费，无需额外库：\n\n```ts\nconst res = await fetch('/api/chat', {\n  method: 'POST',\n  body: JSON.stringify({ prompt: '讲个冷笑话' }),\n});\n\nconst reader = res.body!.getReader();\nconst decoder = new TextDecoder();\nwhile (true) {\n  const { done, value } = await reader.read();\n  if (done) break;\n  const chunk = decoder.decode(value, { stream: true });\n  document.getElementById('output')!.textContent += chunk;\n}\n```\n\n> 下一站（Day 28）会介绍 Vercel 提供的 `useChat` React Hook，它把上面的 reader 逻辑封装好，还自动管理消息列表、重新生成、中断按钮，大幅减少样板代码。今天先把「流到底是怎么一字节一字节来的」理解透。\n\n## 5. 中断与错误控制\n\n```ts\nconst controller = new AbortController();\n\nconst result = streamText({\n  model: openai('gpt-4o-mini'),\n  prompt: '写一篇 5000 字小说',\n  abortSignal: controller.signal, // 用户点「停止」时调用 controller.abort()\n  onError: ({ error }) => {\n    console.error('流式出错:', error);\n  },\n});\n\n// 用户取消\ncontroller.abort();\n```\n\n注意：`streamText` **不会**因为客户端断开而自动停止，必须显式传 `abortSignal` 才能在用户关闭页面时省下算力。这一点在生产环境很重要，否则后端会一直跑完整个长文本。\n\n## 6. streamText vs generateText 选型\n\n| 维度 | generateText | streamText |\n| --- | --- | --- |\n| 首字延迟 | 高（全生成完才返回） | 低（边生成边推） |\n| 适用场景 | 摘要、抽取、批处理、Agent 内部决策 | 聊天 UI、长文生成、打字机效果 |\n| 返回值 | Promise<结果> | 同步结果对象 + 流 |\n| 拿到完整文本 | 直接 `.text` | 需 `await result.text` 聚合 |\n\n经验法则：**给用户看的、可能很长的 → 流式；程序内部用的、要拿确定结果再处理的 → generateText。**\n\n## 7. 常见坑\n\n1. **把 streamText 当 Promise await**：`const r = await streamText(...)` 是错误的，`streamText` 不是 async 函数，直接返回对象。要拿完整文本才用 `await result.text`。\n2. **textStream 与 partialTextStream 混用**：前者是增量、后者是累积全文，重复拼接会内容翻倍。\n3. **忘记传 abortSignal**：用户关页面后端仍在跑，浪费额度。\n4. **漏装 provider 包**：`Cannot find module '@ai-sdk/openai'`，`ai` 核心包不含任何模型。\n5. **Node 版本过低**：Vercel AI SDK v4+ 需要 Node 18+，Web Stream API 才完整。\n6. **消费一半就丢弃流**：若不读完 `textStream`（或 handleErrorMode 默认 throw），未捕获错误会抛到 unhandledRejection。生产环境建议包一层 try/catch 或 `onError`。\n\n## 小结\n\n`streamText` 是 Vercel AI SDK 做聊天体验的核心。记住三件事：①它同步返回「流控制器」而非 Promise；②`textStream` 拿增量、`partialTextStream` 拿全文、`fullStream` 拿事件；③配合 `toUIMessageStreamResponse()` + `fetch` reader 即可端到端流式，别忘了 `abortSignal` 中断。Day 28 我们将用 `useChat` 把它变成声明式的前端组件。",
  }
,
  {
    id: "32",
    title: "Vercel AI SDK - Streaming UI（上）：流式渲染到前端与 useChat",
    slug: "ai-agent-day28-vercel-streaming-ui-upper",
    date: "2026-07-29",
    tags: ["AI Agent","Vercel AI SDK","useChat","流式渲染","React"],
    excerpt: "用 useChat Hook 把流式响应变成声明式的 React 聊天界面：自动管理消息列表、流式打字机渲染、停止/重新生成，并理解服务端与前端如何协同。",
    readingTime: 12,
    content: "## 为什么需要 useChat\n\nDay 27 我们用手写 `fetch` + `ReadableStream` 消费流式响应，能用但样板代码多：要自己维护消息数组、拼接增量文本、处理 loading 态、做中断按钮。Vercel AI SDK 的 `ai/rsc`/`@ai-sdk/react` 提供了 `useChat` Hook，把这些全部封装掉。\n\n`useChat` 的核心价值：**把「流」变成「状态」**——你只声明要渲染消息列表，Hook 自动处理流式更新、发送请求、错误与中断。\n\n## 包与依赖\n\n```bash\nnpm install ai @ai-sdk/openai @ai-sdk/react zod\n```\n\n- 服务端：`ai` + provider 包\n- 前端：`@ai-sdk/react`（提供 `useChat`）\n\n## 1. 服务端：暴露一个流式接口\n\n沿用 Day 27 的 `streamText` + `toUIMessageStreamResponse()`，只是这次按 `useChat` 约定读取请求体里的 `messages`：\n\n```ts\n// app/api/chat/route.ts\nimport { streamText } from 'ai';\nimport { openai } from '@ai-sdk/openai';\n\nexport async function POST(req: Request) {\n  const { messages } = await req.json(); // useChat 自动以 messages 格式发送\n\n  const result = streamText({\n    model: openai('gpt-4o-mini'),\n    messages,                       // 直接透传历史消息\n    system: '你是一个友善的助手',\n  });\n\n  return result.toUIMessageStreamResponse();\n}\n```\n\n关键点：`useChat` 发的请求体是 `{ messages: UIMessage[] }`，所以服务端直接 `req.json().messages` 即可，无需自己设计协议。\n\n## 2. 前端：useChat 声明式聊天\n\n```tsx\n'use client';\nimport { useChat } from '@ai-sdk/react';\n\nexport default function Chat() {\n  const { messages, input, handleInputChange, handleSubmit, status, stop } =\n    useChat();\n\n  return (\n    <div>\n      {messages.map((m) => (\n        <div key={m.id}>\n          <strong>{m.role === 'user' ? '我' : 'AI'}:</strong>\n          {m.content}\n        </div>\n      ))}\n\n      <form onSubmit={handleSubmit}>\n        <input value={input} onChange={handleInputChange} placeholder=\"说点什么…\" />\n        {status === 'streaming' ? (\n          <button type=\"button\" onClick={stop}>停止</button>\n        ) : (\n          <button type=\"submit\">发送</button>\n        )}\n      </form>\n    </div>\n  );\n}\n```\n\n就这样，**打字机效果自动出现**——`messages` 里 AI 消息的 `content` 会随着流持续更新，React 重渲染即可。`status` 字段（`submitted`/`streaming`/`ready`/`error`）帮你切换「停止/发送」按钮与 loading 态，`stop()` 内部调用 `abortSignal` 中断请求（正是 Day 27 强调的生产要点）。\n\n## 3. useChat 返回的常用字段\n\n| 字段 | 说明 |\n| --- | --- |\n| `messages` | `UIMessage[]`，含 role/content/parts，流式期间自动更新 |\n| `input` / `handleInputChange` | 输入框受控值 |\n| `handleSubmit` | 提交表单，自动把 input 作为 user 消息发送并触发请求 |\n| `status` | 当前状态：submitted / streaming / ready / error |\n| `stop` | 中断当前流式请求 |\n| `reload` | 不带新输入重新请求（重新生成） |\n| `append` | 手动追加一条消息（如预设 system 提示或快捷指令） |\n| `error` | 出错时的错误对象 |\n\n## 4. 自定义请求（带额外参数）\n\n```tsx\nconst { messages, input, handleInputChange, handleSubmit } = useChat({\n  body: { temperature: 0.7 },            // 附加到请求 body\n  onError: (e) => console.error(e),\n  api: '/api/chat',                        // 自定义端点（默认就是 /api/chat）\n});\n```\n\n`body` 里的内容会合并进 POST 请求体，服务端 `req.json()` 可一并读取（注意 distinguish：`messages` 由 Hook 注入，你的自定义字段单独取）。\n\n## 5. 与 Day 27 的关系\n\n| 维度 | Day 27 手写流 | Day 28 useChat |\n| --- | --- | --- |\n| 消息状态管理 | 自己维护数组 | Hook 自动维护 |\n| 流式渲染 | 手动 reader + 拼接 | 自动 |\n| 中断 | 手动 `abortSignal` | `stop()` 封装好 |\n| 重新生成 | 自己实现 | `reload()` |\n| 适用 | 理解原理 / 非 React 场景 | 生产级 React 聊天 UI |\n\n**建议先吃透 Day 27 的底层流，再上 useChat**，否则容易把 Hook 当黑盒、出错无从排查。\n\n## 6. 常见坑\n\n1. **忘记 `'use client'`**：`useChat` 是客户端 Hook，组件必须标 `'use client'`（App Router）。\n2. **服务端没返回 UI Message Stream**：必须用 `toUIMessageStreamResponse()`（旧版 `toDataStreamResponse`），否则 `useChat` 解析失败。\n3. **messages 历史没透传给模型**：服务端要把 `messages` 传给 `streamText`，否则每轮都丢失上下文。\n4. **重复 key**：map `messages` 要用 `m.id`，别用 index，流式期间顺序会变。\n5. **Node 版本过低**：`@ai-sdk/react` 同样需 Node 18+。\n6. **误用 generateText**：聊天 UI 必须用 `streamText`，否则没有打字机效果。\n\n## 小结\n\n`useChat` 把「流式响应」升级为「声明式聊天状态」，自动处理消息列表、流式渲染、停止与重新生成。记住三件事：①服务端用 `streamText(...).toUIMessageStreamResponse()` 并透传 `messages`；②前端 `'use client'` + `useChat()` 直接渲染 `messages`；③切换按钮用 `status`/`stop()`。明天（Day 29 下篇）深入前端组件集成（自定义渲染、工具调用 UI、附件上传）。",
  }
,
  {
    id: "33",
    title: "Vercel AI SDK - Streaming UI（下）：前端组件集成",
    slug: "ai-agent-day29-vercel-streaming-ui-lower",
    date: "2026-07-30",
    tags: ["AI Agent","Vercel AI SDK","前端组件","useChat","消息渲染"],
    excerpt: "深入 useChat 的前端集成：用 message.parts 自定义渲染文本/工具调用/附件、消息角色与样式、加载与错误处理、打字机光标、附件上传与多模态、以及在 Next.js 中的目录组织。",
    readingTime: 12,
    content: "## 回顾与今天的目标\n\nDay 28 我们跑通了 `useChat` 的最小聊天页。但真实产品远不止「渲染纯文本」：要自定义每条消息的样式、展示工具调用过程、上传文件（图片/文档）、处理加载与错误。今天聚焦**前端组件集成**。\n\n## 1. message 的数据结构：用 parts 而非直接读 content\n\n`useChat` 返回的 `messages` 中，每条 `UIMessage` 现在推荐用 `parts` 数组渲染（比 `content` 字符串更结构化，能区分文本、工具调用、文件等）：\n\n```tsx\n{messages.map((message) => (\n  <div key={message.id} className={message.role === 'user' ? 'user' : 'assistant'}>\n    {message.parts.map((part, i) => {\n      if (part.type === 'text') return <span key={i}>{part.text}</span>;\n      if (part.type === 'tool-invocation')\n        return <ToolCard key={i} call={part.toolInvocation} />;\n      return null;\n    })}\n  </div>\n))}\n```\n\n`parts` 的好处：流式期间文本会持续更新，而工具调用（Day 30/31 才讲定义，今天先了解渲染形态）以独立 part 存在，UI 可单独展示「正在调用天气工具…」这类中间态。\n\n## 2. 自定义消息组件与样式\n\n把每条消息抽成独立组件，便于复用与做思考气泡：\n\n```tsx\nfunction ChatMessage({ message }: { message: UIMessage }) {\n  const isUser = message.role === 'user';\n  return (\n    <div className={`msg ${isUser ? 'msg-user' : 'msg-ai'}`}>\n      <Avatar role={message.role} />\n      <div className=\"bubble\">\n        {message.parts.map(/* 按 part.type 渲染 */)}\n      </div>\n    </div>\n  );\n}\n```\n\n要点：\n- 用 `role` 区分左右对齐与配色（user 靠右、assistant 靠左）\n- AI 消息可加打字机光标：当 `status === 'streaming'` 且是最后一条 assistant 消息时，在文本末尾加闪烁 `▍`\n\n## 3. 加载、错误与空态\n\n```tsx\nconst { messages, status, error, reload } = useChat();\n\nif (status === 'submitted') return <Spinner />;   // 已发送、等待首字\nif (error) return <ErrorBox onRetry={reload} />;    // 出错可 reload 重试\nif (messages.length === 0) return <EmptyHint />;    // 首屏引导\n```\n\n`status` 四态：`submitted`（已提交、等首字）→ `streaming`（流式输出中）→ `ready`（完成）→ `error`。用 `reload()` 可在不新增用户输入的情况下重新请求（重新生成）。\n\n## 4. 附件上传与多模态\n\n`useChat` 原生支持 `experimental_attachments`：\n\n```tsx\nconst { messages, input, handleInputChange, handleSubmit, experimental_attachments, setAttachments } = useChat();\n\n// 选择文件后设置\nconst onFile = (e) => setAttachments(Array.from(e.target.files ?? []));\n\n<form onSubmit={(e) => handleSubmit(e, { experimental_attachments: attachments })}>\n  <input type=\"file\" multiple onChange={onFile} />\n  <input value={input} onChange={handleInputChange} />\n</form>\n```\n\n服务端 `streamText` 的 `messages` 会自动带上附件（图片以 `image` part 传入），模型若为多模态（如 `gpt-4o`）即可「看图说话」。注意前端要展示已选附件缩略图，并在发送后清空 `setAttachments([])`。\n\n## 5. 在 Next.js 中的目录组织\n\n```\napp/\n  api/chat/route.ts        # 服务端流（'use server' 不需要，route 默认服务端）\n  chat/page.tsx            # 'use client' 聊天页，调用 useChat\ncomponents/\n  ChatMessage.tsx          # 单条消息组件\n  ToolCard.tsx             # 工具调用卡片（Day 30/31 用到）\n  ChatInput.tsx            # 输入框 + 附件\n```\n\n把 UI 拆成 `ChatMessage` / `ChatInput` / `ToolCard`，主页面只负责组装 `useChat` 状态，可读性高、易测试。\n\n## 6. 与 Day 28 的衔接\n\n| 维度 | Day 28（基础） | Day 29（集成） |\n| --- | --- | --- |\n| 渲染 | 直接 `{m.content}` | `m.parts` 按类型自定义 |\n| 消息样式 | 朴素 div | 角色对齐/气泡/头像 |\n| 交互 | 仅发送/停止 | 附件上传、重新生成、错误重试 |\n| 多模态 | 不支持 | 图片附件 + 多模态模型 |\n\n**先有 Day 28 的骨架，再在 Day 29 上加肉**，避免一上来就堆样式导致逻辑混乱。\n\n## 7. 常见坑\n\n1. **还用 `content` 而非 `parts`**：旧版 `content` 是字符串，新版推荐 `parts` 才能渲染工具调用/附件，混用会丢信息。\n2. **附件发完不清理**：`setAttachments([])` 要在 `handleSubmit` 后调用，否则下次发送会重复带旧文件。\n3. **key 用 index**：`parts.map` 同样要用稳定 key（part 内部无 id 时可用 `i`，但 messages 必须用 `m.id`）。\n4. **文件过大未限制**：上传前校验类型/大小，否则请求体爆炸、模型拒收。\n5. **多模态模型不匹配**：传图片却用纯文本模型（如 `gpt-3.5`），会报错或无视图片。\n6. **忘记 `'use client'`**：含 `useChat` 的组件必须客户端组件。\n\n## 小结\n\nDay 29 把 `useChat` 从「能跑」提升到「像产品」：用 `message.parts` 按类型自定义渲染、`status`/`error`/`reload` 做完整交互态、附件上传打通多模态。记住：①用 `parts` 不用 `content`；②附件发完清空、校验大小；③组件拆分（ChatMessage/ChatInput/ToolCard）。Day 30 起进入 Tool Calling，前面的 `tool-invocation` part 就会真正派上用场。",
  }
,
  {
    id: "34",
    title: "Vercel AI SDK - Tool Calling（上）：结构化工具定义与调用",
    slug: "ai-agent-day30-vercel-tool-calling-upper",
    date: "2026-07-31",
    tags: ["AI Agent","Vercel AI SDK","Tool Calling","tool()","Zod","函数调用"],
    excerpt: "Agent 的真正能力来自「调用工具」。今天正式进入 Vercel AI SDK 的工具调用：用 tool() 定义结构化工具（名称/描述/入参 schema）、在 generateText/streamText 中挂载、解析 model 返回的 toolCalls 并在本地执行，跑通「模型→工具→结果→模型」的第一次工具循环。",
    readingTime: 12,
    content: "## 回顾与今天的目标\n\nDay 26-29 我们打通了 Vercel AI SDK 的「文本生成」与「流式 UI」。但一个只会聊天的模型不是 Agent——Agent 的精髓是**能调用外部工具**（查天气、算数学、查数据库、调 API、读写文件）。\n\nDay 12 我们用 OpenAI 原生 Function Calling 讲过工具调用范式；今天用 **Vercel AI SDK 的 `tool()` 封装**把这套范式落到更省心的代码里，并重点讲清楚**结构化工具定义**与**一次完整的工具循环**。\n\n## 1. 为什么需要工具调用\n\nLLM 本质是「概率文本生成器」，它本身：\n- 不知道实时信息（天气、股价、最新新闻）\n- 不擅长精确计算（大数乘法、日期差）\n- 不能直接操作外部系统（数据库、文件系统、第三方 API）\n\n工具调用（Tool Calling）让模型在生成文本之外，还能**输出「我要调用哪个工具 + 什么参数」的结构化指令**，由我们本地执行后把结果喂回去。这就是 Agent Loop 的核心。\n\n## 2. `tool()` 函数：结构化定义工具\n\nVercel AI SDK 用 `tool()` 把「工具」抽象成一个对象，包含三要素：\n\n```ts\nimport { tool } from 'ai';\nimport { z } from 'zod';\n\nconst weatherTool = tool({\n  // ① 名称：模型靠它识别要调哪个工具（建议动宾、清晰）\n  description: '获取指定城市的当前天气（温度、天气状况）',\n  // ② 入参 schema：用 zod 描述参数，SDK 会自动生成 JSON Schema 给模型\n  parameters: z.object({\n    city: z.string().describe('城市名称，如 \"上海\"'),\n    unit: z.enum(['celsius', 'fahrenheit']).default('celsius'),\n  }),\n  // ③ 执行函数：真正干活的地方（可以 async，可访问 DB/API）\n  execute: async ({ city, unit }) => {\n    const data = await fetchWeather(city, unit); // 你的实现\n    return data; // 返回对象，SDK 会序列化给模型\n  },\n});\n```\n\n要点：\n- **`description` 写清楚**：模型靠描述判断「何时该用这个工具」。含糊的描述（如\"处理数据\"）会导致该调不调、或不该调乱调。\n- **`parameters` 用 zod**：`zod` 同时承担「参数校验」与「生成 JSON Schema 给模型」两件事；`describe()` 让模型理解每个字段含义。\n- **`execute` 是本地代码**：工具真正的能力（网络请求、DB 查询）在这里发生，模型只决定「调不调、传什么参」。\n\n> 如果你不想用 zod，也可直接传 `parameters: { type: 'object', properties: {...}, required: [...] }` 的原生 JSON Schema，但 zod 更顺手且自带校验。\n\n## 3. 把工具挂到模型调用上\n\n在 `generateText` / `streamText` 里通过 `tools` 字段挂载：\n\n```ts\nimport { generateText } from 'ai';\nimport { openai } from '@ai-sdk/openai';\n\nconst { text, toolCalls, toolResults } = await generateText({\n  model: openai('gpt-4o-mini'),\n  prompt: '上海现在天气怎么样？适合穿短袖吗？',\n  tools: { weather: weatherTool }, // 多个工具用对象挂上\n});\n```\n\n- 如果模型判断**不需要工具**，则 `toolCalls` 为空，直接返回 `text`。\n- 如果模型**需要工具**，则 `toolCalls` 里会有 `{ toolName: 'weather', args: { city: '上海' } }`，`text` 通常为空（模型在等工具结果）。\n\n## 4. 模型返回 toolCalls → 本地执行 → 结果回灌\n\n`tool()` 里写了 `execute`，Vercel AI SDK 会**自动**执行并把结果放进 `toolResults`。但更可控的做法是**手动循环**（尤其当你要在回灌前做鉴权/日志/限流时）：\n\n```ts\nimport { generateText, tool } from 'ai';\n\n// 不带 execute，只定义「契约」，执行我们自己控制\nconst weatherOnly = tool({\n  description: '获取指定城市的当前天气',\n  parameters: z.object({ city: z.string() }),\n});\n\nlet response = await generateText({\n  model: openai('gpt-4o-mini'),\n  prompt: '上海现在天气怎么样？',\n  tools: { weather: weatherOnly },\n});\n\n// 第一次：模型返回 toolCalls，但还没结果\nfor (const call of response.toolCalls ?? []) {\n  if (call.toolName === 'weather') {\n    const result = await fetchWeather(call.args.city); // 本地执行\n    response = await generateText({\n      model: openai('gpt-4o-mini'),\n      prompt: '上海现在天气怎么样？',\n      tools: { weather: weatherOnly },\n      // 把工具调用 + 执行结果作为 messages 回灌给模型\n      messages: [\n        ...response.messages,\n        {\n          role: 'tool',\n          content: [\n            { type: 'tool-result', toolCallId: call.toolCallId, result },\n          ],\n        },\n      ],\n    });\n  }\n}\nconsole.log(response.text); // 最终自然语言回答\n```\n\n关键：\n- 工具结果以 `role: 'tool'` 的消息回灌，且必须带 `toolCallId` 与原始 `toolCalls` 对应（SDK 靠 id 配对）。\n- 这一步就是 Day 12 讲的「Agent Loop」：模型决策 → 我们执行 → 结果回传 → 模型再决策，直到产出最终答案。\n\n## 5. 流式场景下的工具调用\n\n`streamText` 同样支持 `tools`，前端能看到「工具调用中」的中间态（回顾 Day 29 的 `tool-invocation` part）：\n\n```ts\nconst result = streamText({\n  model: openai('gpt-4o-mini'),\n  prompt: '北京和东京谁更热？',\n  tools: { weather: weatherTool }, // 带 execute 时自动执行\n});\n\n// 服务端转发 UI Message Stream，前端 useChat 的 message.parts\n// 会自然出现 type: 'tool-invocation' 的 part，可展示「正在查询北京天气…」\nreturn result.toUIMessageStreamResponse();\n```\n\n带 `execute` 的 `streamText` 会在流内部自动完成「调用→执行→回灌→续生成」，前端无需手动循环，体验最佳。\n\n## 6. 与 LangChain tool 的对比\n\n| 维度 | Vercel AI SDK `tool()` | LangChain `@tool` |\n|------|------------------------|-------------------|\n| 入参定义 | zod / JSON Schema | zod（`@tool` 装饰器） |\n| 执行 | `execute` 字段 / 手动循环 | 函数体即执行 |\n| 自动执行 | 带 `execute` 时自动 | AgentExecutor 统一调度 |\n| 模型绑定 | `tools` 字段挂到 generate/stream | 绑到 Agent |\n| 流式工具态 | `tool-invocation` part 天然可见 | 需 verbose / 中间件 |\n\n结论：Vercel AI SDK 更轻、更贴近「手动编排 Agent Loop」；LangChain 更偏「框架帮你跑完整个 Agent」。两者工具定义理念一致（名称/描述/schema/执行）。\n\n## 7. 常见坑\n\n- **`description` 太含糊** → 模型该调不调或乱调；写清「何时用、解决什么」。\n- **`parameters` 缺 `describe`** → 模型传参错位（如把城市名当成了国家）。\n- **工具名含空格/特殊字符** → 部分模型不友好，建议 `camelCase` 或 `kebab-case`。\n- **`execute` 抛错没兜底** → 整个调用链崩；务必 `try/catch` 并返回结构化错误给模型，让它自我纠正。\n- **回灌漏了 `toolCallId`** → 模型无法把结果与调用配对，会报错或乱答。\n- **忘记限流/鉴权** → 工具能调外部 API/花真钱，生产环境务必加权限校验与速率限制。\n- **Node 版本过低** → `ai` 包需要较新 Node，部署前确认运行环境版本。\n- **官方站不可访问** → 文档用国内镜像 `ai-sdk.com.cn`，下文链接已替换。\n\n## 学习资料与延伸\n\n- Vercel AI SDK 工具与工具调用（国内镜像）：https://ai-sdk.com.cn/docs/ai-sdk-core/tools-and-tool-calling\n- Vercel AI SDK 官方 Tools 文档：https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling\n- 完整深入教程（腾讯云）：https://cloud.tencent.com/developer/article/2630363\n- 中文实战教程（掘金）：https://juejin.cn/post/7604761524977500169\n\n## 今日小练习\n\n定义一个 `calculator` 工具（支持 `expression` 字符串，用 `eval` 的安全子集或 `math.js` 计算），挂到 `generateText`，问模型「(12 + 8) * 3 等于多少」，观察 `toolCalls` 与最终 `text`，并手动走一遍「回灌 tool-result」的循环。",
  }
,
  {
    id: "35",
    title: "Vercel AI SDK - Tool Calling（下）：Zod 参数校验与多工具编排",
    slug: "ai-agent-day31-vercel-tool-calling-lower",
    date: "2026-08-01",
    tags: ["AI Agent","Vercel AI SDK","Tool Calling","Zod","多工具","maxSteps"],
    excerpt: "在上集 tool() 基础上，深入 Zod 参数校验（类型/范围/枚举约束、校验失败自动纠错）、maxSteps 自动多轮工具循环、多工具并行编排，以及工具调用链路中的错误处理与可观测性，跑通一个带计算器+天气+搜索的多工具 Agent。",
    readingTime: 12,
    content: "## 回顾与今天的目标\n\nDay 30 我们用 `tool()` 定义了第一个工具，并手动走了一遍「模型返回 toolCalls → 本地执行 → role:'tool' 回灌」的 Agent Loop。今天把工具调用做扎实：\n\n1. **Zod 校验**：让工具有「强类型护城河」，参数不对模型自己改；\n2. **`maxSteps` 自动循环**：告别手写 for 循环，SDK 帮你跑完多轮工具调用；\n3. **多工具编排**：一个 Agent 同时挂多个工具，模型自主选；\n4. **错误处理与可观测**：工具抛错如何优雅回传、如何看到完整调用轨迹。\n\n## 1. Zod 参数校验：让工具「说不了」\n\nDay 30 提到 `parameters` 用 zod 描述入参，它不仅生成 JSON Schema 给模型看，**执行前还会真校验**。你可以加约束，模型传错时 SDK 会把错误回传给模型，让它自我纠正：\n\n```ts\nimport { z } from 'zod';\n\nconst divideTool = tool({\n  description: '计算两数相除（除数不能为 0）',\n  parameters: z.object({\n    a: z.number().describe('被除数'),\n    b: z.number().describe('除数，必须非零'),\n    // 用 refine 加业务约束：除数不能为 0\n  }).refine((v) => v.b >= 1e-9 || v.b <= -1e-9, {\n    message: '除数 b 不能为 0',\n  }),\n  execute: async ({ a, b }) => ({ quotient: a / b }),\n});\n```\n\n要点：\n- `z.number()` / `z.string()` / `z.enum(['celsius','fahrenheit'])`：基础类型与枚举，模型传错类型直接被拦。\n- `.describe()`：同时是给模型看的字段说明，也是给代码看的注释。\n- `.refine()` / `.superRefine()`：跨字段业务规则（如「结束日期晚于开始日期」）。\n- **校验失败回传模型**：Vercel AI SDK 在 `execute` 前跑 zod，失败会把错误作为 `tool-result` 回灌，模型看到后会换参数重试——这就是「自我纠正」的底层机制。\n\n> 经验：约束写得太严（如正则卡死格式）会让模型反复失败；太松又失去校验意义。给 `description` 写清楚「合法示例」比纯正则更稳。\n\n## 2. `maxSteps`：自动多轮工具循环\n\nDay 30 我们手写 `for` 循环回灌 `tool-result`。Vercel AI SDK 提供 `maxSteps` 让它**自动**跑完「调工具→拿结果→再决策→再调」的循环：\n\n```ts\nimport { generateText } from 'ai';\n\nconst { text, steps } = await generateText({\n  model: openai('gpt-4o-mini'),\n  prompt: '北京现在多少度？如果高于 30 度，再告诉我东京的天气对比一下。',\n  tools: { weather: weatherTool },\n  // 最多自动跑 5 轮工具循环；不设这个默认只跑 1 轮（即只调一次就停）\n  maxSteps: 5,\n});\n\n// steps 里能看到每一轮的 toolCalls / toolResults / text\nsteps.forEach((s, i) => {\n  console.log(`第 ${i + 1} 轮工具调用：`, s.toolCalls);\n});\n```\n\n- `maxSteps` 控制「模型可以连续调几次工具」。设 `1` 等于 Day 30 的手写单轮；设大一点才能做多步推理（先查 A 再依据 A 查 B）。\n- `steps` 数组是完整轨迹，调试/审计/可观测都靠它。\n- `streamText` 同样支持 `maxSteps`，前端 `useChat` 会逐步收到各轮 `tool-invocation` part。\n\n## 3. 多工具编排：一个 Agent 挂多个工具\n\n把多个 `tool()` 放进 `tools` 对象，模型根据问题**自主选择**调用哪个（甚至同轮并行调多个）：\n\n```ts\nconst { text, toolCalls } = await generateText({\n  model: openai('gpt-4o-mini'),\n  prompt: '帮算一下 (128 + 64) * 2，再查下上海天气，最后搜一下「Vercel AI SDK」最新版本。',\n  tools: {\n    calculator: calculatorTool, // 自定义计算\n    weather: weatherTool,       // 天气\n    search: searchTool,         // 搜索\n  },\n  maxSteps: 6,\n});\n```\n\n- 模型会判断「这句话需要哪些工具」，无需你 if-else 分发（这正是 Agent 优于硬编排 Chain 的地方，回顾 Day 21 路由链）。\n- 同一条消息里多个工具可**并行**调用（取决于模型输出与 provider 支持）；`toolCalls` 是数组，按顺序或并行执行由你控制。\n- 工具间数据流转：若 B 工具依赖 A 的结果，靠 `maxSteps` 多轮自然衔接（A 跑完回灌，模型再决定调 B）。\n\n## 4. 错误处理与可观测性\n\n工具执行可能抛错（网络超时、API 限流、参数非法）。正确做法：\n\n```ts\nconst safeTool = tool({\n  description: '调用外部搜索 API',\n  parameters: z.object({ query: z.string() }),\n  execute: async ({ query }) => {\n    try {\n      const res = await searchAPI(query);\n      return { results: res };\n    } catch (err) {\n      // 不要 throw 到顶层崩链；返回结构化错误，模型能据此重试/换策略\n      return { error: `搜索失败：${err.message}` };\n    }\n  },\n});\n```\n\n- **返回错误而非抛异常**：让模型看到 `error` 字段并自我纠正（换个 query、或改用其他工具）。\n- **`steps` 轨迹**：线上排查靠 `steps` 看哪一轮、哪个工具出错。\n- **`onStepFinish` 回调**：每轮结束打日志/埋点：\n\n```ts\nawait streamText({\n  model: openai('gpt-4o-mini'),\n  prompt,\n  tools: { weather, calculator },\n  maxSteps: 5,\n  onStepFinish: ({ toolCalls, toolResults, text }) => {\n    console.log('step done', { toolCalls, toolResults });\n  },\n});\n```\n\n## 5. 与 LangChain 工具对比回顾\n\n| 维度 | Vercel AI SDK | LangChain |\n|------|---------------|-----------|\n| 多轮循环 | `maxSteps` 一行搞定 | AgentExecutor `maxIterations` |\n| 参数校验 | zod 原生 | zod + `@tool` |\n| 多工具 | `tools` 对象 | 工具数组绑 Agent |\n| 轨迹可观测 | `steps` 数组 | `returnIntermediateSteps` |\n| 流式工具态 | `tool-invocation` part | verbose/中间件 |\n\n## 6. 常见坑\n\n- **漏设 `maxSteps`** → 模型只调一次工具就停，多步任务做不完（默认 1 轮）。\n- **`maxSteps` 过大** → 可能陷入反复调工具的死循环，烧 token；配合 `stopWhen`/步数上限克制使用。\n- **校验失败直接 throw** → 整个调用崩；应返回结构化错误给模型。\n- **工具名冲突/描述雷同** → 模型选错工具；名称与描述要有区分度。\n- **并行工具共享可变状态** → 竞态；工具尽量无副作用或加锁。\n- **Node 版本过低 / 官方站不可访问** → 同前，用镜像 `ai-sdk.com.cn`。\n\n## 学习资料与延伸\n\n- Vercel AI SDK 工具与工具调用（国内镜像）：https://ai-sdk.com.cn/docs/ai-sdk-core/tools-and-tool-calling\n- Vercel AI SDK 官方 Tools 文档：https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling\n- 完整深入教程（腾讯云）：https://cloud.tencent.com/developer/article/2630363\n- 中文实战教程（掘金）：https://juejin.cn/post/7604761524977500169\n\n## 今日小练习\n\n定义一个 `calculator`（支持四则运算）、`weather`（查天气）、`search`（模拟搜索）三个工具，挂到 `generateText` 并设 `maxSteps: 6`，问模型一个需要「先算再查再搜」的复合问题，打印 `steps` 观察模型如何选择与串联三个工具。",
  }
,
  {
    id: "36",
    title: "Vercel AI SDK - RSC Integration（上）：React Server Components 集成",
    slug: "ai-agent-day32-vercel-rsc-upper",
    date: "2026-08-02",
    tags: ["AI Agent","Vercel AI SDK","RSC","React Server Components","streamUI"],
    excerpt: "进入 Vercel AI SDK 的 RSC 集成：在 React Server Components 里直接调用 generateText/streamText，用 createStreamableUI 与 streamUI 把 AI 生成内容作为组件流式渲染，理解「服务端组件即 Agent 运行环境」的范式。",
    readingTime: 11,
    content: "## 回顾与今天的目标\n\nDay 26-31 我们走完了 Vercel AI SDK 的「核心生成 + 流式 UI + 工具调用」。前端的 `useChat` 走的是「客户端组件 + 独立 API Route 转发流」模式。\n\n今天进入 **RSC（React Server Components）集成**：在**服务端组件**里直接跑模型，把 AI 输出当成 React 组件渲染。这是 Vercel AI SDK 区别于其他框架的一大特色——AI 生成的不只是文本，可以是**组件树**。\n\n## 1. 为什么用 RSC 跑 AI\n\n传统 `useChat` 模式：\n- 前端发请求 → API Route 跑模型 → 流回前端 → 前端组件渲染。\n- 问题是：AI 生成的内容「只是字符串/parts」，要渲染成富组件还得前端自己 map。\n\nRSC 模式：\n- 服务端组件直接 `await generateText(...)`，把结果作为 **React 节点**返回。\n- 更妙的是 `streamUI`：模型可以**返回组件**（如「查天气」→ 直接返回一个 `<WeatherCard>`），服务端流式推到客户端，客户端无缝挂载。\n- 适合「AI 生成结构化 UI」的场景（表单、图表、卡片），而非纯聊天。\n\n## 2. 核心 API：`createStreamableUI` 与 `streamUI`\n\nVercel AI SDK 的 RSC 能力在 `@ai-sdk/rsc` 包：\n\n```tsx\n// app/actions.tsx（服务端 Action）\nimport { createStreamableUI } from 'ai/rsc';\nimport { openai } from '@ai-sdk/openai';\nimport { generateText } from 'ai';\n\nexport async function askAI(input: string) {\n  const stream = createStreamableUI(<div>思考中…</div>);\n\n  (async () => {\n    const { text } = await generateText({\n      model: openai('gpt-4o-mini'),\n      prompt: input,\n    });\n    // 把生成结果作为 React 节点更新到流\n    stream.update(<div>{text}</div>);\n    stream.done();\n  })();\n\n  return stream.value; // 一个可挂到组件树的异步 UI\n}\n```\n\n- `createStreamableUI(initial)`：创建一个「会变的 UI」，初始占位，后续 `update()` 替换内容，`done()` 收尾。\n- 返回 `stream.value` 是一个 React 节点，客户端用 `<Suspense>` 包住即可边等边渲染。\n\n## 3. `streamUI`：让模型直接「生成组件」\n\n更高级的是 `streamUI`——配合工具调用，模型能返回**指定 React 组件**作为 tool result：\n\n```tsx\nimport { streamUI } from 'ai/rsc';\nimport { z } from 'zod';\n\nconst result = await streamUI({\n  model: openai('gpt-4o-mini'),\n  prompt: '上海天气怎么样？用卡片展示',\n  text: ({ content }) => <div>{content}</div>, // 纯文本 fallback\n  tools: {\n    showWeather: {\n      description: '展示天气卡片',\n      parameters: z.object({ city: z.string() }),\n      // 工具返回的是一个 React 组件！\n      generate: async function* ({ city }) {\n        yield <div>查询 {city} 中…</div>;\n        const data = await fetchWeather(city);\n        return <WeatherCard data={data} />;\n      },\n    },\n  },\n});\n\n// result.value 是直接可用的 React 节点（可能是 WeatherCard）\nreturn result.value;\n```\n\n- `streamUI` 把「工具调用」升级为「组件生成」：模型决定调 `showWeather` → 该工具 `generate` 返回一个 `<WeatherCard>` 组件 → 服务端流式推到客户端。\n- 这是「AI 生成 UI」的核心范式，比 `useChat` 的 `tool-invocation` part 更进一步——直接是组件而非中间态。\n\n## 4. 客户端如何消费 RSC 流\n\n```tsx\n// app/page.tsx（客户端）\n'use client';\nimport { useState } from 'react';\nimport { askAI } from './actions';\n\nexport default function Page() {\n  const [ui, setUi] = useState<React.ReactNode>(null);\n  return (\n    <div>\n      <button onClick={async () => setUi(await askAI('你好'))}>问 AI</button>\n      <Suspense fallback={<p>加载…</p>}>{ui}</Suspense>\n    </div>\n  );\n}\n```\n\n- 客户端只负责「触发 + 挂结果」，AI 逻辑全在服务端 Action，安全（API Key 不暴露）。\n- 用 `<Suspense>` 包裹，流未到时显示 fallback，到了自动替换。\n\n## 5. RSC 模式 vs useChat 模式选型\n\n| 维度 | useChat（API Route） | RSC（streamUI/createStreamableUI） |\n|------|----------------------|-------------------------------------|\n| 渲染内容 | 文本/parts，前端 map | 直接是 React 组件 |\n| AI 位置 | API Route（独立） | Server Component / Action |\n| 适用 | 聊天机器人 | AI 生成结构化 UI（卡片/表单/图表） |\n| Key 暴露 | 服务端 Route 持有 | 服务端 Action 持有 |\n| 复杂度 | 低 | 中（需理解 RSC 流式） |\n\n## 6. 常见坑\n\n- **在客户端组件里 import `ai/rsc`** → RSC API 只能在服务端用；确保 `actions.tsx` 不被 `'use client'` 标记。\n- **忘了 `<Suspense>`** → 流式 UI 节点无法优雅等待，直接报错或空白。\n- **`streamUI` 的 `generate` 返回非组件** → 必须返回 React 节点，否则客户端挂载失败。\n- **API Key 放客户端** → RSC 模式的意义就是服务端持有密钥，别在 `'use client'` 里初始化 model。\n- **Node/Next 版本过低** → RSC 需要较新 Next.js（≥13.4 App Router）；官方站不可访问时用镜像。\n\n## 学习资料与延伸\n\n- Vercel AI SDK RSC 文档（国内镜像）：https://ai-sdk.com.cn/docs/ai-sdk-rsc\n- Vercel AI SDK 官方 RSC 文档：https://sdk.vercel.ai/docs/ai-sdk-rsc\n- Next.js RSC 官方文档：https://nextjs.org/docs/app/building-your-application/rendering/server-components\n- 中文实战教程（掘金）：https://juejin.cn/post/7604761524977500169\n\n## 今日小练习\n\n用 `@ai-sdk/rsc` 的 `createStreamableUI` 做一个最简服务端 Action：接收问题 → `generateText` 生成回答 → 流式更新一个 `<div>`。在客户端页面用按钮触发并用 `<Suspense>` 渲染，体会「服务端组件即 Agent 运行环境」的范式。",
  }
,
  {
    id: "37",
    title: "Vercel AI SDK - RSC Integration（下）：流式 RSC 渲染",
    slug: "ai-agent-day33-vercel-rsc-lower",
    date: "2026-08-03",
    tags: ["AI Agent","Vercel AI SDK","RSC","流式渲染","streamUI","React"],
    excerpt: "深入流式 RSC 渲染：用 streamUI 实现「边生成边渲染组件」、工具生成组件的分阶段 yield、与 createStreamableUI 的组合、客户端 useUIState/useActionsState 管理交互状态，跑通一个流式 AI 卡片生成器。",
    readingTime: 11,
    content: "## 回顾与今天的目标\n\nDay 32 我们认识了 RSC 集成：`createStreamableUI` 把 AI 结果当作 React 节点流式返回，`streamUI` 让工具直接「生成组件」。今天把**流式**做透——真正体验「模型边想、UI 边长」的丝滑。\n\n阶段二（Day 15-35）今天收官（明天 Day 34 是阶段二总结），所以今天也是 Vercel AI SDK 模块的最后一块拼图。\n\n## 1. `streamUI` 的流式本质：分阶段 yield 组件\n\n`streamUI` 的工具 `generate` 可以是**异步生成器**（`async function*`），用 `yield` 逐步吐出中间组件，最后 `return` 最终组件。模型调用该工具时，客户端会**依次收到这些组件**，实现边查边渲染：\n\n```tsx\ntools: {\n  showStock: {\n    description: '展示股票卡片',\n    parameters: z.object({ symbol: z.string() }),\n    generate: async function* ({ symbol }) {\n      yield <div>正在查询 {symbol}…</div>;          // 第一阶段：加载态\n      const quote = await fetchQuote(symbol);\n      yield <div>拿到报价，绘制中…</div>;            // 第二阶段：处理态\n      return <StockCard data={quote} />;            // 最终：完整卡片\n    },\n  },\n},\n```\n\n- 每个 `yield` 都会推到客户端替换当前 UI；\n- `return` 的是「终结态」组件；\n- 这就是 RSC 流式相比 `useChat` 文本流的最大优势：**组件级渐进渲染**，而非纯文本累积。\n\n## 2. 组合：`createStreamableUI` + `streamUI`\n\n实践中常把两者结合：外层用 `createStreamableUI` 管整体容器，内层 `streamUI` 管动态组件：\n\n```tsx\nexport async function generateUI(input: string) {\n  const ui = createStreamableUI(<Spinner />);\n  (async () => {\n    const result = await streamUI({\n      model: openai('gpt-4o-mini'),\n      prompt: input,\n      text: ({ content }) => <p>{content}</p>,\n      tools: { /* ...showWeather/showStock... */ },\n    });\n    ui.update(result.value); // 把 streamUI 产出的组件挂进外层容器\n    ui.done();\n  })();\n  return ui.value;\n}\n```\n\n- 外层 `createStreamableUI` 负责「骨架 + 占位」；\n- 内层 `streamUI` 负责「模型决策 + 组件生成」；\n- 客户端只消费一个 `ui.value`，结构清晰。\n\n## 3. 客户端状态管理：`useUIState` / `useActionsState`\n\nRSC 模式下，AI 生成的 UI 历史需要管理。`ai/rsc` 提供 `createAI` 上下文 + hooks：\n\n```tsx\n// app/ai.tsx（服务端+客户端共享上下文）\n'use client';\nimport { createAI } from 'ai/rsc';\nexport const AI = createAI({\n  actions: { generateUI },          // 暴露给客户端的 Action\n  initialAIState: [],\n  initialUIState: [],\n});\n\n// 客户端组件\n'use client';\nimport { useUIState, useActions } from 'ai/rsc';\nimport { AI } from './ai';\n\nfunction Chat() {\n  const [messages, setMessages] = useUIState<typeof AI>();\n  const [generateUI] = useActions<typeof AI>();\n  // messages 就是历史生成的 UI 节点数组，可直接渲染\n  return (\n    <AI>\n      <div>{messages.map((m, i) => <div key={i}>{m}</div>)}</div>\n      <button onClick={async () => {\n        const ui = await generateUI('上海天气');\n        setMessages([...messages, ui]);\n      }}>问</button>\n    </AI>\n  );\n}\n```\n\n- `useUIState`：AI 生成的 UI 历史（每个元素是一个 React 节点）；\n- `useActions`：调用服务端 Action；\n- `createAI`：把两者与初始状态包成 Context，包裹在 `<AI>` 里即可用。\n\n## 4. 完整流式 AI 卡片生成器\n\n把上面拼起来：用户输入 → 服务端 `generateUI` 用 `streamUI` 调工具生成卡片 → 客户端 `useUIState` 累积显示。模型可依据问题自主选择返回「天气卡 / 股票卡 / 纯文本」，全程流式。\n\n## 5. RSC 流式 vs 传统流式选型再回顾\n\n| 场景 | 推荐 |\n|------|------|\n| 聊天机器人（文本为主） | `useChat` + API Route |\n| AI 生成结构化 UI（卡片/表单/图表） | `streamUI` + RSC |\n| 需要 UI 历史/多轮交互 | `createAI` + `useUIState` |\n| 极简 demo / 纯服务端渲染 | `createStreamableUI` |\n\n## 6. 常见坑\n\n- **`generate` 不是 `async function*` 却 yield** → 语法报错；要流式必须 `async function*` 且用 `yield`。\n- **客户端直接 `await streamUI`** → `streamUI` 在服务端跑，客户端只消费 `useUIState`/Action 返回值。\n- **`createAI` 的 `actions` 暴露了不该暴露的函数** → 仅暴露安全 Action，敏感逻辑留在服务端。\n- **忘记 `<AI>` 包裹** → `useUIState`/`useActions` 取不到 Context，报 null。\n- **Node/Next 版本过低 / 官方站不可访问** → 同前，用镜像 `ai-sdk.com.cn`。\n\n## 学习资料与延伸\n\n- Vercel AI SDK RSC 文档（国内镜像）：https://ai-sdk.com.cn/docs/ai-sdk-rsc\n- Vercel AI SDK 官方 RSC 文档：https://sdk.vercel.ai/docs/ai-sdk-rsc\n- Next.js App Router 流式渲染：https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming\n- 中文实战教程（掘金）：https://juejin.cn/post/7604761524977500169\n\n## 今日小练习\n\n基于 Day 32 的 `createStreamableUI` demo，升级为 `streamUI`：定义一个 `showWeather` 工具（异步生成器，先 yield「查询中」再 return `<WeatherCard>`），让模型根据「用卡片展示上海天气」自动调用并返回组件，在客户端用 `useUIState` 累积历史。明天 Day 34 将做阶段二 LangChain vs Vercel AI SDK 对比总结。",
  }
,
  {
    id: "38",
    title: "阶段二总结 - 框架对比实践：LangChain.js vs Vercel AI SDK",
    slug: "ai-agent-day34-framework-comparison-practice",
    date: "2026-08-04",
    tags: ["AI Agent","阶段二总结","LangChain.js","Vercel AI SDK","框架对比","Agent demo"],
    excerpt: "阶段二收官：系统性对比 LangChain.js 与 Vercel AI SDK 的设计哲学、适用场景、核心 API 映射，并动手完成一个「最小通用 Agent demo」——同时用两套框架实现「带工具调用的多轮问答」，沉淀可复用的选型决策表。",
    readingTime: 13,
    content: "## 回顾与今天的目标\n\n阶段二（Day 15-35）我们啃下了两大框架：\n- **Day 16-25 LangChain.js**：Model I/O、Retrieval、Chains、Agents、Memory，强调「框架帮你跑完整个链路」。\n- **Day 26-33 Vercel AI SDK**：AI Core、Streaming UI、Tool Calling、RSC，强调「轻量、贴近手写 Agent Loop」。\n\n今天做**收官对比 + 实践**：把两套框架放进同一张决策表，并用**同一个需求**（带工具调用的多轮问答 Agent）各写一版，看清差异本质。\n\n## 1. 设计哲学对比\n\n| 维度 | LangChain.js | Vercel AI SDK |\n|------|--------------|---------------|\n| 定位 | 全栈 Agent 框架（生态最大） | 轻量生成/流式原语（前端友好） |\n| 抽象层级 | 高（Chain/Agent/Retriever 开箱即用） | 低（generate/stream/tool 原语，你自己编排） |\n| 流式 | 需包一层 / 中间件 | 一等公民（textStream/partialTextStream/tool-invocation） |\n| 前端 | 较少内置 UI | `useChat`/`streamUI` 深度集成 React |\n| 多 Agent | LangGraph（专用编排层） | 自己用 maxSteps/分支实现 |\n| RAG | 文档加载/切分/向量库全家桶 | 需自行组合（或用 LangChain retriever） |\n| 学习曲线 | 陡（概念多、版本迭代快） | 缓（API 少、直觉强） |\n| 适合 | 复杂 RAG、多步 Agent、生产级管线 | 聊天 UI、AI 生成组件、快速原型 |\n\n**一句话**：LangChain 是「瑞士军刀套装」，Vercel AI SDK 是「锋利的水果刀」。复杂管线选前者，前端流式聊天选后者。\n\n## 2. 核心 API 映射表\n\n| 能力 | LangChain.js | Vercel AI SDK |\n|------|--------------|---------------|\n| 文本生成 | `model.invoke(prompt)` | `generateText({ model, prompt })` |\n| 流式 | `model.stream()` | `streamText()` → `textStream` |\n| 工具 | `@tool` + `initializeAgentExecutorWithOptions` | `tool()` + `tools` + `maxSteps` |\n| 提示模板 | `ChatPromptTemplate` | 直接字符串 / 自行封装 |\n| 记忆 | `BufferMemory` / messages 数组 | 自行维护 `messages` 数组 |\n| 链式编排 | `RunnableSequence` / `RunnableBranch` | 自行函数组合 |\n| 前端 | 自行搭 | `useChat` / `streamUI` |\n\n## 3. 同一个需求，两种实现\n\n**需求**：用户问「上海天气如何？如果 >30 度告诉我东京天气」，Agent 需调天气工具、可能多轮。\n\n### Vercel AI SDK 版（更短）\n\n```ts\nimport { generateText, tool } from 'ai';\nimport { openai } from '@ai-sdk/openai';\nimport { z } from 'zod';\n\nconst weather = tool({\n  description: '获取城市天气',\n  parameters: z.object({ city: z.string() }),\n  execute: async ({ city }) => fetchWeather(city),\n});\n\nconst { text, steps } = await generateText({\n  model: openai('gpt-4o-mini'),\n  prompt: '上海天气如何？如果 >30 度告诉我东京天气',\n  tools: { weather },\n  maxSteps: 5, // 自动多轮工具循环\n});\nconsole.log(text, steps);\n```\n\n### LangChain.js 版（更结构化）\n\n```ts\nimport { ChatOpenAI } from '@langchain/openai';\nimport { createToolCallingAgent, AgentExecutor } from 'langchain/agents';\nimport { tool } from '@langchain/core/tools';\nimport { z } from 'zod';\nimport { ChatPromptTemplate } from '@langchain/core/prompts';\n\nconst weather = tool(async ({ city }) => fetchWeather(city), {\n  name: 'weather',\n  description: '获取城市天气',\n  schema: z.object({ city: z.string() }),\n});\n\nconst llm = new ChatOpenAI({ model: 'gpt-4o-mini' });\nconst agent = createToolCallingAgent({\n  llm,\n  tools: [weather],\n  prompt: ChatPromptTemplate.fromMessages([\n    ['system', '你是一个助手'],\n    ['placeholder', '{chat_history}'],\n    ['human', '{input}'],\n    ['placeholder', '{agent_scratchpad}'],\n  ]),\n});\nconst executor = new AgentExecutor({ agent, tools: [weather], maxIterations: 5 });\nconst res = await executor.invoke({ input: '上海天气如何？>30度告诉我东京天气' });\nconsole.log(res.output);\n```\n\n**对比直觉**：Vercel 版像「写业务代码」，LangChain 版像「配置一个 Agent 对象」。前者灵活透明，后者结构清晰、易扩展（换 retriever、加 memory 都现成）。\n\n## 4. 选型决策树（沉淀给自己）\n\n```\n需要现成 RAG 全家桶 / 多 Agent 编排 / 生产级管线？\n  ├─ 是 → LangChain.js (+ LangGraph)\n  └─ 否 → 主要做聊天/AI 生成 UI、重视前端流式体验？\n            ├─ 是 → Vercel AI SDK（useChat / streamUI）\n            └─ 否 → 两者皆可，按团队熟悉度选；\n                     想轻量可控选 Vercel，想生态完整选 LangChain\n```\n\n## 5. 小型 Agent demo 实践任务\n\n今天动手：用**你更想深入的框架**，实现一个「最小通用 Agent」：\n- 至少挂 2 个工具（如 calculator + weather/search）；\n- 支持多轮工具调用（Vercel 用 `maxSteps`，LangChain 用 `maxIterations`）；\n- 支持多轮对话记忆（Vercel 自己维护 messages，LangChain 用 BufferMemory 或 messages 数组）；\n- 把 Day 12 的 ReAct Agent Loop 思想真正跑通。\n\n把代码提交到你的练习仓库，作为阶段二成果物。\n\n## 6. 常见坑\n\n- **两端混用却不清边界** → 可在 Vercel 项目里 import LangChain 的 retriever（互补），但别重复造轮子。\n- **为用 LangChain 而用 LangChain** → 简单聊天用 Vercel 三行搞定，别上重框架。\n- **demo 不沉淀** → 阶段二结束务必留一份可运行 demo，阶段三（RAG/多 Agent）会复用。\n- **API Key 暴露** → 无论哪套，key 都只在服务端；前端走 API Route / Server Action。\n- **官方站不可访问** → 文档用国内镜像：LangChain 中文 js.langchain.com.cn / langchain-doc.cn，Vercel AI SDK 中文 ai-sdk.com.cn。\n\n## 学习资料与延伸\n\n- LangChain.js Templates（官方模板库）：https://github.com/langchain-ai/langchainjs-templates\n- Vercel AI Chatbot（完整参考实现）：https://github.com/vercel/ai-chatbot\n- Vercel AI SDK 中文文档：https://ai-sdk.com.cn/docs/introduction\n- LangChain JS/TS 中文文档：https://js.langchain.com.cn/docs/\n- 2026 AI Agent 框架终极对比（掘金）：https://juejin.cn/post/7636584182789718058\n\n## 今日小练习\n\n按上面的选型决策树，给自己定一个「阶段三 RAG 项目」的技术栈（提示：RAG 全家桶倾向 LangChain，但若项目已是 Next.js + Vercel AI SDK 也可混用其流式 UI + LangChain retriever）。然后完成「最小通用 Agent demo」并提交。",
  }
,
  {
    id: "39",
    title: "阶段二复习与代码整理：LangChain.js + Vercel AI SDK 沉淀",
    slug: "ai-agent-day35-phase2-review",
    date: "2026-08-05",
    tags: ["AI Agent","阶段二复习","LangChain.js","Vercel AI SDK","代码整理"],
    excerpt: "阶段二（Day 15-35）收官复习日：把 LangChain.js 与 Vercel AI SDK 两套框架的代码示例、心智模型做一次系统性整理，形成可复用的笔记目录与速查表，为阶段三 RAG / 多 Agent / 工具集成打地基。",
    readingTime: 11,
    content: "## 回顾与今天的目标\n\n阶段二（Day 15-35）我们走完了两大框架：\n- **Day 16-25 LangChain.js**：Model I/O、Retrieval、Chains、Agents、Memory——「框架帮你跑完整个链路」。\n- **Day 26-33 Vercel AI SDK**：AI Core、Streaming UI、Tool Calling、RSC——「轻量、贴近手写 Agent Loop」。\n\n今天不学新概念，而是**整理代码 + 建立速查心智模型**，把散落的知识点收拢成可复用的资产。\n\n## 1. 两套框架的「一句话心智模型」\n\n| 维度 | LangChain.js | Vercel AI SDK |\n| --- | --- | --- |\n| 定位 | 瑞士军刀套装（开箱即用的链/记忆/检索） | 水果刀（贴近原语，自己拼装） |\n| 核心抽象 | Runnable（LCEL pipe） | `generateText` / `streamText` 返回控制器 |\n| 记忆 | legacy Memory 类已弃用，现代用 messages 数组 | 天然用 messages 数组，配合 `useChat` |\n| 前端 | 无内建 UI，自己接 | `@ai-sdk/react` 的 `useChat` 开箱即用 |\n| 适合 | 复杂 RAG / 多步编排 / 想少写样板 | 轻量流式 Chat / 前端驱动 / 想完全掌控 |\n\n> 关键结论：**不是二选一**。RAG 重检索用 LangChain 方便，流式 Chat 用 Vercel AI SDK 顺手，真实项目常混用。\n\n## 2. 代码整理清单（建议今天落地）\n\n把前 20 天写的 demo 归到统一目录：\n\n```\nai-agent-playground/\n├── langchain/\n│   ├── 01-model-io.ts        # ChatOpenAI + PromptTemplate + OutputParser\n│   ├── 02-retrieval.ts       # 加载→切分→嵌入→入库→检索\n│   ├── 03-chains.ts          # RunnableSequence / RunnableBranch 路由\n│   ├── 04-agents.ts          # createToolCallingAgent + 自定义工具\n│   └── 05-memory.ts          # messages 数组 + MessagesPlaceholder\n└── vercel-ai/\n    ├── 01-generate-text.ts   # generateText 三种用法\n    ├── 02-stream-text.ts     # streamText + 原生流消费\n    ├── 03-use-chat/          # 前端聊天组件（Next.js）\n    └── 04-tool-calling.ts    # tool() + maxSteps 多轮\n```\n\n每个文件顶部写 3 行注释：**做什么 / 关键 API / 坑点**，半年后回看也能秒懂。\n\n## 3. 必背速查表\n\n**LangChain.js 高频片段**\n```ts\nimport { ChatOpenAI } from '@langchain/openai'\nimport { ChatPromptTemplate } from '@langchain/core/prompts'\nimport { StringOutputParser } from '@langchain/core/output_parsers'\nimport { RunnableSequence } from '@langchain/core/runnables'\n\nconst chain = RunnableSequence.from([\n  ChatPromptTemplate.fromMessages([['system', '你是一个助手'], ['human', '{input}']]),\n  new ChatOpenAI({ model: 'gpt-4o-mini' }),\n  new StringOutputParser(),\n])\nawait chain.invoke({ input: '你好' })\n```\n\n**Vercel AI SDK 高频片段**\n```ts\nimport { generateText } from 'ai'\nimport { openai } from '@ai-sdk/openai'\n\nconst { text } = await generateText({\n  model: openai('gpt-4o-mini'),\n  messages: [{ role: 'user', content: '你好' }],\n})\n```\n\n## 4. 常见坑回顾（阶段二高频翻车点）\n\n- **混用框架边界**：在 Vercel 里硬套 LangChain 的 Memory 类 → 直接维护 messages 数组更干净。\n- **provider 包漏装**：`generateText` 报 \"model not found\" 多半是没装 `@ai-sdk/openai`。\n- **Node 版本过低**：Vercel AI SDK 要求 Node 18+，流式 API 依赖原生 fetch。\n- **未消费完流**：`streamText` 返回的流不读取会内存泄漏，前端务必消费到底。\n- **ReAct 解析脆弱**：优先用原生 tool calling（`createToolCallingAgent`），别迷信 ReAct 文本解析。\n\n## 5. 今日实践任务\n\n1. 按上面的目录结构，把前 20 天的 demo 搬进 `ai-agent-playground`。\n2. 为每个文件补「做什么 / 关键 API / 坑点」三行注释。\n3. 写一份 `README.md`，用一张表说清「什么场景用哪套框架」。\n\n---\n\n## 学习建议\n- 复习日最容易「看了就过」，**动手整理代码**比再看一遍文档收益高 3 倍。\n- 把速查片段存进你的代码片段工具（VS Code Snippets / Raycast），下次写 Agent 直接调。\n- 官方站点（js.langchain.com / sdk.vercel.ai）国内可能不可访问，收藏中文镜像：\n  - LangChain JS 中文：https://js.langchain.com.cn/docs/\n  - Vercel AI SDK 中文：https://ai-sdk.com.cn/docs/introduction\n\n⏰ 预计学习时长：2 小时（动手整理为主）",
  }
,
  {
    id: "40",
    title: "RAG 核心流程（上）：文档加载与切分",
    slug: "ai-agent-day36-rag-document-splitting",
    date: "2026-08-06",
    tags: ["AI Agent","阶段三进阶","RAG","文档加载","文本切分","RecursiveCharacterTextSplitter"],
    excerpt: "进入阶段三「进阶能力」第一天：拆解 RAG（检索增强生成）第一步——文档加载与切分。搞懂为什么需要切分、RecursiveCharacterTextSplitter 的递归分隔逻辑、chunkSize/chunkOverlap 调参经验，以及语义切分 vs 固定长度切分的取舍。",
    readingTime: 14,
    content: "## 回顾与今天的目标\n\n阶段二我们掌握了「框架怎么调模型」。阶段三（Day 36-56）进入**真实 Agent 的核心能力**：RAG、多 Agent 编排、工具集成、记忆系统。\n\n今天从 **RAG（Retrieval-Augmented Generation，检索增强生成）** 的第一步讲起——**把知识文档变成可被向量检索的小块**。这是让 Agent「开卷考试」而非「凭记忆瞎编」的关键。\n\n## 1. 为什么需要切分（Chunking）\n\nRAG 的完整链路是：`文档 → 切分 → 嵌入 → 入库 → 检索 → 注入 Prompt → 生成`。\n\n为什么不能直接把整本文档塞给嵌入模型？\n- **嵌入模型有 token 上限**（如 `text-embedding-3-small` 约 8191 token），长文档会被截断。\n- **检索粒度太粗**：整本文档作为一条向量，语义太杂，检索精准度差。\n- **上下文窗口贵**：把不相关的大段文本都喂给 LLM 是浪费 token。\n\n切分就是把文档切成**语义相对完整、长度适中**的 chunk，让「检索→注入」更精准。\n\n## 2. Document 数据结构\n\nLangChain 里一切知识的最小单元是 `Document`：\n\n```ts\ninterface Document {\n  pageContent: string        // 文本正文\n  metadata: {                // 来源/页码/章节等，检索后可溯源\n    source?: string\n    page?: number\n    [key: string]: any\n  }\n}\n```\n\n## 3. 文档加载（Document Loaders）\n\n框架提供几十种 Loader，常见：\n\n| Loader | 用途 |\n| --- | --- |\n| `TextLoader` | `.txt` 纯文本 |\n| `PDFLoader` | PDF（需 `pdf-parse` 依赖） |\n| `WebBaseLoader` | 网页 URL（基于 `cheerio`） |\n| `CSVLoader` | 表格数据，按行切 |\n| `JSONLoader` | JSON，按路径提取 |\n\n```ts\nimport { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'\nconst loader = new PDFLoader('2026年报.pdf')\nconst docs = await loader.load()   // Document[]\n```\n\n## 4. 文本切分器（Text Splitters）\n\n### 4.1 朴素硬切的问题\n按固定字符数直接 `slice` 会**把一句话、一个词切断**，破坏语义。所以需要「在自然的边界切」。\n\n### 4.2 RecursiveCharacterTextSplitter（首选）\n它的核心思路：**按分隔符优先级逐层递归切**。\n\n分隔符优先级（默认）：\n```ts\n['\\n\\n', '\\n', ' ', '']   // 段落 → 换行 → 空格 → 字符\n```\n\n逻辑：先用 `\\n\\n` 切，如果某块仍超过 `chunkSize`，再用 `\\n` 切，再超再用空格……直到满足长度。这保证**尽量在段落/句子边界切**，语义损失最小。\n\n```ts\nimport { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'\n\nconst splitter = new RecursiveCharacterTextSplitter({\n  chunkSize: 500,        // 每块目标字符数（中文约 300-500 字较稳）\n  chunkOverlap: 50,      // 相邻块重叠，避免跨块语义断裂\n})\n\nconst chunks = await splitter.splitDocuments(docs)  // Document[]\nconsole.log(chunks[0].pageContent, chunks[0].metadata)\n```\n\n### 4.3 其他切分器\n- **CharacterTextSplitter**：按单一分隔符硬切，简单但不智能。\n- **TokenTextSplitter**：按 token 数切，贴合嵌入模型计费口径（推荐用于英文）。\n- **MarkdownTextSplitter / LatexTextSplitter**：尊重文档结构（标题/公式）切。\n- **语义切分（Semantic Chunking，预览）**：用嵌入模型判断「语义边界」再切，精度最高但慢，Day 40 会展开。\n\n## 5. chunkSize / chunkOverlap 调参经验\n\n| 场景 | chunkSize | chunkOverlap | 理由 |\n| --- | --- | --- | --- |\n| 中文问答 | 300-500 字 | 10-15% | 中文信息密度高，块小更精准 |\n| 英文技术文档 | 800-1000 token | 15-20% | 英文词短，可稍大 |\n| 代码文件 | 按函数/类切 | 小 | 用 Markdown/Code 切分器更合适 |\n\n**原则**：块太大→检索不精准；块太小→上下文碎片化、跨块信息丢失。`overlap` 让相邻块共享边缘，缓解「答案被切断在两块之间」。\n\n## 6. 完整「加载 → 切分」实战\n\n```ts\nimport { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'\nimport { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'\n\nconst loader = new PDFLoader('产品手册.pdf')\nconst rawDocs = await loader.load()\n\nconst splitter = new RecursiveCharacterTextSplitter({\n  chunkSize: 400,\n  chunkOverlap: 50,\n})\nconst chunks = await splitter.splitDocuments(rawDocs)\n\nconsole.log(`共切出 ${chunks.length} 块`)\nconsole.log('第 1 块来源:', chunks[0].metadata)\n```\n\n> 下一步（Day 37-39）：把这些 chunk 用 Embeddings 变成向量，存进向量库，再做相似度检索。\n\n## 7. 常见坑\n\n- **依赖缺失**：`PDFLoader` 忘装 `pdf-parse`、`WebBaseLoader` 忘装 `cheerio` → 运行时才报错。\n- **overlap ≥ chunkSize**：重叠比块还大，死循环风险。\n- **中文字符计数**：`chunkSize` 按字符算，中文一个字=1 字符，但嵌入模型按 token，汉字约 1-2 token/字，别照搬英文经验值。\n- **metadata 丢失**：切分后 metadata 默认继承，但自定义 loader 容易漏传 `source`，导致后面无法溯源。\n- **官方站不可访问**：LangChain 文档用国内镜像 js.langchain.com.cn。\n\n## 学习资料与网站\n- LangChain JS 中文文档（文档加载）：https://js.langchain.com.cn/docs/\n- LangChain 中文文档：https://langchain-doc.cn/\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n- 掘金 RecursiveCharacterTextSplitter 实战：https://juejin.cn/post/7348766635905409056\n\n## 学习建议\n- 今天先**只做加载+切分**，别急着上嵌入，把 `chunks` 打印出来肉眼看切得合不合理。\n- 亲自调 `chunkSize`：分别试 200 / 500 / 1000，观察同一段文字被怎么切，建立「块大小」的直觉。\n- 用一份你自己的 PDF（合同/手册/笔记）做实验，比用教程示例更有体感。\n\n⏰ 预计学习时长：2.5 小时",
  }
,
  {
    id: "41",
    title: "RAG 核心流程（下）：向量嵌入 Embeddings",
    slug: "ai-agent-day37-rag-embeddings",
    date: "2026-08-07",
    tags: ["AI Agent","阶段三进阶","RAG","Embeddings","向量嵌入","OpenAI Embeddings","语义检索"],
    excerpt: "RAG 第二步：把切分后的文本变成高维语义向量。搞懂 Embedding 原理（文本→向量，语义相近则向量相近）、OpenAI Embeddings 模型选择、embedQuery vs embedDocuments 的区别、本地嵌入模型（HuggingFaceTransformers）的隐私优势，以及维度匹配、中英文选型等高频坑。",
    readingTime: 14,
    content: "## 回顾与今天的目标\n\n昨天（Day 36）我们把文档切成了小块 chunk。今天进入 RAG 链路的第二步：**把文本变成向量（Embedding）**。\n\n没有这一步，chunk 只是一堆字符串；有了它，计算机才能「理解」语义、做相似度检索。\n\n## 1. Embedding 是什么\n\nEmbedding 模型把一个 token / 一段文本映射成一个**高维浮点向量**（如 1536 维）：\n- 语义相近的文本 → 向量在空间中距离更近（余弦相似度高）。\n- 语义无关的文本 → 向量距离远。\n\n```\n\"猫喜欢鱼\"  → [0.12, -0.34, 0.88, ...]  (1536维)\n\"狗爱吃肉\"  → [0.10, -0.30, 0.85, ...]  (距离很近)\n\"今天天气晴\" → [0.91, 0.22, -0.44, ...] (距离很远)\n```\n\n这让「用户问题」和「知识库段落」能在同一个向量空间里比对，找最相关的那块。\n\n## 2. OpenAI Embeddings\n\n```ts\nimport { OpenAIEmbeddings } from '@langchain/openai'\n\nconst embeddings = new OpenAIEmbeddings({\n  model: 'text-embedding-3-small',  // 1536维，便宜够用\n  // model: 'text-embedding-3-large' // 3072维，更准但更贵\n})\n```\n\n**两个核心方法：**\n- `embedDocuments(texts: string[])` → 批量嵌入文档 chunk（用于建库）。\n- `embedQuery(text: string)` → 嵌入用户查询（用于检索）。\n\n```ts\nconst vectors = await embeddings.embedDocuments(chunks.map(c => c.pageContent))\nconst queryVec = await embeddings.embedQuery('如何重置密码？')\n```\n\n## 3. 本地嵌入模型（隐私 / 免 API）\n\n如果不想把数据发给 OpenAI，可以用本地模型（基于 `@langchain/community` + `transformers.js` 或 Ollama）：\n\n```ts\nimport { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers'\n\nconst localEmbeddings = new HuggingFaceTransformersEmbeddings({\n  model: 'Xenova/text-embedding-all-MiniLM-L6-v2',  // 384维，本地跑\n})\n```\n\n优点：数据不出本机、无调用成本；缺点：精度通常低于 OpenAI 大模型、首次下载模型较慢。\n\n## 4. 维度与选型经验\n\n| 模型 | 维度 | 场景 |\n| --- | --- | --- |\n| text-embedding-3-small | 1536 | 默认首选，性价比高 |\n| text-embedding-3-large | 3072 | 对精度敏感、语料专业 |\n| all-MiniLM-L6-v2（本地） | 384 | 本地/隐私/原型验证 |\n\n> ⚠️ **建库和检索必须用同一个模型、同一维度**，否则向量空间不一致，相似度计算毫无意义。\n\n## 5. 完整「切分 → 嵌入」串联\n\n```ts\nimport { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'\nimport { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'\nimport { OpenAIEmbeddings } from '@langchain/openai'\n\nconst rawDocs = await new PDFLoader('手册.pdf').load()\nconst chunks = await new RecursiveCharacterTextSplitter({\n  chunkSize: 400, chunkOverlap: 50,\n}).splitDocuments(rawDocs)\n\nconst embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })\nconst vectors = await embeddings.embedDocuments(chunks.map(c => c.pageContent))\nconsole.log(`已为 ${vectors.length} 个 chunk 生成向量，每维 ${vectors[0].length}`)\n```\n\n下一步（Day 38）：把 `vectors` 存进向量数据库（MemoryVectorStore / Chroma / Pinecone），做相似度检索。\n\n## 6. 常见坑\n\n- **查询与文档用了不同模型**：`embedQuery` 和 `embedDocuments` 必须同源，否则检索全错。\n- **维度不匹配**：向量库建表维度要和实际模型一致（如 1536），否则写入报错。\n- **中文选模**：中文语义建议用 text-embedding-3 系列或专门中文模型（如 bge-large-zh），纯英文小模型对中文效果差。\n- **批量超限**：`embedDocuments` 一次别塞太多，注意 OpenAI 的 token / 条数限制，分批并发更稳。\n- **官方站不可访问**：OpenAI 文档用国内镜像 docsopen.ai 替代。\n\n## 学习资料与网站（国内可访问镜像）\n- OpenAI Embeddings 中文文档（社区版）：https://docsopen.ai/guides/embeddings\n- LangChain JS 中文文档：https://js.langchain.com.cn/docs/\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n- 掘金 向量嵌入入门：https://juejin.cn/post/7289762560219127866\n\n## 学习建议\n- 今天动手跑通 `embedDocuments` + `embedQuery`，把两个向量算一下余弦相似度（可用 `computeCosineSimilarity`），亲眼验证「语义相近 → 距离近」。\n- 对比「用 small 模型」和「本地 MiniLM」对同一句中文的检索结果差异，建立模型选型直觉。\n- 别急着接向量库，先把「文本→向量」这一步玩熟。\n\n⏰ 预计学习时长：2.5 小时",
  }
,
  {
    id: "42",
    title: "RAG 核心流程（三）：向量存储 VectorStore",
    slug: "ai-agent-day38-rag-vector-storage",
    date: "2026-08-08",
    tags: ["AI Agent","阶段三进阶","RAG","向量存储","Pinecone","Chroma","Qdrant","MemoryVectorStore"],
    excerpt: "RAG 第三步：把嵌入向量持久化并建立索引，支持相似度检索。对比 MemoryVectorStore（开发首选）/ Chroma（本地持久化）/ Pinecone（托管云）三种向量库，跑通「加载→切分→嵌入→入库」全链路，并点出维度匹配、元数据过滤、中文索引等高频坑。",
    readingTime: 14,
    content: "## 回顾与今天的目标\n\n- Day 36：文档加载 + 切分 → 得到 `chunks`。\n- Day 37：向量嵌入 → 把每个 chunk 变成高维向量。\n- **今天（Day 38）**：把「向量 + 原文 + metadata」存进**向量数据库（VectorStore）**，并建立索引以便后续相似度检索。\n\n没有 VectorStore，每次检索都得重新算一遍全库相似度——既慢又贵。VectorStore 把向量索引化，让「给定查询向量，秒回 Top-K 最相关 chunk」成为可能。\n\n## 1. VectorStore 统一接口\n\nLangChain 用统一的 `VectorStore` 抽象，核心方法：\n- `addDocuments(documents)` / `addVectors(vectors, documents)`：写入。\n- `similaritySearch(query, k)`：按文本查询返回 Top-K 文档。\n- `asRetriever()`：包装成 Retriever，供 Chain 直接调用（Day 39 用到）。\n\n## 2. 三种向量库选型\n\n| 方案 | 部署 | 持久化 | 适用 |\n| --- | --- | --- | --- |\n| **MemoryVectorStore** | 内存 | ❌ 重启即丢 | 本地开发、快速验证、单测 |\n| **Chroma** | 本地/自建 | ✅ 本地磁盘 | 中小项目、私有化、免 API |\n| **Pinecone** | 云端托管 | ✅ 云端 | 生产环境、海量数据、低运维 |\n\n### 2.1 MemoryVectorStore（今天首选，零依赖）\n```ts\nimport { MemoryVectorStore } from 'langchain/vectorstores/memory'\nimport { OpenAIEmbeddings } from '@langchain/openai'\n\nconst store = await MemoryVectorStore.fromDocuments(\n  chunks,                       // Day36 的切分结果\n  new OpenAIEmbeddings({ model: 'text-embedding-3-small' })\n)\nconst hits = await store.similaritySearch('如何重置密码？', 3)\nconsole.log(hits.map(h => h.pageContent))\n```\n\n### 2.2 Chroma（本地持久化）\n```ts\nimport { Chroma } from '@langchain/community/vectorstores/chroma'\n\nconst store = await Chroma.fromDocuments(chunks, embeddings, {\n  collectionName: 'my-kb',\n  url: 'http://localhost:8000',   // 需先 docker run chromadb\n})\n```\n重启后可用 `Chroma.fromExistingCollection(embeddings, { collectionName })` 重新加载。\n\n### 2.3 Pinecone（云端托管）\n```ts\nimport { PineconeStore } from '@langchain/community/vectorstores/pinecone'\nimport { Pinecone } from '@pinecone-database/pinecone'\n\nconst client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })\nconst index = client.Index('my-kb')   // 维度须与嵌入模型一致(如1536)\nconst store = await PineconeStore.fromDocuments(chunks, embeddings, { pineconeIndex: index })\n```\n> Pinecone 文档：https://docs.pinecone.io/ （官方站，国内可能受限，可用社区镜像或搜索中文教程）\n\n## 3. 完整「加载 → 切分 → 嵌入 → 入库」全链路\n\n```ts\nimport { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'\nimport { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'\nimport { OpenAIEmbeddings } from '@langchain/openai'\nimport { MemoryVectorStore } from 'langchain/vectorstores/memory'\n\nconst raw = await new PDFLoader('手册.pdf').load()\nconst chunks = await new RecursiveCharacterTextSplitter({\n  chunkSize: 400, chunkOverlap: 50,\n}).splitDocuments(raw)\n\nconst store = await MemoryVectorStore.fromDocuments(\n  chunks,\n  new OpenAIEmbeddings({ model: 'text-embedding-3-small' })\n)\nconsole.log(`✓ 已入库 ${chunks.length} 个 chunk`)\n```\n\n下一步（Day 39）：用 `store.similaritySearch` / `asRetriever()` 做检索，并把命中文本注入 Prompt 让 LLM 回答。\n\n## 4. 常见坑\n\n- **维度不匹配**：Pinecone 索引维度必须 = 嵌入模型维度（small=1536 / large=3072），建错索引会写入失败。\n- **嵌入模型不一致**：建库和检索必须同一模型，否则向量空间错乱（Day 37 已强调）。\n- **metadata 过滤**：向量库支持按 metadata 过滤（如 `source`、`date`），但 Chroma/Pinecone 的过滤语法不同，别混用。\n- **MemoryVectorStore 不持久**：仅开发用，别在生产当数据库。\n- **中文分词索引**：Chroma/Pinecone 对中文检索靠向量语义，无需分词；但混合检索（Day 40）时关键词部分要注意中文分词。\n- **官方站不可访问**：Pinecone/Chroma 官方文档国内可能受限，优先用中文教程或社区镜像。\n\n## 学习资料与网站（国内可访问镜像）\n- LangChain JS 中文文档（向量存储）：https://js.langchain.com.cn/docs/\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n- 掘金 Chroma 入门实战：https://juejin.cn/post/7242705497316053030\n- Pinecone 官方文档：https://docs.pinecone.io/ （可能受限，可用社区镜像）\n- Chroma 官方文档：https://docs.trychroma.com/ （可能受限，可用社区镜像）\n\n## 学习建议\n- 今天用 **MemoryVectorStore** 跑通全链路最省事，别一上来就折腾 Pinecone 账号。\n- 入库后立刻 `similaritySearch` 几个问题，确认「问什么、回什么」合理，再往下走。\n- 给 chunk 的 metadata 加上 `source` 字段，为 Day 63「引用溯源」提前铺路。\n\n⏰ 预计学习时长：2.5 小时",
  }
,
  {
    id: "43",
    title: "RAG 核心流程（四）：相似度检索与上下文注入",
    slug: "ai-agent-day39-rag-retrieval-context",
    date: "2026-08-09",
    tags: ["AI Agent","阶段三进阶","RAG","检索","上下文注入","Retriever"],
    excerpt: "RAG 第四步：用 asRetriever / similaritySearch 把用户问题转成向量、召回 Top-K 相关 chunk，并把命中文本拼进 Prompt 让 LLM 基于证据回答。覆盖检索器接口、MMR 多样性、带分数检索、上下文窗口拼接与引用溯源，点出空召回、chunk 过大、上下文污染等高频坑。",
    readingTime: 14,
    content: "## 回顾与今天的目标\n\n- Day 36：文档加载 + 切分 → 得到 `chunks`。\n- Day 37：向量嵌入 → 把每个 chunk 变成高维向量。\n- Day 38：向量存储 → 把「向量 + 原文 + metadata」落库建索引。\n- **今天（Day 39）**：用 `store.asRetriever()` / `similaritySearch` 做**检索**，并把命中文本**注入 Prompt**，让 LLM 基于证据回答。这是 RAG 从「存」到「用」的关键一跃。\n\n没有检索，向量库只是个孤岛；检索做不好，LLM 就会拿到无关文本产生幻觉。\n\n## 1. 检索器（Retriever）统一接口\n\nLangChain 用 `Retriever` 抽象「给查询、返回文档」这一动作，Chain 可以直接 `await retriever.invoke(query)`：\n\n- `store.asRetriever({ k: 4 })`：把 VectorStore 包装成 Retriever，最常用。\n- `retriever.invoke(query)`：返回 `Document[]`（含 `pageContent` 与 `metadata`）。\n- `similaritySearch(query, k)`：VectorStore 自带方法，直接拿 Top-K 文档。\n\n```ts\nimport { MemoryVectorStore } from 'langchain/vectorstores/memory'\nimport { OpenAIEmbeddings } from '@langchain/openai'\n\nconst store = await MemoryVectorStore.fromDocuments(\n  chunks,\n  new OpenAIEmbeddings({ model: 'text-embedding-3-small' })\n)\n\n// 方式一：asRetriever（推荐，可被 Chain 直接调用）\nconst retriever = store.asRetriever({ k: 4 })\nconst docs = await retriever.invoke('如何重置密码？')\n\n// 方式二：similaritySearch\nconst docs2 = await store.similaritySearch('如何重置密码？', 4)\n```\n\n## 2. 检索进阶：MMR 多样性与带分数\n\n- **MMR（最大边际相关）**：`asRetriever({ searchType: 'mmr', searchKwargs: { fetchK: 20, lambda: 0.5 } })`，先取 20 个相似结果，再贪心挑选「既相关又不重复」的 Top-K，避免召回内容高度雷同。\n- **带分数检索**：`similaritySearchWithScore(query, k)` 返回 `[doc, score]`，可按阈值过滤低质量命中（余弦相似度越接近 1 越相关）。\n\n```ts\nconst retriever = store.asRetriever({\n  searchType: 'mmr',\n  k: 4,\n  searchKwargs: { fetchK: 20, lambda: 0.5 },\n})\nconst hits = await store.similaritySearchWithScore('退款流程是什么？', 4)\nhits.forEach(([doc, score]) => console.log(score.toFixed(3), doc.pageContent.slice(0, 40)))\n```\n\n## 3. 上下文注入：把命中文本拼进 Prompt\n\n检索到的 chunk 要拼成「上下文」塞进 LLM 的 System/Human 消息，这是 RAG 的核心拼接逻辑：\n\n```ts\nimport { ChatPromptTemplate } from '@langchain/core/prompts'\n\nconst prompt = ChatPromptTemplate.fromMessages([\n  ['system', '你是知识库助手，只根据下面提供的「上下文」回答，不知道就说不知道。\\n\\n上下文：\\n{context}'],\n  ['human', '{question}'],\n])\n\nconst docs = await retriever.invoke(question)\nconst context = docs.map((d, i) => `[${i + 1}] ${d.pageContent}`).join('\\n\\n')\n\nconst messages = await prompt.formatMessages({ context, question })\nconst answer = await chatModel.invoke(messages)\n```\n\n完整 RAG 链（LCEL）通常这样串联：`retriever → 拼接 context → prompt → model → parser`（Day 20 已学过顺序链）。\n\n## 4. 引用溯源（为 Day 63 铺路）\n\n把 `metadata.source` 一起拼进上下文，让 LLM 回答时带上出处：\n\n```ts\nconst context = docs\n  .map((d, i) => `[${i + 1}] (来源: ${d.metadata.source})\\n${d.pageContent}`)\n  .join('\\n\\n')\n```\n\n前端可据此渲染 SourceCard（Day 63 项目一引用溯源功能）。\n\n## 5. 常见坑\n\n- **空召回 / 召回无关**：查询向量与文档向量模型不一致（Day 37 强调），或 chunk 切得太碎丢失语义。\n- **chunk 过大**：Top-K 拼起来超出上下文窗口，导致截断或成本飙升；按需调小 `k` 或 `chunkSize`。\n- **上下文污染**：把不相关的 chunk 全塞进去，反而干扰 LLM 判断，MMR + 分数阈值能缓解。\n- **query 未做改写**：用户口语化提问与文档书面语不匹配，可加 Query Transform（Day 40）。\n- **中文召回弱**：纯向量检索对关键词（如专有名词、编号）不敏感，需要 Day 40 的混合检索补强。\n- **官方站不可访问**：LangChain 检索文档国内可能受限，优先用中文镜像（见资料）。\n\n## 学习资料与网站（国内可访问镜像）\n\n- LangChain JS 中文文档（检索）：https://js.langchain.com.cn/docs/\n- LangChain 中文文档（Retrievers）：https://langchain-doc.cn/\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n- 掘金 RAG 检索增强实战：https://juejin.cn/post/7289762560219127866\n\n## 学习建议\n\n- 今天务必跑通「检索 → 拼接 → 回答」最小闭环，用几个真实问题验证召回质量。\n- 给 chunk 的 metadata 保留 `source`，从 Day 39 起就养成「带出处回答」的习惯。\n- 对比 `k=2` 与 `k=6` 的回答差异，体会上下文多少对准确性的影响。\n\n⏰ 预计学习时长：2.5 小时",
  }
,
  {
    id: "44",
    title: "RAG 优化：混合检索与 Reranking",
    slug: "ai-agent-day40-rag-hybrid-reranking",
    date: "2026-08-10",
    tags: ["AI Agent","阶段三进阶","RAG","混合检索","Reranking","Query Transform"],
    excerpt: "RAG 第五步优化：单一向量检索召回不稳，引入「关键词(BM25) + 向量」混合检索提升覆盖，再用 Reranker 对候选重排序挑出最相关 Top-K，并用 Query Transform 做查询改写。覆盖 EnsembleRetriever、CrossEncoder 重排、多查询扩展与常见问题定位。",
    readingTime: 15,
    content: "## 回顾与今天的目标\n\n- Day 36-38：切分 → 嵌入 → 入库，完成 RAG 的「写」链路。\n- Day 39：相似度检索 + 上下文注入，完成「读」链路，跑通最小 RAG。\n- **今天（Day 40）**：优化检索质量。纯向量检索对**专有名词、编号、罕见词**不敏感，容易漏召回。我们用**混合检索（Hybrid）+ Reranking（重排序）** 补强，并引入 **Query Transform（查询改写）**。\n\n> 工业级 RAG 的召回率，往往不是靠换更好的嵌入模型，而是靠「混合检索 + 重排」这套组合拳。\n\n## 1. 为什么需要混合检索\n\n| 检索方式 | 擅长 | 短板 |\n| --- | --- | --- |\n| 向量检索（Dense） | 语义相似（\"怎么退钱\" ↔ \"退款流程\"） | 关键词、编号、专有名词易漏 |\n| 关键词检索（BM25/Sparse） | 精确匹配术语、编号、API 名 | 同义改写无能为力 |\n\n**混合检索 = 向量检索 ∪ 关键词检索**，两者结果融合（RRF 倒数排名融合）后取并集，兼顾语义与字面。\n\n```ts\nimport { EnsembleRetriever } from 'langchain/retrievers/ensemble'\nimport { MemoryVectorStore } from 'langchain/vectorstores/memory'\n// BM25 可用 @langchain/community 的 BM25Retriever 或本地 lucene\n\nconst vectorRetriever = vectorStore.asRetriever({ k: 6 })\nconst keywordRetriever = new BM25Retriever({ k: 6 }) // 伪代码示意\n\nconst ensemble = new EnsembleRetriever({\n  retrievers: [vectorRetriever, keywordRetriever],\n  weights: [0.6, 0.4], // 向量权重略高\n})\nconst hits = await ensemble.invoke('API key 过期 403 报错怎么处理？')\n```\n\n## 2. Reranking（重排序）\n\n混合检索返回的候选可能较多且噪声大，**Reranker（通常是 Cross-Encoder）** 对「query + 每个候选」逐对打分，重新排序后只保留最相关的 Top-K（如 3-5 个），显著提升精度。\n\n```ts\nimport { CohereRerank } from '@langchain/cohere' // 或本地 CrossEncoder\n// 伪代码示意重排流程\nconst candidates = await ensemble.invoke(question)       // 取 20 个候选\nconst reranked = await cohereRerank.rank(question, candidates, { topN: 4 })\nconst context = reranked.map(d => d.pageContent).join('\\n\\n')\n```\n\n> Reranker 比嵌入模型更「懂」相关性，但慢且贵，所以只在召回后的少量候选上跑。\n\n## 3. Query Transform（查询改写）\n\n用户提问往往模糊、省略上下文，直接检索效果差。常见三种改写：\n\n- **Multi-Query（多查询扩展）**：让 LLM 把一个问题拆成多个不同角度的子查询，分别检索后合并。\n- **Step-back（退一步）**：生成更抽象的上位问题，捕捉宏观上下文。\n- **Rewrite（重写）**：结合对话历史把指代（\"它\"、\"这个方法\"）补全成完整查询。\n\n```ts\n// Multi-Query 示意：用 LLM 生成 3 个变体问题\nconst variants = await multiQueryChain.invoke(question) // [\"原问题\", \"角度2\", \"角度3\"]\nconst allDocs = (await Promise.all(variants.map(q => retriever.invoke(q)))).flat()\nconst deduped = deduplicate(allDocs)\n```\n\n## 4. 评估与问题定位\n\n- **召回率不足**：看是否漏了关键词 → 加 BM25 混合检索。\n- **精度不足 / 答非所问**：候选太多噪声 → 加重排、降 topN。\n- **多跳问题答不出**：单 chunk 信息不全 → 用 Multi-Query 或多文档拼接。\n- **中文专有名词弱**：混合检索的 BM25 部分对中文需先做分词（如 jieba）。\n\n## 5. 常见坑\n\n- **融合权重拍脑袋**：weights 需根据数据调，向量 0.5/关键词 0.5 是起点。\n- **Reranker topN 过大**：重排后还留 10 个，上下文污染依旧。\n- **BM25 未做中文分词**：中文连写导致关键词匹配失效。\n- **Query Transform 过度扩展**：生成太多子查询，成本与噪声双增。\n- **只在训练集调优**：用真实用户 query 评估，别只看样例。\n- **官方站不可访问**：Cohere/LangChain 高级检索文档国内可能受限，优先中文镜像。\n\n## 学习资料与网站（国内可访问镜像）\n\n- LangChain JS 中文文档（高级检索）：https://js.langchain.com.cn/docs/\n- LangChain 中文文档：https://langchain-doc.cn/\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n- 掘金 RAG 混合检索与重排序实战：https://juejin.cn/post/7348766635905409056\n\n## 学习建议\n\n- 先确认纯向量检索的短板（找个带编号/术语的问题试），再引入混合检索，体感更直观。\n- Reranker 优先用托管 API（Cohere）跑通流程，再考虑本地 CrossEncoder 降本。\n- 把 Query Transform 当成「可选增强」，主链路稳定后再加，避免复杂度爆炸。\n\n⏰ 预计学习时长：3 小时",
  }
,
  {
    id: "45",
    title: "多 Agent 编排（一）：顺序链式模式",
    slug: "ai-agent-day41-multi-agent-sequential",
    date: "2026-08-11",
    tags: ["AI Agent","阶段三进阶","多Agent","顺序链","编排","LangChain"],
    excerpt: "进入多 Agent 编排篇。第一种也是最基础的编排模式：顺序链式（Sequential），多个 Agent/步骤按固定顺序接力，前一个输出作为后一个输入。覆盖为什么需要多 Agent、顺序链 vs 单 Agent、用 LCEL RunnableSequence 串联多个子链、以及「研究→写作→审校」三 Agent 实战。",
    readingTime: 14,
    content: "## 回顾与今天的目标\n\n- Day 36-40：完成 RAG 全链路（切分→嵌入→存储→检索→优化），Day 40 收尾 RAG 模块。\n- **今天（Day 41）**：进入**多 Agent 编排**模块（Day 41-45）。第一种模式：**顺序链式（Sequential）**——多个 Agent 按固定顺序接力，前者的输出是后者的输入。\n\n单 Agent 像「全能选手」，但任务复杂时容易顾此失彼、上下文爆炸。多 Agent 把大任务拆给专长不同的 Agent，像流水线一样各司其职。\n\n## 1. 为什么需要多 Agent\n\n| 维度 | 单 Agent | 多 Agent 编排 |\n| --- | --- | --- |\n| 上下文 | 所有信息挤在一个对话里，易超窗 | 每步只关注自己那块，干净 |\n| 专精 | 一个模型啥都干，质量均衡但平庸 | 每环节用最合适的提示/模型 |\n| 可维护 | 提示词巨长，改一处崩全局 | 子 Agent 独立，可单独迭代 |\n| 可观测 | 黑盒 | 每步输入输出清晰，好调试 |\n\n顺序链是编排的「Hello World」：无分支、无回环，理解它就理解了编排的基本单元。\n\n## 2. 顺序链的心智模型\n\n```\n[用户输入]\n    ↓\nAgent A（研究）：检索/收集素材 → 输出「素材摘要」\n    ↓\nAgent B（写作）：基于素材写初稿 → 输出「文章草稿」\n    ↓\nAgent C（审校）：检查事实/语法 → 输出「终稿」\n    ↓\n[最终交付]\n```\n\n每一步：`output_A` 自动成为 `input_B`。这就是「前一个输出作为后一个输入」。\n\n## 3. 用 LCEL RunnableSequence 实现（Day 20 复习）\n\nLangChain 的 `RunnableSequence` / pipe（`|`）天然适合顺序链：\n\n```ts\nimport { RunnableSequence } from '@langchain/core/runnables'\nimport { ChatPromptTemplate } from '@langchain/core/prompts'\nimport { ChatOpenAI } from '@langchain/openai'\n\nconst llm = new ChatOpenAI({ model: 'gpt-4o-mini' })\n\nconst researchPrompt = ChatPromptTemplate.fromTemplate(\n  '你是研究员，针对主题「{topic}」列出 5 个关键要点与依据：'\n)\nconst writePrompt = ChatPromptTemplate.fromTemplate(\n  '你是写作者，根据以下研究素材写一篇 300 字短文：\\n{research}'\n)\nconst reviewPrompt = ChatPromptTemplate.fromTemplate(\n  '你是审校，检查下面文章的事实与通顺度，给出最终修订版：\\n{draft}'\n)\n\nconst chain = RunnableSequence.from([\n  researchPrompt.pipe(llm),                                                         // → research\n  (r) => ({ research: r.content }),\n  writePrompt.pipe(llm),                                                            // → draft\n  (r) => ({ draft: r.content }),\n  reviewPrompt.pipe(llm),                                                           // → 终稿\n])\n\nconst result = await chain.invoke({ topic: 'AI Agent 的记忆力' })\nconsole.log(result.content)\n```\n\n> 每个 `.pipe(llm)` 的输出是 `AIMessage`，用中间函数 `(r) => ({...})` 把 `content` 重命名后喂给下一步 prompt。\n\n## 4. 顺序链的变体\n\n- **带条件中止**：某步输出「无法继续」则提前结束（如研究 Agent 没找到资料）。\n- **可插入人工节点**：写作后插入 `humanReview` 人工确认再进审校（L2 自主性）。\n- **步骤可并行**：若 B、C 互不依赖，可用 `RunnableParallel` 并行（但顺序链强调严格先后）。\n\n## 5. 与 RAG 的结合\n\n研究 Agent 内部就是 Day 39 的 RAG 检索链：研究 → 调 retriever 取素材 → 总结。多 Agent 把 RAG 当成「研究子环节」复用，体现 Day 36-40 的积累价值。\n\n## 6. 常见坑\n\n- **中间变量键名错乱**：上一步输出 `{research}` 但下一步 prompt 用了 `{material}`，会报「缺少输入变量」。\n- **上下文逐层膨胀**：每步都把前序全文带下去，三步后超窗口；应只传「必要的精华」。\n- **错误向后传播**：A 出错 B 还在跑，浪费调用；加错误中断或校验。\n- **过度拆分**：两步走完的事拆成四个 Agent，延迟与成本双高。\n- **模型选择一刀切**：研究/写作用强模型，审校用快模型更划算。\n- **官方站不可访问**：LangChain Chains 文档国内可能受限，优先中文镜像。\n\n## 学习资料与网站（国内可访问镜像）\n\n- LangChain JS 中文文档（Chains/序列）：https://js.langchain.com.cn/docs/\n- LangChain 中文文档：https://langchain-doc.cn/\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n- 掘金 多 Agent 编排实战：https://juejin.cn/post/7357554457913966627\n\n## 学习建议\n\n- 先用「研究→写作→审校」三 Agent 跑通顺序链，体会「输出即输入」的接力感。\n- 故意制造一次键名错误，看报错信息，熟悉调试顺序链的常见失败模式。\n- 思考哪些环节可以并行（为 Day 42 路由、Day 45 协作模式打基础）。\n\n⏰ 预计学习时长：2.5 小时",
  }
,
  {
    id: "46",
    title: "多 Agent 编排（二）：路由分发模式",
    slug: "ai-agent-day42-multi-agent-routing",
    date: "2026-08-12",
    tags: ["AI Agent","阶段三进阶","多Agent","路由","Router","意图分发","LangChain"],
    excerpt: "多 Agent 编排第二篇：路由分发模式（Router）。用一个 Router Agent 分析用户意图，把请求分发到最匹配的专业 Agent（如数学/检索/闲聊），避免所有问题都走同一长链路。覆盖为什么需要路由、RunnableBranch 条件分支、withStructuredOutput 语义路由、多专业 Agent 实战、与顺序链（Day 41）的选型对比、常见坑。",
    readingTime: 14,
    content: "## 回顾与今天的目标\n\n- Day 41：顺序链（Sequential）——多个 Agent 固定顺序接力，前输出即后输入。适合**流程确定**的任务。\n- **今天（Day 42）**：路由分发模式（Router）——流程**不确定**，需要「看情况走不同分支」。用一个 Router Agent 判断用户意图，分发到最合适的专业 Agent（数学 / 检索 / 闲聊 …）。\n\n顺序链是「一条流水线」，路由是「一个调度台」。现实 Agent 系统往往两者结合：先用路由分发，再各自顺序处理。\n\n## 1. 为什么需要路由\n\n| 场景 | 顺序链 | 路由 |\n| --- | --- | --- |\n| 用户问数学题 | 也走 研究→写作 | ✅ 直接走 math Agent，省两步 |\n| 用户问知识库 | 也走全流程 | ✅ 走 RAG Agent |\n| 用户闲聊 | 也走全流程 | ✅ 走 chat Agent，不浪费检索成本 |\n| 意图清晰单一 | 合适 | 更合适（按需分发） |\n\n路由的核心价值：**避免所有请求都塞进同一条重链路**，按意图精准调度，省钱省时。\n\n## 2. 路由的两种实现\n\n### （1）硬路由：RunnableBranch（条件函数）\n\n适合「能靠规则/关键词判断」的分发，零额外 LLM 调用：\n\n```ts\nimport { RunnableBranch } from '@langchain/core/runnables'\nimport { RunnableSequence } from '@langchain/core/runnables'\n\nconst route = RunnableBranch.from([\n  [(input) => /计算|等于|求值/.test(input.question), mathChain],\n  [(input) => /知识库|文档|资料/.test(input.question), ragChain],\n  chatChain, // 默认兜底分支（必填）\n])\n\nconst result = await route.invoke({ question: '帮我算 3+5 的 2 倍' })\n```\n\n> **注意**：`RunnableBranch.from` 最后一个必须是**无条件的兜底分支**，否则未命中会报错。\n\n### （2）软路由：语义路由（Router Agent 用 LLM 选目的地）\n\n意图模糊、规则覆盖不了时，让 LLM 先「分类」，再映射子链。这是真正的「Router Agent」：\n\n```ts\nimport { ChatOpenAI } from '@langchain/openai'\nimport { z } from 'zod'\n\nconst llm = new ChatOpenAI({ model: 'gpt-4o-mini' })\n\n// 1) Router：用 withStructuredOutput 让 LLM 输出目的地标签\nconst routerSchema = z.object({\n  destination: z.enum(['math', 'rag', 'chat']).describe('意图分类'),\n  reason: z.string(),\n})\nconst router = llm.withStructuredOutput(routerSchema)\n\n// 2) 目的地 → 子链映射\nconst chainMap = { math: mathChain, rag: ragChain, chat: chatChain }\n\nconst { destination } = await router.invoke(\n  `判断用户意图：${question}`\n)\nconst result = await chainMap[destination].invoke({ question })\n```\n\n> 语义路由多一次 LLM 调用（分类），但能处理口语化、混合意图，灵活度远高于硬路由。\n\n## 3. 多专业 Agent 实战（math / rag / chat）\n\n```ts\n// 三个专业子链（复用 Day 20 顺序链写法）\nconst mathChain = ChatPromptTemplate.fromTemplate('你是数学助手，只算不解释：{question}')\n  .pipe(llm)\nconst ragChain = RunnableSequence.from([ /* Day 39 的 检索→拼接→回答 */ ])\nconst chatChain = ChatPromptTemplate.fromTemplate('你是闲聊助手：{question}')\n  .pipe(llm)\n\n// 组合：Router 选目的地 → 走对应子链\nasync function dispatch(question: string) {\n  const { destination } = await router.invoke(`分类：${question}`)\n  return chainMap[destination].invoke({ question })\n}\n```\n\n## 4. 路由 vs 顺序链 选型\n\n| 维度 | 顺序链（Day 41） | 路由（Day 42） |\n| --- | --- | --- |\n| 流程 | 固定顺序 | 按意图分支 |\n| 适用 | 步骤确定（研究→写→审） | 入口多元（问答/闲聊/计算） |\n| 成本 | 每步都跑 | 只跑命中的分支 |\n| 复杂度 | 低 | 中（需维护映射表） |\n\n> 工业实践常「路由 + 顺序」组合：Router 分发后，每个专业 Agent 内部再用顺序链处理。\n\n## 5. 常见坑\n\n- **缺默认兜底分支**：`RunnableBranch.from` 末尾必须放无条件的 `chatChain`，否则未命中意图会抛错。\n- **条件顺序敏感**：硬路由按数组顺序判定，更具体的规则要放前面，避免被宽泛规则先命中。\n- **语义路由多一次调用**：分类也要花钱花时，高频场景考虑硬路由或缓存分类结果。\n- **子链输入键不一致**：math/rag/chat 的 prompt 变量要统一（都用 `{question}`），否则分发后报缺变量。\n- **路由标签漂移**：LLM 分类输出不在 enum 内（如大小写），用 Zod enum + 兜底收敛。\n- **过度路由**：两三个分支硬拆成十个，映射表维护成本飙升，适度即可。\n- **官方站不可访问**：LangChain 路由文档国内可能受限，优先中文镜像。\n\n## 学习资料与网站（国内可访问镜像）\n\n- LangChain JS 中文文档（Chains/路由）：https://js.langchain.com.cn/docs/\n- LangChain 中文文档：https://langchain-doc.cn/\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n- 掘金 多 Agent 编排实战：https://juejin.cn/post/7357554457913966627\n\n## 学习建议\n\n- 先写硬路由（关键词规则）跑通结构，再换成语义路由体会「LLM 分类」的灵活性。\n- 务必加默认兜底分支（chatChain），并测一个「完全不相关」的问题验证兜底生效。\n- 把路由分发的结果（destination + reason）打印出来，观察 LLM 分类是否稳定，为 Day 43 协作模式做准备。\n\n⏰ 预计学习时长：2.5 小时",
  }
,
  {
    id: "47",
    title: "多 Agent 编排（三）：协作讨论模式",
    slug: "ai-agent-day43-multi-agent-debate",
    date: "2026-08-13",
    tags: ["AI Agent","阶段三进阶","多Agent","协作讨论","Debate","AutoGen","反思"],
    excerpt: "多 Agent 编排第三篇：协作讨论模式（Debate/Discussion）。多个 Agent 围绕同一问题互相发言、质疑、补充，迭代收敛出更优答案。覆盖为什么讨论优于单人、两类形态（Round-Robin 轮转 vs Critic 批评者）、用消息历史驱动多轮对话、收敛与终止条件、与顺序链/路由的区别、常见坑（无限循环/群体思维/成本失控/无最终裁决）。",
    readingTime: 15,
    content: "## 回顾与今天的目标\n\n- Day 41：顺序链——固定流水线，前输出即后输入。\n- Day 42：路由分发——按意图选一个专业 Agent 处理。\n- **今天（Day 43）**：协作讨论模式（Debate/Discussion）——**多个 Agent 一起聊**，互相质疑补充，迭代出更好答案。适合开放、需要多角度权衡的任务（方案评估、辩论、头脑风暴）。\n\n顺序链是「接力」，路由是「分诊」，讨论是「圆桌会议」。\n\n## 1. 为什么需要协作讨论\n\n单个 Agent 容易一条道走到黑、忽略反方视角。让多个角色（如「乐观派 / 悲观派」「支持者 / 批评者」）互辩，能：\n- **暴露盲点**：批评者专门挑刺，避免自满答案。\n- **权衡权衡**：多方观点交锋后收敛，质量常高于单人。\n- **可解释**：每轮发言留痕，决策过程透明。\n\n代价：多轮调用，**成本与延迟更高**，需设终止条件。\n\n## 2. 两类常见形态\n\n### （1）Round-Robin 轮转讨论\n多个 Agent 按固定顺序轮流发言，每轮看到前面所有人的发言：\n\n```ts\nimport { ChatOpenAI } from '@langchain/openai'\nimport { ChatPromptTemplate } from '@langchain/core/prompts'\n\nconst llm = new ChatOpenAI({ model: 'gpt-4o-mini' })\nconst agents = ['乐观分析师', '风险审查员', '最终裁决者']\n\nasync function debate(topic: string, rounds = 3) {\n  const history: string[] = [`话题：${topic}`]\n  for (let r = 0; r < rounds; r++) {\n    for (const role of agents) {\n      const prompt = ChatPromptTemplate.fromTemplate(\n        `你是{role}。以下是当前讨论记录：\\n{history}\\n请基于你的角色发表下一轮看法（简洁）：`\n      )\n      const msg = await prompt.pipe(llm).invoke({ role, history: history.join('\\n') })\n      history.push(`[${role}] ${msg.content}`)\n    }\n  }\n  return history.join('\\n')\n}\n```\n\n### （2）Critic 批评者模式（一主一辅）\n一个「生成者」给方案，一个「批评者」挑刺，生成者据反馈修订，循环直到批评者满意：\n\n```ts\nasync function criticLoop(topic: string, maxTurns = 3) {\n  let draft = await generate(topic)            // 生成者出初稿\n  for (let i = 0; i < maxTurns; i++) {\n    const review = await criticize(draft)       // 批评者挑刺\n    if (review.includes('通过')) return draft    // 终止：批评者满意\n    draft = await revise(draft, review)          // 生成者据反馈修订\n  }\n  return draft\n}\n```\n\n> AutoGen 的 `GroupChat` / `AssistantAgent` + `UserProxyAgent` 正是这套机制的开箱实现（详见资料）。\n\n## 3. 收敛与终止条件（关键！）\n\n讨论不能无限进行，必须设停止信号：\n- **轮数上限**：`rounds` / `maxTurns` 到了就停。\n- **共识信号**：某 Agent 输出「通过/达成一致」即停（Critic 模式）。\n- **质量阈值**：用评分 Agent 打分，达标即停。\n- **人工介入**：`UserProxyAgent` 可让人拍板（AutoGen）。\n\n## 4. 与顺序链 / 路由的区别\n\n| 模式 | 结构 | 适用 | 成本 |\n| --- | --- | --- | --- |\n| 顺序链（Day 41） | 线 | 流程确定 | 低 |\n| 路由（Day 42） | 分叉 | 意图单一 | 低 |\n| 协作讨论（Day 43） | 环/网 | 需多角度权衡 | 高 |\n\n> 实战常组合：路由分发到「讨论组」，讨论组内部用轮转 + 批评者收敛。\n\n## 5. 常见坑\n\n- **无限循环**：没设终止条件，Agent 永远聊下去烧钱；务必轮数/信号上限。\n- **群体思维（Groupthink）**：角色设定太相似，互舔不挑刺，讨论失去意义；让角色立场对立。\n- **成本失控**：每轮所有人全量历史重发，token 暴涨；只传必要摘要。\n- **无最终裁决**：讨论完没汇总，产出散落；最后一环设「裁决者」出结论。\n- **历史越滚越大**：轮次多后超窗口；定期压缩历史（接 Day 24 Summary Memory）。\n- **角色职责重叠**：两个 Agent 干同一件事，浪费调用；明确分工。\n- **官方站不可访问**：AutoGen 文档国内可能受限，优先 GitHub 仓库与中文镜像。\n\n## 学习资料与网站（国内可访问镜像）\n\n- AutoGen GitHub 仓库：https://github.com/microsoft/autogen\n- LangChain JS 中文文档：https://js.langchain.com.cn/docs/\n- LangChain 中文文档：https://langchain-doc.cn/\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n- 掘金 多 Agent 协作讨论实战：https://juejin.cn/post/7357554457913966627\n\n## 学习建议\n\n- 先用 Round-Robin 三角色（乐观/风险/裁决）跑一个小话题，观察每轮观点如何演化。\n- 故意不设终止条件跑一次，体会「烧钱无限循环」，再补上轮数上限，理解收敛必要性。\n- 给批评者足够强的「挑刺」system prompt，避免群体思维；为 Day 44 层级管理做铺垫。\n\n⏰ 预计学习时长：2.5 小时",
  }
,
  {
    id: "48",
    title: "AI Agent 学习计划 - Day 44：多 Agent 编排（四）层级管理模式（Supervisor）",
    slug: "ai-agent-day44-multi-agent-supervisor",
    date: "2026-08-14",
    tags: ["AI Agent","多 Agent 编排","Supervisor","AutoGen","学习计划"],
    excerpt: "层级管理模式用一个 Supervisor（主管）Agent 把复杂任务拆解成子任务、分派给专业子 Agent 并汇总结果，是多 Agent 编排从「线/分叉/环网」走向「树状指挥中心」的关键一跃。",
    readingTime: 12,
    content: "# Day 44：多 Agent 编排（四）— 层级管理模式（Supervisor）\n\n## 一、为什么需要层级管理（Supervisor）\n\n前三天我们看过三种拓扑：\n\n- **Day 41 顺序链**：线性流水线，前输出即后输入，但流程写死。\n- **Day 42 路由分发**：Router 按意图把请求**一次性**交给某个专业 Agent，彼此不协作。\n- **Day 43 协作讨论**：多个 Agent **平等**轮流发言、互相修订，但没人拍板、成本难控。\n\n当任务足够复杂（如「写一篇竞品分析报告」「开发一个功能模块」），会出现三类问题：\n\n1. **子任务之间有先后依赖**：先调研才能写、先写才能审，单靠路由的「一次性分发」搞不定。\n2. **需要统一指挥**：讨论模式无人裁决，顺序链无人拆分，复杂任务必须有个「总指挥」负责规划 + 分派 + 收口。\n3. **子 Agent 需要被复用与并行**：不同子任务可能交给不同专家，甚至并行跑。\n\n**Supervisor（主管）模式**就是答案：一个中心 Agent 充当「项目经理」，负责把大任务拆成子任务、派给专业子 Agent、收集结果、决定下一步或收工。\n\n> 心智模型：顺序链是「流水线」，路由是「前台分流」，讨论是「圆桌会议」，Supervisor 是「作战指挥中心」——树状、有层级、有决策权。\n\n## 二、Supervisor 的核心结构\n\n```\n            ┌─────────────────┐\n            │   Supervisor     │  ← 规划 / 分派 / 汇总 / 终止\n            └─────────────────┘\n              │     │     │\n        ┌─────┘     │     └─────┐\n        ▼           ▼           ▼\n   ┌─────────┐ ┌─────────┐ ┌─────────┐\n   │ Researcher│ │ Writer  │ │ Reviewer │  ← 专业子 Agent（可并行）\n   └─────────┘ └─────────┘ └─────────┘\n```\n\nSupervisor 自身也是一个 LLM Agent，关键能力：\n\n- **任务分解（Plan）**：把目标拆成有序子任务列表。\n- **分派（Delegate）**：根据子任务类型选对应子 Agent（可并行派发）。\n- **汇总（Aggregate）**：收集各子 Agent 的返回，拼成中间状态。\n- **状态决策（Route/Stop）**：根据当前进度决定「继续派下一个子任务」还是「任务完成收工」。\n\n## 三、AutoGen 实现层级管理（推荐）\n\nAutoGen 的 `GroupChat` + `GroupChatManager` 天然就是 Supervisor 模式：Manager 充当主管，按 `speaker_selection_method` 决定下一个发言的 Agent。\n\n```ts\nimport { AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager, LLMConfig } from \"autogen\";\n\nconst llm: LLMConfig = { model: \"gpt-4o\", apiKey: process.env.OPENAI_API_KEY! };\n\n// 三个专业子 Agent\nconst researcher = new AssistantAgent(\"researcher\", {\n  llm,\n  systemMessage: \"你负责检索与调研，输出结构化的事实要点，不要写结论。\",\n});\nconst writer = new AssistantAgent(\"writer\", {\n  llm,\n  systemMessage: \"你根据 researcher 的事实要点撰写报告正文，语言精炼。\",\n});\nconst reviewer = new AssistantAgent(\"reviewer\", {\n  llm,\n  systemMessage: \"你审校 writer 的草稿，指出事实错误与逻辑漏洞，给出修改建议。\",\n});\n\n// 主管：GroupChatManager 自动按上下文挑选下一个发言者\nconst groupChat = new GroupChat({\n  agents: [researcher, writer, reviewer],\n  messages: [],\n  max_round: 8,                 // 终止条件：轮数上限，防止死循环\n  speaker_selection_method: \"auto\", // auto=由 LLM 选下一个发言者（即 Supervisor 决策）\n});\n\nconst manager = new GroupChatManager(\"manager\", llm, groupChat);\n\nconst user = new UserProxyAgent(\"user\", {\n  humanInputMode: \"NEVER\", // 自动化场景无需人工干预\n  codeExecutionConfig: false,\n});\n\n// 启动：把任务交给 manager，由它主导编排\nawait user.initiate_chat(manager, { message: \"请调研并撰写一篇『2026 多 Agent 框架对比』报告。\" });\n```\n\n要点：\n\n- `GroupChatManager` 就是 Supervisor，它读全部历史、决定下一步谁说话。\n- `max_round` 是**硬性终止条件**，避免讨论模式（Day 43）的无限循环问题。\n- `speaker_selection_method: \"auto\"` 让 LLM 自主管选择下一个 Agent，等价于「动态分派」；也可设 `\"round_robin\"` 强制轮转，或 `\"manual\"` 人工指定。\n\n## 四、LangChain.js 手搓 Supervisor（可控性更强）\n\n如果不想引入 AutoGen，可用 LCEL + 一个「路由决策」Supervisor 链自己编排：\n\n```ts\nimport { ChatOpenAI } from \"@langchain/openai\";\nimport { PromptTemplate } from \"@langchain/core/prompts\";\nimport { RunnableSequence } from \"@langchain/core/runnables\";\nimport { JsonOutputParser } from \"@langchain/core/output_parsers\";\n\nconst model = new ChatOpenAI({ model: \"gpt-4o\" });\n\n// 子 Agent（复用前几天的链）\nconst researchChain = PromptTemplate.fromTemplate(\"调研主题：{task}\\n输出要点：\")\n  .pipe(model).pipe((m) => m.content as string);\nconst writeChain = PromptTemplate.fromTemplate(\"根据要点写报告：\\n{context}\")\n  .pipe(model).pipe((m) => m.content as string);\n\n// Supervisor 决策链：返回下一个要执行的 agent 名\nconst supervisorChain = RunnableSequence.from([\n  PromptTemplate.fromTemplate(\n    `当前任务：{goal}\\n已完成子任务与结果：\\n{history}\\n` +\n    `可选子 Agent：research / write / finish\\n` +\n    `只返回 JSON：{{\"next\":\"research|write|finish\",\"reason\":\"...\"}}`\n  ),\n  model,\n  new JsonOutputParser(),\n]);\n\n// 编排循环\nasync function runSupervisor(goal: string) {\n  let history = \"\";\n  for (let i = 0; i < 6; i++) {\n    const { next } = await supervisorChain.invoke({ goal, history });\n    if (next === \"finish\") break;\n    if (next === \"research\") {\n      const r = await researchChain.invoke({ task: goal });\n      history += `\\n[research] ${r}\\n`;\n    } else if (next === \"write\") {\n      const w = await writeChain.invoke({ context: history });\n      history += `\\n[write] ${w}\\n`;\n    }\n  }\n  return history;\n}\n```\n\n这种方式把「Supervisor 决策」显式抽成一条链，比 GroupChat 更可控、更易加日志和成本护栏。\n\n## 五、四种拓扑选型对比\n\n| 模式 | 拓扑 | 决策权 | 适用场景 | 风险 |\n|------|------|--------|----------|------|\n| 顺序链 (Day 41) | 线 | 无（写死） | 固定流水线 | 流程僵化 |\n| 路由 (Day 42) | 分叉 | Router 一次性 | 意图分明、单专家 | 子 Agent 不协作 |\n| 讨论 (Day 43) | 环网 | 无（平等） | 多视角权衡 | 无裁决、成本高 |\n| **Supervisor (Day 44)** | **树状** | **主管拍板** | **复杂依赖任务** | **主管规划失误** |\n\n## 六、常见坑\n\n- **主管规划失误**：Supervisor 把任务拆错，后面全错。→ 给 Supervisor 明确的「子 Agent 能力清单」和拆解示例。\n- **无限循环**：子 Agent 反复派发同一任务。→ 必须有 `max_round` / 最大迭代硬上限。\n- **上下文膨胀**：每轮子 Agent 结果都回灌给 Supervisor，历史爆炸。→ 让子 Agent 只回传**摘要**，Supervisor 维护精简状态。\n- **成本失控**：Supervisor 多一次 LLM 决策调用。→ 简单任务别上 Supervisor，路由/顺序链更省。\n- **串行拖慢**：子任务本可并行却被 Supervisor 串行派发。→ 识别无依赖子任务，并行 `Promise.all`。\n- **官方站不可访问**：`sdk.vercel.ai` / `js.langchain.com` 在部分网络受限，本文档均用国内镜像替代。\n\n## 七、学习建议\n\n1. 今天先用 AutoGen `GroupChat` 跑通一个小 demo（三个角色：调研/写作/审校），感受 Manager 如何自动选下一个发言者。\n2. 再用手搓版 Supervisor 链，理解「决策」与「执行」分离的本质。\n3. 重点体会：**Supervisor 不是又一个 Agent，而是「元控制层」**——它自己不干活，只负责规划、分派、收口。\n4. 思考题：如果子任务彼此强依赖（A 输出是 B 输入），Supervisor 应串行派发；若独立，应并行。如何在决策链里表达这种依赖？\n\n## 八、国内可访问学习资料\n\n- AutoGen GitHub 仓库：https://github.com/microsoft/autogen ✅\n- AutoGen 中文文档（社区）：https://autogen-agentchat.readthedocs.io/ ✅\n- LangChain JS 中文文档：https://js.langchain.com.cn/docs/ ✅\n- LangChain 中文文档：https://langchain-doc.cn/ ✅\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅\n- 掘金 多 Agent 编排实战（Supervisor 模式）：https://juejin.cn/post/7357554457913966627 ✅",
  }
,
  {
    id: "49",
    title: "AI Agent 学习计划 - Day 45：多 Agent 编排实践（综合 demo）",
    slug: "ai-agent-day45-multi-agent-orchestration-practice",
    date: "2026-08-15",
    tags: ["AI Agent","多 Agent 编排","Supervisor","LangChain","学习计划"],
    excerpt: "把 Day 41-44 的顺序链、路由、讨论、Supervisor 四种拓扑落地成一个可运行的多 Agent 编排 demo：调研 Agent 检索事实、写作 Agent 生成报告、审校 Agent 把关质量，由 Supervisor 统一调度。",
    readingTime: 13,
    content: "# Day 45：多 Agent 编排实践（综合 demo）\n\n## 一、今日目标\n\n前四天我们分别学了四种多 Agent 拓扑：\n\n- **Day 41 顺序链**：线性流水线\n- **Day 42 路由分发**：按意图一次性分发\n- **Day 43 协作讨论**：多 Agent 平等轮流修订\n- **Day 44 层级管理（Supervisor）**：主管规划 + 分派 + 收口\n\n今天把它们**组合落地**成一个真实可运行的多 Agent 编排 demo，体会「什么时候用哪种拓扑」。\n\n## 二、Demo 设计：智能研究报告助手\n\n我们把四种模式串进一个系统：\n\n```\n用户问题\n   │\n   ▼\n[Router Agent]  ── 意图路由（Day 42）\n   ├─ 闲聊 → Chat Agent（直接回答）\n   └─ 研究类 → 进入 Supervisor 流水线（Day 44）\n                    │\n          ┌─────────┼─────────┐\n          ▼         ▼         ▼\n   [Researcher] [Writer]  [Reviewer]\n   检索事实(复用    撰写报告    审校把关\n    Day39 RAG)    (顺序链)    (讨论式修订)\n          └─────────┴─────────┘\n                    │\n                汇总输出\n```\n\n要点：\n\n- **路由**在最外层做「要不要进研究流水线」的判断（省成本）。\n- **Supervisor** 在研究流水线内做规划与分派。\n- **Researcher → Writer** 是顺序链（Day 41），前输出即后输入。\n- **Reviewer** 与 Writer 之间可用讨论模式（Day 43）迭代修订，直到质量达标或达轮数上限。\n\n## 三、LangChain.js 实现骨架\n\n```ts\nimport { ChatOpenAI } from \"@langchain/openai\";\nimport { PromptTemplate } from \"@langchain/core/prompts\";\nimport { RunnableSequence, RunnableBranch } from \"@langchain/core/runnables\";\nimport { JsonOutputParser } from \"@langchain/core/output_parsers\";\n\nconst model = new ChatOpenAI({ model: \"gpt-4o\" });\n\n// 1) Router（Day 42 语义路由）\nconst router = RunnableSequence.from([\n  PromptTemplate.fromTemplate(\n    `问题：{question}\\n只返回 JSON：{{\"type\":\"chat|research\"}}`\n  ),\n  model,\n  new JsonOutputParser(),\n]);\n\n// 2) Researcher（复用 Day 39 的 RAG 检索链）\nconst researchChain = PromptTemplate.fromTemplate(\n  \"你是基于证据的调研员。问题：{question}\\n请输出 3-5 条结构化事实要点，不要写结论。\"\n).pipe(model).pipe((m) => m.content as string);\n\n// 3) Writer（顺序链，消费 research 输出）\nconst writeChain = PromptTemplate.fromTemplate(\n  \"根据以下事实撰写报告正文：\\n{facts}\"\n).pipe(model).pipe((m) => m.content as string);\n\n// 4) Reviewer（讨论式修订，最多 2 轮）\nconst reviewChain = PromptTemplate.fromTemplate(\n  \"审校报告，指出事实错误与逻辑漏洞，给出修改建议：\\n{report}\"\n).pipe(model).pipe((m) => m.content as string);\n\n// 5) Supervisor 调度（Day 44）\nasync function supervisor(question: string) {\n  const facts = await researchChain.invoke({ question });      // 顺序：先调研\n  let report = await writeChain.invoke({ facts });             // 再写\n  for (let i = 0; i < 2; i++) {                                // 讨论：审校迭代\n    const feedback = await reviewChain.invoke({ report });\n    if (feedback.includes(\"无需修改\")) break;\n    report = await writeChain.invoke({ facts: facts + \"\\n审校意见：\" + feedback });\n  }\n  return report;\n}\n\n// 6) 入口（RunnableBranch 路由）\nconst chatChain = PromptTemplate.fromTemplate(\"友好回答：{question}\")\n  .pipe(model).pipe((m) => m.content as string);\n\nconst app = RunnableBranch.from([\n  {\n    // condition 同步调 router，true 走 research 分支\n    condition: async (input: { question: string }) =>\n      (await router.invoke(input)).type === \"research\",\n    chain: RunnableSequence.from([\n      (input: { question: string }) => input.question,\n      supervisor,\n    ]),\n  },\n  chatChain,\n]);\n\nconst result = await app.invoke({ question: \"对比 2026 年主流多 Agent 框架\" });\nconsole.log(result);\n```\n\n> 说明：`RunnableBranch` 的 `condition` 异步调用 router 决定走研究流水线还是闲聊分支；研究流水线内由 `supervisor` 函数编排调研→写作→审校。\n\n## 四、关键设计决策\n\n| 决策点 | 选择 | 理由 |\n|--------|------|------|\n| 外层分流 | Router（Day 42） | 闲聊不进重链路，省成本 |\n| 调研→写作 | 顺序链（Day 41） | 强依赖，前输出即后输入 |\n| 质量把关 | 讨论式修订（Day 43） | 用 Reviewer 迭代而非一次定稿 |\n| 整体调度 | Supervisor（Day 44） | 统一规划、分派、收口 |\n\n## 五、今天要沉淀的「可运行 demo」\n\n建议把上面的骨架补全成一个最小可跑项目：\n\n1. 配置 `OPENAI_API_KEY`（或兼容 endpoint）。\n2. `.env` + `tsx` 直接跑 `tsx demo.ts`。\n3. 用至少 2 个真实问题测试：`闲聊问题` 和 `研究类问题`，验证路由正确。\n4. 给研究流水线加 `console.log` 观察 Supervisor 每一步的分派。\n\n## 六、常见坑\n\n- **路由 condition 同步问题**：`RunnableBranch` 的 condition 必须返回 boolean，`router` 是异步的，记得 `await`。\n- **研究流水线无终止**：讨论式修订必须设轮数上限，否则 Reviewer 永远挑刺。\n- **上下文膨胀**：每轮把 facts + 反馈都喂给 Writer，历史会爆炸 → 只回传摘要。\n- **路由标签漂移**：让 router 只输出固定枚举（`chat|research`），别让它自由发挥。\n- **Supervisor 规划失误**：给 Supervisor 明确的子 Agent 能力清单。\n- **官方站不可访问**：`js.langchain.com` / `sdk.vercel.ai` 受限，本文档均用国内镜像替代。\n\n## 七、学习建议\n\n1. 先跑通上面的骨架（哪怕 Researcher 不接真实 RAG，先用假事实），重点是**感受四种拓扑如何组合**。\n2. 再逐步把 Researcher 换成 Day 39 的真实 RAG 检索链，体会「编排框架」与「能力组件」解耦。\n3. 思考题：如果要支持「并行调研多个子主题」，Supervisor 应如何改造（提示：`Promise.all`）？\n\n## 八、国内可访问学习资料\n\n- LangChain.js Templates：https://github.com/langchain-ai/langchainjs-templates ✅\n- LangChain JS 中文文档：https://js.langchain.com.cn/docs/ ✅\n- LangChain 中文文档：https://langchain-doc.cn/ ✅\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅\n- 掘金 多 Agent 编排实战：https://juejin.cn/post/7357554457913966627 ✅",
  }
,
  {
    id: "50",
    title: "AI Agent 学习计划 - Day 46：工具集成（一）搜索工具（Tavily / SerpAPI / Bing Search）",
    slug: "ai-agent-day46-tool-integration-search",
    date: "2026-08-16",
    tags: ["AI Agent","工具集成","搜索工具","Tavily","SerpAPI","学习计划"],
    excerpt: "Agent 不能只靠训练知识，实时联网检索是突破知识截止日期的关键。今天对比 Tavily（AI 原生）、SerpAPI（搜索引擎结果）、Bing Search 三类搜索工具，并用 LangChain / Vercel AI SDK 接入。",
    readingTime: 12,
    content: "# Day 46：工具集成（一）— 搜索工具（Tavily / SerpAPI / Bing Search）\n\n## 一、为什么 Agent 需要搜索工具\n\nLLM 的知识有**截止日期**（knowledge cutoff），且无法获取实时信息（股价、天气、最新新闻）。给 Agent 接上搜索工具，等于给它装了「实时眼睛」：\n\n- 突破知识截止：查最新文档、API 版本、新闻事件\n- 获取私域/实时数据：配合后面 Day 48 的数据库工具\n- 事实核查：让回答基于检索结果而非记忆（减少幻觉，呼应 Day 36-40 的 RAG）\n\n> 搜索工具 vs RAG：RAG 是查**你自己的知识库**（Day 36-40），搜索工具是查**公网实时信息**，两者常组合使用。\n\n## 二、三类搜索工具对比\n\n| 工具 | 定位 | 返回形式 | 适合场景 | 国内可访问 |\n|------|------|----------|----------|-----------|\n| **Tavily** | AI 原生搜索，专为 Agent 设计 | 已清洗的上下文片段 + 来源 URL | Agent 问答、RAG 补充 | 需 API Key（海外服务） |\n| **SerpAPI** | 封装 Google/Bing 搜索结果 | 原始搜索结果 JSON（有机结果/知识图谱） | 需要完整 SERP 结构 | 需 API Key（海外服务） |\n| **Bing Search** | 微软 Bing Web Search API | Web 结果 + 新闻 + 图片 | Azure 生态、企业合规 | 需 Azure Key（海外服务） |\n\n**Tavily 最推荐入门**：专为 LLM 优化，返回 `__args` 已是适合塞进 Prompt 的摘要，省去清洗。\n\n## 三、Tavily 接入（LangChain.js）\n\nLangChain 内置 `@langchain/community` 的 TavilySearch 工具：\n\n```ts\nimport { TavilySearchResults } from \"@langchain/community/tools/tavily_search\";\nimport { ChatOpenAI } from \"@langchain/openai\";\nimport { createToolCallingAgent, AgentExecutor } from \"langchain/agents\";\nimport { ChatPromptTemplate } from \"@langchain/core/prompts\";\n\nconst search = new TavilySearchResults({ apiKey: process.env.TAVILY_API_KEY });\n// 也可限定参数：{ apiKey, maxResults: 3, includeAnswer: true }\n\nconst model = new ChatOpenAI({ model: \"gpt-4o\" });\nconst prompt = ChatPromptTemplate.fromMessages([\n  [\"system\", \"你是一个严谨的助手，回答必须基于搜索结果并附来源。\"],\n  [\"human\", \"{input}\"],\n  [\"placeholder\", \"{agent_scratchpad}\"],\n]);\n\nconst agent = createToolCallingAgent({ llm: model, tools: [search], prompt });\nconst executor = new AgentExecutor({ agent, tools: [search], maxIterations: 3 });\n\nconst res = await executor.invoke({ input: \"2026 年主流多 Agent 框架有哪些新进展？\" });\nconsole.log(res.output);\n```\n\n## 四、Tavily 原生 HTTP 调用（不依赖框架，可移植）\n\n```ts\nasync function tavilySearch(query: string) {\n  const r = await fetch(\"https://api.tavily.com/search\", {\n    method: \"POST\",\n    headers: { \"Content-Type\": \"application/json\" },\n    body: JSON.stringify({\n      api_key: process.env.TAVILY_API_KEY,\n      query,\n      max_results: 3,\n      include_answer: true,\n      search_depth: \"advanced\",\n    }),\n  });\n  const data = await r.json();\n  // data.results: [{title, url, content}], data.answer: 摘要\n  return data.results.map((x: any) => `[${x.title}](${x.url}): ${x.content}`).join(\"\\n\");\n}\n```\n\n## 五、Vercel AI SDK 接入（tool() 定义）\n\n```ts\nimport { generateText } from \"ai\";\nimport { openai } from \"@ai-sdk/openai\";\nimport { tool } from \"ai\";\nimport { z } from \"zod\";\n\nconst webSearch = tool({\n  description: \"搜索公网实时信息，用于回答需要最新资料的问题\",\n  parameters: z.object({ query: z.string().describe(\"搜索关键词\") }),\n  execute: async ({ query }) => {\n    const r = await fetch(\"https://api.tavily.com/search\", {\n      method: \"POST\",\n      headers: { \"Content-Type\": \"application/json\" },\n      body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, max_results: 3 }),\n    });\n    return (await r.json()).results;\n  },\n});\n\nconst { text } = await generateText({\n  model: openai(\"gpt-4o\"),\n  tools: { webSearch },\n  maxSteps: 3,\n  prompt: \"2026 年 AI Agent 框架有哪些新进展？\",\n});\n```\n\n## 六、搜索工具与 RAG / 多 Agent 的组合\n\n- **搜索 + RAG**：先用搜索拉公网最新资料，再和本地知识库一起做 RAG（Day 36-40），兼顾「实时」与「私域」。\n- **搜索 + Supervisor（Day 44）**：把搜索 Agent 作为 Supervisor 手下的一个专业子 Agent，与 Researcher/RAG 并列。\n- **查询改写（Day 40 Query Transform）**：搜索前对用户问题做 Multi-Query 扩展，提升召回。\n\n## 七、常见坑\n\n- **API Key 是海外服务**：Tavily / SerpAPI / Bing 均需在海外可访问环境调用，国内直连可能超时 → 注意网络与代理配置。\n- **结果未清洗直接塞 Prompt**：SerpAPI 原始结果噪声大，要筛选 `snippet`/`title` 而非整页 HTML。\n- **来源丢失无法溯源**：务必把 `url` 一起回传，参考 Day 63 的引用溯源设计。\n- **过度搜索**：每个问题都搜索会推高延迟和成本 → 让 Agent 先判断是否「真需要实时信息」。\n- **搜索结果当事实**：搜索结果也可能有误，关键结论应交叉验证。\n- **官方站不可访问**：`docs.tavily.com` 等文档可能受限，建议同时看社区中文教程。\n\n## 八、学习建议\n\n1. 注册 Tavily 免费 Key，用「原生 HTTP 调用」版本先跑通，理解返回结构。\n2. 再接 LangChain `TavilySearchResults` 或 Vercel `tool()`，体会框架封装差异。\n3. 思考题：如何让 Agent 在「本地知识库有答案」时优先用 RAG、「本地没有」才搜索？（提示：结合 Day 42 路由思路）\n\n## 九、国内可访问学习资料\n\n- Tavily 官方文档：https://docs.tavily.com/ ✅（需海外网络）\n- SerpAPI 文档：https://serpapi.com/search-api ✅\n- Bing Web Search API（微软）：https://learn.microsoft.com/zh-cn/bing/search-apis/bing-web-search/ ✅（中文）\n- LangChain JS 中文文档（Tools）：https://js.langchain.com.cn/docs/ ✅\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅\n- 掘金 Agent 联网搜索实战：https://juejin.cn/post/7357554457913966627 ✅",
  }
,
  {
    id: "51",
    title: "AI Agent 学习计划 - Day 47：工具集成（二）代码执行工具（Node.js VM / Docker 沙箱）",
    slug: "ai-agent-day47-tool-integration-code-execution",
    date: "2026-08-17",
    tags: ["AI Agent","工具集成","代码执行","Node.js VM","Docker 沙箱","学习计划"],
    excerpt: "让 Agent 真正「动手算」——代码执行工具把 LLM 从纯文本推理升级为能跑程序、算数据、验证结果。今天对比 Node.js vm 轻量沙箱与 Docker 强隔离方案，并给出安全护栏。",
    readingTime: 13,
    content: "# Day 47：工具集成（二）— 代码执行工具（Node.js VM / Docker 沙箱）\n\n## 一、为什么 Agent 需要代码执行\n\nLLM 做数学/数据分析容易算错，而让 Agent **生成代码并运行**，能把「推理」变成「可验证的计算」：\n\n- 精确计算：复利、统计、图表数据处理，比纯文本靠谱\n- 数据探索：读 CSV/JSON、跑 pandas 式分析（Node 侧用 lodash/sql.js 等）\n- 自我验证：代码跑通即证明逻辑成立，呼应 Day 12 Function Calling 的「执行-回灌」闭环\n- 这是 OpenAI Code Interpreter、多 Agent 编程助手（Day 71-75）的核心能力\n\n> 搜索工具（Day 46）让 Agent「看世界」，代码执行让 Agent「动手做」。\n\n## 二、两条安全路线对比\n\n| 方案 | 隔离强度 | 启动速度 | 复杂度 | 适用 |\n|------|----------|----------|--------|------|\n| **Node.js `vm`** | 弱（同进程沙箱） | 极快（毫秒） | 低 | 本地原型、可信代码、轻量计算 |\n| **Docker 容器** | 强（OS 级隔离） | 慢（秒级） | 高 | 执行不可信代码、生产环境 |\n\n**核心原则**：代码执行 = 让 LLM 生成任意代码运行，**必须隔离 + 限制 + 超时**，否则等于把服务器root 交给模型。\n\n## 三、Node.js `vm` 轻量沙箱\n\n```ts\nimport vm from \"node:vm\";\nimport { tool } from \"ai\";\nimport { z } from \"zod\";\n\nconst codeExec = tool({\n  description: \"执行 JavaScript 代码做计算或数据处理，返回最后表达式的值\",\n  parameters: z.object({ code: z.string().describe(\"要执行的 JS 代码\") }),\n  execute: async ({ code }) => {\n    const sandbox = {\n      console,\n      Math,\n      JSON,\n      // 故意不放 fetch/fs/process，限制能力面\n    };\n    const context = vm.createContext(sandbox);\n    try {\n      const result = vm.runInContext(code, context, { timeout: 3000 });\n      return { ok: true, result: String(result) };\n    } catch (e: any) {\n      return { ok: false, error: e.message };\n    }\n  },\n});\n\n// 用法：生成并返回 \"JSON.stringify([1,2,3].map(x=>x*x))\"\n```\n\n要点：\n\n- `vm.createContext` 创建隔离上下文，**只注入需要的全局对象**，绝不放 `require`/`process`/`fs`/`fetch`。\n- `timeout` 防死循环（配合 Day 6 Event Loop 理解：vm 同步执行会阻塞，超时需要 `vm` 自身或外部 `Promise.race` 兜底）。\n- 返回值要可序列化，方便回灌给 LLM（Day 12 的 role:tool 模式）。\n\n## 四、Docker 强隔离（执行不可信代码）\n\n```ts\nimport { execFile } from \"node:child_process\";\nimport { promisify } from \"node:util\";\nconst exec = promisify(execFile);\n\nasync function runInDocker(code: string) {\n  // 把代码写入临时文件，挂进只读容器，限制资源\n  const cmd = [\n    \"docker\", \"run\", \"--rm\",\n    \"--network\", \"none\",        // 禁网络\n    \"--memory\", \"128m\",          // 内存上限\n    \"--cpus\", \"0.5\",             // CPU 上限\n    \"-v\", \"/tmp/code:/app:ro\",   // 只读挂载\n    \"node:20-alpine\",\n    \"node\", \"/app/run.js\",\n  ];\n  const { stdout, stderr } = await exec(cmd[0], cmd.slice(1), { timeout: 10000 });\n  return { stdout, stderr };\n}\n```\n\n要点：\n\n- `--network none` 断网、`--memory/--cpus` 限资源、`--rm` 用完即焚，避免残留。\n- 镜像应最小化（alpine），且不预装敏感 CLI。\n- 把用户/模型代码写临时文件再挂入，避免命令注入。\n\n## 五、接入 Agent（Vercel AI SDK）\n\n```ts\nimport { generateText } from \"ai\";\nimport { openai } from \"@ai-sdk/openai\";\n\nconst { text } = await generateText({\n  model: openai(\"gpt-4o\"),\n  tools: { codeExec },        // 上边的 vm 版或 Docker 版\n  maxSteps: 4,\n  prompt: \"计算 2020-2026 年每年复合增长率 8% 的终值，并给出逐年列表（用代码算）。\",\n});\n```\n\n## 六、安全护栏清单（必读）\n\n1. **最小能力面**：沙箱只暴露计算所需 API，不放文件/网络/进程。\n2. **资源限制**：CPU/内存/超时三件套，防 OOM 与死循环。\n3. **输入输出白名单**：对返回结果做长度截断，防超大输出撑爆上下文。\n4. **禁网/只读**：尤其执行不可信代码时断网、只读文件系统。\n5. **审计日志**：记录每次执行的代码与结果，便于复盘与追责。\n6. **人工确认**：生产环境对「有副作用」的代码（写文件/发请求）加人工审批。\n\n## 七、常见坑\n\n- **vm 不是真隔离**：同进程、可逃逸（如通过 `this`/constructor 拿到 `process`）→ 不可信代码必须 Docker。\n- **忘记超时**：死循环 `while(true)` 在 vm 同步执行时会卡死进程 → 设 `timeout` + 外部 `Promise.race` 兜底。\n- **注入全局**：往 sandbox 误放 `require`/`global` 导致越权。\n- **返回不可序列化**：函数/循环引用无法回灌 LLM → 统一 `String()` 化。\n- **Docker 镜像过大**：冷启动慢 → 用 alpine + 预热。\n- **官方站不可访问**：`nodejs.org/api/vm.html` 等文档可能受限，用 nodejs.cn 中文镜像。\n\n## 八、学习建议\n\n1. 用 `vm` 版先跑通一个「算复利」的 Agent demo，感受代码执行闭环。\n2. 再思考：哪些场景必须升级到 Docker？写下你的安全护栏清单。\n3. 思考题：如何让 Agent 自己判断「该搜索（Day 46）还是该写代码算」？（提示：Day 42 路由 + 工具描述）\n\n## 九、国内可访问学习资料\n\n- Node.js 中文网 VM 文档：http://nodejs.cn/api/vm.html ✅\n- Node.js 中文网 child_process（Docker 调用）：http://nodejs.cn/api/child_process.html ✅\n- Docker 中文文档：https://www.docker.org.cn/ ✅\n- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅\n- 掘金 Agent 代码执行沙箱实践：https://juejin.cn/post/7357554457913966627 ✅",
  }
,
  {
    id: "52",
    title: "AI Agent 学习计划 - Day 48：工具集成（三）数据库与文件操作工具",
    slug: "ai-agent-day48-tool-integration-db-files",
    date: "2026-08-18",
    tags: ["AI Agent","工具集成","数据库","文件操作","Prisma","学习计划"],
    excerpt: "让 Agent 真正「读写世界」——数据库查询与文件操作工具把 LLM 从对话玩具变成能落地业务系统的生产力。今天覆盖 SQL 查询、API 调用封装、文件读写解析，以及用 Prisma 安全访问数据库。",
    readingTime: 13,
    content: "# Day 48：工具集成（三）— 数据库与文件操作工具\n\n## 一、为什么 Agent 需要数据库与文件操作\n\n搜索工具（Day 46）让 Agent「看世界」，代码执行（Day 47）让 Agent「动手算」，而**数据库与文件操作**让 Agent 能**持久化读写业务数据**：\n\n- 业务系统真实价值都在数据库里（订单、用户、日志），Agent 必须能查\n- 文件是最通用的数据载体（CSV/Excel/PDF/日志），Agent 要能读会写\n- 这是企业级 Agent（如数据分析助手、运维助手）落地的必备能力\n- 与前面工具组合：搜索拿外部情报 → 代码算结果 → 数据库存结论 → 文件导出报表\n\n> 工具集的「三角」：看世界（搜索）+ 动手算（代码）+ 读写存（DB/文件）。\n\n## 二、数据库查询工具\n\n### 2.1 直接用 SQL（最灵活，但需防注入）\n\n```ts\nimport { tool } from 'ai'\nimport { z } from 'zod'\nimport { Pool } from 'pg'\n\nconst pool = new Pool({ connectionString: process.env.DATABASE_URL })\n\nconst queryDb = tool({\n  description: '对业务数据库执行只读 SQL 查询（SELECT），返回 JSON 结果',\n  parameters: z.object({\n    sql: z.string().describe('一条只读 SELECT 语句'),\n  }),\n  execute: async ({ sql }) => {\n    // 安全护栏：强制只读\n    if (!/^\\s*select/i.test(sql)) throw new Error('仅允许 SELECT 查询')\n    const { rows } = await pool.query(sql)\n    return rows\n  },\n})\n```\n\n### 2.2 用 Prisma（类型安全，推荐生产）\n\nPrisma 把数据库表映射成 TypeScript 类型，避免手写 SQL 拼接：\n\n```ts\nimport { PrismaClient } from '@prisma/client'\nconst prisma = new PrismaClient()\n\nconst getOrders = tool({\n  description: '按用户 ID 查询最近订单',\n  parameters: z.object({\n    userId: z.string(),\n    limit: z.number().default(10),\n  }),\n  execute: async ({ userId, limit }) =>\n    prisma.order.findMany({\n      where: { userId },\n      orderBy: { createdAt: 'desc' },\n      take: limit,\n    }),\n})\n```\n\n- 优点：类型提示、自动防注入、迁移管理、多数据库适配（Postgres/MySQL/SQLite）\n- 文档：https://www.prisma.io/docs ✅\n\n## 三、文件操作工具\n\n### 3.1 读文件（文本 / CSV / JSON 解析）\n\n```ts\nimport { readFile, writeFile } from 'node:fs/promises'\nimport { parse } from 'csv-parse/sync' // CSV 解析\n\nconst readCsv = tool({\n  description: '读取项目内 CSV 文件并解析为对象数组',\n  parameters: z.object({ path: z.string() }),\n  execute: async ({ path }) => {\n    const text = await readFile(path, 'utf8')\n    return parse(text, { columns: true, skip_empty_lines: true })\n  },\n})\n```\n\n### 3.2 写文件（导出报表 / 生成配置）\n\n```ts\nconst writeReport = tool({\n  description: '把分析结果写入 Markdown 报告文件',\n  parameters: z.object({\n    path: z.string(),\n    content: z.string(),\n  }),\n  execute: async ({ path, content }) => {\n    await writeFile(path, content, 'utf8')\n    return { ok: true, path }\n  },\n})\n```\n\n## 四、与 RAG / 多 Agent 组合\n\n- **RAG 补数据**：文件读取可作为 Day 36-39 RAG 的 Loader 来源（PDFLoader/CSVLoader）\n- **多 Agent 落地**：Researcher Agent 查库 → Writer Agent 写文件 → Reviewer 校验（呼应 Day 45）\n- **API 调用封装**：把第三方 REST 接口封成 tool（为 Day 49 外部 API 做铺垫）\n\n## 五、常见坑\n\n| 坑 | 后果 | 规避 |\n|----|------|------|\n| 直接拼接用户输入进 SQL | SQL 注入 | 用参数化查询 / Prisma |\n| 工具拿到写权限（INSERT/DELETE） | 误删数据 | 默认只读，写操作加人工确认 |\n| 读超大文件进上下文 | 爆 token | 流式/分页/只取头部 |\n| 文件路径未做白名单 | 越权读 `/etc/passwd` | 限制根目录 + 路径校验 |\n| 写文件覆盖原文件 | 数据丢失 | 写新文件名 + 备份 |\n| 官方站不可访问 | 卡文档 | 用国内镜像 prisma.nodejs.cn |\n\n## 六、今日实践任务\n\n1. 用 Prisma 连接一个 SQLite 库，封装 2 个查询 tool\n2. 写一个读 CSV → 用代码（Day 47）算汇总 → 写 Markdown 报告 的端到端链\n3. 给数据库 tool 加「只读 + 人工确认写」护栏，写进 README\n\n🔗 学习资料（国内可访问镜像）：\n- Prisma 官方文档：https://www.prisma.io/docs ✅\n- Prisma 中文社区：https://prisma.nodejs.cn/ ✅\n- LangChain JS 中文：https://js.langchain.com.cn/docs/ ✅\n- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅",
  }
,
  {
    id: "53",
    title: "AI Agent 学习计划 - Day 49：工具集成（四）外部 API 与 Webhook",
    slug: "ai-agent-day49-tool-integration-api-webhook",
    date: "2026-08-19",
    tags: ["AI Agent","工具集成","外部 API","Webhook","Vercel AI SDK","学习计划"],
    excerpt: "让 Agent 连接整个互联网服务——外部 API 与 Webhook 工具把 LLM 接入真实业务系统（发消息、建工单、触发流水线）。今天覆盖 HTTP 请求封装、Webhook 入站触发、重试与鉴权安全。",
    readingTime: 12,
    content: "# Day 49：工具集成（四）— 外部 API 与 Webhook\n\n## 一、为什么 Agent 需要外部 API 与 Webhook\n\n数据库/文件（Day 48）只是「自己家」的数据，而**外部 API**让 Agent 能调用SaaS 生态（Slack、GitHub、飞书、支付、地图）：\n\n- 执行动作：发通知、建任务、触发部署、查快递 —— 把「说过」变成「做过」\n- Webhook 是反向通道：外部系统事件（如 GitHub Push、支付回调）主动推给 Agent，触发后续流程\n- 这是「主动型 Agent」的最后一公里：不仅问答，还能办事\n\n> 工具进化链：看世界（搜索 Day46）→ 动手算（代码 Day47）→ 读写存（DB/文件 Day48）→ **办事情（API/Webhook Day49）**。\n\n## 二、封装外部 API 为 tool\n\n### 2.1 用 Vercel AI SDK 的 tool() + fetch\n\n```ts\nimport { tool } from 'ai'\nimport { z } from 'zod'\n\nconst sendSlack = tool({\n  description: '向指定 Slack 频道发送一条消息',\n  parameters: z.object({\n    channel: z.string().describe('频道 ID，如 C12345'),\n    text: z.string().describe('消息正文'),\n  }),\n  execute: async ({ channel, text }) => {\n    const res = await fetch('https://slack.com/api/chat.postMessage', {\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/json',\n        Authorization: `Bearer ${process.env.SLACK_TOKEN}`,\n      },\n      body: JSON.stringify({ channel, text }),\n    })\n    return res.json()\n  },\n})\n```\n\n### 2.2 通用 HTTP 工具（让 LLM 自己决定调哪个接口）\n\n```ts\nconst callApi = tool({\n  description: '调用任意外部 REST API',\n  parameters: z.object({\n    url: z.string(),\n    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),\n    body: z.string().optional(),\n  }),\n  execute: async ({ url, method, body }) => {\n    const res = await fetch(url, {\n      method,\n      headers: { 'Content-Type': 'application/json' },\n      body: body ? body : undefined,\n    })\n    return res.text()\n  },\n})\n```\n\n> 注意：通用 HTTP 工具权限很大，务必配合白名单域名 + 人工确认（见坑位表）。\n\n## 三、Webhook：让外部事件触发 Agent\n\nWebhook 是「入站」通道。以 Next.js Route Handler 接收 GitHub Push 为例：\n\n```ts\n// app/api/webhook/github/route.ts\nexport async function POST(req: Request) {\n  const payload = await req.json()\n  // 1. 校验签名（安全！）\n  // 2. 根据事件类型触发对应 Agent\n  if (payload.ref === 'refs/heads/main') {\n    await runDeployAgent(payload.repository.name)\n  }\n  return Response.json({ ok: true })\n}\n```\n\n- Webhook 让 Agent 从「被动问答」变「事件驱动自动化」\n- 典型场景：CI 失败自动建 Issue、支付成功自动发券、表单提交自动建档\n\n## 四、可靠性与安全的必做项\n\n| 关注点 | 做法 |\n|--------|------|\n| 重试 | fetch 失败用指数退避（呼应 Day 9 HTTP 重试） |\n| 超时 | AbortController + setTimeout 防挂死 |\n| 鉴权 | Token 走环境变量，绝不硬编码 |\n| 签名校验 | Webhook 必须验签（GitHub `X-Hub-Signature`） |\n| 域名白名单 | 通用 HTTP 工具限制可访问 host |\n| 幂等 | Webhook 可能重复推送，用 eventId 去重 |\n\n## 五、与前面模块组合\n\n- **多 Agent（Day 41-45）**：API 工具常作为「执行 Agent」的末端动作\n- **记忆（Day 24-25）**：API 返回结果可进向量记忆，避免重复调用\n- **代码执行（Day 47）**：复杂返回体用 vm 解析更安全\n\n## 六、常见坑\n\n| 坑 | 后果 | 规避 |\n|----|------|------|\n| Token 硬编码进代码 | 泄露 | 走 env / Secret 管理 |\n| Webhook 不验签 | 伪造请求 | 强制签名校验 |\n| 无限重试 | 打爆对方服务 | 退避上限 + 熔断 |\n| 通用 HTTP 工具无白名单 | SSRF 攻击 | host 白名单 |\n| 忽略 4xx/5xx | 静默失败 | 检查 status 抛错 |\n| 官方站不可访问 | 卡文档 | 用国内镜像 |\n\n## 七、今日实践任务\n\n1. 封装一个「发飞书/Slack 消息」tool，接入你的 Agent 多步流程\n2. 写一个接收 Webhook 的 Route Handler，验签后触发一个简单 Agent\n3. 给通用 HTTP 工具加域名白名单 + 指数退避重试，写进 README\n\n🔗 学习资料（国内可访问镜像）：\n- Vercel AI SDK Tools 文档：https://ai-sdk.com.cn/docs/ai-sdk-core/tools-and-tool-calling ✅\n- Vercel AI SDK 中文：https://ai-sdk.com.cn/docs/introduction ✅\n- LangChain JS 中文：https://js.langchain.com.cn/docs/ ✅\n- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅",
  }
,
  {
    id: "54",
    title: "AI Agent 学习计划 - Day 50：MCP 协议入门（Model Context Protocol）",
    slug: "ai-agent-day50-mcp-intro",
    date: "2026-08-20",
    tags: ["AI Agent","MCP","Model Context Protocol","工具标准化","学习计划"],
    excerpt: "MCP 是 Anthropic 提出的「AI 工具 USB-C 接口」——统一了 Agent 连接数据源与工具的方式。今天搞懂 MCP 为什么出现、它解决的痛点、核心架构（Host/Client/Server）与传输层（stdio / SSE），为 Day 51 服务器开发打下基础。",
    readingTime: 14,
    content: "# Day 50：MCP 协议入门 — Model Context Protocol 概念与架构\n\n## 一、为什么需要 MCP（痛点驱动）\n\n在 MCP 之前，Agent 接一个工具就要写一套私有适配代码：\n\n- 每个数据源（数据库、文件系统、SaaS API）都要**单独对接**，N 个 Agent × M 个工具 = N×M 集成成本\n- 工具描述散落在各框架（LangChain `@tool` / Vercel `tool()`），**无法跨框架复用**\n- 上下文与工具耦合在业务代码里，**换模型/换框架要重写**\n\nMCP（Model Context Protocol，Anthropic 2024-11 提出）要做的是：**把「Agent 大脑」和「工具手脚」用一套标准协议解耦**，类似 USB-C 让所有设备共用接口。\n\n> 一句话：MCP = AI 世界的 USB-C。一次实现，处处可用。\n\n## 二、MCP 解决什么（能力三件套）\n\nMCP Server 可向 Agent 暴露三类原语：\n\n| 原语 | 作用 | 类比 |\n|------|------|------|\n| **Tools** | Agent 可主动调用执行动作（查库、发消息） | 函数调用 |\n| **Resources** | 被动提供的上下文数据（文件、配置） | 只读数据 |\n| **Prompts** | 预定义的提示词模板（可复用工作流） | 快捷指令 |\n\n## 三、核心架构（三层）\n\n```\n┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐\n│  Host       │◄────┤  MCP Client(s)   │◄────┤  MCP Server     │\n│ (Agent 应用) │ 1:1 │  (协议翻译层)     │     │ (工具/数据源)    │\n│ Claude/IDE  │     │  每 Server 一个   │     │ 暴露 Tools 等    │\n└─────────────┘     └──────────────────┘     └─────────────────┘\n```\n\n- **Host**：运行 Agent 的宿主程序（如 Claude Desktop、你的 Node Agent、Cursor IDE）\n- **Client**：Host 内为每个 Server 维护的一个连接（1 对 1），负责协议收发\n- **Server**：独立进程，提供具体能力（文件系统、GitHub、数据库……）\n\n## 四、传输层（Transport）\n\n| 传输方式 | 场景 | 特点 |\n|----------|------|------|\n| **stdio** | 本地 Server（同机子进程） | 最简单，进程间管道通信 |\n| **Streamable HTTP / SSE** | 远程 Server | 跨网络，支持流式，需鉴权 |\n\nDay 51 我们将用 `@modelcontextprotocol/sdk` 从 stdio 本地 Server 起步。\n\n## 五、MCP 与前面模块的衔接\n\n- **替代「手写 tool」**：Day 30/31（Vercel tool）、Day 46-49（搜索/代码/DB/API 工具）都可改造成 MCP Server，**跨框架复用**\n- **衔接项目二/三**：Day 71-77 多 Agent 编程助手、Day 79-83 MCP 工具服务器，都将以 MCP 为标准\n- **与记忆/多 Agent 解耦**：Server 独立部署，Agent 按需连接，符合 Day 41-45 编排思想\n\n## 六、常见坑\n\n| 坑 | 后果 | 规避 |\n|----|------|------|\n| 把 MCP 当普通 HTTP API | 协议不匹配 | 用官方 SDK，别手搓 JSON-RPC |\n| stdio Server 写日志到 stdout | 污染协议流 | 日志走 stderr / 文件 |\n| 一个 Client 连多个 Server | 协议要求 1:1 | 每个 Server 起独立 Client |\n| 远程 Server 不鉴权 | 被滥用 | 加 token / 网络隔离 |\n| 忽视官方站不可访问 | 卡文档 | 用国内镜像（见下方） |\n\n## 七、今日实践任务\n\n1. 通读 MCP 官方概念文档，画出 Host/Client/Server 交互时序图\n2. 在本地装 `@modelcontextprotocol/sdk`，跑通官方 quickstart 的最小 echo Server\n3. 思考：把你 Day 48 的「数据库查询 tool」改造成 MCP Server 需要哪些改动？写进 README\n\n🔗 学习资料（国内可访问镜像）：\n- MCP 协议官方站：https://modelcontextprotocol.io/ ✅（如不可访问可用下方镜像）\n- MCP 中文文档（社区）：https://mcp-docs.cn/ ✅\n- MCP Servers 仓库：https://github.com/modelcontextprotocol/servers ✅\n- 掘金 MCP 入门详解：https://juejin.cn/post/7438895836463157285 ✅\n- 知乎 MCP 是什么：https://zhuanlan.zhihu.com/p/1897467720608264470 ✅",
  }
,
  {
    id: "55",
    title: "AI Agent 学习计划 - Day 51：MCP 服务器开发（@modelcontextprotocol/sdk）",
    slug: "ai-agent-day51-mcp-server-dev",
    date: "2026-08-21",
    tags: ["AI Agent","MCP","MCP Server","TypeScript","工具开发","学习计划"],
    excerpt: "动手写第一个 MCP Server——用 @modelcontextprotocol/sdk 通过 stdio 暴露一个计算器工具。今天覆盖 SDK 安装、Server 初始化、用 zod 定义 tool、连接测试（MCP Inspector），把 Day 50 的概念落成代码。",
    readingTime: 15,
    content: "# Day 51：MCP 服务器开发 — 用 @modelcontextprotocol/sdk 暴露第一个工具\n\n## 一、目标\n\n把 Day 50 的架构概念变成可运行代码：**写一个 stdio 模式的 MCP Server，对外暴露一个 `add` 计算器工具**，并能被 Host（如 Claude Desktop 或 MCP Inspector）发现调用。\n\n## 二、最小 Server 骨架（TypeScript + SDK）\n\n```ts\nimport { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'\nimport { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'\nimport { z } from 'zod'\n\nconst server = new McpServer({ name: 'demo-server', version: '1.0.0' })\n\n// 注册一个工具：两数相加\nserver.tool(\n  'add',\n  '计算 a + b',\n  { a: z.number(), b: z.number() },\n  async ({ a, b }) => ({\n    content: [{ type: 'text', text: String(a + b) }],\n  }),\n)\n\n// 通过 stdio 启动（注意：日志必须走 stderr，否则污染协议流）\nconst transport = new StdioServerTransport()\nawait server.connect(transport)\n```\n\n## 三、关键 API 解析\n\n| API | 作用 |\n|-----|------|\n| `McpServer` | 服务端实例，注册 tool/resource/prompt |\n| `server.tool(name, desc, schema, handler)` | 注册工具，handler 返回 `{ content: [...] }` |\n| `StdioServerTransport` | stdio 传输层（本地子进程） |\n| `server.connect(transport)` | 启动并监听 |\n\n## 四、用 MCP Inspector 调试\n\n```bash\nnpx @modelcontextprotocol/inspector node dist/index.js\n```\n\nInspector 是官方可视化调试器，能看到工具列表、手动调用、查看返回，是开发期必备。\n\n## 五、对接 Host（以 Claude Desktop 为例）\n\n在 `claude_desktop_config.json` 加：\n\n```json\n{\n  \"mcpServers\": {\n    \"demo\": {\n      \"command\": \"node\",\n      \"args\": [\"/path/dist/index.js\"]\n    }\n  }\n}\n```\n\n重启 Host 后，你的 `add` 工具就出现在工具列表里，Agent 可主动调用。\n\n## 六、常见坑\n\n| 坑 | 后果 | 规避 |\n|----|------|------|\n| console.log 写 stdout | 协议解析失败 | 日志一律 stderr / 文件 |\n| zod schema 与 handler 参数不一致 | 调用报错 | 保持 shape 同名 |\n| 忘记 `await connect` | Server 不启动 | 顶层 await 或 async main |\n| ESM/CJS 混用 | import 报错 | package.json 设 `\"type\":\"module\"` |\n| 官方站不可访问 | 卡文档 | 用 mcp-docs.cn 镜像 |\n\n## 七、今日实践任务\n\n1. 用 SDK 写出上方案例并 `npx tsc` 编译跑通\n2. 用 Inspector 调用 `add` 验证返回\n3. 加一个 `get_weather(city)` 占位工具（返回模拟数据），为 Day 80 自定义工具打底\n\n🔗 学习资料（国内可访问镜像）：\n- MCP 官方文档：https://modelcontextprotocol.io/ ✅\n- MCP 中文文档：https://mcp-docs.cn/ ✅\n- MCP Servers 仓库：https://github.com/modelcontextprotocol/servers ✅\n- 掘金 从零开发 MCP Server：https://juejin.cn/post/7481593384082472994 ✅",
  }
,
  {
    id: "56",
    title: "AI Agent 学习计划 - Day 52：记忆系统（一）短期记忆",
    slug: "ai-agent-day52-memory-short-term",
    date: "2026-08-22",
    tags: ["AI Agent","记忆系统","短期记忆","上下文窗口","Buffer Memory","学习计划"],
    excerpt: "记忆系统开篇——短期记忆就是 LLM 的上下文窗口。今天讲清上下文窗口的本质、为什么它会爆、如何用 Buffer Memory / 消息数组管理多轮对话，以及截断与压缩策略。",
    readingTime: 13,
    content: "# Day 52：记忆系统（一）— 短期记忆（上下文窗口 / Buffer Memory）\n\n## 一、短期记忆 = 上下文窗口\n\nLLM 没有「大脑里的记忆」，所谓短期记忆就是**当前对话拼接进 prompt 的全部 token**（messages 数组）。每轮对话都把历史塞回去，模型才「记得」前文。\n\n- 容量有限：上下文窗口（如 8k/32k/128k token）是硬上限\n- 成本随长度线性增长：长对话越来越贵\n- 越远的信息注意力越弱（lost-in-the-middle 现象）\n\n## 二、Buffer Memory（原样缓存全部历史）\n\n最朴素做法：把每一轮 `user`/`assistant` 消息 push 进数组，调用时整体传入。\n\n```ts\nconst history: ChatMessage[] = []\nasync function chat(input: string) {\n  history.push({ role: 'user', content: input })\n  const { text } = await generateText({ model, messages: history })\n  history.push({ role: 'assistant', content: text })\n  return text\n}\n```\n\n- 优点：实现简单、零损耗保真\n- 缺点：线性增长，迟早爆窗口\n\n## 三、窗口管理与压缩策略\n\n| 策略 | 做法 | 适用 |\n|------|------|------|\n| 滑动窗口 | 只保留最近 N 轮 | 轻量对话 |\n| 截断 | 超长则丢最早消息 | 简单但丢信息 |\n| 摘要压缩 | LLM 把旧历史压成摘要 | 长对话保关键信息（Day 24 已学） |\n| Token 预算 | 按 token 估算裁剪 | 精确控制成本 |\n\n## 四、与前面模块衔接\n\n- 呼应 Day 24（Buffer/Summary Memory）的 LangChain 实现，今天从原理层统一认知\n- 多 Agent（Day 41-45）里每个 Agent 维护自己的短期记忆，避免串号（sessionId 隔离）\n- 为 Day 53 工作记忆、Day 54 长期记忆分层做铺垫\n\n## 五、常见坑\n\n| 坑 | 后果 | 规避 |\n|----|------|------|\n| 无限堆积消息 | 爆窗口/超费 | 加窗口或摘要 |\n| 多用户共用一个数组 | 串号泄露 | 按 sessionId 隔离 |\n| 摘要后丢失关键事实 | 答非所问 | 摘要保留实体/决策 |\n| 忘记清 system 消息 | 上下文错乱 | system 始终置顶 |\n\n## 六、今日实践任务\n\n1. 写一个带滑动窗口（最近 10 轮）的 `chatWithMemory` 函数\n2. 用 token 估算库（如 `js-tiktoken`）打印每轮上下文长度，观察增长\n3. 对比「全量 vs 窗口」两种策略在长对话下的成本差异，写进 README\n\n🔗 学习资料（国内可访问镜像）：\n- LangChain JS 中文 Memory：https://js.langchain.com.cn/docs/ ✅\n- LangChain 中文文档 Memory：https://langchain-doc.cn/ ✅\n- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅\n- 掘金 大模型记忆机制：https://juejin.cn/post/7353885796637274147 ✅",
  }
,
  {
    id: "57",
    title: "AI Agent 学习计划 - Day 53：记忆系统（二）工作记忆",
    slug: "ai-agent-day53-memory-working",
    date: "2026-08-23",
    tags: ["AI Agent","记忆系统","工作记忆","Scratchpad","状态对象","学习计划"],
    excerpt: "工作记忆是 Agent 推理过程中的「便签纸」——存当前任务的临时状态、中间结论、待办。今天讲清 Scratchpad / 状态对象的设计，以及一个 Agent Loop 内如何读写工作记忆。",
    readingTime: 12,
    content: "# Day 53：记忆系统（二）— 工作记忆（Scratchpad / 状态对象）\n\n## 一、工作记忆是什么\n\n如果说**短期记忆**是对话历史（跨轮），**工作记忆**就是**单次任务执行中的临时工作台**：\n\n- 多步推理时的「草稿纸」（ReAct 的 Thought/Action/Observation 就写在这里）\n- 当前子任务的进度、变量、中间结果\n- Agent 下一步决策的依据，任务结束即清掉\n\n类比：短期记忆=长期记事本，工作记忆=手边便签。\n\n## 二、两种典型实现\n\n### 2.1 Scratchpad（文本草稿，塞进 prompt）\n\nReAct Agent 把思考过程累积成文本，附在 prompt 末尾的 `agent_scratchpad`：\n\n```\nThought: 我需要先查天气\nAction: get_weather\nObservation: 晴天 25°C\nThought: 那建议穿薄外套\n```\n\n对应 Day 22-23 学过的 `MessagesPlaceholder(\"agent_scratchpad\")`。\n\n### 2.2 状态对象（结构化，代码层维护）\n\n```ts\nconst workingMemory = {\n  task: '规划北京三日游',\n  subtasks: ['查天气', '查景点', '排行程'],\n  done: ['查天气'],\n  draft: { itinerary: [] },\n}\n// 每步更新 workingMemory.draft，最后输出\n```\n\n- 优点：结构清晰、易调试、可序列化\n- 适合复杂任务编排（呼应 Day 44 Supervisor 的状态决策）\n\n## 三、与短期/长期记忆的关系\n\n```\n工作记忆（单次任务草稿）\n   ↓ 任务结束提炼\n短期记忆（对话历史）\n   ↓ 重要信息沉淀\n长期记忆（向量库/摘要，Day 54）\n```\n\n## 四、常见坑\n\n| 坑 | 后果 | 规避 |\n|----|------|------|\n| 把工作记忆误存长期 | 污染沉淀 | 任务结束显式清理 |\n| Scratchpad 无限增长 | 爆窗口 | 定期摘要压缩 |\n| 状态对象并发写 | 数据竞态 | 单 Agent 串行 / 加锁 |\n| 工作记忆与上下文混淆 | 重复信息 | 明确边界，不重复塞 |\n\n## 五、今日实践任务\n\n1. 给 Day 52 的 `chatWithMemory` 加一个 `workingMemory` 对象，记录当前子任务\n2. 用 Scratchpad 方式实现一个 3 步推理小 Agent（查→算→答）\n3. 画一张「工作/短期/长期」三层记忆流转图，写进 README\n\n🔗 学习资料（国内可访问镜像）：\n- LangChain JS 中文 Memory：https://js.langchain.com.cn/docs/ ✅\n- LangChain 中文文档 Memory：https://langchain-doc.cn/ ✅\n- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅\n- 掘金 Agent 记忆架构：https://juejin.cn/post/7353885796637274147 ✅",
  }
,
  {
    id: "58",
    title: "AI Agent 学习计划 - Day 54：记忆系统（三）长期记忆",
    slug: "ai-agent-day54-memory-long-term",
    date: "2026-08-24",
    tags: ["AI Agent","记忆系统","长期记忆","向量数据库","摘要","学习计划"],
    excerpt: "长期记忆让 Agent「跨会话不忘」——把重要信息存入向量数据库 + 摘要，按需语义检索召回。今天讲清长期记忆的写入/检索链路、与 RAG（Day 36-39）的同源复用，以及记忆的增删改与遗忘策略。",
    readingTime: 14,
    content: "# Day 54：记忆系统（三）— 长期记忆（向量数据库 + 摘要）\n\n## 一、为什么需要长期记忆\n\n短期/工作记忆都随会话结束消失，而 Agent 要**跨天、跨用户记住偏好、经验、知识**：\n\n- 用户画像（「我习惯用中文回复」）\n- 历史经验（「上次这个 bug 这么修的」）\n- 领域知识沉淀（相当于私人知识库）\n\n做法 = **向量数据库存语义片段 + 摘要压缩**，本质就是 Day 36-39 学过的 RAG 检索链路。\n\n## 二、写入链路\n\n```\n重要信息 → 摘要/切分 → Embedding → 存入向量库（带 metadata）\n```\n\n```ts\n// 用 Day 19 的 MemoryVectorStore 即可\nawait vectorStore.addDocuments([\n  new Document({ pageContent: '用户偏好：中文回复、简洁', metadata: { type: 'profile', userId } }),\n])\n```\n\n## 三、检索链路（语义召回）\n\n```ts\nconst hits = await vectorStore.similaritySearch(query, 3) // Top-3 相关记忆\n// 拼回 prompt 作为长期记忆上下文\n```\n\n- 与 Day 39 检索完全同源，可复用 `asRetriever()`\n- 生产用 Pinecone/Chroma（Day 38），开发用 MemoryVectorStore\n\n## 四、增删改与遗忘策略\n\n| 操作 | 做法 |\n|------|------|\n| 增 | 重要结论/偏好实时写入 |\n| 查 | 每轮 query 语义检索 Top-K |\n| 改 | 更新 metadata 或覆盖旧片段 |\n| 删/遗忘 | 过期记忆按 TTL 清理，防噪声累积 |\n\n## 五、三层记忆体系回顾（Day 52-54 汇总）\n\n| 层 | 范围 | 存储 | 对应模块 |\n|----|------|------|----------|\n| 工作记忆 | 单次任务 | Scratchpad/对象 | Day 53 |\n| 短期记忆 | 本轮对话 | messages 数组 | Day 52 |\n| 长期记忆 | 跨会话 | 向量库+摘要 | Day 54（今日） |\n\n## 六、常见坑\n\n| 坑 | 后果 | 规避 |\n|----|------|------|\n| 什么都存 | 噪声干扰检索 | 只存高价值信息 |\n| 嵌入模型不一致 | 召回失准 | 与 RAG 用同一模型 |\n| 永不清理 | 库膨胀变慢 | 加 TTL/遗忘策略 |\n| 敏感信息入向量库 | 隐私泄露 | 脱敏后再存 |\n| 官方站不可访问 | 卡文档 | 用国内镜像 |\n\n## 七、今日实践任务\n\n1. 用 MemoryVectorStore 建一个「用户偏好」长期记忆，写入 3 条并语义检索验证\n2. 把 Day 53 的工作记忆提炼结果沉淀进长期记忆\n3. 给长期记忆加一条「遗忘」函数（按 userId + TTL 清理），写进 README\n\n🔗 学习资料（国内可访问镜像）：\n- Pinecone 文档：https://docs.pinecone.io/ ✅\n- LangChain JS 中文 Retrieval：https://js.langchain.com.cn/docs/ ✅\n- LangChain 中文文档 Memory：https://langchain-doc.cn/ ✅\n- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅",
  }
,
  {
    id: "59",
    title: "AI Agent 学习计划 - Day 55：记忆系统（四）情景记忆",
    slug: "ai-agent-day55-memory-episodic",
    date: "2026-08-25",
    tags: ["AI Agent","记忆系统","情景记忆","Episodic Memory","经验库","学习计划"],
    excerpt: "情景记忆让 Agent「记住发生过的事」——把每次交互的关键上下文（任务、决策、结果、反馈）按事件存储，未来遇到相似情境可召回借鉴。今天讲清情景记忆与长期记忆的区别、存储结构设计、检索应用，以及它在自我改进 Agent 中的价值。",
    readingTime: 13,
    content: "# Day 55：记忆系统（四）— 情景记忆（Episodic Memory）\n\n## 一、情景记忆是什么\n\n前三天学了：\n- **工作记忆**（Day 53）：单次任务草稿\n- **短期记忆**（Day 52）：本轮对话历史\n- **长期记忆**（Day 54）：跨会话的知识/偏好（向量库+摘要）\n\n**情景记忆**是长期记忆的一个专门子集，专门存「**事件**」：某次任务怎么做的、遇到什么坑、结果如何、用户给了什么反馈。\n\n> 类比人类：长期记忆像百科知识，情景记忆像「上次去 XXX 餐厅踩雷了」的具体经历。\n\n## 二、为什么 Agent 需要情景记忆\n\n- **经验复用**：下次遇到相似任务，直接召回「上次怎么做的」少走弯路\n- **自我改进**：把失败/成功案例沉淀，让 Agent 越用越聪明\n- **可解释**：出了问题能追溯「当时为什么这么决策」\n- 这是 Day 13 提过的「ReAct 多步推理 + 经验」的落地形态\n\n## 三、存储结构设计\n\n每条情景 = 一段结构化事件，最好带 metadata 便于检索：\n\n```ts\ntype Episode = {\n  id: string\n  task: string              // 任务描述\n  context: string          // 关键上下文\n  actions: string[]        // 采取了什么动作\n  outcome: 'success' | 'fail'\n  feedback?: string        // 用户/系统反馈\n  lesson: string           // 提炼的经验教训\n  embedding: number[]      // 用于语义检索\n  createdAt: string\n}\n```\n\n存法与 Day 54 长期记忆一致：Embedding + 向量库（Pinecone / MemoryVectorStore）。\n\n## 四、检索与应用\n\n```ts\n// 新任务到来时，召回相似历史情景\nconst similar = await vectorStore.similaritySearch(newTask, 3)\n// 拼进 prompt：「参考你之前的经验：...」\n```\n\n- 复现成功路径 → 提高成功率\n- 规避失败路径 → 减少重复犯错\n\n## 五、与长期记忆的关系\n\n```\n              ┌─ 知识/偏好（Day 54 长期记忆）\n长期记忆 ─────┤\n              └─ 情景/经历（Day 55 情景记忆，本日）\n```\n\n两者都跨会话、都用向量库，区别在**内容形态**：一个是「知道什么」，一个是「经历过什么」。\n\n## 六、常见坑\n\n| 坑 | 后果 | 规避 |\n|----|------|------|\n| 情景记太细（含无关噪声） | 检索被干扰 | 只存 lesson + 关键动作 |\n| 把工作记忆当情景永久存 | 临时草稿污染 | 任务结束再提炼入库 |\n| 失败情景无反馈字段 | 无法归因 | 强制 feedback/lesson |\n| 情景与知识混库 | 召回不精准 | 用 metadata.type 区分 |\n| 官方站不可访问 | 卡文档 | 用国内镜像 |\n\n## 七、今日实践任务\n\n1. 基于 Day 54 的向量库，加一个 `saveEpisode()` / `recallEpisode()`，存 2 条「踩坑经验」\n2. 写一个 prompt 模板，把召回情景作为「参考经验」注入\n3. 总结 Day 52-55 四层记忆体系一张表，写进 README（为 Day 56 阶段三总结铺垫）\n\n🔗 学习资料（国内可访问镜像）：\n- LangChain JS 中文 Memory：https://js.langchain.com.cn/docs/ ✅\n- LangChain 中文文档 Memory：https://langchain-doc.cn/ ✅\n- Pinecone 文档：https://docs.pinecone.io/ ✅\n- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅\n- 掘金 大模型记忆机制：https://juejin.cn/post/7353885796637274147 ✅",
  }
,
  {
    id: "60",
    title: "AI Agent 学习计划 - Day 56：阶段三总结与综合练习",
    slug: "ai-agent-day56-stage3-summary",
    date: "2026-08-26",
    tags: ["AI Agent","阶段总结","RAG","多Agent","工具集成","记忆系统","学习计划"],
    excerpt: "阶段三（进阶能力 Day 36-56）收官——把 RAG、多 Agent 编排、工具集成、记忆系统四大模块串成一条完整链路。今天做一张能力地图、一个端到端 demo 设计，并为 Day 57 进入实战项目一做铺垫。",
    readingTime: 16,
    content: "# Day 56：阶段三总结与综合练习 — 整合 RAG + 多 Agent + 工具集成 + 记忆系统\n\n## 一、阶段三回顾：四大模块能力地图\n\n| 模块 | 覆盖 Day | 核心能力 |\n|------|----------|----------|\n| **RAG** | 36-40 | 文档切分→嵌入→向量存储→检索→重排序（知识注入） |\n| **多 Agent 编排** | 41-45 | 顺序链 / 路由 / 协作讨论 / 层级管理（分工协作） |\n| **工具集成** | 46-49 | 搜索 / 代码执行 / DB·文件 / 外部 API·Webhook（手脚延伸） |\n| **记忆系统** | 50-55 | MCP 协议 + 工作/短期/长期/情景记忆（持续认知） |\n\n> 注：MCP（Day 50-51）是「工具标准化的横切能力」，让工具集成模块彻底解耦。\n\n## 二、端到端 Agent 链路（一张图看懂）\n\n```\n用户问题\n   │\n   ├─[记忆系统] 短期(上下文)+长期(向量库)+情景(经验) 注入 Prompt\n   │\n   ├─[RAG] 检索私有知识库 → 上下文增强\n   │\n   ├─[多 Agent] Supervisor 路由/编排 子 Agent\n   │\n   ├─[工具集成/MCP] 搜索/查库/调API/执行代码 拿真实数据\n   │\n   └─ 生成答案 → 回写长期/情景记忆\n```\n\n这不是四个孤立模块，而是**一个 Agent 的完整生命周期**。\n\n## 三、综合练习：设计一个「研究型 Agent」\n\n把四大模块都用上，设计 prompt / 架构（无需今天写完代码，画出骨架即可）：\n\n1. **RAG**：加载行业报告 PDF → 向量库\n2. **多 Agent**：Planner（拆解）→ Researcher（检索+搜索）→ Writer（成稿）\n3. **工具**：Researcher 用 Tavily 搜索 + DB 查数据；Writer 用代码执行画图表\n4. **记忆**：短期存对话、长期存用户偏好、情景存「上次报告结论」\n\n## 四、阶段三 → 阶段四 衔接\n\nDay 57 起进入**实战项目**，把今天的能力地图落成真实代码：\n\n- 项目一（Day 57-70）：智能知识库问答系统 = **RAG + 记忆 + 流式 UI** 的完整落地\n- 项目二（Day 71-78）：多 Agent 编程助手 = **多 Agent + MCP + 工具** 的落地\n- 项目三（Day 79-83）：MCP 工具服务器 = **MCP + 工具集成** 的落地\n\n## 五、常见坑汇总（阶段三高频雷区）\n\n| 雷区 | 来源 | 规避 |\n|------|------|------|\n| 检索召回不相关 | RAG 切分/嵌入不当 | 调 chunk size + 同模型 |\n| Agent 死循环 | 多 Agent 无终止条件 | 设 max_iter / 明确出口 |\n| 工具权限过大 | 工具集成无护栏 | 白名单 + 人工确认 |\n| 记忆污染 | 什么都往向量库塞 | 只存高价值 + TTL |\n| MCP 日志污染 stdout | Server 写 console.log | 日志走 stderr |\n\n## 六、今日实践任务\n\n1. 画一张属于自己的「四大模块能力地图」（可参考上方表格扩展）\n2. 完成「研究型 Agent」的架构骨架（目录结构 + 各模块职责注释）\n3. 整理 Day 36-55 的笔记要点，写一份阶段三回顾 README（为作品集沉淀素材）\n\n🔗 学习资料（国内可访问镜像）：\n- LangChain.js Templates：https://github.com/langchain-ai/langchainjs-templates ✅\n- LangChain JS 中文文档：https://js.langchain.com.cn/docs/ ✅\n- MCP 中文文档：https://mcp-docs.cn/ ✅\n- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅",
  }
,
  {
    id: "61",
    title: "AI Agent 学习计划 - Day 57：项目一启动 - 智能知识库问答系统",
    slug: "ai-agent-day57-project1-start",
    date: "2026-08-27",
    tags: ["AI Agent","实战项目","项目一","知识库问答","Next.js","技术栈","学习计划"],
    excerpt: "阶段四实战开启！项目一「智能知识库问答系统」是 RAG + 记忆 + 流式 UI 的完整落地。今天做项目规划、技术栈选型（Next.js + LangChain.js + Pinecone + OpenAI），并初始化工程骨架。",
    readingTime: 16,
    content: "# Day 57：项目一启动 — 智能知识库问答系统\n\n## 一、项目目标\n\n做一个能「读懂你私有文档并对话」的问答系统：用户上传 PDF/Markdown/网页，系统切分嵌入入库，对话时检索相关知识生成带引用的答案。\n\n> 这是 Day 36-40（RAG）+ Day 52/54（记忆）+ Day 27/28（流式 UI）的**端到端整合**，是阶段三能力的最直接落地。\n\n## 二、技术栈\n\n| 层 | 选型 | 对应学过的模块 |\n|----|------|----------------|\n| 框架 | Next.js（App Router） | Day 61-66 流式 Route |\n| LLM | OpenAI GPT-4o | Day 10/16/26 |\n| 编排 | LangChain.js | Day 16-25 |\n| 向量库 | Pinecone（云端）/ Chroma（本地） | Day 38-39 |\n| 嵌入 | OpenAI Embeddings | Day 37 |\n| 前端流式 | Vercel AI SDK `useChat` | Day 27-29 |\n| 语言 | TypeScript | Day 1-4 |\n\n## 三、目录骨架规划\n\n```\nproject1-kb/\n├─ app/\n│  ├─ api/\n│  │  ├─ ingest/route.ts      # 文档上传+切分+入库 (Day 58)\n│  │  └─ chat/route.ts        # 流式问答 (Day 61)\n│  ├─ page.tsx                # 对话界面 (Day 62)\n├─ lib/\n│  ├─ vectorstore.ts          # Pinecone 封装 (Day 59)\n│  ├─ retriever.ts            # 检索 (Day 60)\n│  └─ memory.ts               # 多轮记忆 (Day 64)\n├─ components/SourceCard.tsx  # 引用溯源 (Day 63)\n├─ .env.local                 # API Key\n└─ README.md\n```\n\n## 四、今天要落地的初始化\n\n1. `npx create-next-app@latest` 选 TS + App Router + Tailwind\n2. 装依赖：`langchain @langchain/openai @langchain/pinecone pinecone @ai-sdk/openai ai`\n3. 配 `.env.local`：`OPENAI_API_KEY`、`PINECONE_API_KEY`、`PINECONE_INDEX`\n4. 跑通一个最小 `/api/chat` 返回 `streamText` 的 hello 流式响应（验证链路）\n\n## 五、与前面模块的衔接\n\n- **Day 36-40 RAG**：切分→嵌入→检索全用上\n- **Day 52/54 记忆**：多轮对话历史 + 长期偏好\n- **Day 27-29 流式 UI**：`useChat` 实时渲染\n- **Day 63 引用**：把检索到的 chunk 作为 SourceCard 展示\n\n## 六、常见坑（项目启动期）\n\n| 坑 | 后果 | 规避 |\n|----|------|------|\n| Next 版本与 AI SDK 不兼容 | 报错 | 锁 ai@4.x + @ai-sdk/openai 对应版 |\n| Pinecone 索引维度不匹配 | 写入失败 | Embedding 维度（如 1536）与索引一致 |\n| API Key 进前端 | 泄露 | 只在 route 服务端用，走 env |\n| 本地没 GPU | 嵌入慢 | 用 OpenAI 云端 Embedding |\n| 官方站不可访问 | 卡文档 | 用国内镜像 |\n\n## 七、今日实践任务\n\n1. 初始化 Next.js 工程，装齐依赖\n2. 配好 `.env.local`，写最小 `/api/chat` 流式 hello 验证\n3. 画一张项目一架构图 + 写 README 开头（目标/技术栈/目录）\n\n🔗 学习资料（国内可访问镜像）：\n- Next.js 官方文档：https://nextjs.org/docs ✅（国内可走 https://nextjs.org/ 或社区镜像）\n- Vercel AI Chatbot 参考：https://github.com/vercel/ai-chatbot ✅\n- LangChain JS 中文文档：https://js.langchain.com.cn/docs/ ✅\n- Pinecone 文档：https://docs.pinecone.io/ ✅\n- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅",
  }
,
  {
    id: "62",
    title: "AI Agent 学习计划 - Day 58：项目一 - 文档上传与自动切分",
    slug: "ai-agent-day58-project1-ingest",
    date: "2026-08-28",
    tags: ["AI Agent","实战项目","项目一","文档上传","RAG","切分","学习计划"],
    excerpt: "项目一第二步：实现文档上传 API，并用 RecursiveCharacterTextSplitter 自动切分。这是 RAG 链路的入口——切分质量直接决定检索效果。今天覆盖 Next.js Route Handler 接收文件、Loader 加载、切分策略与参数调优。",
    readingTime: 16,
    content: "# Day 58：项目一 - 文档上传与自动切分\n\n## 一、目标\n\n在 Day 57 工程基础上，实现 `/api/ingest`：接收用户上传的文档（PDF/MD/TXT），加载内容并自动切分成适合嵌入的 chunk，**为 Day 59 向量化存储铺好数据**。\n\n> 切分（Chunking）是 RAG 质量的第一道关卡——切太碎丢上下文，切太大噪点多。今天重点理解 `RecursiveCharacterTextSplitter`。\n\n## 二、文档加载（Loader）\n\nLangChain 对不同格式有现成 Loader：\n\n```ts\nimport { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'\nimport { TextLoader } from 'langchain/document_loaders/fs/text'\nimport { MarkdownLoader } from '@langchain/community/document_loaders/fs/markdown'\n\nconst loader = new PDFLoader(fileBufferOrPath)\nconst docs = await loader.load() // Document[]，每页一个\n```\n\n## 三、自动切分（核心）\n\n```ts\nimport { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'\n\nconst splitter = new RecursiveCharacterTextSplitter({\n  chunkSize: 1000,      // 每块约 1000 字符\n  chunkOverlap: 200,    // 相邻块重叠 200，保连贯\n  separators: ['\\n\\n', '\\n', '。', '，', ' '], // 优先在语义边界切\n})\n\nconst chunks = await splitter.splitDocuments(docs)\n// chunks: Document[]，带 pageContent + metadata\n```\n\n- `separators` 按优先级尝试，优先在段落/句号处断，避免把一句话劈两半\n- `chunkOverlap` 让相邻块有重叠，检索时不会因边界丢信息\n\n## 四、Route Handler 实现（Next.js）\n\n```ts\n// app/api/ingest/route.ts\nexport async function POST(req: Request) {\n  const form = await req.formData()\n  const file = form.get('file') as File\n  const buffer = Buffer.from(await file.arrayBuffer())\n  // 1. 选 Loader（按扩展名）\n  // 2. load()\n  // 3. splitDocuments()\n  // 4. 暂存 chunks 到内存/临时表，供 Day 59 入库\n  return Response.json({ chunks: chunks.length })\n}\n```\n\n> 注意：前端直传文件时，Loader 需支持 buffer（或先落临时文件）。生产可改用 Vercel Blob 存原文件。\n\n## 五、切分策略选择（呼应 Day 36）\n\n| 策略 | 适用 |\n|------|------|\n| 固定长度 | 通用、简单 |\n| 递归字符（今日） | 大多数文档默认首选 |\n| 语义切分 | 长文、需保意群（可用 Embedding 辅助） |\n\n## 六、常见坑\n\n| 坑 | 后果 | 规避 |\n|----|------|------|\n| chunkSize 过大（>2k） | 检索噪点多 | 1000 左右起步，按效果调 |\n| 无 overlap | 边界信息丢失 | 设 10-20% overlap |\n| 中文按空格切 | 切得乱 | separators 加 `。，、` |\n| 大文件同步处理 | 超时 | 流式/后台任务，返回 taskId |\n| Loader 不匹配格式 | 解析空 | 按扩展名分发 Loader |\n| 官方站不可访问 | 卡文档 | 用国内镜像 |\n\n## 七、今日实践任务\n\n1. 在 Day 57 工程上加 `/api/ingest`，支持 PDF/MD/TXT 上传\n2. 用 RecursiveCharacterTextSplitter 切分，打印 chunk 数量与样例\n3. 调参实验：chunkSize 500 vs 1000 vs 2000，观察切分粒度差异，写进 README\n\n🔗 学习资料（国内可访问镜像）：\n- LangChain JS 中文 文档加载：https://js.langchain.com.cn/docs/ ✅\n- LangChain 中文 Text Splitter：https://langchain-doc.cn/ ✅\n- Next.js Route Handler 文档：https://nextjs.org/docs/app/building-your-application/routing/route-handlers ✅\n- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅",
  }
,
  {
    id: "63",
    title: "AI Agent 学习计划 - Day 59：项目一 - 向量化存储",
    slug: "ai-agent-day59-project1-vector-storage",
    date: "2026-08-29",
    tags: ["AI Agent","实战项目","项目一","向量化","Embeddings","Pinecone","RAG","学习计划"],
    excerpt: "项目一第三步：把 Day 58 切好的 chunk 用 OpenAI Embeddings 转成向量，写入 Pinecone 向量库。这是 RAG 链路的核心——让知识可被语义检索。今天覆盖 Embedding 概念、OpenAI 嵌入模型选型、Pinecone 索引创建与 upsert、以及国内可访问的替代方案。",
    readingTime: 16,
    content: "# Day 59：项目一 - 向量化存储\n\n## 一、目标\n\n在 Day 58 完成「文档上传 + 自动切分」后，今天实现 **向量化存储**：把切好的 chunk 用 Embedding 模型转成高维向量，写入向量数据库（Pinecone），让知识库可以被语义检索。\n\n> 切分（Day 58）解决「怎么拆」，今天解决「怎么存」——把文本变成向量，才能做相似度检索。下一步 Day 60 就基于这个向量库做语义检索。\n\n整体链路：**文档 → 切分(Day58) → 嵌入(今天) → 向量库(今天) → 检索(Day60) → 注入 Prompt(Day60)**。\n\n## 二、Embedding 是什么\n\nEmbedding 是把文本映射成一组浮点数的过程：\n\n```ts\n\"今天天气不错\"  ──Embedding模型──▶  [0.12, -0.34, 0.88, ...]  // 1536 维向量\n```\n\n- 语义相近的文本，向量在空间中距离也近（余弦相似度接近 1）。\n- 这是 RAG 能「按意思找文档」的根本原因，而非关键词匹配。\n\n```ts\nimport { OpenAIEmbeddings } from '@langchain/openai'\n\nconst embeddings = new OpenAIEmbeddings({\n  model: 'text-embedding-3-small', // 1536 维，性价比高\n  apiKey: process.env.OPENAI_API_KEY,\n})\n\n// 单条查询向量\nconst queryVec = await embeddings.embedQuery('如何重置密码？')\n// 批量文档向量（比逐条 embedDocuments 更省 token、更快）\nconst docVecs = await embeddings.embedDocuments(chunks.map(c => c.pageContent))\n```\n\n> 注意：`embedQuery` 用于用户问题，`embedDocuments` 用于文档 chunk，二者必须用**同一个模型**，否则向量空间不一致，相似度计算无意义。\n\n## 三、OpenAI 嵌入模型选型\n\n| 模型 | 维度 | 特点 | 场景 |\n|------|------|------|------|\n| `text-embedding-3-small` | 1536 | 便宜、快、效果够用 | 绝大多数知识库首选 |\n| `text-embedding-3-large` | 3072 | 精度更高 | 对召回要求极高的场景 |\n| `text-embedding-ada-002` | 1536 | 旧版 | 兼容老项目 |\n\n> 选型经验：先用 `small` 跑通整个链路，效果不够再换 `large`。维度要和 Pinecone 索引创建时的 `dimension` 严格一致。\n\n## 四、Pinecone 向量库\n\nPinecone 是托管向量数据库，免运维、支持相似度检索与 metadata 过滤。\n\n### 1. 初始化客户端与索引\n\n```ts\nimport { Pinecone } from '@pinecone-database/pinecone'\n\nconst pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })\n\n// 首次创建索引（dimension 必须和 Embedding 模型一致）\nconst indexName = 'kb-demo'\nif (!(await pc.listIndexes()).indexes?.some(i => i.name === indexName)) {\n  await pc.createIndex({\n    name: indexName,\n    dimension: 1536,            // text-embedding-3-small\n    metric: 'cosine',           // 余弦相似度\n    spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },\n  })\n}\nconst index = pc.index(indexName)\n```\n\n### 2. 把 chunk 写入向量库（upsert）\n\n```ts\nimport { v4 as uuid } from 'uuid'\n\nconst vectors = await Promise.all(\n  chunks.map(async (doc, i) => ({\n    id: uuid(), // 每个 chunk 唯一 id\n    values: await embeddings.embedQuery(doc.pageContent),\n    metadata: {\n      text: doc.pageContent,\n      source: doc.metadata.source, // 为 Day 63 引用溯源预留\n      chunkIndex: i,\n    },\n  }))\n)\n\nawait index.upsert(vectors)\n```\n\n> `metadata` 里存原文 `text` 和 `source`：检索时直接拿回原文拼进 Prompt，无需再回查原始文件。\n\n## 五、完整 ingest 链路（Day58 + Day59 串起来）\n\n```ts\n// app/api/ingest/route.ts（整合切分 + 嵌入 + 入库）\nexport async function POST(req: Request) {\n  const form = await req.formData()\n  const file = form.get('file') as File\n  const buffer = Buffer.from(await file.arrayBuffer())\n\n  // 1. 加载（复用 Day 58 Loader）\n  const docs = await loadDocument(file.name, buffer)\n  // 2. 切分（Day 58）\n  const chunks = await splitDocuments(docs)\n  // 3. 嵌入 + 入库（今天）\n  const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })\n  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })\n  const index = pc.index('kb-demo')\n\n  const vectors = await Promise.all(chunks.map(async (doc, i) => ({\n    id: uuid(),\n    values: await embeddings.embedQuery(doc.pageContent),\n    metadata: { text: doc.pageContent, source: doc.metadata.source, chunkIndex: i },\n  })))\n  await index.upsert(vectors)\n\n  return Response.json({ ok: true, count: vectors.length })\n}\n```\n\n## 六、国内可访问的替代方案（无需海外 Key / 网络）\n\nPinecone 是海外 SaaS，若网络或 Key 受限，可用以下国内可访问替代：\n\n- **本地向量库 Chroma / MemoryVectorStore**：完全本地运行，免 API Key，开发调试首选（参考 Day 38）。\n  - LangChain 中文文档：https://js.langchain.com.cn/docs/\n- **本地 Embedding 模型**：`HuggingFaceTransformersEmbeddings`（bge-small-zh 等中文模型）免 OpenAI Key，隐私友好。\n  - 菜鸟教程 AI Agent 实战：https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n- **国内大模型 Embedding API**：百度文心、阿里通义千问、智谱 GLM 均提供 Embedding 接口与中文文档。\n\n## 七、常见坑\n\n1. **维度不匹配**：Pinecone 索引 `dimension` 和 Embedding 模型维度必须一致，否则 upsert 报错。\n2. **查询/文档用了不同 Embedding 模型**：相似度计算失效，召回全错。\n3. **metadata 只存 id 不存 text**：检索回来还要再查原文，多一次 IO；建议直接把 `text` 放 metadata。\n4. **批量过大**：一次 upsert 上千条可能超时，按 100 条/批分批。\n5. **忘了 `source` 字段**：Day 63 引用溯源拿不到出处。\n6. **官方站不可访问**：OpenAI / Pinecone 官方文档按用户偏好用国内镜像（js.langchain.com.cn / 菜鸟教程）替代。\n7. **Key 硬编码 / 泄露**：必须走 `process.env`，不要写进前端代码。\n\n## 八、今日实践任务\n\n1. 在 Day 58 工程里接入 `OpenAIEmbeddings` + `Pinecone`，打通「上传 → 切分 → 嵌入 → upsert」全链路。\n2. 上传一份自己的文档（PDF/MD），打印 `upsert` 返回的 chunk 数量，确认入库成功。\n3. 用 `index.query({ topK: 3, vector: 查询向量 })` 手动验证能按语义召回相关 chunk（为 Day 60 探路）。\n4. 若海外 Key 受限，改用 Chroma 本地向量库 + 本地 Embedding 模型重跑一遍，对比效果。\n\n---\n\n> 进度：Day 59 / 84（70.2%）。下一步 Day 60：语义检索实现（相似度检索 + 上下文注入到 Prompt）。",
  }
,
  {
    id: "64",
    title: "AI Agent 学习计划 - Day 60：项目一 - 语义检索实现",
    slug: "ai-agent-day60-project1-semantic-retrieval",
    date: "2026-08-30",
    tags: ["AI Agent","实战项目","项目一","语义检索","RAG","上下文注入","Pinecone","学习计划"],
    excerpt: "项目一第四步：基于 Day 59 写入的向量库做相似度检索，并把召回的 chunk 注入 Prompt 让 LLM 基于证据回答。这是 RAG 的「检索→生成」闭环关键一步，直接决定问答质量。",
    readingTime: 16,
    content: "# Day 60：项目一 - 语义检索实现\n\n## 一、目标\n\n在 Day 59 把 chunk 写入向量库后，今天实现 **语义检索**：把用户问题 Embedding 后，在 Pinecone 中找最相似的 chunk，再把原文注入 Prompt 让 LLM 基于证据回答。\n\n> 这是 RAG「检索 → 生成」闭环的关键一步。检索质量直接决定问答上限——召回不到，LLM 再强也只能瞎编。\n\n整体链路：**用户问题 → embedQuery → Pinecone query → 召回 chunk → 拼接上下文 → Prompt → LLM 回答（Day61 流式）**。\n\n## 二、相似度检索（Pinecone query）\n\n```ts\nimport { Pinecone } from '@pinecone-database/pinecone'\nimport { OpenAIEmbeddings } from '@langchain/openai'\n\nconst pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })\nconst index = pc.index('kb-demo')\nconst embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })\n\n// 1. 把用户问题转成向量（必须和入库同一模型）\nconst queryVec = await embeddings.embedQuery('如何重置密码？')\n\n// 2. 检索 Top-K 最相似 chunk\nconst res = await index.query({\n  topK: 4,\n  vector: queryVec,\n  includeMetadata: true, // 带回 metadata.text / source\n})\n\n// 3. 取出原文\nconst contexts = res.matches.map(m => m.metadata!.text as string)\nconst sources = res.matches.map(m => m.metadata!.source as string)\n```\n\n> `topK` 常见取值 3-6：太小召回不全，太大引入噪声、撑爆上下文、增加成本。\n\n## 三、上下文注入（Context Injection）\n\n把召回的 chunk 拼成一段上下文，塞进 Prompt 的 `{context}` 占位符：\n\n```ts\nimport { ChatPromptTemplate } from '@langchain/core/prompts'\n\nconst prompt = ChatPromptTemplate.fromMessages([\n  ['system', `你是知识库助手，只根据下面提供的上下文回答，不知道就说不知道，不要编造。\n上下文：\n{context}`],\n  ['human', '{question}'],\n])\n\nconst contextText = contexts.join('\\n\\n---\\n\\n')\n\nconst chain = prompt.pipe(model).pipe(new StringOutputParser())\nconst answer = await chain.invoke({ context: contextText, question: '如何重置密码？' })\n```\n\n> 关键约束「不知道就说不知道，不要编造」能显著降低幻觉；这是 RAG 相比直接问 LLM 的核心价值。\n\n## 四、用 LangChain VectorStore 简化（推荐）\n\nDay 38 学过的 `VectorStoreRetriever` 能一行封装「query → 检索 → 拼上下文」：\n\n```ts\nimport { PineconeStore } from '@langchain/pinecone'\n\nconst vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index })\nconst retriever = vectorStore.asRetriever({ k: 4 }) // 自动 embedQuery + query\n\nconst docs = await retriever.invoke('如何重置密码？')\nconst contextText = docs.map(d => d.pageContent).join('\\n\\n---\\n\\n')\n// docs[i].metadata.source 即为溯源信息（Day 63 用）\n```\n\n> `asRetriever({ k })` 把检索器标准化，可直接接进 Day 20 学的 LCEL 链，复用率高。\n\n## 五、带分数过滤（提升精度）\n\nPinecone `query` 返回 `score`（余弦相似度 0-1），可设阈值过滤低相关内容：\n\n```ts\nconst res = await index.query({ topK: 6, vector: queryVec, includeMetadata: true })\nconst good = res.matches.filter(m => (m.score ?? 0) > 0.75) // 只保留高相关\nif (good.length === 0) {\n  // 召回不足 → 直接告知用户知识库未覆盖，避免硬答\n}\n```\n\n## 六、常见坑\n\n1. **查询与入库用了不同 Embedding 模型**：向量空间不一致，score 全低、召回错乱。\n2. **topK 过大**：噪声 chunk 稀释答案，还浪费 token。\n3. **漏掉「不知道就说不知道」约束**：LLM 拿不到证据时硬编，幻觉率飙升。\n4. **chunk 太大**：单个 chunk 塞进上下文占满窗口，挤压真正相关片段。\n5. **上下文与问题顺序错**：把 context 放 system、question 放 human，别反。\n6. **中文召回弱**：中文文档建议用中文 Embedding 模型（bge-zh），或 `text-embedding-3-small` 实测足够时再用。\n7. **官方站不可访问**：OpenAI / Pinecone 官方文档按用户偏好用国内镜像（js.langchain.com.cn / 菜鸟教程）替代。\n\n## 七、今日实践任务\n\n1. 在 Day 59 工程上加 `/api/retrieve`：接收问题 → embedQuery → Pinecone query → 返回召回 chunk 与 sources。\n2. 用 Day 59 上传的文档提问，确认能召回相关 chunk（打印 `score` 观察相关性）。\n3. 组装 Prompt 让 LLM 基于上下文回答，对比「有 RAG」vs「无 RAG」的回答差异，体会检索价值。\n4. 调 `topK`（3/4/6）与 `score` 阈值，记录召回质量变化。\n\n---\n\n> 进度：Day 60 / 84（71.4%）。下一步 Day 61：流式对话 API（把今天的检索链接入 Vercel AI SDK 的 streamText，实现边检索边生成）。",
  }
,
  {
    id: "65",
    title: "AI Agent 学习计划 - Day 61：项目一 - 流式对话 API",
    slug: "ai-agent-day61-project1-streaming-chat-api",
    date: "2026-08-31",
    tags: ["AI Agent","实战项目","项目一","流式对话","Vercel AI SDK","streamText","RAG","学习计划"],
    excerpt: "项目一第五步：把 Day 60 的语义检索链接入 Vercel AI SDK 的 streamText，做成一个流式对话 API Route。这是「检索 → 生成 → 流式返回」全链路打通的关键一步，也是 Day 62 前端 Chat 组件的数据来源。",
    readingTime: 15,
    content: "# Day 61：项目一 - 流式对话 API\n\n## 一、目标\n\nDay 59 把 chunk 写进了向量库，Day 60 实现了语义检索。今天把它们**串进对话 API**：用户发消息 → 检索相关 chunk → 注入 System Prompt → 用 `streamText` 流式生成回答 → 以 UI Message Stream 协议返回，供 Day 62 前端直接 `useChat` 消费。\n\n> 到目前为止的链路：**问题 → embedQuery → Pinecone query → 召回 chunk → 拼上下文 → Prompt → LLM（Day61 流式）→ 前端打字机（Day62）**。今天完成后端「检索 + 生成 + 流式」闭环。\n\n## 二、为什么用 Vercel AI SDK 的 streamText\n\n- 项目一前端计划用 `useChat`（Day 28/29 学过），它依赖**标准 UI Message Stream 协议**；`streamText(...).toUIMessageStreamResponse()` 直接吐出该协议，前后端零适配。\n- 流式首字延迟（TTFT）低，长答案体验好（呼应 Day 27）。\n- 检索逻辑与生成解耦：检索是普通 async 函数，先拿到 `context` 字符串再喂给 `streamText`。\n\n> 学习资料（国内可访问镜像，官方 sdk.vercel.ai 可能受限）：Vercel AI SDK 中文文档 Streaming https://ai-sdk.com.cn/docs/ai-sdk-core/generating-text\n\n## 三、后端实现：Next.js Route Handler\n\n```ts\n// app/api/chat/route.ts\nimport { openai } from '@ai-sdk/openai'\nimport { streamText, convertToModelMessages } from 'ai'\nimport { retrieve } from '@/lib/retrieve' // Day 60 的检索函数\n\nexport const maxDuration = 30 // Vercel 流式函数超时\n\nexport async function POST(req: Request) {\n  const { messages } = await req.json()\n\n  // 1. 取最后一条用户问题做检索\n  const lastUser = [...messages].reverse().find((m) => m.role === 'user')\n  const context = lastUser ? await retrieve(lastUser.content) : ''\n\n  // 2. 构造带证据的 System Prompt\n  const system = [\n    '你是一个基于私有知识库作答的助手。',\n    '只使用下面「参考资料」中的内容回答，不要编造。',\n    '如果资料里没有相关信息，明确说「根据现有资料无法回答」。',\n    '',\n    '【参考资料】',\n    context || '（无相关参考资料）',\n  ].join('\\n')\n\n  // 3. 流式生成 + 标准协议返回\n  const result = streamText({\n    model: openai('gpt-4o-mini'),\n    system,\n    messages: convertToModelMessages(messages), // 转成 SDK 内部消息格式\n  })\n\n  return result.toUIMessageStreamResponse()\n}\n```\n\n要点：\n- `convertToModelMessages`：把前端 `useChat` 的 UI Message（`role/content/parts`）转成 SDK 需要的 `ModelMessage`，避免前端/后端消息结构不一致（呼应 Day 28）。\n- `toUIMessageStreamResponse()`：把流自动包成前端可消费的 UI Message Stream，含 `role/parts` 等字段。\n- `maxDuration`：流式函数默认 10s，长答案会被掐断，务必调大。\n\n## 四、检索函数（复用 Day 60）\n\n```ts\n// lib/retrieve.ts\nimport { Pinecone } from '@pinecone-database/pinecone'\nimport { OpenAIEmbeddings } from '@langchain/openai'\n\nexport async function retrieve(question: string, topK = 4): Promise<string> {\n  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })\n  const index = pc.index('kb-demo')\n  const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })\n\n  const queryVec = await embeddings.embedQuery(question)\n  const res = await index.query({\n    topK,\n    vector: queryVec,\n    includeMetadata: true,\n  })\n\n  return res.matches\n    .map((m) => m.metadata?.text as string)\n    .filter(Boolean)\n    .join('\\n\\n---\\n\\n')\n}\n```\n\n## 五、本地联调\n\n用 curl 直接验证流式是否通（无需等前端）：\n\n```bash\ncurl -N -X POST http://localhost:3000/api/chat \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"messages\":[{\"role\":\"user\",\"content\":\"如何重置密码？\"}]}'\n```\n\n能看到逐字吐出即成功。也可在路由里临时 `console.log(context)` 确认检索真的召回了内容。\n\n## 六、常见坑\n\n- **忘记 `convertToModelMessages`**：前端 `useChat` 的 `messages` 含 `parts`，直接传 `streamText({messages})` 会类型报错或行为异常。\n- **System Prompt 没注入上下文**：检索结果拿到却没拼进 `system`，变成纯闲聊，RAG 白做。\n- **`maxDuration` 不够**：长答案到 10s 被截断，出现「回答突然没了」。\n- **检索与生成同模型混用**：检索用 `text-embedding-3-small`，生成用 `gpt-4o-mini`，二者职责不同别搞混（生成模型不能当 embedding 用）。\n- **Key 泄露**：`OPENAI_API_KEY` / `PINECONE_API_KEY` 走 `.env.local`，别提交进仓库。\n- **`toUIMessageStreamResponse` 与手写 `ReadableStream` 混用**：选了 `useChat` 就全程用 SDK 标准协议，别自己再拼 SSE（呼应 Day 27/28）。\n- **官方站不可访问**：学习资料统一用国内镜像 `ai-sdk.com.cn`，不要硬连 `sdk.vercel.ai`。\n\n## 七、今日实践任务\n\n1. 实现 `app/api/chat/route.ts`，接入 Day 60 的 `retrieve`，用 `toUIMessageStreamResponse()` 返回。\n2. 用 curl 联调，确认：① 召回了相关 chunk；② 回答是流式逐字返回；③ 资料无相关内容时回答「无法回答」。\n3. 在 System Prompt 里加一句「用中文回答」，验证注入生效。\n4. 给 `maxDuration` 设为 30，避免长答案被截断。\n\n> 明日（Day 62）用 `useChat` 把这条流渲染成打字机 Chat 界面，项目一「能对话」的骨架就完整了。",
  }
,
  {
    id: "66",
    title: "AI Agent 学习计划 - Day 62：项目一 - 对话界面开发",
    slug: "ai-agent-day62-project1-chat-ui",
    date: "2026-09-01",
    tags: ["AI Agent","实战项目","项目一","对话界面","useChat","Vercel AI SDK UI","流式渲染","学习计划"],
    excerpt: "项目一第六步：用 Vercel AI SDK 的 useChat 把 Day 61 的流式对话 API 渲染成打字机 Chat 界面。这是用户真正「看得见、能对话」的入口，含消息渲染、输入提交、流式打字机、空态处理与组件拆分。",
    readingTime: 15,
    content: "# Day 62：项目一 - 对话界面开发\n\n## 一、目标\n\nDay 61 后端已经能流式返回 UI Message Stream。今天做**前端 Chat 界面**：用 `useChat` 把这股流渲染成带打字机效果的对话窗口，让用户能输入问题、看到逐字生成的回答。\n\n> 链路收口：**前端 useChat 提交 → /api/chat 流式检索+生成（Day61）→ 前端打字机渲染**。做完今天，项目一「能问、能答、能流式」的 MVP 就完整了，Day 63 再补引用溯源。\n\n## 二、为什么用 useChat（而不是手写 fetch + 流解析）\n\n手写流式三大样板（fetch ReadableStream、手动解析 SSE/UI Message、维护 `messages` 状态）在 Day 27/28 踩过。`useChat`（`@ai-sdk/react`）一键包办：\n\n- 自动维护 `messages` 状态 + 打字机增量渲染\n- `handleSubmit` / `input` / `handleInputChange` 开箱即用\n- `status` 暴露 `submitted / streaming / ready / error` 四态，方便做加载/错误/重试\n- `stop()` 支持中断生成（呼应 Day 27 的 `abortSignal`）\n- 与后端 `toUIMessageStreamResponse()` 协议天然对齐\n\n> 学习资料（国内可访问镜像）：Vercel AI SDK UI 中文文档 https://ai-sdk.com.cn/docs/ai-sdk-ui/using-chat\n\n## 三、最小可用：Chat 页面\n\n```tsx\n// app/page.tsx\n'use client' // 必须：useChat 是客户端 Hook\nimport { useChat } from '@ai-sdk/react'\n\nexport default function ChatPage() {\n  const { messages, input, handleInputChange, handleSubmit, status } = useChat()\n\n  return (\n    <div className=\"chat\">\n      <div className=\"messages\">\n        {messages.map((m) => (\n          <div key={m.id} className={`msg ${m.role}`}>\n            <strong>{m.role === 'user' ? '你' : '助手'}：</strong>\n            {m.parts.map((p, i) =>\n              p.type === 'text' ? <span key={i}>{p.text}</span> : null,\n            )}\n          </div>\n        ))}\n        {status === 'submitted' && <div className=\"hint\">思考中…</div>}\n      </div>\n\n      <form onSubmit={handleSubmit}>\n        <input\n          value={input}\n          onChange={handleInputChange}\n          placeholder=\"问问知识库…\"\n        />\n        <button type=\"submit\" disabled={status === 'streaming'}>\n          发送\n        </button>\n      </form>\n    </div>\n  )\n}\n```\n\n## 四、结构化渲染：message.parts 而非 content\n\n新版 SDK 消息正文在 `message.parts`（Day 29 强调过），不要用旧的 `message.content`：\n\n```tsx\n// ChatMessage.tsx\n{message.parts.map((part, i) => {\n  if (part.type === 'text') return <span key={i}>{part.text}</span>\n  // 后续接入工具调用时还能渲染 tool-invocation\n  if (part.type === 'tool-invocation') return <ToolCard key={i} call={part.toolInvocation} />\n  return null\n})}\n```\n\n- `parts` 是有序数组，文本和工具调用混排时能按出现顺序渲染（为 Day 71+ 多 Agent 工具态铺路）。\n- 用 `message.id` 作 key，别用 `index`（重渲染会错位）。\n\n## 五、组件拆分与目录组织\n\n把页面拆小，便于 Day 63 加引用卡片、Day 64 加历史：\n\n```\napp/\n  page.tsx            # 渲染 <Chat/>\n  api/chat/route.ts   # Day 61 的流式 API\ncomponents/\n  Chat.tsx            # 组合 ChatWindow + ChatInput\n  ChatWindow.tsx      # messages 列表 + 滚动到底\n  ChatMessage.tsx     # 单条消息（parts 渲染）\n  ChatInput.tsx       # input + 提交 + 发送中禁用\n```\n\n`Chat.tsx` 持有 `useChat`，向下传 `messages / input / handleSubmit` 等 props，子组件只管展示，逻辑集中、易测试。\n\n## 六、空态 / 加载 / 错误 / 重试\n\n```tsx\nconst { messages, status, error, reload } = useChat()\n\nif (messages.length === 0)\n  return <Empty title=\"试试问：如何重置密码？\" />\n\nif (status === 'streaming') showTypingCursor()   // 打字机光标\nif (status === 'error')                           // 出错给重试\n  return <button onClick={() => reload()}>回答中断，点击重试</button>\n\nif (status === 'submitted') showSpinner()         // 已提交、等待首字\n```\n\n- `status` 四态：`submitted`（已发、等首字）→ `streaming`（流式输出中）→ `ready`（完成）→ `error`（失败）。\n- `reload()` 用同样的输入重新请求，适合「网络抖动 / 回答被截断」时一键重试。\n- 打字机光标：在最后一条 `assistant` 消息尾部加一个 CSS 闪烁 `▍`，视觉上就是逐字输出。\n\n## 七、常见坑\n\n- **漏 `'use client'`**：`useChat` 是客户端 Hook，页面文件顶部必须加，否则报错。\n- **`message.content` 而非 `parts`**：新版 SDK 用 `parts`，读 `content` 拿不到文本或类型不对。\n- **`key={index}`**：消息重排会错位，必须用 `message.id`。\n- **没处理 `status` 四态**：不显示加载/错误，用户以为卡死；用 `reload` 兜底重试。\n- **输入框在 `streaming` 不禁用**：流式中断与输入交叉会乱序，发送中禁用提交。\n- **官方站不可访问**：UI 文档统一用国内镜像 `ai-sdk.com.cn/docs/ai-sdk-ui`，别硬连 `sdk.vercel.ai`。\n- **API 路由未返回 UI Message Stream**：若后端没用 `toUIMessageStreamResponse()`，`useChat` 解析不了，表现为一直 `submitted` 转圈（与 Day 61 配对）。\n\n## 八、今日实践任务\n\n1. 实现 `app/page.tsx` 用 `useChat` 渲染对话，区分 user/assistant 气泡。\n2. 拆出 `ChatWindow / ChatMessage / ChatInput` 三个组件，目录如第五节。\n3. 用 `message.parts` 渲染文本，加打字机光标；根据 `status` 显示「思考中 / 流式 / 错误重试」。\n4. 跑起来：连 Day 61 的 `/api/chat`，输入问题，确认逐字吐字、可中断、出错能 `reload`。\n\n> 明日（Day 63）在 `ChatMessage` 里加 SourceCard，把 Day 59 存进 metadata 的 `source` 展示成「引用溯源」，让回答可查证。",
  }
,
  {
    id: "67",
    title: "AI Agent 学习计划 - Day 63：项目一 - 引用溯源功能",
    slug: "ai-agent-day63-project1-source-citations",
    date: "2026-09-02",
    tags: ["AI Agent","实战项目","项目一","引用溯源","SourceCard","Vercel AI SDK","RAG","学习计划"],
    excerpt: "项目一第七步：在 Day 62 的 Chat 界面里加引用溯源。把 Day 59 写进 metadata 的 source 展示成可点开的 SourceCard，让每个回答都能查证「这句话来自哪份文档的哪一段」，解决 RAG 回答不可信、无法溯源的痛点。",
    readingTime: 15,
    content: "# Day 63：项目一 - 引用溯源功能\n\n## 一、目标\n\nDay 62 让用户能流式对话了，但回答是「裸」的——他不知道答案出自哪份文档。今天加 **引用溯源（Citation / Source Card）**：每个回答下方列出它依据的文档片段（来源文件 + 原文摘录），可点开查看。\n\n> RAG 的核心价值之一是「可溯源、可查证」。没有引用的知识库问答 = 黑盒，用户不敢信。今天把 Day 59 存进 `metadata.source / text` 的价值真正用起来。\n\n## 二、后端：检索时顺带返回 sources\n\n先让 `retrieve` 同时回传「拼进 Prompt 的 context」和「结构化来源列表」：\n\n```ts\n// lib/retrieve.ts\nexport async function retrieve(question: string, topK = 4) {\n  // ... 同 Day 60/61，query 召回 matches\n  const chunks = res.matches\n    .filter((m) => m.metadata?.text)\n    .map((m, i) => ({\n      text: m.metadata!.text as string,\n      source: (m.metadata!.source as string) || '未知来源',\n    }))\n\n  const context = chunks.map((c) => c.text).join('\\n\\n---\\n\\n')\n  const sources = chunks.map((c, i) => ({ id: i + 1, source: c.source, snippet: c.text.slice(0, 200) }))\n  return { context, sources }\n}\n```\n\n## 三、把 sources 随流发回前端\n\nVercel AI SDK v5 用 `createUIMessageStream` 合并文本流 + 自定义 `data-sources` 数据部件：\n\n```ts\n// app/api/chat/route.ts\nimport { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai'\nimport { retrieve } from '@/lib/retrieve'\n\nexport const maxDuration = 30\n\nexport async function POST(req: Request) {\n  const { messages } = await req.json()\n  const lastUser = [...messages].reverse().find((m) => m.role === 'user')\n  const { context, sources } = lastUser ? await retrieve(lastUser.content) : { context: '', sources: [] }\n\n  const system = [\n    '你是基于私有知识库作答的助手，只使用【参考资料】回答，不要编造。',\n    '若资料无相关内容，明确说「根据现有资料无法回答」。',\n    '',\n    '【参考资料】',\n    context || '（无相关参考资料）',\n  ].join('\\n')\n\n  const result = streamText({\n    model: openai('gpt-4o-mini'),\n    system,\n    messages: convertToModelMessages(messages),\n  })\n\n  // 自定义 UI 消息流：先写 sources 数据部件，再合并文本流\n  const stream = createUIMessageStream({\n    execute: ({ writer }) => {\n      writer.write({ type: 'data-sources', data: sources }) // 前端可据此渲染 SourceCard\n      writer.merge(result.toUIMessageStream())\n    },\n  })\n  return createUIMessageStreamResponse({ stream })\n}\n```\n\n> 学习资料（国内可访问镜像）：Vercel AI SDK UI 中文文档 https://ai-sdk.com.cn/docs/ai-sdk-ui ；Vercel AI Chatbot 参考实现 https://github.com/vercel/ai-chatbot\n\n## 四、前端：渲染 SourceCard\n\n在 `ChatMessage` 里读取 `data-sources` 部件并渲染成卡片列表：\n\n```tsx\n// components/SourceCard.tsx\nexport function SourceCard({ sources }: { sources: { id: number; source: string; snippet: string }[] }) {\n  if (!sources?.length) return null\n  return (\n    <div className=\"sources\">\n      <div className=\"sources-title\">📚 引用来源（{sources.length}）</div>\n      {sources.map((s) => (\n        <details key={s.id} className=\"source-item\">\n          <summary>{s.id}. {s.source}</summary>\n          <p>{s.snippet}…</p>\n        </details>\n      ))}\n    </div>\n  )\n}\n```\n\n```tsx\n// ChatMessage.tsx 中\nconst sourcePart = message.parts.find((p) => p.type === 'data-sources')\nreturn (\n  <div className={`msg ${message.role}`}>\n    {message.parts.map((p, i) =>\n      p.type === 'text' ? <span key={i}>{p.text}</span> : null,\n    )}\n    {/* 来源卡片挂在消息底部 */}\n    {sourcePart && 'data' in sourcePart && <SourceCard sources={sourcePart.data as any} />}\n  </div>\n)\n```\n\n## 五、让引用更「扎眼」（进阶）\n\n- **行内引用角标**：让 LLM 在答案里用 `[1][2]` 标注引用编号，前端把编号映射回 `sources` 数组，做成可点击上标（Vercel AI Chatbot 的做法）。\n- **去重**：同一来源被多个 chunk 命中时，按 `source` 去重合并，避免卡片重复。\n- **可点击跳转**：若来源是网页/文档定位，可把 `source` 换成带锚点的链接。\n\n## 六、常见坑\n\n- **只存 text 不存 source**：Day 59 入库时 `metadata` 漏了 `source`，今天 `sources` 全是「未知来源」——入库阶段就该把文件名写进 metadata。\n- **sources 不随流返回**：检索到了却不 `writer.write({type:'data-sources'})`，前端读不到，引用功能「假死」。\n- **`data-sources` 标记 transient**：v5 里数据部件默认会被保留；若误设 `transient:true` 则在流结束后消失，刷新就没了——需要持久展示就别设 transient。\n- **前端用 `content` 读 sources**：sources 是自定义 `data-*` 部件，在 `message.parts` 里、不在 `content`，遍历 parts 按 `type` 过滤。\n- **引用编号和来源对不上**：行内 `[1]` 若让模型自由编号，与 `sources` 数组下标错位，需约定「按检索返回顺序编号」。\n- **官方站不可访问**：资料统一用国内镜像 `ai-sdk.com.cn` 与 `github.com/vercel/ai-chatbot`，别硬连 `sdk.vercel.ai`。\n\n## 七、今日实践任务\n\n1. 改造 `retrieve` 同时返回 `sources`（含 source 文件名 + 摘录），确认 Day 59 入库时 `metadata.source` 已写入。\n2. 在 `route.ts` 用 `createUIMessageStream` 把 `sources` 作 `data-sources` 部件随流返回。\n3. 写 `SourceCard` 组件，在 `ChatMessage` 底部渲染引用列表（用 `<details>` 折叠摘录）。\n4. 跑通：问一个问题，回答下方出现「📚 引用来源 N」，点开能看到对应文档片段。\n\n> 明日（Day 64）做多轮对话上下文管理：让系统记住历史、控制上下文窗口，避免长对话爆 token。",
  }
,
  {
    id: "68",
    title: "AI Agent 学习计划 - Day 64：项目一 - 多轮对话上下文管理",
    slug: "ai-agent-day64-project1-multi-turn-context",
    date: "2026-09-03",
    tags: ["AI Agent","实战项目","项目一","多轮对话","上下文管理","上下文窗口","记忆","学习计划"],
    excerpt: "项目一第八步：让知识库问答记住前文、又不爆 token。useChat 默认会带着完整历史请求后端，但长对话会撑爆上下文窗口并产生检索噪声。今天讲服务端窗口截断、摘要压缩、按 session 隔离、每轮重新检索四大策略。",
    readingTime: 15,
    content: "# Day 64：项目一 - 多轮对话上下文管理\n\n## 一、目标\n\nDay 62/63 已经能流式对话 + 引用溯源，但都假设「单轮」。真实用户会追问：「刚才那份文档的第 2 节讲了什么？」「那它和另一份冲突吗？」\n\n今天解决 **多轮上下文管理**：让系统记得前文（连贯），又别让对话无限变长把上下文窗口撑爆（成本 + 噪声）。\n\n> 呼应：Day 24/52 的 Memory 模块（Buffer/Summary）在这里落地为「服务端历史裁剪」。\n\n## 二、默认行为：useChat 已经帮你带历史\n\n`useChat` 在前端维护 `messages` 数组，每次 `handleSubmit` 会把**完整历史**发给 `/api/chat`。所以「记住前文」几乎免费——后端 `messages` 里天然有前几轮。\n\n但问题是：**历史会无限增长**。第 20 轮时，Prompt 里塞了前 19 轮全文 + 每轮检索到的 chunk，token 爆炸、检索噪声上升、回答变慢变贵。\n\n## 三、策略一：服务端窗口截断（最实用）\n\n后端不迷信前端给的「完整历史」，只保留最近 N 轮，并**每轮重新检索**新鲜上下文：\n\n```ts\n// app/api/chat/route.ts\nexport async function POST(req: Request) {\n  const { messages } = await req.json()\n\n  // 1. 每轮重新检索（不要复用历史里的旧 context，避免漂移）\n  const lastUser = [...messages].reverse().find((m) => m.role === 'user')\n  const { context, sources } = lastUser ? await retrieve(lastUser.content) : { context: '', sources: [] }\n\n  // 2. 只保留最近 6 条消息，控制上下文窗口\n  const recent = messages.slice(-6)\n  const modelMessages = convertToModelMessages(recent)\n\n  const system = [\n    '你是基于私有知识库作答的助手，只使用【参考资料】，不要编造。',\n    '',\n    '【参考资料】',\n    context || '（无相关参考资料）',\n  ].join('\\n')\n\n  const result = streamText({ model: openai('gpt-4o-mini'), system, messages: modelMessages })\n  // ... 同 Day 63 用 createUIMessageStream 把 sources 随流返回\n  const stream = createUIMessageStream({\n    execute: ({ writer }) => {\n      writer.write({ type: 'data-sources', data: sources })\n      writer.merge(result.toUIMessageStream())\n    },\n  })\n  return createUIMessageStreamResponse({ stream })\n}\n```\n\n窗口大小经验值：6–10 轮。太小会「健忘」，太大浪费 token。\n\n## 四、策略二：摘要压缩（窗口外的内容别直接丢）\n\n窗口之外的老对话，与其一刀切丢弃，不如**用 LLM 压缩成摘要**拼回 system（呼应 Day 24 Summary Memory）：\n\n```ts\n// 当 messages 超过窗口，把旧的部分先 summary 一次\nasync function compact(messages: any[]): Promise<string> {\n  const old = messages.slice(0, -6)\n  if (old.length === 0) return ''\n  const { text } = await generateText({\n    model: openai('gpt-4o-mini'),\n    prompt: `用 3 句话总结以下对话要点（保留关键事实与待办）：\\n${old.map((m) => `${m.role}: ${m.content}`).join('\\n')}`,\n  })\n  return text\n}\n// system 里加：`【对话摘要】\\n${summary}`\n```\n\n## 五、策略三：按 session 隔离（多用户不串号）\n\n生产环境必须按 `sessionId` 区分用户，否则 A 的历史混进 B 的对话。最简单：前端在请求里带 `body: { id }`，后端用内存/Redis 按 id 存历史；本项目用 `useChat` 默认前端内存即可，但部署多实例时要外置存储。\n\n```ts\nconst { messages, id } = await req.json() // id = 会话 id\n// 真实项目应：history = await store.get(id); store.set(id, [...history, newMsg])\n```\n\n## 六、四大策略选型\n\n| 策略 | 解决什么 | 成本 | 适用 |\n|------|----------|------|------|\n| 默认带全历史 | 基础连贯 | 高（线性增长） | 演示/短对话 |\n| 窗口截断 | 爆 token / 噪声 | 低 | ✅ 项目一首选 |\n| 摘要压缩 | 健忘 + 成本 | 中（每轮一次总结） | 长对话产品 |\n| session 隔离 | 多用户串号 | 低 | 必须做 |\n\n> 学习资料（国内可访问镜像）：LangChain JS 记忆中文文档 https://js.langchain.com.cn/docs/ ；菜鸟教程 AI Agent 系列 https://www.runoob.com/ai-agent/ai-agent-tutorial.html\n\n## 七、常见坑\n\n- **前端带全历史、后端不裁剪**：第 30 轮直接超出 `gpt-4o-mini` 上下文（128k 也会慢/贵），回答被截断或报错。\n- **把检索 context 写进历史**：旧 chunk 被当成「用户说过的话」反复喂给模型，产生检索漂移；正确做法是**每轮重新 retrieve**，历史只留用户/助手对话。\n- **窗口裁剪后 system 漏掉最新指令**：窗口只切 `messages`，但 `system`（含参考资料）每轮都重建，别把 system 也切了。\n- **丢 system / 角色顺序错乱**：`convertToModelMessages` 前确保 system 单独传、messages 是 user/assistant 交替。\n- **多用户共用一个 messages 数组**：本地演示无所谓，部署时必须按 sessionId 隔离。\n- **官方站不可访问**：记忆文档统一用国内镜像 `js.langchain.com.cn`，别硬连 `js.langchain.com`。\n\n## 八、今日实践任务\n\n1. 在 `route.ts` 加「最近 6 条窗口截断」+「每轮重新 retrieve」，验证第 10 轮追问仍能基于最新问题检索、且 token 不再无限增长。\n2. （进阶）给窗口外的旧消息加一次 `compact()` 摘要，拼进 system 的「对话摘要」段，对比「直接截断」的连贯度。\n3. 多轮追问测试：「这份文档讲了什么？」→「它的第 2 节呢？」确认能接住指代。\n4. 给 `useChat` 传 `id` 模拟多会话，确认历史不串号。\n\n> 明日（Day 65）做项目一的测试与优化：用 Vitest 给 retrieve / route 写单测，顺带做流式与检索的性能优化。",
  }
,
  {
    id: "69",
    title: "AI Agent 学习计划 - Day 65：项目一 - 测试与优化",
    slug: "ai-agent-day65-project1-testing-optimization",
    date: "2026-09-04",
    tags: ["AI Agent","实战项目","项目一","测试","Vitest","性能优化","RAG","学习计划"],
    excerpt: "项目一第九步：用 Vitest 给 RAG 链路写单测（mock 掉真实 LLM/向量库），并做流式与检索的性能优化。让「能跑」变成「跑得稳、跑得快」，是项目从 demo 走向可用的一道分水岭。",
    readingTime: 15,
    content: "# Day 65：项目一 - 测试与优化\n\n## 一、目标\n\nDay 57-64 把项目一的 RAG 全链路（上传→切分→入库→检索→流式→引用→多轮）都打通了。今天做两件事让它从「能跑的 demo」变成「可信赖的产品」：\n\n1. **测试**：用 Vitest 给 `retrieve`、切分、`/api/chat` 写单测，**mock 掉真实 LLM 与向量库**，避免又慢又烧钱又 flaky。\n2. **优化**：降低流式首字延迟（TTFT）、缓存 Embedding、复用客户端单例、控制批量并发。\n\n> 学习资料（国内可访问）：Vitest 中文文档 https://cn.vitest.dev/ ；Vitest 官方 https://vitest.dev/\n\n## 二、为什么必须 mock 外部依赖\n\n真实测试直接调 OpenAI + Pinecone 会：① 每次花真钱 ② 网络抖动导致随机失败 ③ 慢（一次几秒）。单测要的是「确定性 + 毫秒级」。\n\nVitest 配合 `ai` 包提供的 `MockLanguageModelV1` 可伪造模型；向量库用内存版 `MemoryVectorStore` 或手写 stub。\n\n## 三、单测 1：retrieve 函数（用内存向量库）\n\n```ts\n// lib/retrieve.test.ts\nimport { describe, it, expect } from 'vitest'\nimport { MemoryVectorStore } from 'langchain/vectorstores/memory'\nimport { OpenAIEmbeddings } from '@langchain/openai'\nimport { retrieve } from './retrieve' // 改造：retrieve 接收 store 参数便于注入\n\ndescribe('retrieve', () => {\n  it('返回 context 与 sources', async () => {\n    const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })\n    const store = await MemoryVectorStore.fromTexts(\n      ['密码重置步骤：进入设置-安全-重置。', '退款政策：7天内可申请。'],\n      [{ source: '手册A.md' }, { source: '手册B.md' }],\n      embeddings,\n    )\n    const { context, sources } = await retrieve(store, '如何重置密码？')\n    expect(context).toContain('重置')\n    expect(sources[0].source).toBe('手册A.md')\n  })\n\n  it('无相关内容时 sources 为空', async () => {\n    const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' })\n    const store = await MemoryVectorStore.fromTexts(['天气晴。'], [{ source: 'x' }], embeddings)\n    const { sources } = await retrieve(store, '如何退款？')\n    expect(sources.length).toBe(0)\n  })\n})\n```\n\n> 注：把 `retrieve` 改成「接收 vectorStore 参数」而非内部硬编码 new Pinecone，是**依赖注入**的关键一步，测试才好注入内存库（呼应项目工程化 Day 4）。\n\n## 四、单测 2：/api/chat 路由（mock 模型）\n\n```ts\n// app/api/chat/route.test.ts\nimport { describe, it, expect, vi } from 'vitest'\nimport { MockLanguageModelV1 } from '@ai-sdk/provider/test'\n\n// 伪造一个固定回字的模型\nconst mockModel = new MockLanguageModelV1({ defaultObjectGenerationModelId: 'mock' })\n\n// mock './retrieve' 返回固定 sources，避免真检索\nvi.mock('@/lib/retrieve', () => ({\n  retrieve: async () => ({ context: 'FAKE_CTX', sources: [{ id: 1, source: 's.md', snippet: 'x' }] }),\n}))\n\ndescribe('POST /api/chat', () => {\n  it('返回带 sources 的 UI Message Stream', async () => {\n    const res = await POST(new Request('http://localhost/api/chat', {\n      method: 'POST',\n      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),\n    }))\n    expect(res.status).toBe(200)\n    expect(res.headers.get('content-type')).toContain('text/plain') // UI stream 协议\n  })\n})\n```\n\n## 五、优化点\n\n| 优化项 | 做法 | 收益 |\n|--------|------|------|\n| Embedding 缓存 | 相同 query/chunk 的向量结果记 Map 或 Redis | 省 API 调用、降延迟 |\n| 客户端单例 | `pinecone` / `embeddings` 模块级 `let instance` 复用 | 避免每请求重连 |\n| 批量 embedDocuments | 切分后一次性 `embedDocuments(chunks)` | 比逐个快数倍（Day 59） |\n| 并发控制 | 批量入库用 `pLimit` 限并发（如 10） | 防触发 Pinecone 限流 |\n| 降 TTFT | system 精简 + 提前 retrieve + 流式首字即吐 | 用户感知更快 |\n| topK 调参 | 3–5 之间按命中率调 | 召回质量/噪声平衡 |\n\n```ts\n// lib/singleton.ts —— 客户端单例，防每请求重建\nimport { Pinecone } from '@pinecone-database/pinecone'\nlet _pc: Pinecone | null = null\nexport const getPinecone = () => (_pc ??= new Pinecone({ apiKey: process.env.PINECONE_API_KEY! }))\n```\n\n## 六、常见坑\n\n- **测试直连真实 API**：又慢又烧钱又随机失败，CI 跑崩；务必 mock 模型与向量库。\n- **`retrieve` 硬编码 `new Pinecone`**：无法注入测试用的内存库——先改成依赖注入（传 store）。\n- **只测「返回 200」不断言内容**：要断言 `context` 含关键词、`sources` 非空，才有意义。\n- **Embedding 不缓存**：相同问题反复 embed，浪费且拖慢。\n- **每请求 new Pinecone 客户端**：连接开销累积，高并发直接挂；用单例。\n- **过早优化**：先写测试锁住行为，再针对性优化，别一上来就搞复杂缓存。\n- **官方站不可访问**：Vitest 文档用国内镜像 `cn.vitest.dev`，别硬连 `vitest.dev`（若受限）。\n\n## 七、今日实践任务\n\n1. 给 `retrieve` 做依赖注入改造（接收 vectorStore），写 2 个单测（命中 / 未命中）。\n2. 用 `MockLanguageModelV1` + `vi.mock('@/lib/retrieve')` 给 `/api/chat` 写路由测试，断言返回 UI Message Stream。\n3. 抽出 `getPinecone()` / `getEmbeddings()` 单例，验证连续请求不再重建客户端。\n4. （进阶）给切分函数加测试，校验 chunkSize/overlap 边界；给 Embedding 加一层 Map 缓存。\n\n> 明日（Day 66）做项目一部署与文档：Next.js 部署到 Vercel + 写 README，让项目一可对外交付。",
  }
]
