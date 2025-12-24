/**
 * 从JSON文件导入手机价格到数据库
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

// 解析手机数据
function parsePhoneData(text) {
  const lines = text.split('\n');
  const phones = [];
  let currentBrand = '';
  
  // 品牌关键词映射
  const brandKeywords = {
    'OPPO': ['Reno', 'Find', 'A3', 'A5', 'A2', 'A1', 'A96', 'A36', 'k12'],
    '一加': ['一加', 'Ace'],
    'realme': ['realme', 'reyalme', '真我', 'V60', 'Neo'],
    'vivo': ['X200', 'Y300', 'y300', 'y200', 'y100', 'y35', 'y36', 'y37', 'IQOO', 'iQOO'],
    '红米': ['红米', 'Note14', 'note14', 'Power', 'pilay', 'K80'],
    '荣耀': ['荣耀', '畅享', '畅玩'],
    'iPhone': ['16 ', '16 Pro'],
  };
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // 检测品牌标题
    if (trimmed.includes('一加手机') || trimmed.includes('一加')) {
      currentBrand = '一加';
      continue;
    }
    if (trimmed.includes('realme') || trimmed.includes('真我')) {
      currentBrand = 'realme';
      continue;
    }
    if (trimmed.includes('vivo系列')) {
      currentBrand = 'vivo';
      continue;
    }
    if (trimmed.includes('小米') || trimmed.includes('红米')) {
      currentBrand = '红米';
      continue;
    }
    
    // 解析手机信息
    // 提取价格 - 改进的正则表达式
    let price = 0;
    
    // 多种价格格式匹配
    const pricePatterns = [
      /(\d{3,5})\s*[¥￥元现]/, // 1855¥ 或 1855现货
      /[¥￥]\s*(\d{3,5})/,     // ¥1855
      /-(\d{4,5})$/,           // -5050 (iPhone格式)
      /(\d{3,5})\s*$/,         // 行尾的数字
    ];
    
    for (const pattern of pricePatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const p = parseInt(match[1]);
        if (p >= 100 && p <= 20000) {
          price = p;
          break;
        }
      }
    }
    
    // 跳过没有有效价格的行
    if (price < 100) continue;
    
    // 提取型号
    let model = '';
    let brand = currentBrand;
    
    // 匹配常见型号
    const modelPatterns = [
      /^(Reno\d+)/i,
      /^(Find\s*X\d+)/i,
      /^(A\d+\w*)/i,
      /^(k\d+\w*)/i,
      /^(一加\s*Ace\d*\w*)/,
      /^(realme\s*[\w\d\+]+)/i,
      /^(真我\s*[\w\d]+)/,
      /^(V\d+\w*)/i,
      /^(Neo\d*)/i,
      /^(X\d+\w*)/i,
      /^(Y\d+\w*)/i,
      /^(y\d+\w*)/,
      /^(IQOO\s*[\w\d]+)/i,
      /^(iQOO\s*[\w\d]+)/i,
      /^(Note\d+\w*)/i,
      /^(note\d+\w*)/,
      /^(红米\s*[\w\d]+)/,
      /^(Power)/i,
      /^(pilay\d+\w*)/i,
      /^(荣耀\s*[\w\d]+)/,
      /^(畅享\s*\d+)/,
      /^(畅玩\s*[\w\d]+)/,
      /^(\d+)\s+[\d\.]+寸/,  // iPhone 16
      /^(\d+\s*ProMax)/i,   // iPhone 16 ProMax
    ];
    
    for (const pattern of modelPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        model = match[1].trim();
        break;
      }
    }
    
    if (!model) continue;
    
    // 确定品牌
    for (const [b, keywords] of Object.entries(brandKeywords)) {
      for (const kw of keywords) {
        if (model.toLowerCase().includes(kw.toLowerCase()) || trimmed.toLowerCase().startsWith(kw.toLowerCase())) {
          brand = b;
          break;
        }
      }
    }
    
    // 提取RAM和存储
    const configMatch = trimmed.match(/(\d+)\s*[\+\-]\s*(\d+)/);
    let ram = 0, storage = 0;
    if (configMatch) {
      ram = parseInt(configMatch[1]);
      storage = parseInt(configMatch[2]);
    }
    
    // 提取颜色
    const colors = ['黑', '白', '蓝', '金', '紫', '青', '粉', '红', '银', '橙', '绿', '灰', '棕', '原', '光', '沙漠色'];
    let color = '';
    for (const c of colors) {
      if (trimmed.includes(c)) {
        color = c;
        break;
      }
    }
    
    // 提取库存状态
    let availability = '正常';
    if (trimmed.includes('现货')) availability = '现货';
    else if (trimmed.includes('没货') || trimmed.includes('نەخ')) availability = '没货';
    else if (trimmed.includes('怕抓')) availability = '怕抓';
    else if (trimmed.includes('原封')) availability = '原封';
    
    // 网络类型
    let networkType = '5G';
    if (trimmed.includes('4g') || trimmed.includes('4G')) networkType = '4G';
    
    phones.push({
      brand,
      model,
      ram,
      storage,
      color,
      price,
      availability,
      networkType,
      raw: trimmed
    });
  }
  
  return phones;
}

// 导入到数据库
async function importToDatabase(phones) {
  console.log(`准备导入 ${phones.length} 条手机数据...`);
  
  let imported = 0;
  let updated = 0;
  let failed = 0;
  
  for (const phone of phones) {
    try {
      // 查找品牌ID
      let [brands] = await pool.query('SELECT id FROM brands WHERE name = ?', [phone.brand]);
      let brandId;
      
      if (brands.length === 0) {
        // 创建新品牌
        const [result] = await pool.query('INSERT INTO brands (name) VALUES (?)', [phone.brand]);
        brandId = result.insertId;
        console.log(`创建新品牌: ${phone.brand}`);
      } else {
        brandId = brands[0].id;
      }
      
      // 查找是否存在相同手机
      const [existing] = await pool.query(`
        SELECT id FROM phones 
        WHERE brand_id = ? AND model = ? AND ram = ? AND storage = ? AND color = ?
      `, [brandId, phone.model, phone.ram, phone.storage, phone.color]);
      
      if (existing.length > 0) {
        // 更新价格
        await pool.query(`
          UPDATE phones SET 
            price = ?,
            availability = ?,
            network_type = ?,
            updated_at = NOW()
          WHERE id = ?
        `, [phone.price, phone.availability, phone.networkType, existing[0].id]);
        updated++;
      } else {
        // 插入新记录
        await pool.query(`
          INSERT INTO phones (brand_id, model, ram, storage, color, price, availability, network_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [brandId, phone.model, phone.ram, phone.storage, phone.color, phone.price, phone.availability, phone.networkType]);
        imported++;
      }
    } catch (err) {
      console.error(`导入失败 [${phone.brand} ${phone.model}]:`, err.message);
      failed++;
    }
  }
  
  return { imported, updated, failed };
}

// 主函数
async function main() {
  try {
    // 读取JSON文件
    const jsonPath = path.join(__dirname, '../../public/2025年5月02日.json');
    console.log('读取文件:', jsonPath);
    
    const content = fs.readFileSync(jsonPath, 'utf-8');
    
    // 解析数据
    const phones = parsePhoneData(content);
    console.log(`解析到 ${phones.length} 条手机数据`);
    
    // 显示部分数据预览
    console.log('\n数据预览:');
    phones.slice(0, 10).forEach(p => {
      console.log(`  ${p.brand} ${p.model} ${p.ram}+${p.storage} ${p.color} ¥${p.price} ${p.availability}`);
    });
    console.log('  ...\n');
    
    // 导入数据库
    const result = await importToDatabase(phones);
    
    console.log('\n========== 导入完成 ==========');
    console.log(`新增: ${result.imported}`);
    console.log(`更新: ${result.updated}`);
    console.log(`失败: ${result.failed}`);
    console.log('==============================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('导入失败:', error);
    process.exit(1);
  }
}

main();
