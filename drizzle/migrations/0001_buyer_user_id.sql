-- ============================================================================
-- Migration: 新增 inquiries.buyerUserId 欄位 + 完整 schema 初始化
-- 日期：2026-04-27
-- 用途：MVP 第一次資料庫初始化（TiDB Cloud Serverless）
--
-- 執行方式：
-- 1. 開啟 TiDB Cloud Console → 你的 cluster → 左側 SQL Editor
-- 2. 整段貼進 Editor（包含最上面的 USE test;）
-- 3. 點右上角綠色 Run 按鈕
-- 4. 查看下方訊息，確認所有 CREATE TABLE 都成功
-- ============================================================================

-- ★ 切換到 test 資料庫（一定要在最上面）
USE test;

-- ===== users（買賣雙方共用的認證主表）=====
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  phone VARCHAR(20),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_openId (openId)
);

-- ===== sellers（商家）=====
CREATE TABLE IF NOT EXISTS sellers (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  businessName VARCHAR(255) NOT NULL,
  contactPhone VARCHAR(20) NOT NULL,
  address TEXT,
  lineId VARCHAR(100),
  description TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sellers_userId (userId),
  INDEX idx_sellers_lineId (lineId)
);

-- ===== sub_accounts（子帳號）=====
CREATE TABLE IF NOT EXISTS sub_accounts (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sellerId INT NOT NULL,
  userId INT NOT NULL,
  role ENUM('owner', 'member') NOT NULL DEFAULT 'member',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sub_accounts_sellerId (sellerId),
  INDEX idx_sub_accounts_userId (userId)
);

-- ===== subscriptions（訂閱）=====
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sellerId INT NOT NULL UNIQUE,
  currentPlan ENUM('free', 'basic', 'pro', 'enterprise') NOT NULL DEFAULT 'free',
  nextPlan ENUM('free', 'basic', 'pro', 'enterprise'),
  status ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
  subscriptionStart TIMESTAMP NOT NULL,
  subscriptionEnd TIMESTAMP NOT NULL,
  planChangeAt TIMESTAMP,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ===== payments（付款紀錄）=====
CREATE TABLE IF NOT EXISTS payments (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sellerId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'TWD',
  paymentType ENUM('subscription', 'upgrade', 'renewal') NOT NULL,
  fromPlan ENUM('free', 'basic', 'pro', 'enterprise'),
  toPlan ENUM('free', 'basic', 'pro', 'enterprise') NOT NULL,
  proratedDays INT,
  paymentStatus ENUM('pending', 'success', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  paymentMethod VARCHAR(50),
  transactionId VARCHAR(255),
  paymentGateway VARCHAR(50) DEFAULT 'ecpay',
  paidAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payments_sellerId (sellerId)
);

-- ===== products（商品）=====
CREATE TABLE IF NOT EXISTS products (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sellerId INT NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  year VARCHAR(20),
  partName VARCHAR(255) NOT NULL,
  partNumber VARCHAR(100),
  `condition` VARCHAR(100),
  price VARCHAR(50),
  stock INT DEFAULT 1,
  description TEXT,
  status ENUM('active', 'sold', 'inactive') NOT NULL DEFAULT 'active',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_sellerId (sellerId),
  INDEX idx_products_status (status)
);

-- ===== product_images（商品照片）=====
CREATE TABLE IF NOT EXISTS product_images (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  imageUrl VARCHAR(500) NOT NULL,
  imageKey VARCHAR(500) NOT NULL,
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_images_productId (productId)
);

-- ===== inquiries（詢價）=====
CREATE TABLE IF NOT EXISTS inquiries (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  sellerId INT NOT NULL,
  buyerUserId INT,                        -- ★ 新欄位：強制 LINE 登入後關聯到 users.id
  buyerName VARCHAR(100) NOT NULL,
  buyerPhone VARCHAR(20),
  buyerLine VARCHAR(100),
  buyerEmail VARCHAR(320),
  message TEXT,
  status ENUM('pending', 'replied', 'closed') NOT NULL DEFAULT 'pending',
  isUrgent BOOLEAN DEFAULT FALSE,
  sellerReply TEXT,
  repliedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inquiries_sellerId (sellerId),
  INDEX idx_inquiries_productId (productId),
  INDEX idx_inquiries_buyerUserId (buyerUserId),  -- ★ 新增 index 加速速率限制查詢
  INDEX idx_inquiries_createdAt (createdAt)
);

-- ===== quick_replies（快速回覆模板）=====
CREATE TABLE IF NOT EXISTS quick_replies (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sellerId INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_quick_replies_sellerId (sellerId)
);

-- ============================================================================
-- 完成！如果上面所有 CREATE TABLE 都顯示成功，可以執行下列 SELECT 驗證：
-- ============================================================================
SHOW TABLES;
