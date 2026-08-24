---
id: 57
title: "AI Agent 学习计划 - Day 53：记忆系统（二）工作记忆"
slug: "ai-agent-day53-memory-working"
date: "2026-08-23"
tags: ["AI Agent", "记忆系统", "工作记忆", "Scratchpad", "状态对象", "学习计划"]
excerpt: "工作记忆是 Agent 推理过程中的「便签纸」——存当前任务的临时状态、中间结论、待办。今天讲清 Scratchpad / 状态对象的设计，以及一个 Agent Loop 内如何读写工作记忆。"
readingTime: 12
---

# Day 53：记忆系统（二）— 工作记忆（Scratchpad / 状态对象）

## 一、工作记忆是什么

如果说**短期记忆**是对话历史（跨轮），**工作记忆**就是**单次任务执行中的临时工作台**：

- 多步推理时的「草稿纸」（ReAct 的 Thought/Action/Observation 就写在这里）
- 当前子任务的进度、变量、中间结果
- Agent 下一步决策的依据，任务结束即清掉

类比：短期记忆=长期记事本，工作记忆=手边便签。

## 二、两种典型实现

### 2.1 Scratchpad（文本草稿，塞进 prompt）

ReAct Agent 把思考过程累积成文本，附在 prompt 末尾的 `agent_scratchpad`：

```
Thought: 我需要先查天气
Action: get_weather
Observation: 晴天 25°C
Thought: 那建议穿薄外套
```

对应 Day 22-23 学过的 `MessagesPlaceholder("agent_scratchpad")`。

### 2.2 状态对象（结构化，代码层维护）

```ts
const workingMemory = {
  task: '规划北京三日游',
  subtasks: ['查天气', '查景点', '排行程'],
  done: ['查天气'],
  draft: { itinerary: [] },
}
// 每步更新 workingMemory.draft，最后输出
```

- 优点：结构清晰、易调试、可序列化
- 适合复杂任务编排（呼应 Day 44 Supervisor 的状态决策）

## 三、与短期/长期记忆的关系

```
工作记忆（单次任务草稿）
   ↓ 任务结束提炼
短期记忆（对话历史）
   ↓ 重要信息沉淀
长期记忆（向量库/摘要，Day 54）
```

## 四、常见坑

| 坑 | 后果 | 规避 |
|----|------|------|
| 把工作记忆误存长期 | 污染沉淀 | 任务结束显式清理 |
| Scratchpad 无限增长 | 爆窗口 | 定期摘要压缩 |
| 状态对象并发写 | 数据竞态 | 单 Agent 串行 / 加锁 |
| 工作记忆与上下文混淆 | 重复信息 | 明确边界，不重复塞 |

## 五、今日实践任务

1. 给 Day 52 的 `chatWithMemory` 加一个 `workingMemory` 对象，记录当前子任务
2. 用 Scratchpad 方式实现一个 3 步推理小 Agent（查→算→答）
3. 画一张「工作/短期/长期」三层记忆流转图，写进 README

🔗 学习资料（国内可访问镜像）：
- LangChain JS 中文 Memory：https://js.langchain.com.cn/docs/ ✅
- LangChain 中文文档 Memory：https://langchain-doc.cn/ ✅
- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅
- 掘金 Agent 记忆架构：https://juejin.cn/post/7353885796637274147 ✅
