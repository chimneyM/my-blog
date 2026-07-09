# AI Agent 学习计划 Day 3：TypeScript Async/Await 与 Promise

> 📅 日期：2026-07-04  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 3 / 84（3.6%）

## 前言

Day 1 我们学了 TypeScript 类型系统，Day 2 学了装饰器。今天进入一个对所有 AI Agent 开发者都至关重要的主题——**异步编程**。

为什么异步编程是 Agent 交互的基础？因为 Agent 的每一次操作几乎都是异步的：调用 LLM API 需要等待网络响应（可能几秒甚至几十秒）、执行工具需要等待 I/O、流式接收 token 需要逐块处理。如果用同步方式编写，整个程序会卡死在等待中。`async/await` 和 `Promise` 是 JavaScript 处理异步操作的两大核心武器，也是后续理解 LangChain.js 链式调用、Vercel AI SDK 流式响应的前提。

本文将从回调地狱讲起，系统覆盖 Promise 三态与链式调用、async/await 语法糖、并发控制（Promise.all / race / allSettled）、错误处理策略，最终落地到 Agent 开发中的实际应用。

---

## 一、为什么需要异步编程

### 1.1 JavaScript 的单线程模型

JavaScript 是单线程的（Node.js 主线程也是），这意味着同一时刻只能执行一个任务。如果用同步方式调用 LLM API：

```typescript
// ❌ 同步方式：整个程序卡住 5 秒
function callLLMSync(prompt: string): string {
  // 假设有同步的 HTTP 请求（实际上 Node.js 没有原生同步 HTTP）
  const response = blockingHttpRequest('https://api.openai.com/...', prompt)
  return response
}

console.log('1. 开始')
const result = callLLMSync('你好')  // 卡住 5 秒
console.log('2. 收到回复:', result)
console.log('3. 结束')
// 1. 开始
// （5 秒后）
// 2. 收到回复: ...
// 3. 结束
```

在这 5 秒内，程序什么都做不了——无法处理其他请求、无法更新 UI、无法接收用户输入。

### 1.2 异步编程的演进

```
回调函数（Callback） → Promise → async/await → 异步迭代器（for await...of）
   回调地狱          链式调用      同步写法        流式处理
```

### 1.3 回调地狱（Callback Hell）

最早的异步方案是回调函数，但多层嵌套会导致「回调地狱」：

```typescript
// ❌ 回调地狱：难以阅读和维护
callLLM('分析这段代码', (err, analysis) => {
  if (err) return console.error(err)
  callLLM(`根据分析重写: ${analysis}`, (err, rewrite) => {
    if (err) return console.error(err)
    callLLM(`添加测试: ${rewrite}`, (err, test) => {
      if (err) return console.error(err)
      callLLM(`优化性能: ${test}`, (err, optimized) => {
        if (err) return console.error(err)
        console.log('最终结果:', optimized)
      })
    })
  })
})
```

Promise 的出现就是为了解决这个问题。

---

## 二、Promise 基础

### 2.1 Promise 的三种状态

Promise 是一个表示异步操作最终结果的对象，有三种状态：

```
                    ┌──→ fulfilled（已兑现）──→ .then()
 pending（待定）──┤
                    └──→ rejected（已拒绝）──→ .catch()
```

- **pending**：初始状态，既没有兑现也没有拒绝
- **fulfilled**：操作成功完成
- **rejected**：操作失败

> **关键**：状态一旦从 pending 变为 fulfilled 或 rejected，就不可逆转。

### 2.2 创建 Promise

```typescript
// 基本创建
const promise = new Promise<string>((resolve, reject) => {
  // 模拟异步操作
  setTimeout(() => {
    const success = Math.random() > 0.5
    if (success) {
      resolve('操作成功')  // pending → fulfilled
    } else {
      reject(new Error('操作失败'))  // pending → rejected
    }
  }, 1000)
})

promise.then(result => console.log(result))
       .catch(err => console.error(err.message))
```

### 2.3 Promise 的类型安全

在 TypeScript 中，Promise 是泛型类 `Promise<T>`，`T` 是 resolve 值的类型：

```typescript
// 明确指定 resolve 的类型
const fetchUser = (id: number): Promise<{ id: number; name: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ id, name: 'Agent-' + id }), 500)
  })
}

// TypeScript 知道 user 的类型是 { id: number; name: string }
fetchUser(1).then(user => {
  console.log(user.name)  // ✅ 类型安全
  // console.log(user.age)  // ❌ 类型错误
})
```

