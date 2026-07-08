# AI Agent 学习计划 Day 7：Node.js Event Emitter（事件触发器）

> 📅 日期：2026-07-08  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 7 / 84（8.3%）

## 前言

Day 6 我们深入了事件循环（Event Loop），理解了「异步回调何时被执行」。今天进入 Node.js 异步编程的另一半拼图——**Event Emitter（事件触发器）**，解决的是「如何注册和触发事件」。

如果说事件循环是 Node.js 的「心脏」，负责调度异步任务的执行时机；那么 EventEmitter 就是 Node.js 的「神经系统」，负责在模块之间传递信号。Node.js 几乎所有核心模块（`http`、`stream`、`fs`、`net`）都继承自 `EventEmitter`——`http.Server` 在收到请求时触发 `request` 事件，`stream.Readable` 在有数据可读时触发 `data` 事件。

在 AI Agent 开发中，EventEmitter 是构建**事件驱动架构（EDA）**的基石：Agent 的「思考开始」「工具调用」「思考结束」都可以抽象为事件；多个 Agent 之间可以通过事件总线（Event Bus）解耦通信。本文将从 EventEmitter 基础 API 讲起，逐步深入错误处理、异步监听器、内存泄漏防范，最终落地到事件驱动的 Agent 系统设计。

---

## 一、EventEmitter 基础概念

### 1.1 什么是 EventEmitter

`EventEmitter` 是 Node.js `events` 模块提供的核心类，实现了经典的**发布-订阅模式（Pub/Sub）**：一个对象（发布者）在状态变化时触发事件，其他对象（订阅者）通过注册监听器来响应这些事件。

```javascript
const EventEmitter = require('events')

// 创建一个事件触发器实例
const emitter = new EventEmitter()

// 订阅事件：注册监听器
emitter.on('greeting', (name) => {
  console.log(`你好，${name}！`)
})

// 发布事件：触发监听器
emitter.emit('greeting', 'AI Agent')
// 输出：你好，AI Agent！
```

### 1.2 核心三要素

| 要素 | 说明 | 对应 API |
|------|------|----------|
| **事件名（Event Name）** | 字符串，标识一个事件 | 任意字符串，但 `'error'` 有特殊语义 |
| **监听器（Listener）** | 事件触发时执行的回调函数 | `on()` 注册 |
| **触发（Emit）** | 通知所有监听器事件已发生 | `emit()` 调用 |

### 1.3 为什么 Node.js 选择事件驱动

Node.js 的设计哲学是「单线程 + 非阻塞 I/O + 事件驱动」。当网络请求到达、文件读取完成、定时器到期时，系统会以「事件」的形式通知 Node.js。EventEmitter 提供了统一的接口来处理这些通知，避免了回调地狱，实现模块间松耦合。

---

## 二、核心 API 详解

### 2.1 on / addListener：注册监听器

`on` 是 `addListener` 的别名，两者完全等价。监听器按注册顺序依次调用。

```javascript
const emitter = new EventEmitter()

emitter.on('event', () => console.log('第一个监听器'))
emitter.on('event', () => console.log('第二个监听器'))
emitter.addListener('event', () => console.log('第三个监听器'))

emitter.emit('event')
// 第一个监听器
// 第二个监听器
// 第三个监听器
```

### 2.2 once：只触发一次的监听器

`once` 注册的监听器在第一次触发后自动移除，适合「一次性初始化」场景。

```javascript
const emitter = new EventEmitter()

let callCount = 0
emitter.once('init', () => {
  callCount++
  console.log(`初始化执行，第 ${callCount} 次`)
})

emitter.emit('init')  // 初始化执行，第 1 次
emitter.emit('init')  // （无输出，监听器已被移除）
emitter.emit('init')  // （无输出）
```

### 2.3 emit：触发事件

`emit` 按注册顺序同步调用所有监听器，返回 `true` 表示有监听器被调用，`false` 表示该事件没有任何监听器。

```javascript
const emitter = new EventEmitter()
emitter.on('data', (chunk) => console.log('收到:', chunk))

console.log(emitter.emit('data', 'hello'))  // true
console.log(emitter.emit('nope'))           // false
```

> **关键点**：监听器是**同步执行**的。`emit()` 会阻塞，直到所有监听器执行完毕才返回。

