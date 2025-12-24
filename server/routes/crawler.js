const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const gsmCrawler = require('../services/gsmArenaCrawler');
const phoneCrawler = require('../services/phoneCrawler');

// 搜索手机（从 GSMArena）
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: '请提供搜索关键词' });
    }
    
    const results = await gsmCrawler.searchPhones(q);
    res.json({ 
      success: true, 
      count: results.length,
      data: results 
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: '搜索失败', message: error.message });
  }
});

// 获取手机详细信息
router.get('/details', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: '请提供手机链接' });
    }
    
    const details = await gsmCrawler.fetchPhoneDetails(url);
    if (details) {
      res.json({ success: true, data: details });
    } else {
      res.status(404).json({ error: '未找到手机信息' });
    }
  } catch (error) {
    console.error('Fetch details error:', error);
    res.status(500).json({ error: '获取详情失败', message: error.message });
  }
});

// 获取品牌手机列表
router.get('/brand/:brand', async (req, res) => {
  try {
    const { brand } = req.params;
    const { limit = 20 } = req.query;
    
    const brandSlug = gsmCrawler.BRAND_MAP[brand];
    if (!brandSlug) {
      return res.status(400).json({ 
        error: '不支持的品牌', 
        supportedBrands: Object.keys(gsmCrawler.BRAND_MAP) 
      });
    }
    
    const phones = await gsmCrawler.fetchBrandPhones(brandSlug, parseInt(limit));
    res.json({ 
      success: true, 
      brand,
      count: phones.length,
      data: phones 
    });
  } catch (error) {
    console.error('Fetch brand phones error:', error);
    res.status(500).json({ error: '获取品牌手机失败', message: error.message });
  }
});

// 获取最新手机
router.get('/latest', async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const phones = await gsmCrawler.fetchLatestPhones(parseInt(limit));
    res.json({ 
      success: true, 
      count: phones.length,
      data: phones 
    });
  } catch (error) {
    console.error('Fetch latest phones error:', error);
    res.status(500).json({ error: '获取最新手机失败', message: error.message });
  }
});

