---
id: 59
title: "AI Agent 学习计划 - Day 55：记忆系统（四）情景记忆"
slug: "ai-agent-day55-memory-episodic"
date: "2026-08-25"
tags: ["AI Agent", "记忆系统", "情景记忆", "Episodic Memory", "经验库", "学习计划"]
excerpt: "情景记忆让 Agent「记住发生过的事」——把每次交互的关键上下文（任务、决策、结果、反馈）按事件存储，未来遇到相似情境可召回借鉴。今天讲清情景记忆与长期记忆的区别、存储结构设计、检索应用，以及它在自我改进 Agent 中的价值。"
readingTime: 13
---

# Day 55：记忆系统（四）— 情景记忆（Episodic Memory）

## 一、情景记忆是什么

前三天学了：
- **工作记忆**（Day 53）：单次任务草稿
- **短期记忆**（Day 52）：本轮对话历史
- **长期记忆**（Day 54）：跨会话的知识/偏好（向量库+摘要）

**情景记忆**是长期记忆的一个专门子集，专门存「**事件**」：某次任务怎么做的、遇到什么坑、结果如何、用户给了什么反馈。

> 类比人类：长期记忆像百科知识，情景记忆像「上次去 XXX 餐厅踩雷了」的具体经历。

## 二、为什么 Agent 需要情景记忆

- **经验复用**：下次遇到相似任务，直接召回「上次怎么做的」少走弯路
- **自我改进**：把失败/成功案例沉淀，让 Agent 越用越聪明
- **可解释**：出了问题能追溯「当时为什么这么决策」
- 这是 Day 13 提过的「ReAct 多步推理 + 经验」的落地形态

## 三、存储结构设计

每条情景 = 一段结构化事件，最好带 metadata 便于检索：

```ts
type Episode = {
  id: string
  task: string              // 任务描述
  context: string          // 关键上下文
  actions: string[]        // 采取了什么动作
  outcome: 'success' | 'fail'
  feedback?: string        // 用户/系统反馈
  lesson: string           // 提炼的经验教训
  embedding: number[]      // 用于语义检索
  createdAt: string
}
```

存法与 Day 54 长期记忆一致：Embedding + 向量库（Pinecone / MemoryVectorStore）。

## 四、检索与应用

```ts
// 新任务到来时，召回相似历史情景
const similar = await vectorStore.similaritySearch(newTask, 3)
// 拼进 prompt：「参考你之前的经验：...」
```

- 复现成功路径 → 提高成功率
- 规避失败路径 → 减少重复犯错

## 五、与长期记忆的关系

```
              ┌─ 知识/偏好（Day 54 长期记忆）
长期记忆 ─────┤
              └─ 情景/经历（Day 55 情景记忆，本日）
```

两者都跨会话、都用向量库，区别在**内容形态**：一个是「知道什么」，一个是「经历过什么」。

## 六、常见坑

| 坑 | 后果 | 规避 |
|----|------|------|
| 情景记太细（含无关噪声） | 检索被干扰 | 只存 lesson + 关键动作 |
| 把工作记忆当情景永久存 | 临时草稿污染 | 任务结束再提炼入库 |
| 失败情景无反馈字段 | 无法归因 | 强制 feedback/lesson |
| 情景与知识混库 | 召回不精准 | 用 metadata.type 区分 |
| 官方站不可访问 | 卡文档 | 用国内镜像 |

## 七、今日实践任务

1. 基于 Day 54 的向量库，加一个 `saveEpisode()` / `recallEpisode()`，存 2 条「踩坑经验」
2. 写一个 prompt 模板，把召回情景作为「参考经验」注入
3. 总结 Day 52-55 四层记忆体系一张表，写进 README（为 Day 56 阶段三总结铺垫）

🔗 学习资料（国内可访问镜像）：
- LangChain JS 中文 Memory：https://js.langchain.com.cn/docs/ ✅
- LangChain 中文文档 Memory：https://langchain-doc.cn/ ✅
- Pinecone 文档：https://docs.pinecone.io/ ✅
- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅
- 掘金 大模型记忆机制：https://juejin.cn/post/7353885796637274147 ✅
