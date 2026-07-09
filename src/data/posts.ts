import type { Post } from '../types'

export const posts: Post[] = [
  {
    id: '10',
    title: 'AI Agent 学习计划 Day 8：Node.js 子进程与 Worker Threads',
    slug: 'ai-agent-day8-nodejs-child-process-worker-threads',
    date: '2026-07-09',
    tags: ['Node.js', 'AI Agent', '学习笔记'],
    excerpt: 'AI Agent 84 天学习计划第八天。系统学习 Node.js 子进程（child_process）与工作线程（worker_threads）：exec/execFile/spawn/fork 四大 API、进程间 IPC 通信、Worker 创建与消息传递、MessageChannel、SharedArrayBuffer 共享内存、进程池/线程池实现，并落地到 Agent 系统实战（并行多 Agent 执行、向量计算、代码沙箱、混合架构）。',
    readingTime: 32,
    content: `
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

\`\`\`javascript
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
\`\`\`

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

\`\`\`
需要运行外部命令/脚本？     → child_process
需要执行不可信的用户代码？   → child_process（隔离更安全）
需要 CPU 密集型并行计算？   → worker_threads（开销更小）
需要共享大量数据？          → worker_threads（SharedArrayBuffer）
需要跨语言调用（Python等）？ → child_process
\`\`\`

---

## 二、child_process 模块

### 2.1 四个核心 API

\`child_process\` 模块提供四种创建子进程的方法：

| 方法 | 返回值 | 特点 | 适用场景 |
|------|--------|------|---------|
| \`exec\` | ChildProcess + 回调 | 使用 shell 执行命令，有 maxBuffer 限制 | 执行简单命令 |
| \`execFile\` | ChildProcess + 回调 | 不使用 shell，更安全高效 | 执行可执行文件 |
| \`spawn\` | ChildProcess（流式） | 流式返回数据，无 maxBuffer 限制 | 大量数据输出 |
| \`fork\` | ChildProcess | spawn 的特例，专门用于 Node.js 进程，自带 IPC | Node.js 进程间通信 |

### 2.2 exec：执行 shell 命令

\`exec\` 在 shell 中执行命令，将结果缓存在内存中，通过回调返回：

\`\`\`javascript
const { exec } = require('child_process')

// 执行 shell 命令
exec('ls -la /tmp', (error, stdout, stderr) => {
  if (error) {
    console.error(\`执行出错: \${error.message}\`)
    return
  }
  if (stderr) {
    console.error(\`stderr: \${stderr}\`)
    return
  }
  console.log(\`stdout: \${stdout}\`)
})
\`\`\`

**Promise 化写法**（推荐）：

\`\`\`javascript
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
\`\`\`

> **注意**：\`exec\` 默认 maxBuffer 为 1MB，如果输出超过此限制会报错。大量输出请用 \`spawn\`。

### 2.3 execFile：执行可执行文件

\`execFile\` 直接执行可执行文件，不经过 shell，更安全（避免 shell 注入）也更高效：

\`\`\`javascript
const { execFile } = require('child_process')

// 直接执行 node 命令，不经过 shell
execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) throw error
  console.log(\`Node.js 版本: \${stdout.trim()}\`)
})

// 执行 Python 脚本（Agent 场景：调用 Python 工具链）
execFile('python3', ['script.py', '--input', 'data.json'], (error, stdout, stderr) => {
  if (error) {
    console.error('Python 脚本执行失败:', error.message)
    return
  }
  console.log('Python 输出:', stdout)
})
\`\`\`

> **安全提示**：\`execFile\` 不经过 shell，不会对参数做 shell 解析，避免了命令注入风险。处理用户输入时优先使用 \`execFile\`。

### 2.4 spawn：流式创建子进程

\`spawn\` 是最底层的子进程创建方法，返回的数据是流式的，没有 maxBuffer 限制，适合处理大量输出：

\`\`\`javascript
const { spawn } = require('child_process')

// 流式执行：适合大量输出
const child = spawn('find', ['/', '-name', '*.log', '-type', 'f'])

// 逐块接收 stdout
child.stdout.on('data', (chunk) => {
  console.log(\`找到文件: \${chunk.toString().trim()}\`)
})

child.stderr.on('data', (chunk) => {
  console.error(\`错误: \${chunk}\`)
})

child.on('close', (code) => {
  console.log(\`子进程退出，退出码: \${code}\`)
})
\`\`\`

**Agent 场景：流式执行代码并实时输出**

\`\`\`javascript
// 运行用户提交的脚本，实时返回输出
function runScript(scriptPath, args = []) {
  const child = spawn('node', [scriptPath, ...args])

  const output = []
  
  child.stdout.on('data', (chunk) => {
    output.push(chunk)
    // 实时推送给前端
    console.log(\`[stdout] \${chunk.toString()}\`)
  })

  child.stderr.on('data', (chunk) => {
    console.error(\`[stderr] \${chunk.toString()}\`)
  })

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(output).toString())
      } else {
        reject(new Error(\`进程退出码: \${code}\`))
      }
    })
  })
}
\`\`\`

### 2.5 fork：Node.js 进程间通信

\`fork\` 是 \`spawn\` 的特例，专门用于创建 Node.js 子进程，**自带 IPC 通道**，父子进程可以通过 \`send\`/\`on('message')\` 通信：

\`\`\`javascript
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
  console.log(\`子进程退出，退出码: \${code}\`)
})
\`\`\`

\`\`\`javascript
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
  return \`LLM 回复: \${prompt}\`
}
\`\`\`

> **fork 的优势**：IPC 通道是结构化通信（直接传 JS 对象），比解析 stdout 更可靠。适合 Node.js 进程间协作。

---

## 三、child_process 进阶用法

### 3.1 传递环境变量和工作目录

\`\`\`javascript
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
\`\`\`

### 3.2 stdio 配置

\`stdio\` 选项控制子进程的标准输入输出：

\`\`\`javascript
// 三种常用配置
spawn('node', ['script.js'], { stdio: 'inherit' })   // 继承父进程，直接输出到终端
spawn('node', ['script.js'], { stdio: 'pipe' })      // 管道，通过 .stdout.on('data') 获取
spawn('node', ['script.js'], { stdio: 'ignore' })    // 丢弃输出
\`\`\`

### 3.3 超时与终止

\`\`\`javascript
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
        reject(new Error(\`退出码: \${code}\`))
      }
    })
  })
}
\`\`\`

### 3.4 进程池模式

频繁 fork 进程开销大，可以维护一个进程池复用子进程：

\`\`\`javascript
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
      console.log(\`Worker 退出，退出码: \${code}\`)
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
  pool.run({ prompt: \`问题 \${i}\`, model: 'gpt-4' })
)

const results = await Promise.all(tasks)
\`\`\`

---

## 四、worker_threads 模块

### 4.1 核心概念

\`worker_threads\` 模块允许在同一个 Node.js 进程内创建多线程。与 child_process 不同，Worker Threads 运行在**独立的 V8 实例**中，有独立的事件循环，但可以通过 \`MessagePort\` 和 \`SharedArrayBuffer\` 通信。

| 概念 | 说明 |
|------|------|
| \`Worker\` | 代表一个工作线程的类 |
| \`parentPort\` | 子线程中用于与主线程通信的端口 |
| \`workerData\` | 主线程传给子线程的初始数据 |
| \`MessageChannel\` | 双向通信通道（两个 MessagePort） |
| \`MessagePort\` | 单向通信端口 |
| \`SharedArrayBuffer\` | 可被多线程共享的内存 |

### 4.2 基本用法：主线程

\`\`\`javascript
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
  console.log(\`Worker 退出，退出码: \${code}\`)
})

// 主动发送消息给子线程
worker.postMessage({ type: 'additional', data: '额外信息' })
\`\`\`

### 4.3 基本用法：子线程

\`\`\`javascript
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
\`\`\`

### 4.4 使用 Promise 包装 Worker

\`\`\`javascript
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
        reject(new Error(\`Worker 异常退出，退出码: \${code}\`))
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
\`\`\`

### 4.5 MessageChannel：双向通信

当需要主线程和子线程双向通信时，使用 \`MessageChannel\`：

\`\`\`javascript
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
\`\`\`

\`\`\`javascript
// 双向-worker.js
const { parentPort } = require('worker_threads')

parentPort.on('message', ({ port }) => {
  // 通过收到的 port 通信
  port.on('message', (msg) => {
    console.log('子线程收到:', msg)
    port.postMessage('子线程的回复')
  })
})
\`\`\`

### 4.6 SharedArrayBuffer：共享内存

\`SharedArrayBuffer\` 允许多线程共享同一块内存，无需拷贝，适合大数据量场景：

\`\`\`javascript
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
\`\`\`

\`\`\`javascript
// shared-worker.js
const { parentPort, workerData } = require('worker_threads')

const { sharedBuffer } = workerData
const sharedArray = new Float64Array(sharedBuffer)

// 写入共享内存
sharedArray[2] = 3.0
sharedArray[3] = 4.0

// 通知主线程
parentPort.postMessage('done')
\`\`\`

> **注意**：共享内存需要配合 \`Atomics\` API 使用来保证原子操作，否则可能产生竞态条件。

---

## 五、worker_threads 线程池

### 5.1 为什么需要线程池

频繁创建/销毁 Worker 有开销，线程池可以复用 Worker，提高性能：

\`\`\`javascript
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
      console.error(\`Worker \${worker.id} 出错:\`, err)
      // 移除并重新创建
      this.workers = this.workers.filter(w => w !== worker)
      this.freeWorkers = this.freeWorkers.filter(w => w !== worker)
      this.addWorker()
    })

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.warn(\`Worker \${worker.id} 异常退出，退出码: \${code}\`)
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
\`\`\`

### 5.2 使用线程池执行并行任务

\`\`\`javascript
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

  console.log(\`总耗时: \${Date.now() - startTime}ms\`)
  console.log('结果:', results)
  
  pool.destroy()
}

parallelCompute()
\`\`\`

---

## 六、Agent 系统中的实战应用

### 6.1 用 Worker Threads 并行执行多个 Agent

\`\`\`javascript
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
        if (code !== 0) reject(new Error(\`Agent Worker 退出码: \${code}\`))
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
\`\`\`

### 6.2 用 Worker 处理向量计算（RAG 场景）

RAG 系统中，对大量文档进行向量化计算是 CPU 密集任务：

\`\`\`javascript
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
\`\`\`

\`\`\`javascript
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
\`\`\`

### 6.3 用 child_process 执行代码沙箱

Agent 需要执行用户提交的代码时，用子进程隔离更安全：

\`\`\`javascript
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
    const tmpFile = path.join(os.tmpdir(), \`sandbox-\${Date.now()}.js\`)
    fs.writeFileSync(tmpFile, code)

    // 2. fork 子进程执行，限制资源和超时
    const child = fork(tmpFile, [], {
      execArgv: [
        \`--max-old-space-size=\${this.memoryLimit}\`,
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

const result = await sandbox.execute(\`
  const input = process.env.SANDBOX_INPUT
  console.log('输入:', input)
  console.log('计算结果:', input.length * 2)
\`, 'Hello Agent')

console.log(result)
// { success: true, stdout: '输入: Hello Agent\\n计算结果: 22', ... }
\`\`\`

### 6.4 混合架构：child_process + worker_threads

在实际 Agent 系统中，可以混合使用两者：

\`\`\`javascript
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
\`\`\`

---

## 七、综合实战练习

### 练习 1：对比单线程 vs Worker Threads 计算性能

\`\`\`javascript
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
  console.log(\`串行耗时: \${Date.now() - start1}ms\`)

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
  console.log(\`并行耗时: \${Date.now() - start2}ms\`)
}

main()
\`\`\`

\`\`\`javascript
// compute-worker.js
const { parentPort, workerData } = require('worker_threads')

let sum = 0
for (let i = 0; i < workerData.n; i++) {
  sum += Math.sqrt(i) * Math.sin(i)
}
parentPort.postMessage(sum)
\`\`\`

### 练习 2：实现可取消的 Worker 任务

\`\`\`javascript
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
\`\`\`

### 练习 3：用 fork 实现 Agent 任务分发

\`\`\`javascript
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
\`\`\`

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

- HTTP 服务器与客户端：\`http.createServer\`、\`http.request\`
- HTTPS 与 TLS 证书
- 调用 LLM API 的底层基础：HTTP 请求构建、流式响应接收
- Agent API 服务搭建

HTTP 是 Agent 与 LLM 通信的底层协议——每一次 LLM 调用本质上都是一个 HTTP 请求。掌握 Node.js HTTP 模块，是理解后续 OpenAI SDK、LangChain.js 底层网络通信的关键。

---

> 🚀 Day 8 完成！child_process 和 worker_threads 是 Node.js 突破单线程限制的两把利器。掌握它们，你就拥有了构建高性能并行 Agent 系统的能力！

    `.trim(),
  },
  {
    id: '9',
    title: `AI Agent 学习计划 Day 7：Node.js Event Emitter（事件触发器）`,
    slug: 'ai-agent-day7-nodejs-event-emitter',
    date: '2026-07-08',
    tags: ['Node.js', 'AI Agent', '学习笔记'],
    excerpt: `AI Agent 84 天学习计划第七天。系统学习 Node.js Event Emitter：发布-订阅模式、核心 API（on/emit/once/off）、错误事件处理、异步监听器、events.once/events.on Promise 化、内存泄漏防范、自定义 EventEmitter 类，并实现事件驱动的多 Agent 协作系统（事件总线、生命周期事件、松耦合架构）。`,
    readingTime: 30,
    content: `# AI Agent 学习计划 Day 7：Node.js Event Emitter（事件触发器）

> 📅 日期：2026-07-08  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 7 / 84（8.3%）

## 前言

Day 6 我们深入了事件循环（Event Loop），理解了「异步回调何时被执行」。今天进入 Node.js 异步编程的另一半拼图——**Event Emitter（事件触发器）**，解决的是「如何注册和触发事件」。

如果说事件循环是 Node.js 的「心脏」，负责调度异步任务的执行时机；那么 EventEmitter 就是 Node.js 的「神经系统」，负责在模块之间传递信号。Node.js 几乎所有核心模块（\`http\`、\`stream\`、\`fs\`、\`net\`）都继承自 \`EventEmitter\`——\`http.Server\` 在收到请求时触发 \`request\` 事件，\`stream.Readable\` 在有数据可读时触发 \`data\` 事件。

在 AI Agent 开发中，EventEmitter 是构建**事件驱动架构（EDA）**的基石：Agent 的「思考开始」「工具调用」「思考结束」都可以抽象为事件；多个 Agent 之间可以通过事件总线（Event Bus）解耦通信。本文将从 EventEmitter 基础 API 讲起，逐步深入错误处理、异步监听器、内存泄漏防范，最终落地到事件驱动的 Agent 系统设计。

---

## 一、EventEmitter 基础概念

### 1.1 什么是 EventEmitter

\`EventEmitter\` 是 Node.js \`events\` 模块提供的核心类，实现了经典的**发布-订阅模式（Pub/Sub）**：一个对象（发布者）在状态变化时触发事件，其他对象（订阅者）通过注册监听器来响应这些事件。

\`\`\`javascript
const EventEmitter = require('events')

// 创建一个事件触发器实例
const emitter = new EventEmitter()

// 订阅事件：注册监听器
emitter.on('greeting', (name) => {
  console.log(\`你好，\${name}！\`)
})

// 发布事件：触发监听器
emitter.emit('greeting', 'AI Agent')
// 输出：你好，AI Agent！
\`\`\`

### 1.2 核心三要素

| 要素 | 说明 | 对应 API |
|------|------|----------|
| **事件名（Event Name）** | 字符串，标识一个事件 | 任意字符串，但 \`'error'\` 有特殊语义 |
| **监听器（Listener）** | 事件触发时执行的回调函数 | \`on()\` 注册 |
| **触发（Emit）** | 通知所有监听器事件已发生 | \`emit()\` 调用 |

### 1.3 为什么 Node.js 选择事件驱动

Node.js 的设计哲学是「单线程 + 非阻塞 I/O + 事件驱动」。当网络请求到达、文件读取完成、定时器到期时，系统会以「事件」的形式通知 Node.js。EventEmitter 提供了统一的接口来处理这些通知，避免了回调地狱，实现模块间松耦合。

---

## 二、核心 API 详解

### 2.1 on / addListener：注册监听器

\`on\` 是 \`addListener\` 的别名，两者完全等价。监听器按注册顺序依次调用。

\`\`\`javascript
const emitter = new EventEmitter()

emitter.on('event', () => console.log('第一个监听器'))
emitter.on('event', () => console.log('第二个监听器'))
emitter.addListener('event', () => console.log('第三个监听器'))

emitter.emit('event')
// 第一个监听器
// 第二个监听器
// 第三个监听器
\`\`\`

### 2.2 once：只触发一次的监听器

\`once\` 注册的监听器在第一次触发后自动移除，适合「一次性初始化」场景。

\`\`\`javascript
const emitter = new EventEmitter()

let callCount = 0
emitter.once('init', () => {
  callCount++
  console.log(\`初始化执行，第 \${callCount} 次\`)
})

emitter.emit('init')  // 初始化执行，第 1 次
emitter.emit('init')  // （无输出，监听器已被移除）
emitter.emit('init')  // （无输出）
\`\`\`

### 2.3 emit：触发事件

\`emit\` 按注册顺序同步调用所有监听器，返回 \`true\` 表示有监听器被调用，\`false\` 表示该事件没有任何监听器。

\`\`\`javascript
const emitter = new EventEmitter()
emitter.on('data', (chunk) => console.log('收到:', chunk))

console.log(emitter.emit('data', 'hello'))  // true
console.log(emitter.emit('nope'))           // false
\`\`\`

> **关键点**：监听器是**同步执行**的。\`emit()\` 会阻塞，直到所有监听器执行完毕才返回。

### 2.4 off / removeListener：移除监听器

\`off\` 是 \`removeListener\` 的别名。移除时必须传入**同一个函数引用**。

\`\`\`javascript
const emitter = new EventEmitter()

function listener(name) {
  console.log(\`欢迎 \${name}\`)
}

emitter.on('welcome', listener)
emitter.emit('welcome', 'Alice')  // 欢迎 Alice

// ✅ 传入同一个引用才能移除
emitter.off('welcome', listener)
emitter.emit('welcome', 'Bob')    // （无输出）

// ❌ 传入匿名函数无法移除
emitter.on('welcome', () => console.log('匿名'))
// 没有引用，无法 removeListener
\`\`\`

### 2.5 removeAllListeners：移除所有监听器

\`\`\`javascript
const emitter = new EventEmitter()
emitter.on('a', () => console.log('a1'))
emitter.on('a', () => console.log('a2'))
emitter.on('b', () => console.log('b1'))

emitter.removeAllListeners('a')  // 只移除 'a' 事件的所有监听器
emitter.removeAllListeners()      // 移除所有事件的所有监听器（危险！）
\`\`\`

### 2.6 完整 API 速查表

| 方法 | 说明 |
|------|------|
| \`on(event, listener)\` | 注册监听器，每次触发都执行 |
| \`once(event, listener)\` | 注册一次性监听器 |
| \`off(event, listener)\` | 移除指定监听器 |
| \`removeListener(event, listener)\` | \`off\` 的别名 |
| \`removeAllListeners([event])\` | 移除某事件或全部监听器 |
| \`emit(event, ...args)\` | 触发事件，同步调用监听器 |
| \`listeners(event)\` | 返回监听器数组副本 |
| \`rawListeners(event)\` | 返回监听器数组（含 once 包装） |
| \`listenerCount(event)\` | 返回监听器数量 |
| \`setMaxListeners(n)\` | 设置最大监听器数（默认 10） |
| \`getMaxListeners()\` | 获取最大监听器数 |
| \`prependListener(event, listener)\` | 在最前面插入监听器 |
| \`prependOnceListener(event, listener)\` | 在最前面插入一次性监听器 |

---

## 三、this 指向与箭头函数

### 3.1 普通函数：this 指向 emitter 实例

\`\`\`javascript
const emitter = new EventEmitter()

emitter.on('event', function () {
  console.log(this === emitter)  // true
})
emitter.emit('event')
\`\`\`

### 3.2 箭头函数：this 继承自外层作用域

\`\`\`javascript
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
      console.log(\`\${this.name} 收到任务\`)
    })
  }
}

const agent = new Agent()
emitter.emit('task')  // Agent-1 收到任务
\`\`\`

> **最佳实践**：当监听器需要访问 \`emitter\` 实例时用普通函数；当需要访问外层 \`this\`（如类实例）时用箭头函数。

---

## 四、错误事件处理

### 4.1 error 事件的特殊性

当 \`emit('error')\` 触发时，如果没有注册 \`'error'\` 监听器，Node.js 会认为这是未捕获的错误，**直接抛出并崩溃进程**。

\`\`\`javascript
const emitter = new EventEmitter()

// ❌ 没有注册 error 监听器
emitter.emit('error', new Error('出错了'))
// 抛出：Error:出错了
// 进程崩溃！
\`\`\`

### 4.2 正确的错误处理

\`\`\`javascript
const emitter = new EventEmitter()

// ✅ 注册 error 监听器
emitter.on('error', (err) => {
  console.error('捕获到错误:', err.message)
})

emitter.emit('error', new Error('出错了'))
// 捕获到错误: 出错了
// 进程不崩溃
\`\`\`

### 4.3 全局兜底：captureRejections

当监听器是 \`async\` 函数时，如果它抛出错误或返回 rejected Promise，默认行为是触发 \`error\` 事件。开启 \`captureRejections\` 选项可自动处理：

\`\`\`javascript
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
\`\`\`

---

## 五、异步监听器与 await emit

### 5.1 emit 是同步的

\`emit()\` 不会等待 \`async\` 监听器完成：

\`\`\`javascript
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
\`\`\`

### 5.2 events.once：Promise 化等待事件

\`events.once(emitter, event)\` 返回一个 Promise，在事件首次触发时 resolve：

\`\`\`javascript
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
\`\`\`

### 5.3 events.on：异步迭代事件流

\`events.on(emitter, event)\` 返回一个 AsyncIterator，可以用 \`for await...of\` 持续消费事件：

\`\`\`javascript
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
\`\`\`

> 这个模式非常适合处理 LLM 的流式消息：每收到一个 token 就 emit 一个 \`message\` 事件，消费者用 \`for await...of\` 逐条处理。

---

## 六、监听器数量与内存泄漏防范

### 6.1 最大监听器警告

默认情况下，单个事件最多允许 10 个监听器。超过时会打印警告：

\`\`\`
MaxListenersExceededWarning: Possible EventEmitter memory leak detected.
11 event listeners added. Use emitter.setMaxListeners() to increase limit.
\`\`\`

这通常是**内存泄漏**的信号——在循环中反复 \`on()\` 却忘了 \`off()\`。

### 6.2 设置最大监听器

\`\`\`javascript
const emitter = new EventEmitter()

// 方法一：实例级别
emitter.setMaxListeners(20)

// 方法二：全局级别
EventEmitter.defaultMaxListeners = 20

console.log(emitter.getMaxListeners())  // 20
\`\`\`

### 6.3 内存泄漏的常见场景

\`\`\`javascript
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
\`\`\`

---

## 七、自定义 EventEmitter 类

### 7.1 继承 EventEmitter

Node.js 的最佳实践是「继承而非组合」——让你的类直接继承 EventEmitter，这样实例既能触发事件，又能调用业务方法。

\`\`\`javascript
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
    const result = \`对「\${task}」的分析结果\`

    this.emit('think:end', { task, result })
    this.state = 'idle'
    return result
  }
}

// 使用
const agent = new Agent('Coder-Agent')

agent.on('think:start', ({ task, agent }) => {
  console.log(\`[\${agent}] 开始思考: \${task}\`)
})

agent.on('think:end', ({ task, result }) => {
  console.log(\`思考完成: \${result}\`)
})

await agent.think('优化这段代码')
// [Coder-Agent] 开始思考: 优化这段代码
// （500ms 后）思考完成: 对「优化这段代码」的分析结果
\`\`\`

### 7.2 事件命名规范

| 命名风格 | 示例 | 说明 |
|----------|------|------|
| \`命名空间:动作\` | \`tool:call\`、\`tool:result\` | 推荐分组，避免冲突 |
| \`状态:变化\` | \`state:change\`、\`state:idle\` | 适合生命周期事件 |
| \`错误\` | \`error\` | 固定名称，有特殊语义 |

---

## 八、事件驱动的 Agent 系统设计

### 8.1 事件总线（Event Bus）实现

多个 Agent 之间通过事件总线解耦通信，是事件驱动架构的核心模式：

\`\`\`javascript
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
    console.log(\`[PM] 收到需求: \${req}\`)
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
    console.log(\`[Coder] 开始编码: \${task}\`)
    await new Promise(r => setTimeout(r, 300))
    const code = \`// \${task} 的代码\`
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
    console.log(\`[Reviewer] 审查代码: \${code.slice(0, 30)}...\`)
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
\`\`\`

### 8.2 Agent 生命周期事件

一个完整的 Agent 运行周期可以用事件来建模：

\`\`\`javascript
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
  console.log(\`▶ Agent 启动，输入: \${input}\`)
})

runner.on('decide:end', ({ action }) => {
  console.log(\`🧠 决策完成: 将执行 \${action.name}\`)
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
\`\`\`

### 8.3 事件驱动 vs 直接调用对比

\`\`\`javascript
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
\`\`\`

---

## 九、综合实战练习

### 练习 1：手写迷你 EventEmitter

\`\`\`javascript
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
\`\`\`

### 练习 2：LLM 流式响应事件化

\`\`\`javascript
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
  console.log(\`\\n[完成，共 \${totalTokens} 个 token]\`)
})

// 消费流
for await (const token of streamer.stream('你好')) {
  // token 已通过事件输出
}
// 你好，我是AI
// [完成，共 6 个 token]
\`\`\`

### 练习 3：带超时和取消的事件等待

\`\`\`javascript
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
      throw new Error(\`等待事件「\${event}」被取消或超时\`)
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
\`\`\`

---

## 十、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| EventEmitter | 发布-订阅模式的核心类，所有事件对象的基类 |
| \`on\` / \`emit\` | 注册监听器 / 触发事件（同步执行） |
| \`once\` | 一次性监听器，触发后自动移除 |
| \`off\` | 移除监听器，需传入同一函数引用 |
| \`error\` 事件 | 未注册监听器时触发会崩溃进程 |
| \`captureRejections\` | 自动捕获 async 监听器的 rejection |
| \`events.once\` | Promise 化等待单次事件 |
| \`events.on\` | 异步迭代消费事件流 |
| 最大监听器 | 默认 10，超过警告，可能内存泄漏 |
| 事件总线 | 多 Agent 通过共享 EventEmitter 解耦通信 |

### 关键收获

1. **发布-订阅模式**：EventEmitter 是 Node.js 事件驱动的核心，实现了发布者与订阅者的解耦
2. **同步执行**：\`emit()\` 同步调用所有监听器，async 监听器不会被 await
3. **错误必须处理**：\`error\` 事件无监听器时进程崩溃，始终注册 error 监听器
4. **内存泄漏防范**：超过 10 个监听器会警告，循环中 on() 必须 off() 或用 once()
5. **this 指向**：普通函数 this 指向 emitter，箭头函数继承外层作用域
6. **Promise 化**：\`events.once\` 等待事件、\`events.on\` 异步迭代事件流
7. **事件驱动架构**：Agent 之间通过事件总线松耦合通信，易扩展

### 与 AI Agent 的关联

EventEmitter 在 Agent 开发中的核心应用：

- **Agent 生命周期**：\`think:start\`、\`tool:call\`、\`think:end\` 等事件驱动 UI 更新和日志记录
- **多 Agent 协作**：事件总线实现 PM→Coder→Reviewer 链式协作，松耦合易扩展
- **LLM 流式响应**：每个 token 触发 \`token\` 事件，前端逐字渲染
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

- \`child_process\` 模块：\`exec\`、\`execFile\`、\`spawn\`、\`fork\`
- \`worker_threads\` 模块：真正的多线程并行
- 并行执行多 Agent 任务
- CPU 密集任务（向量计算）不阻塞主线程

Worker Threads 是 Node.js 突破单线程限制的关键，在 Agent 系统中用于并行执行多个 Agent 任务、处理向量计算等 CPU 密集场景。掌握它，你就拥有了构建高性能多 Agent 系统的能力。

---

> 🚀 Day 7 完成！EventEmitter 是 Node.js 事件驱动架构的灵魂，掌握它你就掌握了构建松耦合、可扩展 Agent 系统的核心技能。明天我们将用 Worker Threads 突破单线程限制！
`
  },
  {
    id: '7',
    title: `AI Agent 学习计划 Day 5：Node.js Stream 与 Buffer`,
    slug: 'ai-agent-day5-nodejs-stream-buffer',
    date: '2026-07-06',
    tags: ['Node.js', 'AI Agent', '学习笔记'],
    excerpt: `AI Agent 84 天学习计划第五天。系统学习 Node.js Stream 与 Buffer：四种流类型、背压机制、pipeline 现代写法、Promise API，并实现完整的 LLM 流式响应管道。`,
    readingTime: 30,
    content: `
# AI Agent 学习计划 Day 5：Node.js Stream 与 Buffer

> 📅 日期：2026-07-06  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 5 / 84（6.0%）

## 前言

前四天我们打好了 TypeScript 语言基础（类型系统、装饰器、async/await、模块系统）。从今天起进入 Node.js 核心能力的学习，第一个主题是 **Stream（流）与 Buffer（缓冲区）**。

为什么这个主题如此重要？因为在 AI Agent 开发中，**LLM 的流式响应（Streaming）几乎是一切交互的基础**。当 ChatGPT 逐字吐出回答时，后端正在用 Stream 逐块接收 OpenAI API 返回的 SSE 数据，再逐块转发给前端。掌握 Stream 与 Buffer，是理解后续 Vercel AI SDK \`streamText\`、LangChain.js 流式输出的前提。

本文将从 Buffer 基础讲起，覆盖 Stream 四大类型、背压机制、Promise API，最终落地到 LLM 流式响应的实战实现。

---

## 一、Buffer：二进制数据的容器

### 1.1 什么是 Buffer

Buffer 是 Node.js 中用于处理二进制数据的核心类，它是 \`Uint8Array\` 的子类。在 Node.js 中，凡是涉及文件读写、网络数据传输、加密计算的场景，都离不开 Buffer。

\`\`\`javascript
const buf = Buffer.from('Hello, AI Agent!', 'utf8')
console.log(buf)
// <Buffer 48 65 6c 6c 6f 2c 20 41 49 20 41 67 65 6e 74 21>
console.log(buf.length)  // 16
console.log(buf.toString('utf8'))  // Hello, Agent!
console.log(buf.toString('base64'))  // SGVsbG8sIEFJIEFnZW50IQ==
\`\`\`

### 1.2 创建 Buffer 的三种方式

\`\`\`javascript
// 1. Buffer.alloc(size[, fill]) —— 分配指定大小的 Buffer，默认用 0 填充（安全）
const safe = Buffer.alloc(10)
// <Buffer 00 00 00 00 00 00 00 00 00 00>

// 2. Buffer.allocUnsafe(size) —— 分配但不初始化（更快但可能含旧数据，不安全）
const unsafe = Buffer.allocUnsafe(10)
// <Buffer 可能是任意值>

// 3. Buffer.from(array | string | buffer) —— 从已有数据创建
const fromStr = Buffer.from('LLM Streaming', 'utf8')
const fromArr = Buffer.from([0x48, 0x49])  // "HI"
\`\`\`

> **安全提示**：\`allocUnsafe\` 不会清零内存，可能残留敏感数据。除非你有明确的性能需求且会立即填充数据，否则始终用 \`alloc\`。

### 1.3 字符编码

Buffer 支持多种编码格式，在 LLM 开发中最常用的是 \`utf8\` 和 \`base64\`：

\`\`\`javascript
const text = '你好，世界'

// UTF-8：每个中文字符占 3 字节
const utf8Buf = Buffer.from(text, 'utf8')
console.log(utf8Buf.length)  // 15（5 个字符 × 3 字节）

// Base64：编码后的字符串
const base64Str = utf8Buf.toString('base64')
console.log(base64Str)  // 5L2g5aW977yM5LiW55WM

// Hex：十六进制表示
const hexStr = utf8Buf.toString('hex')
console.log(hexStr)  // e4bda0e5a5bd...
\`\`\`

### 1.4 Buffer 常用方法

\`\`\`javascript
// concat：拼接多个 Buffer（处理分片数据的核心方法）
const chunk1 = Buffer.from('data: {"token": "Hel')
const chunk2 = Buffer.from('lo"}\\n\\n')
const full = Buffer.concat([chunk1, chunk2])
console.log(full.toString())  // data: {"token": "Hello"}\\n\\n

// slice / subarray：截取子 Buffer
const sub = full.subarray(6)  // 跳过 "data: "
console.log(sub.toString())   // {"token": "Hello"}\\n\\n

// compare：比较两个 Buffer
const a = Buffer.from('abc')
const b = Buffer.from('abd')
console.log(Buffer.compare(a, b))  // -1（a < b）

// isBuffer：类型判断
console.log(Buffer.isBuffer(a))  // true
\`\`\`

### 1.5 Agent 场景：拼接 LLM 分片响应

LLM 流式响应返回的是一个个 chunk，每个 chunk 可能是不完整的 JSON。你需要用 \`Buffer.concat\` 来安全拼接：

\`\`\`javascript
const chunks = []

stream.on('data', (chunk) => {
  chunks.push(chunk)
})

stream.on('end', () => {
  // 安全拼接所有分片，避免字符串拼接的编码问题
  const fullData = Buffer.concat(chunks).toString('utf8')
  const response = JSON.parse(fullData)
  console.log(response.choices[0].message.content)
})
\`\`\`

---

## 二、Stream 四大类型

Stream 是 Node.js 中处理流式数据的抽象接口。与一次性读取整个文件到内存不同，Stream 逐块（chunk）处理数据，内存占用恒定，特别适合处理大文件和网络流。

### 2.1 四种基本流类型

| 类型 | 方向 | 典型示例 | 说明 |
|------|------|---------|------|
| **Readable** | 只读 | \`fs.createReadStream()\`、HTTP 请求体 | 数据的来源 |
| **Writable** | 只写 | \`fs.createWriteStream()\`、\`process.stdout\`、HTTP 响应体 | 数据的去向 |
| **Duplex** | 可读+可写 | \`net.Socket\` | 双向通道，读写独立 |
| **Transform** | 读入→变换→写出 | \`zlib.createGzip()\` | 在读写之间做转换 |

### 2.2 Readable Stream（可读流）

\`\`\`javascript
const fs = require('node:fs')

const readable = fs.createReadStream('./large-file.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024  // 每次读取 64KB
})

// 两种读取模式
// 模式一：暂停模式（默认）—— 需要手动 read()
readable.on('readable', () => {
  let chunk
  while ((chunk = readable.read()) !== null) {
    console.log(\`读取到 \${chunk.length} 字符\`)
  }
})

// 模式二：流动模式 —— 自动推送数据
readable.on('data', (chunk) => {
  console.log(\`接收到: \${chunk.length} 字符\`)
})

readable.on('end', () => {
  console.log('读取完成')
})

readable.on('error', (err) => {
  console.error('出错了:', err)
})
\`\`\`

### 2.3 Writable Stream（可写流）

\`\`\`javascript
const fs = require('node:fs')

const writable = fs.createWriteStream('./output.txt')

writable.write('第一行数据\\n')
writable.write('第二行数据\\n')
writable.end('最后一行\\n')  // end() 后不能再 write()

writable.on('finish', () => {
  console.log('写入完成')
})

writable.on('error', (err) => {
  console.error('写入出错:', err)
})
\`\`\`

### 2.4 Duplex Stream（双工流）

双工流同时可读可写，且读写互不影响（两个独立的缓冲区）：

\`\`\`javascript
const { Duplex } = require('node:stream')

// 自定义双工流：读端发送随机数据，写端转为大写
const myDuplex = new Duplex({
  write(chunk, encoding, callback) {
    console.log('写入:', chunk.toString().toUpperCase())
    callback()
  },
  read(size) {
    this.push(\`随机数据 \${Math.random().toFixed(2)}\\n\`)
    if (Math.random() > 0.8) this.push(null)  // 停止读取
  }
})
\`\`\`

### 2.5 Transform Stream（转换流）⭐ 重点

Transform 流是 Duplex 的特例——**写入的数据经过变换后从读端输出**。这是处理 LLM 流式响应的核心工具。

\`\`\`javascript
const { Transform } = require('node:stream')

// 自定义 Transform：将文本转为大写
const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    // chunk 是输入数据，push 是输出数据
    this.push(chunk.toString().toUpperCase())
    callback()
  }
})

// 配合 pipe 使用
process.stdin.pipe(upperCase).pipe(process.stdout)
// 输入 "hello" → 输出 "HELLO"
\`\`\`

---

## 三、pipe 与 pipeline

### 3.1 pipe()：基础管道

\`pipe()\` 将可读流连接到可写流，数据自动流动：

\`\`\`javascript
const fs = require('node:fs')
const zlib = require('node:zlib')

// 经典管道：读取文件 → Gzip 压缩 → 写入文件
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'))
\`\`\`

> **pipe() 的缺陷**：如果某个环节出错，pipe 不会自动销毁其他流，可能导致内存泄漏和资源未释放。

### 3.2 pipeline()：现代推荐写法 ⭐

\`pipeline()\` 自动处理错误传播和资源清理，是现代 Node.js 的推荐方式：

\`\`\`javascript
const { pipeline } = require('node:stream')
const fs = require('node:fs')
const zlib = require('node:zlib')

// 回调写法
pipeline(
  fs.createReadStream('input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('input.txt.gz'),
  (err) => {
    if (err) {
      console.error('管道失败:', err)
    } else {
      console.log('管道成功完成')
    }
  }
)
\`\`\`

### 3.3 Stream Promise API

\`stream/promises\` 模块提供了返回 Promise 的 \`pipeline\` 和 \`finished\`，可以配合 async/await 使用：

\`\`\`javascript
const { pipeline } = require('node:stream/promises')
const { createReadStream, createWriteStream } = require('node:fs')
const { createGzip } = require('node:zlib')

async function compressFile(input, output) {
  await pipeline(
    createReadStream(input),
    createGzip(),
    createWriteStream(output)
  )
  console.log('压缩完成！')
}

compressFile('input.txt', 'input.txt.gz').catch(console.error)
\`\`\`

### 3.4 pipeline + AbortSignal：可取消的流

\`\`\`javascript
const { pipeline } = require('node:stream/promises')
const controller = new AbortController()

// 5 秒后取消
setTimeout(() => controller.abort(), 5000)

await pipeline(
  fetch('https://api.openai.com/v1/...', { signal: controller.signal }),
  async function* (source) {
    for await (const chunk of source) {
      yield chunk
    }
  },
  process.stdout,
  { signal: controller.signal }
)
\`\`\`

---

## 四、背压机制（Backpressure）

### 4.1 什么是背压

当数据生产速度 > 消费速度时，数据会在内存中堆积。**背压**就是流用来应对这种情况的机制。

- 可读流有一个 \`highWaterMark\`（水位线），默认 64KB
- 当缓冲区数据超过水位线，流会暂停读取，触发 \`pause\`
- 当消费端消化完数据，缓冲区降到水位线以下，触发 \`drain\` 事件恢复流动

### 4.2 背压实战演示

\`\`\`javascript
const { Readable, Writable } = require('node:stream')

// 高速可读流：每毫秒产出一个数据
const fastReadable = new Readable({
  highWaterMark: 10,  // 水位线设小一点，更容易触发背压
  read() {
    this.push(\`data-\${Date.now()}\\n\`)
  }
})

// 慢速可写流：每 100ms 消费一个数据
const slowWritable = new Writable({
  write(chunk, encoding, callback) {
    setTimeout(() => {
      console.log('消费:', chunk.toString().trim())
      callback()
    }, 100)
  }
})

// 用 pipe 自动处理背压
fastReadable.pipe(slowWritable)

// 如果手动 write，必须检查返回值
// const canContinue = writable.write(chunk)
// if (!canContinue) {
//   readable.pause()  // 暂停读取
//   writable.once('drain', () => {
//     readable.resume()  // 恢复读取
//   })
// }
\`\`\`

### 4.3 Agent 中的背压场景

\`\`\`javascript
// LLM 产出速度 > 前端消费速度时的背压处理
const llmStream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: '写一篇长文' }],
  stream: true
})

const responseTransform = new Transform({
  transform(chunk, encoding, callback) {
    // 解析 SSE 数据
    const lines = chunk.toString().split('\\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          this.push(null)
          return
        }
        const json = JSON.parse(data)
        const token = json.choices[0]?.delta?.content || ''
        if (token) {
          // push 返回 false 表示背压，pipeline 会自动暂停上游
          this.push(token)
        }
      }
    }
    callback()
  }
})

// pipeline 自动处理背压，无需手动 pause/resume
await pipeline(
  llmStream,
  responseTransform,
  httpResponse  // 慢速的 HTTP 响应
)
\`\`\`

---

## 五、实战：模拟 LLM 流式响应

### 5.1 完整的 SSE 流式响应管道

下面用学过的知识实现一个完整的 LLM 流式响应模拟：

\`\`\`javascript
const { Readable, Transform, pipeline } = require('node:stream')
const http = require('node:http')

// 1. 模拟 LLM 逐字产出
function createLLMStream(text) {
  const tokens = text.split('')  // 逐字拆分
  let index = 0

  return new Readable({
    read() {
      if (index < tokens.length) {
        const token = tokens[index++]
        // 用 SSE 格式包装
        const sseData = \`data: \${JSON.stringify({
          choices: [{ delta: { content: token } }]
        })}\\n\\n\`
        this.push(sseData)
        // 模拟 LLM 产出延迟
        setTimeout(() => {}, 20)
      } else {
        this.push('data: [DONE]\\n\\n')
        this.push(null)
      }
    }
  })
}

// 2. Transform：解析 SSE，提取纯文本
function createSSEParser() {
  let buffer = ''  // 缓存不完整的行

  return new Transform({
    transform(chunk, encoding, callback) {
      buffer += chunk.toString()

      const lines = buffer.split('\\n')
      buffer = lines.pop()  // 最后一段可能不完整，保留

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            const token = json.choices[0]?.delta?.content || ''
            if (token) {
              this.push(token)
            }
          } catch (e) {
            // JSON 解析失败，忽略
          }
        }
      }
      callback()
    },
    flush(callback) {
      // 处理剩余 buffer
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6).trim()
        if (data && data !== '[DONE]') {
          try {
            const json = JSON.parse(data)
            const token = json.choices[0]?.delta?.content || ''
            if (token) this.push(token)
          } catch (e) {}
        }
      }
      callback()
    }
  })
}

// 3. HTTP 服务器：完整管道
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  const llmStream = createLLMStream('Hello! I am an AI Agent. How can I help you today?')

  pipeline(
    llmStream,
    createSSEParser(),
    res,
    (err) => {
      if (err) {
        console.error('管道错误:', err)
      }
      console.log('响应流结束')
    }
  )
})

server.listen(3000, () => {
  console.log('流式响应服务器运行在 http://localhost:3000')
})
\`\`\`

### 5.2 使用客户端测试

\`\`\`html
<!DOCTYPE html>
<html>
<body>
  <div id="output"></div>
  <script>
    const eventSource = new EventSource('http://localhost:3000')
    let fullText = ''
    
    eventSource.onmessage = (event) => {
      fullText += event.data
      document.getElementById('output').textContent = fullText
    }
    
    eventSource.onerror = () => {
      eventSource.close()
      console.log('连接关闭')
    }
  </script>
</body>
</html>
\`\`\`

---

## 六、与 async/await 的结合

### 6.1 async iteration of streams

Node.js 的可读流实现了 \`AsyncIterable\` 协议，可以用 \`for await...of\` 遍历：

\`\`\`javascript
const { createReadStream } = require('node:fs')

async function processFile() {
  const stream = createReadStream('large-file.txt', { encoding: 'utf8' })

  for await (const chunk of stream) {
    console.log(\`处理 \${chunk.length} 字符\`)
    // 在这里做处理...
  }
  
  console.log('文件处理完成')
}

processFile()
\`\`\`

### 6.2 在 pipeline 中使用 async generator

\`\`\`javascript
const { pipeline } = require('node:stream/promises')
const { createReadStream, createWriteStream } = require('node:fs')

async function run() {
  await pipeline(
    createReadStream('input.txt'),
    // async generator 作为 Transform
    async function* (source, { signal }) {
      for await (const chunk of source) {
        // 对每个 chunk 做处理
        const processed = chunk.toString().toUpperCase()
        yield processed
      }
    },
    createWriteStream('output.txt')
  )
}

run()
\`\`\`

### 6.3 调用 LLM API 的现代写法

\`\`\`javascript
const { OpenAI } = require('openai')
const { pipeline } = require('node:stream/promises')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function streamChat(prompt, writable) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    stream: true
  })

  // 用 async generator 解析流
  await pipeline(
    stream,
    async function* (source) {
      for await (const chunk of source) {
        const token = chunk.choices[0]?.delta?.content
        if (token) yield token
      }
    },
    writable
  )
}

// 使用：流式输出到终端
await streamChat('用 100 字介绍 AI Agent', process.stdout)
\`\`\`

---

## 七、综合实战练习

### 练习 1：实现可背压控制的 LLM 文本处理器

\`\`\`javascript
const { Readable, Transform, Writable, pipeline } = require('node:stream')

// 1. 可读流：模拟 LLM 逐字产出
class LLMReadable extends Readable {
  constructor(text, options) {
    super(options)
    this.tokens = text.split('')
    this.index = 0
  }
  
  _read() {
    if (this.index < this.tokens.length) {
      const token = this.tokens[this.index++]
      this.push(Buffer.from(token, 'utf8'))
    } else {
      this.push(null)
    }
  }
}

// 2. Transform：统计 token 数量
class TokenCounter extends Transform {
  constructor(options) {
    super(options)
    this.count = 0
  }
  
  _transform(chunk, encoding, callback) {
    this.count++
    this.push(chunk)  // 透传数据
    callback()
  }
  
  _flush(callback) {
    this.push(\`\\n\\n--- 总计 \${this.count} 个 token ---\`)
    callback()
  }
}

// 3. 可写流：带延迟的输出（模拟慢速客户端）
class SlowWritable extends Writable {
  _write(chunk, encoding, callback) {
    process.stdout.write(chunk)
    setTimeout(callback, 50)  // 50ms 延迟
  }
}

// 完整管道
const text = 'Stream 是 Node.js 处理流式数据的核心，LLM 流式响应依赖它。'
pipeline(
  new LLMReadable(text, { highWaterMark: 5 }),
  new TokenCounter(),
  new SlowWritable(),
  (err) => {
    if (err) console.error('管道失败:', err)
    else console.log('\\n管道成功完成')
  }
)
\`\`\`

### 练习 2：实现文件分块读取并逐块处理

\`\`\`javascript
const { createReadStream } = require('node:fs')
const { createInterface } = require('node:readline')

async function processLargeFile(filePath) {
  const fileStream = createReadStream(filePath, { encoding: 'utf8' })
  
  // 用 readline 逐行处理（底层也是 Stream）
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  
  let lineCount = 0
  let wordCount = 0
  
  for await (const line of rl) {
    lineCount++
    wordCount += line.split(/\\s+/).filter(Boolean).length
  }
  
  console.log(\`总行数: \${lineCount}, 总词数: \${wordCount}\`)
}

processLargeFile('large-file.txt')
\`\`\`

---

## 八、学习总结

| 概念 | 核心 | 典型场景 |
|------|------|---------|
| Buffer | 二进制数据容器 | 拼接分片、编码转换 |
| Readable | 数据来源 | 读取文件、接收 HTTP 响应 |
| Writable | 数据去向 | 写入文件、发送 HTTP 响应 |
| Duplex | 双向通道 | WebSocket、TCP Socket |
| Transform | 读写转换 | SSE 解析、数据格式转换 |
| pipeline | 管道编排 | 多步骤数据处理流程 |
| 背压 | 流量控制 | 生产速度 > 消费速度 |

### 关键收获

1. **Buffer** 是处理二进制数据的基础，\`Buffer.concat()\` 是拼接 LLM 分片响应的安全方式
2. **Stream 四大类型**中，**Transform 流**是处理 LLM 流式响应的核心——解析 SSE、提取 token
3. **pipeline()** 是现代推荐写法，自动处理错误传播和资源清理，配合 \`stream/promises\` 可用 async/await
4. **背压机制**通过 \`highWaterMark\` 和 \`drain\` 事件自动调节流速，用 pipeline 则无需手动处理
5. **async iteration** 让流可以用 \`for await...of\` 遍历，代码更简洁

### 与 AI Agent 的关联

Stream 与 Buffer 在 Agent 开发中的关键应用：

- **LLM 流式响应**：OpenAI、Anthropic 等 API 返回 SSE 格式的流，需要用 Readable + Transform 解析
- **前端流式渲染**：Vercel AI SDK 的 \`streamText\`、\`useChat\` 底层就是 Stream
- **大文件处理**：RAG 系统中加载大文档时，用 Stream 避免内存溢出
- **多 Agent 管道**：多个 Agent 的输出可以用 pipeline 串联，前一个的输出作为后一个的输入
- **实时数据流**：Agent 监听事件流、日志流时，Stream 是天然的抽象

---

## 九、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| Node.js 中文网 - Stream 流文档 | http://nodejs.cn/api/stream.html | 官方 Stream 中文文档，内容完整 |
| Node.js 中文网 - Buffer 缓冲区文档 | http://nodejs.cn/api/buffer.html | 官方 Buffer 中文文档 |
| Node.js 中文网 - Stream Promise API | http://nodejs.cn/api/stream.html#streams-promise-api | pipeline/finished Promise 版 |
| 掘金 - 流式响应 Node.js + Express 实战 | https://juejin.cn/post/7373808202868129844 | 流式响应完整实战示例 |
| CSDN - NodeJS 教程：Buffer 与 Stream 流 | https://blog.csdn.net/qq_38060125/article/details/149841932 | 含面试题与背压机制解析 |
| Node.js 中文网 - 事件循环与异步 | http://nodejs.cn/learn/asynchronous-work/event-loop-timers-and-nexttick | 理解异步调度 |

> **提示**：官方英文站点 nodejs.org 在国内可能访问不稳定，建议优先使用 nodejs.cn 中文镜像站。

---

## 十、明日预告

**Day 6：Node.js Event Loop**

- 事件循环的各阶段：timers、pending callbacks、idle/prepare、poll、check、close callbacks
- 微任务 vs 宏任务：\`process.nextTick\`、\`Promise.then\`、\`setTimeout\`、\`setImmediate\` 的执行顺序
- 并发控制：理解异步调度，避免阻塞事件循环
- Agent 并发：多个工具并行调用时的调度原理

事件循环是 Node.js 异步模型的心脏。理解它，你才能真正掌握 Agent 并发任务调度的底层逻辑。

---

> 🌊 Day 5 完成！Stream 是数据流动的高速公路，Buffer 是路上的集装箱。掌握它们，LLM 流式响应就不再是黑魔法。

    `.trim(),
  },

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
