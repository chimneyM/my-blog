# AI Agent 学习计划 Day 9：Node.js HTTP/HTTPS

> 📅 日期：2026-07-10  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 9 / 84（10.7%）

## 前言

Day 8 我们突破了单线程限制，掌握了 child_process 和 worker_threads。今天，我们要学习的是 AI Agent 系统中**最基础也最核心的通信协议——HTTP**。

想一想 Agent 系统中每一次关键操作的底层：

- **调用 LLM** → HTTP POST 到 `https://api.openai.com/v1/chat/completions`
- **流式响应** → HTTP Server-Sent Events（SSE）
- **工具调用** → HTTP 请求到搜索 API、数据库 API、业务系统
- **暴露服务** → HTTP Server 提供 RESTful API 或 WebSocket 端点
- **Webhook 回调** → HTTP POST 接收外部事件通知

可以说，**Agent 的每一次「思考」和「行动」都伴随着 HTTP 请求**。理解 Node.js HTTP 模块的工作原理，是掌握 OpenAI SDK、LangChain.js、Vercel AI SDK 等框架底层通信机制的基石。今天我们将从 HTTP 服务器、HTTP 客户端、连接管理、HTTPS/TLS、SSE 流式传输，一路讲到调用 LLM API 的完整实现。

---

## 一、HTTP 协议基础回顾

### 1.1 HTTP 请求/响应模型

HTTP 是一个**请求-响应**协议：客户端发送请求，服务器返回响应。

```
请求 (Request):
┌─────────────────────────────────┐
│ POST /v1/chat/completions HTTP/1.1   │  ← 请求行: 方法 路径 版本
│ Host: api.openai.com                  │  ← 请求头
│ Content-Type: application/json        │
│ Authorization: Bearer sk-xxx          │
│                                       │
│ {"model":"gpt-4","messages":[...]}    │  ← 请求体
└─────────────────────────────────┘

响应 (Response):
┌─────────────────────────────────┐
│ HTTP/1.1 200 OK                       │  ← 状态行: 版本 状态码 状态文本
│ Content-Type: application/json        │  ← 响应头
│ Transfer-Encoding: chunked            │
│                                       │
│ {"id":"chatcmpl-xxx","choices":[...]} │  ← 响应体
└─────────────────────────────────┘
```

### 1.2 常见 HTTP 方法

| 方法 | 语义 | Agent 场景 |
|------|------|-----------|
| `GET` | 获取资源 | 获取模型列表、查询状态 |
| `POST` | 创建资源 | 发送 prompt、调用 LLM、执行工具 |
| `PUT` | 更新资源（全量） | 更新配置 |
| `PATCH` | 更新资源（部分） | 修改部分设置 |
| `DELETE` | 删除资源 | 删除会话、清理数据 |

### 1.3 关键状态码

| 状态码 | 含义 | Agent 处理策略 |
|--------|------|---------------|
| `200` | 成功 | 正常处理 |
| `201` | 创建成功 | 资源已创建 |
| `400` | 请求错误 | 检查请求体格式 |
| `401` | 未认证 | 检查 API Key |
| `403` | 禁止访问 | 检查权限 |
| `429` | 速率限制 | 退避重试 |
| `500` | 服务器错误 | 重试或降级 |
| `503` | 服务不可用 | 重试或切换备用模型 |

---

## 二、创建 HTTP 服务器

### 2.1 最简 HTTP 服务器

```javascript
import http from 'node:http'

const server = http.createServer((req, res) => {
  // req: IncomingMessage — 可读流，包含请求信息
  // res: ServerResponse — 可写流，用于发送响应

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end('Hello, Agent!')
})

server.listen(3000, () => {
  console.log('Agent Server running on http://localhost:3000')
})
```

### 2.2 解析请求信息

`req`（IncomingMessage）是一个可读流，同时也是请求信息的载体：

