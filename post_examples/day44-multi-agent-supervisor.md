---
id: 48
title: "AI Agent 学习计划 - Day 44：多 Agent 编排（四）层级管理模式（Supervisor）"
slug: "ai-agent-day44-multi-agent-supervisor"
date: "2026-08-14"
tags: ["AI Agent", "多 Agent 编排", "Supervisor", "AutoGen", "学习计划"]
excerpt: "层级管理模式用一个 Supervisor（主管）Agent 把复杂任务拆解成子任务、分派给专业子 Agent 并汇总结果，是多 Agent 编排从「线/分叉/环网」走向「树状指挥中心」的关键一跃。"
readingTime: 12
---

# Day 44：多 Agent 编排（四）— 层级管理模式（Supervisor）

## 一、为什么需要层级管理（Supervisor）

前三天我们看过三种拓扑：

- **Day 41 顺序链**：线性流水线，前输出即后输入，但流程写死。
- **Day 42 路由分发**：Router 按意图把请求**一次性**交给某个专业 Agent，彼此不协作。
- **Day 43 协作讨论**：多个 Agent **平等**轮流发言、互相修订，但没人拍板、成本难控。

当任务足够复杂（如「写一篇竞品分析报告」「开发一个功能模块」），会出现三类问题：

1. **子任务之间有先后依赖**：先调研才能写、先写才能审，单靠路由的「一次性分发」搞不定。
2. **需要统一指挥**：讨论模式无人裁决，顺序链无人拆分，复杂任务必须有个「总指挥」负责规划 + 分派 + 收口。
3. **子 Agent 需要被复用与并行**：不同子任务可能交给不同专家，甚至并行跑。

**Supervisor（主管）模式**就是答案：一个中心 Agent 充当「项目经理」，负责把大任务拆成子任务、派给专业子 Agent、收集结果、决定下一步或收工。

> 心智模型：顺序链是「流水线」，路由是「前台分流」，讨论是「圆桌会议」，Supervisor 是「作战指挥中心」——树状、有层级、有决策权。

## 二、Supervisor 的核心结构

```
            ┌─────────────────┐
            │   Supervisor     │  ← 规划 / 分派 / 汇总 / 终止
            └─────────────────┘
              │     │     │
        ┌─────┘     │     └─────┐
        ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ Researcher│ │ Writer  │ │ Reviewer │  ← 专业子 Agent（可并行）
   └─────────┘ └─────────┘ └─────────┘
```

Supervisor 自身也是一个 LLM Agent，关键能力：

- **任务分解（Plan）**：把目标拆成有序子任务列表。
- **分派（Delegate）**：根据子任务类型选对应子 Agent（可并行派发）。
- **汇总（Aggregate）**：收集各子 Agent 的返回，拼成中间状态。
- **状态决策（Route/Stop）**：根据当前进度决定「继续派下一个子任务」还是「任务完成收工」。

## 三、AutoGen 实现层级管理（推荐）

AutoGen 的 `GroupChat` + `GroupChatManager` 天然就是 Supervisor 模式：Manager 充当主管，按 `speaker_selection_method` 决定下一个发言的 Agent。

```ts
import { AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager, LLMConfig } from "autogen";

const llm: LLMConfig = { model: "gpt-4o", apiKey: process.env.OPENAI_API_KEY! };

// 三个专业子 Agent
const researcher = new AssistantAgent("researcher", {
  llm,
  systemMessage: "你负责检索与调研，输出结构化的事实要点，不要写结论。",
});
const writer = new AssistantAgent("writer", {
  llm,
  systemMessage: "你根据 researcher 的事实要点撰写报告正文，语言精炼。",
});
const reviewer = new AssistantAgent("reviewer", {
  llm,
  systemMessage: "你审校 writer 的草稿，指出事实错误与逻辑漏洞，给出修改建议。",
});

// 主管：GroupChatManager 自动按上下文挑选下一个发言者
const groupChat = new GroupChat({
  agents: [researcher, writer, reviewer],
  messages: [],
  max_round: 8,                 // 终止条件：轮数上限，防止死循环
  speaker_selection_method: "auto", // auto=由 LLM 选下一个发言者（即 Supervisor 决策）
});

const manager = new GroupChatManager("manager", llm, groupChat);

const user = new UserProxyAgent("user", {
  humanInputMode: "NEVER", // 自动化场景无需人工干预
  codeExecutionConfig: false,
});

// 启动：把任务交给 manager，由它主导编排
await user.initiate_chat(manager, { message: "请调研并撰写一篇『2026 多 Agent 框架对比』报告。" });
```

要点：

