const fs = require('fs');
const path = require('path');

// Read the markdown file
const mdContent = fs.readFileSync(path.join(__dirname, '..', 'post_examples', 'day9-nodejs-http-https.md'), 'utf-8');

// --- Update posts.ts ---
// Escape backticks and ${} for TypeScript template literal
const tsEscaped = mdContent
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

const newPostEntry = `  {
    id: '11',
    title: 'AI Agent 学习计划 Day 9：Node.js HTTP/HTTPS',
    slug: 'ai-agent-day9-nodejs-http-https',
    date: '2026-07-10',
    tags: ['Node.js', 'AI Agent', '学习笔记'],
    excerpt: 'AI Agent 84 天学习计划第九天。系统学习 Node.js HTTP/HTTPS 模块：创建 HTTP 服务器、解析请求与发送响应、HTTP 客户端请求、http.Agent 连接池与 Keep-Alive、HTTPS/TLS 证书配置、SSE 流式响应接收与转发、内置 fetch API、超时控制与指数退避重试策略、完整 LLM 客户端封装、HTTP 代理服务器、Agent API 服务器搭建，并落地到调用 OpenAI API 的完整链路实现。',
    readingTime: 35,
    content: \`${tsEscaped}\`,
  },`;

let postsTs = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'posts.ts'), 'utf-8');

const insertMarker = "  {\n    id: '10',";
if (postsTs.includes(insertMarker)) {
  postsTs = postsTs.replace(insertMarker, newPostEntry + '\n' + insertMarker);
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'posts.ts'), postsTs);
  console.log('✅ posts.ts updated successfully');
} else {
  console.log('❌ Insert marker not found in posts.ts');
}

// --- Update posts.json ---
const postsJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'posts.json'), 'utf-8'));

// Find and update the Day 9 entry
const day9Index = postsJson.findIndex(p => p.slug === 'ai-agent-day9-nodejs-http-https');
if (day9Index !== -1) {
  postsJson[day9Index].content = mdContent;
  postsJson[day9Index].excerpt = 'AI Agent 84 天学习计划第九天。系统学习 Node.js HTTP/HTTPS 模块：创建 HTTP 服务器、解析请求与发送响应、HTTP 客户端请求、http.Agent 连接池与 Keep-Alive、HTTPS/TLS 证书配置、SSE 流式响应接收与转发、内置 fetch API、超时控制与指数退避重试策略、完整 LLM 客户端封装、HTTP 代理服务器、Agent API 服务器搭建，并落地到调用 OpenAI API 的完整链路实现。';
  postsJson[day9Index].readingTime = 35;
  postsJson[day9Index].tags = ['Node.js', 'AI Agent', '学习笔记'];
  fs.writeFileSync(path.join(__dirname, '..', 'server', 'data', 'posts.json'), JSON.stringify(postsJson, null, 2));
  console.log('✅ posts.json updated successfully');
} else {
  console.log('❌ Day 9 entry not found in posts.json');
}

console.log('Done!');