### 2.4 快捷方法

```typescript
// Promise.resolve：直接创建已兑现的 Promise
const p1 = Promise.resolve('立即完成')

// Promise.reject：直接创建已拒绝的 Promise
const p2 = Promise.reject(new Error('立即失败'))

// 包装已有值
const wrapped: Promise<number> = Promise.resolve(42)
```

---

## 三、Promise 链式调用

### 3.1 then 的返回值

`then` 返回一个新的 Promise，因此可以链式调用：

```typescript
fetchUser(1)
  .then(user => {
    console.log('用户:', user.name)
    return fetchUserPosts(user.id)  // 返回新的 Promise
  })
  .then(posts => {
    console.log('文章数:', posts.length)
    return posts[0]
  })
  .then(post => {
    console.log('第一篇文章:', post.title)
  })
  .catch(err => {
    console.error('链中任一环节出错:', err)
  })
```

### 3.2 链式调用的返回值规则

```typescript
// 规则1：返回普通值 → 包装成 Promise.resolve(值)
Promise.resolve(1)
  .then(x => x + 1)        // 返回 2
  .then(x => x * 3)        // 返回 6
  .then(x => console.log(x)) // 6

// 规则2：返回 Promise → 等待该 Promise 完成
Promise.resolve(1)
  .then(x => fetchUser(x))  // 返回 Promise，等待完成
  .then(user => console.log(user.name))

// 规则3：不返回值 → 相当于返回 undefined
Promise.resolve(1)
  .then(x => { console.log(x) })  // 返回 undefined
  .then(x => console.log(x))       // undefined
```

### 3.3 用 Promise 链改造回调地狱

```typescript
// ✅ 用 Promise 链消除回调地狱
callLLM('分析这段代码')
  .then(analysis => callLLM(`根据分析重写: ${analysis}`))
  .then(rewrite => callLLM(`添加测试: ${rewrite}`))
  .then(test => callLLM(`优化性能: ${test}`))
  .then(optimized => console.log('最终结果:', optimized))
  .catch(err => console.error('出错:', err))
```

---

## 四、async/await 语法糖

### 4.1 async 函数

`async` 关键字声明的函数总是返回 Promise：

```typescript
// async 函数自动将返回值包装成 Promise
async function greet(name: string): Promise<string> {
  return `Hello, ${name}`  // 等价于 return Promise.resolve(`Hello, ${name}`)
}

// 等价的普通函数
function greetPlain(name: string): Promise<string> {
  return Promise.resolve(`Hello, ${name}`)
}
```

### 4.2 await 关键字

`await` 暂停 async 函数的执行，等待 Promise 完成，然后返回结果：

```typescript
async function run() {
  console.log('1. 开始')

  // await 暂停执行，等待 Promise 完成
  const result = await callLLM('你好')
  console.log('2. 收到:', result)

  console.log('3. 结束')
}

run()
// 1. 开始
// （等待中...）
// 2. 收到: ...
// 3. 结束
```

> **关键理解**：`await` 不会阻塞整个程序，它只暂停当前 async 函数。在等待期间，事件循环可以处理其他任务。

### 4.3 用 async/await 改写回调地狱

```typescript
// ✅ async/await 让异步代码看起来像同步代码
async function processCode() {
  try {
    const analysis = await callLLM('分析这段代码')
    const rewrite = await callLLM(`根据分析重写: ${analysis}`)
    const test = await callLLM(`添加测试: ${rewrite}`)
    const optimized = await callLLM(`优化性能: ${test}`)
    console.log('最终结果:', optimized)
  } catch (err) {
    console.error('出错:', err)
  }
}

processCode()
```

### 4.4 async/await 的类型推导

```typescript
// await 会自动 unwrap Promise 的类型
async function example() {
  // fetchUser 返回 Promise<{ id: number; name: string }>
  const user = await fetchUser(1)
  // user 的类型是 { id: number; name: string }，不是 Promise<...>

  console.log(user.name)  // ✅ 直接访问
}

// 在非 async 上下文中无法使用 await
function badExample() {
  // const user = await fetchUser(1)  // ❌ 语法错误
}
```

---

## 五、错误处理

### 5.1 try/catch（async/await 方式）

```typescript
async function riskyOperation() {
  try {
    const result = await callLLM('危险操作')
    return result
  } catch (err) {
    // err 的类型是 unknown（TypeScript 4.4+）
    if (err instanceof Error) {
      console.error(err.message)
    }
    throw err  // 重新抛出，让上层处理
  }
}
```

