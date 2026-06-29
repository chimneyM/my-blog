import { create } from 'zustand'
import type { Post, PostMeta } from '../types'

const API = '/api'

function getToken() {
  return localStorage.getItem('blog-token')
}

interface BlogState {
  posts: Post[]
  searchQuery: string
  selectedTag: string | null
  filteredPosts: PostMeta[]
  loading: boolean
  setSearchQuery: (query: string) => void
  setSelectedTag: (tag: string | null) => void
  getPostBySlug: (slug: string) => Post | undefined
  getAllTags: () => string[]
  fetchPosts: () => Promise<void>
  createPost: (data: Partial<Post>) => Promise<boolean>
  updatePost: (slug: string, data: Partial<Post>) => Promise<boolean>
  deletePost: (slug: string) => Promise<boolean>
}

function filterPosts(posts: Post[], query: string, tag: string | null): PostMeta[] {
  return posts.filter((post) => {
    const matchesSearch =
      !query ||
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
    const matchesTag = !tag || post.tags.includes(tag)
    return matchesSearch && matchesTag
  })
}

export const useBlogStore = create<BlogState>((set, get) => ({
  posts: [],
  searchQuery: '',
  selectedTag: null,
  filteredPosts: [],
  loading: false,

  fetchPosts: async () => {
    set({ loading: true })
    try {
      const res = await fetch(`${API}/posts`)
      const posts: Post[] = await res.json()
      const { searchQuery, selectedTag } = get()
      set({
        posts,
        filteredPosts: filterPosts(posts, searchQuery, selectedTag),
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
    const { selectedTag, posts } = get()
    set({ filteredPosts: filterPosts(posts, query, selectedTag) })
  },

  setSelectedTag: (tag: string | null) => {
    set({ selectedTag: tag })
    const { searchQuery, posts } = get()
    set({ filteredPosts: filterPosts(posts, searchQuery, tag) })
  },

  getPostBySlug: (slug: string) => {
    return get().posts.find((p) => p.slug === slug)
  },

  getAllTags: () => {
    const tagSet = new Set<string>()
    get().posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  },

  createPost: async (data) => {
    const token = getToken()
    if (!token) return false
    try {
      const res = await fetch(`${API}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      if (!res.ok) return false
      await get().fetchPosts()
      return true
    } catch {
      return false
    }
  },

  updatePost: async (slug, data) => {
    const token = getToken()
    if (!token) return false
    try {
      const res = await fetch(`${API}/posts/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      if (!res.ok) return false
      await get().fetchPosts()
      return true
    } catch {
      return false
    }
  },

  deletePost: async (slug) => {
    const token = getToken()
    if (!token) return false
    try {
      const res = await fetch(`${API}/posts/${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return false
      await get().fetchPosts()
      return true
    } catch {
      return false
    }
  },
}))
