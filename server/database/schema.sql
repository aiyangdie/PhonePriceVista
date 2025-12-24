-- 创建数据库
CREATE DATABASE IF NOT EXISTS shouji CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE shouji;

-- 品牌表
CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 手机表
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
);

-- 插入默认品牌
INSERT INTO brands (name) VALUES 
  ('OPPO'),
  ('一加'),
  ('realme'),
  ('vivo'),
  ('红米'),
  ('荣耀'),
  ('iPhone')
ON DUPLICATE KEY UPDATE name = name;

-- 插入示例数据
INSERT INTO phones (brand_id, model, ram, storage, color, price, network_type, availability) VALUES
  (1, 'Reno13', 16, 256, '黑', 2485, '5G', '现货'),
  (1, 'Reno13', 12, 256, '白', 2075, '5G', '现货'),
  (1, 'FindX8', 12, 256, '黑', 3350, '5G', '正常'),
  (1, 'A3Pro', 12, 256, '青', 1365, '5G', '正常'),
  (2, '一加Ace3', 16, 512, '金', 2020, '5G', '现货'),
  (2, '一加Ace5', 12, 256, '绿', 2090, '5G', '正常'),
  (3, 'realme Neo7', 12, 256, '黑', 1855, '5G', '现货'),
  (3, 'realme 14Pro+', 12, 256, '灰', 1980, '5G', '原封'),
  (4, 'X200', 12, 256, '蓝', 3470, '5G', '现货'),
  (4, 'Y300Pro', 12, 256, '黑', 1525, '5G', '正常'),
  (5, 'Note14Pro+', 12, 256, '黑', 1650, '5G', '正常'),
  (5, 'Power', 12, 256, '黑', 2070, '5G', '现货'),
  (6, '荣耀x50', 12, 256, '黑', 1300, '5G', '正常'),
  (6, '荣耀X60i', 12, 256, '蓝', 1120, '5G', '正常'),
  (7, '16', 8, 128, '黑', 5050, '5G', '正常'),
  (7, '16 ProMax', 8, 256, '黑', 8650, '5G', '正常')
ON DUPLICATE KEY UPDATE price = VALUES(price);