### 5.2 .catch()（Promise 链方式）

```typescript
callLLM('危险操作')
  .then(result => {
    // 处理结果
  })
  .catch(err => {
    // 捕获链中任意环节的错误
    console.error(err)
  })
  .finally(() => {
    // 无论成功失败都执行（清理资源）
    console.log('操作结束')
  })
```

### 5.3 错误处理策略对比

```typescript
// 策略1：统一捕获（推荐简单场景）
async function strategy1() {
  try {
    const a = await step1()
    const b = await step2(a)
    const c = await step3(b)
    return c
  } catch (err) {
    // 任何步骤出错都会到这里
    console.error('某步出错:', err)
    return null
  }
}

// 策略2：逐步捕获（需要不同错误处理）
async function strategy2() {
  const a = await step1().catch(err => {
    console.error('step1 失败，使用默认值:', err)
    return 'default-a'
  })

  const b = await step2(a).catch(err => {
    console.error('step2 失败，使用默认值:', err)
    return 'default-b'
  })

  return b
}
```

### 5.4 工具函数：安全包装

```typescript
// 将 Promise 转换为 [error, data] 元组，避免 try/catch 嵌套
async function to<T>(
  promise: Promise<T>
): Promise<[Error, null] | [null, T]> {
  try {
    return [null, await promise]
  } catch (err) {
    return [err as Error, null]
  }
}

// 使用：Go 风格的错误处理
async function main() {
  const [err, user] = await to(fetchUser(1))
  if (err) {
    console.error('获取用户失败:', err.message)
    return
  }
  console.log('用户:', user.name)

  const [err2, posts] = await to(fetchUserPosts(user.id))
  if (err2) {
    console.error('获取文章失败:', err2.message)
    return
  }
  console.log('文章数:', posts.length)
}
```

---

## 六、并发控制

### 6.1 Promise.all：全部成功才成功

```typescript
// 并行执行多个任务，全部完成才返回
async function fetchAll() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(1),
    fetchUserPosts(1),
    fetchUserComments(1)
  ])
  // 三个请求并行，总耗时 ≈ 最慢的那个
  console.log(user, posts, comments)
}

// 任一失败则整体失败
Promise.all([
  Promise.resolve('a'),
  Promise.reject(new Error('b 失败')),
  Promise.resolve('c')
]).catch(err => console.error(err.message))  // 'b 失败'
```

### 6.2 Promise.race：最快完成即返回

```typescript
// 超时控制：5 秒内必须完成
async function callWithTimeout() {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('超时')), 5000)
  )

  const result = await Promise.race([
    callLLM('你好'),
    timeout
  ])
  return result
}
```

### 6.3 Promise.allSettled：等待全部完成（无论成败）

```typescript
// 批量调用，收集所有结果（含失败）
async function batchCall(prompts: string[]) {
  const results = await Promise.allSettled(
    prompts.map(p => callLLM(p))
  )

  const succeeded = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map(r => r.value)

  const failed = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => r.reason)

  console.log(`成功 ${succeeded.length} 个，失败 ${failed.length} 个`)
  return succeeded
}
```

### 6.4 Promise.any：任一成功即成功

```typescript
// 多源竞速：从多个 LLM 提供商获取，谁先成功用谁
async function fastLLMCall(prompt: string) {
  const result = await Promise.any([
    callOpenAI(prompt),
    callAnthropic(prompt),
    callLocalModel(prompt)
  ])
  // 返回第一个成功的结果
  return result
  // 如果全部失败，抛出 AggregateError
}
```

### 6.5 四种并发方法对比

| 方法 | 行为 | 全部成功 | 任一失败 |
|------|------|---------|---------|
| `Promise.all` | 全部完成 | 返回结果数组 | 抛出第一个错误 |
| `Promise.race` | 最快完成 | 返回最快的结果 | 抛出最快的错误 |
| `Promise.allSettled` | 全部敲定 | 返回状态数组 | 返回状态数组（含失败） |
| `Promise.any` | 任一成功 | 返回第一个成功值 | 全失败才抛 AggregateError |

---

## 七、串行与并行

### 7.1 串行执行（依次等待）

