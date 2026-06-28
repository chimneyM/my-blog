import { Outlet } from 'react-router-dom'
import Header from './Header'
import ParticleBackground from './ParticleBackground'
import { useThemeStore } from '../stores/themeStore'
import { useEffect } from 'react'

export default function Layout() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="app-layout">
      <ParticleBackground />
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <p>&copy; {new Date().getFullYear()} chimneyM. Built with React + Zustand.</p>
        </div>
      </footer>
    </div>
  )
}
