const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'aiyang',
  database: 'shouji',
  multipleStatements: true
};

async function upgradeDatabase() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ 已连接到数据库');
    
    // 添加更多品牌
    const brands = [
      'OPPO', '一加', 'realme', 'vivo', '红米', '荣耀', 'iPhone',
      '华为', '小米', '三星', '魅族', '中兴', '努比亚', '黑鲨',
      'iQOO', '传音', '联想', '摩托罗拉', '诺基亚', '索尼'
    ];
    
    for (const brand of brands) {
      await connection.query(
        'INSERT IGNORE INTO brands (name) VALUES (?)',
        [brand]
      );
    }
    console.log('✓ 品牌列表已更新');
    
    // 检查并添加新字段
    const newColumns = [
      { name: 'image_url', type: 'VARCHAR(500) DEFAULT NULL' },
      { name: 'official_price', type: 'DECIMAL(10, 2) DEFAULT NULL' },
      { name: 'screen_size', type: 'VARCHAR(20) DEFAULT NULL' },
      { name: 'battery', type: 'VARCHAR(20) DEFAULT NULL' },
      { name: 'cpu', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'camera', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'weight', type: 'VARCHAR(20) DEFAULT NULL' },
      { name: 'dimensions', type: 'VARCHAR(50) DEFAULT NULL' },
      { name: 'os', type: 'VARCHAR(50) DEFAULT NULL' },
      { name: 'release_date', type: 'DATE DEFAULT NULL' },
      { name: 'description', type: 'TEXT DEFAULT NULL' },
      { name: 'specs', type: 'JSON DEFAULT NULL' }
    ];
    
    for (const col of newColumns) {
      try {
        await connection.query(`ALTER TABLE phones ADD COLUMN ${col.name} ${col.type}`);
        console.log(`  + 添加字段: ${col.name}`);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
          console.log(`  - 字段 ${col.name} 已存在`);
        }
      }
    }
    console.log('✓ 手机表结构已更新');
    
    // 创建价格历史表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS price_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_id INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        price_type VARCHAR(20) DEFAULT 'shop',
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (phone_id) REFERENCES phones(id) ON DELETE CASCADE,
        INDEX idx_phone (phone_id),
        INDEX idx_date (recorded_at)
      )
    `);
    console.log('✓ 价格历史表已创建');
    
    // 创建导入记录表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS import_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        total_records INT DEFAULT 0,
        success_records INT DEFAULT 0,
        failed_records INT DEFAULT 0,
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending',
        error_message TEXT DEFAULT NULL
      )
    `);
    console.log('✓ 导入记录表已创建');
    
    // 显示统计
    const [brandCount] = await connection.query('SELECT COUNT(*) as count FROM brands');
    const [phoneCount] = await connection.query('SELECT COUNT(*) as count FROM phones');
    
    console.log('\n========== 升级完成 ==========');
    console.log(`品牌数量: ${brandCount[0].count}`);
    console.log(`手机数量: ${phoneCount[0].count}`);
    console.log('==============================\n');
    
  } catch (error) {
    console.error('升级失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

upgradeDatabase();
