---
id: "26"
title: "AI Agent 学习计划 Day 22：LangChain.js Agents（上）— ReAct Agent 与 Tool 调用"
slug: "ai-agent-day22-langchain-agents-upper"
date: "2026-07-23"
tags: ["AI Agent", "LangChain", "Agents", "ReAct", "ToolCalling", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第二十二天。正式进入 LangChain.js 的 Agents 模块：理解 ReAct（推理 + 行动）范式如何让 LLM 自主决定调用哪个工具、如何把 Thought/Action/Observation 串成循环，并用 createReactAgent / createToolCallingAgent + AgentExecutor 跑通第一个会查天气、会算数学的 Agent。"
readingTime: 34
---

# AI Agent 学习计划 Day 22：LangChain.js Agents（上）

> 📅 日期：2026-07-23  
> 🎯 阶段二：核心框架（Day 15-35）  
> 📊 学习进度：Day 22 / 84（26.2%）

## 前言

前面四天我们学了 Model I/O、Retrieval、Chains——但那都是「你先设计好流程，模型照着走」。真正的 Agent 能**自己决定**下一步做什么：该查资料就查资料，该算数就调计算器。

这一切的核心范式就是 **ReAct**（Reasoning + Acting）。今天是 Agents 模块的上半场：搞懂 ReAct 原理，并跑通第一个会调用工具的 Agent。

## 一、为什么需要 Agent？

链（Chain）是「写死的流程图」：输入 → 固定步骤 → 输出。它能处理流程可预期的任务，但面对「不知道需要几步、用哪个工具」的问题就抓瞎了。

Agent 把决策权交给 LLM：每次循环，模型根据当前状态和可用工具，**自己决定**调用哪个工具、传什么参数，再用工具返回的结果继续思考，直到能给出最终答案。

```
用户问题
   │
   ▼
┌─────────── Agent Loop ───────────┐
│  Thought：我需要查天气             │
│  Action：call_weather(city=北京)   │
│  Observation：北京 28°C 晴         │
│  Thought：够了，可以回答           │
│  → Final Answer                   │
└──────────────────────────────────┘
```

## 二、ReAct 范式三要素

ReAct 把模型的输出格式化成：

- **Thought（思考）**：模型对当前情况的推理，比如「用户问北京天气，我应该调用天气工具」。
- **Action（行动）**：要调用的工具名 + 参数，如 `weather(city="北京")`。
- **Observation（观察）**：工具执行后返回的结果，再喂回模型作为下一步思考的依据。

这种「Thought → Action → Observation」的循环，正是我们 Day 12 学过的 Function Calling 与 Day 13 学过的 ReAct 规划模式的落地。

## 三、在 LangChain.js 中定义工具

工具是 Agent 与世界交互的「手」。用 `@langchain/core` 的 `tool` 装饰器 + Zod 定义最简洁：

```ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const calculator = tool(
  async ({ expression }) => {
    // 简化示例：真实场景用安全表达式库（如 mathjs evaluate）
    return String(eval(expression));
  },
  {
    name: "calculator",
    description: "计算数学表达式，如 2+3*4",
    schema: z.object({ expression: z.string() }),
  }
);

const weather = tool(
  async ({ city }) => {
    // 真实场景调用天气 API
    return `${city} 今天 28°C，晴`;
  },
  {
    name: "weather",
    description: "查询指定城市的当前天气",
    schema: z.object({ city: z.string() }),
  }
);

const tools = [calculator, weather];
```

工具三要素：**name**（唯一标识）、**description**（模型靠它选工具，务必写清用途与参数）、**schema**（Zod 校验入参）。

## 四、用 createReactAgent + AgentExecutor 跑通

现代 LangChain.js（v0.2+）推荐用工厂函数 + `AgentExecutor`：

```ts
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent, AgentExecutor } from "langchain/agents";
import { pull } from "langchain/hub";

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

// 拉取官方 ReAct prompt 模板（或用自定义 prompt）
const prompt = await pull<ChatPromptTemplate>("hwchase17/react");

const agent = await createReactAgent({ llm, tools, prompt });

const executor = new AgentExecutor({ agent, tools, verbose: true });

const res = await executor.invoke({
  input: "北京今天天气怎么样？如果温度高于 25 度，告诉我需要带几瓶水（每人 1 瓶/10 度）",
});
console.log(res.output);
```

`verbose: true` 会在控制台打印完整的 Thought/Action/Observation，非常适合理解 Agent 的「思考过程」。

## 五、更现代的写法：createToolCallingAgent

如果你的模型支持原生 tool calling（如 GPT-4o、Claude），用 `createToolCallingAgent` 比 ReAct 文本解析更稳定、更高效——它直接走 Function Calling 协议，不需要模型输出可被正则解析的文本：

```ts
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个乐于助人的助手，善用工具回答问题。"],
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const agent = createToolCallingAgent({ llm, tools, prompt });
const executor = new AgentExecutor({ agent, tools, verbose: true });
```

## 六、常见坑

1. **工具 description 太含糊** → 模型选错工具或乱传参。描述要写清「做什么、何时用、参数含义」。
2. **`agent_scratchpad` 占位符必须有** → 自定义 prompt 漏掉它，Agent 无法记录中间步骤会报错。
3. **ReAct 文本解析脆弱** → 模型偶尔输出不合规格式会解析失败；能用 `createToolCallingAgent` 就优先用它。
4. **死循环** → 模型一直调工具不收敛。`AgentExecutor` 可设 `maxIterations`（默认 15）兜底。
5. **过度调用工具** → 简单问题也去查工具浪费 token，可在 system prompt 里约束「能直接回答就别调工具」。
6. **Zod schema 与实际不符** → 模型传的参数过不了校验会抛错，需 `handleParsingErrors` 配合兜底。

## 七、今日小结

- Agent = 把「调用哪个工具、何时停」的决策权交给 LLM，核心是 ReAct 循环（Thought→Action→Observation）。
- 工具用 `tool()` + Zod 定义，name/description/schema 三者缺一不可。
- 现代写法：`createReactAgent` / `createToolCallingAgent` + `AgentExecutor`，`verbose` 看思考过程。
- 能用原生 tool calling 的模型优先 `createToolCallingAgent`，更稳更高效。

---

🔗 **学习资料与网站**（均为国内可访问镜像）：
- LangChain JS/TS 中文文档：https://js.langchain.com.cn/docs/
- LangChain 中文文档（Agents 模块）：https://langchain-doc.cn/v1/python/langchain/agents.html
- LangChain 中文网 Agents 指南：https://langchain.nodejs.cn/docs/concepts/agents/
- js.langchain.ac.cn  Agents 教程：https://js.langchain.ac.cn/docs/tutorials/agents/
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html
- ReAct Agent 原理与实战（腾讯云）：https://cloud.tencent.com/developer/article/2571430

💡 **学习建议**：
- 今天务必本地跑通那个天气 + 计算器的 Agent，把 `verbose` 打开，亲眼看看 Thought/Action/Observation 是怎么循环的——这是理解 Agent 的「顿悟时刻」。
- 先别急着上 `createToolCallingAgent`，用 ReAct 文本版更能体会「模型在生成结构化计划」这件事。
- 工具 description 一定要认真写，可以故意把描述写差再跑一次，对比模型选工具的差异。

⏰ 预计学习时长：2 小时

---

进度：Day 22 / 84（26.2%）  
下一站：Day 23 —— LangChain.js Agents（下）：自定义 Agent 与 initializeAgentExecutorWithOptions
