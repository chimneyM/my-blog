---
id: "27"
title: "AI Agent 学习计划 Day 23：LangChain.js Agents（下）— 自定义 Agent 与 initializeAgentExecutorWithOptions"
slug: "ai-agent-day23-langchain-agents-lower"
date: "2026-07-24"
tags: ["AI Agent", "LangChain", "Agents", "CustomAgent", "AgentExecutor", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第二十三天。在昨天 ReAct / Tool 调用的基础上，深入「自定义 Agent」：对比旧式 initializeAgentExecutorWithOptions 与现代 LCEL 工厂函数、自定义 Agent 类型与 prompt、控制 AgentExecutor 行为（maxIterations / handleParsingErrors / returnIntermediateSteps / verbose），并给出一个自定义 prompt + 自定义工具编排的完整实战。"
readingTime: 35
---

# AI Agent 学习计划 Day 23：LangChain.js Agents（下）

> 📅 日期：2026-07-24  
> 🎯 阶段二：核心框架（Day 15-35）  
> 📊 学习进度：Day 23 / 84（27.4%）

## 前言

昨天我们用 `createReactAgent` / `createToolCallingAgent` + `AgentExecutor` 跑通了第一个能自主调用工具的 Agent。但「开箱即用」的 Agent 往往不够：你可能想换一套 system prompt、限制最大循环次数、在解析失败时自动重试、或者拿到中间步骤做前端展示。

今天聚焦**自定义 Agent**——如何掌控 Agent 的「大脑（prompt）」和「运行器（AgentExecutor）」的每一个旋钮。

## 一、两条路线：旧式 vs 现代

LangChain.js 历史上有两套创建 Agent 的方式，理解区别能避免踩兼容性坑：

| 方式 | API | 特点 |
|------|-----|------|
| 旧式 | `initializeAgentExecutorWithOptions(tools, llm, options)` | 一行创建，内部按 `agentType` 选模板；黑盒、定制性弱 |
| 现代 | `createXxxAgent(...)` + `new AgentExecutor({...})` | 显式构造，prompt/工具/参数全可控；推荐 |

### 旧式：`initializeAgentExecutorWithOptions`

```ts
import { initializeAgentExecutorWithOptions } from "langchain/agents";

const executor = await initializeAgentExecutorWithOptions(tools, llm, {
  agentType: "openai-functions", // 或 "chat-zero-shot-react-description" / "openai-tools"
  verbose: true,
});

const res = await executor.invoke({ input: "北京今天天气怎么样？" });
```

常见 `agentType`：
- `"chat-zero-shot-react-description"`：基于 ReAct 文本提示，兼容任意 chat 模型。
- `"openai-functions"`：走 OpenAI function calling（旧）。
- `"openai-tools"`：走 OpenAI 原生 tool calling（新，推荐）。

> ⚠️ 旧式 API 在新版 LangChain 中已被标记**弃用（deprecated）**，新项目请用现代工厂函数。但老代码里大量出现，看懂即可。

## 二、自定义 AgentExecutor 行为

无论用哪种方式创建 `AgentExecutor`，都能通过参数精细控制运行：

```ts
const executor = new AgentExecutor({
  agent,
  tools,
  verbose: true,                  // 打印 Thought/Action/Observation
  maxIterations: 6,              // 最多循环 6 步，防止死循环
  returnIntermediateSteps: true, // 返回中间步骤，便于前端展示
  handleParsingErrors: true,     // 模型输出格式错误时自动尝试纠正
});
```

`returnIntermediateSteps: true` 时，结果会多一个 `intermediateSteps` 字段：

```ts
const res = await executor.invoke({ input: "..." });
res.output;               // 最终答案
res.intermediateSteps;    // [{ action, observation }, ...]
```

这对**前端可视化 Agent 思考过程**（如展示「我先查了天气，又算了数学」）非常有用。

### 进阶：`handleParsingErrors` 自定义

```ts
const executor = new AgentExecutor({
  agent,
  tools,
  handleParsingErrors:
    "工具调用格式错误，请严格按要求返回 Action 和 Action Input。",
});
```

当 LLM 返回无法解析的内容时，这段提示会被塞回给模型，让它自我纠正——大幅提升健壮性。

## 三、自定义 Prompt（Agent 的大脑）

Agent 的 prompt 决定了它的「性格」和行为规则。现代方式下，你可以完全自定义：

```ts
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

const customPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是一个「严谨的中文科研助手」。
     - 只在有工具能提供事实时才调用工具，禁止编造。
     - 所有数字必须来自工具结果。
     - 用中文、分点作答，并在结尾标注「来源」。
     当前日期：{today}`,
  ],
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const agent = createToolCallingAgent({
  llm,
  tools,
  prompt: customPrompt,
});
```

注意 system prompt 里引用了 `{today}` 这类外部变量时，需要在 `invoke` 时一并传入：

```ts
const res = await executor.invoke({
  input: "2024 诺奖物理学奖得主是谁？",
  today: "2026-07-24",
});
```

## 四、自定义工具编排实战

把计算器升级成「带安全解析」的自定义工具，并配自定义 Agent：

```ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { evaluate } from "mathjs"; // 安全的表达式计算库

