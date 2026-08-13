---
id: "47"
title: "多 Agent 编排（三）：协作讨论模式"
slug: "ai-agent-day43-multi-agent-debate"
date: "2026-08-13"
tags: ["AI Agent", "阶段三进阶", "多Agent", "协作讨论", "Debate", "AutoGen", "反思"]
excerpt: "多 Agent 编排第三篇：协作讨论模式（Debate/Discussion）。多个 Agent 围绕同一问题互相发言、质疑、补充，迭代收敛出更优答案。覆盖为什么讨论优于单人、两类形态（Round-Robin 轮转 vs Critic 批评者）、用消息历史驱动多轮对话、收敛与终止条件、与顺序链/路由的区别、常见坑（无限循环/群体思维/成本失控/无最终裁决）。"
readingTime: 15
---

## 回顾与今天的目标

- Day 41：顺序链——固定流水线，前输出即后输入。
- Day 42：路由分发——按意图选一个专业 Agent 处理。
- **今天（Day 43）**：协作讨论模式（Debate/Discussion）——**多个 Agent 一起聊**，互相质疑补充，迭代出更好答案。适合开放、需要多角度权衡的任务（方案评估、辩论、头脑风暴）。

顺序链是「接力」，路由是「分诊」，讨论是「圆桌会议」。

## 1. 为什么需要协作讨论

单个 Agent 容易一条道走到黑、忽略反方视角。让多个角色（如「乐观派 / 悲观派」「支持者 / 批评者」）互辩，能：
- **暴露盲点**：批评者专门挑刺，避免自满答案。
- **权衡权衡**：多方观点交锋后收敛，质量常高于单人。
- **可解释**：每轮发言留痕，决策过程透明。

代价：多轮调用，**成本与延迟更高**，需设终止条件。

## 2. 两类常见形态

### （1）Round-Robin 轮转讨论
多个 Agent 按固定顺序轮流发言，每轮看到前面所有人的发言：

```ts
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'

const llm = new ChatOpenAI({ model: 'gpt-4o-mini' })
const agents = ['乐观分析师', '风险审查员', '最终裁决者']

async function debate(topic: string, rounds = 3) {
  const history: string[] = [`话题：${topic}`]
  for (let r = 0; r < rounds; r++) {
    for (const role of agents) {
      const prompt = ChatPromptTemplate.fromTemplate(
        `你是{role}。以下是当前讨论记录：\n{history}\n请基于你的角色发表下一轮看法（简洁）：`
      )
      const msg = await prompt.pipe(llm).invoke({ role, history: history.join('\n') })
      history.push(`[${role}] ${msg.content}`)
    }
  }
  return history.join('\n')
}
```

### （2）Critic 批评者模式（一主一辅）
一个「生成者」给方案，一个「批评者」挑刺，生成者据反馈修订，循环直到批评者满意：

```ts
async function criticLoop(topic: string, maxTurns = 3) {
  let draft = await generate(topic)            // 生成者出初稿
  for (let i = 0; i < maxTurns; i++) {
    const review = await criticize(draft)       // 批评者挑刺
    if (review.includes('通过')) return draft    // 终止：批评者满意
    draft = await revise(draft, review)          // 生成者据反馈修订
  }
  return draft
}
```

> AutoGen 的 `GroupChat` / `AssistantAgent` + `UserProxyAgent` 正是这套机制的开箱实现（详见资料）。

## 3. 收敛与终止条件（关键！）

讨论不能无限进行，必须设停止信号：
- **轮数上限**：`rounds` / `maxTurns` 到了就停。
- **共识信号**：某 Agent 输出「通过/达成一致」即停（Critic 模式）。
- **质量阈值**：用评分 Agent 打分，达标即停。
- **人工介入**：`UserProxyAgent` 可让人拍板（AutoGen）。

## 4. 与顺序链 / 路由的区别

| 模式 | 结构 | 适用 | 成本 |
| --- | --- | --- | --- |
| 顺序链（Day 41） | 线 | 流程确定 | 低 |
| 路由（Day 42） | 分叉 | 意图单一 | 低 |
| 协作讨论（Day 43） | 环/网 | 需多角度权衡 | 高 |

> 实战常组合：路由分发到「讨论组」，讨论组内部用轮转 + 批评者收敛。

## 5. 常见坑

- **无限循环**：没设终止条件，Agent 永远聊下去烧钱；务必轮数/信号上限。
- **群体思维（Groupthink）**：角色设定太相似，互舔不挑刺，讨论失去意义；让角色立场对立。
- **成本失控**：每轮所有人全量历史重发，token 暴涨；只传必要摘要。
- **无最终裁决**：讨论完没汇总，产出散落；最后一环设「裁决者」出结论。
- **历史越滚越大**：轮次多后超窗口；定期压缩历史（接 Day 24 Summary Memory）。
- **角色职责重叠**：两个 Agent 干同一件事，浪费调用；明确分工。
- **官方站不可访问**：AutoGen 文档国内可能受限，优先 GitHub 仓库与中文镜像。

## 学习资料与网站（国内可访问镜像）

- AutoGen GitHub 仓库：https://github.com/microsoft/autogen
- LangChain JS 中文文档：https://js.langchain.com.cn/docs/
- LangChain 中文文档：https://langchain-doc.cn/
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html
- 掘金 多 Agent 协作讨论实战：https://juejin.cn/post/7357554457913966627

## 学习建议

- 先用 Round-Robin 三角色（乐观/风险/裁决）跑一个小话题，观察每轮观点如何演化。
- 故意不设终止条件跑一次，体会「烧钱无限循环」，再补上轮数上限，理解收敛必要性。
- 给批评者足够强的「挑刺」system prompt，避免群体思维；为 Day 44 层级管理做铺垫。

⏰ 预计学习时长：2.5 小时
