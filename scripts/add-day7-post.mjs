// Helper script to add Day 7 blog post to posts.json and posts.ts
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const blogRoot = join(__dirname, '..')

// 1. Read the markdown content
const mdContent = readFileSync(join(blogRoot, 'post_examples/day7-nodejs-event-emitter.md'), 'utf8')

// 2. Define the new post entry
const newPost = {
  id: '9',
  title: 'AI Agent 学习计划 Day 7：Node.js Event Emitter（事件触发器）',
  slug: 'ai-agent-day7-nodejs-event-emitter',
  date: '2026-07-08',
  tags: ['Node.js', 'AI Agent', '学习笔记'],
  excerpt: 'AI Agent 84 天学习计划第七天。系统学习 Node.js Event Emitter：发布-订阅模式、核心 API（on/emit/once/off）、错误事件处理、异步监听器、events.once/events.on Promise 化、内存泄漏防范、自定义 EventEmitter 类，并实现事件驱动的多 Agent 协作系统（事件总线、生命周期事件、松耦合架构）。',
  readingTime: 30,
  content: mdContent
}

// 3. Update posts.json
const postsJsonPath = join(blogRoot, 'server/data/posts.json')
const postsJson = JSON.parse(readFileSync(postsJsonPath, 'utf8'))
postsJson.unshift(newPost)
writeFileSync(postsJsonPath, JSON.stringify(postsJson, null, 2), 'utf8')
console.log('✅ posts.json updated with id:9')

// 4. Update posts.ts - escape backticks and ${ for template literals
const escapedContent = mdContent
  .replace(/\\/g, '\\\\')   // escape backslashes first
  .replace(/`/g, '\\`')     // escape backticks
  .replace(/\$\{/g, '\\${') // escape ${

const newPostTs = `  {
    id: '9',
    title: \`AI Agent 学习计划 Day 7：Node.js Event Emitter（事件触发器）\`,
    slug: 'ai-agent-day7-nodejs-event-emitter',
    date: '2026-07-08',
    tags: ['Node.js', 'AI Agent', '学习笔记'],
    excerpt: \`AI Agent 84 天学习计划第七天。系统学习 Node.js Event Emitter：发布-订阅模式、核心 API（on/emit/once/off）、错误事件处理、异步监听器、events.once/events.on Promise 化、内存泄漏防范、自定义 EventEmitter 类，并实现事件驱动的多 Agent 协作系统（事件总线、生命周期事件、松耦合架构）。\`,
    readingTime: 30,
    content: \`${escapedContent}\`
  },`

const postsTsPath = join(blogRoot, 'src/data/posts.ts')
let postsTs = readFileSync(postsTsPath, 'utf8')
// Insert after "export const posts: Post[] = [" 
postsTs = postsTs.replace(
  'export const posts: Post[] = [\n',
  `export const posts: Post[] = [\n${newPostTs}\n`
)
writeFileSync(postsTsPath, postsTs, 'utf8')
console.log('✅ posts.ts updated with id:9')
