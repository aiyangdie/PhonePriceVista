const pool = require('../config/db');

async function check() {
  const [r] = await pool.query(`
    SELECT 
      COUNT(*) as total, 
      SUM(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 ELSE 0 END) as with_image,
      SUM(CASE WHEN cpu IS NOT NULL AND cpu != '' THEN 1 ELSE 0 END) as with_cpu
    FROM phones
  `);
  console.log('总数:', r[0].total);
  console.log('有图片:', r[0].with_image);
  console.log('有CPU参数:', r[0].with_cpu);
  
  // 显示没有图片的手机
  const [noImg] = await pool.query(`
    SELECT DISTINCT b.name as brand, p.model 
    FROM phones p 
    LEFT JOIN brands b ON p.brand_id = b.id 
    WHERE p.image_url IS NULL OR p.image_url = ''
    ORDER BY b.name, p.model
  `);
  
  if (noImg.length > 0) {
    console.log('\n没有图片的手机:');
    noImg.forEach(p => console.log(`  - ${p.brand} ${p.model}`));
  }
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
