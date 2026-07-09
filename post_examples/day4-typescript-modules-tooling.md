# AI Agent 学习计划 Day 4：TypeScript 模块系统与工程化配置

> 📅 日期：2026-07-05  
> 🎯 阶段一：基础入门（Day 1-14）  
> 📊 学习进度：Day 4 / 84（4.8%）

## 前言

前三天我们打好了 TypeScript 语言基础——类型系统（Day 1）、装饰器（Day 2）、异步编程（Day 3）。今天进入工程化主题：**模块系统与项目配置**。

为什么这个主题重要？因为当你开始构建真实的 AI Agent 项目时，代码不可能全写在一个文件里。你需要把 LLM 客户端、工具定义、Agent 逻辑、Prompt 模板拆分成多个模块。而 Node.js 生态系统有两套模块系统——**CommonJS（CJS）** 和 **ES Modules（ESM）**——它们的混用是无数开发者踩过的坑。同时，`tsconfig.json` 的配置直接影响编译行为，ESLint + Prettier 保证代码质量。

本文将从模块系统讲起，覆盖 ESM/CJS 兼容、动态导入、tsconfig 核心配置、ESLint + Prettier 集成，最终搭建一个完整的 TypeScript Agent 工程化项目骨架。

---

## 一、模块系统概述

### 1.1 为什么需要模块

没有模块系统时，所有代码共享全局作用域，容易命名冲突、难以维护：

```typescript
// ❌ 没有模块：全局污染
// file1.ts
const apiKey = 'sk-xxx'
function callLLM() { /* ... */ }

// file2.ts
const apiKey = 'sk-yyy'  // 冲突！覆盖了 file1 的 apiKey
```

模块系统让每个文件成为独立作用域，通过 `import`/`export` 显式声明依赖：

```typescript
// ✅ 有模块：独立作用域
// llm-client.ts
const apiKey = 'sk-xxx'  // 模块私有
export function callLLM() { /* ... */ }

// agent.ts
import { callLLM } from './llm-client'  // 显式导入
```

### 1.2 两大模块系统

| 特性 | CommonJS (CJS) | ES Modules (ESM) |
|------|----------------|-------------------|
| 语法 | `require()` / `module.exports` | `import` / `export` |
| 起源 | Node.js 原生（2009） | ECMAScript 标准（2015） |
| 加载 | 运行时动态加载 | 编译时静态分析 |
| `this` | 指向 `module.exports` | `undefined` |
| 循环依赖 | 返回部分导出 | 引用绑定（支持） |
| 顶层 await | ❌ 不支持 | ✅ 支持 |
| Tree Shaking | ❌ 不支持 | ✅ 支持 |
| 使用场景 | Node.js 传统项目 | 现代 Node.js、前端、全栈 |

---

## 二、CommonJS (CJS)

### 2.1 导出与导入

```typescript
// math.cjs
// 导出单个值
module.exports.add = (a: number, b: number) => a + b
module.exports.subtract = (a: number, b: number) => a - b

// 或者批量导出
module.exports = {
  add,
  subtract,
  multiply
}

// 导入
const { add, subtract } = require('./math')
const math = require('./math')
math.add(1, 2)
```

### 2.2 CJS 的特点

```typescript
// 1. 运行时加载：可以条件加载
if (needsFeature) {
  const feature = require('./feature')  // 动态加载
}

// 2. require 返回的是值的拷贝（非引用）
// counter.cjs
let count = 0
function increment() { count++ }
module.exports = { count, increment }

// main.cjs
const { count, increment } = require('./counter')
increment()
console.log(count)  // 0（不是 1！因为是拷贝）
```

---

## 三、ES Modules (ESM)

### 3.1 导出方式

```typescript
// math.ts
// 命名导出
export function add(a: number, b: number) { return a + b }
export function subtract(a: number, b: number) { return a - b }

// 默认导出（每个模块只能有一个）
export default class Calculator {
  static multiply(a: number, b: number) { return a * b }
}

// 聚合导出（re-export）
export { add as plus } from './math'
export * from './utils'  // 导出 utils 的所有命名导出
```

### 3.2 导入方式

```typescript
// 命名导入
import { add, subtract } from './math'

// 默认导入
import Calculator from './math'

// 混合导入
import Calculator, { add, subtract } from './math'

// 命名空间导入
import * as math from './math'
math.add(1, 2)

// 只导入副作用（不绑定任何值）
import './polyfill'  // 执行模块代码但不导入

// 类型导入（TypeScript 特有）
import type { User, Post } from './types'
```

