/**
 * 检查未匹配的手机型号
 */
const pool = require('../config/db');

async function checkMissing() {
  try {
    const [phones] = await pool.query(`
      SELECT DISTINCT b.name as brand, p.model 
      FROM phones p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE p.image_url IS NULL OR p.image_url = ''
      ORDER BY b.name, p.model
    `);
    
    console.log(`\n未匹配的手机型号 (${phones.length} 款):\n`);
    
    let currentBrand = '';
    for (const p of phones) {
      if (p.brand !== currentBrand) {
        currentBrand = p.brand;
        console.log(`\n【${currentBrand}】`);
      }
      console.log(`  - ${p.model}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkMissing();