```javascript
const server = http.createServer((req, res) => {
  // 请求方法: GET / POST / PUT / DELETE ...
  console.log('Method:', req.method)

  // 请求 URL: /api/chat?model=gpt-4
  console.log('URL:', req.url)

  // 请求头（所有键名自动转为小写）
  console.log('Headers:', req.headers)
  console.log('Content-Type:', req.headers['content-type'])
  console.log('Authorization:', req.headers['authorization'])

  // HTTP 版本: 1.1 或 2.0
  console.log('HTTP Version:', req.httpVersion)

  // 客户端 IP
  console.log('Remote Address:', req.socket.remoteAddress)
})
```

### 2.3 读取请求体（Body）

请求体是通过流的方式读取的，需要监听 `data` 和 `end` 事件：

```javascript
const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = ''

    // 逐块接收数据
    req.on('data', (chunk) => {
      body += chunk.toString()
    })

    // 数据接收完毕
    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        console.log('Received:', data)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ received: true }))
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON' }))
      }
    })
  }
})
```

**Promise 化的请求体读取**（推荐）：

```javascript
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => body += chunk.toString())
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

// 使用
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST') {
    const bodyStr = await readBody(req)
    const data = JSON.parse(bodyStr)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ echo: data }))
  }
})
```

### 2.4 发送响应

```javascript
// 方式一：链式调用
res.writeHead(200, {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'X-Custom-Header': 'Agent-Server'
})
res.end(JSON.stringify({ message: 'Hello' }))

// 方式二：分别设置
res.statusCode = 200
res.setHeader('Content-Type', 'application/json')
res.write('{"message": "Hello"}')  // 可以多次 write
res.end()  // 最后调用 end
```

### 2.5 路由分发

```javascript
import http from 'node:http'
import { URL } from 'node:url'

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const { pathname } = url
  const { method } = req

  // CORS 预检
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    })
    return res.end()
  }

  // 路由匹配
  if (method === 'POST' && pathname === '/api/chat') {
    return handleChat(req, res)
  }

  if (method === 'GET' && pathname === '/api/models') {
    return handleListModels(req, res)
  }

  if (method === 'POST' && pathname.startsWith('/api/tools/')) {
    const toolName = pathname.split('/').pop()
    return handleToolCall(req, res, toolName)
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not Found' }))
})

server.listen(3000)
```

---

## 三、Node.js 作为 HTTP 客户端

### 3.1 http.request — 通用请求方法

```javascript
import http from 'node:http'

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/data',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
}

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`)
  console.log(`响应头: ${JSON.stringify(res.headers)}`)

  let data = ''
  res.on('data', (chunk) => data += chunk)
  res.on('end', () => {
    console.log('响应体:', JSON.parse(data))
  })
})

req.on('error', (err) => {
  console.error('请求出错:', err.message)
})

req.end()  // 必须调用 end() 才会真正发送请求
```

### 3.2 http.get — GET 请求快捷方法

```javascript
import http from 'node:http'

// http.get 是 http.request 的快捷方式，自动 method=GET 并调用 end()
http.get('http://localhost:3000/api/models', (res) => {
  let data = ''
  res.on('data', (chunk) => data += chunk)
  res.on('end', () => {
    const models = JSON.parse(data)
    console.log('可用模型:', models)
  })
}).on('error', (err) => {
  console.error('请求失败:', err.message)
})
```

### 3.3 POST 请求发送 JSON

```javascript
import http from 'node:http'

function postJSON(url, data) {
  const body = JSON.stringify(data)

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)  // 必须设置 Content-Length
      }
    }

    const req = http.request(options, (res) => {
      let responseData = ''
      res.on('data', (chunk) => responseData += chunk)
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: JSON.parse(responseData)
          })
        } catch {
          resolve({ status: res.statusCode, data: responseData })
        }
      })
    })

    req.on('error', reject)
    req.write(body)  // 写入请求体
    req.end()
  })
}

