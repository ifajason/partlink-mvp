/**
 * LINE Messaging API 推播服務
 *
 * 設計原則：
 * - 所有推播由後端觸發（不從前端打）
 * - 推播失敗只 log 不阻擋業務流程（詢價建立成功 > 通知）
 * - 自動重試 1 次（網路抖動）
 * - 統一兩種訊息：賣家收新詢價 / 買家收賣家回覆
 */

import { ENV } from "./env";
import * as db from "../db";

const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

interface LinePushResult {
  success: boolean;
  error?: string;
  status?: number;
}

/**
 * 底層推播 — 直接打 LINE Messaging API
 * 失敗會自動重試 1 次（針對網路錯誤，不針對 4xx）
 */
async function pushTextMessage(
  toLineUserId: string,
  text: string,
  attempt = 1
): Promise<LinePushResult> {
  if (!ENV.lineMessagingChannelAccessToken) {
    console.error("[LINE] LINE_MESSAGING_CHANNEL_ACCESS_TOKEN not configured");
    return { success: false, error: "Token not configured" };
  }

  if (!toLineUserId) {
    console.warn("[LINE] No target LINE userId provided");
    return { success: false, error: "No target userId" };
  }

  try {
    const response = await fetch(LINE_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.lineMessagingChannelAccessToken}`,
      },
      body: JSON.stringify({
        to: toLineUserId,
        messages: [{ type: "text", text }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.warn(
        `[LINE] Push failed (${response.status} ${response.statusText}): ${errorBody}`
      );
      // 4xx 錯誤不重試（金鑰錯、user 沒加好友等永久性錯誤）
      // 5xx 錯誤才重試一次
      if (response.status >= 500 && attempt < 2) {
        await new Promise(r => setTimeout(r, 500));
        return pushTextMessage(toLineUserId, text, attempt + 1);
      }
      return { success: false, error: errorBody, status: response.status };
    }

    return { success: true };
  } catch (error: any) {
    console.error(`[LINE] Push exception (attempt ${attempt}):`, error?.message || error);
    // 網路錯誤重試一次
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 500));
      return pushTextMessage(toLineUserId, text, attempt + 1);
    }
    return { success: false, error: error?.message || "Network error" };
  }
}

/**
 * 通知賣家有新詢價
 * 從 DB 撈賣家 lineId（不依賴前端傳值，避免 spoofing）
 */
export async function notifySellerNewInquiry(
  sellerId: number,
  inquiryId: number
): Promise<LinePushResult> {
  try {
    const seller = await db.getSellerById(sellerId);
    if (!seller) {
      console.warn(`[LINE] notifySellerNewInquiry: seller ${sellerId} not found`);
      return { success: false, error: "Seller not found" };
    }
    if (!seller.lineId) {
      console.warn(`[LINE] Seller ${sellerId} has no lineId — skip push`);
      return { success: false, error: "Seller has no lineId" };
    }

    const inquiry = await db.getInquiryById(inquiryId);
    if (!inquiry) {
      console.warn(`[LINE] Inquiry ${inquiryId} not found`);
      return { success: false, error: "Inquiry not found" };
    }

    const product = await db.getProductById(inquiry.productId);
    const productName = product
      ? `${product.brand || ""} ${product.model || ""} ${product.partName || ""}`.trim()
      : "（商品資訊缺失）";

    const message =
      `🔔 你有新的詢價！\n\n` +
      `商品：${productName}\n` +
      `買家：${inquiry.buyerName}\n` +
      (inquiry.buyerPhone ? `電話：${inquiry.buyerPhone}\n` : "") +
      (inquiry.message ? `\n訊息：${inquiry.message}\n` : "") +
      `\n請至 Part to Link 後台回覆，買家會立即收到 LINE 通知。`;

    return await pushTextMessage(seller.lineId, message);
  } catch (error: any) {
    console.error("[LINE] notifySellerNewInquiry error:", error?.message || error);
    return { success: false, error: error?.message };
  }
}

/**
 * 通知買家賣家已回覆
 * 從 DB 撈買家 lineId（透過 inquiry.buyerUserId → users.openId）
 */
export async function notifyBuyerSellerReplied(
  inquiryId: number
): Promise<LinePushResult> {
  try {
    const inquiry = await db.getInquiryById(inquiryId);
    if (!inquiry) {
      return { success: false, error: "Inquiry not found" };
    }
    if (!inquiry.buyerUserId) {
      console.warn(`[LINE] Inquiry ${inquiryId} has no buyerUserId — skip push`);
      return { success: false, error: "No buyerUserId" };
    }

    const buyer = await db.getUserById(inquiry.buyerUserId);
    if (!buyer) {
      console.warn(`[LINE] Buyer user ${inquiry.buyerUserId} not found`);
      return { success: false, error: "Buyer not found" };
    }

    // openId 格式為 "line_<lineUserId>"，解析回 LINE userId
    const buyerLineUserId = buyer.openId.startsWith("line_")
      ? buyer.openId.substring(5)
      : buyer.openId;

    const product = await db.getProductById(inquiry.productId);
    const productName = product
      ? `${product.brand || ""} ${product.model || ""} ${product.partName || ""}`.trim()
      : "（商品資訊缺失）";

    const seller = await db.getSellerById(inquiry.sellerId);
    const sellerName = seller?.businessName || "賣家";

    const message =
      `💬 賣家已回覆你的詢價！\n\n` +
      `商品：${productName}\n` +
      `賣家：${sellerName}\n\n` +
      `回覆內容：\n${inquiry.sellerReply || "（無內容）"}\n\n` +
      `如需後續聯絡，請直接私訊賣家或回到 Part to Link 查看。`;

    return await pushTextMessage(buyerLineUserId, message);
  } catch (error: any) {
    console.error("[LINE] notifyBuyerSellerReplied error:", error?.message || error);
    return { success: false, error: error?.message };
  }
}
