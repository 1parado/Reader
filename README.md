# Socratic Reader

文档智能分段，智能分配阅读时间，提供主动感知AI问答，适配移动端和Web端，支持API Key格式同时也支持Ollama本地化部署。

## 项目预览

![Preview 1](./public/images/preview-1.png)

![Preview 2](./public/images/preview-2.png)

## 功能特性

- **智能分段**：自动将文档按段落分段，便于阅读理解
- **阅读追踪**：智能分配阅读时间，追踪阅读进度
- **AI 问答**：当检测到阅读困难时，自动生成理解性问题
- **多端适配**：支持移动端和 Web 端
- **灵活部署**：支持 OpenAI API Key 和本地 Ollama 部署
- **隐私保护**：本地部署模式下，数据不出本机

## 新手引导

![Guide](./public/images/guide.png)

## 用户上传文件

![Upload](./public/images/upload.png)

支持的文件格式：
- PDF
- Word (.docx)
- HTML
- Markdown (.md)
- 纯文本 (.txt)

## 技术栈

- **前端**：Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- **后端**：Next.js API Routes + Prisma ORM
- **数据库**：SQLite (libSQL/Turso)
- **AI**：OpenAI API / Ollama 本地模型

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件：

```env
DATABASE_URL="file:./dev.db"

# OpenAI Configuration (可选，使用 OpenAI 时需要)
OPENAI_API_KEY="your-api-key-here"
OPENAI_BASE_URL="https://api.openai.com/v1"
```

### 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

### 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## AI 配置

### OpenAI / Custom API 模式

1. 选择 "☁️ OpenAI / Custom API"
2. 输入 API Key
3. 可选：修改 Base URL（支持 Azure、Groq 等 OpenAI 兼容 API）
4. 可选：指定模型名称

### Ollama 本地模式

1. 选择 "🏠 Local Ollama"
2. 确保 Ollama 已运行：`ollama serve`
3. 确保已下载模型：`ollama pull llama3.2`
4. 可选：修改 Ollama URL 和模型名称

默认配置：

| 配置项 | OpenAI 模式 | Ollama 模式 |
|--------|-------------|-------------|
| API URL | `https://api.openai.com/v1` | `http://localhost:11434/v1` |
| 默认模型 | `gpt-4o-mini` | `llama3.2` |
| API Key | **必须** | 不需要 |

## 项目结构

```
src/
├── app/              # Next.js App Router
│   ├── api/          # API routes
│   │   ├── documents/    # 文档管理
│   │   ├── generate-quiz/ # AI 问答生成
│   │   └── upload/       # 文件上传
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/       # React components
│   ├── Article.tsx       # 文章阅读组件
│   ├── FileUpload.tsx    # 文件上传组件
│   └── QuizPopup.tsx     # 问答弹窗组件
├── hooks/            # Custom React hooks
│   └── useReadingTracker.ts  # 阅读追踪
└── lib/              # Utilities
    ├── data.ts           # 示例数据
    ├── file-parser.ts    # 文件解析
    └── prisma.ts         # 数据库客户端
```

## 部署

### Vercel 部署

最简单的方式是使用 [Vercel Platform](https://vercel.com/new)：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Docker 部署

```bash
docker build -t socratic-reader .
docker run -p 3000:3000 socratic-reader
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
