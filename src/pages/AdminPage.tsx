import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBlogStore } from '../stores/blogStore'
import { useAuthStore } from '../stores/authStore'

export default function AdminPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const posts = useBlogStore((s) => s.posts)
  const loading = useBlogStore((s) => s.loading)
  const fetchPosts = useBlogStore((s) => s.fetchPosts)
  const deletePost = useBlogStore((s) => s.deletePost)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleDelete = async (slug: string) => {
    if (!window.confirm('确定删除这篇文章？')) return
    setDeleting(slug)
    await deletePost(slug)
    setDeleting(null)
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>后台管理</h1>
        <div className="admin-actions">
          <Link to="/admin/new" className="btn btn-primary">写新文章</Link>
          <button className="btn btn-secondary" onClick={() => { logout(); navigate('/') }}>
            退出登录
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">加载中...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>日期</th>
              <th>标签</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>
                  <Link to={`/blog/${post.slug}`} className="admin-post-title">{post.title}</Link>
                </td>
                <td className="admin-date">{post.date}</td>
                <td>
                  <div className="admin-tags">
                    {post.tags.map((tag) => (
                      <span key={tag} className="admin-tag">{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="admin-actions-cell">
                  <Link to={`/admin/edit/${post.slug}`} className="btn-sm">编辑</Link>
                  <button
                    className="btn-sm btn-danger"
                    onClick={() => handleDelete(post.slug)}
                    disabled={deleting === post.slug}
                  >
                    {deleting === post.slug ? '删除中...' : '删除'}
                  </button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-cell">暂无文章</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
