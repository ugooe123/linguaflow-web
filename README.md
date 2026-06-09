# Linguaflow Web

在浏览器里直接翻译文档的 SaaS 应用。

## 在线试用

👉 https://linguaflow.vercel.app

## 部署方式

1. ### 方式一：Vercel（推荐，免费）
1. Fork 这个仓库
2. 去 https://vercel.com 用 GitHub 登录
3. 点击 "Add New Project" → 选择你 fork 的仓库

4. 点击 Deploy，等 1 分钟
5. 完成！纯静态站，零配置

## 本地开发

```bash
python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## 功能

- [x] 自带 API Key 免费翻译（浏览器直连）
- [x] 保留 Markdown 格式
- [x] 支持 20+ 语言
- [ ] 付费翻译 ¥9.9/次（需部署后端）
- [ ] 批量套餐 ¥99/月
- [ ] GitHub Action 自动翻译

## 变现模式

| 方式 | 说明 |
|------|------|
| 免费 (BYOK) | 用户自己带 Key，零成本运营 |
| 单次 ¥9.9 | 我提供 Key，赚差价 |
| 批量 ¥99/月 | 高频用户包月 |
| GitHub Sponsors | 随缘打赏 |