### 2.4 off / removeListener：移除监听器

`off` 是 `removeListener` 的别名。移除时必须传入**同一个函数引用**。

```javascript
const emitter = new EventEmitter()

function listener(name) {
  console.log(`欢迎 ${name}`)
}

emitter.on('welcome', listener)
emitter.emit('welcome', 'Alice')  // 欢迎 Alice

// ✅ 传入同一个引用才能移除
emitter.off('welcome', listener)
emitter.emit('welcome', 'Bob')    // （无输出）

// ❌ 传入匿名函数无法移除
emitter.on('welcome', () => console.log('匿名'))
// 没有引用，无法 removeListener
```

### 2.5 removeAllListeners：移除所有监听器

```javascript
const emitter = new EventEmitter()
emitter.on('a', () => console.log('a1'))
emitter.on('a', () => console.log('a2'))
emitter.on('b', () => console.log('b1'))

emitter.removeAllListeners('a')  // 只移除 'a' 事件的所有监听器
emitter.removeAllListeners()      // 移除所有事件的所有监听器（危险！）
```

### 2.6 完整 API 速查表

| 方法 | 说明 |
|------|------|
| `on(event, listener)` | 注册监听器，每次触发都执行 |
| `once(event, listener)` | 注册一次性监听器 |
| `off(event, listener)` | 移除指定监听器 |
| `removeListener(event, listener)` | `off` 的别名 |
| `removeAllListeners([event])` | 移除某事件或全部监听器 |
| `emit(event, ...args)` | 触发事件，同步调用监听器 |
| `listeners(event)` | 返回监听器数组副本 |
| `rawListeners(event)` | 返回监听器数组（含 once 包装） |
| `listenerCount(event)` | 返回监听器数量 |
| `setMaxListeners(n)` | 设置最大监听器数（默认 10） |
| `getMaxListeners()` | 获取最大监听器数 |
| `prependListener(event, listener)` | 在最前面插入监听器 |
| `prependOnceListener(event, listener)` | 在最前面插入一次性监听器 |

---

## 三、this 指向与箭头函数

### 3.1 普通函数：this 指向 emitter 实例

```javascript
const emitter = new EventEmitter()

emitter.on('event', function () {
  console.log(this === emitter)  // true
})
emitter.emit('event')
```

### 3.2 箭头函数：this 继承自外层作用域

```javascript
const emitter = new EventEmitter()

class Agent {
  constructor() {
    this.name = 'Agent-1'
    // ❌ 用普通函数：this 指向 emitter，拿不到 this.name
    // emitter.on('task', function () {
    //   console.log(this.name)  // undefined
    // })

    // ✅ 用箭头函数：this 继承 Agent 实例
    emitter.on('task', () => {
      console.log(`${this.name} 收到任务`)
    })
  }
}

const agent = new Agent()
emitter.emit('task')  // Agent-1 收到任务
```

> **最佳实践**：当监听器需要访问 `emitter` 实例时用普通函数；当需要访问外层 `this`（如类实例）时用箭头函数。

---

## 四、错误事件处理

### 4.1 error 事件的特殊性

当 `emit('error')` 触发时，如果没有注册 `'error'` 监听器，Node.js 会认为这是未捕获的错误，**直接抛出并崩溃进程**。

```javascript
const emitter = new EventEmitter()

// ❌ 没有注册 error 监听器
emitter.emit('error', new Error('出错了'))
// 抛出：Error:出错了
// 进程崩溃！
```

### 4.2 正确的错误处理

```javascript
const emitter = new EventEmitter()

// ✅ 注册 error 监听器
emitter.on('error', (err) => {
  console.error('捕获到错误:', err.message)
})

emitter.emit('error', new Error('出错了'))
// 捕获到错误: 出错了
// 进程不崩溃
```

### 4.3 全局兜底：captureRejections

当监听器是 `async` 函数时，如果它抛出错误或返回 rejected Promise，默认行为是触发 `error` 事件。开启 `captureRejections` 选项可自动处理：

```javascript
const emitter = new EventEmitter({ captureRejections: true })

emitter.on('asyncTask', async (task) => {
  if (task === 'bad') {
    throw new Error('任务失败')
  }
  return '成功'
})

// 当 async 监听器 reject 时，自动触发 'error' 事件
emitter.on('error', (err) => {
  console.error('异步监听器失败:', err.message)
})

emitter.emit('asyncTask', 'bad')  // 异步监听器失败: 任务失败
```

