# AI Agent 学习计划 Day 8：Node.js 子进程与 Worker Threads

> 📅 日期：2026-07-09  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 8 / 84（9.5%）

## 前言

Day 7 我们学习了 EventEmitter，掌握了 Node.js 事件驱动的「神经系统」。但 EventEmitter 解决的是「模块间如何通信」，而今天要解决的是一个更根本的问题——**如何突破单线程限制，实现真正的并行计算**。

Node.js 主线程是单线程的，事件循环让它能高效处理 I/O 密集型任务（网络请求、文件读写），但遇到 CPU 密集型任务（大规模向量计算、数据加密、图像处理）时，单线程会成为瓶颈——一个耗时计算会阻塞整个事件循环，所有 I/O 回调、LLM 流式 token 全部卡住。

Node.js 提供了两条突破单线程的路径：

1. **child_process（子进程）**：创建独立的操作系统进程，适合运行外部命令、隔离执行不可信代码
2. **worker_threads（工作线程）**：在同一个进程内创建多线程，共享内存，适合 CPU 密集型并行计算

在 AI Agent 开发中，这两者各有用武之地：child_process 用于执行外部代码（如运行 Python 脚本、调用系统命令），worker_threads 用于并行运行多个 Agent 任务、处理向量计算等 CPU 密集场景。本文将系统讲解这两个模块的核心 API、通信机制，并落地到 Agent 系统的实战应用。

---

## 一、为什么需要多进程/多线程

### 1.1 单线程的困境

回顾 Day 6 学过的事件循环——Node.js 主线程只有一个，CPU 密集任务会阻塞事件循环：

```javascript
// ❌ CPU 密集任务阻塞事件循环
function heavyCompute(n) {
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += Math.sqrt(i)
  }
  return sum
}

// 这段代码运行期间，所有 I/O 回调都被阻塞
setTimeout(() => console.log('我被阻塞了 5 秒'), 0)
heavyCompute(1e9)  // 阻塞约 5 秒
```

在 Agent 系统中，这意味着：如果你在主线程做向量相似度计算，LLM 的流式 token 就无法实时推送，用户体验极差。

### 1.2 两种并行方案对比

| 特性 | child_process（子进程） | worker_threads（工作线程） |
|------|------------------------|--------------------------|
| **底层** | 操作系统进程 | 线程（共享进程内存空间） |
| **内存** | 独立内存空间，不共享 | 可通过 SharedArrayBuffer 共享 |
| **启动开销** | 大（创建新进程） | 小（创建新线程） |
| **通信方式** | IPC（进程间通信）、stdout/stdin | MessagePort（消息传递）、共享内存 |
| **隔离性** | 强（进程崩溃不影响主进程） | 弱（线程崩溃可能影响整个进程） |
| **适用场景** | 运行外部命令、执行不可信代码、多语言混合 | CPU 密集计算、并行 Agent 任务 |
| **Agent 应用** | 代码执行沙箱、运行 Python 脚本 | 并行向量计算、多 Agent 并发推理 |

### 1.3 选择原则

```
需要运行外部命令/脚本？     → child_process
需要执行不可信的用户代码？   → child_process（隔离更安全）
需要 CPU 密集型并行计算？   → worker_threads（开销更小）
需要共享大量数据？          → worker_threads（SharedArrayBuffer）
需要跨语言调用（Python等）？ → child_process
```

---

## 二、child_process 模块

### 2.1 四个核心 API

`child_process` 模块提供四种创建子进程的方法：

| 方法 | 返回值 | 特点 | 适用场景 |
|------|--------|------|---------|
| `exec` | ChildProcess + 回调 | 使用 shell 执行命令，有 maxBuffer 限制 | 执行简单命令 |
| `execFile` | ChildProcess + 回调 | 不使用 shell，更安全高效 | 执行可执行文件 |
| `spawn` | ChildProcess（流式） | 流式返回数据，无 maxBuffer 限制 | 大量数据输出 |
| `fork` | ChildProcess | spawn 的特例，专门用于 Node.js 进程，自带 IPC | Node.js 进程间通信 |

### 2.2 exec：执行 shell 命令

`exec` 在 shell 中执行命令，将结果缓存在内存中，通过回调返回：

