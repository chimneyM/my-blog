// Helper script to add Day 3 and Day 4 blog posts to posts.json and posts.ts
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const blogRoot = join(__dirname, '..')

// Read markdown contents
const mdDay3 = readFileSync(join(blogRoot, 'post_examples/day3-typescript-async-await.md'), 'utf8')
const mdDay4 = readFileSync(join(blogRoot, 'post_examples/day4-typescript-modules-tooling.md'), 'utf8')

// Define new post entries
const day3Post = {
  id: '10',
  title: 'AI Agent 学习计划 Day 3：TypeScript Async/Await 与 Promise',
  slug: 'ai-agent-day3-typescript-async-await',
  date: '2026-07-04',
  tags: ['TypeScript', 'AI Agent', '学习笔记'],
  excerpt: 'AI Agent 84 天学习计划第三天。系统学习 TypeScript 异步编程：回调地狱、Promise 三态与链式调用、async/await 语法糖、并发控制（Promise.all/race/allSettled/any）、错误处理策略、串行与并行、并发限制器，并实现带重试的 LLM 调用、多步推理 Agent、批量处理等实战应用。',
  readingTime: 30,
  content: mdDay3
}

const day4Post = {
  id: '11',
  title: 'AI Agent 学习计划 Day 4：TypeScript 模块系统与工程化配置',
  slug: 'ai-agent-day4-typescript-modules-tooling',
  date: '2026-07-05',
  tags: ['TypeScript', 'AI Agent', '学习笔记'],
  excerpt: 'AI Agent 84 天学习计划第四天。系统学习 TypeScript 模块系统与工程化：CommonJS vs ES Modules 区别与互操作、动态导入 import()、tsconfig.json 核心配置（strict/module/target/moduleResolution）、ESLint Flat Config + Prettier 集成、路径别名、环境变量管理，并搭建完整 Agent 项目骨架。',
  readingTime: 30,
  content: mdDay4
}

// 1. Update posts.json - insert in chronological order (after Day 2 id:6, before Day 5 id:7)
const postsJsonPath = join(blogRoot, 'server/data/posts.json')
const postsJson = JSON.parse(readFileSync(postsJsonPath, 'utf8'))

// Find Day 2 (id 6) index and insert after it
const day2Index = postsJson.findIndex(p => p.id === '6')
if (day2Index === -1) throw new Error('Day 2 (id 6) not found in posts.json')

// Insert Day 3 and Day 4 after Day 2 (day3 first, then day4 for chronological order)
postsJson.splice(day2Index + 1, 0, day3Post, day4Post)

writeFileSync(postsJsonPath, JSON.stringify(postsJson, null, 2), 'utf8')
console.log('✅ posts.json updated with Day 3 (id:10) and Day 4 (id:11)')

// 2. Update posts.ts - escape backticks and ${ for template literals
function escapeForTemplateLiteral(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')
}

function makeTsEntry(post) {
  const escapedContent = escapeForTemplateLiteral(post.content)
  return `  {
    id: '${post.id}',
    title: \`${post.title}\`,
    slug: '${post.slug}',
    date: '${post.date}',
    tags: ['${post.tags.join("', '")}'],
    excerpt: \`${escapeForTemplateLiteral(post.excerpt)}\`,
    readingTime: ${post.readingTime},
    content: \`${escapedContent}\`
  },`
}

const day3TsEntry = makeTsEntry(day3Post)
const day4TsEntry = makeTsEntry(day4Post)

const postsTsPath = join(blogRoot, 'src/data/posts.ts')
let postsTs = readFileSync(postsTsPath, 'utf8')

// Find Day 2 entry (id: '6') and insert Day 3 and Day 4 after it
// Day 2 entry in posts.ts starts with "    id: '6',"
// We need to find the entry and insert after its closing "  },"
const day2TsPattern = "    id: '6',"
const day2TsIndex = postsTs.indexOf(day2TsPattern)
if (day2TsIndex === -1) throw new Error("Day 2 (id: '6') not found in posts.ts")

// Find the closing "  }," of Day 2 entry
const closingBraceIndex = postsTs.indexOf('  },', day2TsIndex)
if (closingBraceIndex === -1) throw new Error("Could not find closing brace for Day 2 in posts.ts")

// Insert Day 3 and Day 4 after Day 2's closing brace
const insertPosition = closingBraceIndex + '  },'.length
postsTs =
  postsTs.slice(0, insertPosition) +
  '\n' + day3TsEntry +
  '\n' + day4TsEntry +
  postsTs.slice(insertPosition)

writeFileSync(postsTsPath, postsTs, 'utf8')
console.log('✅ posts.ts updated with Day 3 (id:10) and Day 4 (id:11)')
