---
id: 51
title: "AI Agent 学习计划 - Day 47：工具集成（二）代码执行工具（Node.js VM / Docker 沙箱）"
slug: "ai-agent-day47-tool-integration-code-execution"
date: "2026-08-17"
tags: ["AI Agent", "工具集成", "代码执行", "Node.js VM", "Docker 沙箱", "学习计划"]
excerpt: "让 Agent 真正「动手算」——代码执行工具把 LLM 从纯文本推理升级为能跑程序、算数据、验证结果。今天对比 Node.js vm 轻量沙箱与 Docker 强隔离方案，并给出安全护栏。"
readingTime: 13
---

# Day 47：工具集成（二）— 代码执行工具（Node.js VM / Docker 沙箱）

## 一、为什么 Agent 需要代码执行

LLM 做数学/数据分析容易算错，而让 Agent **生成代码并运行**，能把「推理」变成「可验证的计算」：

- 精确计算：复利、统计、图表数据处理，比纯文本靠谱
- 数据探索：读 CSV/JSON、跑 pandas 式分析（Node 侧用 lodash/sql.js 等）
- 自我验证：代码跑通即证明逻辑成立，呼应 Day 12 Function Calling 的「执行-回灌」闭环
- 这是 OpenAI Code Interpreter、多 Agent 编程助手（Day 71-75）的核心能力

> 搜索工具（Day 46）让 Agent「看世界」，代码执行让 Agent「动手做」。

## 二、两条安全路线对比

| 方案 | 隔离强度 | 启动速度 | 复杂度 | 适用 |
|------|----------|----------|--------|------|
| **Node.js `vm`** | 弱（同进程沙箱） | 极快（毫秒） | 低 | 本地原型、可信代码、轻量计算 |
| **Docker 容器** | 强（OS 级隔离） | 慢（秒级） | 高 | 执行不可信代码、生产环境 |

**核心原则**：代码执行 = 让 LLM 生成任意代码运行，**必须隔离 + 限制 + 超时**，否则等于把服务器root 交给模型。

## 三、Node.js `vm` 轻量沙箱

```ts
import vm from "node:vm";
import { tool } from "ai";
import { z } from "zod";

const codeExec = tool({
  description: "执行 JavaScript 代码做计算或数据处理，返回最后表达式的值",
  parameters: z.object({ code: z.string().describe("要执行的 JS 代码") }),
  execute: async ({ code }) => {
    const sandbox = {
      console,
      Math,
      JSON,
      // 故意不放 fetch/fs/process，限制能力面
    };
    const context = vm.createContext(sandbox);
    try {
      const result = vm.runInContext(code, context, { timeout: 3000 });
      return { ok: true, result: String(result) };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },
});

// 用法：生成并返回 "JSON.stringify([1,2,3].map(x=>x*x))"
```

要点：

- `vm.createContext` 创建隔离上下文，**只注入需要的全局对象**，绝不放 `require`/`process`/`fs`/`fetch`。
- `timeout` 防死循环（配合 Day 6 Event Loop 理解：vm 同步执行会阻塞，超时需要 `vm` 自身或外部 `Promise.race` 兜底）。
- 返回值要可序列化，方便回灌给 LLM（Day 12 的 role:tool 模式）。

## 四、Docker 强隔离（执行不可信代码）

```ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);

async function runInDocker(code: string) {
  // 把代码写入临时文件，挂进只读容器，限制资源
  const cmd = [
    "docker", "run", "--rm",
    "--network", "none",        // 禁网络
    "--memory", "128m",          // 内存上限
    "--cpus", "0.5",             // CPU 上限
    "-v", "/tmp/code:/app:ro",   // 只读挂载
    "node:20-alpine",
    "node", "/app/run.js",
  ];
  const { stdout, stderr } = await exec(cmd[0], cmd.slice(1), { timeout: 10000 });
  return { stdout, stderr };
}
```

要点：

- `--network none` 断网、`--memory/--cpus` 限资源、`--rm` 用完即焚，避免残留。
- 镜像应最小化（alpine），且不预装敏感 CLI。
- 把用户/模型代码写临时文件再挂入，避免命令注入。

## 五、接入 Agent（Vercel AI SDK）

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: { codeExec },        // 上边的 vm 版或 Docker 版
  maxSteps: 4,
  prompt: "计算 2020-2026 年每年复合增长率 8% 的终值，并给出逐年列表（用代码算）。",
});
```

## 六、安全护栏清单（必读）

1. **最小能力面**：沙箱只暴露计算所需 API，不放文件/网络/进程。
2. **资源限制**：CPU/内存/超时三件套，防 OOM 与死循环。
3. **输入输出白名单**：对返回结果做长度截断，防超大输出撑爆上下文。
4. **禁网/只读**：尤其执行不可信代码时断网、只读文件系统。
5. **审计日志**：记录每次执行的代码与结果，便于复盘与追责。
6. **人工确认**：生产环境对「有副作用」的代码（写文件/发请求）加人工审批。

## 七、常见坑

- **vm 不是真隔离**：同进程、可逃逸（如通过 `this`/constructor 拿到 `process`）→ 不可信代码必须 Docker。
- **忘记超时**：死循环 `while(true)` 在 vm 同步执行时会卡死进程 → 设 `timeout` + 外部 `Promise.race` 兜底。
- **注入全局**：往 sandbox 误放 `require`/`global` 导致越权。
- **返回不可序列化**：函数/循环引用无法回灌 LLM → 统一 `String()` 化。
- **Docker 镜像过大**：冷启动慢 → 用 alpine + 预热。
- **官方站不可访问**：`nodejs.org/api/vm.html` 等文档可能受限，用 nodejs.cn 中文镜像。

## 八、学习建议

1. 用 `vm` 版先跑通一个「算复利」的 Agent demo，感受代码执行闭环。
2. 再思考：哪些场景必须升级到 Docker？写下你的安全护栏清单。
3. 思考题：如何让 Agent 自己判断「该搜索（Day 46）还是该写代码算」？（提示：Day 42 路由 + 工具描述）

## 九、国内可访问学习资料

- Node.js 中文网 VM 文档：http://nodejs.cn/api/vm.html ✅
- Node.js 中文网 child_process（Docker 调用）：http://nodejs.cn/api/child_process.html ✅
- Docker 中文文档：https://www.docker.org.cn/ ✅
- 菜鸟教程 AI Agent 系列：https://www.runoob.com/ai-agent/ai-agent-tutorial.html ✅
- 掘金 Agent 代码执行沙箱实践：https://juejin.cn/post/7357554457913966627 ✅