// 使用
const result = await postJSON('http://localhost:3000/api/chat', {
  message: '你好',
  model: 'gpt-4'
})
```

### 3.4 使用内置 fetch（Node.js 18+）

Node.js 18+ 内置了浏览器兼容的 `fetch` API，大幅简化 HTTP 请求：

```javascript
// Node.js 18+ 内置 fetch，无需安装任何包
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: '你好' }]
  })
})

const data = await response.json()
console.log(data)
```

**fetch vs http.request 对比**：

| 特性 | `http.request` | `fetch` |
|------|----------------|---------|
| **API 风格** | 事件回调（Event-based） | Promise / async-await |
| **流式处理** | 手动监听 data 事件 | `response.body.getReader()` |
| **代码简洁度** | 冗长 | 简洁 |
| **浏览器兼容** | ❌ 仅 Node.js | ✅ Node.js + 浏览器 |
| **底层控制** | 精细控制（socket、agent 等） | 较少底层控制 |
| **推荐场景** | 需要精细控制的底层场景 | 日常 API 调用（推荐） |

---

## 四、http.Agent — 连接池与 Keep-Alive

### 4.1 为什么需要连接池

每次 HTTP 请求都建立新的 TCP 连接（三次握手），开销很大。对于 Agent 系统频繁调用 LLM API 的场景，连接复用能显著提升性能。

```
无 Keep-Alive:
  请求1: TCP握手 → 发送请求 → 接收响应 → TCP关闭
  请求2: TCP握手 → 发送请求 → 接收响应 → TCP关闭  ← 又要握手！

有 Keep-Alive:
  请求1: TCP握手 → 发送请求 → 接收响应 → 保持连接
  请求2: 复用连接 → 发送请求 → 接收响应 → 保持连接  ← 省去握手！
```

### 4.2 配置 Agent

```javascript
import http from 'node:http'

const agent = new http.Agent({
  keepAlive: true,           // 启用 Keep-Alive
  keepAliveMsecs: 1000,      // Keep-Alive 探测间隔
  maxSockets: 256,           // 每个主机最大并发连接数
  maxFreeSockets: 32,        // 空闲时保持的最大连接数
  timeout: 30000             // 超时时间
})

// 在请求中使用
const options = {
  hostname: 'api.openai.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  agent: agent  // 指定 agent
}
```

### 4.3 全局 Agent 配置

```javascript
// 设置全局默认 Agent（影响所有 http.request 调用）
http.globalAgent.keepAlive = true
http.globalAgent.maxSockets = 256
```

---

## 五、HTTPS 模块

### 5.1 为什么需要 HTTPS

LLM API（OpenAI、Anthropic 等）都使用 HTTPS。如果用 `http` 模块请求 HTTPS 地址，会直接报错。必须使用 `https` 模块。

### 5.2 HTTPS 客户端请求

```javascript
import https from 'node:https'

const options = {
  hostname: 'api.openai.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
  }
}

const req = https.request(options, (res) => {
  let data = ''
  res.on('data', (chunk) => data += chunk)
  res.on('end', () => {
    console.log('LLM 响应:', JSON.parse(data))
  })
})

req.on('error', (err) => {
  console.error('请求失败:', err.message)
})

req.write(JSON.stringify({
  model: 'gpt-4',
  messages: [{ role: 'user', content: '什么是 AI Agent？' }]
}))

req.end()
```

### 5.3 创建 HTTPS 服务器

```javascript
import https from 'node:https'
import fs from 'node:fs'

const options = {
  key: fs.readFileSync('server.key'),     // 私钥
  cert: fs.readFileSync('server.crt'),    // 证书
  // ca: fs.readFileSync('ca.crt'),       // CA 证书链（可选）
}

const server = https.createServer(options, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Secure Agent Server')
})

server.listen(443, () => {
  console.log('HTTPS Server running on https://localhost:443')
})
```

### 5.4 自签名证书（开发环境）

```bash
# 生成私钥
openssl genrsa -out server.key 2048

# 生成 CSR（证书签名请求）
openssl req -new -key server.key -out server.csr