### 3.3 ESM 的特点

```typescript
// 1. 静态分析：import 必须在顶层，不能条件加载
// ❌ 错误
if (needsFeature) {
  import { feature } from './feature'  // 语法错误
}

// ✅ 用动态 import() 代替
if (needsFeature) {
  const { feature } = await import('./feature')
}

// 2. 导出的是引用绑定（非拷贝）
// counter.ts
export let count = 0
export function increment() { count++ }

// main.ts
import { count, increment } from './counter'
increment()
console.log(count)  // 1（是引用！）

// 3. 顶层 await（ESM 支持）
const config = await fetch('/config').then(r => r.json())
export default config
```

---

## 四、Node.js 中的模块判定

### 4.1 package.json 的 type 字段

```json
// package.json
{
  "type": "commonjs"  // 默认，.js 文件按 CJS 处理
}

// 或
{
  "type": "module"    // .js 文件按 ESM 处理
}
```

### 4.2 文件扩展名规则

| 扩展名 | type: "commonjs" | type: "module" |
|--------|-----------------|----------------|
| `.js` | CJS | ESM |
| `.cjs` | CJS | CJS |
| `.mjs` | ESM | ESM |

```typescript
// 最清晰的策略：
// - 用 .ts 编写，TypeScript 编译后输出 .mjs（ESM）或 .cjs（CJS）
// - 在 package.json 中明确 "type": "module"
```

### 4.3 TypeScript 中的模块配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",        // 生成 ESM 代码
    "moduleResolution": "bundler",  // 模块解析策略
    "target": "ES2022",        // 支持顶层 await
    "esModuleInterop": true    // 允许 CJS 和 ESM 互操作
  }
}
```

### 4.4 ESM/CJS 互操作

```typescript
// 在 ESM 中导入 CJS 模块
import pkg from 'commonjs-package'  // default import 获取 module.exports
import { named } from 'commonjs-package'  // 可能不工作（取决于工具）

// 安全写法
import pkg from 'commonjs-package'
const { named } = pkg

// 在 CJS 中导入 ESM（必须动态）
async function main() {
  const esmModule = await import('./esm-module.mjs')
  esmModule.namedFunction()
}
```

---

## 五、动态导入 import()

### 5.1 基本用法

`import()` 返回一个 Promise，可以在运行时动态加载模块：

```typescript
// 条件加载
async function loadTool(toolName: string) {
  switch (toolName) {
    case 'search':
      const { SearchTool } = await import('./tools/search')
      return new SearchTool()
    case 'calculator':
      const { CalculatorTool } = await import('./tools/calculator')
      return new CalculatorTool()
    default:
      throw new Error(`未知工具: ${toolName}`)
  }
}

const tool = await loadTool('search')
```

### 5.2 Agent 中的按需加载

```typescript
// 按需加载工具，减少启动时间
class Agent {
  private tools = new Map<string, any>()

  async loadTool(name: string) {
    if (this.tools.has(name)) {
      return this.tools.get(name)
    }

    // 动态导入，只在需要时加载
    const module = await import(`./tools/${name}.js`)
    const Tool = module.default
    const instance = new Tool()
    this.tools.set(name, instance)
    return instance
  }

  async useTool(name: string, input: string) {
    const tool = await this.loadTool(name)
    return tool.execute(input)
  }
}
```

### 5.3 类型安全的动态导入

```typescript
// 定义工具接口
interface Tool {
  name: string
  execute(input: string): Promise<string>
}

