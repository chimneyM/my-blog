# AI Agent 学习计划 Day 5：Node.js Stream 与 Buffer

> 📅 日期：2026-07-06  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 5 / 84（6.0%）

## 前言

前四天我们打好了 TypeScript 语言基础（类型系统、装饰器、async/await、模块系统）。从今天起进入 Node.js 核心能力的学习，第一个主题是 **Stream（流）与 Buffer（缓冲区）**。

为什么这个主题如此重要？因为在 AI Agent 开发中，**LLM 的流式响应（Streaming）几乎是一切交互的基础**。当 ChatGPT 逐字吐出回答时，后端正在用 Stream 逐块接收 OpenAI API 返回的 SSE 数据，再逐块转发给前端。掌握 Stream 与 Buffer，是理解后续 Vercel AI SDK `streamText`、LangChain.js 流式输出的前提。

本文将从 Buffer 基础讲起，覆盖 Stream 四大类型、背压机制、Promise API，最终落地到 LLM 流式响应的实战实现。

---

## 一、Buffer：二进制数据的容器

### 1.1 什么是 Buffer

Buffer 是 Node.js 中用于处理二进制数据的核心类，它是 `Uint8Array` 的子类。在 Node.js 中，凡是涉及文件读写、网络数据传输、加密计算的场景，都离不开 Buffer。

```javascript
const buf = Buffer.from('Hello, AI Agent!', 'utf8')
console.log(buf)
// <Buffer 48 65 6c 6c 6f 2c 20 41 49 20 41 67 65 6e 74 21>
console.log(buf.length)  // 16
console.log(buf.toString('utf8'))  // Hello, Agent!
console.log(buf.toString('base64'))  // SGVsbG8sIEFJIEFnZW50IQ==
```

### 1.2 创建 Buffer 的三种方式

```javascript
// 1. Buffer.alloc(size[, fill]) —— 分配指定大小的 Buffer，默认用 0 填充（安全）
const safe = Buffer.alloc(10)
// <Buffer 00 00 00 00 00 00 00 00 00 00>

// 2. Buffer.allocUnsafe(size) —— 分配但不初始化（更快但可能含旧数据，不安全）
const unsafe = Buffer.allocUnsafe(10)
// <Buffer 可能是任意值>

// 3. Buffer.from(array | string | buffer) —— 从已有数据创建
const fromStr = Buffer.from('LLM Streaming', 'utf8')
const fromArr = Buffer.from([0x48, 0x49])  // "HI"
```

> **安全提示**：`allocUnsafe` 不会清零内存，可能残留敏感数据。除非你有明确的性能需求且会立即填充数据，否则始终用 `alloc`。

### 1.3 字符编码

Buffer 支持多种编码格式，在 LLM 开发中最常用的是 `utf8` 和 `base64`：

```javascript
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
```

### 1.4 Buffer 常用方法

```javascript
// concat：拼接多个 Buffer（处理分片数据的核心方法）
const chunk1 = Buffer.from('data: {"token": "Hel')
const chunk2 = Buffer.from('lo"}\n\n')
const full = Buffer.concat([chunk1, chunk2])
console.log(full.toString())  // data: {"token": "Hello"}\n\n

// slice / subarray：截取子 Buffer
const sub = full.subarray(6)  // 跳过 "data: "
console.log(sub.toString())   // {"token": "Hello"}\n\n

// compare：比较两个 Buffer
const a = Buffer.from('abc')
const b = Buffer.from('abd')
console.log(Buffer.compare(a, b))  // -1（a < b）

// isBuffer：类型判断
console.log(Buffer.isBuffer(a))  // true
```

### 1.5 Agent 场景：拼接 LLM 分片响应

LLM 流式响应返回的是一个个 chunk，每个 chunk 可能是不完整的 JSON。你需要用 `Buffer.concat` 来安全拼接：

```javascript
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
```

---

## 二、Stream 四大类型

