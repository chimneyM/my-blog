---
id: "19"
title: "AI Agent 学习计划 Day 17：LangChain.js Model I/O（下）— 输出解析（Output Parsers）"
slug: "ai-agent-day17-langchain-output-parsers"
date: "2026-07-18"
tags: ["AI Agent", "LangChain", "Output Parser", "Zod", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第十七天。完成 Model I/O 最后一环 Output Parser：理解为什么需要解析、掌握四类解析器（StringOutputParser / JsonOutputParser 流式 / StructuredOutputParser + Zod / withStructuredOutput 现代推荐），并用 LCEL 串联与流式结构化输出。"
readingTime: 30
---

# AI Agent 学习计划 Day 17：LangChain.js Model I/O（下）

> 📅 日期：2026-07-18  
> 🎯 阶段二：核心框架（Day 15-35）  
> 📊 学习进度：Day 17 / 84（20.2%）

## 前言

昨天我们打通了「Prompt → Model」，拿到的是模型的自由文本。但做 Agent 时，我们往往**需要机器能直接使用的结构**：比如让模型返回 `{ name, age }` 而不是一段描述。这就是 Output Parser（输出解析器）的价值——它是 Model I/O 的第三层，把「人话」变成「数据」。

---

## 一、为什么需要 Output Parser

```text
没有解析器：
  模型输出：「小明今年 18 岁，喜欢编程。」
  → 代码要自己从文本里抠字段，脆弱易错

有解析器：
  模型输出：{ "name": "小明", "age": 18, "hobby": "编程" }
  → 代码直接 obj.age，可靠
```

Agent 的工具调用、规划结果、结构化抽取，都依赖稳定可解析的输出。

---

## 二、四类解析器

### 2.1 StringOutputParser —— 最简单

把 `AIMessage` 转成纯字符串，最常用：

```typescript
import { StringOutputParser } from '@langchain/core/output_parsers'

const chain = chatTmpl.pipe(model).pipe(new StringOutputParser())
const text = await chain.invoke({ question: '什么是闭包？' })
```

### 2.2 JsonOutputParser —— 流式友好的 JSON

让模型输出 JSON，并流式解析（边生成边解析，适合长 JSON）：

```typescript
import { JsonOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'

const tpl = ChatPromptTemplate.fromTemplate(
  '把用户描述提取为 JSON，字段：name, age, hobby。\n描述：{input}'
)

const parser = new JsonOutputParser()
const chain = tpl.pipe(model).pipe(parser)

const data = await chain.invoke({ input: '小红 20 岁，爱画画' })
// → { name: '小红', age: 20, hobby: '画画' }
```

> 因为模型可能输出多余文字，配合 `parser.getFormatInstructions()` 把「请输出 JSON」的指令注入 Prompt 更稳：

```typescript
const tpl = ChatPromptTemplate.fromTemplate(
  '提取信息：\n{input}\n{format_instructions}'
)
const chain = tpl.pipe(model).pipe(parser)
const data = await chain.invoke({
  input: '小红 20 岁，爱画画',
  format_instructions: parser.getFormatInstructions(),
})
```

### 2.3 StructuredOutputParser + Zod —— 带校验的结构

用 [Zod](https://zod.dev) 定义 schema，解析时自动校验类型：

```typescript
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { z } from 'zod'

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    name: z.string().describe('姓名'),
    age: z.number().describe('年龄'),
    hobby: z.string().describe('爱好'),
  })
)

const tpl = ChatPromptTemplate.fromTemplate(
  '提取信息：\n{input}\n{format_instructions}'
)
const chain = tpl.pipe(model).pipe(parser)

const data = await chain.invoke({
  input: '小刚 22 岁，喜欢篮球',
  format_instructions: parser.getFormatInstructions(),
})
// data 已通过 Zod 校验：{ name: '小刚', age: 22, hobby: '篮球' }
```

### 2.4 withStructuredOutput —— 现代推荐（最简洁）

`withStructuredOutput` 让模型**原生**按 schema 输出，无需手工拼指令，最干净：

```typescript
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })

const extractor = model.withStructuredOutput(
  z.object({
    name: z.string(),
    age: z.number(),
    hobby: z.string(),
  })
)

const data = await extractor.invoke('小美 19 岁，喜欢音乐')
// → { name: '小美', age: 19, hobby: '音乐' }
```

> 也支持传普通 JSON Schema 对象（不依赖 Zod）。这是目前**最推荐**的方式：代码最少、最稳定。

---

## 三、LCEL 串联与流式结构化输出

把 Parser 接到链尾，并用 `stream` 实现流式结构化：

```typescript
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })
const tpl = ChatPromptTemplate.fromTemplate('列出 3 个城市的{field}：\n{format_instructions}')
const parser = new JsonOutputParser()

const chain = tpl.pipe(model).pipe(parser)

// 流式：逐块拿到解析后的片段
for await (const chunk of await chain.stream({
  field: '人口',
  format_instructions: parser.getFormatInstructions(),
})) {
  process.stdout.write(JSON.stringify(chunk))
}
```

---

## 四、四类解析器怎么选

| 解析器 | 输出形态 | 是否需手工指令 | 类型校验 | 推荐度 |
|--------|---------|--------------|---------|--------|
| `StringOutputParser` | 纯文本 | 否 | 否 | 只要文本时用 |
| `JsonOutputParser` | JSON | 建议注入 | 否 | 需要流式 JSON |
| `StructuredOutputParser` + Zod | 对象 | 需注入 | ✅ | 需要校验 |
| `withStructuredOutput` | 对象 | 否 | ✅(Zod) | ⭐ 首选 |

**经验法则**：要纯文本用 `StringOutputParser`；要结构化优先用 `withStructuredOutput`（最省心）；需要**流式**且是 JSON 用 `JsonOutputParser`。

---

## 五、常见坑

1. **模型不严格输出 JSON**：务必用 `parser.getFormatInstructions()` 注入格式说明，或用 `withStructuredOutput`。
2. **Zod 校验失败**：模型可能返回字符串型数字（`"22"`），可加 `.transform(Number)` 或放宽 schema。
3. **中文文档路径**：`js.langchain.com.cn` / `langchain.nodejs.cn`，避免官方 `.com` 不可访问。

---

## 六、学习资料

以下站点均已验证可访问（国内镜像 / 中文）：

| 资源 | 链接 | 说明 |
|------|------|------|
| LangChain 中文网 结构化输出 | https://langchain.nodejs.cn/docs/concepts/structured_outputs/ | 结构化输出概念 |
| js.langchain.ac.cn 如何使用输出解析器（结构化） | https://js.langchain.ac.cn/docs/how_to/output_parser_structured/ | 结构化解析 |
| js.langchain.ac.cn 如何解析 JSON 输出 | https://js.langchain.ac.cn/docs/how_to/output_parser_json/ | JSON 解析 |
| LangChain 中文网 如何解析 JSON 输出 | https://www.langchain.com.cn/docs/how_to/output_parser_json/ | JSON 解析（镜像） |
| 第15课 Output Parsers 结构化输出（掘金） | https://juejin.cn/post/7639239837707993123 | 实战课 |
| 【LangChain 1.x】05 结构化输出（掘金） | https://juejin.cn/post/7662267147439783974 | 1.x 版本 |
| Output Parsers LangChain.js Agent 权威指南 | https://inferloop.dev/langchain-agent/core-abstractions/output-parsers/ | 权威指南 |
| LangChain 从入门到实践 Parser（知乎） | https://zhuanlan.zhihu.com/p/1966994571545284677 | Parser 实战 |

---

## 七、明日预告

**Day 18：LangChain.js Chains 与 LCEL 深入**

模型和解析都会了，下一步是把多个组件编排成「链」与「可复用单元」：组合链、并行链、条件分支，以及用 `Runnable` 接口统一所有组件。我们还会写第一个带工具的简单 Agent 雏形。

> 🚀 Day 17 完成！Model I/O 三层（Prompt → Model → OutputParser）你已经全部拿下。从明天起，我们用 LCEL 把这些零件拼成真正的 Agent。
