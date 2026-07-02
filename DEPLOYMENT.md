# 博客部署指南

## 项目概述
这是一个全栈博客应用，包含：
- **前端**：React + TypeScript + Vite
- **后端**：Express.js + JWT 认证
- **数据库**：JSON 文件存储

## 部署选项

### 选项1：Vercel（推荐，最简单）
Vercel 支持全栈部署，自动处理 Node.js 服务器和静态文件。

#### 步骤：
1. **访问 [vercel.com](https://vercel.com)**，使用 GitHub 账号登录
2. **导入仓库**：
   - 点击 "New Project"
   - 选择 "Import Git Repository"
   - 选择 `my-blog` 仓库
3. **配置环境变量**：
   - 项目设置 → Environment Variables
   - 添加以下变量：
     ```
     JWT_SECRET=your-jwt-secret-key-change-this
     ADMIN_PASSWORD=your-admin-password
     NODE_ENV=production
     ```
4. **部署**：点击 "Deploy" 按钮
5. **访问**：部署完成后会获得一个 `*.vercel.app` 域名

#### 使用 Vercel CLI（命令行）：
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
cd /Users/chimneym/personal/my-blog
vercel
```

### 选项2：GitHub Pages（仅静态前端）
如果您只需要部署前端部分，可以：

1. **修改 `vite.config.ts`**：
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/my-blog/',  // 仓库名
  // ... 其他配置
})
```

2. **构建并部署**：
```bash
npm run build

# 安装 gh-pages
npm install --save-dev gh-pages

# 在 package.json 中添加脚本
"scripts": {
  "deploy": "gh-pages -d dist"
}

# 部署
npm run deploy
```

3. **访问**：`https://chimneyM.github.io/my-blog/`

### 选项3：自定义服务器部署
如果需要部署到自己的服务器：

1. **准备服务器**：
```bash
# 克隆代码
git clone https://github.com/chimneyM/my-blog.git
cd my-blog

# 安装依赖
npm install

# 构建前端
npm run build

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件设置 JWT_SECRET 和 ADMIN_PASSWORD

# 安装 PM2 管理进程
npm install -g pm2

# 启动服务
NODE_ENV=production PORT=3000 pm2 start server/index.js --name my-blog
```

2. **配置 Nginx 反向代理**：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 环境变量说明
| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `JWT_SECRET` | JWT 密钥，用于生成和验证 token | `your-secret-key-here` |
| `ADMIN_PASSWORD` | 管理员登录密码 | `your-password` |
| `NODE_ENV` | 环境模式 | `production` |
| `PORT` | 服务器端口 | `3000` |
| `CORS_ORIGIN` | CORS 允许的域名 | `https://your-domain.vercel.app` |

## 访问管理后台
1. 访问博客首页
2. 点击右上角登录按钮
3. 输入设置的 `ADMIN_PASSWORD` 密码
4. 登录后可进行文章增删改操作

## 故障排除

### 常见问题：
1. **API 404 错误**：
   - 检查 Vercel 环境变量是否设置正确
   - 确认 `vercel.json` 配置了正确的路由

2. **静态文件无法加载**：
   - 确认构建成功：`npm run build`
   - 检查 `dist` 目录是否包含 `index.html`

3. **JWT 认证失败**：
   - 确保 `JWT_SECRET` 环境变量在开发和生产环境一致

4. **CORS 错误**：
   - 检查 `CORS_ORIGIN` 环境变量是否正确设置
   - 确保前端请求的域名在白名单中

## 更新部署
当代码更新后：
```bash
# 提交更改
git add .
git commit -m "更新说明"
git push origin main

# Vercel 会自动重新部署
# GitHub Pages 需要重新运行 npm run deploy
```

## 联系信息
如果遇到问题，请检查：
- 项目 GitHub：https://github.com/chimneyM/my-blog
- Vercel 部署文档：https://vercel.com/docs