```typescript
// ❌ 错误写法：看似并行，实则串行
async function wrongParallel() {
  // 每个 await 都会等待，变成串行
  const a = await fetchUser(1)    // 等 500ms
  const b = await fetchUser(2)    // 再等 500ms
  const c = await fetchUser(3)    // 再等 500ms
  // 总耗时：1500ms
}

// ✅ 串行执行（有时是必须的：后一步依赖前一步）
async function serial() {
  const a = await step1()
  const b = await step2(a)  // 依赖 a
  const c = await step3(b)  // 依赖 b
  return c
}
```

### 7.2 并行执行（同时发起）

```typescript
// ✅ 正确的并行：先创建所有 Promise，再 await
async function correctParallel() {
  // 三个 Promise 同时创建，同时发起请求
  const p1 = fetchUser(1)
  const p2 = fetchUser(2)
  const p3 = fetchUser(3)

  // 然后一起 await
  const [a, b, c] = await Promise.all([p1, p2, p3])
  // 总耗时：约 500ms（最慢的那个）
}

// ✅ 更简洁的写法
async function parallel() {
  const [a, b, c] = await Promise.all([
    fetchUser(1),
    fetchUser(2),
    fetchUser(3)
  ])
  // 总耗时：约 500ms
}
```

### 7.3 串行遍历（for...of + await）

```typescript
// 串行处理数组：一个完成才开始下一个
async function serialProcess(items: string[]) {
  const results: string[] = []
  for (const item of items) {
    const result = await callLLM(item)  // 等待前一个完成
    results.push(result)
  }
  return results
}
```

### 7.4 并行遍历（map + Promise.all）

```typescript
// 并行处理数组：同时发起所有请求
async function parallelProcess(items: string[]) {
  const results = await Promise.all(
    items.map(item => callLLM(item))
  )
  return results
}
```

### 7.5 ⚠️ forEach 的陷阱

```typescript
// ❌ forEach 不会等待 async 回调！
async function buggyForEach(items: string[]) {
  items.forEach(async (item) => {
    await callLLM(item)  // 不会等待！
  })
  console.log('完成')  // 会在所有 callLLM 完成前就执行
}

// ✅ 用 for...of 代替 forEach 实现串行
async function correctForOf(items: string[]) {
  for (const item of items) {
    await callLLM(item)  // 会等待
  }
  console.log('完成')
}
```

---

## 八、并发限制器

当需要批量调用 LLM API（如处理 100 条数据），一次性 `Promise.all` 会触发速率限制。需要限制并发数：

### 8.1 简易并发池

```typescript
async function asyncPool<T, R>(
  limit: number,
  items: T[],
  iteratorFn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: Promise<R>[] = []
  const executing = new Set<Promise<R>>()

  for (const item of items) {
    // 并发数已满，等待其中一个完成
    if (executing.size >= limit) {
      await Promise.race(executing)
    }

    const promise = iteratorFn(item)
    results.push(promise)
    executing.add(promise)

    promise.finally(() => executing.delete(promise))
  }

  return Promise.all(results)
}

// 使用：限制并发为 3，处理 10 条数据
const prompts = ['你好', '写诗', '翻译', '总结', /* ... */]
const results = await asyncPool(3, prompts, async (prompt) => {
  return callLLM(prompt)
})
```

### 8.2 Agent 工具并发调用

```typescript
class Agent {
  async runWithTools(query: string) {
    // 并发调用多个工具，限制并发为 3
    const tools = [
      () => this.searchTool(query),
      () => this.dbTool(query),
      () => this.weatherTool(),
      () => this.calculatorTool(query),
      () => this.fileTool(query),
    ]

    const results = await asyncPool(3, tools, async (fn) => fn())

    // 整合所有工具结果，发给 LLM
    const answer = await this.callLLM({
      query,
      toolResults: results
    })

    return answer
  }
}
```

---

## 九、Agent 开发实战应用

### 9.1 调用 LLM API（基本模式）

```typescript
interface LLMResponse {
  choices: Array<{ message: { content: string } }>
}

async function callLLM(
  prompt: string,
  options?: { temperature?: number; model?: string }
): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`API 错误: ${response.status} ${response.statusText}`)
    }

    const data: LLMResponse = await response.json()
    return data.choices[0].message.content
  } catch (err) {
    console.error('LLM 调用失败:', err)
    throw err
  }
}

// 使用
const answer = await callLLM('什么是 AI Agent?')
console.log(answer)
```

### 9.2 带重试的 LLM 调用