```javascript
const { exec } = require('child_process')

// 执行 shell 命令
exec('ls -la /tmp', (error, stdout, stderr) => {
  if (error) {
    console.error(`执行出错: ${error.message}`)
    return
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`)
    return
  }
  console.log(`stdout: ${stdout}`)
})
```

**Promise 化写法**（推荐）：

```javascript
const { promisify } = require('util')
const execAsync = promisify(require('child_process').exec)

async function listFiles() {
  try {
    const { stdout, stderr } = await execAsync('ls -la /tmp')
    console.log(stdout)
  } catch (err) {
    console.error('命令执行失败:', err.message)
  }
}

listFiles()
```

> **注意**：`exec` 默认 maxBuffer 为 1MB，如果输出超过此限制会报错。大量输出请用 `spawn`。

### 2.3 execFile：执行可执行文件

`execFile` 直接执行可执行文件，不经过 shell，更安全（避免 shell 注入）也更高效：

```javascript
const { execFile } = require('child_process')

// 直接执行 node 命令，不经过 shell
execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) throw error
  console.log(`Node.js 版本: ${stdout.trim()}`)
})

// 执行 Python 脚本（Agent 场景：调用 Python 工具链）
execFile('python3', ['script.py', '--input', 'data.json'], (error, stdout, stderr) => {
  if (error) {
    console.error('Python 脚本执行失败:', error.message)
    return
  }
  console.log('Python 输出:', stdout)
})
```

> **安全提示**：`execFile` 不经过 shell，不会对参数做 shell 解析，避免了命令注入风险。处理用户输入时优先使用 `execFile`。

### 2.4 spawn：流式创建子进程

`spawn` 是最底层的子进程创建方法，返回的数据是流式的，没有 maxBuffer 限制，适合处理大量输出：

```javascript
const { spawn } = require('child_process')

// 流式执行：适合大量输出
const child = spawn('find', ['/', '-name', '*.log', '-type', 'f'])

// 逐块接收 stdout
child.stdout.on('data', (chunk) => {
  console.log(`找到文件: ${chunk.toString().trim()}`)
})

child.stderr.on('data', (chunk) => {
  console.error(`错误: ${chunk}`)
})

child.on('close', (code) => {
  console.log(`子进程退出，退出码: ${code}`)
})
```

**Agent 场景：流式执行代码并实时输出**

```javascript
// 运行用户提交的脚本，实时返回输出
function runScript(scriptPath, args = []) {
  const child = spawn('node', [scriptPath, ...args])

  const output = []
  
  child.stdout.on('data', (chunk) => {
    output.push(chunk)
    // 实时推送给前端
    console.log(`[stdout] ${chunk.toString()}`)
  })

  child.stderr.on('data', (chunk) => {
    console.error(`[stderr] ${chunk.toString()}`)
  })

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(output).toString())
      } else {
        reject(new Error(`进程退出码: ${code}`))
      }
    })
  })
}
```

### 2.5 fork：Node.js 进程间通信

`fork` 是 `spawn` 的特例，专门用于创建 Node.js 子进程，**自带 IPC 通道**，父子进程可以通过 `send`/`on('message')` 通信：

```javascript
// parent.js - 父进程
const { fork } = require('child_process')

// fork 一个 Node.js 子进程，自动建立 IPC 通道
const child = fork('worker.js')

// 发送消息给子进程
child.send({ type: 'task', data: { prompt: '你好', model: 'gpt-4' } })

// 接收子进程消息
child.on('message', (msg) => {
  console.log('收到子进程结果:', msg)

  if (msg.type === 'result') {
    console.log('LLM 回复:', msg.data)
    child.send({ type: 'exit' })  // 通知子进程退出
  }
})

child.on('exit', (code) => {
  console.log(`子进程退出，退出码: ${code}`)
})
```

```javascript
// worker.js - 子进程
process.on('message', async (msg) => {
  if (msg.type === 'task') {
    // 执行 LLM 调用（在子进程中，不阻塞主进程）
    const result = await callLLM(msg.data.prompt, msg.data.model)
    
    // 发送结果给父进程
    process.send({ type: 'result', data: result })
  }

  if (msg.type === 'exit') {
    process.exit(0)
  }
})

