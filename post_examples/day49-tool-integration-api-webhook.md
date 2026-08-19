---
id: 53
title: "AI Agent 学习计划 - Day 49：工具集成（四）外部 API 与 Webhook"
slug: "ai-agent-day49-tool-integration-api-webhook"
date: "2026-08-19"
tags: ["AI Agent", "工具集成", "外部 API", "Webhook", "Vercel AI SDK", "学习计划"]
excerpt: "让 Agent 连接整个互联网服务——外部 API 与 Webhook 工具把 LLM 接入真实业务系统（发消息、建工单、触发流水线）。今天覆盖 HTTP 请求封装、Webhook 入站触发、重试与鉴权安全。"
readingTime: 12
---

# Day 49：工具集成（四）— 外部 API 与 Webhook

## 一、为什么 Agent 需要外部 API 与 Webhook

数据库/文件（Day 48）只是「自己家」的数据，而**外部 API**让 Agent 能调用SaaS 生态（Slack、GitHub、飞书、支付、地图）：

- 执行动作：发通知、建任务、触发部署、查快递 —— 把「说过」变成「做过」
- Webhook 是反向通道：外部系统事件（如 GitHub Push、支付回调）主动推给 Agent，触发后续流程
- 这是「主动型 Agent」的最后一公里：不仅问答，还能办事

> 工具进化链：看世界（搜索 Day46）→ 动手算（代码 Day47）→ 读写存（DB/文件 Day48）→ **办事情（API/Webhook Day49）**。

## 二、封装外部 API 为 tool

### 2.1 用 Vercel AI SDK 的 tool() + fetch

```ts
import { tool } from 'ai'
import { z } from 'zod'

const sendSlack = tool({
  description: '向指定 Slack 频道发送一条消息',
  parameters: z.object({
    channel: z.string().describe('频道 ID，如 C12345'),
    text: z.string().describe('消息正文'),
  }),
  execute: async ({ channel, text }) => {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
      },
      body: JSON.stringify({ channel, text }),
    })
    return res.json()
  },
})
```

### 2.2 通用 HTTP 工具（让 LLM 自己决定调哪个接口）

```ts
const callApi = tool({
  description: '调用任意外部 REST API',
  parameters: z.object({
    url: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    body: z.string().optional(),
  }),
  execute: async ({ url, method, body }) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? body : undefined,
    })
    return res.text()
  },
})
```

> 注意：通用 HTTP 工具权限很大，务必配合白名单域名 + 人工确认（见坑位表）。

## 三、Webhook：让外部事件触发 Agent

Webhook 是「入站」通道。以 Next.js Route Handler 接收 GitHub Push 为例：

```ts
// app/api/webhook/github/route.ts
export async function POST(req: Request) {
  const payload = await req.json()
  // 1. 校验签名（安全！）
  // 2. 根据事件类型触发对应 Agent
  if (payload.ref === 'refs/heads/main') {
    await runDeployAgent(payload.repository.name)
  }
  return Response.json({ ok: true })
}
```

- Webhook 让 Agent 从「被动问答」变「事件驱动自动化」
- 典型场景：CI 失败自动建 Issue、支付成功自动发券、表单提交自动建档

## 四、可靠性与安全的必做项

| 关注点 | 做法 |
|--------|------|
| 重试 | fetch 失败用指数退避（呼应 Day 9 HTTP 重试） |
| 超时 | AbortController + setTimeout 防挂死 |
| 鉴权 | Token 走环境变量，绝不硬编码 |
| 签名校验 | Webhook 必须验签（GitHub `X-Hub-Signature`） |
| 域名白名单 | 通用 HTTP 工具限制可访问 host |
| 幂等 | Webhook 可能重复推送，用 eventId 去重 |

## 五、与前面模块组合

- **多 Agent（Day 41-45）**：API 工具常作为「执行 Agent」的末端动作
- **记忆（Day 24-25）**：API 返回结果可进向量记忆，避免重复调用
- **代码执行（Day 47）**：复杂返回体用 vm 解析更安全

## 六、常见坑

| 坑 | 后果 | 规避 |
|----|------|------|
| Token 硬编码进代码 | 泄露 | 走 env / Secret 管理 |
| Webhook 不验签 | 伪造请求 | 强制签名校验 |
| 无限重试 | 打爆对方服务 | 退避上限 + 熔断 |
| 通用 HTTP 工具无白名单 | SSRF 攻击 | host 白名单 |
| 忽略 4xx/5xx | 静默失败 | 检查 status 抛错 |
| 官方站不可访问 | 卡文档 | 用国内镜像 |

## 七、今日实践任务

1. 封装一个「发飞书/Slack 消息」tool，接入你的 Agent 多步流程
2. 写一个接收 Webhook 的 Route Handler，验签后触发一个简单 Agent
3. 给通用 HTTP 工具加域名白名单 + 指数退避重试，写进 README

🔗 学习资料（国内可访问镜像）：
- Vercel AI SDK Tools 文档：https://ai-sdk.com.cn/docs/ai-sdk-core/tools-and-tool-calling ✅
- Vercel AI SDK 中文：https://ai-sdk.com.cn/docs/introduction ✅
- LangChain JS 中文：https://js.langchain.com.cn/docs/ ✅
- 菜鸟教程 AI Agent：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅
