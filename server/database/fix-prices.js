/**
 * 修复数据库中的错误价格
 */

const pool = require('../config/db');

async function fixPrices() {
  console.log('检查并修复错误价格...\n');
  
  try {
    // 查找价格异常的记录（小于100元）
    const [badPrices] = await pool.query(`
      SELECT p.id, b.name as brand, p.model, p.ram, p.storage, p.color, p.price 
      FROM phones p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE p.price < 100
      ORDER BY p.price
    `);
    
    console.log(`发现 ${badPrices.length} 条价格异常的记录:\n`);
    
    for (const phone of badPrices) {
      console.log(`  ID:${phone.id} ${phone.brand} ${phone.model} ${phone.ram}+${phone.storage} ${phone.color} = ¥${phone.price}`);
    }
    
    if (badPrices.length > 0) {
      console.log('\n删除价格异常的记录...');
      
      // 删除这些异常记录
      const ids = badPrices.map(p => p.id);
      await pool.query(`DELETE FROM phones WHERE id IN (?)`, [ids]);
      
      console.log(`已删除 ${badPrices.length} 条异常记录`);
    }
    
    // 统计当前数据
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 ELSE 0 END) as with_image,
        SUM(CASE WHEN cpu IS NOT NULL AND cpu != '' THEN 1 ELSE 0 END) as with_specs
      FROM phones
    `);
    
    console.log('\n========== 当前数据统计 ==========');
    console.log(`总手机数: ${stats[0].total}`);
    console.log(`有图片: ${stats[0].with_image}`);
    console.log(`有参数: ${stats[0].with_specs}`);
    console.log('==================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('修复失败:', error);
    process.exit(1);
  }
}

fixPrices();
