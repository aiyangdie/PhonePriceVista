const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const phoneRoutes = require('./routes/phones');
const crawlerRoutes = require('./routes/crawler');
const scheduler = require('./services/scheduler');
const { initDatabase } = require('./database/init');

const app = express();
const PORT = 3001; // 后端API固定端口

// 图片代理 - 解决防盗链问题
app.get('/api/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send('URL required');
    }
    
    // 安全验证：只允许http/https协议的图片URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).send('Invalid URL protocol');
    }
    
    // 根据URL来源设置不同的Referer
    let referer = 'https://www.google.com/';
    const urlLower = url.toLowerCase();
    if (urlLower.includes('gsmarena.com')) {
      referer = 'https://www.gsmarena.com/';
    } else if (urlLower.includes('phonearena.com')) {
      referer = 'https://www.phonearena.com/';
    } else if (urlLower.includes('oppo.com')) {
      referer = 'https://www.oppo.com/';
    } else if (urlLower.includes('mi.com') || urlLower.includes('xiaomi')) {
      referer = 'https://www.mi.com/';
    } else if (urlLower.includes('samsung')) {
      referer = 'https://www.samsung.com/';
    } else if (urlLower.includes('apple.com')) {
      referer = 'https://www.apple.com/';
    } else if (urlLower.includes('huawei')) {
      referer = 'https://www.huawei.com/';
    } else if (urlLower.includes('vivo.com')) {
      referer = 'https://www.vivo.com/';
    } else if (urlLower.includes('realme')) {
      referer = 'https://www.realme.com/';
    } else if (urlLower.includes('oneplus')) {
      referer = 'https://www.oneplus.com/';
    }
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': referer,
        'Origin': referer.replace(/\/$/, ''),
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 20000,
      maxRedirects: 10,
      validateStatus: (status) => status < 500
    });
    
    // 检查是否成功获取图片
    if (response.status !== 200 || !response.data || response.data.length < 100) {
      throw new Error('Invalid image response');
    }
    
    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=604800');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(response.data);
  } catch (error) {
    // 返回本地SVG占位图
    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8fafc"/>
          <stop offset="100%" style="stop-color:#e2e8f0"/>
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#bg)"/>
      <text x="150" y="180" text-anchor="middle" font-family="Arial" font-size="48" fill="#94a3b8">📱</text>
      <text x="150" y="230" text-anchor="middle" font-family="Arial" font-size="14" fill="#94a3b8">暂无图片</text>
    </svg>`);
  }
});

// 初始化数据库（自动创建必要的表）
initDatabase().then(() => {
  // 启动定时任务（每天0点自动同步）
  scheduler.startScheduler();
});

app.use(cors());
app.use(express.json({ limit: '10mb' })); // 限制请求体大小
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 简单的请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) { // 只记录慢请求
      console.log(`[SLOW] ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  next();
});

// 静态文件服务（后台管理页面）
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/phones', phoneRoutes);
app.use('/api/crawler', crawlerRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 根路径重定向到管理后台
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// 后台管理页面路由
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 爬虫管理页面路由
app.get('/crawler', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'crawler.html'));
});

// 404 处理
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Crawler panel: http://localhost:${PORT}/crawler`);
});
