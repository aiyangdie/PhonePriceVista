<p align="center"><img src="assets/covers/35-PhonePriceVista.jpg" alt="手机比价 项目封面" width="100%"></p>

<h1 align="center">PhonePriceVista · 手机比价</h1>

<p align="center">React + TypeScript + MUI 前端，Node 后端提供比价数据</p>

<p align="center">
  <a href="https://aiyangdie.github.io/PhonePriceVista/">在线体验</a> ·
  <a href="LICENSE">MIT 许可</a>
</p>

## 简介

一个手机比价演示系统：按品牌、价格区间、配置筛选机型，对比不同渠道的报价，支持关键词实时搜索。前端是 React + MUI，后端用 Node 承接查询接口。

## 功能

- **多品牌筛选**：按品牌、价格区间、内存存储组合过滤
- **实时搜索**：输入即筛，结果即时刷新
- **价格对比**：同一机型不同渠道的报价并列显示
- **详情页**：机型参数与价格走势
- **后台数据**：Node 服务提供机型与报价接口

## 技术栈

React 18 · TypeScript 4.9 · MUI 5 · Vite ｜ Node.js + Express ｜ MySQL 8

## 快速开始

```bash
git clone https://github.com/aiyangdie/PhonePriceVista.git
cd PhonePriceVista
npm install
```

配置环境变量（数据库与接口地址）后：

```bash
npm run dev      # 前端
npm run server   # 后端接口
```

默认访问 `http://localhost:3000`，接口在 `http://localhost:5000`。

## 项目结构

```
src/            前端页面与组件
src/api/        接口封装
server/         后端服务与数据访问
public/         静态资源
```

## 说明

价格数据为演示数据，实际选购请以官方渠道为准。

## 许可证

[MIT](LICENSE)
