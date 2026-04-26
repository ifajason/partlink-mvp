import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * PartLink 數據庫架構
 * 支持訂閱制、多用戶、商品管理、詢價系統
 */

// ==================== 用戶和認證 ====================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== 商家 ====================

export const sellers = mysqlTable("sellers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // 關聯到 users 表（主帳號）
  businessName: varchar("businessName", { length: 255 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }).notNull(),
  address: text("address"),
  lineId: varchar("lineId", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Seller = typeof sellers.$inferSelect;
export type InsertSeller = typeof sellers.$inferInsert;

// ==================== 子帳號 ====================

export const subAccounts = mysqlTable("sub_accounts", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(), // 關聯到 sellers 表
  userId: int("userId").notNull(), // 關聯到 users 表
  role: mysqlEnum("role", ["owner", "member"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubAccount = typeof subAccounts.$inferSelect;
export type InsertSubAccount = typeof subAccounts.$inferInsert;

// ==================== 訂閱 ====================

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull().unique(), // 關聯到 sellers 表
  currentPlan: mysqlEnum("currentPlan", ["free", "basic", "pro", "enterprise"]).default("free").notNull(),
  nextPlan: mysqlEnum("nextPlan", ["free", "basic", "pro", "enterprise"]), // 用於降級，下個月生效
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active").notNull(),
  subscriptionStart: timestamp("subscriptionStart").notNull(),
  subscriptionEnd: timestamp("subscriptionEnd").notNull(),
  planChangeAt: timestamp("planChangeAt"), // 計劃變更時間（用於降級）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// 訂閱版本限制配置
export const SUBSCRIPTION_LIMITS = {
  free: {
    maxProducts: 10,
    maxSubAccounts: 1,
    maxPhotosPerProduct: 3,
    price: 0,
  },
  basic: {
    maxProducts: 50,
    maxSubAccounts: 2,
    maxPhotosPerProduct: 4,
    price: 599,
  },
  pro: {
    maxProducts: 200,
    maxSubAccounts: 4,
    maxPhotosPerProduct: 5,
    price: 1099,
  },
  enterprise: {
    maxProducts: 1000,
    maxSubAccounts: 6,
    maxPhotosPerProduct: 8,
    price: 1999,
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_LIMITS;

// ==================== 支付記錄 ====================

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(), // 關聯到 sellers 表
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("TWD").notNull(),
  paymentType: mysqlEnum("paymentType", ["subscription", "upgrade", "renewal"]).notNull(),
  fromPlan: mysqlEnum("fromPlan", ["free", "basic", "pro", "enterprise"]), // 升級前版本
  toPlan: mysqlEnum("toPlan", ["free", "basic", "pro", "enterprise"]).notNull(), // 升級後版本
  proratedDays: int("proratedDays"), // 按比例計算的天數（僅升級時）
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "success", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // 支付方式（信用卡、超商代碼等）
  transactionId: varchar("transactionId", { length: 255 }), // 綠界交易ID
  paymentGateway: varchar("paymentGateway", { length: 50 }).default("ecpay"), // 支付平台
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ==================== 商品 ====================

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(), // 關聯到 sellers 表
  brand: varchar("brand", { length: 100 }), // 品牌（字符串，支持手動輸入）
  model: varchar("model", { length: 100 }), // 車型（字符串，支持手動輸入）
  year: varchar("year", { length: 20 }), // 年份（字符串，支持範圍如 "2015-2018"）
  partName: varchar("partName", { length: 255 }).notNull(),
  partNumber: varchar("partNumber", { length: 100 }),
  condition: varchar("condition", { length: 100 }), // 狀況（字符串，支持手動輸入）
  price: varchar("price", { length: 50 }), // 價格（字符串，支持 "面議" 等）
  stock: int("stock").default(1),
  description: text("description"),
  status: mysqlEnum("status", ["active", "sold", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ==================== 商品照片 ====================

export const productImages = mysqlTable("product_images", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(), // 關聯到 products 表
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  imageKey: varchar("imageKey", { length: 500 }).notNull(), // S3 key
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = typeof productImages.$inferInsert;

// ==================== 詢價 ====================

export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(), // 關聯到 products 表
  sellerId: int("sellerId").notNull(), // 關聯到 sellers 表
  // 買家身份（強制 LINE 登入後從 users 表撈）
  buyerUserId: int("buyerUserId"), // 關聯到 users.id，可空（向後相容）
  // 補充聯絡資訊（強制 LINE 登入後 buyerName 從 LINE 自動帶入）
  buyerName: varchar("buyerName", { length: 100 }).notNull(),
  buyerPhone: varchar("buyerPhone", { length: 20 }),
  buyerLine: varchar("buyerLine", { length: 100 }),
  buyerEmail: varchar("buyerEmail", { length: 320 }),
  message: text("message"),
  status: mysqlEnum("status", ["pending", "replied", "closed"]).default("pending").notNull(),
  isUrgent: boolean("isUrgent").default(false),
  sellerReply: text("sellerReply"),
  repliedAt: timestamp("repliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

// ==================== 快速回覆模板 ====================

export const quickReplies = mysqlTable("quick_replies", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(), // 關聯到 sellers 表
  title: varchar("title", { length: 100 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuickReply = typeof quickReplies.$inferSelect;
export type InsertQuickReply = typeof quickReplies.$inferInsert;
