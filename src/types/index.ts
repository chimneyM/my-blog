export interface PostMeta {
  id: string
  title: string
  slug: string
  date: string
  tags: string[]
  excerpt: string
  readingTime: number
}

export interface Post extends PostMeta {
  content: string
}

export type ThemeMode = 'light' | 'dark'
