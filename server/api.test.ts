import { describe, it, expect } from 'vitest';
import { db } from '../server/db';
import { sellers, products, inquiries } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('PartLink API Integration', () => {
  let testSellerId: number;
  let testProductId: number;

  it('should create a seller', async () => {
    const result = await db.insert(sellers).values({
      userId: 1,
      businessName: 'Test Auto Parts',
      contactPhone: '0912345678',
      address: '台北市中山區測試路123號',
      lineId: '@test-line',
      description: '專營BMW、賓士零件',
    }).returning();

    expect(result).toHaveLength(1);
    expect(result[0].businessName).toBe('Test Auto Parts');
    expect(result[0].contactPhone).toBe('0912345678');
    
    testSellerId = result[0].id;
  });

  it('should create a product', async () => {
    const result = await db.insert(products).values({
      sellerId: testSellerId,
      brand: 'BMW',
      model: '3系列',
      year: '2018',
      partName: '前保險桿',
      condition: '原廠拆件',
      price: '8000',
      images: ['https://example.com/image1.jpg'],
    }).returning();

    expect(result).toHaveLength(1);
    expect(result[0].partName).toBe('前保險桿');
    expect(result[0].brand).toBe('BMW');
    
    testProductId = result[0].id;
  });

  it('should retrieve product by id', async () => {
    const result = await db.select().from(products).where(eq(products.id, testProductId));

    expect(result).toHaveLength(1);
    expect(result[0].partName).toBe('前保險桿');
    expect(result[0].sellerId).toBe(testSellerId);
  });

  it('should create an inquiry', async () => {
    const result = await db.insert(inquiries).values({
      productId: testProductId,
      sellerId: testSellerId,
      buyerName: '測試買家',
      buyerPhone: '0987654321',
      buyerEmail: 'buyer@test.com',
      message: '請問這個零件還有庫存嗎？',
      status: 'pending',
    }).returning();

    expect(result).toHaveLength(1);
    expect(result[0].buyerName).toBe('測試買家');
    expect(result[0].productId).toBe(testProductId);
  });

  it('should retrieve inquiries by seller id', async () => {
    const result = await db.select().from(inquiries).where(eq(inquiries.sellerId, testSellerId));

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].sellerId).toBe(testSellerId);
  });

  // Cleanup
  it('should cleanup test data', async () => {
    await db.delete(inquiries).where(eq(inquiries.sellerId, testSellerId));
    await db.delete(products).where(eq(products.sellerId, testSellerId));
    await db.delete(sellers).where(eq(sellers.id, testSellerId));
  });
});
