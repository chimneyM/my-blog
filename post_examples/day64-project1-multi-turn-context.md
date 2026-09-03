---
id: 68
title: "AI Agent 学习计划 - Day 64：项目一 - 多轮对话上下文管理"
slug: "ai-agent-day64-project1-multi-turn-context"
date: "2026-09-03"
tags: ["AI Agent", "实战项目", "项目一", "多轮对话", "上下文管理", "上下文窗口", "记忆", "学习计划"]
excerpt: "项目一第八步：让知识库问答记住前文、又不爆 token。useChat 默认会带着完整历史请求后端，但长对话会撑爆上下文窗口并产生检索噪声。今天讲服务端窗口截断、摘要压缩、按 session 隔离、每轮重新检索四大策略。"
readingTime: 15
---

# Day 64：项目一 - 多轮对话上下文管理

## 一、目标

Day 62/63 已经能流式对话 + 引用溯源，但都假设「单轮」。真实用户会追问：「刚才那份文档的第 2 节讲了什么？」「那它和另一份冲突吗？」

今天解决 **多轮上下文管理**：让系统记得前文（连贯），又别让对话无限变长把上下文窗口撑爆（成本 + 噪声）。

> 呼应：Day 24/52 的 Memory 模块（Buffer/Summary）在这里落地为「服务端历史裁剪」。

## 二、默认行为：useChat 已经帮你带历史

`useChat` 在前端维护 `messages` 数组，每次 `handleSubmit` 会把**完整历史**发给 `/api/chat`。所以「记住前文」几乎免费——后端 `messages` 里天然有前几轮。

但问题是：**历史会无限增长**。第 20 轮时，Prompt 里塞了前 19 轮全文 + 每轮检索到的 chunk，token 爆炸、检索噪声上升、回答变慢变贵。

## 三、策略一：服务端窗口截断（最实用）

后端不迷信前端给的「完整历史」，只保留最近 N 轮，并**每轮重新检索**新鲜上下文：

```ts
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json()

  // 1. 每轮重新检索（不要复用历史里的旧 context，避免漂移）
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const { context, sources } = lastUser ? await retrieve(lastUser.content) : { context: '', sources: [] }

  // 2. 只保留最近 6 条消息，控制上下文窗口
  const recent = messages.slice(-6)
  const modelMessages = convertToModelMessages(recent)

  const system = [
    '你是基于私有知识库作答的助手，只使用【参考资料】，不要编造。',
    '',
    '【参考资料】',
    context || '（无相关参考资料）',
  ].join('\n')

  const result = streamText({ model: openai('gpt-4o-mini'), system, messages: modelMessages })
  // ... 同 Day 63 用 createUIMessageStream 把 sources 随流返回
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: 'data-sources', data: sources })
      writer.merge(result.toUIMessageStream())
    },
  })
  return createUIMessageStreamResponse({ stream })
}
```

窗口大小经验值：6–10 轮。太小会「健忘」，太大浪费 token。

## 四、策略二：摘要压缩（窗口外的内容别直接丢）

窗口之外的老对话，与其一刀切丢弃，不如**用 LLM 压缩成摘要**拼回 system（呼应 Day 24 Summary Memory）：

```ts
// 当 messages 超过窗口，把旧的部分先 summary 一次
async function compact(messages: any[]): Promise<string> {
  const old = messages.slice(0, -6)
  if (old.length === 0) return ''
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: `用 3 句话总结以下对话要点（保留关键事实与待办）：\n${old.map((m) => `${m.role}: ${m.content}`).join('\n')}`,
  })
  return text
}
// system 里加：`【对话摘要】\n${summary}`
```

## 五、策略三：按 session 隔离（多用户不串号）

生产环境必须按 `sessionId` 区分用户，否则 A 的历史混进 B 的对话。最简单：前端在请求里带 `body: { id }`，后端用内存/Redis 按 id 存历史；本项目用 `useChat` 默认前端内存即可，但部署多实例时要外置存储。

```ts
const { messages, id } = await req.json() // id = 会话 id
// 真实项目应：history = await store.get(id); store.set(id, [...history, newMsg])
```

## 六、四大策略选型

| 策略 | 解决什么 | 成本 | 适用 |
|------|----------|------|------|
| 默认带全历史 | 基础连贯 | 高（线性增长） | 演示/短对话 |
| 窗口截断 | 爆 token / 噪声 | 低 | ✅ 项目一首选 |
| 摘要压缩 | 健忘 + 成本 | 中（每轮一次总结） | 长对话产品 |
| session 隔离 | 多用户串号 | 低 | 必须做 |

> 学习资料（国内可访问镜像）：LangChain JS 记忆中文文档 https://js.langchain.com.cn/docs/ ；菜鸟教程 AI Agent 系列 https://www.runoob.com/ai-agent/ai-agent-tutorial.html

## 七、常见坑

- **前端带全历史、后端不裁剪**：第 30 轮直接超出 `gpt-4o-mini` 上下文（128k 也会慢/贵），回答被截断或报错。
- **把检索 context 写进历史**：旧 chunk 被当成「用户说过的话」反复喂给模型，产生检索漂移；正确做法是**每轮重新 retrieve**，历史只留用户/助手对话。
- **窗口裁剪后 system 漏掉最新指令**：窗口只切 `messages`，但 `system`（含参考资料）每轮都重建，别把 system 也切了。
- **丢 system / 角色顺序错乱**：`convertToModelMessages` 前确保 system 单独传、messages 是 user/assistant 交替。
- **多用户共用一个 messages 数组**：本地演示无所谓，部署时必须按 sessionId 隔离。
- **官方站不可访问**：记忆文档统一用国内镜像 `js.langchain.com.cn`，别硬连 `js.langchain.com`。

## 八、今日实践任务

1. 在 `route.ts` 加「最近 6 条窗口截断」+「每轮重新 retrieve」，验证第 10 轮追问仍能基于最新问题检索、且 token 不再无限增长。
2. （进阶）给窗口外的旧消息加一次 `compact()` 摘要，拼进 system 的「对话摘要」段，对比「直接截断」的连贯度。
3. 多轮追问测试：「这份文档讲了什么？」→「它的第 2 节呢？」确认能接住指代。
4. 给 `useChat` 传 `id` 模拟多会话，确认历史不串号。

> 明日（Day 65）做项目一的测试与优化：用 Vitest 给 retrieve / route 写单测，顺带做流式与检索的性能优化。
