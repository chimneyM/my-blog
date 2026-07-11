# AI Agent 学习计划 Day 10：AI Agent 概念 — Agent 定义与 LLM

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

```
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
```

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

```
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
```

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

```
Chatbot：用户 → 提问 → LLM → 生成文本 → 返回给用户
         （LLM 只「说」，不「做」）

Agent：  用户 → 目标 → LLM[感知→决策→行动] → 调用工具 → 观察 → 再决策 → ... → 达成目标
         （LLM 既「说」又「做」，能改变外部世界）
```

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

```
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
```

### 2.2 LLM 的工作原理简述

理解 LLM 如何作为大脑工作，需要简单了解其核心原理：

```
LLM 的本质：下一个 Token 预测器

输入: "今天天气很好，我想去"
LLM:  P(下一个词) = { "公园": 0.35, "散步": 0.20, "爬山": 0.15, ... }
输出: "公园"

但这看似简单的「预测下一个词」，在规模化后涌现出了惊人的能力：
- 推理能力（Chain-of-Thought）
- 指令遵循能力（Instruction Following）
- 工具使用能力（Function Calling）
- 规划能力（Planning）
```

**Token 预测如何变成「智能」？**

```
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
```

这就是 LLM 作为大脑的「思考」过程——每一步都是在预测下一个最合理的 Token。

### 2.3 LLM 在 Agent 中的角色

LLM 在 Agent 系统中承担多个角色：

```
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
```

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

```
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
```

#### 1. 感知（Perception）— Agent 的「眼睛」

感知模块负责从环境中获取信息：

```typescript
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
```

感知的来源：
- **用户输入**：自然语言指令、反馈、澄清
- **工具返回**：API 响应、搜索结果、代码执行输出
- **环境状态**：时间、文件系统、数据库状态
- **历史上下文**：之前的对话和操作记录

#### 2. 大脑（Brain / LLM）— Agent 的「核心」

大脑模块以 LLM 为核心，负责推理、规划和决策：

```typescript
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
```

大脑的核心能力：
- **推理**：分析感知到的信息，理解当前状态
- **规划**：将目标分解为可执行的步骤
- **决策**：选择最合适的下一步行动
- **反思**：评估行动结果，调整策略

#### 3. 行动（Action）— Agent 的「手」

行动模块负责执行大脑决策的动作：

```typescript
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
```

#### 4. 记忆（Memory）— Agent 的「记忆系统」

记忆模块负责存储和管理信息：

```typescript
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
```

记忆的三个层次：

| 记忆类型 | 类比 | 实现方式 | 容量 | 持久性 |
|---------|------|---------|------|--------|
| **短期记忆** | 工作记忆（当前在想什么） | LLM 上下文窗口 | 有限（几K-几百K Token） | 会话内 |
| **工作记忆** | 草稿本（记录中间过程） | Scratchpad / 状态对象 | 可变 | 任务内 |
| **长期记忆** | 长期记忆（过去的经验） | 向量数据库 + 摘要 | 无限 | 永久 |

### 3.2 Agent 的工作循环

Agent 的核心运行机制是一个**感知-决策-行动**的循环：

```
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
```

用代码表示这个循环：

```typescript
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
```

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

```
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
```

在 Agent 中，思维链让 LLM 在决定行动前先「思考」：

```typescript
const systemPrompt = `你是一个 AI Agent。在采取行动前，请先思考：

格式：
Thought: 我需要思考当前情况...
Action: 我决定调用工具 xxx
Action Input: {"param": "value"}

或者当你认为任务完成时：
Thought: 任务已完成，因为...
Final Answer: 最终答案
`

// LLM 的输出示例：
// Thought: 用户想知道明天的天气，我需要调用天气查询工具
// Action: get_weather
// Action Input: {"city": "北京", "date": "tomorrow"}
```

#### ReAct 模式（Reasoning + Acting）

ReAct 是 Agent 最经典的范式——**推理与行动交替进行**：

```
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
```

ReAct 的核心价值：
- **可解释**：每一步都有明确的推理过程
- **可纠错**：观察到错误结果后能调整策略
- **高效**：只在需要时调用工具，避免不必要的行动

### 4.2 规划能力（Planning）

规划是将复杂目标分解为可执行步骤的能力：

#### 任务分解（Task Decomposition）

```
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
```

#### 动态重规划（Dynamic Replanning）

Agent 能根据执行反馈动态调整计划：

```typescript
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
```

### 4.3 工具使用能力（Tool Use）

工具使用是 Agent 区别于 Chatbot 的核心特征。

#### Function Calling / Tool Calling

现代 LLM（GPT-4、Claude 等）原生支持 Function Calling：

```typescript
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
```

#### 工具调用的完整流程

```
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
```

### 4.4 记忆能力（Memory）

记忆让 Agent 能跨越单次对话的限制：

```
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
```

```typescript
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
      { role: 'system', content: `之前的对话摘要：${summary}` },
      ...recentMessages
    ]
  }

  // 从长期记忆中检索相关信息
  async recall(query: string): Promise<string[]> {
    const results = await this.longTerm.similaritySearch(query, 5)
    return results.map(r => r.text)
  }
}
```

---

## 五、LLM API 基础 — Agent 的通信协议

### 5.1 OpenAI Chat Completions API

Agent 与 LLM 的通信通过 API 完成。以下是最基础的 Chat Completions API 调用：

```typescript
// 最基础的 LLM 调用
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
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
```

### 5.2 消息角色（Message Roles）

Chat Completions API 中的消息有不同角色：

```typescript
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
```

### 5.3 关键参数详解

```typescript
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
```

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

```
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
```

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

```typescript
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
            console.log(`🔧 调用工具: ${tool.name}`)
            const args = JSON.parse(toolCall.function.arguments)
            const result = await tool.execute(args)
            console.log(`📋 工具结果: ${result.substring(0, 100)}...`)

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
          content: `你是一个 AI Agent。你可以使用以下工具来完成任务：
${this.tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

请根据用户需求，决定是否需要调用工具。如果需要，调用合适的工具；
如果已有足够信息回答，直接给出最终答案。`
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
        'Authorization': `Bearer ${this.apiKey}`
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
        return `计算结果: ${result}`
      } catch {
        return '计算失败：无效的表达式'
      }
    }
  },
  {
    name: 'get_current_time',
    description: '获取当前时间',
    execute: async () => {
      return `当前时间: ${new Date().toLocaleString('zh-CN')}`
    }
  }
]

// 创建并运行 Agent
const agent = new MiniAgent(process.env.OPENAI_API_KEY!, tools)

const result = await agent.run('现在是几点？然后帮我算一下 123 * 456 + 789')
console.log('Agent 回复:', result)
```

### 7.2 Agent 的运行流程

```
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
```

这个最简 Agent 展示了 Agent 的核心机制：
1. **LLM 作为大脑**：决定调用什么工具
2. **工具作为手脚**：执行具体操作
3. **消息作为记忆**：维护上下文
4. **循环作为生命**：感知→决策→行动→观察→再决策

---

## 八、Agent 的应用场景

### 8.1 典型应用场景

```
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
```

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

```
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
```

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
