---
id: 74
title: "AI Agent 学习计划 - Day 70：项目一 - 项目展示准备"
slug: "ai-agent-day70-project1-showcase"
date: "2026-09-09"
tags: ["AI Agent", "实战项目", "项目一", "展示准备", "作品集", "Demo", "学习计划"]
excerpt: "项目一第十四步（收官）：整理项目文档、准备演示，作为作品集第一块基石。覆盖一页项目简介、Demo 脚本（3-5 个代表性问题 + 预备答案/引用）、截图/录屏要点、README 终版（架构图+功能+运行步骤+GIF）、作品集页草稿，以及线下 Demo 翻车预案。"
readingTime: 13
---

# Day 70：项目一 - 项目展示准备

## 一、目标

Day 57→69 完成了知识库问答系统的「从 0 到 1」，今天是 **展示收官**：把它打包成能对外讲的成果，作为作品集第一块基石。项目一 14 步全部走完。

> 写得出来、跑得起来、讲得清楚，三者齐备才叫「完成一个项目」。

## 二、一页项目简介（elevator pitch）

准备一段 30 秒能讲完的介绍，建议结构：
- **是什么**：基于 RAG 的智能知识库问答系统，能基于私有文档精准回答并给出引用溯源。
- **技术栈**：Next.js（App Router）+ Vercel AI SDK（streamText / useChat）+ LangChain.js（切分）+ OpenAI Embeddings + Pinecone。
- **亮点**：流式打字机、引用溯源 SourceCard、多轮上下文压缩、线上可访问。
- **Demo 一句带过**：「问它知识库里的问题，它能边流式回答边标出来源。」

## 三、Demo 脚本（提前演练）

选 3-5 个有代表性的问题，并准备好预期答案与对应引用，避免现场卡壳：
1. 「这个知识库主要讲什么？」（验证基础检索）
2. 「XX 概念怎么理解？」（验证 chunk 切分与召回质量）
3. 「XX 和 YY 有什么区别？」（验证多片段融合）
4. 追问：「那它和 Day 40 讲的混合检索有什么关系？」（验证多轮上下文，呼应 Day 64）
5. 「知识库里没有的内容呢？」（验证诚实拒答 / 无资料提示）

> 现场 Demo 前务必先 `npm run ingest` 跑通索引（呼应 Day 66/69 的空索引 0 命中坑），并确认线上环境变量齐全（Day 66）。

## 四、截图 / 录屏要点

至少 capture 4 张：① 欢迎屏 + 示例问题 ② 流式打字机进行中 ③ SourceCard 引用展示 ④ 多轮追问连贯。可录一段 30s 短视频（带字幕/GIF）放进 README。

## 五、README 终版（Day 66/69 基础上补）

- 架构数据流图：用户问题 → embedQuery → Pinecone TopK → 注入 System Prompt → streamText → UI Message Stream → 前端打字机 + SourceCard。
- 功能清单 + 运行步骤（install / env / 建索引 / ingest / dev）。
- 一张 Demo GIF + 「踩坑记录」章节（Day 69 沉淀的清单，作品集加分）。

## 六、作品集页草稿

为 Day 84 总作品集预留：项目名、一句话、技术栈标签、Demo 链接（Vercel）、源码链接、关键截图、你 responsible 的部分。今天先把骨架填上，后续项目二、三同模板累加。

## 七、线下 Demo 翻车预案

- 索引为空 / 维度错 → 提前 ingest 并验证一次。
- 限流或网络抖动 → 准备一段录屏备份，现场放录屏兜底。
- 长回答被截断 → 确认 `maxDuration`（Day 61/66）已设。
- 准备一句收尾：「这是项目一，后面还有多 Agent 协作助手和 MCP 工具服务器两个项目。」

## 八、今日实践任务

1. 写好一页项目简介 + Demo 脚本（含预期答案/引用）。
2. 跑通 ingest，截 4 张图 / 录 30s 视频，放进 README。
3. 完成 README 终版（架构图 + 功能 + 步骤 + GIF + 踩坑记录）。
4. 建作品集页草稿，填入项目一骨架。

> **明日（Day 71）进入项目二：多 Agent 协作编程助手**（Node.js + Vercel AI SDK + MCP），从单体 RAG 升级到「多个角色 Agent 协作写代码」的编排范式。

## 九、回顾资源

- 本博客 `AI Agent` 标签：Day 1-69 全部笔记（项目一完整 14 步）
- Vercel AI Chatbot 参考：https://github.com/vercel/ai-chatbot
- Vercel AI SDK UI 中文文档：https://ai-sdk.com.cn/docs/ai-sdk-ui
