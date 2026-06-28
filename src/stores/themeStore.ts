import { create } from 'zustand'
import type { ThemeMode } from '../types'

interface ThemeState {
  theme: ThemeMode
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
}

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('blog-theme') as ThemeMode | null
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('blog-theme', next)
      return { theme: next }
    }),
  setTheme: (theme: ThemeMode) => {
    localStorage.setItem('blog-theme', theme)
    set({ theme })
  },
}))
