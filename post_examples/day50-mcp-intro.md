---
id: 54
title: "AI Agent 学习计划 - Day 50：MCP 协议入门（Model Context Protocol）"
slug: "ai-agent-day50-mcp-intro"
date: "2026-08-20"
tags: ["AI Agent", "MCP", "Model Context Protocol", "工具标准化", "学习计划"]
excerpt: "MCP 是 Anthropic 提出的「AI 工具 USB-C 接口」——统一了 Agent 连接数据源与工具的方式。今天搞懂 MCP 为什么出现、它解决的痛点、核心架构（Host/Client/Server）与传输层（stdio / SSE），为 Day 51 服务器开发打下基础。"
readingTime: 14
---

# Day 50：MCP 协议入门 — Model Context Protocol 概念与架构

## 一、为什么需要 MCP（痛点驱动）

在 MCP 之前，Agent 接一个工具就要写一套私有适配代码：

- 每个数据源（数据库、文件系统、SaaS API）都要**单独对接**，N 个 Agent × M 个工具 = N×M 集成成本
- 工具描述散落在各框架（LangChain `@tool` / Vercel `tool()`），**无法跨框架复用**
- 上下文与工具耦合在业务代码里，**换模型/换框架要重写**

MCP（Model Context Protocol，Anthropic 2024-11 提出）要做的是：**把「Agent 大脑」和「工具手脚」用一套标准协议解耦**，类似 USB-C 让所有设备共用接口。

> 一句话：MCP = AI 世界的 USB-C。一次实现，处处可用。

## 二、MCP 解决什么（能力三件套）

MCP Server 可向 Agent 暴露三类原语：

| 原语 | 作用 | 类比 |
|------|------|------|
| **Tools** | Agent 可主动调用执行动作（查库、发消息） | 函数调用 |
| **Resources** | 被动提供的上下文数据（文件、配置） | 只读数据 |
| **Prompts** | 预定义的提示词模板（可复用工作流） | 快捷指令 |

## 三、核心架构（三层）

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Host       │◄────┤  MCP Client(s)   │◄────┤  MCP Server     │
│ (Agent 应用) │ 1:1 │  (协议翻译层)     │     │ (工具/数据源)    │
│ Claude/IDE  │     │  每 Server 一个   │     │ 暴露 Tools 等    │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

- **Host**：运行 Agent 的宿主程序（如 Claude Desktop、你的 Node Agent、Cursor IDE）
- **Client**：Host 内为每个 Server 维护的一个连接（1 对 1），负责协议收发
- **Server**：独立进程，提供具体能力（文件系统、GitHub、数据库……）

## 四、传输层（Transport）

| 传输方式 | 场景 | 特点 |
|----------|------|------|
| **stdio** | 本地 Server（同机子进程） | 最简单，进程间管道通信 |
| **Streamable HTTP / SSE** | 远程 Server | 跨网络，支持流式，需鉴权 |

Day 51 我们将用 `@modelcontextprotocol/sdk` 从 stdio 本地 Server 起步。

## 五、MCP 与前面模块的衔接

- **替代「手写 tool」**：Day 30/31（Vercel tool）、Day 46-49（搜索/代码/DB/API 工具）都可改造成 MCP Server，**跨框架复用**
- **衔接项目二/三**：Day 71-77 多 Agent 编程助手、Day 79-83 MCP 工具服务器，都将以 MCP 为标准
- **与记忆/多 Agent 解耦**：Server 独立部署，Agent 按需连接，符合 Day 41-45 编排思想

## 六、常见坑

| 坑 | 后果 | 规避 |
|----|------|------|
| 把 MCP 当普通 HTTP API | 协议不匹配 | 用官方 SDK，别手搓 JSON-RPC |
| stdio Server 写日志到 stdout | 污染协议流 | 日志走 stderr / 文件 |
| 一个 Client 连多个 Server | 协议要求 1:1 | 每个 Server 起独立 Client |
| 远程 Server 不鉴权 | 被滥用 | 加 token / 网络隔离 |
| 忽视官方站不可访问 | 卡文档 | 用国内镜像（见下方） |

## 七、今日实践任务

1. 通读 MCP 官方概念文档，画出 Host/Client/Server 交互时序图
2. 在本地装 `@modelcontextprotocol/sdk`，跑通官方 quickstart 的最小 echo Server
3. 思考：把你 Day 48 的「数据库查询 tool」改造成 MCP Server 需要哪些改动？写进 README

🔗 学习资料（国内可访问镜像）：
- MCP 协议官方站：https://modelcontextprotocol.io/ ✅（如不可访问可用下方镜像）
- MCP 中文文档（社区）：https://mcp-docs.cn/ ✅
- MCP Servers 仓库：https://github.com/modelcontextprotocol/servers ✅
- 掘金 MCP 入门详解：https://juejin.cn/post/7438895836463157285 ✅
- 知乎 MCP 是什么：https://zhuanlan.zhihu.com/p/1897467720608264470 ✅
