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

装饰器本质是一个**函数**，它接收目标对象作为参数，在运行时对目标进行「装饰」（扩展或修改）。语法上使用 `@expression` 形式，其中 `expression` 求值后必须是一个函数。

```typescript
// @sealed 就是一个装饰器
@sealed
class Greeter {
  greet() {}
}
```

### 1.2 启用装饰器支持

装饰器目前是实验性特性，需要在 `tsconfig.json` 中启用：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

- `experimentalDecorators`：启用实验性装饰器（Stage 2 规范）
- `emitDecoratorMetadata`：允许装饰器获取类型元数据（需配合 `reflect-metadata`）

### 1.3 Stage 2 vs Stage 3 装饰器

> **重要提示**：TypeScript 5.0 起已原生支持 ECMAScript Stage 3 装饰器规范，不再需要 `experimentalDecorators`。

| 特性 | Stage 2（旧版实验性） | Stage 3（TS 5.0+ 标准） |
|------|----------------------|------------------------|
| 启用方式 | `experimentalDecorators: true` | 默认支持（无需配置） |
| 参数装饰器 | ✅ 支持 | ✅ 支持 |
| 元数据 API | `reflect-metadata` 库 | 内置 `Symbol.metadata` |
| 框架兼容性 | NestJS、TypeORM 等主流框架 | 新项目可选用，旧框架逐步迁移中 |

当前大多数 Node.js 框架（NestJS、TypeORM、MikroORM 等）仍使用 Stage 2 装饰器，因此本文以 Stage 2 为主进行讲解，这是目前工业界最广泛使用的形式。

---

## 二、装饰器工厂（Decorator Factories）

装饰器工厂是一个**返回装饰器函数**的函数，用于给装饰器传参：

```typescript
// 普通装饰器：无法传参
function log(target: any) {
  console.log(target)
}

// 装饰器工厂：可以传参
function logWithMessage(message: string) {
  return function (target: any) {
    console.log(`${message}:`, target.name)
  }
}

@logWithMessage(' decorating class ')
class MyAgent {}
// 输出: decorating class : MyAgent
```

工厂模式是实际开发中最常用的形式——NestJS 的 `@Controller('users')`、`@Get('/list')` 都是装饰器工厂。

---

## 三、类装饰器（Class Decorators）

类装饰器是应用于**类声明**的装饰器，接收一个参数：类的构造函数。

### 3.1 基本用法

```typescript
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
```

### 3.2 替换/扩展构造函数

类装饰器可以返回一个新的构造函数，**替换**原始类：

```typescript
// 装饰器工厂：给类添加 createdAt 属性和日志能力
function reportableClassDecorator<T extends { new (...args: any[]): {} }>(
  constructor: T
) {
  return class extends constructor {
    createdAt = new Date()
    report() {
      console.log(`Agent 创建于 ${this.createdAt.toISOString()}`)
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
```

### 3.3 Agent 开发中的应用：自动注册工具

```typescript
// 全局工具注册表
const toolRegistry = new Map<string, any>()

// 类装饰器：自动将 Agent 类注册为可用工具
function AgentTool(name: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    toolRegistry.set(name, constructor)
    console.log(`[注册工具] ${name} -> ${constructor.name}`)
    return constructor
  }
}

@AgentTool('web_search')
class WebSearchAgent {
  async execute(query: string) {
    return `搜索结果: ${query}`
  }
}

@AgentTool('code_executor')
class CodeExecutorAgent {
  async execute(code: string) {
    return `执行结果: ${code}`
  }
}

// 运行时查看注册表
console.log(toolRegistry.keys())
// [注册工具] web_search -> WebSearchAgent
// [注册工具] code_executor -> CodeExecutorAgent
```

---

## 四、方法装饰器（Method Decorators）

方法装饰器应用于类的**方法**，接收三个参数：

1. `target`：对于静态成员是类的构造函数，对于实例成员是类的原型
2. `propertyKey`：方法名（字符串或 Symbol）
3. `descriptor`：属性描述符（`TypedPropertyDescriptor`）

### 4.1 基本用法

```typescript
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
```

### 4.2 包装方法：日志与耗时统计

方法装饰器最强大的用途是**包装原始方法**，在不修改原代码的情况下增加横切逻辑：

```typescript
// 记录方法调用日志
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = function (...args: any[]) {
    console.log(`[调用] ${propertyKey}(${args.map(a => JSON.stringify(a)).join(', ')})`)
    const result = originalMethod.apply(this, args)
    console.log(`[返回] ${propertyKey} => ${JSON.stringify(result)}`)
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
    console.log(`⏱ ${propertyKey} 耗时 ${elapsed}ms`)
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
    return `回复: ${prompt}`
  }
}

const client = new LLMClient()
await client.chat('你好')
// [调用] chat("你好")
// ⏱ chat 耗时 502ms
// [返回] chat => "回复: 你好"
```

### 4.3 错误重试装饰器

```typescript
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
          console.log(`🔄 ${propertyKey} 第 ${i + 1} 次失败: ${lastError.message}`)
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
    return `LLM 回复: ${prompt}`
  }
}
```

### 4.4 Agent 中的应用：工具调用权限校验