- `GroupChatManager` 就是 Supervisor，它读全部历史、决定下一步谁说话。
- `max_round` 是**硬性终止条件**，避免讨论模式（Day 43）的无限循环问题。
- `speaker_selection_method: "auto"` 让 LLM 自主管选择下一个 Agent，等价于「动态分派」；也可设 `"round_robin"` 强制轮转，或 `"manual"` 人工指定。

## 四、LangChain.js 手搓 Supervisor（可控性更强）

如果不想引入 AutoGen，可用 LCEL + 一个「路由决策」Supervisor 链自己编排：

```ts
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";

const model = new ChatOpenAI({ model: "gpt-4o" });

// 子 Agent（复用前几天的链）
const researchChain = PromptTemplate.fromTemplate("调研主题：{task}\n输出要点：")
  .pipe(model).pipe((m) => m.content as string);
const writeChain = PromptTemplate.fromTemplate("根据要点写报告：\n{context}")
  .pipe(model).pipe((m) => m.content as string);

// Supervisor 决策链：返回下一个要执行的 agent 名
const supervisorChain = RunnableSequence.from([
  PromptTemplate.fromTemplate(
    `当前任务：{goal}\n已完成子任务与结果：\n{history}\n` +
    `可选子 Agent：research / write / finish\n` +
    `只返回 JSON：{{"next":"research|write|finish","reason":"..."}}`
  ),
  model,
  new JsonOutputParser(),
]);

// 编排循环
async function runSupervisor(goal: string) {
  let history = "";
  for (let i = 0; i < 6; i++) {
    const { next } = await supervisorChain.invoke({ goal, history });
    if (next === "finish") break;
    if (next === "research") {
      const r = await researchChain.invoke({ task: goal });
      history += `\n[research] ${r}\n`;
    } else if (next === "write") {
      const w = await writeChain.invoke({ context: history });
      history += `\n[write] ${w}\n`;
    }
  }
  return history;
}
```

这种方式把「Supervisor 决策」显式抽成一条链，比 GroupChat 更可控、更易加日志和成本护栏。

## 五、四种拓扑选型对比

| 模式 | 拓扑 | 决策权 | 适用场景 | 风险 |
|------|------|--------|----------|------|
| 顺序链 (Day 41) | 线 | 无（写死） | 固定流水线 | 流程僵化 |
| 路由 (Day 42) | 分叉 | Router 一次性 | 意图分明、单专家 | 子 Agent 不协作 |
| 讨论 (Day 43) | 环网 | 无（平等） | 多视角权衡 | 无裁决、成本高 |
| **Supervisor (Day 44)** | **树状** | **主管拍板** | **复杂依赖任务** | **主管规划失误** |

## 六、常见坑

- **主管规划失误**：Supervisor 把任务拆错，后面全错。→ 给 Supervisor 明确的「子 Agent 能力清单」和拆解示例。
- **无限循环**：子 Agent 反复派发同一任务。→ 必须有 `max_round` / 最大迭代硬上限。
- **上下文膨胀**：每轮子 Agent 结果都回灌给 Supervisor，历史爆炸。→ 让子 Agent 只回传**摘要**，Supervisor 维护精简状态。
- **成本失控**：Supervisor 多一次 LLM 决策调用。→ 简单任务别上 Supervisor，路由/顺序链更省。
- **串行拖慢**：子任务本可并行却被 Supervisor 串行派发。→ 识别无依赖子任务，并行 `Promise.all`。
- **官方站不可访问**：`sdk.vercel.ai` / `js.langchain.com` 在部分网络受限，本文档均用国内镜像替代。

## 七、学习建议

1. 今天先用 AutoGen `GroupChat` 跑通一个小 demo（三个角色：调研/写作/审校），感受 Manager 如何自动选下一个发言者。
2. 再用手搓版 Supervisor 链，理解「决策」与「执行」分离的本质。
3. 重点体会：**Supervisor 不是又一个 Agent，而是「元控制层」**——它自己不干活，只负责规划、分派、收口。
4. 思考题：如果子任务彼此强依赖（A 输出是 B 输入），Supervisor 应串行派发；若独立，应并行。如何在决策链里表达这种依赖？

## 八、国内可访问学习资料

- AutoGen GitHub 仓库：https://github.com/microsoft/autogen ✅
- AutoGen 中文文档（社区）：https://autogen-agentchat.readthedocs.io/ ✅
- LangChain JS 中文文档：https://js.langchain.com.cn/docs/ ✅
- LangChain 中文文档：https://langchain-doc.cn/ ✅
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅
- 掘金 多 Agent 编排实战（Supervisor 模式）：https://juejin.cn/post/7357554457913966627 ✅
