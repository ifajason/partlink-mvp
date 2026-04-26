import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('最終修復驗證', () => {
  let testSellerId: number;
  let testProductId: number;
  let testInquiryId: number;

  beforeAll(async () => {
    // 創建測試商家
    const seller = await db.createSeller({
      businessName: '測試商家',
      contactPhone: '0912345678',
      address: '台北市',
      lineId: '@test_seller',
      description: '測試商家描述',
    });
    testSellerId = seller.id;

    // 創建測試商品
    const product = await db.createProduct({
      sellerId: testSellerId,
      partName: '引擎蓋',
      partNumber: 'ENG-001',
      brand: 'Toyota',
      model: 'Corolla',
      condition: '新品',
      price: '5000',
      description: '全新引擎蓋',
    });
    testProductId = product.id;

    // 創建測試詢價
    const inquiry = await db.createInquiry({
      productId: testProductId,
      sellerId: testSellerId,
      buyerName: '測試買家',
      buyerPhone: '0987654321',
      buyerLine: '@test_buyer',
      buyerEmail: 'buyer@test.com',
      message: '請問有現貨嗎？',
      status: 'pending',
    });
    testInquiryId = inquiry.id;
  });

  describe('修復 1: 商品名稱 JOIN', () => {
    it('getInquiriesBySellerId 應該返回商品信息', async () => {
      const inquiries = await db.getInquiriesBySellerId(testSellerId);
      
      expect(inquiries).toHaveLength(1);
      const inquiry = inquiries[0];
      
      // 驗證詢價基本信息
      expect(inquiry.id).toBe(testInquiryId);
      expect(inquiry.buyerName).toBe('測試買家');
      expect(inquiry.buyerPhone).toBe('0987654321');
      expect(inquiry.buyerLine).toBe('@test_buyer');
      expect(inquiry.message).toBe('請問有現貨嗎？');
      
      // 驗證商品信息（JOIN 結果）
      expect(inquiry.partName).toBe('引擎蓋');
      expect(inquiry.partNumber).toBe('ENG-001');
      expect(inquiry.brand).toBe('Toyota');
      expect(inquiry.model).toBe('Corolla');
      expect(inquiry.condition).toBe('新品');
      expect(inquiry.price).toBe('5000');
    });

    it('商品名稱不應該是「未知商品」', async () => {
      const inquiries = await db.getInquiriesBySellerId(testSellerId);
      const inquiry = inquiries[0];
      
      expect(inquiry.partName).not.toBe('未知商品');
      expect(inquiry.partName).toBeTruthy();
    });
  });

  describe('修復 2: 快速回覆 API', () => {
    let quickReplyId: number;

    it('應該能創建快速回覆', async () => {
      const reply = await db.createQuickReply({
        sellerId: testSellerId,
        title: '已收到',
        content: '感謝您的詢問，我們已收到您的詢價，會盡快回電給您。',
      });

      expect(reply).toBeDefined();
      expect(reply.title).toBe('已收到');
      expect(reply.content).toContain('感謝您的詢問');
      quickReplyId = reply.id;
    });

    it('應該能按 sellerId 查詢快速回覆', async () => {
      const replies = await db.getQuickRepliesBySellerId(testSellerId);
      
      expect(replies.length).toBeGreaterThan(0);
      expect(replies[0].title).toBe('已收到');
    });

    it('應該能更新快速回覆', async () => {
      await db.updateQuickReply(quickReplyId, {
        title: '已收到（已更新）',
        content: '更新後的內容',
      });

      const replies = await db.getQuickRepliesBySellerId(testSellerId);
      const updated = replies.find(r => r.id === quickReplyId);
      
      expect(updated?.title).toBe('已收到（已更新）');
      expect(updated?.content).toBe('更新後的內容');
    });

    it('應該能刪除快速回覆', async () => {
      await db.deleteQuickReply(quickReplyId);
      
      const replies = await db.getQuickRepliesBySellerId(testSellerId);
      const deleted = replies.find(r => r.id === quickReplyId);
      
      expect(deleted).toBeUndefined();
    });
  });

  describe('狀態碼驗證', () => {
    it('詢價狀態應該是 pending/replied/closed', async () => {
      const inquiries = await db.getInquiriesBySellerId(testSellerId);
      const inquiry = inquiries[0];
      
      expect(['pending', 'replied', 'closed']).toContain(inquiry.status);
      expect(inquiry.status).toBe('pending');
    });

    it('不應該有 new/viewed/sold 狀態', async () => {
      const inquiries = await db.getInquiriesBySellerId(testSellerId);
      const inquiry = inquiries[0];
      
      expect(inquiry.status).not.toBe('new');
      expect(inquiry.status).not.toBe('viewed');
      expect(inquiry.status).not.toBe('sold');
    });
  });
});
