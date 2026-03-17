# 书法对比工具 (Calligraphy Comparison Tool)

这是一个用于对比不同书法作品的工具，支持自动对齐和重叠对比。

## 解决中国网络访问问题 (Fixing China Connectivity Issues)

由于 Google Gemini API 在中国境内无法直接访问，本项目已配置了后端代理：

1.  **本地开发**：运行 `npm run dev`。它会启动一个 Express 服务器，通过 `/api/gemini-proxy` 代理所有 API 请求。
2.  **Netlify 部署**：
    *   项目已包含 `netlify/functions/gemini-proxy.ts` 和 `netlify.toml`。
    *   在 Netlify 部署时，所有发往 `/api/gemini-proxy/*` 的请求都会自动转发到 Netlify Functions 处理。
    *   **必须设置环境变量**：在 Netlify 的 Site Settings -> Environment variables 中添加 `GEMINI_API_KEY`。

## 开发指南

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 部署到 Netlify

1. 将代码推送到 GitHub。
2. 在 Netlify 中关联此仓库。
3. 设置构建命令为 `npm run build`，发布目录为 `dist`。
4. 添加环境变量 `GEMINI_API_KEY`。