async function callLLM(prompt, model) {
  // 模拟 LLM 调用
  await new Promise(r => setTimeout(r, 1000))
  return `LLM 回复: ${prompt}`
}
```

> **fork 的优势**：IPC 通道是结构化通信（直接传 JS 对象），比解析 stdout 更可靠。适合 Node.js 进程间协作。

---

## 三、child_process 进阶用法

### 3.1 传递环境变量和工作目录

```javascript
const { spawn } = require('child_process')

const child = spawn('node', ['script.js'], {
  cwd: '/path/to/project',          // 工作目录
  env: {
    ...process.env,                  // 继承父进程环境变量
    OPENAI_API_KEY: 'sk-xxx',       // 注入额外变量
    NODE_ENV: 'production'
  },
  stdio: 'pipe',                     // stdin/stdout/stderr 管道
  timeout: 30000,                    // 30 秒超时
  killSignal: 'SIGTERM'              // 超时后发送的信号
})
```

### 3.2 stdio 配置

`stdio` 选项控制子进程的标准输入输出：

```javascript
// 三种常用配置
spawn('node', ['script.js'], { stdio: 'inherit' })   // 继承父进程，直接输出到终端
spawn('node', ['script.js'], { stdio: 'pipe' })      // 管道，通过 .stdout.on('data') 获取
spawn('node', ['script.js'], { stdio: 'ignore' })    // 丢弃输出
```

### 3.3 超时与终止

```javascript
const { spawn } = require('child_process')

function runWithTimeout(command, args, timeout = 10000) {
  const child = spawn(command, args)
  let timedOut = false

  const timer = setTimeout(() => {
    timedOut = true
    child.kill('SIGTERM')  // 先发 SIGTERM，给子进程清理机会
    
    // 3 秒后还没退出，强制 kill
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL')
      }
    }, 3000)
  }, timeout)

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      clearTimeout(timer)
      if (timedOut) {
        reject(new Error('进程超时被终止'))
      } else if (code === 0) {
        resolve('成功')
      } else {
        reject(new Error(`退出码: ${code}`))
      }
    })
  })
}
```

### 3.4 进程池模式

频繁 fork 进程开销大，可以维护一个进程池复用子进程：

```javascript
const { fork } = require('child_process')
const EventEmitter = require('events')

class ProcessPool {
  constructor(workerFile, poolSize = 4) {
    this.workerFile = workerFile
    this.poolSize = poolSize
    this.workers = []
    this.queue = []
    this.init()
  }

  init() {
    for (let i = 0; i < this.poolSize; i++) {
      this.workers.push(this.createWorker())
    }
  }

  createWorker() {
    const worker = fork(this.workerFile)
    worker.busy = false
    
    worker.on('message', (msg) => {
      if (msg.type === 'result' && worker.resolve) {
        worker.busy = false
        worker.resolve(msg.data)
        worker.resolve = null
        // 处理队列中的下一个任务
        this.processQueue()
      }
    })

    worker.on('exit', (code) => {
      console.log(`Worker 退出，退出码: ${code}`)
      // 重启 worker
      const index = this.workers.indexOf(worker)
      if (index !== -1) {
        this.workers[index] = this.createWorker()
      }
    })

    return worker
  }

  async run(task) {
    return new Promise((resolve) => {
      const freeWorker = this.workers.find(w => !w.busy)
      
      if (freeWorker) {
        freeWorker.busy = true
        freeWorker.resolve = resolve
        freeWorker.send({ type: 'task', data: task })
      } else {
        // 没有空闲 worker，加入队列
        this.queue.push({ task, resolve })
      }
    })
  }

  processQueue() {
    if (this.queue.length === 0) return
    const freeWorker = this.workers.find(w => !w.busy)
    if (!freeWorker) return

    const { task, resolve } = this.queue.shift()
    freeWorker.busy = true
    freeWorker.resolve = resolve
    freeWorker.send({ type: 'task', data: task })
  }
}

// 使用进程池
const pool = new ProcessPool('./llm-worker.js', 4)

// 并行提交 10 个任务
const tasks = Array(10).fill(0).map((_, i) => 
  pool.run({ prompt: `问题 ${i}`, model: 'gpt-4' })
)

