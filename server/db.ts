import { eq, and, desc, sql, gte, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, sellers, subscriptions, products,
  productImages, inquiries, subAccounts, payments,
  quickReplies, SUBSCRIPTION_LIMITS, SubscriptionPlan
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // === TiDB Cloud Serverless 強制 TLS，明確設定避免 URL parsing 問題 ===
      // 部分 mysql2 版本不會解析 URL 內的 ?ssl={"...":"..."} 參數
      // 用 mysql2.createPool 明確指定 ssl 選項，繞過 URL 解析陷阱
      const mysql = await import("mysql2/promise");
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: {
          minVersion: "TLSv1.2",
          rejectUnauthorized: true,
        },
        connectionLimit: 5, // Render free 方案 + TiDB free 方案都有限額
      });
      _db = drizzle(pool);
      console.log("[DB] Connected with explicit TLS config");
    } catch (error: any) {
      console.error("[DB] Connection setup failed:", error?.message || error);
      throw new Error(`資料庫連線失敗：${error?.message || error}`);
    }
  }
  return _db;
}

// === 核心：修正版商家與訂閱事務 (解決重複創建問題) ===
export async function createSellerWithSubscription(sellerData: any) {
  const db = await getDb();
  if (!db) throw new Error("DB Error");
  return await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(sellers).values(sellerData);
    const sellerId = Number(inserted.insertId);
    await tx.insert(subscriptions).values({
      sellerId, currentPlan: "free", status: "active",
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 31536000000)
    });
    // 記錄一筆初始模擬支付
    await tx.insert(payments).values({
      sellerId, amount: "0", paymentType: "subscription", toPlan: "free",
      paymentStatus: "success", paymentGateway: "system_init"
    });
    return (await tx.select().from(sellers).where(eq(sellers.id, sellerId)))[0];
  });
}

// === 補全 Routers 缺失的所有函數 ===
export async function createSeller(data: any) { 
  const db = await getDb(); const [res] = await db!.insert(sellers).values(data);
  return (await db!.select().from(sellers).where(eq(sellers.id, Number(res.insertId))))[0];
}
export async function createSubscription(data: any) {
  const db = await getDb(); const [res] = await db!.insert(subscriptions).values(data);
  return (await db!.select().from(subscriptions).where(eq(subscriptions.id, Number(res.insertId))))[0];
}
export async function updateSubscription(id: number, updates: any) {
  const db = await getDb(); await db!.update(subscriptions).set(updates).where(eq(subscriptions.id, id));
}
export async function getSellerById(id: number) { 
  const db = await getDb(); return (await db!.select().from(sellers).where(eq(sellers.id, id)))[0]; 
}
export async function getSellerByUserId(userId: number) {
  const db = await getDb(); return (await db!.select().from(sellers).where(eq(sellers.userId, userId)))[0];
}
export async function getSellerByPhone(phone: string) {
  const db = await getDb(); return (await db!.select().from(sellers).where(eq(sellers.contactPhone, phone)))[0];
}
export async function getSubscriptionBySellerId(sellerId: number) {
  const db = await getDb(); return (await db!.select().from(subscriptions).where(eq(subscriptions.sellerId, sellerId)))[0];
}
export async function updateSeller(id: number, updates: any) {
  const db = await getDb(); await db!.update(sellers).set(updates).where(eq(sellers.id, id));
}

// === 商品與圖片管理 ===
export async function getProductById(id: number) {
  const db = await getDb(); return (await db!.select().from(products).where(eq(products.id, id)))[0];
}
export async function getProductsBySellerId(id: number) {
  const db = await getDb(); return await db!.select().from(products).where(eq(products.sellerId, id)).orderBy(desc(products.createdAt));
}
export async function createProduct(data: any) {
  const db = await getDb(); const [res] = await db!.insert(products).values(data);
  return (await db!.select().from(products).where(eq(products.id, Number(res.insertId))))[0];
}
export async function updateProduct(id: number, updates: any) {
  const db = await getDb(); await db!.update(products).set(updates).where(eq(products.id, id));
}
export async function deleteProduct(id: number) {
  const db = await getDb(); await db!.update(products).set({ status: "inactive" }).where(eq(products.id, id));
}
export async function addProductImage(data: any) {
  const db = await getDb(); const [res] = await db!.insert(productImages).values(data);
  return (await db!.select().from(productImages).where(eq(productImages.id, Number(res.insertId))))[0];
}
export async function getProductImagesByProductId(id: number) {
  const db = await getDb(); return await db!.select().from(productImages).where(eq(productImages.productId, id));
}
export async function deleteProductImage(id: number) {
  const db = await getDb(); await db!.delete(productImages).where(eq(productImages.id, id));
}

