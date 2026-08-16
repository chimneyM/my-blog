---
id: 50
title: "AI Agent 学习计划 - Day 46：工具集成（一）搜索工具（Tavily / SerpAPI / Bing Search）"
slug: "ai-agent-day46-tool-integration-search"
date: "2026-08-16"
tags: ["AI Agent", "工具集成", "搜索工具", "Tavily", "SerpAPI", "学习计划"]
excerpt: "Agent 不能只靠训练知识，实时联网检索是突破知识截止日期的关键。今天对比 Tavily（AI 原生）、SerpAPI（搜索引擎结果）、Bing Search 三类搜索工具，并用 LangChain / Vercel AI SDK 接入。"
readingTime: 12
---

# Day 46：工具集成（一）— 搜索工具（Tavily / SerpAPI / Bing Search）

## 一、为什么 Agent 需要搜索工具

LLM 的知识有**截止日期**（knowledge cutoff），且无法获取实时信息（股价、天气、最新新闻）。给 Agent 接上搜索工具，等于给它装了「实时眼睛」：

- 突破知识截止：查最新文档、API 版本、新闻事件
- 获取私域/实时数据：配合后面 Day 48 的数据库工具
- 事实核查：让回答基于检索结果而非记忆（减少幻觉，呼应 Day 36-40 的 RAG）

> 搜索工具 vs RAG：RAG 是查**你自己的知识库**（Day 36-40），搜索工具是查**公网实时信息**，两者常组合使用。

## 二、三类搜索工具对比

| 工具 | 定位 | 返回形式 | 适合场景 | 国内可访问 |
|------|------|----------|----------|-----------|
| **Tavily** | AI 原生搜索，专为 Agent 设计 | 已清洗的上下文片段 + 来源 URL | Agent 问答、RAG 补充 | 需 API Key（海外服务） |
| **SerpAPI** | 封装 Google/Bing 搜索结果 | 原始搜索结果 JSON（有机结果/知识图谱） | 需要完整 SERP 结构 | 需 API Key（海外服务） |
| **Bing Search** | 微软 Bing Web Search API | Web 结果 + 新闻 + 图片 | Azure 生态、企业合规 | 需 Azure Key（海外服务） |

**Tavily 最推荐入门**：专为 LLM 优化，返回 `__args` 已是适合塞进 Prompt 的摘要，省去清洗。

## 三、Tavily 接入（LangChain.js）

LangChain 内置 `@langchain/community` 的 TavilySearch 工具：

```ts
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatOpenAI } from "@langchain/openai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const search = new TavilySearchResults({ apiKey: process.env.TAVILY_API_KEY });
// 也可限定参数：{ apiKey, maxResults: 3, includeAnswer: true }

const model = new ChatOpenAI({ model: "gpt-4o" });
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个严谨的助手，回答必须基于搜索结果并附来源。"],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const agent = createToolCallingAgent({ llm: model, tools: [search], prompt });
const executor = new AgentExecutor({ agent, tools: [search], maxIterations: 3 });

const res = await executor.invoke({ input: "2026 年主流多 Agent 框架有哪些新进展？" });
console.log(res.output);
```

## 四、Tavily 原生 HTTP 调用（不依赖框架，可移植）

```ts
async function tavilySearch(query: string) {
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: 3,
      include_answer: true,
      search_depth: "advanced",
    }),
  });
  const data = await r.json();
  // data.results: [{title, url, content}], data.answer: 摘要
  return data.results.map((x: any) => `[${x.title}](${x.url}): ${x.content}`).join("\n");
}
```

## 五、Vercel AI SDK 接入（tool() 定义）

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { tool } from "ai";
import { z } from "zod";

const webSearch = tool({
  description: "搜索公网实时信息，用于回答需要最新资料的问题",
  parameters: z.object({ query: z.string().describe("搜索关键词") }),
  execute: async ({ query }) => {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, max_results: 3 }),
    });
    return (await r.json()).results;
  },
});

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: { webSearch },
  maxSteps: 3,
  prompt: "2026 年 AI Agent 框架有哪些新进展？",
});
```

## 六、搜索工具与 RAG / 多 Agent 的组合

- **搜索 + RAG**：先用搜索拉公网最新资料，再和本地知识库一起做 RAG（Day 36-40），兼顾「实时」与「私域」。
- **搜索 + Supervisor（Day 44）**：把搜索 Agent 作为 Supervisor 手下的一个专业子 Agent，与 Researcher/RAG 并列。
- **查询改写（Day 40 Query Transform）**：搜索前对用户问题做 Multi-Query 扩展，提升召回。

## 七、常见坑

- **API Key 是海外服务**：Tavily / SerpAPI / Bing 均需在海外可访问环境调用，国内直连可能超时 → 注意网络与代理配置。
- **结果未清洗直接塞 Prompt**：SerpAPI 原始结果噪声大，要筛选 `snippet`/`title` 而非整页 HTML。
- **来源丢失无法溯源**：务必把 `url` 一起回传，参考 Day 63 的引用溯源设计。
- **过度搜索**：每个问题都搜索会推高延迟和成本 → 让 Agent 先判断是否「真需要实时信息」。
- **搜索结果当事实**：搜索结果也可能有误，关键结论应交叉验证。
- **官方站不可访问**：`docs.tavily.com` 等文档可能受限，建议同时看社区中文教程。

## 八、学习建议

1. 注册 Tavily 免费 Key，用「原生 HTTP 调用」版本先跑通，理解返回结构。
2. 再接 LangChain `TavilySearchResults` 或 Vercel `tool()`，体会框架封装差异。
3. 思考题：如何让 Agent 在「本地知识库有答案」时优先用 RAG、「本地没有」才搜索？（提示：结合 Day 42 路由思路）

## 九、国内可访问学习资料

- Tavily 官方文档：https://docs.tavily.com/ ✅（需海外网络）
- SerpAPI 文档：https://serpapi.com/search-api ✅
- Bing Web Search API（微软）：https://learn.microsoft.com/zh-cn/bing/search-apis/bing-web-search/ ✅（中文）
- LangChain JS 中文文档（Tools）：https://js.langchain.com.cn/docs/ ✅
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅
- 掘金 Agent 联网搜索实战：https://juejin.cn/post/7357554457913966627 ✅