const results = await Promise.all(tasks)
```

---

## 四、worker_threads 模块

### 4.1 核心概念

`worker_threads` 模块允许在同一个 Node.js 进程内创建多线程。与 child_process 不同，Worker Threads 运行在**独立的 V8 实例**中，有独立的事件循环，但可以通过 `MessagePort` 和 `SharedArrayBuffer` 通信。

| 概念 | 说明 |
|------|------|
| `Worker` | 代表一个工作线程的类 |
| `parentPort` | 子线程中用于与主线程通信的端口 |
| `workerData` | 主线程传给子线程的初始数据 |
| `MessageChannel` | 双向通信通道（两个 MessagePort） |
| `MessagePort` | 单向通信端口 |
| `SharedArrayBuffer` | 可被多线程共享的内存 |

### 4.2 基本用法：主线程

```javascript
const { Worker } = require('worker_threads')

// 创建 Worker，传入初始数据
const worker = new Worker('./worker-task.js', {
  workerData: {
    prompt: '你好',
    model: 'gpt-4',
    maxTokens: 1000
  }
})

// 接收子线程消息
worker.on('message', (result) => {
  console.log('收到结果:', result)
})

// 处理错误
worker.on('error', (err) => {
  console.error('Worker 出错:', err)
})

// Worker 退出
worker.on('exit', (code) => {
  console.log(`Worker 退出，退出码: ${code}`)
})

// 主动发送消息给子线程
worker.postMessage({ type: 'additional', data: '额外信息' })
```

### 4.3 基本用法：子线程

```javascript
// worker-task.js
const { parentPort, workerData, isMainThread } = require('worker_threads')

// 确认在子线程中运行
if (isMainThread) {
  throw new Error('此文件应在 Worker 线程中运行')
}

console.log('Worker 收到初始数据:', workerData)

// 接收主线程消息
parentPort.on('message', (msg) => {
  console.log('收到主线程消息:', msg)
  
  if (msg.type === 'additional') {
    // 处理任务
    const result = doWork(workerData, msg.data)
    
    // 发送结果给主线程
    parentPort.postMessage({
      type: 'done',
      result: result
    })
  }
})

function doWork(initialData, additionalData) {
  // 模拟 CPU 密集计算
  let sum = 0
  for (let i = 0; i < 1e7; i++) {
    sum += Math.sqrt(i)
  }
  return { sum, prompt: initialData.prompt }
}
```

### 4.4 使用 Promise 包装 Worker

```javascript
const { Worker } = require('worker_threads')
const path = require('path')

// 封装成 Promise，方便 async/await 调用
function runWorker(workerFile, data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFile, { workerData: data })

    worker.on('message', resolve)
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker 异常退出，退出码: ${code}`))
      }
    })
  })
}

// 使用
async function main() {
  const result = await runWorker('./heavy-compute.js', { n: 1e8 })
  console.log('计算结果:', result)
}

main()
```

### 4.5 MessageChannel：双向通信

当需要主线程和子线程双向通信时，使用 `MessageChannel`：

```javascript
const { Worker, MessageChannel } = require('worker_threads')

const { port1, port2 } = new MessageChannel()

const worker = new Worker('./双向-worker.js')

// 把 port2 传给子线程
worker.postMessage({ port: port2 }, [port2])

// 主线程通过 port1 收发消息
port1.on('message', (msg) => {
  console.log('主线程收到:', msg)
})

port1.postMessage('来自主线程的问候')
```

```javascript
// 双向-worker.js
const { parentPort } = require('worker_threads')

parentPort.on('message', ({ port }) => {
  // 通过收到的 port 通信
  port.on('message', (msg) => {
    console.log('子线程收到:', msg)
    port.postMessage('子线程的回复')
  })
})
```

### 4.6 SharedArrayBuffer：共享内存

`SharedArrayBuffer` 允许多线程共享同一块内存，无需拷贝，适合大数据量场景：

```javascript
// 主线程
const { Worker } = require('worker_threads')

// 创建共享内存：4 个 Float64（每个 8 字节 = 32 字节）
const sharedBuffer = new SharedArrayBuffer(4 * 8)
const sharedArray = new Float64Array(sharedBuffer)

// 初始值
sharedArray[0] = 1.0
sharedArray[1] = 2.0

const worker = new Worker('./shared-worker.js', {
  workerData: { sharedBuffer }
})

worker.on('message', () => {
  // Worker 修改后，主线程直接能看到（共享内存）
  console.log('共享数组:', Array.from(sharedArray))
  // [1.0, 2.0, 3.0, 4.0]  ← Worker 写入了后两位
})
```

