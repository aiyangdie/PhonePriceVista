/**
 * 数据库初始化脚本
 * 自动创建必要的表（如果不存在）
 */

const pool = require('../config/db');

async function initDatabase() {
  console.log('[Database] 正在检查并初始化数据库表...');
  
  try {
    // 创建同步日志表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sync_type ENUM('auto', 'manual') DEFAULT 'manual',
        total_records INT DEFAULT 0,
        success_records INT DEFAULT 0,
        failed_records INT DEFAULT 0,
        status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
        error_message TEXT DEFAULT NULL,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_synced_at (synced_at)
      )
    `);
    
    // 创建价格历史表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS price_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_id INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        price_type ENUM('shop', 'official') DEFAULT 'shop',
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone (phone_id),
        INDEX idx_date (recorded_at)
      )
    `);
    
    // 创建收藏表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_phone (phone_id)
      )
    `);
    
    // 创建对比历史表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS compare_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_ids JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建导入日志表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS import_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) DEFAULT NULL,
        total_records INT DEFAULT 0,
        success_records INT DEFAULT 0,
        failed_records INT DEFAULT 0,
        status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
        error_message TEXT DEFAULT NULL,
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_imported_at (imported_at)
      )
    `);
    
    // 检查phones表是否有新字段，如果没有则添加
    const columnsToAdd = [
      { name: 'image_url', sql: 'ADD COLUMN image_url VARCHAR(500) DEFAULT NULL' },
      { name: 'official_price', sql: 'ADD COLUMN official_price DECIMAL(10, 2) DEFAULT NULL' },
      { name: 'screen_size', sql: 'ADD COLUMN screen_size VARCHAR(20) DEFAULT NULL' },
      { name: 'battery', sql: 'ADD COLUMN battery VARCHAR(20) DEFAULT NULL' },
      { name: 'cpu', sql: 'ADD COLUMN cpu VARCHAR(100) DEFAULT NULL' },
      { name: 'camera', sql: 'ADD COLUMN camera VARCHAR(100) DEFAULT NULL' },
      { name: 'weight', sql: 'ADD COLUMN weight VARCHAR(20) DEFAULT NULL' },
      { name: 'dimensions', sql: 'ADD COLUMN dimensions VARCHAR(50) DEFAULT NULL' },
      { name: 'os', sql: 'ADD COLUMN os VARCHAR(50) DEFAULT NULL' },
    ];
    
    for (const col of columnsToAdd) {
      try {
        const [rows] = await pool.query(`
          SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'shouji' AND TABLE_NAME = 'phones' AND COLUMN_NAME = ?
        `, [col.name]);
        
        if (rows.length === 0) {
          await pool.query(`ALTER TABLE phones ${col.sql}`);
          console.log(`[Database] 添加字段: phones.${col.name}`);
        }
      } catch (err) {
        // 忽略错误，字段可能已存在
      }
    }
    
    console.log('[Database] 数据库初始化完成 ✓');
    return true;
  } catch (error) {
    console.error('[Database] 初始化失败:', error.message);
    return false;
  }
}

module.exports = { initDatabase };
