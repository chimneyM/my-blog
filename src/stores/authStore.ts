import { create } from 'zustand'

const API = '/api'

interface AuthState {
  isAuthenticated: boolean
  user: string | null
  token: string | null
  loading: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: !!localStorage.getItem('blog-token'),
  user: localStorage.getItem('blog-user'),
  token: localStorage.getItem('blog-token'),
  loading: false,

  login: async (password: string) => {
    set({ loading: true })
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) return false
      const data = await res.json()
      localStorage.setItem('blog-token', data.token)
      localStorage.setItem('blog-user', data.user)
      set({ isAuthenticated: true, user: data.user, token: data.token, loading: false })
      return true
    } catch {
      set({ loading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('blog-token')
    localStorage.removeItem('blog-user')
    set({ isAuthenticated: false, user: null, token: null })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('blog-token')
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null })
      return
    }
    try {
      const res = await fetch(`${API}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        set({ isAuthenticated: true, user: localStorage.getItem('blog-user'), token })
      } else {
        get().logout()
      }
    } catch {
      // offline - keep current state
    }
  },
}))