```javascript
// shared-worker.js
const { parentPort, workerData } = require('worker_threads')

const { sharedBuffer } = workerData
const sharedArray = new Float64Array(sharedBuffer)

// 写入共享内存
sharedArray[2] = 3.0
sharedArray[3] = 4.0

// 通知主线程
parentPort.postMessage('done')
```

> **注意**：共享内存需要配合 `Atomics` API 使用来保证原子操作，否则可能产生竞态条件。

---

## 五、worker_threads 线程池

### 5.1 为什么需要线程池

频繁创建/销毁 Worker 有开销，线程池可以复用 Worker，提高性能：

```javascript
const { Worker } = require('worker_threads')
const path = require('path')

class WorkerPool {
  constructor(workerFile, poolSize = 4) {
    this.workerFile = workerFile
    this.poolSize = poolSize
    this.workers = []
    this.freeWorkers = []
    this.queue = []
    this.workerId = 0
    
    for (let i = 0; i < poolSize; i++) {
      this.addWorker()
    }
  }

  addWorker() {
    const worker = new Worker(this.workerFile)
    worker.id = ++this.workerId
    worker.busy = false

    worker.on('message', (result) => {
      worker.busy = false
      this.freeWorkers.push(worker)
      
      if (worker.currentResolve) {
        worker.currentResolve(result)
        worker.currentResolve = null
      }
      
      this.processQueue()
    })

    worker.on('error', (err) => {
      console.error(`Worker ${worker.id} 出错:`, err)
      // 移除并重新创建
      this.workers = this.workers.filter(w => w !== worker)
      this.freeWorkers = this.freeWorkers.filter(w => w !== worker)
      this.addWorker()
    })

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.warn(`Worker ${worker.id} 异常退出，退出码: ${code}`)
      }
    })

    this.workers.push(worker)
    this.freeWorkers.push(worker)
  }

  async run(data) {
    return new Promise((resolve, reject) => {
      const runTask = (worker) => {
        worker.busy = true
        worker.currentResolve = resolve
        worker.currentReject = reject
        worker.postMessage(data)
      }

      if (this.freeWorkers.length > 0) {
        const worker = this.freeWorkers.pop()
        runTask(worker)
      } else {
        this.queue.push({ data, resolve, reject })
      }
    })
  }

  processQueue() {
    while (this.queue.length > 0 && this.freeWorkers.length > 0) {
      const { data, resolve, reject } = this.queue.shift()
      const worker = this.freeWorkers.pop()
      runTask(worker)
      
      function runTask(worker) {
        worker.busy = true
        worker.currentResolve = resolve
        worker.currentReject = reject
        worker.postMessage(data)
      }
    }
  }

  destroy() {
    this.workers.forEach(w => w.terminate())
    this.workers = []
    this.freeWorkers = []
  }
}

module.exports = WorkerPool
```

### 5.2 使用线程池执行并行任务

```javascript
const WorkerPool = require('./worker-pool')

// 创建线程池
const pool = new WorkerPool('./compute-worker.js', 4)

async function parallelCompute() {
  // 8 个计算任务，4 个线程并行
  const tasks = Array(8).fill(0).map((_, i) => ({
    id: i,
    n: 1e8 + i * 1e7
  }))

  const startTime = Date.now()
  
  // 并行执行
  const results = await Promise.all(
    tasks.map(task => pool.run(task))
  )

  console.log(`总耗时: ${Date.now() - startTime}ms`)
  console.log('结果:', results)
  
  pool.destroy()
}

parallelCompute()
```

---

## 六、Agent 系统中的实战应用

### 6.1 用 Worker Threads 并行执行多个 Agent

```javascript
const { Worker } = require('worker_threads')
const path = require('path')

// agent-worker.js 会在子线程中运行
// 每个 Worker 独立调用 LLM，不阻塞主线程

class ParallelAgentRunner {
  constructor(maxWorkers = 4) {
    this.maxWorkers = maxWorkers
  }

  // 并行运行多个 Agent
  async runAgents(agents) {
    const results = await Promise.all(
      agents.map(agentConfig => this.runSingleAgent(agentConfig))
    )
    return results
  }

  runSingleAgent(config) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'agent-worker.js'), {
        workerData: config
      })

      worker.on('message', (result) => resolve(result))
      worker.on('error', reject)
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Agent Worker 退出码: ${code}`))
      })
    })
  }
}

