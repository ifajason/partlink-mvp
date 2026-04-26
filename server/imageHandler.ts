import { promises as fs } from 'fs';
import { join } from 'path';

export async function saveBase64Image(base64Data: string, productId: number, index: number): Promise<string> {
  try {
    // 檢查是否是 Base64 圖片
    if (!base64Data.startsWith('data:image')) {
      return base64Data; // 如果不是 Base64，直接返回
    }

    // 提取格式和數據
    const matches = base64Data.match(/data:image\/(\w+);base64,(.+)/);
    if (!matches) {
      return base64Data;
    }

    const [, format, base64String] = matches;
    const buffer = Buffer.from(base64String, 'base64');

    // 生成唯一文件名
    const filename = `product_${productId}_${index}_${Date.now()}.${format}`;
    // 存儲到項目根目錄的 uploads 目錄（後端提供靜態資源）
    const uploadDir = join(process.cwd(), 'uploads');
    const fullPath = join(uploadDir, filename);

    // 確保目錄存在
    await fs.mkdir(uploadDir, { recursive: true });

    // 寫入文件
    await fs.writeFile(fullPath, buffer);

    // 返回相對路徑（用於數據庫存儲）
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('[ImageHandler] 圖片保存失敗:', error);
    throw new Error('圖片保存失敗');
  }
}
