const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'aiyang',
  multipleStatements: true
};

// 解析手机数据的函数
function parsePhoneData(data) {
  const lines = data.split('\n').filter(line => line.trim());
  const dataLines = lines.slice(2);
  
  const phoneGroups = [];
  let currentBrand = '';
  
  // 颜色映射
  const colorMap = {
    '黑': '黑', '白': '白', '蓝': '蓝', '金': '金', '紫': '紫',
    '青': '青', '粉': '粉', '红': '红', '银': '银', '橙': '橙',
    '绿': '绿', '彩': '彩', '原': '原', '灰': '灰', '棕': '棕'
  };
  
  dataLines.forEach(line => {
    if (!line.trim()) return;
    
    // 检查是否是品牌标题行
    if (line.includes('系列') || line.includes('手机系烈')) {
      currentBrand = line.trim();
      return;
    }
    
    // 解析手机数据 - 多种格式
    const patterns = [
      /([A-Za-z0-9\s+\u4e00-\u9fa5]+?)\s*(\d+)[+\-](\d+)\s*(?:5g|4g)?\s*([^\d\s]+?)\s*(\d+)(?:¥|￥|元)?\s*(现货|怕抓|没货|原封|نەخ مال)?/i,
      /([A-Za-z0-9\s+\u4e00-\u9fa5]+?)\s*(\d+)[+\-](\d+)\s*([^\d\s]+?)\s*(?:5g|4g)?\s*(\d+)(?:¥|￥|元)?\s*(现货|怕抓|没货|原封)?/i
    ];
    
    let match = null;
    for (const pattern of patterns) {
      match = line.match(pattern);
      if (match) break;
    }
    
    if (match) {
      const [, model, ram, storage, color, price, status] = match;
      
      const cleanModel = model.trim();
      const cleanColor = color.trim();
      const cleanPrice = parseInt(price);
      const cleanStatus = status?.trim() || '正常';
      
      // 跳过无效价格
      if (isNaN(cleanPrice) || cleanPrice <= 0) return;
      
      // 确定品牌
      let brand = '';
      const modelLower = cleanModel.toLowerCase();
      
      if (modelLower.includes('reno') || modelLower.includes('find') || modelLower.includes('a3') || 
          modelLower.includes('a5') || modelLower.includes('a1') || modelLower.includes('a2') || 
          modelLower.includes('a96') || modelLower.includes('k12') || modelLower.includes('a36')) {
        brand = 'OPPO';
      } else if (modelLower.includes('ace') || cleanModel.includes('一加')) {
        brand = '一加';
      } else if (modelLower.includes('realme') || cleanModel.includes('真我') || 
                 modelLower.includes('v60') || modelLower.includes('v70') || modelLower.includes('neo')) {
        brand = 'realme';
      } else if (modelLower.includes('iqoo')) {
        brand = 'vivo';
      } else if (modelLower.includes('x200') || modelLower.includes('x60') || 
                 modelLower.startsWith('y3') || modelLower.startsWith('y1') || modelLower.startsWith('y2')) {
        brand = 'vivo';
      } else if (cleanModel.includes('红米') || modelLower.includes('note') || 
                 modelLower.includes('power') || modelLower.includes('pilay')) {
        brand = '红米';
      } else if (cleanModel.includes('荣耀') || cleanModel.includes('畅玩') || cleanModel.includes('畅享')) {
        brand = '荣耀';
      } else if (modelLower.match(/^16\s/) || modelLower.includes('promax')) {
        brand = 'iPhone';
      }
      
      if (!brand) return;
      
      // 查找或创建品牌组
      let group = phoneGroups.find(g => g.brand === brand);
      if (!group) {
        group = { brand, phones: [] };
        phoneGroups.push(group);
      }
      
      // 添加手机数据
      group.phones.push({
        brand,
        model: cleanModel,
        ram: parseInt(ram),
        storage: parseInt(storage),
        color: cleanColor,
        price: cleanPrice,
        networkType: line.toLowerCase().includes('5g') ? '5G' : '4G',
        availability: cleanStatus
      });
    }
  });
  
  return phoneGroups;
}

async function importData() {
  let connection;
  
  try {
    // 连接数据库（不指定数据库）
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ 已连接到 MySQL');
    
    // 创建数据库
    await connection.query('CREATE DATABASE IF NOT EXISTS shouji CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✓ 数据库 shouji 已创建');
    
    // 使用数据库
    await connection.query('USE shouji');
    
    // 创建品牌表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ 品牌表已创建');
    
    // 创建手机表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS phones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        brand_id INT NOT NULL,
        model VARCHAR(200) NOT NULL,
        ram INT NOT NULL,
        storage INT NOT NULL,
        color VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        network_type VARCHAR(10) DEFAULT '5G',
        availability VARCHAR(50) DEFAULT '正常',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
        INDEX idx_brand (brand_id),
        INDEX idx_price (price)
      )
    `);
    console.log('✓ 手机表已创建');
    
    // 清空现有数据
    await connection.query('DELETE FROM phones');
    await connection.query('DELETE FROM brands');
    await connection.query('ALTER TABLE brands AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE phones AUTO_INCREMENT = 1');
    console.log('✓ 已清空现有数据');
    
    // 读取 JSON 数据文件
    const jsonPath = path.join(__dirname, '../../public/2025年5月02日.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    console.log('✓ 已读取数据文件');
    
    // 解析数据
    const phoneGroups = parsePhoneData(jsonData);
    console.log(`✓ 解析到 ${phoneGroups.length} 个品牌`);
    
    // 插入品牌
    const brandIds = {};
    for (const group of phoneGroups) {
      const [result] = await connection.query(
        'INSERT INTO brands (name) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
        [group.brand]
      );
      brandIds[group.brand] = result.insertId;
    }
    console.log('✓ 品牌数据已插入');
    
    // 插入手机数据
    let phoneCount = 0;
    for (const group of phoneGroups) {
      const brandId = brandIds[group.brand];
      for (const phone of group.phones) {
        await connection.query(
          `INSERT INTO phones (brand_id, model, ram, storage, color, price, network_type, availability) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [brandId, phone.model, phone.ram, phone.storage, phone.color, phone.price, phone.networkType, phone.availability]
        );
        phoneCount++;
      }
    }
    console.log(`✓ 已插入 ${phoneCount} 条手机数据`);
    
    // 显示统计
    const [brandCount] = await connection.query('SELECT COUNT(*) as count FROM brands');
    const [totalPhones] = await connection.query('SELECT COUNT(*) as count FROM phones');
    
    console.log('\n========== 导入完成 ==========');
    console.log(`品牌数量: ${brandCount[0].count}`);
    console.log(`手机数量: ${totalPhones[0].count}`);
    console.log('==============================\n');
    
  } catch (error) {
    console.error('导入失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importData();
