import { Link } from 'react-router-dom'
import { useBlogStore } from '../stores/blogStore'
import PostCard from '../components/PostCard'

export default function HomePage() {
  const posts = useBlogStore((s) => s.posts)
  const recentPosts = posts.slice(0, 3)

  return (
    <div className="home-page">
      <section className="hero">
        <h1 className="hero-title">chimneyM</h1>
        <p className="hero-subtitle">
          记录技术思考、前端实践与个人成长。偶尔写一些有意思的东西。
        </p>
        <div className="hero-actions">
          <Link to="/blog" className="btn btn-primary">
            浏览博客
          </Link>
          <Link to="/about" className="btn btn-secondary">
            关于我
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>最新文章</h2>
          <Link to="/blog" className="section-link">查看全部 →</Link>
        </div>
        <div className="post-list">
          {recentPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  )
}