# 自签名证书（有效期 365 天）
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
```

> **生产环境**：建议使用 [Let's Encrypt](https://letsencrypt.org/) 免费证书，配合 `certbot` 自动续签。

### 5.5 忽略证书验证（仅开发测试）

```javascript
// ⚠️ 警告：仅用于本地开发测试，绝对不要在生产环境使用！
const https = require('node:https')

const agent = new https.Agent({
  rejectUnauthorized: false  // 忽略证书验证
})

const response = await fetch('https://localhost:3000/api/test', {
  agent  // Node.js 18+ 的 fetch 使用 dispatcher 而非 agent，这里仅做说明
})
```

---

## 六、SSE 流式响应 — LLM 的实时输出

### 6.1 什么是 SSE

Server-Sent Events（SSE）是 HTTP 上的流式传输协议。LLM API（OpenAI、Anthropic 等）使用 SSE 实现 token 逐字输出。

```
SSE 数据格式：
data: {"choices":[{"delta":{"content":"你"}}]}

data: {"choices":[{"delta":{"content":"好"}}]}

data: {"choices":[{"delta":{"content":"！"}}]}

data: [DONE]
```

### 6.2 接收 SSE 流式响应

```javascript
import https from 'node:https'

function streamChatCompletion(messages, onToken, options = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: options.model || 'gpt-4',
      messages,
      stream: true,  // 启用流式
      temperature: options.temperature ?? 0.7
    })

    const req = https.request({
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let buffer = ''  // 缓冲区，处理跨 chunk 的不完整数据

      res.on('data', (chunk) => {
        buffer += chunk.toString()

        // 按行分割
        const lines = buffer.split('\n')
        buffer = lines.pop()  // 最后可能不完整的行，留在缓冲区

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)  // 去掉 'data: ' 前缀
          if (data === '[DONE]') {
            resolve()
            return
          }

          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content
            if (token) onToken(token)
          } catch (err) {
            // JSON 解析失败，可能是数据不完整，跳过
          }
        }
      })

      res.on('end', () => resolve())
      res.on('error', reject)
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// 使用
await streamChatCompletion(
  [{ role: 'user', content: '用三句话介绍 AI Agent' }],
  (token) => process.stdout.write(token)
)
// 输出：AI Agent 是一种能够感知环境、自主决策并执行动作的智能体...
```

### 6.3 用 fetch 接收 SSE（推荐）

```javascript
async function streamChatWithFetch(messages, onToken, options = {}) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: options.model || 'gpt-4',
      messages,
      stream: true
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue

      const data = trimmed.slice(6)
      if (data === '[DONE]') return

      const parsed = JSON.parse(data)
      const token = parsed.choices?.[0]?.delta?.content
      if (token) onToken(token)
    }
  }
}
```

### 6.4 在 HTTP Server 中转发 SSE

```javascript
import http from 'node:http'

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat/stream') {
    const body = await readBody(req)
    const { messages } = JSON.parse(body)

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    })

    // 调用 LLM 并流式转发
    await streamChatWithFetch(messages, (token) => {
      // 以 SSE 格式发送给客户端
      res.write(`data: ${JSON.stringify({ token })}\n\n`)
    })

    // 发送结束标记
    res.write('data: [DONE]\n\n')
    res.end()
  }
})

server.listen(3000)
```

---

## 七、错误处理与重试策略

### 7.1 常见错误类型

```javascript
import https from 'node:https'

// 网络错误：连接超时、DNS 解析失败、TCP 重置
// HTTP 错误：4xx（客户端错误）、5xx（服务器错误）
// 解析错误：响应体不是合法 JSON

async function safeRequest(url, options) {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      // HTTP 错误
      const errorBody = await response.text()

      if (response.status === 429) {
        throw new RateLimitError('API 速率限制', response)
      }

      if (response.status === 401) {
        throw new AuthError('API Key 无效', response)
      }

      if (response.status >= 500) {
        throw new ServerError(`服务器错误: ${response.status}`, response)
      }

      throw new Error(`HTTP ${response.status}: ${errorBody}`)
    }

    return response
  } catch (err) {
    if (err instanceof TypeError) {
      // fetch 网络错误（DNS 解析失败、连接超时等）
      throw new NetworkError('网络请求失败', err)
    }
    throw err
  }
}

