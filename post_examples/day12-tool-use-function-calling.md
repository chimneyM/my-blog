---
id: "21"
title: "AI Agent 学习计划 Day 12：Tool Use / Function Calling 工具调用"
slug: "ai-agent-day12-tool-use-function-calling"
date: "2026-07-13"
tags: ["AI Agent", "Function Calling", "Tool Use", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第十二天。深入 Tool Use / Function Calling（工具调用）：为什么 Agent 必须能调用外部工具、OpenAI 工具调用协议（tools 参数与 function schema、JSON Schema 描述参数）、完整调用循环（模型返回 tool_calls → 本地执行 → 结果回传 → 模型继续）、并行工具调用与流式、错误处理、与 ReAct 的关系、LangChain 中如何用 @tool / StructuredTool 定义工具，并用 Node.js 实现一个可运行的天气查询 + 计算器 Agent 实战。"
readingTime: 32
---

# AI Agent 学习计划 Day 12：Tool Use / Function Calling 工具调用

> 📅 日期：2026-07-13  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 12 / 84（14.3%）

## 前言

Day 11 我们学会了用提示词"更好地说话"。但 LLM 有个根本局限：**它只能生成文本，无法直接查实时天气、算数学、读数据库、调 API**。

解决这个问题的关键能力就是 **Tool Use / Function Calling（工具调用）**——让模型在回答时，输出"我想调用哪个函数、参数是什么"，由我们的代码真正去执行，再把结果喂回模型。这一步，让 Agent 从"聊天"跨越到"办事"。

> **Function Calling = 模型输出结构化的"调用意图"，宿主程序负责真实执行并返回结果的标准协议。**

这是 Agent "手"的部分，也是 ReAct、Plan-and-Execute 等模式的物理基础。

---

## 一、为什么 Agent 必须能调用工具

| LLM 的局限 | 工具能补的短板 |
|------------|----------------|
| 知识截止（训练数据有时效） | 调搜索 / 数据库拿实时数据 |
| 不会算数 / 易算错 | 调计算器 / 代码执行 |
| 无法触达外部系统 | 调 API（发邮件、下单、查订单） |
| 没有持久状态 | 调记忆读写接口 |

没有工具，Agent 只能"纸上谈兵"；有了工具，Agent 才真正能"行动"。

---

## 二、OpenAI 工具调用协议

核心是在请求里传 `tools` 数组，每个元素描述一个函数：

```javascript
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '查询指定城市的当前天气',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名，如 上海' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['city'],
      },
    },
  },
]
```

要点：
- `description` 会被模型用来判断"何时该调这个工具"，要写清楚；
- `parameters` 用 **JSON Schema** 描述，模型据此生成合法参数；
- `required` 标明必填字段，缺失时模型会先追问或报错。

---

## 三、完整调用循环（Agent Loop）

```
用户: 上海现在多少度？
  │
  ▼
① 请求模型（messages + tools）
  │
  ▼
② 模型返回 tool_calls: [{ name: 'get_weather', arguments: { city:'上海' } }]
  │   （此时 content 通常为 null，表示"我先去查"）
  ▼
③ 宿主代码执行 get_weather('上海') → '26°C, 多云'
  │
  ▼
④ 把结果作为 role:'tool' 消息回传模型
  │
  ▼
⑤ 模型综合后给出自然语言回答："上海现在 26°C，多云。"
```

代码骨架：

```javascript
import OpenAI from 'openai'
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const tools = [/* 见上 get_weather 定义 */]
const available = { get_weather: async ({ city }) => `${city}: 26°C, 多云` }

const messages = [{ role: 'user', content: '上海现在多少度？' }]

// 第一步：问模型
let res = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages,
  tools,
  tool_choice: 'auto', // 让模型自己决定是否调用工具
})

const msg = res.choices[0].message

// 第二步：如果模型要调工具，就执行并把结果回传
if (msg.tool_calls) {
  messages.push(msg) // 把模型的 tool_calls 消息原样保留
  for (const call of msg.tool_calls) {
    const fn = available[call.function.name]
    const args = JSON.parse(call.function.arguments)
    const result = await fn(args)
    messages.push({
      role: 'tool',
      tool_call_id: call.id,
      content: String(result),
    })
  }
  // 第三步：带着工具结果再问一次模型
  res = await client.chat.completions.create({ model: 'gpt-4o-mini', messages })
  console.log(res.choices[0].message.content)
}
```

> 这就是最简 Agent Loop：**模型决策 → 代码执行 → 结果回灌 → 模型再决策**，循环直到给出最终回答。Day 13 的 ReAct（Thought-Action-Observation）正是这一循环的理论化。

---

## 四、并行工具调用与流式

- **并行调用**：模型可一次返回多个 `tool_calls`（如"同时查北京和上海天气"），宿主用 `Promise.all` 并发执行，再一起回传。
- **流式**：`stream: true` 时工具调用信息会分片到达，需累积 `tool_calls[].function.arguments` 字符串，收齐后再 `JSON.parse`。

---

## 五、错误处理与边界

1. **参数非法**：模型偶尔生成不合 schema 的参数 → `try/catch` 包裹 `JSON.parse`，失败时把错误回传给模型让它修正；
2. **工具执行失败**：网络超时、API 报错 → 把错误信息作为 `tool` 消息返回，让模型决定重试或改方案；
3. **安全**：工具可能执行危险操作（发邮件、删数据）→ 高危工具加人工确认或权限校验；不要把原始错误泄露成提示词注入入口。

---

## 六、与 ReAct 的关系

ReAct 提示词范式让模型输出 `Thought → Action → Observation` 循环；Function Calling 是它的"工程化标准实现"——`Action` 被结构化为 `tool_calls`，`Observation` 对应 `role:'tool'` 消息。两者思想一致，Function Calling 更省 token、更可靠。

---

## 七、用 LangChain 定义工具（预览）

Day 16-17 我们系统学 LangChain，这里先预览其工具定义方式：

```javascript
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

const calculator = tool(
  async ({ expression }) => {
    // 生产环境请用安全表达式求值，禁止直接 eval
    return String(eval(expression))
  },
  {
    name: 'calculator',
    description: '计算一个数学表达式，如 "2 ** 10 + 3"',
    schema: z.object({ expression: z.string() }),
  }
)

// 在 Agent/Chain 中把 calculator 作为可调用工具传入即可
```

`z.object(...)`（Zod）既描述参数 schema，又自动做运行时校验，比手写 JSON Schema 更安全直观——这正是 Day 17 `withStructuredOutput` 的同类思路。

---

## 八、可运行实战：天气 + 计算器 Agent

把上面的 `get_weather` 与 `calculator` 两个工具组合，模型就能根据你的话自主选择调用哪个：

```javascript
const available = {
  get_weather: async ({ city }) => `${city}: 26°C, 多云`,
  calculator: async ({ expression }) => String(eval(expression)), // 仅演示
}
const tools = [/* get_weather + calculator 两个 schema */]

async function agentAsk(question) {
  const messages = [{ role: 'user', content: question }]
  let res = await client.chat.completions.create({ model: 'gpt-4o-mini', messages, tools })
  let msg = res.choices[0].message
  while (msg.tool_calls) {
    messages.push(msg)
    for (const call of msg.tool_calls) {
      const result = await available[call.function.name](JSON.parse(call.function.arguments))
      messages.push({ role: 'tool', tool_call_id: call.id, content: String(result) })
    }
    res = await client.chat.completions.create({ model: 'gpt-4o-mini', messages, tools })
    msg = res.choices[0].message
  }
  return msg.content
}

console.log(await agentAsk('北京和上海谁更热？顺便算下两地温差多少度'))
// 模型会并行调 get_weather 两次，再调 calculator 求差，最后自然语言总结
```

---

## 九、今日小结与衔接

- Function Calling 让 LLM 输出"调用意图 + 参数"，由代码真实执行，是 Agent 的"手"；
- 掌握 OpenAI `tools` 协议（JSON Schema 描述参数）、Agent Loop 循环、并行调用、错误处理；
- 它是 ReAct 的工程化实现；LangChain 的 `@tool` + Zod 让工具定义更安全；
- 安全第一：高危工具要权限控制，错误要回传模型修正而非直接崩溃。

**Day 11（提示词）+ Day 12（工具调用）= Agent 的"表达力 + 行动力"双基石。** 进入 Day 13 后，我们将用 Memory 与 Planning 把这两块组织成"会记忆、会规划"的真正智能体。

---

## 参考资源（已验证可访问）

- OpenAI 中文文档（社区版）快速入门：https://www.openaicto.com/docs/quickstart
- OpenAI 中文文档（社区版）：https://docsopen.ai/
- LangChain JS/TS 中文文档：https://js.langchain.com.cn/docs/
- LangChain 中文文档：https://langchain-doc.cn/
- 菜鸟教程 AI Agent 教程：https://www.runoob.com/ai-agent/ai-agent-tutorial.html

> 注：工具调用依赖模型厂商的 Function Calling 能力，国内多家大模型（如通义千问、智谱 GLM、DeepSeek）均兼容 OpenAI 工具调用格式，可平滑替换 `baseURL` 与 `model` 使用。