// 爬取并导入手机数据到数据库
router.post('/crawl-and-import', async (req, res) => {
  try {
    const { brand, limit = 10, fetchDetails = true } = req.body;
    
    // 获取品牌的手机列表
    let phones = [];
    if (brand && gsmCrawler.BRAND_MAP[brand]) {
      phones = await gsmCrawler.fetchBrandPhones(gsmCrawler.BRAND_MAP[brand], limit);
    } else {
      // 如果没有指定品牌，获取最新手机
      phones = await gsmCrawler.fetchLatestPhones(limit);
    }
    
    if (phones.length === 0) {
      return res.json({ success: false, message: '没有找到手机数据' });
    }
    
    // 获取详细信息
    let detailedPhones = phones;
    if (fetchDetails) {
      detailedPhones = await gsmCrawler.fetchMultiplePhoneDetails(phones, 1500);
    }
    
    // 导入到数据库
    let importedCount = 0;
    let updatedCount = 0;
    
    for (const phone of detailedPhones) {
      try {
        // 解析品牌名
        const phoneName = phone.name || '';
        let brandName = brand || '';
        
        // 从名称中提取品牌
        if (!brandName) {
          for (const [key] of Object.entries(gsmCrawler.BRAND_MAP)) {
            if (phoneName.toLowerCase().includes(key.toLowerCase())) {
              brandName = key;
              break;
            }
          }
        }
        if (!brandName) brandName = phoneName.split(' ')[0];
        
        // 查找或创建品牌
        let [brands] = await pool.query('SELECT id FROM brands WHERE name = ?', [brandName]);
        let brandId;
        if (brands.length > 0) {
          brandId = brands[0].id;
        } else {
          const [result] = await pool.query('INSERT INTO brands (name) VALUES (?)', [brandName]);
          brandId = result.insertId;
        }
        
        // 提取型号（去掉品牌名）
        let model = phoneName.replace(new RegExp(brandName, 'i'), '').trim();
        if (!model) model = phoneName;
        
        // 检查是否已存在
        const [existing] = await pool.query(
          'SELECT id FROM phones WHERE brand_id = ? AND model = ?',
          [brandId, model]
        );
        
        const phoneData = {
          brand_id: brandId,
          model,
          image_url: phone.image || phone.thumbnail,
          screen_size: phone.specs?.screenSize || '',
          battery: phone.specs?.battery || '',
          cpu: phone.specs?.cpu || phone.specs?.chipset || '',
          camera: phone.specs?.mainCamera || '',
          weight: phone.specs?.weight || '',
          dimensions: phone.specs?.dimensions || '',
          os: phone.specs?.os || '',
          ram: 0,
          storage: 0,
          color: '默认',
          price: 0,
          network_type: phone.specs?.network?.includes('5G') ? '5G' : '4G',
          availability: '正常',
        };
        
        // 解析内存配置
        const memMatch = (phone.specs?.memory || '').match(/(\d+)\s*GB\s*RAM/i);
        if (memMatch) phoneData.ram = parseInt(memMatch[1]);
        
        const storageMatch = (phone.specs?.memory || '').match(/(\d+)\s*GB(?:\s|,|$)/i);
        if (storageMatch) phoneData.storage = parseInt(storageMatch[1]);
        
        if (existing.length > 0) {
          // 更新现有记录
          await pool.query(`
            UPDATE phones SET 
              image_url = COALESCE(NULLIF(?, ''), image_url),
              screen_size = COALESCE(NULLIF(?, ''), screen_size),
              battery = COALESCE(NULLIF(?, ''), battery),
              cpu = COALESCE(NULLIF(?, ''), cpu),
              camera = COALESCE(NULLIF(?, ''), camera),
              weight = COALESCE(NULLIF(?, ''), weight),
              dimensions = COALESCE(NULLIF(?, ''), dimensions),
              os = COALESCE(NULLIF(?, ''), os)
            WHERE id = ?
          `, [
            phoneData.image_url, phoneData.screen_size, phoneData.battery,
            phoneData.cpu, phoneData.camera, phoneData.weight,
            phoneData.dimensions, phoneData.os, existing[0].id
          ]);
          updatedCount++;
        } else {
          // 插入新记录
          await pool.query(`
            INSERT INTO phones (brand_id, model, ram, storage, color, price, network_type, availability,
              image_url, screen_size, battery, cpu, camera, weight, dimensions, os)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            phoneData.brand_id, phoneData.model, phoneData.ram, phoneData.storage,
            phoneData.color, phoneData.price, phoneData.network_type, phoneData.availability,
            phoneData.image_url, phoneData.screen_size, phoneData.battery, phoneData.cpu,
            phoneData.camera, phoneData.weight, phoneData.dimensions, phoneData.os
          ]);
          importedCount++;
        }
      } catch (err) {
        console.error('Import error for phone:', phone.name, err.message);
      }
    }
    
    // 记录导入日志
    await pool.query(
      'INSERT INTO import_logs (filename, total_records, success_records, failed_records, status) VALUES (?, ?, ?, ?, ?)',
      [`Crawl: ${brand || 'Latest'}`, detailedPhones.length, importedCount + updatedCount, 
       detailedPhones.length - importedCount - updatedCount, 'completed']
    );
    
    res.json({
      success: true,
      message: '爬取并导入完成',
      total: detailedPhones.length,
      imported: importedCount,
      updated: updatedCount,
    });
  } catch (error) {
    console.error('Crawl and import error:', error);
    res.status(500).json({ error: '爬取导入失败', message: error.message });
  }
});

// 获取带图片和参数的手机列表
router.get('/phones-with-specs', async (req, res) => {
  try {
    const [phones] = await pool.query(`
      SELECT p.*, b.name as brand_name 
      FROM phones p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      ORDER BY b.name, p.model
    `);
    
    const result = phones.map(p => ({
      id: p.id,
      brand: p.brand_name,
      model: p.model,
      ram: p.ram,
      storage: p.storage,
      color: p.color,
      price: p.price,
      networkType: p.network_type,
      availability: p.availability,
      // 图片和参数
      image: p.image_url,
      officialPrice: p.official_price,
      specs: {
        screenSize: p.screen_size,
        battery: p.battery,
        cpu: p.cpu,
        camera: p.camera,
        weight: p.weight,
        dimensions: p.dimensions,
        os: p.os,
      }
    }));
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Fetch phones with specs error:', error);
    res.status(500).json({ error: '获取失败', message: error.message });
  }
});

// 缓存：避免频繁查询数据库
let phonesCache = null;
let phonesCacheTime = 0;
const CACHE_TTL = 60000; // 1分钟缓存

// 按品牌分组获取带图片和参数的手机
router.get('/phones-grouped-with-specs', async (req, res) => {
  try {
    // 检查缓存是否有效
    const now = Date.now();
    if (phonesCache && (now - phonesCacheTime) < CACHE_TTL) {
      return res.json(phonesCache);
    }
    
    // 使用单个优化查询代替两个查询
    const [phones] = await pool.query(`
      SELECT p.*, b.name as brand_name, b.id as brand_id
      FROM phones p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      ORDER BY b.name, p.price
    `);
    
    // 使用Map提高分组效率
    const brandMap = new Map();
    phones.forEach(p => {
      if (!brandMap.has(p.brand_name)) {
        brandMap.set(p.brand_name, []);
      }
      brandMap.get(p.brand_name).push(p);
    });
    
    const grouped = Array.from(brandMap.entries()).map(([brandName, brandPhones]) => ({
      brand: brandName,
      phones: brandPhones.map(p => ({
        id: p.id,
        brand: brandName,
        model: p.model,
        ram: p.ram,
        storage: p.storage,
        color: p.color,
        price: p.price,
        networkType: p.network_type,
        availability: p.availability,
        image: p.image_url,
        officialPrice: p.official_price,
        specs: {
          screenSize: p.screen_size,
          battery: p.battery,
          cpu: p.cpu,
          camera: p.camera,
          weight: p.weight,
          dimensions: p.dimensions,
          os: p.os,
        }
      }))
    })).filter(g => g.phones.length > 0);
    
    // 更新缓存
    phonesCache = grouped;
    phonesCacheTime = now;
    
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching grouped phones with specs:', error);
    res.status(500).json({ error: 'Failed to fetch grouped phones' });
  }
});

// ==================== 一键同步所有手机数据 ====================

// 同步所有手机的官方数据（从预置数据库）
router.post('/sync-all', async (req, res) => {
  try {
    // 获取所有手机
    const [phones] = await pool.query(`
      SELECT p.id, p.model, b.name as brand_name 
      FROM phones p 
      LEFT JOIN brands b ON p.brand_id = b.id
    `);
    
    let successCount = 0;
    let failedCount = 0;
    const results = [];
    
    for (const phone of phones) {
      const info = await phoneCrawler.getPhoneInfo(phone.brand_name, phone.model);
      
      if (info) {
        try {
          await pool.query(`
            UPDATE phones SET 
              image_url = ?,
              official_price = ?,
              screen_size = ?,
              battery = ?,
              cpu = ?,
              camera = ?,
              weight = ?,
              dimensions = ?,
              os = ?
            WHERE id = ?
          `, [info.image, info.official_price, info.screen_size, info.battery, 
              info.cpu, info.camera, info.weight, info.dimensions, info.os, phone.id]);
          
          successCount++;
          results.push({
            id: phone.id,
            brand: phone.brand_name,
            model: phone.model,
            matched: info.matched_model || phone.model,
            success: true
          });
        } catch (err) {
          failedCount++;
          results.push({
            id: phone.id,
            brand: phone.brand_name,
            model: phone.model,
            success: false,
            error: err.message
          });
        }
      } else {
        failedCount++;
        results.push({
          id: phone.id,
          brand: phone.brand_name,
          model: phone.model,
          success: false,
          error: '未找到匹配数据'
        });
      }
    }
    
    res.json({
      success: true,
      message: '同步完成',
      total: phones.length,
      synced: successCount,
      failed: failedCount,
      details: results
    });
  } catch (error) {
    console.error('Sync all error:', error);
    res.status(500).json({ error: '同步失败', message: error.message });
  }
});

// 获取预置数据库中的所有手机（用于查看可用数据）
router.get('/preset-database', (req, res) => {
  try {
    const data = phoneCrawler.getAllPhoneDatabase();
    res.json({ 
      success: true, 
      count: data.length,
      data 
    });
  } catch (error) {
    console.error('Get preset database error:', error);
    res.status(500).json({ error: '获取预置数据失败' });
  }
});

// 同步单个手机的数据
router.post('/sync/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await phoneCrawler.syncPhoneOfficialData(id);
    res.json(result);
  } catch (error) {
    console.error('Sync single phone error:', error);
    res.status(500).json({ error: '同步失败', message: error.message });
  }
});

// ==================== 定时任务相关 ====================

const scheduler = require('../services/scheduler');

// 获取同步状态
router.get('/sync-status', async (req, res) => {
  try {
    const status = await scheduler.getSyncStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ error: '获取状态失败', message: error.message });
  }
});

// 手动触发同步
router.post('/manual-sync', async (req, res) => {
  try {
    res.json({ success: true, message: '同步任务已启动，请稍候...' });
    // 异步执行同步
    scheduler.manualSync().catch(err => console.error('手动同步失败:', err));
  } catch (error) {
    res.status(500).json({ error: '触发同步失败', message: error.message });
  }
});

// ==================== 价格历史 ====================

// 获取手机价格历史
router.get('/price-history/:phoneId', async (req, res) => {
  try {
    const { phoneId } = req.params;
    const [history] = await pool.query(`
      SELECT ph.*, p.model, b.name as brand_name
      FROM price_history ph
      LEFT JOIN phones p ON ph.phone_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE ph.phone_id = ?
      ORDER BY ph.recorded_at DESC
      LIMIT 30
    `, [phoneId]);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ error: '获取价格历史失败', message: error.message });
  }
});

// ==================== 数据导出 ====================

// 导出所有数据为JSON
router.get('/export/json', async (req, res) => {
  try {
    const [phones] = await pool.query(`
      SELECT p.*, b.name as brand_name 
      FROM phones p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      ORDER BY b.name, p.model
    `);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=phones_${new Date().toISOString().split('T')[0]}.json`);
    res.json(phones);
  } catch (error) {
    res.status(500).json({ error: '导出失败', message: error.message });
  }
});

// 导出为CSV
router.get('/export/csv', async (req, res) => {
  try {
    const [phones] = await pool.query(`
      SELECT 
        b.name as 品牌,
        p.model as 型号,
        p.ram as 内存GB,
        p.storage as 存储GB,
        p.color as 颜色,
        p.price as 卖价,
        p.official_price as 官方价,
        p.availability as 状态,
        p.cpu as 处理器,
        p.battery as 电池,
        p.screen_size as 屏幕,
        p.camera as 摄像头,
        p.os as 系统
      FROM phones p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      ORDER BY b.name, p.model
    `);
    
    // 生成CSV
    const headers = Object.keys(phones[0] || {}).join(',');
    const rows = phones.map(p => Object.values(p).map(v => `"${v || ''}"`).join(',')).join('\n');
    const csv = headers + '\n' + rows;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=phones_${new Date().toISOString().split('T')[0]}.csv`);
    res.send('\uFEFF' + csv); // BOM for Excel
  } catch (error) {
    res.status(500).json({ error: '导出失败', message: error.message });
  }
});

// ==================== 手机对比 ====================

// 获取对比数据
router.post('/compare', async (req, res) => {
  try {
    const { ids } = req.body; // [1, 2, 3]
    if (!ids || !Array.isArray(ids) || ids.length < 2) {
      return res.status(400).json({ error: '请选择至少2款手机进行对比' });
    }
    
    // 安全验证：确保所有id都是有效的数字
    const validIds = ids.filter(id => Number.isInteger(Number(id)) && Number(id) > 0).map(Number);
    if (validIds.length < 2) {
      return res.status(400).json({ error: '无效的手机ID' });
    }
    
    const placeholders = validIds.map(() => '?').join(',');
    const [phones] = await pool.query(`
      SELECT p.*, b.name as brand_name 
      FROM phones p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE p.id IN (${placeholders})
    `, validIds);
    
    // 记录对比历史
    await pool.query(`
      INSERT INTO compare_history (phone_ids) VALUES (?)
    `, [JSON.stringify(ids)]);
    
    res.json({ success: true, data: phones });
  } catch (error) {
    res.status(500).json({ error: '对比失败', message: error.message });
  }
});

// ==================== 收藏功能 ====================

// 获取收藏列表
router.get('/favorites', async (req, res) => {
  try {
    const [favorites] = await pool.query(`
      SELECT p.*, b.name as brand_name, f.created_at as favorited_at
      FROM favorites f
      LEFT JOIN phones p ON f.phone_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY f.created_at DESC
    `);
    res.json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ error: '获取收藏失败', message: error.message });
  }
});

// 添加收藏
router.post('/favorites/:phoneId', async (req, res) => {
  try {
    const phoneId = parseInt(req.params.phoneId);
    if (!phoneId || phoneId <= 0) {
      return res.status(400).json({ error: '无效的手机ID' });
    }
    await pool.query(`INSERT IGNORE INTO favorites (phone_id) VALUES (?)`, [phoneId]);
    res.json({ success: true, message: '已收藏' });
  } catch (error) {
    res.status(500).json({ error: '收藏失败', message: error.message });
  }
});

// 取消收藏
router.delete('/favorites/:phoneId', async (req, res) => {
  try {
    const phoneId = parseInt(req.params.phoneId);
    if (!phoneId || phoneId <= 0) {
      return res.status(400).json({ error: '无效的手机ID' });
    }
    await pool.query(`DELETE FROM favorites WHERE phone_id = ?`, [phoneId]);
    res.json({ success: true, message: '已取消收藏' });
  } catch (error) {
    res.status(500).json({ error: '取消收藏失败', message: error.message });
  }
});

module.exports = router;
