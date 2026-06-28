import { Link } from 'react-router-dom'
import type { PostMeta } from '../types'
import { useBlogStore } from '../stores/blogStore'

interface PostCardProps {
  post: PostMeta
}

export default function PostCard({ post }: PostCardProps) {
  const setSelectedTag = useBlogStore((s) => s.setSelectedTag)

  return (
    <article className="post-card">
      <div className="post-card-meta">
        <time dateTime={post.date}>{post.date}</time>
        <span className="reading-time">{post.readingTime} 分钟阅读</span>
      </div>
      <Link to={`/blog/${post.slug}`} className="post-card-title">
        {post.title}
      </Link>
      <p className="post-card-excerpt">{post.excerpt}</p>
      <div className="post-card-tags">
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
    </article>
  )
}
