# 单阶段构建：构建前端后直接运行，避免多阶段在 CloudBase 的兼容问题
FROM node:20-alpine
WORKDIR /app

# 利用缓存，先拷贝依赖清单
COPY package*.json ./
RUN npm install

# 拷贝源码（.dockerignore 已排除 node_modules/dist）
COPY . .

# 构建前端
RUN npm run build

# 切换为生产依赖，减小运行时体积
RUN npm prune --omit=dev

# 环境变量（运行时由 CloudBase 注入，这里给默认值）
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.js"]
