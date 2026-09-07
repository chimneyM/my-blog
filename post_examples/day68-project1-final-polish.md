---
id: 72
title: "AI Agent 学习计划 - Day 68：项目一 - 最终完善"
slug: "ai-agent-day68-project1-final-polish"
date: "2026-09-07"
tags: ["AI Agent", "实战项目", "项目一", "UI优化", "用户体验", "Markdown", "无障碍", "学习计划"]
excerpt: "项目一第十二步：UI 优化与用户体验提升，把「能用」做成「好用」。覆盖空状态/加载态、Markdown 渲染与代码高亮+复制、SourceCard 悬浮预览、停止按钮、滚动与移动端适配、暗色主题、无障碍（aria-live）等可落地的打磨点。"
readingTime: 15
---

# Day 68：项目一 - 最终完善

## 一、目标

Day 67 完成代码 review，今天是 **UI / UX 打磨**：让知识库问答从「能用」变成「好用、拿得出手」。参考 Vercel AI Chatbot 的成熟交互细节。

> 同样的功能，UI 打磨过和没打磨过，给人的「完成度」观感差一个量级。

## 二、状态与反馈

- **空状态**：首次进入给欢迎屏 + 几个示例问题（如「这个知识库讲什么？」），降低冷启动门槛。
- **加载态**：检索中显示骨架屏 / spinner；流式时输入框禁用 + 显示「思考中」。呼应 Day 61/67。
- **错误态**：上游失败时 `toast` 提示 + 行内「重试」按钮，绝不让白屏。呼应 Day 67 错误处理。
- **停止按钮**：流式未结束时显示「停止」（`useChat` 的 `stop()`），呼应 Day 61。

## 三、内容呈现

- **Markdown 渲染**：答案含代码/列表/表格，用 `react-markdown` + `remark-gfm` 渲染；代码块接 `react-syntax-highlighter` 或 `shiki` 高亮。
- **代码复制按钮**：每个代码块右上角「复制」图标，提升实用度（Chatbot 自带组件可直接复用）。
- **SourceCard 打磨**（Day 63）：悬浮显示片段预览、点击展开全文、提供「复制引用」；与正文 `[1]` 序号严格对应（呼应 Day 67 引用错位修复）。

## 四、交互与适配

- **滚动行为**：新消息自动滚到底；但用户向上翻看时暂停自动滚动，避免「抢走」阅读位置。
- **输入框体验**：流式时禁用发送；Enter 发送、Shift+Enter 换行。
- **移动端适配**：消息气泡、输入栏在窄屏正常排布；SourceCard 在移动端可横向滑动。
- **暗色主题**：`next-themes` + Tailwind `dark:` 适配，提供亮/暗切换。

## 五、无障碍（常被忽略）

- 流式回答容器加 `aria-live="polite"`，屏幕阅读器可朗读增量内容。
- 按钮带 `aria-label`，焦点顺序合理，键盘可全程操作。

## 六、今日实践任务

1. 加欢迎屏 + 示例问题（空状态）。
2. 给答案接 Markdown 渲染 + 代码高亮 + 复制按钮。
3. SourceCard 加悬浮预览，确认与正文引用一一对应。
4. 加停止按钮、错误 toast/重试、移动端适配与暗色主题。
5. 给流式容器加 `aria-live`，做一次键盘走查。

> 项目一从 Day 57 到 Day 68 共 12 步走完「规划→RAG→流式→引用→多轮→测试→部署→review→UI」全流程。**明日（Day 69）项目复盘**：总结经验、记录踩过的坑，为 Day 70 演示与后续项目二、三打底。

## 七、参考

- Vercel AI Chatbot 仓库（UI/UX 标杆）：https://github.com/vercel/ai-chatbot
- Vercel AI SDK UI 中文文档：https://ai-sdk.com.cn/docs/ai-sdk-ui
- react-markdown：https://github.com/remarkjs/react-markdown
- next-themes（暗色主题）：https://github.com/pacocoursey/next-themes
