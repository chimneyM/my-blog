import type { Post } from '../types'

export const posts: Post[] = [
  {
    id: '8',
    title: 'AI Agent 学习计划 Day 6：Node.js Event Loop（事件循环）',
    slug: 'ai-agent-day6-nodejs-event-loop',
    date: '2026-07-07',
    tags: ['Node.js', 'AI Agent', '学习笔记'],
    excerpt: 'AI Agent 84 天学习计划第六天。深入 Node.js 事件循环：libuv 底层机制、六个阶段（timers/pending/poll/check/close）、微任务与宏任务、process.nextTick vs setImmediate vs setTimeout 三剑客对比、异步调度与并发控制、Agent 系统应用场景（流式响应、并发工具调用、定时编排）。',
    readingTime: 30,
    content: `
# AI Agent 学习计划 Day 6：Node.js Event Loop（事件循环）

> 📅 日期：2026-07-07  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 6 / 84（7.1%）

## 前言

经过 Day 5 对 Node.js Stream 与 Buffer 的学习，我们已经掌握了处理 LLM 流式响应的底层数据结构。但要真正理解「为什么流式数据能非阻塞地到达」「为什么 \`setImmediate\` 和 \`setTimeout(fn, 0)\` 的执行顺序会变化」「为什么递归 \`process.nextTick\` 会让 I/O 永远不执行」，就必须深入理解 Node.js 的 **事件循环（Event Loop）**。

事件循环是 Node.js 单线程实现高并发的核心机制，也是后续理解 Agent 异步调度、并发工具调用、定时编排的基石。本文将从 libuv 底层机制出发，系统讲解事件循环的六个阶段、微任务与宏任务、三个核心 API 的对比，并给出 Agent 系统中的实际应用场景。

---

## 一、事件循环基础概念

### 1.1 什么是事件循环

Node.js 是单线程的（指主线程），但能处理高并发 I/O，秘诀就在事件循环。事件循环是一个**不断轮询各阶段队列的循环**，将异步操作的回调分派到主线程执行。

\`\`\`javascript
// 伪代码：事件循环的简化模型
while (tasksStillPending) {
  // 1. timers 阶段：执行到期的 setTimeout/setInterval
  runPendingTimers()
  // 2. pending callbacks：执行延迟的 I/O 回调
  runPendingCallbacks()
  // 3. idle, prepare：内部使用
  runIdlePrepare()
  // 4. poll 阶段：获取新的 I/O 事件，执行 I/O 回调
  runPoll()
  // 5. check 阶段：执行 setImmediate 回调
  runCheck()
  // 6. close callbacks：执行关闭事件回调
  runCloseCallbacks()
  // 每个阶段切换之间，会清空微任务队列
  runMicrotasks()
}
\`\`\`

### 1.2 libuv 底层库

Node.js 的事件循环由 C 语言库 **libuv** 实现，它提供了跨平台的异步 I/O 能力：

- 在 Linux 下使用 \`epoll\`
- 在 macOS 下使用 \`kqueue\`
- 在 Windows 下使用 \`IOCP\`

libuv 维护了一个线程池（默认 4 个线程，可通过 \`UV_THREADPOOL_SIZE\` 调整），用于处理无法异步的文件 I/O、DNS 解析、crypto 等操作。也就是说，**Node.js 并非绝对单线程**——主线程跑 JS 代码，libuv 线程池跑阻塞 I/O。

### 1.3 为什么 JavaScript 是单线程

JavaScript 最初为浏览器设计，操作 DOM 必须串行（多线程操作 DOM 会引发竞态）。Node.js 继承了单线程模型，把所有 I/O 都交给事件循环 + libuv 处理，主线程只负责执行 JS 回调，从而实现非阻塞。

---

## 二、事件循环的六个阶段

事件循环的每一轮（tick）按顺序经过以下六个阶段：

### 2.1 timers 阶段

执行 \`setTimeout\` 和 \`setInterval\` 到期的回调。

\`\`\`javascript
const start = Date.now()
setTimeout(() => {
  console.log(\`定时器延迟了 \${Date.now() - start}ms\`)
}, 100)

// 实际延迟可能大于 100ms，因为 poll 阶段可能阻塞
\`\`\`

> 注意：定时器指定的不是「精确时间」，而是「最小延迟」。如果事件循环正忙于处理 poll 阶段的回调，定时器会被推迟。

### 2.2 pending callbacks 阶段

执行上一轮循环延迟执行的 I/O 回调，例如：

- TCP \`ECONNREFUSED\` 错误回调
- 一些系统级错误的回调

这个阶段很少需要手动干预。

### 2.3 idle, prepare 阶段

仅供 libuv 内部使用，开发者无需关心。

### 2.4 poll 阶段（最关键）

两个核心职责：

1. **获取新的 I/O 事件**（如果有），执行它们的回调
2. **如果没有事件且没有到期的定时器**，会在此阶段阻塞等待，让出 CPU

poll 阶段的阻塞行为：

- 如果 \`setImmediate\` 队列为空，且没有定时器到期，poll 会阻塞等待新事件
- 如果有定时器即将到期，poll 会计算阻塞时长，到期后回到 timers 阶段
- 如果有 \`setImmediate\` 待执行，poll 不阻塞，直接进入 check 阶段

\`\`\`javascript
const fs = require('fs')

fs.readFile('/etc/passwd', () => {
  // 这个回调在 poll 阶段执行
  console.log('文件读取完成')
})
\`\`\`

### 2.5 check 阶段

执行 \`setImmediate\` 的回调。

\`\`\`javascript
setImmediate(() => {
  console.log('我在 check 阶段执行')
})
\`\`\`

### 2.6 close callbacks 阶段

执行关闭事件的回调：

\`\`\`javascript
const socket = net.connect(80)
socket.on('close', () => {
  // 这个回调在 close 阶段执行
  console.log('socket 已关闭')
})
socket.destroy()
\`\`\`

---

## 三、微任务与宏任务

### 3.1 任务分类

| 任务类型 | 包含的 API | 何时执行 |
|---------|-----------|---------|
| **宏任务（Macrotask）** | \`setTimeout\`、\`setInterval\`、\`setImmediate\`、I/O 回调 | 在事件循环的对应阶段执行 |
| **微任务（Microtask）** | \`Promise.then/catch/finally\`、\`queueMicrotask\` | 每个宏任务后立即执行 |
| **nextTick 队列** | \`process.nextTick\` | 优先级高于微任务，在每个阶段切换前清空 |

### 3.2 执行顺序优先级

\`\`\`
事件循环阶段切换时：
  1. 先清空 nextTick 队列（全部执行完）
  2. 再清空微任务队列（全部执行完）
  3. 才进入下一个阶段
\`\`\`

### 3.3 经典示例：执行顺序

\`\`\`javascript
console.log('1: 同步代码')

setTimeout(() => {
  console.log('4: setTimeout 宏任务')
}, 0)

setImmediate(() => {
  console.log('5: setImmediate 宏任务')
})

Promise.resolve().then(() => {
  console.log('3: Promise 微任务')
})

process.nextTick(() => {
  console.log('2: nextTick')
})

// 输出顺序：
// 1: 同步代码
// 2: nextTick
// 3: Promise 微任务
// 4: setTimeout 宏任务  （与 setImmediate 顺序不定，见下文）
// 5: setImmediate 宏任务
\`\`\`

### 3.4 Node.js 11+ 的变化

在 Node.js 11 之前，微任务在每个**阶段**结束后才清空。Node.js 11 之后改为每个**宏任务**后立即清空，与浏览器行为一致：

\`\`\`javascript
// Node.js 11+ 行为
setTimeout(() => {
  console.log('timer1')
  Promise.resolve().then(() => console.log('promise1'))
}, 0)

setTimeout(() => {
  console.log('timer2')
  Promise.resolve().then(() => console.log('promise2'))
}, 0)

// Node.js 11+ 输出：
// timer1
// promise1
// timer2
// promise2

// Node.js 10 及之前输出：
// timer1
// timer2
// promise1
// promise2
\`\`\`

---

## 四、三个核心 API 对比

### 4.1 process.nextTick

把回调放在当前操作完成后立即执行，优先级**最高**。

\`\`\`javascript
function apiCall() {
  console.log('同步代码开始')
  process.nextTick(() => {
    console.log('nextTick 回调')
  })
  console.log('同步代码结束')
}

apiCall()
// 输出：
// 同步代码开始
// 同步代码结束
// nextTick 回调
\`\`\`

**用途**：在异步回调之前同步清理资源、传递错误。

**陷阱**：递归调用 \`process.nextTick\` 会导致 I/O 饥饿！

\`\`\`javascript
// ❌ 危险：I/O 永远不会执行
function recursiveTick() {
  process.nextTick(recursiveTick)
}
recursiveTick()

setTimeout(() => {
  console.log('这行永远不会执行！')
}, 0)

fs.readFile('/etc/passwd', () => {
  console.log('这也不会执行！')
})
\`\`\`

### 4.2 setImmediate

把回调放在 **check 阶段**执行，即下一轮事件循环。

\`\`\`javascript
setImmediate(() => {
  console.log('下一轮事件循环的 check 阶段')
})
\`\`\`

**用途**：在 I/O 回调之后立即执行，是 nextTick 的安全替代品。

### 4.3 setTimeout(fn, 0)

把回调放在 **timers 阶段**执行，最小延迟约 1ms（系统精度）。

\`\`\`javascript
setTimeout(() => {
  console.log('timers 阶段')
}, 0)
\`\`\`

### 4.4 三者对比表

| API | 执行阶段 | 优先级 | 典型延迟 | I/O 饥饿风险 |
|-----|---------|--------|---------|---------------|
| \`process.nextTick\` | 当前操作后 | 最高 | 几乎为 0 | 高（递归会饿死 I/O） |
| \`Promise.then\` | 微任务队列 | 次高 | 几乎为 0 | 中（递归会延迟 I/O） |
| \`setImmediate\` | check 阶段 | 较低 | 一次阶段切换 | 无 |
| \`setTimeout(fn,0)\` | timers 阶段 | 较低 | ≥1ms | 无 |

### 4.5 setTimeout vs setImmediate 的顺序之谜

在主模块（非 I/O 回调内）调用时，两者顺序不确定：

\`\`\`javascript
// 主模块中，顺序不确定（取决于事件循环进入时机）
setTimeout(() => console.log('timeout'), 0)
setImmediate(() => console.log('immediate'))
// 可能输出 timeout immediate，也可能 immediate timeout
\`\`\`

但在 I/O 回调内调用时，**setImmediate 一定先于 setTimeout**：

\`\`\`javascript
const fs = require('fs')

fs.readFile('/etc/passwd', () => {
  setTimeout(() => console.log('timeout'), 0)
  setImmediate(() => console.log('immediate'))
  // 一定输出：immediate timeout
})
\`\`\`

原因：I/O 回调在 poll 阶段执行后，事件循环下一个阶段是 check（执行 setImmediate），再下一轮才是 timers。

---

## 五、异步调度与并发控制

### 5.1 单线程下的"并发"

Node.js 主线程是单线程的，但通过事件循环让 I/O 操作并行：

\`\`\`javascript
// 三个 I/O 操作并行执行，总耗时约等于最慢的一个
const start = Date.now()

const tasks = [
  fetch('https://api.example.com/users'),
  fetch('https://api.example.com/products'),
  fetch('https://api.example.com/orders')
]

Promise.all(tasks).then(() => {
  console.log(\`耗时 \${Date.now() - start}ms\`)  // 远小于三者串行时间
})
\`\`\`

### 5.2 Promise.all 实现并行

\`\`\`javascript
// 并行执行多个工具调用
async function callMultipleTools(promises) {
  const results = await Promise.all(promises)
  // 所有工具完成后才返回
  return results
}
\`\`\`

### 5.3 for...await 实现串行

\`\`\`javascript
// 串行执行：前一个完成才开始下一个
async function serialExecution(tasks) {
  const results = []
  for (const task of tasks) {
    results.push(await task())
  }
  return results
}
\`\`\`

### 5.4 并发限制器

当需要同时调用大量工具时，一次性 \`Promise.all\` 会打满连接池。手写一个简单的并发限制器：

\`\`\`javascript
async function asyncPool(limit, items, iteratorFn) {
  const results = []
  const executing = new Set()

  for (const item of items) {
    // 如果当前并发数已满，等待其中一个完成
    if (executing.size >= limit) {
      await Promise.race(executing)
    }

    const promise = Promise.resolve().then(() => iteratorFn(item))
    results.push(promise)
    executing.add(promise)

    // 完成后从执行集合中移除
    promise.finally(() => executing.delete(promise))
  }

  return Promise.all(results)
}

// 使用：限制并发为 3，调用 10 个 LLM API
const prompts = ['你好', '介绍自己', '写诗', /* ... 7 个更多 */]
const results = await asyncPool(3, prompts, async (prompt) => {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
  })
  return res.json()
})
\`\`\`

### 5.5 避免阻塞事件循环

CPU 密集任务会阻塞事件循环，让所有 I/O 回调延迟：

\`\`\`javascript
// ❌ 阻塞事件循环 5 秒
function heavyCompute(n) {
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += Math.sqrt(i)
  }
  return sum
}

// 这期间的 setTimeout、I/O 回调全部被阻塞
setTimeout(() => console.log('我会延迟 5 秒'), 0)
heavyCompute(1e9)
\`\`\`

解决方案：使用 \`Worker Threads\`（Day 8 将学到），或用 \`setImmediate\` 分片执行：

\`\`\`javascript
// 用 setImmediate 分片：每处理一批就让出事件循环
async function batchProcess(items, batchSize, handler) {
  const results = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    results.push(...batch.map(handler))
    // 让出事件循环，让 I/O 回调有机会执行
    await new Promise(resolve => setImmediate(resolve))
  }
  return results
}
\`\`\`

---

## 六、Agent 系统中的应用场景

### 6.1 流式响应处理

LLM 流式响应的每个 chunk 通过事件循环分批到达：

\`\`\`javascript
// 模拟 LLM 流式响应
async function* streamLLMResponse(prompt) {
  const tokens = ['你', '好', '，', '我', '是', 'AI', '助手']
  for (const token of tokens) {
    // 模拟网络延迟，token 通过 I/O 回调进入事件循环
    await new Promise(resolve => setTimeout(resolve, 100))
    yield token
  }
}

// 处理流：每个 chunk 到达时触发渲染
async function handleStream() {
  for await (const chunk of streamLLMResponse('你好')) {
    process.stdout.write(chunk)
  }
  console.log('\\n流结束')
}
\`\`\`

### 6.2 并发工具调用

Agent 同时调用多个工具（搜索、数据库查询、API 调用）时，事件循环让它们并行：

\`\`\`javascript
async function agentRunWithTools(query) {
  // 并发调用三个工具
  const [searchResults, dbResults, weatherResults] = await Promise.all([
    callSearchTool(query),
    queryDatabase(query),
    callWeatherAPI()
  ])

  // 整合结果发给 LLM
  const finalAnswer = await callLLM({
    searchResults,
    dbResults,
    weatherResults
  })

  return finalAnswer
}
\`\`\`

### 6.3 定时任务编排

\`setInterval\` 实现 Agent 心跳检测、超时控制：

\`\`\`javascript
class AgentRunner {
  constructor() {
    this.heartbeats = new Map()
  }

  // 心跳检测：每 30 秒检查一次 Agent 是否存活
  startHeartbeat(agentId) {
    const timer = setInterval(() => {
      const lastSeen = this.heartbeats.get(agentId)
      if (Date.now() - lastSeen > 60000) {
        console.warn(\`Agent \${agentId} 心跳超时，重启中...\`)
        this.restartAgent(agentId)
      }
    }, 30000)
    return timer
  }

  // 超时控制：5 秒内必须返回，否则取消
  async callWithTimeout(promise, timeout = 5000) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('工具调用超时')), timeout)
    )
    return Promise.race([promise, timeoutPromise])
  }
}
\`\`\`

### 6.4 微任务陷阱：影响 Agent 响应延迟

大量 \`process.nextTick\` 嵌套会导致 I/O 饥饿，影响 Agent 响应延迟：

\`\`\`javascript
// ❌ 反模式：递归 nextTick 会让 LLM 流式响应无法处理
function badRecursiveProcessing(items) {
  function process(index) {
    if (index >= items.length) return
    process.nextTick(() => {
      console.log(\`处理 \${items[index]}\`)
      process(index + 1)
    })
  }
  process(0)
}

// 这期间所有 I/O 回调（包括 LLM 的 token）都被阻塞
// ✅ 正确做法：用 setImmediate 让出事件循环给 I/O
function goodRecursiveProcessing(items) {
  function process(index) {
    if (index >= items.length) return
    setImmediate(() => {
      console.log(\`处理 \${items[index]}\`)
      process(index + 1)
    })
  }
  process(0)
}
\`\`\`

---

## 七、综合实战练习

### 练习 1：事件循环执行顺序实验

\`\`\`javascript
// 实验一：基础执行顺序
console.log('A: 同步开始')

setImmediate(() => console.log('B: immediate'))

setTimeout(() => console.log('C: timeout'), 0)

Promise.resolve().then(() => console.log('D: promise'))

process.nextTick(() => console.log('E: nextTick'))

console.log('F: 同步结束')

// 输出顺序：
// A: 同步开始
// F: 同步结束
// E: nextTick
// D: promise
// B: immediate  （或 C 先，取决于环境）
// C: timeout
\`\`\`

### 练习 2：I/O 回调内的顺序

\`\`\`javascript
const fs = require('fs')

fs.readFile(__filename, () => {
  console.log('1: I/O 回调（poll 阶段）')

  setTimeout(() => console.log('2: timeout'), 0)
  setImmediate(() => console.log('3: immediate'))

  process.nextTick(() => console.log('4: nextTick'))
  Promise.resolve().then(() => console.log('5: promise'))
})

// 输出顺序：
// 1: I/O 回调（poll 阶段）
// 4: nextTick
// 5: promise
// 3: immediate  （一定先于 timeout）
// 2: timeout
\`\`\`

### 练习 3：手写并发限制器

\`\`\`javascript
// 简易版并发限制器：同时只运行 N 个 Promise
class AsyncPool {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency
    this.activeCount = 0
    this.queue = []
  }

  async run(task) {
    if (this.activeCount >= this.maxConcurrency) {
      await new Promise(resolve => this.queue.push(resolve))
    }
    this.activeCount++
    try {
      return await task()
    } finally {
      this.activeCount--
      if (this.queue.length > 0) {
        this.queue.shift()()
      }
    }
  }
}

// 使用：限制同时 2 个请求
const pool = new AsyncPool(2)
const urls = [
  'https://api.example.com/1',
  'https://api.example.com/2',
  'https://api.example.com/3',
  'https://api.example.com/4'
]

const results = await Promise.all(
  urls.map(url => pool.run(() => fetch(url)))
)
\`\`\`

---

## 八、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| 事件循环 | Node.js 单线程实现高并发的核心，由 libuv 实现 |
| 六个阶段 | timers → pending → idle/prepare → poll → check → close |
| 微任务 | Promise.then、queueMicrotask，每个宏任务后执行 |
| nextTick | 优先级最高的微任务，可能造成 I/O 饥饿 |
| setImmediate | check 阶段执行，nextTick 的安全替代 |
| setTimeout | timers 阶段执行，最小延迟 1ms |
| libuv | C 库，跨平台异步 I/O，维护线程池 |

### 关键收获

1. **事件循环六阶段**：理解 poll 是最关键阶段，会阻塞等待新 I/O 事件
2. **微任务优先级**：nextTick > Promise > 宏任务，在每个阶段切换间清空
3. **nextTick 陷阱**：递归调用会饿死 I/O，应改用 setImmediate
4. **Node.js 11+ 变化**：微任务在每个宏任务后立即执行，与浏览器一致
5. **并发控制**：Promise.all 并行、for...await 串行、asyncPool 限并发
6. **避免阻塞**：CPU 密集任务用 Worker Threads 或 setImmediate 分片

### 与 AI Agent 的关联

事件循环在 Agent 开发中的核心应用：

- **流式响应**：LLM 的每个 token 通过 I/O 回调进入事件循环，正确处理才能避免背压
- **并发工具调用**：Agent 同时调用多个工具时，事件循环让它们并行
- **定时编排**：setInterval 实现心跳、超时控制
- **避免阻塞**：大量数据处理要分片，否则阻塞 LLM token 流
- **Worker Threads**：CPU 密集任务（向量计算）应交给 Worker，不阻塞主线程

---

## 九、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| Node.js 中文网 - 事件循环 | https://nodejs.cn/learn/asynchronous-work/event-loop-timers-and-nexttick | 官方事件循环文档中文版，权威完整 |
| Node.js 中文网 - Events 模块 | http://nodejs.cn/api/events.html | Day 7 预习，事件驱动基础 |
| Node.js 中文网 - Process 模块 | http://nodejs.cn/api/process.html | process.nextTick 文档 |
| Node.js 中文网 - Timers 模块 | http://nodejs.cn/api/timers.html | setTimeout、setImmediate 文档 |
| 掘金 - Node.js 事件循环详解 | https://juejin.cn/post/7591744411740061696 | 六阶段详解，配图清晰 |
| 掘金 - Node.js 事件循环与 libuv 源码剖析 | https://juejin.cn/post/7617106857023537179 | 深入 libuv 源码，进阶阅读 |
| 菜鸟教程 - Node.js 事件循环 | https://www.runoob.com/nodejs/nodejs-event-loop.html | 入门友好，适合快速理解 |
| 阿里云开发者 - 事件循环及 setTimeout/setImmediate | https://developer.aliyun.com/article/1611332 | 六阶段解析 + API 对比 |
| 腾讯云开发者 - 事件循环、定时器、nextTick | https://developer.cloud.tencent.com/article/1929203 | nextTick 与 setImmediate 详解 |
| CSDN - Node.js 事件循环机制解析 | https://blog.csdn.net/2301_80723943/article/details/160741808 | 六阶段流程图清晰 |

> **提示**：Node.js 中文网（nodejs.cn）是官方文档的中文镜像，内容完整、更新及时，是首选学习资源。

---

## 十、明日预告

**Day 7：Node.js Event Emitter**

- Event Emitter 是 Node.js 事件驱动的核心类
- \`on\`/\`emit\`/\`once\`/\`off\` 方法详解
- 自定义事件、错误事件处理
- 构建事件驱动的 Agent 系统

Event Emitter 与今天的事件循环紧密衔接——事件循环是"何时执行"，Event Emitter 是"如何触发和监听"。掌握 Event Emitter 是构建事件驱动 Agent 架构的关键一步。

---

> 🚀 Day 6 完成！理解事件循环是掌握 Node.js 异步编程的钥匙，也是后续 Agent 并发调度、流式响应处理的底层基础。

    `.trim(),
  },

  {
    id: '6',
    title: `AI Agent 学习计划 Day 2：TypeScript 装饰器（Decorators）`,
    slug: 'ai-agent-day2-typescript-decorators',
    date: '2026-07-03',
    tags: ["TypeScript","AI Agent","学习笔记"],
    excerpt: `AI Agent 84 天学习计划第二天。系统学习 TypeScript 装饰器：类装饰器、方法装饰器、属性装饰器、参数装饰器、装饰器工厂、元数据与依赖注入原理，并给出 Agent 工具自动注册、调用重试缓存等实战应用。`,
    readingTime: 28,
    content: `
# AI Agent 学习计划 Day 2：TypeScript 装饰器（Decorators）

> 📅 日期：2026-07-03  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 2 / 84（2.4%）

## 前言

昨天的 Day 1 我们系统学习了 TypeScript 类型系统。今天进入 Day 2，主题是 **装饰器（Decorators）**。

装饰器是一种特殊的声明，可以「附加」到类、方法、属性、访问器或参数上，以修改它们的行为。在 Node.js 后端框架中（尤其是 NestJS），装饰器是依赖注入、路由注册、中间件机制的核心。在 AI Agent 开发中，理解装饰器有助于阅读框架源码、构建可扩展的 Agent 服务架构。

本文将从零开始，覆盖类装饰器、方法装饰器、属性装饰器、访问器装饰器、参数装饰器、装饰器工厂、装饰器组合、元数据等全部知识点，并给出 Agent 开发场景中的实际应用。

---

## 一、装饰器概述与启用

### 1.1 什么是装饰器

装饰器本质是一个**函数**，它接收目标对象作为参数，在运行时对目标进行「装饰」（扩展或修改）。语法上使用 \`@expression\` 形式，其中 \`expression\` 求值后必须是一个函数。

\`\`\`typescript
// @sealed 就是一个装饰器
@sealed
class Greeter {
  greet() {}
}
\`\`\`

### 1.2 启用装饰器支持

装饰器目前是实验性特性，需要在 \`tsconfig.json\` 中启用：

\`\`\`json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
\`\`\`

- \`experimentalDecorators\`：启用实验性装饰器（Stage 2 规范）
- \`emitDecoratorMetadata\`：允许装饰器获取类型元数据（需配合 \`reflect-metadata\`）

### 1.3 Stage 2 vs Stage 3 装饰器

> **重要提示**：TypeScript 5.0 起已原生支持 ECMAScript Stage 3 装饰器规范，不再需要 \`experimentalDecorators\`。

| 特性 | Stage 2（旧版实验性） | Stage 3（TS 5.0+ 标准） |
|------|----------------------|------------------------|
| 启用方式 | \`experimentalDecorators: true\` | 默认支持（无需配置） |
| 参数装饰器 | ✅ 支持 | ✅ 支持 |
| 元数据 API | \`reflect-metadata\` 库 | 内置 \`Symbol.metadata\` |
| 框架兼容性 | NestJS、TypeORM 等主流框架 | 新项目可选用，旧框架逐步迁移中 |

当前大多数 Node.js 框架（NestJS、TypeORM、MikroORM 等）仍使用 Stage 2 装饰器，因此本文以 Stage 2 为主进行讲解，这是目前工业界最广泛使用的形式。

---

## 二、装饰器工厂（Decorator Factories）

装饰器工厂是一个**返回装饰器函数**的函数，用于给装饰器传参：

\`\`\`typescript
// 普通装饰器：无法传参
function log(target: any) {
  console.log(target)
}

// 装饰器工厂：可以传参
function logWithMessage(message: string) {
  return function (target: any) {
    console.log(\`\${message}:\`, target.name)
  }
}

@logWithMessage(' decorating class ')
class MyAgent {}
// 输出: decorating class : MyAgent
\`\`\`

工厂模式是实际开发中最常用的形式——NestJS 的 \`@Controller('users')\`、\`@Get('/list')\` 都是装饰器工厂。

---

## 三、类装饰器（Class Decorators）

类装饰器是应用于**类声明**的装饰器，接收一个参数：类的构造函数。

### 3.1 基本用法

\`\`\`typescript
// 类装饰器签名
type ClassDecorator = <TFunction extends Function>(
  target: TFunction
) => TFunction | void

// 示例：密封一个类，禁止添加/删除属性
function sealed(target: Function) {
  Object.seal(target)
  Object.seal(target.prototype)
}

@sealed
class Greeter {
  greeting: string
  constructor(message: string) {
    this.greeting = message
  }
  greet() {
    return "Hello, " + this.greeting
  }
}
\`\`\`

### 3.2 替换/扩展构造函数

类装饰器可以返回一个新的构造函数，**替换**原始类：

\`\`\`typescript
// 装饰器工厂：给类添加 createdAt 属性和日志能力
function reportableClassDecorator<T extends { new (...args: any[]): {} }>(
  constructor: T
) {
  return class extends constructor {
    createdAt = new Date()
    report() {
      console.log(\`Agent 创建于 \${this.createdAt.toISOString()}\`)
    }
  }
}

@reportableClassDecorator
class Agent {
  name: string
  constructor(name: string) {
    this.name = name
  }
}

const agent = new Agent('ResearchBot')
agent.report()  // Agent 创建于 2026-07-03T...
// agent.createdAt 也可以访问
\`\`\`

### 3.3 Agent 开发中的应用：自动注册工具

\`\`\`typescript
// 全局工具注册表
const toolRegistry = new Map<string, any>()

// 类装饰器：自动将 Agent 类注册为可用工具
function AgentTool(name: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    toolRegistry.set(name, constructor)
    console.log(\`[注册工具] \${name} -> \${constructor.name}\`)
    return constructor
  }
}

@AgentTool('web_search')
class WebSearchAgent {
  async execute(query: string) {
    return \`搜索结果: \${query}\`
  }
}

@AgentTool('code_executor')
class CodeExecutorAgent {
  async execute(code: string) {
    return \`执行结果: \${code}\`
  }
}

// 运行时查看注册表
console.log(toolRegistry.keys())
// [注册工具] web_search -> WebSearchAgent
// [注册工具] code_executor -> CodeExecutorAgent
\`\`\`

---

## 四、方法装饰器（Method Decorators）

方法装饰器应用于类的**方法**，接收三个参数：

1. \`target\`：对于静态成员是类的构造函数，对于实例成员是类的原型
2. \`propertyKey\`：方法名（字符串或 Symbol）
3. \`descriptor\`：属性描述符（\`TypedPropertyDescriptor\`）

### 4.1 基本用法

\`\`\`typescript
// 方法装饰器签名
type MethodDecorator = (
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<any>
) => TypedPropertyDescriptor<any> | void

// 示例：修改方法为不可枚举
function enumerable(value: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.enumerable = value
  }
}

class Greeter {
  greeting: string
  constructor(m: string) { this.greeting = m }

  @enumerable(false)
  greet() {
    return "Hello, " + this.greeting
  }
}
\`\`\`

### 4.2 包装方法：日志与耗时统计

方法装饰器最强大的用途是**包装原始方法**，在不修改原代码的情况下增加横切逻辑：

\`\`\`typescript
// 记录方法调用日志
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = function (...args: any[]) {
    console.log(\`[调用] \${propertyKey}(\${args.map(a => JSON.stringify(a)).join(', ')})\`)
    const result = originalMethod.apply(this, args)
    console.log(\`[返回] \${propertyKey} => \${JSON.stringify(result)}\`)
    return result
  }

  return descriptor
}

// 异步方法耗时统计
function measureTime(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = async function (...args: any[]) {
    const start = Date.now()
    const result = await originalMethod.apply(this, args)
    const elapsed = Date.now() - start
    console.log(\`⏱ \${propertyKey} 耗时 \${elapsed}ms\`)
    return result
  }

  return descriptor
}

class LLMClient {
  @log
  @measureTime
  async chat(prompt: string): Promise<string> {
    // 模拟 LLM 调用
    await new Promise(r => setTimeout(r, 500))
    return \`回复: \${prompt}\`
  }
}

const client = new LLMClient()
await client.chat('你好')
// [调用] chat("你好")
// ⏱ chat 耗时 502ms
// [返回] chat => "回复: 你好"
\`\`\`

### 4.3 错误重试装饰器

\`\`\`typescript
// 自动重试装饰器（工厂）
function retry(times: number = 3, delay: number = 1000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      let lastError: Error
      for (let i = 0; i < times; i++) {
        try {
          return await originalMethod.apply(this, args)
        } catch (err) {
          lastError = err as Error
          console.log(\`🔄 \${propertyKey} 第 \${i + 1} 次失败: \${lastError.message}\`)
          if (i < times - 1) {
            await new Promise(r => setTimeout(r, delay))
          }
        }
      }
      throw lastError!
    }

    return descriptor
  }
}

class AgentService {
  @retry(3, 2000)
  async callLLM(prompt: string): Promise<string> {
    // 模拟可能失败的 LLM 调用
    if (Math.random() < 0.5) {
      throw new Error('API 超时')
    }
    return \`LLM 回复: \${prompt}\`
  }
}
\`\`\`

### 4.4 Agent 中的应用：工具调用权限校验

\`\`\`typescript
// 权限校验装饰器
function requirePermission(permission: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = function (this: { permissions: string[] }, ...args: any[]) {
      if (!this.permissions.includes(permission)) {
        throw new Error(\`权限不足：需要 \${permission} 权限\`)
      }
      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

class Agent {
  constructor(
    public name: string,
    public permissions: string[]
  ) {}

  @requirePermission('file:write')
  async writeFile(path: string, content: string) {
    console.log(\`写入文件 \${path}\`)
  }

  @requirePermission('net:request')
  async httpRequest(url: string) {
    console.log(\`请求 \${url}\`)
  }
}

const agent = new Agent('Bot', ['file:write'])
await agent.writeFile('/tmp/test.txt', 'hello')  // ✅
await agent.httpRequest('https://api.example.com')  // ❌ 权限不足
\`\`\`

---

## 五、属性装饰器（Property Decorators）

属性装饰器应用于类的属性，接收两个参数：

1. \`target\`：对于静态成员是构造函数，对于实例成员是原型
2. \`propertyKey\`：属性名

> 注意：属性装饰器**没有**描述符参数，因为属性在原型上初始化时还没有描述符。

\`\`\`typescript
// 属性装饰器：记录属性的元信息
function format(formatString: string) {
  return function (target: any, propertyKey: string) {
    // 将格式化信息存到元数据中
    Reflect.defineMetadata('format', formatString, target, propertyKey)
  }
}

class DateAgent {
  @format('YYYY-MM-DD')
  createdAt: string

  @format('HH:mm:ss')
  timestamp: string
}

// 读取元数据
const formatStr = Reflect.getMetadata('format', DateAgent.prototype, 'createdAt')
console.log(formatStr)  // YYYY-MM-DD
\`\`\`

---

## 六、访问器装饰器（Accessor Decorators）

访问器装饰器应用于 getter/setter，参数与方法装饰器相同：

\`\`\`typescript
// 访问器装饰器：将属性设为不可配置
function configurable(value: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.configurable = value
  }
}

class Point {
  private _x: number
  private _y: number

  constructor(x: number, y: number) {
    this._x = x
    this._y = y
  }

  @configurable(false)
  get x() { return this._x }

  @configurable(false)
  get y() { return this._y }
}
\`\`\`

---

## 七、参数装饰器（Parameter Decorators）

参数装饰器应用于**方法参数**，接收三个参数：

1. \`target\`：对于静态成员是构造函数，对于实例成员是原型
2. \`propertyKey\`：方法名（静态成员为 \`undefined\`）
3. \`parameterIndex\`：参数在函数参数列表中的索引

\`\`\`typescript
// 参数装饰器：标记必填参数
const requiredMetadataKey = Symbol('required')

function required(target: Object, propertyKey: string | symbol, parameterIndex: number) {
  // 获取已有的必填参数索引列表
  const existing = Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || []
  existing.push(parameterIndex)
  Reflect.defineMetadata(requiredMetadataKey, existing, target, propertyKey)
}

// 配合方法装饰器实现参数校验
function validate(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = function (...args: any[]) {
    const requiredParams: number[] = 
      Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || []
    
    for (const index of requiredParams) {
      if (args[index] === undefined || args[index] === null) {
        throw new Error(\`参数 \${index} 是必填的\`)
      }
    }
    return originalMethod.apply(this, args)
  }

  return descriptor
}

class AgentRunner {
  @validate
  execute(
    @required prompt: string,
    options?: { temperature?: number }
  ) {
    console.log(\`执行: \${prompt}\`, options)
  }
}

const runner = new AgentRunner()
runner.execute('你好')          // ✅
runner.execute(undefined as any) // ❌ 参数 0 是必填的
\`\`\`

---

## 八、装饰器组合与求值顺序

### 8.1 多装饰器组合

当多个装饰器应用于同一个声明时，写在一行或分多行：

\`\`\`typescript
// 单行写法
@f @g class A {}

// 多行写法
@f
@g
class B {}
\`\`\`

### 8.2 求值规则

装饰器的求值分为两个阶段，类似数学中的**复合函数**：

1. **自上而下求值**：装饰器表达式从上到下求值（工厂函数被调用）
2. **自下而上调用**：装饰器函数从下到上调用（实际装饰逻辑执行）

\`\`\`typescript
function f() {
  console.log("f(): evaluated")
  return function (target: any) {
    console.log("f(): called")
  }
}

function g() {
  console.log("g(): evaluated")
  return function (target: any) {
    console.log("g(): called")
  }
}

@f
@g
class C {}

// 输出:
// f(): evaluated
// g(): evaluated
// g(): called
// f(): called
\`\`\`

### 8.3 不同声明上的应用顺序

对于同一个类中的多个装饰器，应用顺序如下：

1. **实例方法**：按参数顺序 → 方法
2. **静态方法**：按参数顺序 → 方法
3. **实例属性**：按声明顺序
4. **静态属性**：按声明顺序
5. **构造函数参数**
6. **类装饰器**

\`\`\`typescript
@ClassDecorator
class Example {
  @Property
  instanceProp: string

  @StaticProp
  static staticProp: string

  constructor(@Param param: string) {}

  @Method
  instanceMethod(@Param param: string) {}

  @StaticMethod
  static staticMethod(@Param param: string) {}
}
\`\`\`

---

## 九、元数据（Metadata）

### 9.1 reflect-metadata 简介

\`emitDecoratorMetadata\` 启用后，TypeScript 会在编译时自动注入类型元数据。配合 \`reflect-metadata\` 库使用：

\`\`\`bash
npm install reflect-metadata
\`\`\`

\`\`\`typescript
import 'reflect-metadata'

// TypeScript 自动注入三种元数据键
// - design:type: 属性/方法的类型
// - design:paramtypes: 方法的参数类型数组
// - design:returntype: 方法的返回类型

class AgentService {
  process(prompt: string, options: { temperature: number }): Promise<string> {
    return Promise.resolve(prompt)
  }
}

const types = Reflect.getMetadata('design:paramtypes', AgentService.prototype, 'process')
console.log(types)
// [String, Object]

const returnType = Reflect.getMetadata('design:returntype', AgentService.prototype, 'process')
console.log(returnType)
// Promise
\`\`\`

### 9.2 依赖注入原理

NestJS 的依赖注入机制就基于装饰器 + 元数据实现：

\`\`\`typescript
import 'reflect-metadata'

// 简易依赖注入容器
const container = new Map<string, any>()

function Injectable(target: any) {
  // 读取构造函数参数类型
  const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', target) || []
  // 递归解析依赖
  const deps = paramTypes.map(type => container.get(type.name))
  const instance = new target(...deps)
  container.set(target.name, instance)
}

@Injectable
class Logger {
  log(msg: string) { console.log(\`[LOG] \${msg}\`) }
}

@Injectable
class AgentService {
  constructor(private logger: Logger) {}
  
  run() { this.logger.log('Agent 启动') }
}

const agent = container.get('AgentService') as AgentService
agent.run()  // [LOG] Agent 启动
\`\`\`

---

## 十、综合实战练习

### 练习 1：实现 Agent 工具注册与自动校验

\`\`\`typescript
import 'reflect-metadata'

// 元数据键
const TOOL_METADATA = Symbol('tool')
const TOOL_PARAMS = Symbol('toolParams')

// 属性装饰器：标记为工具参数
function param(name: string, description: string) {
  return function (target: any, propertyKey: string) {
    const params = Reflect.getMetadata(TOOL_PARAMS, target) || []
    params.push({ name, description, propertyKey })
    Reflect.defineMetadata(TOOL_PARAMS, params, target)
  }
}

// 方法装饰器：标记为可调用工具
function tool(name: string, description: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(TOOL_METADATA, { name, description }, target, propertyKey)
  }
}

class AgentToolkit {
  @tool('search', '搜索互联网获取信息')
  async search(
    @param('query', '搜索关键词') query: string,
    @param('limit', '结果数量') limit: number = 5
  ) {
    return Array(limit).fill(0).map((_, i) => \`结果\${i}: \${query}\`)
  }

  @tool('calculate', '数学计算')
  async calculate(
    @param('expression', '数学表达式') expr: string
  ) {
    return eval(expr)
  }
}

// 提取工具 schema（模拟 OpenAI Function Calling 格式）
function extractToolSchema(target: any): any[] {
  const tools: any[] = []
  const proto = Object.getPrototypeOf(target)
  
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key === 'constructor') continue
    const meta = Reflect.getMetadata(TOOL_METADATA, proto, key)
    if (!meta) continue
    
    const params = Reflect.getMetadata(TOOL_PARAMS, proto) || []
    tools.push({
      type: 'function',
      function: {
        name: meta.name,
        description: meta.description,
        parameters: {
          type: 'object',
          properties: params.reduce((acc, p) => {
            acc[p.name] = { description: p.description }
            return acc
          }, {}),
          required: params.map(p => p.name)
        }
      }
    })
  }
  return tools
}

const toolkit = new AgentToolkit()
console.log(JSON.stringify(extractToolSchema(toolkit), null, 2))
\`\`\`

### 练习 2：实现方法缓存装饰器

\`\`\`typescript
// 缓存装饰器：缓存方法返回值（相同参数不重复计算）
function cache(ttl: number = 60000) {
  const store = new Map<string, { value: any; expireAt: number }>()

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const key = \`\${propertyKey}:\${JSON.stringify(args)}\`
      const cached = store.get(key)
      
      if (cached && cached.expireAt > Date.now()) {
        console.log(\`📋 缓存命中: \${key}\`)
        return cached.value
      }

      const result = await originalMethod.apply(this, args)
      store.set(key, { value: result, expireAt: Date.now() + ttl })
      return result
    }

    return descriptor
  }
}

class EmbeddingService {
  @cache(300000)  // 5 分钟缓存
  async embed(text: string): Promise<number[]> {
    console.log(\`🔄 计算嵌入向量: \${text}\`)
    // 模拟耗时计算
    await new Promise(r => setTimeout(r, 100))
    return [0.1, 0.2, 0.3]
  }
}

const service = new EmbeddingService()
await service.embed('hello')  // 🔄 计算嵌入向量: hello
await service.embed('hello')  // 📋 缓存命中: embed:["hello"]
\`\`\`

---

## 十一、学习总结

| 装饰器类型 | 参数 | 典型用途 |
|-----------|------|---------|
| 类装饰器 | \`(target)\` | 替换/扩展类、自动注册 |
| 方法装饰器 | \`(target, key, descriptor)\` | 日志、重试、缓存、权限 |
| 属性装饰器 | \`(target, key)\` | 元数据标记、验证标记 |
| 访问器装饰器 | \`(target, key, descriptor)\` | 控制可配置性 |
| 参数装饰器 | \`(target, key, paramIndex)\` | 参数校验、依赖注入标记 |

### 关键收获

1. **类装饰器**可以替换构造函数，实现自动注册、混入能力
2. **方法装饰器**是最实用的类型，通过包装 \`descriptor.value\` 可实现日志、重试、缓存、权限等横切关注点
3. **参数装饰器 + 方法装饰器**配合可实现参数校验和依赖注入
4. **装饰器工厂**让装饰器可配置传参，是 NestJS 等框架的标准模式
5. **元数据**机制是依赖注入的基石，\`reflect-metadata\` 让运行时类型检查成为可能

### 与 AI Agent 的关联

装饰器在 Agent 开发中会以下列形式出现：

- **NestJS 后端服务**：\`@Controller()\`、\`@Injectable()\`、\`@Get()\` 构建 Agent API 服务
- **工具自动注册**：用类装饰器自动将工具注册到 Agent 工具表
- **调用增强**：用方法装饰器为 LLM 调用添加重试、缓存、日志、限流
- **参数校验**：参数装饰器标记必填项，配合方法装饰器校验输入
- **未来框架**：LangChain.js 等框架的 Agent 定义可能逐步采用装饰器模式

---

## 十二、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| TypeScript 中文网 - 装饰器 | https://ts.nodejs.cn/docs/handbook/decorators.html | 官方装饰器文档中文版，内容完整 |
| TypeScript 中文文档 - 装饰器 | https://www.tslang.com.cn/zh/docs/handbook/decorators.html | 装饰器中文翻译，含所有类型 |
| TypeScript 中文手册 - 装饰器 | https://typescript.bootcss.com/decorators.html | Bootcss 镜像，经典稳定 |
| TypeScript 中文网 - 手册入口 | https://ts.nodejs.cn/docs/handbook/intro.html | 手册总目录 |
| TypeScript 练习场 | https://www.typescriptlang.org/play | 在线练习（需科学上网） |

> **注意**：TypeScript 5.0 起支持 Stage 3 装饰器规范，文档顶部会有提示。当前主流 Node.js 框架仍使用 Stage 2 装饰器，建议优先学习 Stage 2。

---

## 十三、明日预告

**Day 3：TypeScript Async/Await 与 Promise**

- 异步编程模型：Promise 链式调用与 async/await 语法糖
- 并发控制：Promise.all、Promise.race、Promise.allSettled
- 错误处理：try/catch、catch 链、finally
- Agent 交互的基础：LLM API 调用是异步的，工具执行也是异步的

异步编程是 AI Agent 开发的核心基础——几乎所有 Agent 操作（LLM 调用、工具执行、流式响应）都是异步的。掌握 async/await 是理解后续所有框架代码的前提。

---

> 🚀 Day 2 完成！装饰器是 Node.js 后端框架的灵魂，打好基础才能在后续 Agent 服务开发中游刃有余。

    `.trim(),
  },

  {
    id: '5',
    title: 'AI Agent 学习计划 Day 1：TypeScript 类型系统与类型推断',
    slug: 'ai-agent-day1-typescript-type-system',
    date: '2026-07-02',
    tags: ['TypeScript', 'AI Agent', '学习笔记'],
    excerpt: 'AI Agent 84 天学习计划第一天。系统梳理 TypeScript 类型系统四大核心概念：泛型、联合类型、交叉类型、条件类型，并给出 Agent 开发场景中的实际应用。',
    readingTime: 25,
    content: `
# AI Agent 学习计划 Day 1：TypeScript 类型系统与类型推断

> 📅 日期：2026-07-02  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 1 / 84（1.2%）

## 前言

今天是 AI Agent 84 天学习计划的第一天。作为构建 AI Agent 的语言基础，我们从 TypeScript 类型系统开始。TypeScript 的类型系统不仅是 JavaScript 的静态类型补充，更是后续理解 LangChain.js、Vercel AI SDK 等框架中复杂类型定义的钥匙。

本文将系统梳理四个核心概念：**泛型、联合类型、交叉类型、条件类型**，并给出在 Agent 开发场景中的实际应用思考。

---

## 一、泛型（Generics）

### 1.1 为什么需要泛型

泛型是「类型的参数化」——让一个函数、接口或类能够适用于多种类型，同时保持类型安全。在 Agent 开发中，工具的输入输出类型千差万别，泛型是抽象这些差异的关键。

### 1.2 泛型函数

\`\`\`typescript
// 不使用泛型：丢失类型信息
function identity(value: any): any {
  return value
}
const result = identity('hello') // result 类型为 any，失去类型保护

// 使用泛型：保留类型信息
function identity<T>(value: T): T {
  return value
}
const result = identity('hello') // result 类型为 string
const num = identity(42)         // num 类型为 number
\`\`\`

### 1.3 泛型约束（Constraints）

使用 \`extends\` 限制泛型参数的范围：

\`\`\`typescript
// 约束 T 必须包含 length 属性
function getLength<T extends { length: number }>(value: T): number {
  return value.length
}

getLength('hello')    // ✅ 5
getLength([1, 2, 3])  // ✅ 3
getLength(42)         // ❌ 类型不满足约束
\`\`\`

### 1.4 泛型在 Agent 开发中的应用

\`\`\`typescript
// 定义 Agent 工具的泛型接口
interface AgentTool<TInput, TOutput> {
  name: string
  description: string
  execute: (input: TInput) => Promise<TOutput>
}

// 一个搜索工具
const searchTool: AgentTool<string, string[]> = {
  name: 'web_search',
  description: '搜索互联网获取信息',
  execute: async (query: string) => {
    // ... 返回搜索结果数组
    return [\`关于 \${query} 的结果1\`, \`关于 \${query} 的结果2\`]
  }
}
\`\`\`

### 1.5 多类型参数与默认值

\`\`\`typescript
// 多类型参数
function pair<A, B>(first: A, second: B): [A, B] {
  return [first, second]
}

// 默认类型参数
interface Box<T = string> {
  value: T
}
const strBox: Box = { value: 'hello' }       // T 默认为 string
const numBox: Box<number> = { value: 42 }     // 显式指定 number
\`\`\`

---

## 二、联合类型（Union Types）

### 2.1 基本用法

联合类型表示一个值可以是几种类型之一，使用 \`|\` 分隔：

\`\`\`typescript
type ID = string | number

function findById(id: ID) {
  // id 可以是 string 或 number
  console.log(typeof id) // 'string' 或 'number'
}
\`\`\`

### 2.2 字面量联合类型

非常实用的模式，用于表示有限的取值集合：

\`\`\`typescript
type ThemeMode = 'light' | 'dark' | 'auto'
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

function setTheme(mode: ThemeMode) {
  // ...
}
setTheme('light')  // ✅
setTheme('blue')   // ❌ 不在允许范围内
\`\`\`

### 2.3 类型收窄（Type Narrowing）

TypeScript 会根据控制流自动收窄联合类型：

\`\`\`typescript
type ToolResult =
  | { status: 'success'; data: string }
  | { status: 'error'; message: string }

function handleResult(result: ToolResult) {
  if (result.status === 'success') {
    // 这里 result 被收窄为 { status: 'success'; data: string }
    console.log(result.data)  // ✅ 可以访问 data
    console.log(result.message) // ❌ Error: 不存在 message
  } else {
    // 这里 result 被收窄为 { status: 'error'; message: string }
    console.log(result.message) // ✅ 可以访问 message
  }
}
\`\`\`

### 2.4 类型守卫（Type Guards）

使用 \`typeof\`、\`in\`、\`instanceof\` 自定义类型收窄逻辑：

\`\`\`typescript
// typeof 守卫
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase() // value 是 string
  }
  return value.toFixed(2)     // value 是 number
}

// in 守卫
interface Bird { fly: () => void }
interface Fish { swim: () => void }

function move(animal: Bird | Fish) {
  if ('fly' in animal) {
    animal.fly()
  } else {
    animal.swim()
  }
}

// 自定义类型谓词（Type Predicate）
function isError(x: unknown): x is Error {
  return x instanceof Error
}
\`\`\`

### 2.5 Agent 中的联合类型应用

\`\`\`typescript
// LLM 返回的消息类型
type Message =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: ToolCall[] }
  | { role: 'tool'; content: string; toolCallId: string }
  | { role: 'system'; content: string }

function sendMessage(msg: Message) {
  switch (msg.role) {
    case 'user':
      console.log(\`用户: \${msg.content}\`)
      break
    case 'assistant':
      console.log(\`助手: \${msg.content}\`)
      msg.toolCalls?.forEach(call => executeTool(call))
      break
    case 'tool':
      console.log(\`工具结果: \${msg.content}\`)
      break
  }
}
\`\`\`

---

## 三、交叉类型（Intersection Types）

### 3.1 基本概念

交叉类型使用 \`&\` 将多个类型合并为一个，表示「同时满足所有类型」：

\`\`\`typescript
interface Nameable { name: string }
interface Loggable { log: () => void }

type Entity = Nameable & Loggable
// Entity 同时拥有 name 和 log

const entity: Entity = {
  name: 'Agent',
  log: () => console.log('logging...')
}
\`\`\`

### 3.2 与联合类型的对比

| 特性 | 联合类型 \`A | B\` | 交叉类型 \`A & B\` |
|------|------------------|-------------------|
| 语义 | 「或」——满足其一即可 | 「且」——必须同时满足 |
| 取值范围 | A 的值 ∪ B 的值 | A 的值 ∩ B 的值 |
| 属性 | 只能访问共有属性 | 可访问所有属性 |

### 3.3 Mixin 模式

交叉类型非常适合实现 Mixin：

\`\`\`typescript
type Constructor<T = {}> = new (...args: any[]) => T

// 可日志化的 Mixin
function withLogging<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    log(msg: string) {
      console.log(\`[\${new Date().toISOString()}] \${msg}\`)
    }
  }
}

// 可序列化的 Mixin
function withSerializable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    serialize() {
      return JSON.stringify(this)
    }
  }
}

class BaseAgent {
  constructor(public name: string) {}
}

// 组合多个能力
const EnhancedAgent = withSerializable(withLogging(BaseAgent))
const agent = new EnhancedAgent('MyAgent')
agent.log('启动')       // 来自 withLogging
agent.serialize()       // 来自 withSerializable
\`\`\`

### 3.4 Agent 能力组合

\`\`\`typescript
interface ToolUser {
  useTool: (name: string, input: unknown) => Promise<unknown>
}

interface MemoryHolder {
  remember: (key: string, value: unknown) => void
  recall: (key: string) => unknown
}

interface Planner {
  plan: (goal: string) => string[]
}

// 一个完整的 Agent 同时具备三种能力
type FullAgent = ToolUser & MemoryHolder & Planner
\`\`\`

---

## 四、条件类型（Conditional Types）

### 4.1 基本语法

条件类型根据类型关系做分支判断，语法类似三元表达式：

\`\`\`typescript
type IsString<T> = T extends string ? true : false

type A = IsString<'hello'>  // true
type B = IsString<42>       // false
type C = IsString<string>   // true
\`\`\`

### 4.2 infer 关键字

\`infer\` 在条件类型中声明待推断的类型变量，是提取类型信息的利器：

\`\`\`typescript
// 提取函数返回值类型
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never

type Fn = (x: number) => string
type R = MyReturnType<Fn>  // string

// 提取函数参数类型（第一个参数）
type FirstParam<T> = T extends (first: infer P, ...rest: any[]) => any ? P : never

type P = FirstParam<(id: number, name: string) => void>  // number

// 提取 Promise 的内部类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

type Inner = UnwrapPromise<Promise<number>>  // number
\`\`\`

### 4.3 分布式条件类型

当条件类型作用于「裸类型参数」的联合类型时，会分布式地应用到每个成员：

\`\`\`typescript
type ToArray<T> = T extends any ? T[] : never

type Result = ToArray<string | number>
// 等价于 ToArray<string> | ToArray<number>
// 即 string[] | number[]
\`\`\`

利用这个特性可以实现 \`Exclude\` 和 \`Extract\`：

\`\`\`typescript
// 手写 Exclude
type MyExclude<T, U> = T extends U ? never : T

type T1 = MyExclude<'a' | 'b' | 'c', 'a'>  // 'b' | 'c'

// 手写 Extract
type MyExtract<T, U> = T extends U ? T : never

type T2 = MyExtract<'a' | 'b' | 'c', 'a' | 'b'>  // 'a' | 'b'
\`\`\`

### 4.4 内置工具类型

TypeScript 提供了许多基于条件类型的工具类型：

\`\`\`typescript
// ReturnType - 获取函数返回类型
type R1 = ReturnType<() => string>  // string

// Parameters - 获取函数参数类型（元组）
type P1 = Parameters<(a: number, b: string) => void>  // [number, string]

// Awaited - 递归解包 Promise
type A1 = Awaited<Promise<Promise<number>>>  // number

// InstanceType - 获取构造函数实例类型
class Foo { bar = 1 }
type I1 = InstanceType<typeof Foo>  // Foo

// Partial - 所有属性变可选
interface Config { host: string; port: number }
type PartialConfig = Partial<Config>  // { host?: string; port?: number }
\`\`\`

### 4.5 Agent 场景中的条件类型实战

\`\`\`typescript
// 根据工具名称推断其输入类型
interface SearchInput { query: string; limit?: number }
interface CodeInput { language: string; code: string }

interface ToolMap {
  search: { input: SearchInput; output: string[] }
  execute_code: { input: CodeInput; output: string }
}

type ToolInput<K extends keyof ToolMap> = ToolMap[K]['input']
type ToolOutput<K extends keyof ToolMap> = ToolMap[K]['output']

// 类型推断：调用 search 工具时，输入自动推导为 SearchInput
function callTool<K extends keyof ToolMap>(
  name: K,
  input: ToolInput<K>
): Promise<ToolOutput<K>> {
  // 实现省略
  return null as any
}

// ✅ 类型安全：TypeScript 知道 query 是必填的
callTool('search', { query: 'AI Agent', limit: 10 })
// ❌ 类型错误：execute_code 需要 language 和 code
callTool('execute_code', { query: 'test' })
\`\`\`

---

## 五、综合实战练习

### 练习 1：实现类型安全的 Agent 消息构建器

\`\`\`typescript
type Role = 'system' | 'user' | 'assistant' | 'tool'

interface BaseMessage {
  role: Role
  content: string
}

interface ToolMessage extends BaseMessage {
  role: 'tool'
  toolCallId: string
}

interface AssistantMessage extends BaseMessage {
  role: 'assistant'
  toolCalls?: Array<{
    id: string
    function: { name: string; arguments: string }
  }>
}

type ChatMessage = BaseMessage | ToolMessage | AssistantMessage

// 条件类型：根据 role 推断消息类型
type MessageByRole<R extends Role> = Extract<ChatMessage, { role: R }>

function createMessage<R extends Role>(
  role: R,
  content: string,
  extra?: Omit<MessageByRole<R>, 'role' | 'content'>
): MessageByRole<R> {
  return { role, content, ...extra } as MessageByRole<R>
}

// 使用
const toolMsg = createMessage('tool', 'result', { toolCallId: 'call_123' })
const userMsg = createMessage('user', '你好')
\`\`\`

### 练习 2：实现 DeepPartial

\`\`\`typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

interface AgentConfig {
  model: { name: string; temperature: number }
  tools: { search: boolean; codeExec: boolean }
}

// 所有字段都变成可选
const config: DeepPartial<AgentConfig> = {
  model: { temperature: 0.7 }  // name 可选
}
\`\`\`

---

## 六、学习总结

| 概念 | 核心语法 | 典型场景 |
|------|---------|---------|
| 泛型 | \`<T>\` | 可复用的函数/接口/类 |
| 联合类型 | \`A \\| B\` | 多种可能的类型、状态枚举 |
| 交叉类型 | \`A & B\` | 能力组合、类型合并 |
| 条件类型 | \`T extends U ? X : Y\` | 类型分支、类型推断提取 |

### 关键收获

1. **泛型**是构建通用 Agent 工具接口的基石，让工具的输入输出类型化
2. **联合类型 + 类型收窄**是处理 LLM 多种消息格式的核心手段
3. **交叉类型**可以优雅地组合 Agent 的多种能力（工具使用、记忆、规划）
4. **条件类型 + infer**是理解 LangChain.js / Vercel AI SDK 复杂类型定义的钥匙

### 与 AI Agent 的关联

这些类型系统特性在后续学习中会频繁出现：
- LangChain.js 的 \`Runnable<RunInput, RunOutput>\` 泛型
- Vercel AI SDK 的 \`tool()\` 函数使用 Zod 做参数校验，背后是条件类型
- 多 Agent 编排中，消息流的类型安全依赖联合类型与收窄

---

## 七、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| TypeScript 中文网 - 手册 | https://ts.nodejs.cn/docs/handbook/intro.html | 手册入口，内容完整 |
| TypeScript 中文网 - 泛型 | https://ts.nodejs.cn/docs/handbook/2/generics.html | 泛型专题 |
| TypeScript 中文网 - 类型收窄 | https://ts.nodejs.cn/docs/handbook/2/narrowing.html | 类型收窄专题 |
| TypeScript 中文网 - 条件类型 | https://ts.nodejs.cn/docs/handbook/2/conditional-types.html | 条件类型专题 |
| TypeScript 中文文档 | https://www.tslang.com.cn/zh/docs/handbook/intro.html | 官方手册中文翻译 |
| TypeScript 中文手册 (Bootcss) | https://typescript.bootcss.com/ | 经典中文镜像 |
| TypeScript 类型体操 | https://github.com/type-challenges/type-challenges | 进阶练习题库 |

---

## 八、明日预告

**Day 2：TypeScript 装饰器（Decorators）**

- 类装饰器、方法装饰器、属性装饰器、参数装饰器
- 装饰器工厂
- 在 NestJS 等 Node.js 框架中的应用

装饰器是理解后端框架（如 NestJS）依赖注入和路由机制的基础，在 Agent 后端服务开发中会大量使用。

---

> 💪 84 天学习计划已正式启动，千里之行始于足下！

    `.trim(),
  },

  {
    id: '1',
    title: '用 React + Zustand 构建现代 Web 应用',
    slug: 'building-modern-web-apps-with-react-zustand',
    date: '2026-06-20',
    tags: ['React', 'Zustand', 'TypeScript'],
    excerpt: 'Zustand 是一个轻量级的状态管理库，与 React 配合使用可以优雅地管理应用状态。本文介绍如何在实际项目中落地。',
    readingTime: 8,
    content: `
## 为什么选择 Zustand？

在 React 生态中，状态管理方案层出不穷。从最早的 Redux，到后来的 MobX、Recoil、Jotai，每个方案都有自己的哲学。Zustand 是其中最为轻量、直觉化的一个。

### 核心优势

\`\`\`typescript
import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
\`\`\`

- **极简 API**：不需要 Provider 包裹，不需要 action creator
- **类型安全**：原生 TypeScript 支持，自动推导类型
- **灵活**：可以在组件外部读写 state
- **性能优秀**：细粒度订阅，只 re-render 相关组件

### 与 React Query 配合

对于服务端状态，建议用 React Query 或 SWR；Zustand 专注于客户端状态。两者分工明确。
    `.trim(),
  },
  {
    id: '2',
    title: 'TypeScript 高级类型体操实战',
    slug: 'advanced-typescript-type-challenges',
    date: '2026-06-15',
    tags: ['TypeScript', '前端'],
    excerpt: '从条件类型到模板字面量类型，深入 TypeScript 的类型系统，写出更安全、更优雅的代码。',
    readingTime: 12,
    content: `
## 条件类型

条件类型是 TypeScript 类型系统的核心能力之一，它让我们可以根据类型关系做分支判断。

\`\`\`typescript
type IsString<T> = T extends string ? true : false

type A = IsString<'hello'>  // true
type B = IsString<42>        // false
\`\`\`

### infer 关键字

\`infer\` 让我们在条件类型中声明待推断的类型变量：

\`\`\`typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never

type Fn = (x: number) => string
type R = ReturnType<Fn>  // string
\`\`\`

### 模板字面量类型

\`\`\`typescript
type EventName = \`on\${Capitalize<string>}\`
// 'onChange' | 'onClick' | 'onSubmit' ...
\`\`\`

合理使用这些高级类型，可以让你的代码在编译期就捕获大量潜在错误。
    `.trim(),
  },
  {
    id: '3',
    title: 'Vite 插件开发入门指南',
    slug: 'vite-plugin-development-guide',
    date: '2026-06-08',
    tags: ['Vite', '构建工具', '前端工程化'],
    excerpt: '从零开始开发一个 Vite 插件，理解 Vite 的插件系统和构建流程。',
    readingTime: 10,
    content: `
## Vite 插件是什么？

Vite 插件是一个具有特定钩子函数的对象，这些钩子会在构建过程的不同阶段被调用。

### 一个简单的例子

\`\`\`typescript
import type { Plugin } from 'vite'

function myPlugin(): Plugin {
  return {
    name: 'my-plugin',
    transform(code, id) {
      if (id.endsWith('.special')) {
        return {
          code: \`export default \${JSON.stringify(code)}\`,
          map: null,
        }
      }
    },
  }
}
\`\`\`

### 插件钩子

Vite 插件支持 Rollup 的所有钩子，并额外提供了一些 Vite 特有的钩子：

- \`config\` - 修改 Vite 配置
- \`configureServer\` - 配置开发服务器
- \`transformIndexHtml\` - 转换 index.html
- \`handleHotUpdate\` - 自定义 HMR 更新

开发插件是理解 Vite 内部机制的最佳途径。
    `.trim(),
  },
  {
    id: '4',
    title: '个人博客搭建：从设计到部署',
    slug: 'building-personal-blog-from-design-to-deploy',
    date: '2026-05-28',
    tags: ['博客', 'React', 'Vite', '全栈'],
    excerpt: '记录我搭建这个博客的完整过程，包括技术选型、架构设计、组件规划和部署策略。',
    readingTime: 15,
    content: `
## 技术选型

搭建个人博客时，技术选型是最重要的决策之一。我的选择：

| 层面 | 技术 | 理由 |
|------|------|------|
| 框架 | React 18 | 生态成熟，社区活跃 |
| 构建 | Vite 5 | 极速 HMR，零配置启动 |
| 状态管理 | Zustand | 轻量、类型安全、无 Provider |
| 路由 | React Router v6 | SPA 标配，嵌套路由方便 |
| 样式 | CSS Modules | 局部作用域，无运行时开销 |
| 内容 | Markdown | 写作体验好，易于迁移 |

### 架构设计

整个应用分为三层：

1. **数据层** — 博客文章数据（静态 Markdown / CMS）
2. **状态层** — Zustand stores（主题、搜索、筛选）
3. **视图层** — React 页面组件 + 通用组件

### 关于 SEO

对于纯静态博客，可以使用 Vite 的静态生成功能或在构建时预渲染 HTML。更复杂的场景可以上 Next.js 或 Astro。

我的选择是保持 SPA 架构，对搜索引擎来说，只要内容加载快就足够了。
    `.trim(),
  },
]
