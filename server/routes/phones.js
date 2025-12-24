const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 缓存机制
let groupedPhonesCache = null;
let groupedPhonesCacheTime = 0;
const CACHE_TTL = 60000; // 1分钟缓存

// 清除缓存（数据变更时调用）
const clearCache = () => {
  groupedPhonesCache = null;
  groupedPhonesCacheTime = 0;
};

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 获取所有手机
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, b.name as brand_name 
      FROM phones p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      ORDER BY b.name, p.price
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching phones:', error);
    res.status(500).json({ error: 'Failed to fetch phones' });
  }
});

// 获取所有品牌
router.get('/brands', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM brands ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// 按品牌分组获取手机
router.get('/grouped', async (req, res) => {
  try {
    // 检查缓存
    const now = Date.now();
    if (groupedPhonesCache && (now - groupedPhonesCacheTime) < CACHE_TTL) {
      return res.json(groupedPhonesCache);
    }
    
    // 优化：单次查询获取所有数据
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
        availability: p.availability
      }))
    })).filter(g => g.phones.length > 0);
    
    // 更新缓存
    groupedPhonesCache = grouped;
    groupedPhonesCacheTime = now;
    
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching grouped phones:', error);
    res.status(500).json({ error: 'Failed to fetch grouped phones' });
  }
});

// 获取单个手机详情
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ error: 'Invalid phone ID' });
    }
    const [rows] = await pool.query(`
      SELECT p.*, b.name as brand_name 
      FROM phones p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE p.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Phone not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching phone:', error);
    res.status(500).json({ error: 'Failed to fetch phone' });
  }
});

// 添加新手机
router.post('/', async (req, res) => {
  try {
    const { 
      brand_id, model, ram, storage, color, price, network_type, availability,
      image_url, official_price, screen_size, battery, cpu, camera, weight, dimensions, os, description
    } = req.body;
    
    // 必填字段验证
    if (!brand_id || !model) {
      return res.status(400).json({ error: '品牌ID和型号为必填项' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO phones (brand_id, model, ram, storage, color, price, network_type, availability,
        image_url, official_price, screen_size, battery, cpu, camera, weight, dimensions, os, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [brand_id, model, ram, storage, color, price, network_type || '5G', availability || '正常',
       image_url, official_price, screen_size, battery, cpu, camera, weight, dimensions, os, description]
    );
    
    clearCache(); // 清除缓存
    res.status(201).json({ id: result.insertId, message: 'Phone added successfully' });
  } catch (error) {
    console.error('Error adding phone:', error);
    res.status(500).json({ error: 'Failed to add phone' });
  }
});

// 更新手机
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ error: 'Invalid phone ID' });
    }
    const { 
      brand_id, model, ram, storage, color, price, network_type, availability,
      image_url, official_price, screen_size, battery, cpu, camera, weight, dimensions, os, description
    } = req.body;
    
    await pool.query(
      `UPDATE phones SET brand_id=?, model=?, ram=?, storage=?, color=?, price=?, network_type=?, availability=?,
        image_url=?, official_price=?, screen_size=?, battery=?, cpu=?, camera=?, weight=?, dimensions=?, os=?, description=?
       WHERE id=?`,
      [brand_id, model, ram, storage, color, price, network_type, availability,
       image_url, official_price, screen_size, battery, cpu, camera, weight, dimensions, os, description, id]
    );
    
    clearCache(); // 清除缓存
    res.json({ message: 'Phone updated successfully' });
  } catch (error) {
    console.error('Error updating phone:', error);
    res.status(500).json({ error: 'Failed to update phone' });
  }
});

// 上传图片
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl, message: 'Image uploaded successfully' });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// 批量导入手机数据
router.post('/import', async (req, res) => {
  try {
    const { phones } = req.body;
    
    if (!Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const phone of phones) {
      try {
        // 查找或创建品牌
        let brandId = phone.brand_id;
        if (!brandId && phone.brand) {
          const [brands] = await pool.query('SELECT id FROM brands WHERE name = ?', [phone.brand]);
          if (brands.length > 0) {
            brandId = brands[0].id;
          } else {
            const [result] = await pool.query('INSERT INTO brands (name) VALUES (?)', [phone.brand]);
            brandId = result.insertId;
          }
        }
        
        // 检查是否已存在相同型号+颜色+配置的手机
        const [existing] = await pool.query(
          'SELECT id FROM phones WHERE brand_id = ? AND model = ? AND color = ? AND ram = ? AND storage = ?',
          [brandId, phone.model, phone.color, phone.ram, phone.storage]
        );
        
        if (existing.length > 0) {
          // 更新价格
          await pool.query(
            'UPDATE phones SET price = ?, availability = ?, official_price = ? WHERE id = ?',
            [phone.price, phone.availability || '正常', phone.official_price, existing[0].id]
          );
        } else {
          // 插入新记录
          await pool.query(
            `INSERT INTO phones (brand_id, model, ram, storage, color, price, network_type, availability, official_price) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [brandId, phone.model, phone.ram, phone.storage, phone.color, phone.price, 
             phone.network_type || '5G', phone.availability || '正常', phone.official_price]
          );
        }
        successCount++;
      } catch (err) {
        console.error('Import error for phone:', phone, err);
        failedCount++;
      }
    }
    
    // 记录导入日志
    await pool.query(
      'INSERT INTO import_logs (filename, total_records, success_records, failed_records, status) VALUES (?, ?, ?, ?, ?)',
      ['API Import', phones.length, successCount, failedCount, 'completed']
    );
    
    res.json({ 
      message: 'Import completed',
      total: phones.length,
      success: successCount,
      failed: failedCount
    });
    clearCache(); // 清除缓存
  } catch (error) {
    console.error('Error importing phones:', error);
    res.status(500).json({ error: 'Failed to import phones' });
  }
});