class RateLimitError extends Error { constructor(msg, res) { super(msg); this.name = 'RateLimitError'; this.response = res } }
class AuthError extends Error { constructor(msg, res) { super(msg); this.name = 'AuthError'; this.response = res } }
class ServerError extends Error { constructor(msg, res) { super(msg); this.name = 'ServerError'; this.response = res } }
class NetworkError extends Error { constructor(msg, cause) { super(msg); this.name = 'NetworkError'; this.cause = cause } }
```

### 7.2 超时控制

```javascript
// 方式一：使用 AbortController（推荐）
async function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`请求超时（${timeoutMs}ms）`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// 方式二：使用 http.request 的 setTimeout
const req = http.request(options, callback)
req.setTimeout(30000, () => {
  req.destroy(new Error('请求超时'))
})
```

### 7.3 指数退避重试

```javascript
async function fetchWithRetry(url, options, config = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    retryableStatus = [429, 500, 502, 503, 504]
  } = config

  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, 30000)

      // 不可重试的状态码，直接返回
      if (!retryableStatus.includes(response.status)) {
        return response
      }

      // 可重试但已达最大次数
      if (attempt === maxRetries) {
        return response
      }

      // 检查 Retry-After 头
      const retryAfter = response.headers.get('retry-after')
      const delay = retryAfter
        ? parseInt(retryAfter) * 1000
        : Math.min(baseDelay * Math.pow(2, attempt), maxDelay)

      console.warn(`请求失败（${response.status}），${delay}ms 后重试（${attempt + 1}/${maxRetries}）`)
      await sleep(delay)

    } catch (err) {
      lastError = err
      if (attempt === maxRetries) throw err

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      console.warn(`请求出错（${err.message}），${delay}ms 后重试（${attempt + 1}/${maxRetries}）`)
      await sleep(delay)
    }
  }

  throw lastError
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 使用
const response = await fetchWithRetry(
  'https://api.openai.com/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: '你好' }]
    })
  },
  { maxRetries: 5, baseDelay: 1000 }
)
```

---

## 八、Agent 实战：完整的 LLM 客户端封装

### 8.1 LLMClient 类

整合前面所有知识，封装一个生产级的 LLM 客户端：

```javascript
class LLMClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY
    this.baseUrl = options.baseUrl || 'https://api.openai.com/v1'
    this.defaultModel = options.defaultModel || 'gpt-4'
    this.timeout = options.timeout || 60000
    this.maxRetries = options.maxRetries || 3
  }

  // 普通对话
  async chat(messages, options = {}) {
    const response = await fetchWithRetry(
      `${this.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens,
          tools: options.tools,
          tool_choice: options.toolChoice
        })
      },
      { maxRetries: this.maxRetries }
    )

    const data = await response.json()
    return data
  }

  // 流式对话
  async chatStream(messages, onToken, options = {}) {
    const response = await fetchWithRetry(
      `${this.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages,
          temperature: options.temperature ?? 0.7,
          stream: true,
          tools: options.tools,
          tool_choice: options.toolChoice
        })
      },
      { maxRetries: this.maxRetries }
    )

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') return fullText

        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta

        if (delta?.content) {
          fullText += delta.content
          onToken(delta.content, fullText)
        }

        // 处理工具调用
        if (delta?.tool_calls) {
          onToken(null, fullText, delta.tool_calls)
        }
      }
    }

    return fullText
  }

  // 生成嵌入向量
  async embed(text, model = 'text-embedding-3-small') {
    const response = await fetchWithRetry(
      `${this.baseUrl}/embeddings`,
      {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({ model, input: text })
      },
      { maxRetries: this.maxRetries }
    )

    const data = await response.json()
    return data.data[0].embedding
  }

  _getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    }
  }
}
```

### 8.2 使用示例

```javascript
const client = new LLMClient({
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4'
})