// 使用：并行运行 PM、Coder、Reviewer 三个 Agent
const runner = new ParallelAgentRunner()

const agents = [
  { name: 'PM', role: '分析需求并拆分任务', input: '开发一个待办应用' },
  { name: 'Coder', role: '编写代码', input: '实现核心功能' },
  { name: 'Reviewer', role: '代码审查', input: '检查代码质量' }
]

const results = await runner.runAgents(agents)
// 三个 Agent 并行执行，总耗时约等于最慢的一个
```

### 6.2 用 Worker 处理向量计算（RAG 场景）

RAG 系统中，对大量文档进行向量化计算是 CPU 密集任务：

```javascript
// embedding-worker.js（子线程）
const { parentPort, workerData } = require('worker_threads')
const { pipeline } = require('@xenova/transformers')  // 本地模型

async function generateEmbeddings() {
  const { documents, model } = workerData
  
  // 加载模型（在子线程中，不阻塞主线程）
  const extractor = await pipeline('feature-extraction', model)
  
  const embeddings = []
  for (const doc of documents) {
    const embedding = await extractor(doc, { pooling: 'mean', normalize: true })
    embeddings.push({
      text: doc,
      vector: Array.from(embedding.data)
    })
  }
  
  parentPort.postMessage(embeddings)
}

generateEmbeddings()
```

```javascript
// 主线程
const { Worker } = require('worker_threads')

async function batchEmbeddings(documents, batchSize = 100) {
  // 将文档分块，每块用单独的 Worker 处理
  const batches = []
  for (let i = 0; i < documents.length; i += batchSize) {
    batches.push(documents.slice(i, i + batchSize))
  }

  const results = await Promise.all(
    batches.map(batch => 
      new Promise((resolve, reject) => {
        const worker = new Worker('./embedding-worker.js', {
          workerData: {
            documents: batch,
            model: 'Xenova/all-MiniLM-L6-v2'
          }
        })
        worker.on('message', resolve)
        worker.on('error', reject)
      })
    )
  )

  // 合并结果
  return results.flat()
}

// 使用
const docs = ['文档1内容...', '文档2内容...', /* ... 1000 个文档 */]
const embeddings = await batchEmbeddings(docs)
```

### 6.3 用 child_process 执行代码沙箱

Agent 需要执行用户提交的代码时，用子进程隔离更安全：

```javascript
const { fork } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

class CodeSandbox {
  constructor(options = {}) {
    this.timeout = options.timeout || 10000  // 默认 10 秒超时
    this.memoryLimit = options.memoryLimit || 256  // MB
  }

  async execute(code, input = '') {
    // 1. 将代码写入临时文件
    const tmpFile = path.join(os.tmpdir(), `sandbox-${Date.now()}.js`)
    fs.writeFileSync(tmpFile, code)

    // 2. fork 子进程执行，限制资源和超时
    const child = fork(tmpFile, [], {
      execArgv: [
        `--max-old-space-size=${this.memoryLimit}`,
        '--no-warnings'
      ],
      env: {
        ...process.env,
        SANDBOX_INPUT: input
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => stdout += chunk)
    child.stderr.on('data', (chunk) => stderr += chunk)

    // 超时控制
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      setTimeout(() => {
        if (!child.killed) child.kill('SIGKILL')
      }, 1000)
    }, this.timeout)

    return new Promise((resolve) => {
      child.on('close', (code) => {
        clearTimeout(timer)
        // 清理临时文件
        fs.unlinkSync(tmpFile)

        resolve({
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code,
          timedOut: code === null  // 被 kill 时 code 为 null
        })
      })
    })
  }
}

// 使用
const sandbox = new CodeSandbox({ timeout: 5000 })

const result = await sandbox.execute(`
  const input = process.env.SANDBOX_INPUT
  console.log('输入:', input)
  console.log('计算结果:', input.length * 2)
`, 'Hello Agent')

console.log(result)
// { success: true, stdout: '输入: Hello Agent\n计算结果: 22', ... }
```

### 6.4 混合架构：child_process + worker_threads

在实际 Agent 系统中，可以混合使用两者：

```javascript
// 架构设计：
// 主进程 → Worker Pool（CPU 密集：向量计算、并行 Agent）
//        → child_process（代码执行沙箱、外部命令调用）