Stream 是 Node.js 中处理流式数据的抽象接口。与一次性读取整个文件到内存不同，Stream 逐块（chunk）处理数据，内存占用恒定，特别适合处理大文件和网络流。

### 2.1 四种基本流类型

| 类型 | 方向 | 典型示例 | 说明 |
|------|------|---------|------|
| **Readable** | 只读 | `fs.createReadStream()`、HTTP 请求体 | 数据的来源 |
| **Writable** | 只写 | `fs.createWriteStream()`、`process.stdout`、HTTP 响应体 | 数据的去向 |
| **Duplex** | 可读+可写 | `net.Socket` | 双向通道，读写独立 |
| **Transform** | 读入→变换→写出 | `zlib.createGzip()` | 在读写之间做转换 |

### 2.2 Readable Stream（可读流）

```javascript
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
    console.log(`读取到 ${chunk.length} 字符`)
  }
})

// 模式二：流动模式 —— 自动推送数据
readable.on('data', (chunk) => {
  console.log(`接收到: ${chunk.length} 字符`)
})

readable.on('end', () => {
  console.log('读取完成')
})

readable.on('error', (err) => {
  console.error('出错了:', err)
})
```

### 2.3 Writable Stream（可写流）

```javascript
const fs = require('node:fs')

const writable = fs.createWriteStream('./output.txt')

writable.write('第一行数据\n')
writable.write('第二行数据\n')
writable.end('最后一行\n')  // end() 后不能再 write()

writable.on('finish', () => {
  console.log('写入完成')
})

writable.on('error', (err) => {
  console.error('写入出错:', err)
})
```

### 2.4 Duplex Stream（双工流）

双工流同时可读可写，且读写互不影响（两个独立的缓冲区）：

```javascript
const { Duplex } = require('node:stream')

// 自定义双工流：读端发送随机数据，写端转为大写
const myDuplex = new Duplex({
  write(chunk, encoding, callback) {
    console.log('写入:', chunk.toString().toUpperCase())
    callback()
  },
  read(size) {
    this.push(`随机数据 ${Math.random().toFixed(2)}\n`)
    if (Math.random() > 0.8) this.push(null)  // 停止读取
  }
})
```

### 2.5 Transform Stream（转换流）⭐ 重点

Transform 流是 Duplex 的特例——**写入的数据经过变换后从读端输出**。这是处理 LLM 流式响应的核心工具。

```javascript
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
```

---

## 三、pipe 与 pipeline

### 3.1 pipe()：基础管道

`pipe()` 将可读流连接到可写流，数据自动流动：

```javascript
const fs = require('node:fs')
const zlib = require('node:zlib')

// 经典管道：读取文件 → Gzip 压缩 → 写入文件
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'))
```

> **pipe() 的缺陷**：如果某个环节出错，pipe 不会自动销毁其他流，可能导致内存泄漏和资源未释放。

### 3.2 pipeline()：现代推荐写法 ⭐

`pipeline()` 自动处理错误传播和资源清理，是现代 Node.js 的推荐方式：

```javascript
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
```

### 3.3 Stream Promise API

`stream/promises` 模块提供了返回 Promise 的 `pipeline` 和 `finished`，可以配合 async/await 使用：

```javascript
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
```

### 3.4 pipeline + AbortSignal：可取消的流

```javascript
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
```

---

## 四、背压机制（Backpressure）

### 4.1 什么是背压

当数据生产速度 > 消费速度时，数据会在内存中堆积。**背压**就是流用来应对这种情况的机制。

- 可读流有一个 `highWaterMark`（水位线），默认 64KB
- 当缓冲区数据超过水位线，流会暂停读取，触发 `pause`
- 当消费端消化完数据，缓冲区降到水位线以下，触发 `drain` 事件恢复流动

### 4.2 背压实战演示

