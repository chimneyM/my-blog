---
id: 56
title: "AI Agent 学习计划 - Day 52：记忆系统（一）短期记忆"
slug: "ai-agent-day52-memory-short-term"
date: "2026-08-22"
tags: ["AI Agent", "记忆系统", "短期记忆", "上下文窗口", "Buffer Memory", "学习计划"]
excerpt: "记忆系统开篇——短期记忆就是 LLM 的上下文窗口。今天讲清上下文窗口的本质、为什么它会爆、如何用 Buffer Memory / 消息数组管理多轮对话，以及截断与压缩策略。"
readingTime: 13
---

# Day 52：记忆系统（一）— 短期记忆（上下文窗口 / Buffer Memory）

## 一、短期记忆 = 上下文窗口

LLM 没有「大脑里的记忆」，所谓短期记忆就是**当前对话拼接进 prompt 的全部 token**（messages 数组）。每轮对话都把历史塞回去，模型才「记得」前文。

- 容量有限：上下文窗口（如 8k/32k/128k token）是硬上限
- 成本随长度线性增长：长对话越来越贵
- 越远的信息注意力越弱（lost-in-the-middle 现象）

## 二、Buffer Memory（原样缓存全部历史）

最朴素做法：把每一轮 `user`/`assistant` 消息 push 进数组，调用时整体传入。

```ts
const history: ChatMessage[] = []
async function chat(input: string) {
  history.push({ role: 'user', content: input })
  const { text } = await generateText({ model, messages: history })
  history.push({ role: 'assistant', content: text })
  return text
}
```

- 优点：实现简单、零损耗保真
- 缺点：线性增长，迟早爆窗口

## 三、窗口管理与压缩策略

| 策略 | 做法 | 适用 |
|------|------|------|
| 滑动窗口 | 只保留最近 N 轮 | 轻量对话 |
| 截断 | 超长则丢最早消息 | 简单但丢信息 |
| 摘要压缩 | LLM 把旧历史压成摘要 | 长对话保关键信息（Day 24 已学） |
| Token 预算 | 按 token 估算裁剪 | 精确控制成本 |

## 四、与前面模块衔接

- 呼应 Day 24（Buffer/Summary Memory）的 LangChain 实现，今天从原理层统一认知
- 多 Agent（Day 41-45）里每个 Agent 维护自己的短期记忆，避免串号（sessionId 隔离）
- 为 Day 53 工作记忆、Day 54 长期记忆分层做铺垫

## 五、常见坑

| 坑 | 后果 | 规避 |
|----|------|------|
| 无限堆积消息 | 爆窗口/超费 | 加窗口或摘要 |
| 多用户共用一个数组 | 串号泄露 | 按 sessionId 隔离 |
| 摘要后丢失关键事实 | 答非所问 | 摘要保留实体/决策 |
| 忘记清 system 消息 | 上下文错乱 | system 始终置顶 |

## 六、今日实践任务

1. 写一个带滑动窗口（最近 10 轮）的 `chatWithMemory` 函数
2. 用 token 估算库（如 `js-tiktoken`）打印每轮上下文长度，观察增长
3. 对比「全量 vs 窗口」两种策略在长对话下的成本差异，写进 README

🔗 学习资料（国内可访问镜像）：
- LangChain JS 中文 Memory：https://js.langchain.com.cn/docs/ ✅
- LangChain 中文文档 Memory：https://langchain-doc.cn/ ✅
- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅
- 掘金 大模型记忆机制：https://juejin.cn/post/7353885796637274147 ✅
