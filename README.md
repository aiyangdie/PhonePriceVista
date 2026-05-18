<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-4.9-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/MUI-5.14-007FFF?style=for-the-badge&logo=mui" alt="MUI">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
</p>

<h1 align="center">📱 PhonePriceVista</h1>

<p align="center">
  <b>手机价格比较平台</b>
</p>

<p align="center">
  玻璃拟态 UI · 智能搜索筛选 · GSMArena 爬虫 · 图片代理 · 管理后台 · 定时同步
</p>

---

## 📌 项目简介

PhonePriceVista 是一款现代化的手机价格展示与管理系统，前端采用 React + Material-UI 玻璃拟态设计，后端基于 Express + MySQL 提供完整的数据管理 API。集成 GSMArena 爬虫自动获取手机规格和图片，支持按品牌/价格/库存多维度筛选，配备独立的管理后台和爬虫控制面板。

---

## ✨ 核心特性

- 🎨 **玻璃拟态 UI** — 基于 Material-UI 的现代化设计，渐变色 + 毛玻璃效果
- 🔍 **智能搜索筛选** — 支持品牌/型号/颜色搜索，防抖优化，价格区间滑动筛选
- 📊 **多维度排序** — 价格升序/降序、存储容量排序
- 📦 **库存状态** — 实时显示现货/怕抓/没货状态，彩色标签直观展示
- 🖼️ **手机图片** — 自动爬取 GSMArena 产品图，图片代理解决防盗链
- 📋 **详细参数** — 展示 CPU/电池/屏幕/摄像头/重量/尺寸等核心规格
- 🔄 **数据同步** — 定时任务每天 0 点自动同步，支持手动触发
- 🛠️ **管理后台** — 完整的手机/品牌 CRUD 管理，数据导入/导出
- 🕷️ **爬虫面板** — GSMArena 爬虫控制，支持搜索/品牌爬取/批量导入
- 📱 **详情弹窗** — 点击卡片查看完整参数和高清图片
- ⚡ **双模式运行** — 支持无数据库（JSON 文件）和 MySQL 持久化两种模式
- 🗄️ **服务端缓存** — 1 分钟 TTL 缓存机制，减少数据库查询

---

## 🛠️ 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| **React 18** | 用户界面框架 |
| **TypeScript** | 类型安全 |
| **Material-UI 5** | UI 组件库 + 玻璃拟态设计 |
| **Emotion** | CSS-in-JS 样式方案 |

### 后端

| 技术 | 用途 |
|------|------|
| **Node.js + Express** | Web 框架 + REST API |
| **MySQL2** | 数据库驱动 |
| **Axios** | HTTP 客户端（爬虫 + 图片代理） |
| **Cheerio** | HTML 解析（GSMArena 爬虫） |
| **Multer** | 文件上传处理 |

---

## 🚀 快速开始

### 前置条件

- Node.js >= 16.0.0
- npm >= 8.0.0
- MySQL >= 5.7（可选，不配置则使用 JSON 文件模式）

### 安装步骤

```bash
git clone https://github.com/aiyangdie/PhonePriceVista.git
cd PhonePriceVista

npm install

cd server
npm install
cd ..
```

### 配置环境变量

在根目录创建 `.env` 文件：

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=phone_price_vista
```

### 运行命令

**方式一：Windows 一键启动**

```bash
start.bat
```

**方式二：手动启动**

```bash
cd server
npm start

cd ..
npm start
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端界面 | http://localhost:3000 |
| 后端 API | http://localhost:3001 |
| 管理后台 | http://localhost:3001/admin |
| 爬虫管理 | http://localhost:3001/crawler |

---

## 📂 项目结构

```
PhonePriceVista/
├── public/                     # 静态资源 & JSON 数据文件
├── src/                        # 前端源码
│   ├── components/
│   │   └── AdminPanel.tsx      # 管理面板组件
│   ├── services/
│   │   └── api.ts              # API 接口封装
│   ├── utils/
│   │   └── parseData.ts        # 数据解析工具
│   ├── App.tsx                 # 主应用组件
│   ├── types.ts                # TypeScript 类型定义
│   └── index.tsx               # 入口文件
├── server/                     # 后端服务
│   ├── config/
│   │   └── db.js               # 数据库连接配置
│   ├── database/
│   │   ├── schema.sql          # 数据库 Schema
│   │   ├── init.js             # 数据库初始化
│   │   └── import-data.js      # 数据导入脚本
│   ├── routes/
│   │   ├── phones.js           # 手机数据 API
│   │   └── crawler.js          # 爬虫 API
│   ├── services/
│   │   ├── gsmArenaCrawler.js  # GSMArena 爬虫
│   │   ├── phoneCrawler.js     # 手机数据爬虫
│   │   └── scheduler.js        # 定时任务
│   ├── public/
│   │   ├── admin.html          # 管理后台页面
│   │   └── crawler.html        # 爬虫管理页面
│   └── index.js                # 服务入口
├── docs/                       # 文档
├── .env                        # 环境变量
├── package.json                # 前端依赖
├── tsconfig.json               # TypeScript 配置
├── start.bat                   # Windows 启动脚本
├── LICENSE                     # MIT 开源协议
└── README.md
```

---

## 🤝 贡献与许可证

欢迎贡献！请遵循以下流程：

1. **Fork** 本仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'feat: add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 **Pull Request**

本项目基于 **MIT License** 开源协议。详见 [LICENSE](LICENSE)。