---

## 五、异步监听器与 await emit

### 5.1 emit 是同步的

`emit()` 不会等待 `async` 监听器完成：

```javascript
const emitter = new EventEmitter()

emitter.on('process', async (data) => {
  await new Promise(r => setTimeout(r, 100))
  console.log('处理完成:', data)
})

console.log('1. 触发前')
emitter.emit('process', 'hello')  // 不会等待
console.log('2. 触发后')

// 输出：
// 1. 触发前
// 2. 触发后
// 处理完成: hello  （100ms 后）
```

### 5.2 events.once：Promise 化等待事件

`events.once(emitter, event)` 返回一个 Promise，在事件首次触发时 resolve：

```javascript
const { once } = require('events')

const emitter = new EventEmitter()

// 异步等待事件
async function waitForEvent() {
  console.log('等待事件...')
  const [data] = await once(emitter, 'ready')
  console.log('收到事件:', data)
}

waitForEvent()

setTimeout(() => {
  emitter.emit('ready', { status: 'ok' })
}, 500)
// 等待事件...
// （500ms 后）收到事件: { status: 'ok' }
```

### 5.3 events.on：异步迭代事件流

`events.on(emitter, event)` 返回一个 AsyncIterator，可以用 `for await...of` 持续消费事件：

```javascript
const { on } = require('events')

const emitter = new EventEmitter()

async function consumeEvents() {
  for await (const [data] of on(emitter, 'message')) {
    console.log('收到消息:', data)
    if (data === 'end') break
  }
  console.log('事件流结束')
}

consumeEvents()

emitter.emit('message', '第一条')
emitter.emit('message', '第二条')
emitter.emit('message', 'end')
// 收到消息: 第一条
// 收到消息: 第二条
// 收到消息: end
// 事件流结束
```

> 这个模式非常适合处理 LLM 的流式消息：每收到一个 token 就 emit 一个 `message` 事件，消费者用 `for await...of` 逐条处理。

---

## 六、监听器数量与内存泄漏防范

### 6.1 最大监听器警告

默认情况下，单个事件最多允许 10 个监听器。超过时会打印警告：

```
MaxListenersExceededWarning: Possible EventEmitter memory leak detected.
11 event listeners added. Use emitter.setMaxListeners() to increase limit.
```

这通常是**内存泄漏**的信号——在循环中反复 `on()` 却忘了 `off()`。

### 6.2 设置最大监听器

```javascript
const emitter = new EventEmitter()

// 方法一：实例级别
emitter.setMaxListeners(20)

// 方法二：全局级别
EventEmitter.defaultMaxListeners = 20

console.log(emitter.getMaxListeners())  // 20
```

### 6.3 内存泄漏的常见场景

```javascript
// ❌ 反模式：每次请求都注册监听器，从不移除
function handleRequest(req, res) {
  req.on('data', chunk => { /* ... */ })  // 每次请求新增一个，永不移除
}

// ✅ 正确：使用 once 或在完成后移除
function handleRequest(req, res) {
  const onData = chunk => { /* ... */ }
  req.on('data', onData)
  req.on('end', () => {
    req.off('data', onData)  // 处理完成后移除
  })
}
```

---

## 七、自定义 EventEmitter 类

### 7.1 继承 EventEmitter

Node.js 的最佳实践是「继承而非组合」——让你的类直接继承 EventEmitter，这样实例既能触发事件，又能调用业务方法。

```javascript
const EventEmitter = require('events')

class Agent extends EventEmitter {
  constructor(name) {
    super()
    this.name = name
    this.state = 'idle'
  }

  async think(task) {
    this.state = 'thinking'
    this.emit('think:start', { task, agent: this.name })

    // 模拟思考过程
    await new Promise(resolve => setTimeout(resolve, 500))
    const result = `对「${task}」的分析结果`

    this.emit('think:end', { task, result })
    this.state = 'idle'
    return result
  }
}

// 使用
const agent = new Agent('Coder-Agent')

agent.on('think:start', ({ task, agent }) => {
  console.log(`[${agent}] 开始思考: ${task}`)
})

agent.on('think:end', ({ task, result }) => {
  console.log(`思考完成: ${result}`)
})

await agent.think('优化这段代码')
// [Coder-Agent] 开始思考: 优化这段代码
// （500ms 后）思考完成: 对「优化这段代码」的分析结果
```

