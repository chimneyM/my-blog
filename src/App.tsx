import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import BlogPage from './pages/BlogPage'
import PostPage from './pages/PostPage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import AdminPostForm from './pages/AdminPostForm'
import { useAuthStore } from './stores/authStore'
import { useBlogStore } from './stores/blogStore'

function AdminGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return (
      <div className="admin-page" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h1>请先登录</h1>
        <p style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>需要管理员权限</p>
        <a href="/login" className="btn btn-primary">前往登录</a>
      </div>
    )
  }
  return <>{children}</>
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const fetchPosts = useBlogStore((s) => s.fetchPosts)

  useEffect(() => {
    checkAuth()
    fetchPosts()
  }, [checkAuth, fetchPosts])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<PostPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
          <Route path="admin/new" element={<AdminGuard><AdminPostForm /></AdminGuard>} />
          <Route path="admin/edit/:slug" element={<AdminGuard><AdminPostForm /></AdminGuard>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