```typescript
async function callLLMWithRetry(
  prompt: string,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<string> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callLLM(prompt)
    } catch (err) {
      lastError = err as Error
      console.log(`第 ${i + 1} 次尝试失败: ${lastError.message}`)

      if (i < maxRetries - 1) {
        // 指数退避
        await new Promise(r => setTimeout(r, delay * Math.pow(2, i)))
      }
    }
  }

  throw lastError!
}

// 使用：自动重试 3 次
const result = await callLLMWithRetry('复杂问题', 3, 1000)
```

### 9.3 多步推理（ReAct 模式简化版）

```typescript
async function reactAgent(query: string): Promise<string> {
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: '你是一个会使用工具的 AI Agent' },
    { role: 'user', content: query }
  ]

  const MAX_STEPS = 5

  for (let step = 0; step < MAX_STEPS; step++) {
    // 1. 思考：调用 LLM 决定下一步
    const thought = await callLLM(JSON.stringify(messages))
    messages.push({ role: 'assistant', content: thought })

    // 2. 判断是否需要调用工具
    const toolMatch = thought.match(/工具:\s*(\w+)\((.+)\)/)
    if (!toolMatch) {
      // 不需要工具，返回最终答案
      return thought
    }

    // 3. 执行工具
    const [, toolName, toolInput] = toolMatch
    const toolResult = await executeTool(toolName, toolInput)
    messages.push({ role: 'tool', content: toolResult })
  }

  return '达到最大步数限制'
}

async function executeTool(name: string, input: string): Promise<string> {
  switch (name) {
    case 'search':
      return await searchWeb(input)
    case 'calculate':
      return String(eval(input))
    default:
      return `未知工具: ${name}`
  }
}
```

### 9.4 批量处理与并发控制

```typescript
// 批量处理大量文档，限制并发避免 API 限流
async function batchProcessDocuments(
  documents: string[],
  batchSize: number = 3
): Promise<string[]> {
  const results: string[] = []

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)
    // 每批并行处理
    const batchResults = await Promise.all(
      batch.map(doc => callLLM(`总结: ${doc}`))
    )
    results.push(...batchResults)
    console.log(`已完成 ${Math.min(i + batchSize, documents.length)}/${documents.length}`)
  }

  return results
}

const docs = ['文档1...', '文档2...', '文档3...', '文档4...', '文档5...']
const summaries = await batchProcessDocuments(docs, 3)
```

---

## 十、综合实战练习

### 练习 1：实现带超时和取消的异步任务

```typescript
// 支持超时和取消的异步执行器
async function runWithTimeoutAndCancel<T>(
  task: Promise<T>,
  options: { timeout?: number; signal?: AbortSignal }
): Promise<T> {
  const { timeout = 10000, signal } = options

  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(
      () => reject(new Error('任务超时')),
      timeout
    )
    // 如果任务先完成，清除定时器
    task.finally(() => clearTimeout(timer))
  })

  const cancelPromise = new Promise<never>((_, reject) => {
    if (signal) {
      if (signal.aborted) {
        reject(new Error('任务已取消'))
      }
      signal.addEventListener('abort', () => {
        reject(new Error('任务已取消'))
      })
    }
  })

  return Promise.race([task, timeoutPromise, cancelPromise])
}

// 使用
const controller = new AbortController()
setTimeout(() => controller.abort(), 3000)  // 3 秒后取消

const result = await runWithTimeoutAndCancel(
  callLLM('长文本生成'),
  { timeout: 10000, signal: controller.signal }
).catch(err => {
  console.error(err.message)  // '任务已取消' 或 '任务超时'
  return '默认回复'
})
```

### 练习 2：实现 Promise 队列

```typescript
// 顺序执行异步任务队列
class AsyncTaskQueue<T> {
  private queue: Array<() => Promise<T>> = []
  private processing = false

  add(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await task())
        } catch (err) {
          reject(err)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const task = this.queue.shift()!
      await task()
    }

    this.processing = false
  }
}

// 使用：确保 LLM 调用按顺序执行
const queue = new AsyncTaskQueue<string>()
queue.add(() => callLLM('第一步')).then(r => console.log('1:', r))
queue.add(() => callLLM('第二步')).then(r => console.log('2:', r))
queue.add(() => callLLM('第三步')).then(r => console.log('3:', r))
// 严格按 1 → 2 → 3 顺序执行
```

### 练习 3：缓存 + 并发的 LLM 客户端

