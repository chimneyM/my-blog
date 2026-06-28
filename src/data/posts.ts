import type { Post } from '../types'

export const posts: Post[] = [
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