// 普通对话
const result = await client.chat([
  { role: 'system', content: '你是一个 AI Agent 专家' },
  { role: 'user', content: '什么是 ReAct 模式？' }
])
console.log(result.choices[0].message.content)

// 流式对话
console.log('Agent 回复: ')
await client.chatStream(
  [{ role: 'user', content: '用三句话解释 Agent 的记忆系统' }],
  (token, fullText) => {
    process.stdout.write(token)
  }
)

// 生成嵌入
const embedding = await client.embed('AI Agent 是智能体')
console.log('向量维度:', embedding.length)
```

---

## 九、HTTP 代理服务器

### 9.1 正向代理

Agent 系统中经常需要代理服务器来转发 LLM API 请求（隐藏 API Key、添加日志、缓存等）：

```javascript
import http from 'node:http'
import https from 'node:https'

const server = http.createServer((clientReq, clientRes) => {
  console.log(`[代理] ${clientReq.method} ${clientReq.url}`)

  // 解析目标 URL
  const targetUrl = new URL(clientReq.url)

  // 构建代理请求选项
  const proxyOptions = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || 443,
    path: targetUrl.pathname + targetUrl.search,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: targetUrl.hostname,  // 修改 host 头
      // 注入 API Key（对客户端隐藏）
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
  }

  // 转发请求
  const proxyReq = https.request(proxyOptions, (proxyRes) => {
    // 转发响应头
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers)
    // 转发响应体
    proxyRes.pipe(clientRes)
  })

  proxyReq.on('error', (err) => {
    console.error('[代理] 请求失败:', err.message)
    clientRes.writeHead(502)
    clientRes.end('Bad Gateway')
  })

  // 转发请求体
  clientReq.pipe(proxyReq)
})

server.listen(8080, () => {
  console.log('代理服务器运行在 http://localhost:8080')
})
```

### 9.2 完整的 Agent API 服务器

```javascript
import http from 'node:http'
import { URL } from 'node:url'

class AgentServer {
  constructor(llmClient) {
    this.llm = llmClient
    this.server = http.createServer(this._handleRequest.bind(this))
  }

  async _handleRequest(req, res) {
    // CORS
    this._setCorsHeaders(res)

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      return res.end()
    }