class AgentExecutionEngine {
  constructor() {
    // Worker 池：处理 CPU 密集任务
    this.workerPool = new WorkerPool('./agent-worker.js', 4)
    
    // 代码沙箱：隔离执行用户代码
    this.sandbox = new CodeSandbox({ timeout: 10000 })
  }

  async executeAgent(agentConfig) {
    // LLM 推理交给 Worker（CPU + I/O 混合）
    const llmResult = await this.workerPool.run({
      type: 'llm_call',
      config: agentConfig
    })

    // 如果 Agent 需要执行代码，交给子进程（隔离更安全）
    if (llmResult.action === 'execute_code') {
      const codeResult = await this.sandbox.execute(llmResult.code)
      return { ...llmResult, codeExecution: codeResult }
    }

    return llmResult
  }

  // 并行向量化（Worker Threads）
  async vectorizeDocuments(docs) {
    return this.workerPool.run({
      type: 'embed',
      documents: docs
    })
  }

  // 执行外部工具（child_process）
  async runExternalTool(toolName, args) {
    return new Promise((resolve, reject) => {
      const child = fork('./tool-runner.js', [toolName, ...args])
      child.on('message', resolve)
      child.on('error', reject)
    })
  }
}
```

---

## 七、综合实战练习

### 练习 1：对比单线程 vs Worker Threads 计算性能

```javascript
// compare.js - 主线程
const { Worker } = require('worker_threads')

// CPU 密集计算
function heavyCompute(n) {
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += Math.sqrt(i) * Math.sin(i)
  }
  return sum
}

async function main() {
  const N = 5e8
  const parallelTasks = 4

  // 方式一：主线程串行执行
  console.log('--- 主线程串行 ---')
  const start1 = Date.now()
  for (let i = 0; i < parallelTasks; i++) {
    heavyCompute(N)
  }
  console.log(`串行耗时: ${Date.now() - start1}ms`)

  // 方式二：Worker 并行执行
  console.log('--- Worker 并行 ---')
  const start2 = Date.now()
  await Promise.all(
    Array(parallelTasks).fill(0).map(() => 
      new Promise((resolve, reject) => {
        const worker = new Worker('./compute-worker.js', {
          workerData: { n: N }
        })
        worker.on('message', resolve)
        worker.on('error', reject)
      })
    )
  )
  console.log(`并行耗时: ${Date.now() - start2}ms`)
}

main()
```

```javascript
// compute-worker.js
const { parentPort, workerData } = require('worker_threads')

let sum = 0
for (let i = 0; i < workerData.n; i++) {
  sum += Math.sqrt(i) * Math.sin(i)
}
parentPort.postMessage(sum)
```

### 练习 2：实现可取消的 Worker 任务

```javascript
const { Worker } = require('worker_threads')
const { AbortController } = require('abort-controller')

function runCancellableWorker(workerFile, data, signal) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFile, { workerData: data })

    const onAbort = () => {
      worker.terminate()
      reject(new Error('任务被取消'))
    }

    if (signal) {
      if (signal.aborted) {
        onAbort()
        return
      }
      signal.addEventListener('abort', onAbort)
    }

    worker.on('message', (result) => {
      if (signal) signal.removeEventListener('abort', onAbort)
      resolve(result)
    })

    worker.on('error', (err) => {
      if (signal) signal.removeEventListener('abort', onAbort)
      reject(err)
    })
  })
}

// 使用：5 秒后取消
const controller = new AbortController()
setTimeout(() => controller.abort(), 5000)

try {
  const result = await runCancellableWorker(
    './long-running-worker.js',
    { data: '...' },
    controller.signal
  )
  console.log('完成:', result)
} catch (err) {
  console.log('取消或失败:', err.message)
}
```

### 练习 3：用 fork 实现 Agent 任务分发

```javascript
// master.js - 任务分发主进程
const { fork } = require('child_process')

const agents = [
  { name: 'Researcher', task: '搜索 AI Agent 最新进展' },
  { name: 'Writer', task: '撰写技术博客' },
  { name: 'Reviewer', task: '审查文章质量' }
]

