import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBlogStore } from '../stores/blogStore'

export default function AdminPostForm() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const posts = useBlogStore((s) => s.posts)
  const fetchPosts = useBlogStore((s) => s.fetchPosts)
  const createPost = useBlogStore((s) => s.createPost)
  const updatePost = useBlogStore((s) => s.updatePost)
  const isEdit = !!slug

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    if (isEdit && posts.length > 0) {
      const post = posts.find((p) => p.slug === slug)
      if (post) {
        setTitle(post.title)
        setContent(post.content)
        setTags(post.tags.join(', '))
      }
    }
  }, [isEdit, slug, posts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) return
    setSaving(true)

    const tagList = tags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)

    const data = {
      title,
      content: content.trim(),
      tags: tagList,
    }

    const ok = isEdit
      ? await updatePost(slug!, data)
      : await createPost(data)

    setSaving(false)
    if (ok) navigate('/admin')
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{isEdit ? '编辑文章' : '写新文章'}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
          返回
        </button>
      </div>

      <form className="post-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">标题</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入文章标题"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">标签（用逗号分隔）</label>
          <input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="React, TypeScript, Vite"
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">内容（支持 Markdown）</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在这里写文章..."
            rows={20}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving || !title || !content}>
            {saving ? '保存中...' : isEdit ? '更新文章' : '发布文章'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin')}>
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