### 7.2 事件命名规范

| 命名风格 | 示例 | 说明 |
|----------|------|------|
| `命名空间:动作` | `tool:call`、`tool:result` | 推荐分组，避免冲突 |
| `状态:变化` | `state:change`、`state:idle` | 适合生命周期事件 |
| `错误` | `error` | 固定名称，有特殊语义 |

---

## 八、事件驱动的 Agent 系统设计

### 8.1 事件总线（Event Bus）实现

多个 Agent 之间通过事件总线解耦通信，是事件驱动架构的核心模式：

```javascript
const EventEmitter = require('events')

// 全局事件总线
const eventBus = new EventEmitter()
eventBus.setMaxListeners(50)  // Agent 多时调高上限

// PM Agent：接收需求，拆分任务并发布
class PMAgent {
  constructor() {
    eventBus.on('request:new', (req) => this.handle(req))
  }

  async handle(req) {
    console.log(`[PM] 收到需求: ${req}`)
    const tasks = await this.splitTasks(req)
    // 发布任务给 Coder Agent
    tasks.forEach(task => eventBus.emit('task:code', task))
  }

  async splitTasks(req) {
    await new Promise(r => setTimeout(r, 200))
    return ['搭建项目结构', '实现核心逻辑', '编写接口']
  }
}

// Coder Agent：监听编码任务
class CoderAgent {
  constructor() {
    eventBus.on('task:code', (task) => this.code(task))
  }

  async code(task) {
    console.log(`[Coder] 开始编码: ${task}`)
    await new Promise(r => setTimeout(r, 300))
    const code = `// ${task} 的代码`
    // 编码完成，交给 Reviewer
    eventBus.emit('task:review', code)
  }
}

// Reviewer Agent：监听审查任务
class ReviewerAgent {
  constructor() {
    eventBus.on('task:review', (code) => this.review(code))
  }

  async review(code) {
    console.log(`[Reviewer] 审查代码: ${code.slice(0, 30)}...`)
    await new Promise(r => setTimeout(r, 200))
    eventBus.emit('task:done', { code, approved: true })
  }
}

// 启动系统
new PMAgent()
new CoderAgent()
new ReviewerAgent()

eventBus.on('task:done', ({ approved }) => {
  console.log(approved ? '✅ 任务完成并通过审查' : '❌ 审查未通过')
})

// 触发整个流程
eventBus.emit('request:new', '开发一个待办应用')
// [PM] 收到需求: 开发一个待办应用
// [Coder] 开始编码: 搭建项目结构
// [Reviewer] 审查代码: // 搭建项目结构 的代码...
// ✅ 任务完成并通过审查
// ... 后续任务
```

### 8.2 Agent 生命周期事件

一个完整的 Agent 运行周期可以用事件来建模：

```javascript
class AgentRunner extends EventEmitter {
  constructor(agent) {
    super()
    this.agent = agent
  }

  async run(input) {
    this.emit('lifecycle:start', { input })

    try {
      // 1. 感知
      this.emit('perceive:start')
      const context = await this.agent.perceive(input)
      this.emit('perceive:end', { context })

      // 2. 决策
      this.emit('decide:start')
      const action = await this.agent.decide(context)
      this.emit('decide:end', { action })

      // 3. 执行
      this.emit('act:start')
      const result = await this.agent.act(action)
      this.emit('act:end', { result })

      this.emit('lifecycle:complete', { result })
      return result
    } catch (err) {
      this.emit('error', err)
      throw err
    }
  }
}

// 监听生命周期，实现日志、监控、UI 更新
const runner = new AgentRunner(myAgent)

runner.on('lifecycle:start', ({ input }) => {
  console.log(`▶ Agent 启动，输入: ${input}`)
})

runner.on('decide:end', ({ action }) => {
  console.log(`🧠 决策完成: 将执行 ${action.name}`)
  // 可以在这里更新 UI，展示 Agent 的"思考过程"
})

runner.on('act:start', () => {
  console.log('⚡ 开始执行动作...')
})

runner.on('error', (err) => {
  console.error('💥 Agent 运行出错:', err.message)
  // 上报错误到监控系统
})

