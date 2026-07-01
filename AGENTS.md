# Repository Guidelines

## Project Structure & Module Organization

```
my-blog/
├── index.html                 # Vite entry HTML
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite config (port 5179, /api proxy → 3001)
├── tsconfig.app.json          # TypeScript config (strict mode, ESNext)
├── blog-generator.skill.md    # AI agent skill for scaffolding this project
├── src/                       # Frontend source (React + TypeScript)
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Router setup + auth guard
│   ├── types/index.ts         # Shared TypeScript interfaces (Post, PostMeta, ThemeMode)
│   ├── data/posts.ts          # Fallback blog post data (seed content)
│   ├── stores/                # Zustand stores (blogStore, authStore, themeStore)
│   ├── components/            # Reusable UI components (Header, Layout, PostCard, etc.)
│   ├── pages/                 # Route-level page components
│   └── styles/index.css       # Global styles + CSS custom properties (light/dark themes)
├── server/                    # Express backend (ES modules)
│   ├── index.js               # Server entry (port 3001, SPA fallback for /dist)
│   ├── data/posts.json        # Blog posts persisted as JSON
│   ├── routes/auth.js         # Login + token verification
│   ├── routes/posts.js        # CRUD for blog posts
│   └── middleware/auth.js     # JWT generation and verification
├── dist/                      # Production build output (gitignored)
└── post_examples/             # Example post markdown files
```

**Key architectural notes:**
  - Frontend and backend live in the same repository; Vite proxies `/api` requests to Express during development.
  - Route-level pages live under `src/pages/`; reusable components under `src/components/`.
  - State is managed with Zustand stores in `src/stores/` — one store per domain concern.
  - The Express server serves the production build from `dist/` as a static SPA fallback.
  - Place new features in the existing store or add a new Zustand store rather than introducing another state solution.

## Build, Test, and Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR on port 5179 |
| `npm run dev:server` | Start Express backend on port 3001 |
| `npm run dev:all` | Run both frontend and backend concurrently |
| `npm run build` | Type-check with `tsc -b` then bundle with `vite build` |
| `npm run preview` | Serve the production build locally for preview |

There is currently no test runner configured. Before submitting changes, manually verify the relevant page renders correctly and the API endpoints respond as expected.

## Coding Style & Naming Conventions

- **Indentation:** 2 spaces per level.
- **Language:** TypeScript with strict mode enabled (`strict: true` in `tsconfig.app.json`).
- **JSX style:** Use `.tsx` for components, `.ts` for non-component modules.
- **Naming:**
  - Components: PascalCase (`HomePage`, `PostCard`).
  - Stores: camelCase, exported as a const (`useBlogStore`, `useAuthStore`).
  - Files: PascalCase for components (`Header.tsx`), camelCase for utilities and data (`authStore.ts`).
- **Styles:** CSS custom properties via `[data-theme]` attribute for light/dark mode. Use variables from `styles/index.css` (`--bg`, `--text-primary`, `--accent`) rather than hardcoding colors.
- **No linting tool is currently configured.** Follow the conventions established in existing files to keep the codebase consistent.

## Commit & Pull Request Guidelines

This project follows **conventional commit messages** based on its Git history:

```
fix: 优化页面
fix: 信息修改
init
```

Format:

```
<type>: <short description>
```

Types observed: `fix:`, `init`. Additional types such as `feat:`, `refactor:`, `docs:`, or `style:` are welcome when appropriate.

Keep commits focused on a single logical change. Include a clear description of what changed and why.

## (Optional) Agent-Specific Instructions

This repository includes `blog-generator.skill.md` in the project root. When an AI coding agent is asked to scaffold, modify, or generate content for this blog, it should load and follow that skill file to remain consistent with the project's established patterns — including component structure, Zustand state management, and Markdown rendering with `react-markdown` + `remark-gfm`. Route new pages through `App.tsx` inside the existing `<Layout>` wrapper.
