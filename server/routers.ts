import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { saveBase64Image } from "./imageHandler";

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
        return { ...product, images: images.map((img: any) => img.imageUrl ? `/uploads/${img.imageUrl}` : '').filter((url: any) => url) };
      }),

    getBySellerId: publicProcedure
      .input(z.object({ sellerId: z.number() }))
      .query(async ({ input }) => {
        const products = await db.getProductsBySellerId(input.sellerId);
        return Promise.all(products.map(async (p: any) => {
          const images = await db.getProductImagesByProductId(p.id);
          return { ...p, images: images.map((img: any) => img.imageUrl ? `/uploads/${img.imageUrl}` : '').filter((url: any) => url) };
        }));
      }),

    create: publicProcedure
      .input(z.object({
        sellerId: z.number(),
        brand: z.string().optional(),
        model: z.string().optional(),
        year: z.string().optional(),
        partName: z.string(),
        price: z.string().optional(),
        images: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { images, ...productData } = input;
        const product = await db.createProduct(productData);
        if (images && images.length > 0) {
          for (let i = 0; i < images.length; i++) {
            try {
              const imageUrl = await saveBase64Image(images[i], product.id, i);
              await db.addProductImage({
                productId: product.id,
                imageUrl: imageUrl,
                sortOrder: i,
                imageKey: imageUrl,
              });
            } catch (error) {
              console.error("Image failed", error);
            }
          }
        }
        return product;
      }),
  }),

  inquiries: router({
    create: publicProcedure
      .input(z.object({
        productId: z.number(),
        sellerId: z.number(),
        buyerName: z.string(),
        buyerPhone: z.string(),
        buyerEmail: z.string().optional(),
        buyerLine: z.string().optional(),
        message: z.string().optional(),
        isUrgent: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => await db.createInquiry({ ...input, status: "pending" })),

    getBySellerId: publicProcedure
      .input(z.object({ sellerId: z.number() }))
      .query(async ({ input }) => {
        const data = await db.getInquiriesBySellerId(input.sellerId);
        return data.map((item: any) => ({
          ...item,
          // 【核心修正】統一回傳 Web 可讀取的完整路徑，徹底解決破圖
          imageUrl: item.imageUrl ? `/uploads/${item.imageUrl}` : ''
        }));
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "replied", "closed"]),
        sellerReply: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateInquiry(id, { ...updates, repliedAt: input.sellerReply ? new Date() : undefined });
        return { success: true };
      }),
  }),

  sellers: router({
    create: publicProcedure
      .input(z.object({
        userId: z.number(),
        businessName: z.string(),
        contactPhone: z.string(),
      }))
      .mutation(async ({ input }) => await db.createSellerWithSubscription(input)),
  }),
});

export type AppRouter = typeof appRouter;
