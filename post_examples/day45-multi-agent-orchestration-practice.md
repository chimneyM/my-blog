---
id: 49
title: "AI Agent 学习计划 - Day 45：多 Agent 编排实践（综合 demo）"
slug: "ai-agent-day45-multi-agent-orchestration-practice"
date: "2026-08-15"
tags: ["AI Agent", "多 Agent 编排", "Supervisor", "LangChain", "学习计划"]
excerpt: "把 Day 41-44 的顺序链、路由、讨论、Supervisor 四种拓扑落地成一个可运行的多 Agent 编排 demo：调研 Agent 检索事实、写作 Agent 生成报告、审校 Agent 把关质量，由 Supervisor 统一调度。"
readingTime: 13
---

# Day 45：多 Agent 编排实践（综合 demo）

## 一、今日目标

前四天我们分别学了四种多 Agent 拓扑：

- **Day 41 顺序链**：线性流水线
- **Day 42 路由分发**：按意图一次性分发
- **Day 43 协作讨论**：多 Agent 平等轮流修订
- **Day 44 层级管理（Supervisor）**：主管规划 + 分派 + 收口

今天把它们**组合落地**成一个真实可运行的多 Agent 编排 demo，体会「什么时候用哪种拓扑」。

## 二、Demo 设计：智能研究报告助手

我们把四种模式串进一个系统：

```
用户问题
   │
   ▼
[Router Agent]  ── 意图路由（Day 42）
   ├─ 闲聊 → Chat Agent（直接回答）
   └─ 研究类 → 进入 Supervisor 流水线（Day 44）
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
   [Researcher] [Writer]  [Reviewer]
   检索事实(复用    撰写报告    审校把关
    Day39 RAG)    (顺序链)    (讨论式修订)
          └─────────┴─────────┘
                    │
                汇总输出
```

要点：

- **路由**在最外层做「要不要进研究流水线」的判断（省成本）。
- **Supervisor** 在研究流水线内做规划与分派。
- **Researcher → Writer** 是顺序链（Day 41），前输出即后输入。
- **Reviewer** 与 Writer 之间可用讨论模式（Day 43）迭代修订，直到质量达标或达轮数上限。

## 三、LangChain.js 实现骨架

```ts
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnableBranch } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";

const model = new ChatOpenAI({ model: "gpt-4o" });

// 1) Router（Day 42 语义路由）
const router = RunnableSequence.from([
  PromptTemplate.fromTemplate(
    `问题：{question}\n只返回 JSON：{{"type":"chat|research"}}`
  ),
  model,
  new JsonOutputParser(),
]);

// 2) Researcher（复用 Day 39 的 RAG 检索链）
const researchChain = PromptTemplate.fromTemplate(
  "你是基于证据的调研员。问题：{question}\n请输出 3-5 条结构化事实要点，不要写结论。"
).pipe(model).pipe((m) => m.content as string);

// 3) Writer（顺序链，消费 research 输出）
const writeChain = PromptTemplate.fromTemplate(
  "根据以下事实撰写报告正文：\n{facts}"
).pipe(model).pipe((m) => m.content as string);

// 4) Reviewer（讨论式修订，最多 2 轮）
const reviewChain = PromptTemplate.fromTemplate(
  "审校报告，指出事实错误与逻辑漏洞，给出修改建议：\n{report}"
).pipe(model).pipe((m) => m.content as string);

// 5) Supervisor 调度（Day 44）
async function supervisor(question: string) {
  const facts = await researchChain.invoke({ question });      // 顺序：先调研
  let report = await writeChain.invoke({ facts });             // 再写
  for (let i = 0; i < 2; i++) {                                // 讨论：审校迭代
    const feedback = await reviewChain.invoke({ report });
    if (feedback.includes("无需修改")) break;
    report = await writeChain.invoke({ facts: facts + "\n审校意见：" + feedback });
  }
  return report;
}

// 6) 入口（RunnableBranch 路由）
const chatChain = PromptTemplate.fromTemplate("友好回答：{question}")
  .pipe(model).pipe((m) => m.content as string);

const app = RunnableBranch.from([
  {
    // condition 同步调 router，true 走 research 分支
    condition: async (input: { question: string }) =>
      (await router.invoke(input)).type === "research",
    chain: RunnableSequence.from([
      (input: { question: string }) => input.question,
      supervisor,
    ]),
  },
  chatChain,
]);

const result = await app.invoke({ question: "对比 2026 年主流多 Agent 框架" });
console.log(result);
```

> 说明：`RunnableBranch` 的 `condition` 异步调用 router 决定走研究流水线还是闲聊分支；研究流水线内由 `supervisor` 函数编排调研→写作→审校。

## 四、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 外层分流 | Router（Day 42） | 闲聊不进重链路，省成本 |
| 调研→写作 | 顺序链（Day 41） | 强依赖，前输出即后输入 |
| 质量把关 | 讨论式修订（Day 43） | 用 Reviewer 迭代而非一次定稿 |
| 整体调度 | Supervisor（Day 44） | 统一规划、分派、收口 |

## 五、今天要沉淀的「可运行 demo」

建议把上面的骨架补全成一个最小可跑项目：

1. 配置 `OPENAI_API_KEY`（或兼容 endpoint）。
2. `.env` + `tsx` 直接跑 `tsx demo.ts`。
3. 用至少 2 个真实问题测试：`闲聊问题` 和 `研究类问题`，验证路由正确。
4. 给研究流水线加 `console.log` 观察 Supervisor 每一步的分派。

## 六、常见坑

- **路由 condition 同步问题**：`RunnableBranch` 的 condition 必须返回 boolean，`router` 是异步的，记得 `await`。
- **研究流水线无终止**：讨论式修订必须设轮数上限，否则 Reviewer 永远挑刺。
- **上下文膨胀**：每轮把 facts + 反馈都喂给 Writer，历史会爆炸 → 只回传摘要。
- **路由标签漂移**：让 router 只输出固定枚举（`chat|research`），别让它自由发挥。
- **Supervisor 规划失误**：给 Supervisor 明确的子 Agent 能力清单。
- **官方站不可访问**：`js.langchain.com` / `sdk.vercel.ai` 受限，本文档均用国内镜像替代。

## 七、学习建议

1. 先跑通上面的骨架（哪怕 Researcher 不接真实 RAG，先用假事实），重点是**感受四种拓扑如何组合**。
2. 再逐步把 Researcher 换成 Day 39 的真实 RAG 检索链，体会「编排框架」与「能力组件」解耦。
3. 思考题：如果要支持「并行调研多个子主题」，Supervisor 应如何改造（提示：`Promise.all`）？

## 八、国内可访问学习资料

- LangChain.js Templates：https://github.com/langchain-ai/langchainjs-templates ✅
- LangChain JS 中文文档：https://js.langchain.com.cn/docs/ ✅
- LangChain 中文文档：https://langchain-doc.cn/ ✅
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅
- 掘金 多 Agent 编排实战：https://juejin.cn/post/7357554457913966627 ✅
