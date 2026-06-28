import { Link, useLocation } from 'react-router-dom'
import { useThemeStore } from '../stores/themeStore'

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/blog', label: '博客' },
  { path: '/about', label: '关于' },
]

export default function Header() {
  const { theme, toggleTheme } = useThemeStore()
  const location = useLocation()

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          Codex 博客
        </Link>
        <nav className="nav">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link${location.pathname === link.path ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
      </div>
    </header>
  )
}
