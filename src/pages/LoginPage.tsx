import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const loading = useAuthStore((s) => s.loading)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const ok = await login(password)
    if (ok) {
      navigate('/admin')
    } else {
      setError('密码错误')
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>管理员登录</h1>
        <div className="form-group">
          <label htmlFor="password">密码</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            autoFocus
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading || !password}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  )
}
