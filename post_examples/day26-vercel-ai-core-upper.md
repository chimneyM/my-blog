---
id: "30"
title: "AI Agent 学习计划 Day 26：Vercel AI SDK - AI Core（上）— 统一 LLM 调用接口与 generateText"
slug: "ai-agent-day26-vercel-ai-core-upper"
date: "2026-07-27"
tags: ["AI Agent", "Vercel AI SDK", "generateText", "AI Core", "学习笔记"]
excerpt: "AI Agent 84 天学习计划第二十六天。从 LangChain.js 切换到 Vercel AI SDK：它更轻量、流式优先、对前端（React/Next.js）集成极好。今天聚焦 AI Core（上）：统一的模型调用接口、generateText 的多种用法、messages 与 prompt 模板、部分流式（partialStream）、错误处理与多模型切换，对比 LangChain 让你体会两种设计哲学。"
readingTime: 33
---

# AI Agent 学习计划 Day 26：Vercel AI SDK - AI Core（上）

> 📅 日期：2026-07-27  
> 🎯 阶段二：核心框架（Day 15-35）  
> 📊 学习进度：Day 26 / 84（31.0%）

## 前言

前 11 天（Day 15-25）我们啃完了 LangChain.js 五大模块。今天起切换到**第二个核心框架 Vercel AI SDK**——它更轻量、流式优先、和 Next.js/React 前端集成是「亲儿子」级别。

AI SDK 的包结构：
- `@ai-sdk/core` / `ai`：AI Core（模型调用、生成、流式）。
- `@ai-sdk/react`：前端 `useChat` 等 UI hook。
- `@ai-sdk/openai` / `@ai-sdk/anthropic`：各家模型 provider。

今天先攻 **AI Core（上）**：怎么用一套统一 API 调任意模型。

## 一、安装与初始化

```bash
npm i ai @ai-sdk/openai @ai-sdk/react
```

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const { text } = await generateText({
  model: openai("gpt-4o-mini"),
  prompt: "用一句话解释什么是 AI Agent。",
});
console.log(text);
```

关键点：模型通过 `provider("model-id")` 指定，**换模型只改这一行**——这就是「统一接口」的威力（`anthropic("claude-3-5-sonnet")` 即可无缝切换）。

## 二、generateText 的几种用法

### 1. 简单 prompt
```ts
const { text } = await generateText({
  model: openai("gpt-4o-mini"),
  prompt: "……",
});
```

### 2. messages 多轮（更接近 Chat 场景）
```ts
const { text } = await generateText({
  model: openai("gpt-4o-mini"),
  messages: [
    { role: "system", content: "你是中文技术助手。" },
    { role: "user", content: "什么是 RAG？" },
    { role: "assistant", content: "RAG 是检索增强生成……" },
    { role: "user", content: "能举个例子吗？" },
  ],
});
```

### 3. 模板 + 变量（prompt 工程）
```ts
const { text } = await generateText({
  model: openai("gpt-4o-mini"),
  system: "你是{role}，请用{style}风格回答。",
  prompt: "解释向量数据库。",
  // 通过 messages 传参需手动替换，或用 experimental 模板
});
```

## 三、返回值全貌

`generateText` 不止返回 `text`：

```ts
const result = await generateText({ model, prompt });
result.text;        // 完整文本
result.finishReason; // "stop" | "length" | "tool-calls" | ...
result.usage;        // { promptTokens, completionTokens, totalTokens }
result.response;     // 原始响应（含 id、model、headers）
result.toolCalls;    // 若有工具调用（Day 30+ 用）
```

`usage` 对成本监控很重要；`finishReason === "length"` 说明触到了 `maxTokens` 上限，需要调大。

## 四、部分流式：partialTextStream

想在生成时就逐步拿到文本（不写流式 API）？AI SDK 提供 `partialTextStream`：

```ts
const result = await generateText({ model, prompt });
for await (const delta of result.partialTextStream) {
  process.stdout.write(delta);
}
```

> 真正的「流式 API」用 `streamText`（明天 Day 27 详讲），`partialTextStream` 是 `generateText` 的便捷包装。

## 五、错误处理与多模型切换

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

// 失败自动降级到另一个 provider
async function chat(prompt: string) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    });
    return text;
  } catch (e) {
    const { text } = await generateText({
      model: anthropic("claude-3-5-haiku"),
      prompt,
    });
    return text;
  }
}
```

## 六、LangChain vs Vercel AI SDK（设计哲学对比）

| 维度 | LangChain.js | Vercel AI SDK |
|------|-------------|---------------|
| 定位 | 全家桶（链/代理/检索/记忆） | 轻量核心 + 前端流式优先 |
| 学习曲线 | 重（概念多） | 轻（API 直白） |
| 前端集成 | 需自己接 | `useChat` 开箱即用 |
| 流式 | LCEL 流式较繁琐 | 一等公民（`streamText`） |
| 适合 | 复杂 RAG/Agent 编排 | 聊天 UI、快速产品化 |

后续 Day 57+ 实战会用两者结合：Vercel AI SDK 做流式对话 UI + LangChain 做后端 RAG。

## 七、常见坑

1. **忘记装 provider 包** → `openai` 来自 `@ai-sdk/openai`，只装 `ai` 会报「model not found」。
2. **混用模型 id 格式** → `openai("gpt-4o-mini")` 不是 `"openai/gpt-4o-mini"`，provider 已封装前缀。
3. **`finishReason: "length"` 没处理** → 长输出被截断，应调大 `maxTokens` 或改用流式。
4. **Node 版本过低** → AI SDK v4+ 需 Node 18+，老环境会报运行时错误。
5. **官方站不可访问** → sdk.vercel.ai 在用户网络下不稳定，改用国内镜像（见下）。
6. **`generateText` 大输出占内存** → 超长生成优先 `streamText` 边收边处理。

## 八、今日小结

- Vercel AI SDK = 轻量 + 流式优先 + 前端亲儿子；核心包 `ai` + provider 包（如 `@ai-sdk/openai`）。
- `generateText({ model, prompt/messages })` 是统一入口，换模型只改 `provider("id")`。
- 返回值含 `text / finishReason / usage / toolCalls`，`usage` 用于成本监控。
- `partialTextStream` 可渐进拿文本；真流式用明天的 `streamText`。
- 与 LangChain 互补：Vercel 做流式 UI，LangChain 做后端编排。

---

🔗 **学习资料与网站**（优先国内可访问镜像）：
- Vercel AI SDK 中文文档（引言）：https://ai-sdk.com.cn/docs/introduction
- Vercel AI SDK 中文文档（generateText）：https://ai-sdk.com.cn/docs/ai-sdk-core/generate-text
- Vercel AI SDK 完整深入教程（掘金）：https://juejin.cn/post/7604761524977500169
- Vercel AI SDK 6 完整教程（腾讯云）：https://cloud.tencent.com/developer/article/2630363
- 官方文档（可能受限）：https://sdk.vercel.ai/docs/ai-sdk-core/generating-text

💡 **学习建议**：
- 今天务必本地跑通 `generateText`，并故意把模型换成 `anthropic("claude-3-5-haiku")`（需装 `@ai-sdk/anthropic` + 配 key），体会「换模型只改一行」。
- 打印 `result.usage` 和 `result.finishReason`，养成关注 token 成本的习惯。
- 把 Day 26 与 Day 16（LangChain Model I/O）对照看，理解两种「统一调用」设计差异——这决定了你将来选型。

⏰ 预计学习时长：2 小时

---

进度：Day 26 / 84（31.0%）  
下一站：Day 27 —— Vercel AI SDK - AI Core（下）：streamText 与流式响应