```typescript
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
        throw new Error(`权限不足：需要 ${permission} 权限`)
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
    console.log(`写入文件 ${path}`)
  }

  @requirePermission('net:request')
  async httpRequest(url: string) {
    console.log(`请求 ${url}`)
  }
}

const agent = new Agent('Bot', ['file:write'])
await agent.writeFile('/tmp/test.txt', 'hello')  // ✅
await agent.httpRequest('https://api.example.com')  // ❌ 权限不足
```

---

## 五、属性装饰器（Property Decorators）

属性装饰器应用于类的属性，接收两个参数：

1. `target`：对于静态成员是构造函数，对于实例成员是原型
2. `propertyKey`：属性名

> 注意：属性装饰器**没有**描述符参数，因为属性在原型上初始化时还没有描述符。

```typescript
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
```

---

## 六、访问器装饰器（Accessor Decorators）

访问器装饰器应用于 getter/setter，参数与方法装饰器相同：

```typescript
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
```

---

## 七、参数装饰器（Parameter Decorators）

参数装饰器应用于**方法参数**，接收三个参数：

1. `target`：对于静态成员是构造函数，对于实例成员是原型
2. `propertyKey`：方法名（静态成员为 `undefined`）
3. `parameterIndex`：参数在函数参数列表中的索引

```typescript
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
        throw new Error(`参数 ${index} 是必填的`)
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
    console.log(`执行: ${prompt}`, options)
  }
}

const runner = new AgentRunner()
runner.execute('你好')          // ✅
runner.execute(undefined as any) // ❌ 参数 0 是必填的
```

---

## 八、装饰器组合与求值顺序

### 8.1 多装饰器组合

当多个装饰器应用于同一个声明时，写在一行或分多行：

```typescript
// 单行写法
@f @g class A {}

// 多行写法
@f
@g
class B {}
```

### 8.2 求值规则

装饰器的求值分为两个阶段，类似数学中的**复合函数**：

1. **自上而下求值**：装饰器表达式从上到下求值（工厂函数被调用）
2. **自下而上调用**：装饰器函数从下到上调用（实际装饰逻辑执行）

```typescript
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
```

### 8.3 不同声明上的应用顺序

对于同一个类中的多个装饰器，应用顺序如下：

1. **实例方法**：按参数顺序 → 方法
2. **静态方法**：按参数顺序 → 方法
3. **实例属性**：按声明顺序
4. **静态属性**：按声明顺序
5. **构造函数参数**
6. **类装饰器**

```typescript
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
```

---

## 九、元数据（Metadata）

### 9.1 reflect-metadata 简介

`emitDecoratorMetadata` 启用后，TypeScript 会在编译时自动注入类型元数据。配合 `reflect-metadata` 库使用：

```bash
npm install reflect-metadata
```

```typescript
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
```

### 9.2 依赖注入原理

NestJS 的依赖注入机制就基于装饰器 + 元数据实现：

```typescript
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
  log(msg: string) { console.log(`[LOG] ${msg}`) }
}

@Injectable
class AgentService {
  constructor(private logger: Logger) {}
  
  run() { this.logger.log('Agent 启动') }
}

const agent = container.get('AgentService') as AgentService
agent.run()  // [LOG] Agent 启动
```

---

## 十、综合实战练习

### 练习 1：实现 Agent 工具注册与自动校验

```typescript
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
    return Array(limit).fill(0).map((_, i) => `结果${i}: ${query}`)
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
```

### 练习 2：实现方法缓存装饰器

```typescript
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
      const key = `${propertyKey}:${JSON.stringify(args)}`
      const cached = store.get(key)
      
      if (cached && cached.expireAt > Date.now()) {
        console.log(`📋 缓存命中: ${key}`)
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
    console.log(`🔄 计算嵌入向量: ${text}`)
    // 模拟耗时计算
    await new Promise(r => setTimeout(r, 100))
    return [0.1, 0.2, 0.3]
  }
}

const service = new EmbeddingService()
await service.embed('hello')  // 🔄 计算嵌入向量: hello
await service.embed('hello')  // 📋 缓存命中: embed:["hello"]
```

---

## 十一、学习总结

| 装饰器类型 | 参数 | 典型用途 |
|-----------|------|---------|
| 类装饰器 | `(target)` | 替换/扩展类、自动注册 |
| 方法装饰器 | `(target, key, descriptor)` | 日志、重试、缓存、权限 |
| 属性装饰器 | `(target, key)` | 元数据标记、验证标记 |
| 访问器装饰器 | `(target, key, descriptor)` | 控制可配置性 |
| 参数装饰器 | `(target, key, paramIndex)` | 参数校验、依赖注入标记 |

### 关键收获

1. **类装饰器**可以替换构造函数，实现自动注册、混入能力
2. **方法装饰器**是最实用的类型，通过包装 `descriptor.value` 可实现日志、重试、缓存、权限等横切关注点
3. **参数装饰器 + 方法装饰器**配合可实现参数校验和依赖注入
4. **装饰器工厂**让装饰器可配置传参，是 NestJS 等框架的标准模式
5. **元数据**机制是依赖注入的基石，`reflect-metadata` 让运行时类型检查成为可能

### 与 AI Agent 的关联

装饰器在 Agent 开发中会以下列形式出现：

- **NestJS 后端服务**：`@Controller()`、`@Injectable()`、`@Get()` 构建 Agent API 服务
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
