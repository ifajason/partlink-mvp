import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { saveBase64Image } from "./imageHandler";
import {
  notifySellerNewInquiry,
  notifyBuyerSellerReplied,
} from "./_core/lineNotify";

// === 詢價速率限制設定 ===
const RATE_LIMIT_5MIN_MAX = 1; // 5 分鐘內同一買家最多 1 筆
const RATE_LIMIT_24H_MAX = 5; // 24 小時內同一買家最多 5 筆

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  products: router({
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product) return null;
        const images = await db.getProductImagesByProductId(input.id);
        return {
          ...product,
          images: images
            .map((img: any) => (img.imageUrl ? `/uploads/${img.imageUrl}` : ""))
            .filter((url: any) => url),
        };
      }),

    getBySellerId: publicProcedure
      .input(z.object({ sellerId: z.number() }))
      .query(async ({ input }) => {
        const products = await db.getProductsBySellerId(input.sellerId);
        return Promise.all(
          products.map(async (p: any) => {
            const images = await db.getProductImagesByProductId(p.id);
            return {
              ...p,
              images: images
                .map((img: any) => (img.imageUrl ? `/uploads/${img.imageUrl}` : ""))
                .filter((url: any) => url),
            };
          })
        );
      }),

    create: publicProcedure
      .input(
        z.object({
          sellerId: z.number(),
          brand: z.string().optional(),
          model: z.string().optional(),
          year: z.string().optional(),
          partName: z.string(),
          price: z.string().optional(),
          images: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { images, ...productData } = input;

        // === 後端強制執行訂閱版本上限 ===
        const { plan, limits } = await db.getSubscriptionLimitsBySellerId(input.sellerId);
        const currentCount = await db.countActiveProductsBySellerId(input.sellerId);
        if (currentCount >= limits.maxProducts) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `已達 ${plan} 方案的商品數量上限（${limits.maxProducts} 個）。請升級方案以上架更多商品。`,
          });
        }

        // 建商品
        const product = await db.createProduct(productData);

        // 處理圖片（同樣後端檢查上限）
        if (images && images.length > 0) {
          const allowedImages = Math.min(images.length, limits.maxPhotosPerProduct);
          for (let i = 0; i < allowedImages; i++) {
            try {
              const imageUrl = await saveBase64Image(images[i], product.id, i);
              await db.addProductImage({
                productId: product.id,
                imageUrl: imageUrl,
                sortOrder: i,
                imageKey: imageUrl,
              });
            } catch (error) {
              console.error("[products.create] Image save failed:", error);
            }
          }
        }
        return product;
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          brand: z.string().optional(),
          model: z.string().optional(),
          year: z.string().optional(),
          partName: z.string().optional(),
          price: z.string().optional(),
          status: z.enum(["active", "sold", "inactive"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateProduct(id, updates);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProduct(input.id);
        return { success: true };
      }),
  }),

  inquiries: router({
    /**
     * 買家送出詢價
     * - 必須先 LINE 登入（ctx.user 不可為 null）
     * - 後端強制執行速率限制（防胡亂詢價）
     * - 建單成功後 push LINE 通知賣家（從 DB 撈賣家 lineId）
     */
    create: publicProcedure
      .input(
        z.object({
          productId: z.number(),
          sellerId: z.number(),
          buyerName: z.string().optional(), // 若 LINE 登入則自動帶入 displayName
          buyerPhone: z.string().optional(),
          buyerEmail: z.string().optional(),
          buyerLine: z.string().optional(), // 留作向後相容（買家文字輸入 LINE ID）
          message: z.string().optional(),
          isUrgent: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // === 強制買家 LINE 登入 ===
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "請先用 LINE 登入才能送出詢價",
          });
        }

        const buyerUserId = ctx.user.id;

        // === 速率限制：5 分鐘內最多 1 筆 ===
        const recent5min = await db.countInquiriesByBuyerInWindow(buyerUserId, 5 * 60 * 1000);
        if (recent5min >= RATE_LIMIT_5MIN_MAX) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "5 分鐘內只能送出 1 筆詢價，請稍後再試。",
          });
        }

        // === 速率限制：24 小時內最多 5 筆 ===
        const recent24h = await db.countInquiriesByBuyerInWindow(buyerUserId, 24 * 60 * 60 * 1000);
        if (recent24h >= RATE_LIMIT_24H_MAX) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "24 小時內最多送出 5 筆詢價，請明天再試。",
          });
        }

        // 建詢價（buyerName fallback 用 LINE displayName）
        const inquiry = await db.createInquiry({
          ...input,
          buyerName: input.buyerName || ctx.user.name || "買家",
          buyerUserId,
          status: "pending",
        });

        // === 後端觸發 LINE 推播給賣家 ===
        // 失敗只 log 不阻擋成功回傳（業務優先）
        notifySellerNewInquiry(input.sellerId, inquiry.id).catch(err => {
          console.error("[inquiries.create] Push to seller failed:", err);
        });

        return inquiry;
      }),

    getBySellerId: publicProcedure
      .input(z.object({ sellerId: z.number() }))
      .query(async ({ input }) => {
        const data = await db.getInquiriesBySellerId(input.sellerId);
        return data.map((item: any) => ({
          ...item,
          imageUrl: item.imageUrl ? `/uploads/${item.imageUrl}` : "",
        }));
      }),

    /**
     * 賣家回覆詢價
     * - 更新狀態 + sellerReply
     * - 若有 sellerReply 文字，push LINE 通知買家
     */
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "replied", "closed"]),
          sellerReply: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateInquiry(id, {
          ...updates,
          repliedAt: input.sellerReply ? new Date() : undefined,
        });

        // === 賣家有回覆內容 → push LINE 給買家 ===
        if (input.sellerReply && input.sellerReply.trim().length > 0) {
          notifyBuyerSellerReplied(id).catch(err => {
            console.error("[inquiries.update] Push to buyer failed:", err);
          });
        }

        return { success: true };
      }),
  }),

  sellers: router({
    create: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          businessName: z.string(),
          contactPhone: z.string(),
          lineId: z.string().optional(), // 賣家自己的 LINE userId（用於收推播）
        })
      )
      .mutation(async ({ input }) => await db.createSellerWithSubscription(input)),

    getByUserId: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSellerByUserId(input.userId);
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          businessName: z.string().optional(),
          contactPhone: z.string().optional(),
          address: z.string().optional(),
          lineId: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateSeller(id, updates);
        return { success: true };
      }),

    /**
     * 賣家當前訂閱方案 + 限制配置（前端顯示限額用）
     */
    getSubscriptionLimits: publicProcedure
      .input(z.object({ sellerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSubscriptionLimitsBySellerId(input.sellerId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