// 类型安全的动态导入
async function loadToolTypeSafe(name: string): Promise<Tool> {
  try {
    const module = await import(`./tools/${name}.js`) as {
      default: new () => Tool
    }
    return new module.default()
  } catch (err) {
    throw new Error(`工具 ${name} 加载失败: ${err}`)
  }
}
```

---

## 六、tsconfig.json 核心配置

### 6.1 完整的 Agent 项目配置

```json
{
  "compilerOptions": {
    /* 基础选项 */
    "target": "ES2022",          // 编译目标，支持顶层 await
    "module": "ESNext",           // 生成 ESM 模块代码
    "moduleResolution": "bundler",// 现代模块解析策略
    "lib": ["ES2022"],            // 包含的 API 库

    /* 严格类型检查 */
    "strict": true,               // 开启所有严格检查
    "noImplicitAny": true,        // 禁止隐式 any
    "strictNullChecks": true,     // 严格 null 检查
    "noUnusedLocals": true,       // 检查未使用的局部变量
    "noUnusedParameters": true,   // 检查未使用的参数
    "noImplicitReturns": true,    // 确保函数所有路径都返回
    "noFallthroughCasesInSwitch": true, // switch 防止穿透

    /* 模块互操作 */
    "esModuleInterop": true,      // CJS/ESM 互操作
    "allowSyntheticDefaultImports": true, // 允许 default import CJS
    "resolveJsonModule": true,    // 允许 import JSON

    /* 输出 */
    "outDir": "./dist",           // 编译输出目录
    "rootDir": "./src",           // 源代码根目录
    "declaration": true,          // 生成 .d.ts 类型声明
    "sourceMap": true,            // 生成 source map
    "removeComments": false,      // 保留注释

    /* 高级 */
    "skipLibCheck": true,         // 跳过 .d.ts 类型检查（加速）
    "forceConsistentCasingInFileNames": true // 文件名大小写一致
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 6.2 关键配置详解

#### target（编译目标）

```json
"target": "ES2022"
// 决定编译后的 JS 版本
// ES2022 支持：顶层 await、类字段、Error.cause
// 如果需要兼容旧环境，用 ES2020 或更低
```

#### module（模块系统）

```json
"module": "ESNext"
// ESNext: 生成 ESM 代码（import/export）
// CommonJS: 生成 CJS 代码（require/module.exports）
// NodeNext: 根据 package.json type 自动选择
```

#### moduleResolution（模块解析）

```json
"moduleResolution": "bundler"
// node: Node.js 经典解析（CJS 风格）
// bundler: 适合 Vite/webpack 等打包工具
// NodeNext: 配合 module: "NodeNext" 使用
```

#### strict（严格模式）

```typescript
// strict: true 等价于开启以下所有选项：
// - noImplicitAny: 禁止隐式 any
// - strictNullChecks: null/undefined 需要显式处理
// - strictFunctionTypes: 函数类型严格检查
// - strictBindCallApply: bind/call/apply 严格检查
// - strictPropertyInitialization: 类属性必须初始化
// - noImplicitThis: 禁止隐式 this
// - alwaysStrict: 输出 'use strict'

// strictNullChecks 的影响：
function getUserName(user?: { name: string }) {
  return user.name  // ❌ 错误：user 可能是 undefined
  return user?.name // ✅ 可选链
  return user!.name // ✅ 非空断言（确定 user 存在时）
}
```

### 6.3 项目引用（Project References）

大型项目可以拆分为多个子项目：

```json
// tsconfig.json（根）
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

// tsconfig.app.json（前端应用）
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist/app"
  },
  "include": ["src/**/*"]
}

// tsconfig.node.json（Node.js 后端）
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist/server"
  },
  "include": ["server/**/*"]
}
```

---

## 七、ESLint 配置

### 7.1 安装

```bash
npm install -D eslint @eslint/js typescript-eslint
```

### 7.2 配置文件（Flat Config，ESLint 9+）

```javascript
// eslint.config.js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      // TypeScript 特定规则
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // 通用规则
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
    }
  },
  {
    ignores: ['dist/', 'node_modules/']
  }
)
```

### 7.3 Agent 项目特定的 ESLint 规则

```javascript
rules: {
  // 允许 async 函数中的 await
  '@typescript-eslint/await-thenable': 'error',
  // 禁止无意义的 async
  '@typescript-eslint/no-async-promise-executor': 'error',
  // 要求 Promise 错误处理
  '@typescript-eslint/no-floating-promises': 'error',
  // 禁止返回未 await 的 Promise
  '@typescript-eslint/require-await': 'warn',
  // 必须处理 Promise rejection
  '@typescript-eslint/no-misused-promises': 'error',
}
```

---

## 八、Prettier 配置

### 8.1 安装

```bash
npm install -D prettier eslint-config-prettier
```

### 8.2 配置文件

```json
// .prettierrc
{
  "semi": false,           // 不使用分号
  "singleQuote": true,     // 单引号
  "trailingComma": "es5",  // 尾随逗号
  "printWidth": 100,       // 行宽 100
  "tabWidth": 2,           // 缩进 2 空格
  "arrowParens": "always", // 箭头函数参数总是加括号
  "endOfLine": "lf"        // 统一换行符
}
```

### 8.3 ESLint 与 Prettier 集成

```javascript
// eslint.config.js
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,  // 放在最后，关闭与 Prettier 冲突的规则
  // ...
)
```

### 8.4 package.json 脚本

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 九、完整 Agent 项目骨架

### 9.1 目录结构

```
ai-agent-project/
├── src/
│   ├── index.ts              # 入口
│   ├── agent/
│   │   ├── Agent.ts          # Agent 核心类
│   │   └── types.ts          # 类型定义
│   ├── llm/
│   │   └── LLMClient.ts      # LLM 客户端
│   ├── tools/
│   │   ├── index.ts          # 工具注册表
│   │   ├── search.ts         # 搜索工具
│   │   └── calculator.ts     # 计算器工具
│   └── utils/
│       └── retry.ts          # 重试工具
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── package.json
└── .env
```

### 9.2 核心文件实现

```typescript
// src/agent/types.ts
export interface Tool {
  name: string
  description: string
  execute(input: string): Promise<string>
}

export interface AgentConfig {
  model: string
  temperature: number
  maxSteps: number
}
```

```typescript
// src/llm/LLMClient.ts
import type { AgentConfig } from '../agent/types'

export class LLMClient {
  constructor(private config: AgentConfig) {}

  async chat(prompt: string): Promise<string> {
    // 调用 LLM API...
    return `回复: ${prompt}`
  }
}
```

```typescript
// src/tools/search.ts
import type { Tool } from '../agent/types'

export class SearchTool implements Tool {
  name = 'search'
  description = '搜索互联网获取信息'

  async execute(query: string): Promise<string> {
    return `搜索结果: ${query}`
  }
}
```

```typescript
// src/tools/index.ts
export { SearchTool } from './search'
export { CalculatorTool } from './calculator'
```

```typescript
// src/agent/Agent.ts
import { LLMClient } from '../llm/LLMClient'
import type { Tool, AgentConfig } from './types'

export class Agent {
  private llm: LLMClient
  private tools: Map<string, Tool> = new Map()

  constructor(config: AgentConfig) {
    this.llm = new LLMClient(config)
  }

  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool)
  }

  async run(query: string): Promise<string> {
    return this.llm.chat(query)
  }
}
```

```typescript
// src/index.ts
import { Agent } from './agent/Agent'
import { SearchTool } from './tools'

const agent = new Agent({
  model: 'gpt-4',
  temperature: 0.7,
  maxSteps: 5
})

agent.registerTool(new SearchTool())

const result = await agent.run('你好，请介绍一下自己')
console.log(result)
```

### 9.3 package.json

```json
{
  "name": "ai-agent-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.5.0",
    "eslint": "^9.0.0",
    "@eslint/js": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "eslint-config-prettier": "^9.0.0"
  }
}
```

---

## 十、综合实战练习

### 练习 1：配置 tsconfig 支持路径别名

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@agent/*": ["src/agent/*"],
      "@tools/*": ["src/tools/*"],
      "@llm/*": ["src/llm/*"]
    }
  }
}
```

```typescript
// 使用路径别名（更清晰的导入）
import { Agent } from '@/agent/Agent'
import { SearchTool } from '@tools/search'
import { LLMClient } from '@llm/LLMClient'

// 而不是相对路径
// import { Agent } from '../../agent/Agent'
```

配合 `tsx` 或 `tsconfig-paths` 在运行时解析别名。

### 练习 2：实现环境变量管理

```typescript
// src/config/env.ts
import 'dotenv/config'

function required(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`环境变量 ${key} 未设置`)
  }
  return value
}

export const env = {
  openaiApiKey: required('OPENAI_API_KEY'),
  model: process.env.MODEL || 'gpt-4',
  temperature: Number(process.env.TEMPERATURE) || 0.7,
  maxRetries: Number(process.env.MAX_RETRIES) || 3,
} as const
```

```bash
# .env
OPENAI_API_KEY=sk-xxx
MODEL=gpt-4
TEMPERATURE=0.7
MAX_RETRIES=3
```

### 练习 3：ESLint 自定义规则检测未处理的 Promise

```javascript
// eslint.config.js 中添加规则
rules: {
  // 检测未处理的 Promise（Agent 开发中非常重要）
  '@typescript-eslint/no-floating-promises': 'error',

  // 检测 async 函数中可能的 Promise 误用
  '@typescript-eslint/no-misused-promises': [
    'error',
    {
      checksVoidReturn: {
        attributes: false
      }
    }
  ],

  // 确保 await 的目标是 Promise
  '@typescript-eslint/await-thenable': 'error',
}

// ❌ 会被 ESLint 报错
// async function bad() {
//   callLLM('hello')  // 漏了 await！floating promise
// }

// ✅ 正确
// async function good() {
//   await callLLM('hello')
// }
```

---

## 十一、学习总结

### 关键概念速查表

| 概念 | 核心要点 |
|------|---------|
| CommonJS | `require`/`module.exports`，运行时加载，值拷贝 |
| ES Modules | `import`/`export`，静态分析，引用绑定 |
| package.json type | `"module"` = ESM，`"commonjs"` = CJS |
| 动态导入 | `import()` 返回 Promise，运行时加载 |
| tsconfig strict | 开启所有严格类型检查 |
| esModuleInterop | 允许 ESM 方式导入 CJS 模块 |
| ESLint | 代码质量检查，检测潜在 bug |
| Prettier | 代码格式化，统一风格 |

### 关键收获

1. **两套模块系统**：CJS（require）是 Node.js 传统，ESM（import）是现代标准，优先使用 ESM
2. **package.json type** 决定 `.js` 文件按哪种模块处理，`.mjs`/`.cjs` 可显式指定
3. **动态导入** `import()` 可以在运行时按需加载模块，适合 Agent 工具懒加载
4. **tsconfig strict** 是 TypeScript 项目的基石，开启所有严格检查
5. **esModuleInterop** 解决 ESM 导入 CJS 的兼容问题
6. **ESLint + Prettier**：ESLint 管代码质量，Prettier 管代码格式，配合使用
7. **路径别名** `@/*` 让导入更清晰，需要 tsconfig paths + 运行时解析

### 与 AI Agent 的关联

模块系统与工程化在 Agent 开发中的应用：

- **模块拆分**：LLM 客户端、工具、Agent 逻辑、Prompt 模板分模块管理
- **动态加载**：Agent 工具按需 `import()` 加载，减少启动时间
- **类型安全**：strict 模式 + 类型导入确保 Agent 代码的类型安全
- **ESLint 规则**：`no-floating-promises` 检测漏掉的 await，防止 Agent 异步 bug
- **环境变量**：API Key 等配置通过 .env 管理，不硬编码
- **项目骨架**：标准化的目录结构和配置，是团队协作的基础

---

## 十二、学习资料

以下中文文档站点已验证可访问：

| 资源 | 链接 | 说明 |
|------|------|------|
| TypeScript 中文网 - 模块文档 | https://ts.nodejs.cn/docs/handbook/modules.html | 官方模块系统中文文档 |
| 掘金 - ESM 与 CommonJS 全面对比 | https://juejin.cn/post/7501295666687033382 | 加载机制、作用域、语法对比 |
| 掘金 - Node.js 模块化全面指南 | https://juejin.cn/post/7537708966147948578 | CJS 和 ESM 实战指南 |
| 博客园 - CommonJS 和 ES Module 本质区别 | https://www.cnblogs.com/smileZAZ/p/19646596 | 静态依赖 vs 动态加载 |
| 菜鸟教程 - TypeScript 教程 | https://www.runoob.com/typescript/ts-tutorial.html | 含 tsconfig 基础 |
| TypeScript 中文网 - 手册入口 | https://ts.nodejs.cn/docs/handbook/intro.html | 完整手册导航 |

> **提示**：TypeScript 中文网（ts.nodejs.cn）是国内可访问的官方文档中文镜像，模块、tsconfig 等文档均可在此查阅。ESLint 和 Prettier 建议参考官方英文文档，配置相对简单。

---

## 十三、明日预告

**Day 5：Node.js Stream 与 Buffer**

- Buffer：二进制数据处理
- Stream 四大类型：Readable、Writable、Duplex、Transform
- 背压机制（Backpressure）
- pipeline 现代写法
- LLM 流式响应实战

从 TypeScript 工程化过渡到 Node.js 核心能力。Stream 是处理 LLM 流式响应的底层基础，Buffer 是数据传输的容器。掌握它们，你就理解了 ChatGPT 逐字输出的原理。

---

> 🛠️ Day 4 完成！模块系统和工程化配置是构建可维护 Agent 项目的地基。打好这个地基，后续的框架学习和项目实战才能稳如泰山。
