# Knowledge Passbook (知识存折)

Knowledge Passbook 是一款将学习内容内化并转化为知识资产的智能工具。本项目基于“异步持久化”机制，融合“孵化器（Incubator）”概念和“教练式（Coaching）”AI 交互，致力于解决“虚假勤奋”与“知识孤岛”问题。

## 核心特性
- **沉浸式专注模式**：结合 30 分钟番茄钟，沉浸式记录。
- **智能认知教练**：非评判性的 AI 提问引导，逼出深度思考。
- **知识孵化器**：允许半成品的存在，异步唤醒草稿继续打磨。
- **资产铸造与关联**：盖章入库生成精美卡片，向量检索自动推荐知识连接，产生复利。

## 技术栈
- **前端**：Next.js 14, Tailwind CSS, Framer Motion
- **后端**：FastAPI, SQLAlchemy, Python 3
- **架构**：分离式前后端，可扩展到 Supabase/PostgreSQL。

## 快速开始

### 1. 后端启动
进入 `backend` 目录，安装依赖并启动服务：

```bash
cd backend
pip install -r requirements.txt
# 默认使用本地 SQLite 数据库，无需特殊配置即可直接运行
python -m uvicorn app.main:app --reload --port 8000
```

*(可选) 如需配置远程数据库等环境变量，可参考 `backend/.env.example`。*

### 2. 前端启动
进入 `frontend` 目录，安装依赖并启动开发服务器：

```bash
cd frontend
npm install
npm run dev
```

在浏览器中访问 [http://localhost:3000](http://localhost:3000) 即可使用。

## 设计文档
有关智能体的工作流设计、数据库 Schema 以及 AI Prompt 的设计哲学，请参阅：
[《知识存折（Knowledge Passbook）智能体设计与开发全手册 v2.0》](./《知识存折（Knowledge Passbook）智能体设计与开发全手册 v2.0》.txt)

## 许可协议
MIT License
