import { useParams, Link } from 'react-router-dom'
import { useBlogStore } from '../stores/blogStore'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { useEffect } from 'react'

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = useBlogStore((s) => s.getPostBySlug(slug ?? ''))
  const setSelectedTag = useBlogStore((s) => s.setSelectedTag)

  useEffect(() => {
    if (post) {
      document.title = `${post.title} - Codex 博客`
    }
    return () => {
      document.title = 'Codex 博客'
    }
  }, [post])

  if (!post) {
    return (
      <div className="not-found">
        <h1>文章未找到</h1>
        <p>你访问的文章不存在或已被删除。</p>
        <Link to="/blog" className="btn btn-primary">
          返回博客列表
        </Link>
      </div>
    )
  }

  return (
    <article className="post-page">
      <header className="post-header">
        <Link to="/blog" className="back-link">← 返回博客列表</Link>
        <h1 className="post-title">{post.title}</h1>
        <div className="post-meta">
          <time dateTime={post.date}>{post.date}</time>
          <span className="reading-time">{post.readingTime} 分钟阅读</span>
        </div>
        <div className="post-tags">
          {post.tags.map((tag) => (
            <button
              key={tag}
              className="tag"
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </header>
      <MarkdownRenderer content={post.content} />
    </article>
  )
}
