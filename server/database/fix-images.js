/**
 * 批量修复手机图片URL
 * 使用可靠的图片源
 */
const pool = require('../config/db');

// 可用的图片URL映射
const IMAGE_FIXES = {
  // OPPO
  'Reno13': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  'Reno12': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  'FindX8': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  'Findx8': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  'A3Pro': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  'A3x': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  'A3i': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  'A3': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  
  // realme
  '真我v60': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  '真我 v70': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  
  // vivo
  'y100+': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  'y300i': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  'iQOO z8': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  
  // 一加
  '一加Ace3v': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
  
  // 荣耀
  '畅玩50': 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1699347505.61498168.png',
};

async function fixImages() {
  console.log('开始修复图片URL...\n');
  
  try {
    // 直接将所有图片URL设置为一个通用的手机占位图
    // 因为gsmarena的图片防盗链太严格
    const placeholderUrl = 'https://placehold.co/300x400/f8fafc/64748b?text=Phone';
    
    // 获取所有手机
    const [phones] = await pool.query(`
      SELECT p.id, p.model, b.name as brand, p.image_url
      FROM phones p
      LEFT JOIN brands b ON p.brand_id = b.id
    `);
    
    let fixed = 0;
    
    for (const phone of phones) {
      // 检查当前图片是否是gsmarena的
      if (phone.image_url && phone.image_url.includes('gsmarena.com')) {
        // 生成一个带品牌型号的占位图
        const text = encodeURIComponent(`${phone.brand || ''} ${phone.model}`);
        const newUrl = `https://placehold.co/300x400/667eea/ffffff?text=${text}`;
        
        await pool.query('UPDATE phones SET image_url = ? WHERE id = ?', [newUrl, phone.id]);
        console.log(`更新: ${phone.brand} ${phone.model}`);
        fixed++;
      }
    }
    
    console.log(`\n完成! 共更新 ${fixed} 款手机的图片URL`);
    process.exit(0);
  } catch (error) {
    console.error('修复失败:', error);
    process.exit(1);
  }
}

fixImages();
