// Corrected script: restore clean posts.ts and insert Day 3 + Day 4 correctly
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const blogRoot = join(__dirname, '..')

// 1. Restore clean version from git backup
const cleanPostsTs = readFileSync('/tmp/posts_ts_backup.ts', 'utf8')

// 2. Read markdown contents
const mdDay3 = readFileSync(join(blogRoot, 'post_examples/day3-typescript-async-await.md'), 'utf8')
const mdDay4 = readFileSync(join(blogRoot, 'post_examples/day4-typescript-modules-tooling.md'), 'utf8')

// 3. Escape for template literals
function escapeForTemplateLiteral(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')
}

// 4. Build TS entries
function makeTsEntry(post) {
  return `  {
    id: '${post.id}',
    title: \`${post.title}\`,
    slug: '${post.slug}',
    date: '${post.date}',
    tags: ['${post.tags.join("', '")}'],
    excerpt: \`${escapeForTemplateLiteral(post.excerpt)}\`,
    readingTime: ${post.readingTime},
    content: \`${escapeForTemplateLiteral(post.content)}\`
  },`
}

const day3Entry = makeTsEntry({
  id: '12',
  title: 'AI Agent 学习计划 Day 3：TypeScript Async/Await 与 Promise',
  slug: 'ai-agent-day3-typescript-async-await',
  date: '2026-07-04',
  tags: ['TypeScript', 'AI Agent', '学习笔记'],
  excerpt: 'AI Agent 84 天学习计划第三天。系统学习 TypeScript 异步编程：回调地狱、Promise 三态与链式调用、async/await 语法糖、并发控制（Promise.all/race/allSettled/any）、错误处理策略、串行与并行、并发限制器，并实现带重试的 LLM 调用、多步推理 Agent、批量处理等实战应用。',
  readingTime: 30,
  content: mdDay3
})

const day4Entry = makeTsEntry({
  id: '13',
  title: 'AI Agent 学习计划 Day 4：TypeScript 模块系统与工程化配置',
  slug: 'ai-agent-day4-typescript-modules-tooling',
  date: '2026-07-05',
  tags: ['TypeScript', 'AI Agent', '学习笔记'],
  excerpt: 'AI Agent 84 天学习计划第四天。系统学习 TypeScript 模块系统与工程化：CommonJS vs ES Modules 区别与互操作、动态导入 import()、tsconfig.json 核心配置（strict/module/target/moduleResolution）、ESLint Flat Config + Prettier 集成、路径别名、环境变量管理，并搭建完整 Agent 项目骨架。',
  readingTime: 30,
  content: mdDay4
})

// 5. Find Day 1 entry (id: '5') and insert Day 3 + Day 4 before it
// This ensures they go after Day 2 (id: '6') and before Day 1 (id: '5') chronologically
// The pattern to find is "  {\n    id: '5',"
const day1Pattern = "  {\n    id: '5',"
const day1Index = cleanPostsTs.indexOf(day1Pattern)
if (day1Index === -1) throw new Error("Day 1 (id: '5') not found in clean posts.ts")

// Insert Day 3 and Day 4 before Day 1 entry
const updatedPostsTs =
  cleanPostsTs.slice(0, day1Index) +
  day3Entry + '\n' +
  day4Entry + '\n' +
  cleanPostsTs.slice(day1Index)

const postsTsPath = join(blogRoot, 'src/data/posts.ts')
writeFileSync(postsTsPath, updatedPostsTs, 'utf8')
console.log('✅ posts.ts restored and updated with Day 3 (id:12) and Day 4 (id:13)')
console.log('   Inserted before Day 1 (id:5), after Day 2 (id:6)')
