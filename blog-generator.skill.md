---
name: blog-generator
description: Generate a full-featured personal blog website using React, TypeScript, Vite, and Zustand state management. Use when the user asks to create a blog, personal website, writing platform, or content site from scratch. This skill covers scaffolding, state management with Zustand, Markdown rendering, tagging/search, responsive design, dark/light themes, and project setup end-to-end. Default to this skill whenever a user wants a Node.js + TypeScript blog regardless of how they phrase it.
---

# Blog Generator Skill

Use this skill when a user asks you to build a personal blog website. Follow these instructions in order.

## Project Scaffolding

### 1. Create the project structure

```
my-blog/
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── index.html
├── .gitignore
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Router setup
│   ├── vite-env.d.ts         # Vite type declarations
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── data/
│   │   └── posts.ts          # Blog post data (Markdown content + metadata)
│   ├── stores/
│   │   ├── blogStore.ts      # Zustand store for blog posts, search, tags
│   │   └── themeStore.ts     # Zustand store for dark/light theme
│   ├── pages/
│   │   ├── HomePage.tsx      # Landing/hero page
│   │   ├── BlogPage.tsx      # Blog listing with search & tag filter
│   │   ├── PostPage.tsx      # Single article view with Markdown rendering
│   │   └── AboutPage.tsx     # About the author
│   ├── components/
│   │   ├── Layout.tsx        # App shell with header + footer + Outlet
│   │   ├── Header.tsx        # Navigation bar + theme toggle
│   │   ├── PostCard.tsx      # Blog post summary card
│   │   └── MarkdownRenderer.tsx  # Markdown -> HTML with syntax highlighting
│   └── styles/
│       └── index.css         # Global styles with theme variables
```

### 2. Package dependencies

These are the required packages:

**Runtime dependencies:**
- `react`, `react-dom` (^18.3+)
- `react-router-dom` (^6.26+) — routing
- `zustand` (^4.5+) — state management
- `react-markdown` (^9.0+) — Markdown rendering
- `remark-gfm` (^4.0+) — GitHub Flavored Markdown support
- `react-syntax-highlighter` (^15.5+) — Code block highlighting
- `@types/react-syntax-highlighter` — TypeScript types

**Dev dependencies:**
- `typescript` (^5.5+)
- `@types/react`, `@types/react-dom`
- `@vitejs/plugin-react` (^4.3+)
- `vite` (^5.4+)

### 3. Configuration files

**vite.config.ts**: Use `@vitejs/plugin-react`. No special configuration needed.

**tsconfig.json**: Use project references to split app and node configs.

**tsconfig.app.json**: Target ES2020, JSX `react-jsx`, strict mode, include `src/`.

**tsconfig.node.json**: Target ES2022, include `vite.config.ts`.

## Type Definitions (`src/types/index.ts`)

Define these types:
- `PostMeta` — id, title, slug, date, tags[], excerpt, readingTime
- `Post` — extends `PostMeta` with content (Markdown string)
- `ThemeMode` — `'light' | 'dark'`

## Zustand Stores

### themeStore

Manage dark/light theme with:
- `theme` state (initialized from `localStorage` or `prefers-color-scheme`)
- `toggleTheme()` action
- Persist theme preference to `localStorage`

### blogStore

Manage blog content with:
- `posts` — full post list
- `searchQuery` — current search text
- `selectedTag` — active tag filter
- `filteredPosts` — derived filtered list
- `setSearchQuery()`, `setSelectedTag()` — filter update actions
- `getPostBySlug()` — look up a single post
- `getAllTags()` — collect unique tags

Use a standalone `filterPosts()` helper function (defined outside the store) to keep filtering logic clean and testable.

## Pages

### HomePage
- Hero section with blog name, tagline, CTA buttons
- "Latest Posts" section showing 3 most recent PostCards
- Links to /blog and /about

### BlogPage
- Search input with live filtering
- Tag filter bar (click to filter, click again to deselect)
- Post list of filtered results
- Empty state when no results match

### PostPage
- Back link to blog list
- Post header: title, date, reading time, tags
- Full Markdown body rendered via MarkdownRenderer
- 404 state for invalid slugs

### AboutPage
- Author introduction
- Tech stack list
- Contact information

## Components

### Layout
- App shell wrapping Header + `<Outlet />` + Footer
- Applies `data-theme` attribute to `<html>` on theme change via `useEffect`

### Header
- Sticky navigation bar with blur backdrop
- Nav links: 首页, 博客, 关于
- Active link highlighting
- Theme toggle button (sun/moon icons)

### PostCard
- Date and reading time
- Linked title
- Excerpt
- Clickable tag buttons (set tag filter on click)

### MarkdownRenderer
- Uses `react-markdown` with `remark-gfm`
- Code blocks rendered with `react-syntax-highlighter` (Prism theme, dark/light variant based on current theme)
- Tables wrapped in overflow-x scroll container
- All other elements get default styling from CSS

## Styling

Use a single `index.css` with CSS custom properties for theming:

**Theme variables** (define for both `[data-theme='light']` and `[data-theme='dark']`):
- `--bg`, `--bg-secondary`, `--bg-card`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--border`
- `--accent`, `--accent-hover`, `--accent-light`
- `--tag-bg`, `--tag-text`, `--tag-active-bg`, `--tag-active-text`

**Key styling patterns:**
- Post cards with border + hover lift effect
- Tags as pill-shaped buttons
- Markdown body with proper typography hierarchy
- Responsive at 640px breakpoint
- Smooth transitions on theme switch (`transition: background, color`)

## Post Data

Store blog posts as TypeScript objects in `src/data/posts.ts`. Each post contains:
- `id`, `title`, `slug`, `date`, `tags[]`, `excerpt`, `readingTime`
- `content` — full article in Markdown (trim leading/trailing whitespace)

Include 3-4 realistic sample posts with actual Markdown content to demonstrate the blog's capabilities.

## Installation & Verification

After creating all files:

1. Run `npm install` to install dependencies
2. Run `npx tsc -b` to check TypeScript compilation
3. Run `npx vite build` to verify production build
4. Optionally run `npx vite --host` to start dev server

## Code Conventions

- Use named exports for pages, default exports for components
- Zustand stores: extract only needed slices in components with selector functions (e.g., `useThemeStore((s) => s.theme)`)
- CSS: single `index.css` file with CSS variables, no CSS modules needed
- Markdown content stored directly in TypeScript template literals (no separate markdown files)
- All text content in Chinese (for Chinese-language blog)