```javascript
const { Readable, Writable } = require('node:stream')

// 高速可读流：每毫秒产出一个数据
const fastReadable = new Readable({
  highWaterMark: 10,  // 水位线设小一点，更容易触发背压
  read() {
    this.push(`data-${Date.now()}\n`)
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
```

### 4.3 Agent 中的背压场景

```javascript
// LLM 产出速度 > 前端消费速度时的背压处理
const llmStream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: '写一篇长文' }],
  stream: true
})

const responseTransform = new Transform({
  transform(chunk, encoding, callback) {
    // 解析 SSE 数据
    const lines = chunk.toString().split('\n')
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
```

---

## 五、实战：模拟 LLM 流式响应

### 5.1 完整的 SSE 流式响应管道

下面用学过的知识实现一个完整的 LLM 流式响应模拟：

```javascript
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
        const sseData = `data: ${JSON.stringify({
          choices: [{ delta: { content: token } }]
        })}\n\n`
        this.push(sseData)
        // 模拟 LLM 产出延迟
        setTimeout(() => {}, 20)
      } else {
        this.push('data: [DONE]\n\n')
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

      const lines = buffer.split('\n')
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
```

### 5.2 使用客户端测试

```html
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
```

---

## 六、与 async/await 的结合

### 6.1 async iteration of streams

Node.js 的可读流实现了 `AsyncIterable` 协议，可以用 `for await...of` 遍历：

```javascript
const { createReadStream } = require('node:fs')

async function processFile() {
  const stream = createReadStream('large-file.txt', { encoding: 'utf8' })

  for await (const chunk of stream) {
    console.log(`处理 ${chunk.length} 字符`)
    // 在这里做处理...
  }
  
  console.log('文件处理完成')
}

processFile()
```

### 6.2 在 pipeline 中使用 async generator

```javascript
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
```

### 6.3 调用 LLM API 的现代写法

```javascript
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
```

---

## 七、综合实战练习

### 练习 1：实现可背压控制的 LLM 文本处理器

```javascript
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
    this.push(`\n\n--- 总计 ${this.count} 个 token ---`)
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
    else console.log('\n管道成功完成')
  }
)
```

### 练习 2：实现文件分块读取并逐块处理

```javascript
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
    wordCount += line.split(/\s+/).filter(Boolean).length
  }
  
  console.log(`总行数: ${lineCount}, 总词数: ${wordCount}`)
}

processLargeFile('large-file.txt')
```

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

1. **Buffer** 是处理二进制数据的基础，`Buffer.concat()` 是拼接 LLM 分片响应的安全方式
2. **Stream 四大类型**中，**Transform 流**是处理 LLM 流式响应的核心——解析 SSE、提取 token
3. **pipeline()** 是现代推荐写法，自动处理错误传播和资源清理，配合 `stream/promises` 可用 async/await
4. **背压机制**通过 `highWaterMark` 和 `drain` 事件自动调节流速，用 pipeline 则无需手动处理
5. **async iteration** 让流可以用 `for await...of` 遍历，代码更简洁

### 与 AI Agent 的关联

Stream 与 Buffer 在 Agent 开发中的关键应用：

- **LLM 流式响应**：OpenAI、Anthropic 等 API 返回 SSE 格式的流，需要用 Readable + Transform 解析
- **前端流式渲染**：Vercel AI SDK 的 `streamText`、`useChat` 底层就是 Stream
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
- 微任务 vs 宏任务：`process.nextTick`、`Promise.then`、`setTimeout`、`setImmediate` 的执行顺序
- 并发控制：理解异步调度，避免阻塞事件循环
- Agent 并发：多个工具并行调用时的调度原理

事件循环是 Node.js 异步模型的心脏。理解它，你才能真正掌握 Agent 并发任务调度的底层逻辑。

---

> 🌊 Day 5 完成！Stream 是数据流动的高速公路，Buffer 是路上的集装箱。掌握它们，LLM 流式响应就不再是黑魔法。
