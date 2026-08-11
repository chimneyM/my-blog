---
id: "45"
title: "多 Agent 编排（一）：顺序链式模式"
slug: "ai-agent-day41-multi-agent-sequential"
date: "2026-08-11"
tags: ["AI Agent", "阶段三进阶", "多Agent", "顺序链", "编排", "LangChain"]
excerpt: "进入多 Agent 编排篇。第一种也是最基础的编排模式：顺序链式（Sequential），多个 Agent/步骤按固定顺序接力，前一个输出作为后一个输入。覆盖为什么需要多 Agent、顺序链 vs 单 Agent、用 LCEL RunnableSequence 串联多个子链、以及「研究→写作→审校」三 Agent 实战。"
readingTime: 14
---

## 回顾与今天的目标

- Day 36-40：完成 RAG 全链路（切分→嵌入→存储→检索→优化），Day 40 收尾 RAG 模块。
- **今天（Day 41）**：进入**多 Agent 编排**模块（Day 41-45）。第一种模式：**顺序链式（Sequential）**——多个 Agent 按固定顺序接力，前者的输出是后者的输入。

单 Agent 像「全能选手」，但任务复杂时容易顾此失彼、上下文爆炸。多 Agent 把大任务拆给专长不同的 Agent，像流水线一样各司其职。

## 1. 为什么需要多 Agent

| 维度 | 单 Agent | 多 Agent 编排 |
| --- | --- | --- |
| 上下文 | 所有信息挤在一个对话里，易超窗 | 每步只关注自己那块，干净 |
| 专精 | 一个模型啥都干，质量均衡但平庸 | 每环节用最合适的提示/模型 |
| 可维护 | 提示词巨长，改一处崩全局 | 子 Agent 独立，可单独迭代 |
| 可观测 | 黑盒 | 每步输入输出清晰，好调试 |

顺序链是编排的「Hello World」：无分支、无回环，理解它就理解了编排的基本单元。

## 2. 顺序链的心智模型

```
[用户输入]
    ↓
Agent A（研究）：检索/收集素材 → 输出「素材摘要」
    ↓
Agent B（写作）：基于素材写初稿 → 输出「文章草稿」
    ↓
Agent C（审校）：检查事实/语法 → 输出「终稿」
    ↓
[最终交付]
```

每一步：`output_A` 自动成为 `input_B`。这就是「前一个输出作为后一个输入」。

## 3. 用 LCEL RunnableSequence 实现（Day 20 复习）

LangChain 的 `RunnableSequence` / pipe（`|`）天然适合顺序链：

```ts
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'

const llm = new ChatOpenAI({ model: 'gpt-4o-mini' })

const researchPrompt = ChatPromptTemplate.fromTemplate(
  '你是研究员，针对主题「{topic}」列出 5 个关键要点与依据：'
)
const writePrompt = ChatPromptTemplate.fromTemplate(
  '你是写作者，根据以下研究素材写一篇 300 字短文：\n{research}'
)
const reviewPrompt = ChatPromptTemplate.fromTemplate(
  '你是审校，检查下面文章的事实与通顺度，给出最终修订版：\n{draft}'
)

const chain = RunnableSequence.from([
  researchPrompt.pipe(llm),                                                         // → research
  (r) => ({ research: r.content }),
  writePrompt.pipe(llm),                                                            // → draft
  (r) => ({ draft: r.content }),
  reviewPrompt.pipe(llm),                                                           // → 终稿
])

const result = await chain.invoke({ topic: 'AI Agent 的记忆力' })
console.log(result.content)
```

> 每个 `.pipe(llm)` 的输出是 `AIMessage`，用中间函数 `(r) => ({...})` 把 `content` 重命名后喂给下一步 prompt。

## 4. 顺序链的变体

- **带条件中止**：某步输出「无法继续」则提前结束（如研究 Agent 没找到资料）。
- **可插入人工节点**：写作后插入 `humanReview` 人工确认再进审校（L2 自主性）。
- **步骤可并行**：若 B、C 互不依赖，可用 `RunnableParallel` 并行（但顺序链强调严格先后）。

## 5. 与 RAG 的结合

研究 Agent 内部就是 Day 39 的 RAG 检索链：研究 → 调 retriever 取素材 → 总结。多 Agent 把 RAG 当成「研究子环节」复用，体现 Day 36-40 的积累价值。

## 6. 常见坑

- **中间变量键名错乱**：上一步输出 `{research}` 但下一步 prompt 用了 `{material}`，会报「缺少输入变量」。
- **上下文逐层膨胀**：每步都把前序全文带下去，三步后超窗口；应只传「必要的精华」。
- **错误向后传播**：A 出错 B 还在跑，浪费调用；加错误中断或校验。
- **过度拆分**：两步走完的事拆成四个 Agent，延迟与成本双高。
- **模型选择一刀切**：研究/写作用强模型，审校用快模型更划算。
- **官方站不可访问**：LangChain Chains 文档国内可能受限，优先中文镜像。

## 学习资料与网站（国内可访问镜像）

- LangChain JS 中文文档（Chains/序列）：https://js.langchain.com.cn/docs/
- LangChain 中文文档：https://langchain-doc.cn/
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html
- 掘金 多 Agent 编排实战：https://juejin.cn/post/7357554457913966627

## 学习建议

- 先用「研究→写作→审校」三 Agent 跑通顺序链，体会「输出即输入」的接力感。
- 故意制造一次键名错误，看报错信息，熟悉调试顺序链的常见失败模式。
- 思考哪些环节可以并行（为 Day 42 路由、Day 45 协作模式打基础）。

⏰ 预计学习时长：2.5 小时
