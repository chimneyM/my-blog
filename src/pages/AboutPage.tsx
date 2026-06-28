export default function AboutPage() {
  return (
    <div className="about-page">
      <h1>关于我</h1>
      <div className="about-content">
        <section>
          <h2>👋 你好</h2>
          <p>
            我是一名前端工程师，专注于 Web 技术，喜欢探索 React 生态、
            TypeScript 类型系统和前端工程化方向。
          </p>
          <p>
            这个博客是我的技术笔记和个人思考空间。希望能通过文字，
            把学到的知识沉淀下来，也帮助到更多开发者。
          </p>
        </section>

        <section>
          <h2>🔧 技术栈</h2>
          <ul>
            <li><strong>前端</strong> — React, TypeScript, Zustand, Vite</li>
            <li><strong>样式</strong> — CSS Modules, Tailwind CSS</li>
            <li><strong>后端</strong> — Node.js, Express, Prisma</li>
            <li><strong>其他</strong> — Git, Docker, CI/CD</li>
          </ul>
        </section>

        <section>
          <h2>📮 联系我</h2>
          <p>
            如果你对我的文章有任何想法或建议，欢迎通过以下方式联系我：
          </p>
          <ul>
            <li>GitHub: github.com/codex</li>
            <li>Email: hello@codex.blog</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