const safeCalc = tool(
  async ({ expression }) => {
    try {
      const r = evaluate(expression);
      return `计算结果：${r}`;
    } catch (e) {
      return `计算失败：${e.message}`;
    }
  },
  {
    name: "safe_calculator",
    description: "安全地计算数学表达式，支持 + - * / ^ 等，如 '1+2*3'。",
    schema: z.object({ expression: z.string() }),
  }
);

const agent = createToolCallingAgent({
  llm,
  tools: [safeCalc],
  prompt: customPrompt,
});
const executor = new AgentExecutor({
  agent,
  tools: [safeCalc],
  verbose: true,
  maxIterations: 5,
  returnIntermediateSteps: true,
});

const res = await executor.invoke({
  input: "帮我算 (1+2)*3 等于多少？",
  today: "2026-07-24",
});
console.log(res.output);
console.log("思考轨迹：", res.intermediateSteps);
```

## 五、常见坑

1. **旧式 `initializeAgentExecutorWithOptions` 已弃用** → 新代码用 `createXxxAgent` + `AgentExecutor`，避免未来升级报错。
2. **`agent_scratchpad` 占位符必须有** → 自定义 prompt 漏掉 `MessagesPlaceholder("agent_scratchpad")` 会导致 Agent 无法记录中间步骤而崩溃。
3. **`maxIterations` 设太大** → 可能让模型无限循环烧 token；一般 5~8 即可，简单任务 3 也够。
4. **`returnIntermediateSteps` 忘开启** → 前端想展示思考链却拿不到 `intermediateSteps`，调试也变难。
5. **自定义 prompt 引用了未传变量** → 如 `{today}` 但 invoke 没给，会抛「Missing variable」错误；要么用 `prompt.partial()` 预设，要么每次 invoke 补齐。
6. **`handleParsingErrors` 设成 false** → 一旦 LLM 输出格式异常就直接抛错，体验差；生产建议开启或给自定义提示。
7. **重复注册同一工具名** → 工具 `name` 必须唯一，否则 Agent 调用歧义。

## 六、今日小结

- 旧式 `initializeAgentExecutorWithOptions`（含 `agentType`）已被官方弃用，新项目一律用 `createXxxAgent` + `AgentExecutor`。
- `AgentExecutor` 关键旋钮：`maxIterations` 防死循环、`handleParsingErrors` 自动纠错、`returnIntermediateSteps` 拿思考轨迹、`verbose` 看过程。
- 自定义 prompt 是定制 Agent 行为的最强手段，记得保留 `agent_scratchpad` 占位符，并补齐引用的外部变量。

---

🔗 **学习资料与网站**（均为国内可访问镜像）：
- LangChain JS/TS 中文文档：https://js.langchain.com.cn/docs/
- LangChain 中文文档（自定义 Agent）：https://langchain-doc.cn/v1/python/langchain/custom_agents.html
- LangChain 中文网 AgentExecutor 指南：https://langchain.nodejs.cn/docs/concepts/agents/
- js.langchain.ac.cn 自定义 Agent 教程：https://js.langchain.ac.cn/docs/tutorials/agents/
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html
- ReAct Agent 终极指南（掘金）：https://juejin.cn/post/7518707715129688064

💡 **学习建议**：
- 把昨天的 Agent 改造一下：加一个 `maxIterations: 4` 和 `returnIntermediateSteps: true`，跑到前端能看到「思考轨迹」为止——这是后续做 Agent UI 的基础。
- 故意把 `agent_scratchpad` 占位符删掉跑一次，亲眼看看报错，比看文档记得牢。
- 尝试给 Agent 写一套「严谨科研助手」prompt（像本文第三节），对比默认 prompt 的回答差异，体会 prompt 即「性格」。

⏰ 预计学习时长：2 小时

---

进度：Day 23 / 84（27.4%）  
下一站：Day 24 —— LangChain.js Memory（上）：Buffer Memory 与 Summary Memory