    try {
      const url = new URL(req.url, `http://${req.headers.host}`)

      // 路由
      if (req.method === 'POST' && url.pathname === '/api/chat') {
        return await this._handleChat(req, res)
      }

      if (req.method === 'POST' && url.pathname === '/api/chat/stream') {
        return await this._handleChatStream(req, res)
      }

      if (req.method === 'POST' && url.pathname === '/api/embed') {
        return await this._handleEmbed(req, res)
      }

      if (req.method === 'GET' && url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ status: 'ok' }))
      }

      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not Found' }))

    } catch (err) {
      console.error('服务器错误:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
  }

  async _handleChat(req, res) {
    const body = JSON.parse(await readBody(req))
    const result = await this.llm.chat(body.messages, body.options)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
  }

  async _handleChatStream(req, res) {
    const body = JSON.parse(await readBody(req))

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    await this.llm.chatStream(
      body.messages,
      (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`)
      },
      body.options
    )

    res.write('data: [DONE]\n\n')
    res.end()
  }

  async _handleEmbed(req, res) {
    const body = JSON.parse(await readBody(req))
    const embedding = await this.llm.embed(body.text)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ embedding }))
  }

  _setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  listen(port, callback) {
    this.server.listen(port, callback)
    return this
  }
}

// 启动服务器
const llmClient = new LLMClient({ apiKey: process.env.OPENAI_API_KEY })
const agentServer = new AgentServer(llmClient)

agentServer.listen(3000, () => {
  console.log('Agent API Server running on http://localhost:3000')
})
```

---

## 十、HTTP/2 简介

### 10.1 HTTP/2 的优势

| 特性 | HTTP/1.1 | HTTP/2 |
|------|----------|--------|
| **多路复用** | 每个请求独占连接 | 一个连接承载多个请求 |
| **头部压缩** | 无 | HPACK 压缩 |
| **服务端推送** | 不支持 | 支持 |
| **二进制协议** | 文本协议 | 二进制分帧 |
| **流优先级** | 无 | 支持优先级 |

对 Agent 系统而言，HTTP/2 的多路复用意味着可以在一个连接上同时发送多个 LLM 请求，减少连接开销。

### 10.2 创建 HTTP/2 服务器

```javascript
import http2 from 'node:http2'
import fs from 'node:fs'

const server = http2.createSecureServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
})

server.on('stream', (stream, headers) => {
  const path = headers[':path']
  const method = headers[':method']

  stream.respond({
    'content-type': 'application/json',
    ':status': 200
  })

  stream.end(JSON.stringify({
    protocol: 'HTTP/2',
    path,
    method
  }))
})

server.listen(8443, () => {
  console.log('HTTP/2 Server running on https://localhost:8443')
})
```

---

## 十一、综合练习

### 练习 1：实现带缓存的 HTTP 客户端

```javascript
class CachedHTTPClient {
  constructor() {
    this.cache = new Map()
    this.pending = new Map()
  }

  async get(url) {
    // 检查缓存
    const cached = this.cache.get(url)
    if (cached && Date.now() - cached.timestamp < 300000) {
      console.log('[缓存] 命中')
      return cached.data
    }

    // 检查是否有相同的请求正在进行
    if (this.pending.has(url)) {
      console.log('[去重] 合并请求')
      return this.pending.get(url)
    }

    // 发起新请求
    const promise = fetch(url).then(res => res.json()).then(data => {
      this.cache.set(url, { data, timestamp: Date.now() })
      this.pending.delete(url)
      return data
    })

    this.pending.set(url, promise)
    return promise
  }
}
```

### 练习 2：实现请求并发限制器

```javascript
class RateLimiter {
  constructor(maxConcurrent = 5, intervalMs = 1000) {
    this.maxConcurrent = maxConcurrent
    this.intervalMs = intervalMs
    this.active = 0
    this.queue = []
  }

  async execute(fn) {
    if (this.active >= this.maxConcurrent) {
      await new Promise(resolve => this.queue.push(resolve))
    }

    this.active++
    try {
      return await fn()
    } finally {
      this.active--
      if (this.queue.length > 0) {
        const next = this.queue.shift()
        next()
      }
    }
  }
}

// 使用：限制 LLM API 并发为 3
const limiter = new RateLimiter(3)

const results = await Promise.all(
  prompts.map(prompt =>
    limiter.execute(() => client.chat([{ role: 'user', content: prompt }]))
  )
)
```

### 练习 3：实现带日志的代理中间件

```javascript
function loggingMiddleware(req, res, next) {
  const start = Date.now()
  const { method, url } = req

  // 记录请求
  console.log(`→ ${method} ${url}`)

  // 拦截响应结束
  const originalEnd = res.end
  res.end = function(...args) {
    const duration = Date.now() - start
    console.log(`← ${method} ${url} ${res.statusCode} ${duration}ms`)
    originalEnd.apply(res, args)
  }

  next()
}
```

---

## 十二、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| `http.createServer` | 创建 HTTP 服务器，回调接收 req（可读流）和 res（可写流） |
| `http.request` / `http.get` | 发送 HTTP 请求，事件驱动模式 |
| `fetch`（Node.js 18+） | Promise 风格的 HTTP 客户端，推荐使用 |
| `http.Agent` | 连接池管理，keepAlive 复用 TCP 连接 |
| `https` 模块 | HTTPS 请求/服务器，需配置 TLS 证书 |
| SSE（Server-Sent Events） | LLM 流式响应的标准协议，`data: ...\n\n` 格式 |
| AbortController | 请求超时和取消控制 |
| 指数退避重试 | 网络错误和 429/5xx 状态码的重试策略 |
| HTTP/2 | 多路复用、头部压缩，一个连接承载多个请求 |
| 代理服务器 | 转发请求、隐藏 API Key、添加日志/缓存 |

### 关键收获

1. **HTTP 是 Agent 的通信基础**：LLM 调用、工具调用、服务暴露都基于 HTTP
2. **请求/响应模型**：req 是可读流，res 是可写流，理解流式处理是核心
3. **fetch vs http.request**：日常用 fetch（简洁），底层控制用 http.request
4. **连接池（Agent）**：keepAlive 复用 TCP 连接，减少握手开销
5. **SSE 流式响应**：LLM 逐 token 输出的底层机制，`data: ` 前缀 + `\n\n` 分隔
6. **HTTPS 必备**：所有 LLM API 都使用 HTTPS，需要 https 模块
7. **错误处理三件套**：超时（AbortController）、重试（指数退避）、分类（网络/HTTP/解析）
8. **代理模式**：Agent 后端的标准架构——代理转发 LLM 请求，保护 API Key

### 与 AI Agent 的关联

Node.js HTTP/HTTPS 在 Agent 开发中的核心应用：

- **调用 LLM API**：每一次 LLM 调用本质上是一个 HTTPS POST 请求
- **流式响应**：SSE 实现 token 逐字输出，是 Agent 实时交互的基础
- **Agent API 服务**：用 http.createServer 暴露 Agent 的 RESTful 接口
- **代理服务器**：代理转发 LLM 请求，隐藏 API Key，添加日志/缓存/限流
- **工具调用**：通过 HTTP 调用搜索 API、数据库 API 等外部工具
- **Webhook 集成**：接收外部事件通知，触发 Agent 执行

---

## 十三、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| Node.js 中文网 - HTTP 模块 | http://nodejs.cn/api/http.html | 官方文档中文版，权威完整（v26） |
| Node.js 中文网 - HTTPS 模块 | http://nodejs.cn/api/https.html | HTTPS/TLS 配置详解 |
| Node.js 中文网 - HTTP/2 模块 | http://nodejs.cn/api/http2.html | HTTP/2 协议实现文档 |
| Node.js 中文网 - 全局变量（含 fetch） | http://nodejs.cn/api/globals.html | 内置 fetch API 文档（v18+） |
| 菜鸟教程 - Node.js HTTP 模块 | https://www.runoob.com/nodejs/nodejs-http-module.html | 入门友好，含示例 |
| MDN 中文版 - Server-Sent Events | https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events | SSE 流式响应原理 |
| CSDN - Node.js 调用 OpenAI API 教程 | https://blog.csdn.net/2603_96029641/article/details/161041835 | 实战调用 OpenAI 兼容 API |
| 脚本之家 - JavaScript 调用 OpenAI API | https://www.jb51.net/javascript/3387880iu.htm | fetch 调用 LLM API 示例 |

> **提示**：Node.js 中文网（nodejs.cn）的 HTTP 和 HTTPS 文档是最权威的中文资源，覆盖所有 API 和高级用法。SSE 相关知识可参考 MDN 中文版。

---

## 十四、明日预告

**Day 10：AI Agent 概念 — Agent 定义与 LLM**

- Agent 的定义：能感知环境、自主决策、执行动作的智能体
- LLM 作为 Agent 的「大脑」
- Agent 的核心组成：感知、决策、行动、记忆
- OpenAI API 文档导读

从明天开始，我们将正式进入 AI Agent 的概念世界。前 9 天的 TypeScript 和 Node.js 基础，都是为理解 Agent 的底层实现做准备。掌握 HTTP 通信后，你就能理解 Agent 是如何通过 HTTP 与 LLM「对话」、如何通过 HTTP 调用外部工具的。

---

> 🚀 Day 9 完成！HTTP 是 Agent 与世界对话的语言——掌握它，就是学会了让 Agent 开口说话、伸手行动！
