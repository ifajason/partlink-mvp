import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';

describe('Inquiries API', () => {
  let sellerId: number;
  let productId: number;
  let inquiryId: number;

  beforeAll(async () => {
    // 創建測試用的商家
    const seller = await db.createSeller({
      userId: 1,
      businessName: 'Test Shop',
      contactPhone: '0912345678',
      address: 'Test Address',
      lineId: 'test_line',
      description: 'Test Description',
    });
    sellerId = seller.id;

    // 創建測試用的商品
    const product = await db.createProduct({
      sellerId: sellerId,
      brand: 'Toyota',
      model: 'Camry',
      year: '2020',
      partName: 'Front Bumper',
      condition: 'Used',
      price: '5000',
    });
    productId = product.id;
  });

  it('should create an inquiry with correct sellerId', async () => {
    const inquiry = await db.createInquiry({
      productId: productId,
      sellerId: sellerId,
      buyerName: 'Test Buyer',
      buyerPhone: '0987654321',
      buyerEmail: 'buyer@test.com',
      buyerLine: 'buyer_line_id',
      message: 'Is this part available?',
      status: 'pending',
    });

    inquiryId = inquiry.id;

    expect(inquiry).toBeDefined();
    expect(inquiry.sellerId).toBe(sellerId);
    expect(inquiry.productId).toBe(productId);
    expect(inquiry.buyerName).toBe('Test Buyer');
    expect(inquiry.buyerPhone).toBe('0987654321');
    expect(inquiry.buyerLine).toBe('buyer_line_id');
  });

  it('should retrieve inquiries by sellerId', async () => {
    const inquiries = await db.getInquiriesBySellerId(sellerId);

    expect(inquiries).toBeDefined();
    expect(inquiries.length).toBeGreaterThan(0);
    
    // 驗證所有詢價都屬於該商家
    inquiries.forEach(inquiry => {
      expect(inquiry.sellerId).toBe(sellerId);
    });

    // 驗證我們剛才創建的詢價在列表中
    const foundInquiry = inquiries.find(i => i.id === inquiryId);
    expect(foundInquiry).toBeDefined();
    expect(foundInquiry?.buyerName).toBe('Test Buyer');
  });

  it('should retrieve inquiry by ID', async () => {
    const inquiry = await db.getInquiryById(inquiryId);

    expect(inquiry).toBeDefined();
    expect(inquiry?.id).toBe(inquiryId);
    expect(inquiry?.sellerId).toBe(sellerId);
    expect(inquiry?.buyerPhone).toBe('0987654321');
  });

  it('should retrieve inquiries by buyer phone', async () => {
    const inquiries = await db.getInquiriesByBuyerPhone('0987654321');

    expect(inquiries).toBeDefined();
    expect(inquiries.length).toBeGreaterThan(0);
    
    const foundInquiry = inquiries.find(i => i.id === inquiryId);
    expect(foundInquiry).toBeDefined();
    expect(foundInquiry?.buyerName).toBe('Test Buyer');
  });

  it('should update inquiry status and reply', async () => {
    const replyText = 'Yes, this part is available. Price: 5000 TWD';
    
    await db.updateInquiry(inquiryId, {
      status: 'replied',
      sellerReply: replyText,
      repliedAt: new Date(),
    });

    const updatedInquiry = await db.getInquiryById(inquiryId);

    expect(updatedInquiry).toBeDefined();
    expect(updatedInquiry?.status).toBe('replied');
    expect(updatedInquiry?.sellerReply).toBe(replyText);
    expect(updatedInquiry?.repliedAt).toBeDefined();
  });

  afterAll(async () => {
    // 清理測試數據
    // 注意：實際生產環境中應該有更完善的清理機制
  });
});
