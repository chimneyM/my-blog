---
id: "20"
title: "AI Agent 学习计划 Day 11：Prompt Engineering 提示词工程"
slug: "ai-agent-day11-prompt-engineering"
date: "2026-07-12"
tags: ["AI Agent", "Prompt Engineering", "LLM", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第十一天。系统学习提示词工程（Prompt Engineering）：为什么它是 Agent 与 LLM 沟通的基础、清晰表达六原则、零样本/少样本/思维链 CoT/思维树 ToT/ReAct 等核心技巧、角色与系统提示、输出格式约束与结构化输出、Prompt 模板化与变量、负面提示与常见陷阱、提示词评估与迭代方法，并给出可运行的 JavaScript 实战（分类、信息抽取、JSON 结构化输出）。"
readingTime: 30
---

# AI Agent 学习计划 Day 11：Prompt Engineering 提示词工程

> 📅 日期：2026-07-12  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 11 / 84（13.1%）

## 前言

Day 10 我们建立了 Agent 的整体认知：Agent = LLM（大脑）+ 工具（手）+ 记忆（心）+ 规划（思维）。今天开始深入 Agent 与 LLM 高效沟通的**第一项基本功：提示词工程（Prompt Engineering）**。

如果把 LLM 比作一个能力极强但"完全按字面理解、没有默认假设"的新同事，那么提示词就是你给他的任务说明。说清楚了，他做得又快又好；说模糊了，他就会"自由发挥"——产生幻觉、跑题、或输出你不想要的格式。

> **提示词工程 = 通过精心设计的输入，引导 LLM 稳定输出我们想要结果的技术。**

它是 Agent 的"语言层"。不管是让模型做分类、抽取、推理，还是为后续 Function Calling 描述工具，底层都依赖提示词。理解它，是后续 Tool Use、Memory、Planning 的前提。

---

## 一、为什么需要提示词工程

LLM 本质是一个**条件概率语言模型**：给定上文，预测下一个 token。它不会"理解意图"，只会"续写最合理的文本"。因此：

- 输入越清晰、结构越明确，输出的"合理续写"就越贴近预期；
- 没有约束时，模型会用训练分布中的"通用回答"填充，容易跑题或啰嗦；
- 同样的请求，换个说法结果可能天差地别。

对 Agent 来说，提示词决定了：任务是否被正确拆解、工具调用参数是否合理、记忆检索是否聚焦、最终回答是否遵循格式。

---

## 二、清晰表达的六条基本原则

| 原则 | 说明 | 反面示例 |
|------|------|----------|
| 1. 明确目标 | 一句话说清"你要什么" | "帮我处理一下这个" |
| 2. 给角色 | 设定 System 角色限定专业边界 | 让通用模型直接写医疗建议 |
| 3. 给上下文 | 提供必要背景，避免模型臆测 | 不说明领域就问术语 |
| 4. 用分隔符 | 用 `###`、`"""`、XML 标签隔离指令与数据 | 指令和数据混在一起 |
| 5. 定格式 | 明确要求输出 JSON / 列表 / 表格 | "总结一下"（格式自由） |
| 6. 给示例 | 少样本（Few-shot）比纯描述更稳 | 复杂分类只给文字规则 |

**示例：用分隔符隔离指令与待处理数据**

```
你是一个日志分类器。请把用户提供的日志行分类为：ERROR / WARN / INFO / DEBUG。
只输出分类标签，不要解释。

日志内容：
"""
2026-07-12 10:22:31 GET /api/posts 200 12ms
2026-07-12 10:22:33 DB connection failed, retry 1
"""
```

---

## 三、核心技巧

### 3.1 零样本（Zero-shot）与少样本（Few-shot）

- **Zero-shot**：直接给任务，不举例。适合模型很熟悉的任务。
- **Few-shot**：在提示里给 2~5 个"输入→输出"样例，模型据此模仿格式与风格。对边界模糊、格式特殊的任务效果显著。

```
分类情感：正面 / 负面
例1：这家店服务太差了 → 负面
例2：物流很快，包装结实 → 正面
待分类：客服耐心解决了我的问题 →
```

### 3.2 思维链（Chain-of-Thought, CoT）

让模型"先一步步思考再给答案"，显著提升推理与数学题准确率。经典触发词：`让我们一步步思考（Let's think step by step）`。

```
问题：仓库有 120 件商品，第一天卖出 1/3，第二天卖出剩余的 1/4，还剩多少？
请一步步推理后给出最终数字。
```

### 3.3 思维树（Tree-of-Thought, ToT）

CoT 是"一条线"，ToT 让模型探索多条推理路径并自我评估选优，适合需要规划/搜索的复杂问题。Agent 框架（如 Plan-and-Execute）常借鉴此思想。

### 3.4 角色提示与系统提示（System Prompt）

System 消息用于设定模型的"身份与边界"，是 Agent 的"人设 + 规则书"：

```
System: 你是 AI Agent 学习助手，只回答与 AI Agent / LLM / 编程相关的问题。
如果用户问无关话题，礼貌拒绝并说明范围。回答使用中文，控制在 200 字内。
```

### 3.5 结构化输出提示

要求模型严格按 JSON 输出，是 Agent 把 LLM 结果接入代码的关键：

```
请提取下面简历的姓名、年限、技能，只输出如下 JSON，不要任何额外文字：
{"name": "", "years": 0, "skills": []}

简历：
"""
张三，5 年 Node.js 经验，熟悉 TypeScript、React、LangChain。
"""
```

> 注意：仅靠提示词要求 JSON 仍可能偶发格式错误（多一个 ```json 包裹、或不完整）。生产环境更稳妥的做法是下一课要讲的 **Function Calling / 结构化输出解析器**。

---

## 四、Prompt 模板化与变量

在 Agent 中，提示词通常是"固定模板 + 动态变量"。把模板抽出来，运行时填充：

```javascript
function buildClassifierPrompt(logLine) {
  return `你是一个日志分类器，类别：ERROR / WARN / INFO / DEBUG。
只输出类别标签，不要解释。

日志："""
${logLine}
"""`
}

// 调用
const reply = await llm(buildClassifierPrompt("DB connection failed"))
```

更复杂的场景可用 LangChain 的 `PromptTemplate` / `ChatPromptTemplate`（Day 16 已初步接触），它负责变量校验、少样本组装、消息角色分配。

---

## 五、常见陷阱与规避

1. **歧义指令**：`总结一下` → 改成 `用 3 条 bullet 总结核心结论，每条不超过 30 字`。
2. **信息过载**：一次塞太多任务，模型顾此失彼 → 拆分为多步。
3. **矛盾约束**：既要求"详细"又要求"一句话" → 明确优先级。
4. **忽略输出解析**：拿到自由文本后直接当数据用 → 强制 JSON + 校验。
5. **缺乏示例**：复杂分类只给规则 → 补 2~3 个 Few-shot。

---

## 六、提示词评估与迭代

提示词不是一次写就的，需要像代码一样测试与迭代：

- **建测试集**：准备 20~50 个代表性输入与期望输出；
- **量化指标**：准确率、格式合规率、平均长度；
- **A/B 对比**：改一处变量，看指标变化；
- **回归测试**：模型升级后重跑，防止提示词失效。

---

## 七、JavaScript 实战：结构化抽取

下面用 OpenAI 兼容接口演示"强制 JSON 输出 + 容错解析"：

```javascript
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function extractResume(text) {
  const prompt = `提取简历信息，只输出 JSON：{"name":"","years":0,"skills":[]}
不要任何解释或代码块标记。

简历："""
${text}
"""`
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0, // 降低随机性，提升稳定性
  })
  const raw = res.choices[0].message.content.trim()
  // 容错：去掉可能的 ```json 包裹
  const jsonStr = raw.replace(/^```json|```$/g, '').trim()
  try {
    return JSON.parse(jsonStr)
  } catch (e) {
    console.error('JSON 解析失败：', raw)
    return null
  }
}