// 获取导入历史
router.get('/import/history', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM import_logs ORDER BY imported_at DESC LIMIT 20');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({ error: 'Failed to fetch import history' });
  }
});

// 删除手机
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ error: 'Invalid phone ID' });
    }
    await pool.query('DELETE FROM phones WHERE id = ?', [id]);
    clearCache(); // 清除缓存
    res.json({ message: 'Phone deleted successfully' });
  } catch (error) {
    console.error('Error deleting phone:', error);
    res.status(500).json({ error: 'Failed to delete phone' });
  }
});

// 添加品牌
router.post('/brands', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '品牌名称不能为空' });
    }
    const [result] = await pool.query('INSERT INTO brands (name) VALUES (?)', [name.trim()]);
    res.status(201).json({ id: result.insertId, message: 'Brand added successfully' });
  } catch (error) {
    console.error('Error adding brand:', error);
    res.status(500).json({ error: 'Failed to add brand' });
  }
});

// 删除品牌
router.delete('/brands/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ error: 'Invalid brand ID' });
    }
    // 检查是否有手机使用该品牌
    const [phones] = await pool.query('SELECT COUNT(*) as count FROM phones WHERE brand_id = ?', [id]);
    if (phones[0].count > 0) {
      return res.status(400).json({ error: '该品牌下还有手机，请先删除手机' });
    }
    await pool.query('DELETE FROM brands WHERE id = ?', [id]);
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

// ==================== 官方数据同步 API ====================
const phoneCrawler = require('../services/phoneCrawler');

// 获取预置手机数据库（用于搜索官方数据）
router.get('/official/database', (req, res) => {
  try {
    const data = phoneCrawler.getAllPhoneDatabase();
    res.json(data);
  } catch (error) {
    console.error('Error getting phone database:', error);
    res.status(500).json({ error: 'Failed to get phone database' });
  }
});

// 搜索官方手机数据
router.get('/official/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    const results = phoneCrawler.searchPhoneDatabase(q);
    res.json(results);
  } catch (error) {
    console.error('Error searching phone database:', error);
    res.status(500).json({ error: 'Failed to search phone database' });
  }
});

// 同步单个手机的官方数据
router.post('/official/sync/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await phoneCrawler.syncPhoneOfficialData(id);
    res.json(result);
  } catch (error) {
    console.error('Error syncing phone data:', error);
    res.status(500).json({ error: 'Failed to sync phone data' });
  }
});

// 批量同步所有手机的官方数据
router.post('/official/sync-all', async (req, res) => {
  try {
    const result = await phoneCrawler.syncAllPhonesOfficialData();
    res.json(result);
  } catch (error) {
    console.error('Error syncing all phones:', error);
    res.status(500).json({ error: 'Failed to sync all phones' });
  }
});

// 获取指定品牌和型号的官方信息
router.get('/official/info', async (req, res) => {
  try {
    const { brand, model } = req.query;
    if (!brand || !model) {
      return res.status(400).json({ error: 'Brand and model required' });
    }
    const info = await phoneCrawler.getPhoneInfo(brand, model);
    if (info) {
      res.json(info);
    } else {
      res.status(404).json({ error: 'Phone info not found' });
    }
  } catch (error) {
    console.error('Error getting phone info:', error);
    res.status(500).json({ error: 'Failed to get phone info' });
  }
});

module.exports = router;
