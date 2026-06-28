import { create } from 'zustand'
import { posts as allPosts } from '../data/posts'
import type { Post, PostMeta } from '../types'

interface BlogState {
  posts: Post[]
  searchQuery: string
  selectedTag: string | null
  filteredPosts: PostMeta[]
  setSearchQuery: (query: string) => void
  setSelectedTag: (tag: string | null) => void
  getPostBySlug: (slug: string) => Post | undefined
  getAllTags: () => string[]
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
  posts: allPosts,
  searchQuery: '',
  selectedTag: null,
  filteredPosts: allPosts,

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
}))
