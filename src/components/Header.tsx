import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/blog', label: '博客' },
  { path: '/about', label: '关于' },
]

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // 路由切换时关闭菜单
  useEffect(() => {
    setMobileNavOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  // 用户名首字母作为头像文字，未登录显示默认头像
  const avatarText = user ? user.charAt(0).toUpperCase() : '👤'
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          chimneyM
        </Link>

        {/* PC 端导航 */}
        <nav className="nav nav-desktop">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={'nav-link' + (isActive(link.path) ? ' active' : '')}
            >
              {link.label}
            </Link>
          ))}

          <div className="user-menu" ref={menuRef}>
            <button
              className="avatar-btn"
              onClick={() => {
                if (isAuthenticated) {
                  setMenuOpen((v) => !v)
                } else {
                  navigate('/login')
                }
              }}
              aria-label={isAuthenticated ? '用户菜单' : '登录'}
            >
              <span className={'avatar' + (isAuthenticated ? '' : ' avatar-icon')}>{avatarText}</span>
              {isAuthenticated && <span className="user-name">{user}</span>}
              {isAuthenticated && (
                <span className={'arrow' + (menuOpen ? ' up' : '')}>▾</span>
              )}
            </button>
            {isAuthenticated && menuOpen && (
              <div className="dropdown-menu">
                <Link to="/admin" className={'dropdown-item' + (isActive('/admin') ? ' active' : '')}>
                  <span className="dropdown-icon">⚙️</span>
                  管理后台
                </Link>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  退出登录
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* 移动端工具栏 */}
        <div className="nav-mobile-actions">
          <div className="user-menu" ref={menuRef}>
            <button
              className="avatar-btn"
              onClick={() => {
                if (isAuthenticated) {
                  setMenuOpen((v) => !v)
                } else {
                  navigate('/login')
                }
              }}
              aria-label={isAuthenticated ? '用户菜单' : '登录'}
            >
              <span className={'avatar' + (isAuthenticated ? '' : ' avatar-icon')}>{avatarText}</span>
              {isAuthenticated && (
                <span className={'arrow' + (menuOpen ? ' up' : '')}>▾</span>
              )}
            </button>
            {isAuthenticated && menuOpen && (
              <div className="dropdown-menu">
                <Link to="/admin" className={'dropdown-item' + (isActive('/admin') ? ' active' : '')}>
                  <span className="dropdown-icon">⚙️</span>
                  管理后台
                </Link>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  退出登录
                </button>
              </div>
            )}
          </div>

          <button
            className="hamburger"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="菜单"
          >
            <span className={mobileNavOpen ? 'open' : ''}></span>
            <span className={mobileNavOpen ? 'open' : ''}></span>
            <span className={mobileNavOpen ? 'open' : ''}></span>
          </button>
        </div>
      </div>

      {/* 移动端导航抽屉 */}
      <div className={'mobile-nav' + (mobileNavOpen ? ' open' : '')}>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={'mobile-nav-link' + (isActive(link.path) ? ' active' : '')}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  )
}