await runner.run('帮我搜索天气')
```

### 8.3 事件驱动 vs 直接调用对比

```javascript
// ❌ 直接调用：紧耦合，难以扩展
class TightCoupledSystem {
  async run(input) {
    const result = await this.agent.think(input)
    this.logger.log(result)      // 写死日志
    this.monitor.track(result)   // 写死监控
    this.ui.update(result)       // 写死 UI
  }
  // 想加新功能（如缓存）必须修改这个类
}

// ✅ 事件驱动：松耦合，易扩展
class EventDrivenSystem {
  constructor() {
    this.emitter = new EventEmitter()
    // 各模块独立监听，互不影响
    this.emitter.on('result', r => this.logger.log(r))
    this.emitter.on('result', r => this.monitor.track(r))
    this.emitter.on('result', r => this.ui.update(r))
    // 想加缓存？只需新增监听器，无需改动核心逻辑
    this.emitter.on('result', r => this.cache.set(r))
  }

  async run(input) {
    const result = await this.agent.think(input)
    this.emitter.emit('result', result)  // 通知所有订阅者
  }
}
```

---

## 九、综合实战练习

### 练习 1：手写迷你 EventEmitter

```javascript
class MyEventEmitter {
  constructor() {
    this.events = new Map()
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(listener)
    return this
  }

  once(event, listener) {
    const wrapper = (...args) => {
      this.off(event, wrapper)
      listener(...args)
    }
    this.on(event, wrapper)
    return this
  }

  off(event, listener) {
    const listeners = this.events.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index !== -1) listeners.splice(index, 1)
    }
    return this
  }

  emit(event, ...args) {
    const listeners = this.events.get(event)
    if (!listeners) return false
    // 复制一份，防止遍历时被修改
    [...listeners].forEach(fn => fn(...args))
    return true
  }

  listenerCount(event) {
    return this.events.get(event)?.length || 0
  }
}

// 测试
const ee = new MyEventEmitter()
ee.on('ping', () => console.log('pong 1'))
ee.on('ping', () => console.log('pong 2'))
ee.once('ping', () => console.log('只响应一次'))
ee.emit('ping')  // pong 1, pong 2, 只响应一次
ee.emit('ping')  // pong 1, pong 2
```

### 练习 2：LLM 流式响应事件化

```javascript
const { EventEmitter } = require('events')

class LLMStreamer extends EventEmitter {
  async *stream(prompt) {
    const tokens = ['你', '好', '，', '我', '是', 'AI']
    for (const token of tokens) {
      await new Promise(r => setTimeout(r, 80))
      this.emit('token', token)  // 每个 token 都触发事件
      yield token
    }
    this.emit('done', { totalTokens: tokens.length })
  }
}

const streamer = new LLMStreamer()

streamer.on('token', (token) => {
  process.stdout.write(token)
})
streamer.on('done', ({ totalTokens }) => {
  console.log(`\n[完成，共 ${totalTokens} 个 token]`)
})

// 消费流
for await (const token of streamer.stream('你好')) {
  // token 已通过事件输出
}
// 你好，我是AI
// [完成，共 6 个 token]
```

### 练习 3：带超时和取消的事件等待

```javascript
const { once } = require('events')

