# ===== 阶段1: 构建前端 =====
FROM node:20-alpine AS builder
WORKDIR /app

# 利用缓存，先拷贝依赖清单
COPY package*.json ./
RUN npm ci

# 拷贝源码并构建
COPY . .
RUN npm run build

# ===== 阶段2: 运行时 =====
FROM node:20-alpine AS runner
WORKDIR /app

# 仅安装生产依赖
COPY package*.json ./
RUN npm ci --omit=dev

# 拷贝服务端代码、数据文件
COPY server/ ./server/
# 从构建阶段拷贝前端产物
COPY --from=builder /app/dist ./dist

# 环境变量（运行时由 CloudBase 注入，这里给默认值）
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.js"]