```typescript
class CachedLLMClient {
  private cache = new Map<string, string>()
  private pending = new Map<string, Promise<string>>()

  async call(prompt: string): Promise<string> {
    // 1. 检查缓存
    if (this.cache.has(prompt)) {
      return this.cache.get(prompt)!
    }

    // 2. 检查是否有相同的请求正在进行
    if (this.pending.has(prompt)) {
      return this.pending.get(prompt)!  // 复用进行中的请求
    }

    // 3. 发起新请求
    const promise = callLLM(prompt)
      .then(result => {
        this.cache.set(prompt, result)
        this.pending.delete(prompt)
        return result
      })
      .catch(err => {
        this.pending.delete(prompt)
        throw err
      })

    this.pending.set(prompt, promise)
    return promise
  }
}

// 使用：相同 prompt 只调用一次 API
const client = new CachedLLMClient()
const [a, b] = await Promise.all([
  client.call('你好'),  // 发起请求
  client.call('你好')   // 复用同一个请求
])
console.log(a === b)  // true
```

---

## 十一、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| Promise | 三态（pending/fulfilled/rejected），状态不可逆 |
| then | 链式调用，返回新 Promise |
| async/await | Promise 的语法糖，让异步代码像同步 |
| try/catch | async/await 的错误处理方式 |
| Promise.all | 全部成功才成功，任一失败则失败 |
| Promise.race | 最快完成即返回（成功或失败） |
| Promise.allSettled | 等待全部完成，收集所有结果 |
| Promise.any | 任一成功即成功，全失败才失败 |
| 并行 vs 串行 | Promise.all 并行，for...of+await 串行 |
| forEach 陷阱 | forEach 不等待 async 回调 |

### 关键收获

1. **Promise 三态**：pending → fulfilled/rejected，状态不可逆，是异步编程的基础
2. **async/await** 是 Promise 的语法糖，让异步代码读起来像同步，但本质仍是异步
3. **错误处理**：async/await 用 try/catch，Promise 用 .catch()，注意 err 类型是 unknown
4. **四种并发方法**：all（全部成功）、race（最快）、allSettled（全部完成）、any（任一成功）
5. **并行 vs 串行**：`Promise.all([fn1(), fn2()])` 并行，`for...of + await` 串行
6. **forEach 陷阱**：forEach 不会等待 async 回调，用 for...of 代替
7. **并发限制**：asyncPool 模式限制并发数，避免 API 限流

### 与 AI Agent 的关联

异步编程在 Agent 开发中的核心应用：

- **LLM API 调用**：所有 LLM 调用都是异步的，需要 await 等待响应
- **工具并发调用**：Agent 同时调用多个工具时用 Promise.all 并行
- **流式响应**：LLM 流式输出用 `for await...of` 逐块处理（Day 5 已学）
- **重试与超时**：网络不稳定时需要自动重试和超时控制
- **批量处理**：处理大量数据时需要并发限制，避免 API 限流
- **ReAct 模式**：多步推理中，每一步都是异步的，需要串行 await

---

## 十二、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| MDN 中文 - 如何使用 Promise | https://developer.mozilla.org/zh-CN/docs/Learn/JavaScript/Asynchronous/Promises | 官方中文教程，含 async/await |
| 菜鸟教程 - TypeScript async/await | https://www.runoob.com/typescript/ts-async-await.html | 入门友好，语法速查 |
| CSDN - TypeScript 异步编程详解 | https://blog.csdn.net/gitblog_00236/article/details/154891979 | Promise + async/await + 生成器 |
| JavaScript中文网 - TS Promise 和 async/await | https://www.javascriptcn.com/post/657e7d15d2f5e1655d950cbe | 类型安全实践 |
| 掘金 - TypeScript 异步处理 | https://juejin.cn/post/7418233427420954675 | async/await 详解 |

> **提示**：MDN 中文版（developer.mozilla.org）在国内可正常访问，是学习 JavaScript 异步编程最权威的中文资源。

---

## 十三、明日预告

**Day 4：TypeScript 模块系统与工程化配置**

- ESM 与 CJS 的区别与兼容
- 动态导入 `import()`
- tsconfig.json 核心配置
- ESLint + Prettier 代码规范

模块系统是组织大型 Agent 项目的基础，工程化配置确保代码质量和团队协作。掌握它们，你就拥有了构建可维护 Agent 项目的能力。

---

> ⚡ Day 3 完成！异步编程是 AI Agent 开发的生命线——每一次 LLM 调用、每一次工具执行都离不开它。掌握 async/await，你就掌握了 Agent 交互的钥匙。
