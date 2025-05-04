# 手机价格展示系统

这是一个用于展示和比较不同品牌手机价格及配置信息的 Web 应用程序。该应用提供了直观的界面，帮助用户快速查找和比较手机信息。

## 功能特点

- 📱 展示多品牌手机信息
- 🔍 强大的搜索和筛选功能
  - 按品牌筛选
  - 按价格范围筛选
  - 按关键词搜索
  - 按库存状态筛选
- 🎨 美观的卡片式布局
- 📊 清晰的信息展示
  - 手机图片
  - 型号名称
  - 网络类型（5G/4G）
  - 颜色展示
  - RAM 和存储容量
  - 实时价格
  - 库存状态
- 📱 响应式设计，支持各种设备

## 技术栈

- React 18
- TypeScript
- Material-UI (MUI)
- CSS-in-JS
- JSON 数据存储

## 开始使用

### 环境要求

- Node.js 16.0 或更高版本
- npm 7.0 或更高版本

### 安装步骤

1. 克隆仓库
```bash
git clone [你的仓库地址]
cd phone-price-display
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm start
```

4. 在浏览器中访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
phone-price-display/
├── public/              # 静态资源
│   └── phone-images/    # 手机图片
├── src/                 # 源代码
│   ├── components/      # React 组件
│   ├── utils/          # 工具函数
│   ├── types.ts        # TypeScript 类型定义
│   └── App.tsx         # 主应用组件
└── package.json        # 项目配置
```

## 数据格式

项目使用 JSON 格式存储手机数据，基本结构如下：

```typescript
interface Phone {
  brand: string;      // 品牌
  model: string;      // 型号
  ram: number;        // 内存大小(GB)
  storage: number;    // 存储容量(GB)
  color: string;      // 颜色
  price: number;      // 价格
  availability: string; // 库存状态
  networkType?: string; // 网络类型
}
```

## 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有任何问题或建议，请通过以下方式联系我们：
- 提交 Issue
- 发送邮件至 [你的邮箱]

## 致谢

感谢所有为本项目做出贡献的开发者！
