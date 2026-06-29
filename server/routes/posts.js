import { Router } from 'express'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { authMiddleware } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_FILE = join(__dirname, '..', 'data', 'posts.json')

function readPosts() {
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writePosts(posts) {
  writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf-8')
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '')
}

const router = Router()

// Public: get all posts
router.get('/', (req, res) => {
  const posts = readPosts()
  res.json(posts)
})

// Public: get single post
router.get('/:slug', (req, res) => {
  const posts = readPosts()
  const post = posts.find((p) => p.slug === req.params.slug)
  if (!post) return res.status(404).json({ error: '文章不存在' })
  res.json(post)
})

// Protected: create post
router.post('/', authMiddleware, (req, res) => {
  const { title, content, tags, excerpt, readingTime } = req.body
  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容不能为空' })
  }
  const posts = readPosts()
  const slug = slugify(title)
  const id = String(Date.now())
  const newPost = {
    id,
    title,
    slug,
    date: new Date().toISOString().slice(0, 10),
    tags: tags || [],
    excerpt: excerpt || content.slice(0, 120).replace(/[#*`\n]/g, '').trim(),
    readingTime: readingTime || Math.max(1, Math.ceil(content.length / 500)),
    content,
  }
  posts.unshift(newPost)
  writePosts(posts)
  res.status(201).json(newPost)
})

// Protected: update post
router.put('/:slug', authMiddleware, (req, res) => {
  const { title, content, tags, excerpt, readingTime } = req.body
  const posts = readPosts()
  const idx = posts.findIndex((p) => p.slug === req.params.slug)
  if (idx === -1) return res.status(404).json({ error: '文章不存在' })

  posts[idx] = {
    ...posts[idx],
    title: title || posts[idx].title,
    slug: title ? slugify(title) : posts[idx].slug,
    tags: tags !== undefined ? tags : posts[idx].tags,
    excerpt: excerpt !== undefined ? excerpt : posts[idx].excerpt,
    readingTime: readingTime !== undefined ? readingTime : posts[idx].readingTime,
    content: content !== undefined ? content : posts[idx].content,
  }
  writePosts(posts)
  res.json(posts[idx])
})

// Protected: delete post
router.delete('/:slug', authMiddleware, (req, res) => {
  let posts = readPosts()
  const idx = posts.findIndex((p) => p.slug === req.params.slug)
  if (idx === -1) return res.status(404).json({ error: '文章不存在' })
  posts.splice(idx, 1)
  writePosts(posts)
  res.json({ success: true })
})

export default router
