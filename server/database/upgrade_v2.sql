-- 升级数据库 V2 - 添加自动同步和更多功能支持
USE shouji;

-- 同步日志表
CREATE TABLE IF NOT EXISTS sync_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sync_type ENUM('auto', 'manual') DEFAULT 'manual' COMMENT '同步类型',
  total_records INT DEFAULT 0,
  success_records INT DEFAULT 0,
  failed_records INT DEFAULT 0,
  status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
  error_message TEXT DEFAULT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_synced_at (synced_at)
);

-- 确保价格历史表存在
CREATE TABLE IF NOT EXISTS price_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_id INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  price_type ENUM('shop', 'official') DEFAULT 'shop' COMMENT '价格类型: shop=卖价, official=官方价',
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phone_id) REFERENCES phones(id) ON DELETE CASCADE,
  INDEX idx_phone (phone_id),
  INDEX idx_date (recorded_at)
);

-- 添加手机多图支持
ALTER TABLE phones 
  ADD COLUMN IF NOT EXISTS images JSON DEFAULT NULL COMMENT '多张图片URLs(JSON数组)',
  ADD COLUMN IF NOT EXISTS video_url VARCHAR(500) DEFAULT NULL COMMENT '视频URL',
  ADD COLUMN IF NOT EXISTS highlights TEXT DEFAULT NULL COMMENT '亮点特性',
  ADD COLUMN IF NOT EXISTS storage_options VARCHAR(200) DEFAULT NULL COMMENT '存储版本选项',
  ADD COLUMN IF NOT EXISTS color_options VARCHAR(200) DEFAULT NULL COMMENT '颜色选项';

-- 用户收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phone_id) REFERENCES phones(id) ON DELETE CASCADE,
  UNIQUE KEY unique_phone (phone_id)
);

-- 手机对比记录表
CREATE TABLE IF NOT EXISTS compare_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_ids JSON NOT NULL COMMENT '对比的手机ID数组',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统设置表
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入默认设置
INSERT INTO settings (setting_key, setting_value) VALUES 
  ('auto_sync_enabled', 'true'),
  ('auto_sync_time', '00:00'),
  ('site_name', '手机价格展示'),
  ('currency', 'CNY')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- 创建更新价格历史的触发器
DROP TRIGGER IF EXISTS record_price_change;
DELIMITER //
CREATE TRIGGER record_price_change
AFTER UPDATE ON phones
FOR EACH ROW
BEGIN
  IF OLD.price != NEW.price THEN
    INSERT INTO price_history (phone_id, price, price_type, recorded_at)
    VALUES (NEW.id, NEW.price, 'shop', NOW());
  END IF;
END//
DELIMITER ;