// 并行 fork 多个 Agent
const promises = agents.map(agent => {
  return new Promise((resolve, reject) => {
    const child = fork('./agent-fork-worker.js')
    
    child.send({ type: 'execute', agent })
    
    child.on('message', (msg) => {
      if (msg.type === 'done') {
        resolve(msg.result)
        child.kill()
      }
    })
    
    child.on('error', reject)
  })
})

const results = await Promise.all(promises)
console.log('所有 Agent 完成:', results)
```

---

## 八、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| child_process | 创建操作系统子进程，适合外部命令、代码隔离 |
| exec / execFile | 缓冲式执行，有 maxBuffer 限制 |
| spawn | 流式执行，无 maxBuffer 限制 |
| fork | spawn 特例，自带 IPC，适合 Node.js 进程通信 |
| worker_threads | 进程内多线程，共享内存，适合 CPU 密集计算 |
| Worker | 工作线程类 |
| parentPort | 子线程与主线程通信的端口 |
| workerData | 主线程传给子线程的初始数据 |
| MessageChannel | 双向通信通道 |
| SharedArrayBuffer | 多线程共享内存 |
| 进程池/线程池 | 复用进程/线程，减少创建开销 |

### 关键收获

1. **child_process vs worker_threads**：进程隔离强但开销大，线程开销小但隔离弱
2. **exec vs spawn**：exec 缓冲输出有 maxBuffer 限制，spawn 流式无限制
3. **fork 的 IPC**：自带 message 通道，适合 Node.js 进程间结构化通信
4. **Worker 通信**：通过 parentPort.postMessage / on('message') 传递消息
5. **SharedArrayBuffer**：多线程共享内存，大数据场景避免拷贝，需配合 Atomics
6. **线程池/进程池**：复用 Worker/进程，避免频繁创建开销
7. **Agent 架构**：child_process 做代码沙箱，worker_threads 做并行计算

### 与 AI Agent 的关联

child_process 和 worker_threads 在 Agent 开发中的核心应用：

- **代码执行沙箱**：用 child_process 隔离执行用户提交的代码，崩溃不影响主进程
- **并行 Agent 任务**：用 worker_threads 并行运行多个 Agent，突破单线程限制
- **向量计算**：RAG 系统中批量 Embedding 计算交给 Worker，不阻塞 LLM 流式响应
- **外部工具调用**：用 child_process 调用 Python 脚本、系统命令等外部工具
- **混合架构**：主进程调度 → Worker 做 CPU 密集 → child_process 做隔离执行

---

## 九、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| Node.js 中文网 - child_process 子进程 | http://nodejs.cn/api/child_process.html | 官方文档中文版，权威完整（v26） |
| Node.js 中文网 - worker_threads 工作线程 | http://nodejs.cn/api/worker_threads.html | 官方文档中文版，含完整 API |
| 菜鸟教程 - child_process 模块 | https://www.runoob.com/nodejs/nodejs-child_process-module.html | 入门友好，快速上手 |
| 菜鸟教程 - worker_threads 模块 | https://www.runoob.com/nodejs/nodejs-worker_threads-module.html | 入门友好，含示例 |
| 掘金 - child_process 全面指南 | https://juejin.cn/post/7357554457913966627 | 子进程管理与通信详解 |
| CSDN - Worker Threads 实战线程池 | https://blog.csdn.net/qq_34803115/article/details/162695327 | CPU 密集型线程池实战 |

> **提示**：Node.js 中文网（nodejs.cn）的 child_process 和 worker_threads 文档是最权威的中文资源，覆盖所有 API 和高级用法。

---

## 十、明日预告

**Day 9：Node.js HTTP/HTTPS**

- HTTP 服务器与客户端：`http.createServer`、`http.request`
- HTTPS 与 TLS 证书
- 调用 LLM API 的底层基础：HTTP 请求构建、流式响应接收
- Agent API 服务搭建

HTTP 是 Agent 与 LLM 通信的底层协议——每一次 LLM 调用本质上都是一个 HTTP 请求。掌握 Node.js HTTP 模块，是理解后续 OpenAI SDK、LangChain.js 底层网络通信的关键。

---

> 🚀 Day 8 完成！child_process 和 worker_threads 是 Node.js 突破单线程限制的两把利器。掌握它们，你就拥有了构建高性能并行 Agent 系统的能力！