// 等待事件，支持超时和取消
async function waitForEventWithTimeout(emitter, event, { timeout = 5000, signal } = {}) {
  const ac = new AbortController()

  // 超时自动取消
  const timer = setTimeout(() => ac.abort(new Error('超时')), timeout)

  // 外部信号取消
  if (signal) {
    signal.addEventListener('abort', () => ac.abort(signal.reason))
  }

  try {
    const [data] = await once(emitter, event, { signal: ac.signal })
    return data
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`等待事件「${event}」被取消或超时`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// 使用
const emitter = new EventEmitter()

async function main() {
  // 5 秒内等待 'ready' 事件
  const result = await waitForEventWithTimeout(emitter, 'ready', { timeout: 5000 })
  console.log('收到:', result)
}

main().catch(console.error)

// 3 秒后触发
setTimeout(() => emitter.emit('ready', '系统就绪'), 3000)
// （3 秒后）收到: 系统就绪
```

---

## 十、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| EventEmitter | 发布-订阅模式的核心类，所有事件对象的基类 |
| `on` / `emit` | 注册监听器 / 触发事件（同步执行） |
| `once` | 一次性监听器，触发后自动移除 |
| `off` | 移除监听器，需传入同一函数引用 |
| `error` 事件 | 未注册监听器时触发会崩溃进程 |
| `captureRejections` | 自动捕获 async 监听器的 rejection |
| `events.once` | Promise 化等待单次事件 |
| `events.on` | 异步迭代消费事件流 |
| 最大监听器 | 默认 10，超过警告，可能内存泄漏 |
| 事件总线 | 多 Agent 通过共享 EventEmitter 解耦通信 |

### 关键收获

1. **发布-订阅模式**：EventEmitter 是 Node.js 事件驱动的核心，实现了发布者与订阅者的解耦
2. **同步执行**：`emit()` 同步调用所有监听器，async 监听器不会被 await
3. **错误必须处理**：`error` 事件无监听器时进程崩溃，始终注册 error 监听器
4. **内存泄漏防范**：超过 10 个监听器会警告，循环中 on() 必须 off() 或用 once()
5. **this 指向**：普通函数 this 指向 emitter，箭头函数继承外层作用域
6. **Promise 化**：`events.once` 等待事件、`events.on` 异步迭代事件流
7. **事件驱动架构**：Agent 之间通过事件总线松耦合通信，易扩展

### 与 AI Agent 的关联

EventEmitter 在 Agent 开发中的核心应用：

- **Agent 生命周期**：`think:start`、`tool:call`、`think:end` 等事件驱动 UI 更新和日志记录
- **多 Agent 协作**：事件总线实现 PM→Coder→Reviewer 链式协作，松耦合易扩展
- **LLM 流式响应**：每个 token 触发 `token` 事件，前端逐字渲染
- **工具调用通知**：Agent 调用工具时触发事件，实现监控和审计
- **状态管理**：Agent 状态变化（idle→thinking→acting）通过事件广播

---

## 十一、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| Node.js 中文网 - Events 事件触发器 | http://nodejs.cn/api/events.html | 官方文档中文版，权威完整（v26） |
| 菜鸟教程 - Node.js EventEmitter | https://www.runoob.com/nodejs/nodejs-event.html | 入门友好，适合快速上手 |
| 掘金 - 手把手实现 EventEmitter | https://juejin.cn/post/7546901400137170954 | 从零实现，深入理解原理 |
| 知乎 - Node.js 异步编程 EventEmitter | https://zhuanlan.zhihu.com/p/1942760321849721691 | 事件驱动编程详解 |
| JavaScript中文网 - EventEmitter 使用详解 | https://www.javascriptcn.com/post/67066d01d91dce0dc85cd547 | 观察者模式实践 |
| 知乎 - EventEmitter 详解 | https://zhuanlan.zhihu.com/p/681245944 | 核心 API 全面解析 |
| 掘金 - EventEmitter 前端事件驱动 | https://juejin.cn/post/7415914023278051367 | 事件总线实现 |
| CSDN - EventEmitter 保姆级教程 | https://blog.csdn.net/weixin_42525582/article/details/161210765 | 餐厅点餐类比，实战应用 |
| W3Schools中文 - Events 事件模块 | https://www.w3schools.cn/nodejs/ref_events.html | 语法速查 |

> **提示**：Node.js 中文网（nodejs.cn）的 Events 文档是最权威的中文资源，覆盖所有 API 和高级用法。配合掘金「手把手实现 EventEmitter」文章，从原理到实践一次掌握。

---

## 十二、明日预告

**Day 8：Node.js 子进程与 Worker Threads**

- `child_process` 模块：`exec`、`execFile`、`spawn`、`fork`
- `worker_threads` 模块：真正的多线程并行
- 并行执行多 Agent 任务
- CPU 密集任务（向量计算）不阻塞主线程

Worker Threads 是 Node.js 突破单线程限制的关键，在 Agent 系统中用于并行执行多个 Agent 任务、处理向量计算等 CPU 密集场景。掌握它，你就拥有了构建高性能多 Agent 系统的能力。

---

> 🚀 Day 7 完成！EventEmitter 是 Node.js 事件驱动架构的灵魂，掌握它你就掌握了构建松耦合、可扩展 Agent 系统的核心技能。明天我们将用 Worker Threads 突破单线程限制！
