#!/usr/bin/env node
// 发布一篇学习笔记到 my-blog：解析 Markdown frontmatter，
// 同步追加到 server/data/posts.json 与 src/data/posts.ts。
//
// 用法：
//   node scripts/publish-post.mjs <path-to-md> [--push]
//   --push  发布后自动 git add/commit/push 到 origin/main
//
// Markdown 头部需包含 frontmatter：
//   ---
//   id: "18"
//   title: "..."
//   slug: "..."
//   date: "2026-07-17"
//   tags: ["AI Agent", "学习笔记"]
//   excerpt: "..."
//   readingTime: 32
//   ---

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const mdPath = process.argv[2]
if (!mdPath) {
  console.error('用法: node scripts/publish-post.mjs <path-to-md> [--push]')
  process.exit(1)
}
const doPush = process.argv.includes('--push')

// 1. 读取并拆分 frontmatter / 正文
const raw = readFileSync(resolve(root, mdPath), 'utf8')
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
if (!fmMatch) {
  console.error('未找到 frontmatter（--- 包裹的元数据块）')
  process.exit(1)
}
const fmText = fmMatch[1]
const content = fmMatch[2].trim()

function parseValue(v) {
  v = v.trim()
  if ((v.startsWith('[') && v.endsWith(']'))) return JSON.parse(v)
  if ((v.startsWith('"') && v.endsWith('"'))) return v.slice(1, -1)
  if ((v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1)
  if (/^\d+$/.test(v)) return Number(v)
  return v
}

const meta = {}
for (const line of fmText.split('\n')) {
  if (!line.trim() || line.trim().startsWith('#')) continue
  const i = line.indexOf(':')
  if (i === -1) continue
  const key = line.slice(0, i).trim()
  meta[key] = parseValue(line.slice(i + 1))
}

for (const k of ['id', 'title', 'slug', 'date', 'tags', 'excerpt', 'readingTime']) {
  if (meta[k] === undefined) {
    console.error(`frontmatter 缺少字段: ${k}`)
    process.exit(1)
  }
}

const post = {
  id: String(meta.id),
  title: meta.title,
  slug: meta.slug,
  date: meta.date,
  tags: meta.tags,
  excerpt: meta.excerpt,
  readingTime: Number(meta.readingTime),
  content,
}

// 2. 写入 posts.json（去重：slug 已存在则跳过）
const jsonPath = resolve(root, 'server/data/posts.json')
const posts = JSON.parse(readFileSync(jsonPath, 'utf8'))
if (posts.some((p) => p.slug === post.slug)) {
  console.log(`跳过（已存在 slug: ${post.slug}）`)
  process.exit(0)
}
posts.push(post)
writeFileSync(jsonPath, JSON.stringify(posts, null, 2) + '\n', 'utf8')
console.log(`✓ posts.json 已追加（共 ${posts.length} 篇）`)

// 3. 写入 posts.ts（在末尾 ] 前插入对象，content 用 JSON 字符串保证转义安全）
const tsPath = resolve(root, 'src/data/posts.ts')
let ts = readFileSync(tsPath, 'utf8')
if (ts.includes(`slug: '${post.slug}'`) || ts.includes(`slug: "${post.slug}"`)) {
  console.log(`跳过（posts.ts 已存在 slug: ${post.slug}）`)
} else {
  const entry = `  {\n    id: ${JSON.stringify(post.id)},\n    title: ${JSON.stringify(post.title)},\n    slug: ${JSON.stringify(post.slug)},\n    date: ${JSON.stringify(post.date)},\n    tags: ${JSON.stringify(post.tags)},\n    excerpt: ${JSON.stringify(post.excerpt)},\n    readingTime: ${post.readingTime},\n    content: ${JSON.stringify(post.content)},\n  }`
  const closeIdx = ts.lastIndexOf(']')
  if (closeIdx === -1) {
    console.error('posts.ts 未找到数组结尾 ]')
    process.exit(1)
  }
  ts = ts.slice(0, closeIdx) + ',\n' + entry + '\n' + ts.slice(closeIdx)
  writeFileSync(tsPath, ts, 'utf8')
  console.log('✓ posts.ts 已追加')
}

// 4. 可选：提交并推送
if (doPush) {
  const msg = `feat: 添加 ${post.title}`
  execSync('git add -A', { cwd: root, stdio: 'inherit' })
  execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd: root, stdio: 'inherit' })
  execSync('git push origin main', { cwd: root, stdio: 'inherit' })
  console.log('✓ 已提交并推送到 origin/main')
}