const data = await extractResume('李四，8 年 Python 经验，熟悉 Django、PyTorch。')
console.log(data) // { name: '李四', years: 8, skills: ['Django','PyTorch'] }
```

> 这里手动 `JSON.parse` 容易因模型偶发格式问题失败。**Day 12 的 Function Calling 与 Day 17 的 Output Parser 才是生产级解法**——让模型按 schema 输出、由 SDK 保证可解析。

---

## 八、与后续课程的衔接

- **Day 12 Function Calling**：用工具 schema 代替"提示词要求 JSON"，让模型输出可被代码安全调用；
- **Day 13 Memory/Planning**：把优质提示词沉淀为 Agent 的"系统提示"与"规划模板"；
- **Day 16-17 Model I/O**：LangChain 的 PromptTemplate / Output Parser 是把本课技巧工程化的工具。

提示词工程是 Agent 的"表达力"基础。把它练好，后面所有能力才接得住。

---

## 参考资源（已验证可访问）

- OpenAI 中文文档（社区版）快速入门：https://www.openaicto.com/docs/quickstart
- OpenAI 中文文档（社区版）：https://docsopen.ai/
- 菜鸟教程 AI Agent 教程：https://www.runoob.com/ai-agent/ai-agent-tutorial.html
- LangChain JS/TS 中文文档（PromptTemplate 章节）：https://js.langchain.com.cn/docs/
- 吴恩达提示工程课程（deeplearning.ai，含中文社区译本）

---

## 今日小结

- 提示词工程是 Agent 与 LLM 的"语言层"，决定了任务拆解、工具调用、格式合规的质量；
- 掌握六原则（明确目标 / 给角色 / 给上下文 / 分隔符 / 定格式 / 给示例）与 CoT、Few-shot、角色提示等技巧；
- 生产环境不要只靠"提示词要求 JSON"，要配合 Function Calling 与 Output Parser 做可靠结构化输出；
- 提示词要像代码一样建测试集、量化、迭代。

下一步（Day 12）：**Tool Use / Function Calling**——让 LLM 从"只说话"进化到"能动手调用工具"。