// === 詢價與用戶邏輯 ===
export async function createInquiry(data: any) {
  const db = await getDb(); const [res] = await db!.insert(inquiries).values(data);
  return (await db!.select().from(inquiries).where(eq(inquiries.id, Number(res.insertId))))[0];
}
export async function getInquiryById(id: number) {
  const db = await getDb(); return (await db!.select().from(inquiries).where(eq(inquiries.id, id)))[0];
}
export async function getInquiriesBySellerId(id: number) {
  const db = await getDb();
  // JOIN inquiries 和 products 表，以獲取商品信息
  return await db!.select({
    id: inquiries.id,
    productId: inquiries.productId,
    sellerId: inquiries.sellerId,
    buyerName: inquiries.buyerName,
    buyerPhone: inquiries.buyerPhone,
    buyerEmail: inquiries.buyerEmail,
    buyerLine: inquiries.buyerLine,
    message: inquiries.message,
    status: inquiries.status,
    isUrgent: inquiries.isUrgent,
    sellerReply: inquiries.sellerReply,
    repliedAt: inquiries.repliedAt,
    createdAt: inquiries.createdAt,
    updatedAt: inquiries.updatedAt,
    // 商品信息
    partName: products.partName,
    partNumber: products.partNumber,
    brand: products.brand,
    model: products.model,
    condition: products.condition,
    price: products.price,
    description: products.description,
  })
    .from(inquiries)
    .leftJoin(products, eq(inquiries.productId, products.id))
    .where(eq(inquiries.sellerId, id))
    .orderBy(desc(inquiries.createdAt));
}
export async function getInquiriesByBuyerPhone(phone: string) {
  const db = await getDb(); return await db!.select().from(inquiries).where(eq(inquiries.buyerPhone, phone)).orderBy(desc(inquiries.createdAt));
}
export async function updateInquiry(id: number, updates: any) {
  const db = await getDb(); await db!.update(inquiries).set(updates).where(eq(inquiries.id, id));
}
export async function getUserByOpenId(openId: string) {
  const db = await getDb(); return (await db!.select().from(users).where(eq(users.openId, openId)))[0];
}
export async function getUserById(id: number) {
  const db = await getDb(); return (await db!.select().from(users).where(eq(users.id, id)))[0];
}
export async function upsertUser(data: any) {
  const db = await getDb();
  const existing = await db!.select().from(users).where(eq(users.openId, data.openId)).limit(1);
  if (existing.length > 0) {
    // 已存在 → 更新可變欄位（name、email、loginMethod、lastSignedIn）
    const updates: any = { lastSignedIn: data.lastSignedIn || new Date() };
    if (data.name) updates.name = data.name;
    if (data.email) updates.email = data.email;
    if (data.loginMethod) updates.loginMethod = data.loginMethod;
    await db!.update(users).set(updates).where(eq(users.id, existing[0].id));
    return (await db!.select().from(users).where(eq(users.id, existing[0].id)))[0];
  }
  const [res] = await db!.insert(users).values(data);
  return (await db!.select().from(users).where(eq(users.id, Number(res.insertId))))[0];
}

// === 詢價速率限制（防胡亂詢價） ===
/**
 * 算同一買家在指定時間窗口內送了幾筆詢價
 * @param buyerUserId users.id
 * @param windowMs 時間窗口（毫秒）
 */
export async function countInquiriesByBuyerInWindow(buyerUserId: number, windowMs: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const since = new Date(Date.now() - windowMs);
  const result = await db.select({ c: count() })
    .from(inquiries)
    .where(and(
      eq(inquiries.buyerUserId, buyerUserId),
      gte(inquiries.createdAt, since),
    ));
  return Number(result[0]?.c || 0);
}

// === 訂閱版本上限檢查（後端強制執行） ===
/**
 * 取得賣家當前訂閱的 plan 與該 plan 的限制配置
 */
export async function getSubscriptionLimitsBySellerId(sellerId: number) {
  const sub = await getSubscriptionBySellerId(sellerId);
  const plan: SubscriptionPlan = (sub?.currentPlan as SubscriptionPlan) || "free";
  return {
    plan,
    limits: SUBSCRIPTION_LIMITS[plan],
  };
}

/**
 * 算賣家目前的 active 商品數
 */
export async function countActiveProductsBySellerId(sellerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ c: count() })
    .from(products)
    .where(and(
      eq(products.sellerId, sellerId),
      eq(products.status, "active"),
    ));
  return Number(result[0]?.c || 0);
}

/**
 * 算商品目前的圖片數
 */
export async function countProductImages(productId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ c: count() })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  return Number(result[0]?.c || 0);
}


// === 快速回覆相關函數 ===
export async function getQuickRepliesBySellerId(sellerId: number) {
  const db = await getDb();
  return await db!.select()
    .from(quickReplies)
    .where(eq(quickReplies.sellerId, sellerId))
    .orderBy(desc(quickReplies.createdAt));
}

export async function createQuickReply(data: any) {
  const db = await getDb();
  const [res] = await db!.insert(quickReplies).values(data);
  return (await db!.select().from(quickReplies).where(eq(quickReplies.id, Number(res.insertId))))[0];
}

export async function updateQuickReply(id: number, updates: any) {
  const db = await getDb();
  await db!.update(quickReplies).set(updates).where(eq(quickReplies.id, id));
}

export async function deleteQuickReply(id: number) {
  const db = await getDb();
  await db!.delete(quickReplies).where(eq(quickReplies.id, id));
}
