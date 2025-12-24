-- 升级数据库结构
USE shouji;

-- 添加更多品牌
INSERT IGNORE INTO brands (name) VALUES 
  ('OPPO'),
  ('一加'),
  ('realme'),
  ('vivo'),
  ('红米'),
  ('荣耀'),
  ('iPhone'),
  ('华为'),
  ('小米'),
  ('三星'),
  ('魅族'),
  ('中兴'),
  ('努比亚'),
  ('黑鲨'),
  ('iQOO'),
  ('传音'),
  ('联想'),
  ('摩托罗拉'),
  ('诺基亚'),
  ('索尼');

-- 扩展手机表结构
ALTER TABLE phones 
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL COMMENT '手机图片URL',
  ADD COLUMN IF NOT EXISTS official_price DECIMAL(10, 2) DEFAULT NULL COMMENT '官方价格',
  ADD COLUMN IF NOT EXISTS screen_size VARCHAR(20) DEFAULT NULL COMMENT '屏幕尺寸',
  ADD COLUMN IF NOT EXISTS battery VARCHAR(20) DEFAULT NULL COMMENT '电池容量',
  ADD COLUMN IF NOT EXISTS cpu VARCHAR(100) DEFAULT NULL COMMENT '处理器',
  ADD COLUMN IF NOT EXISTS camera VARCHAR(100) DEFAULT NULL COMMENT '摄像头',
  ADD COLUMN IF NOT EXISTS weight VARCHAR(20) DEFAULT NULL COMMENT '重量',
  ADD COLUMN IF NOT EXISTS dimensions VARCHAR(50) DEFAULT NULL COMMENT '尺寸',
  ADD COLUMN IF NOT EXISTS os VARCHAR(50) DEFAULT NULL COMMENT '操作系统',
  ADD COLUMN IF NOT EXISTS release_date DATE DEFAULT NULL COMMENT '发布日期',
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL COMMENT '描述',
  ADD COLUMN IF NOT EXISTS specs JSON DEFAULT NULL COMMENT '其他参数(JSON格式)';

-- 创建价格历史表
CREATE TABLE IF NOT EXISTS price_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_id INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  price_type ENUM('shop', 'official') DEFAULT 'shop' COMMENT '价格类型',
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phone_id) REFERENCES phones(id) ON DELETE CASCADE,
  INDEX idx_phone (phone_id),
  INDEX idx_date (recorded_at)
);

-- 创建导入记录表
CREATE TABLE IF NOT EXISTS import_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  total_records INT DEFAULT 0,
  success_records INT DEFAULT 0,
  failed_records INT DEFAULT 0,
  imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  error_message TEXT DEFAULT NULL
);
