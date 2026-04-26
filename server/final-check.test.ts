import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('最終完整性檢查', () => {
  it('server/index.ts 應包含 CORS headers 配置', () => {
    const content = readFileSync(join(process.cwd(), 'server/index.ts'), 'utf-8');
    expect(content).toContain('Access-Control-Allow-Origin');
    expect(content).toContain('/uploads');
  });

  it('server/routers.ts 應包含所有必要的 router', () => {
    const content = readFileSync(join(process.cwd(), 'server/routers.ts'), 'utf-8');
    expect(content).toContain('products');
    expect(content).toContain('inquiries');
    expect(content).toContain('sellers');
  });

  it('server/routers.ts 應包含 /uploads/ 路徑前綴', () => {
    const content = readFileSync(join(process.cwd(), 'server/routers.ts'), 'utf-8');
    expect(content).toContain('/uploads/');
  });

  it('server/db.ts 應包含 getInquiriesBySellerId', () => {
    const content = readFileSync(join(process.cwd(), 'server/db.ts'), 'utf-8');
    expect(content).toContain('getInquiriesBySellerId');
  });

  it('server/imageHandler.ts 應返回 /uploads/ 路徑', () => {
    const content = readFileSync(join(process.cwd(), 'server/imageHandler.ts'), 'utf-8');
    expect(content).toContain('/uploads/');
    expect(content).toContain('saveBase64Image');
  });

  it('client/src/pages/Inquiries.tsx 應包含圖片 URL 處理', () => {
    const content = readFileSync(join(process.cwd(), 'client/src/pages/Inquiries.tsx'), 'utf-8');
    expect(content).toContain('displayImage');
    expect(content).toContain('useSeller');
  });

  it('client/src/pages/Inquiries.tsx 應包含快速回覆邏輯', () => {
    const content = readFileSync(join(process.cwd(), 'client/src/pages/Inquiries.tsx'), 'utf-8');
    expect(content).toContain('getQuickReplyText');
    expect(content).toContain('handleSendReply');
  });
});
