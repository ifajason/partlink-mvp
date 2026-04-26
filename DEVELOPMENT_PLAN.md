# PartLink MVP 開發計劃

## 項目概述

PartLink 是一個為修配廠和零件商設計的快速上架、集中管理詢價的SaaS平台。

## 核心功能

### 賣家端
1. **快速上架**（3步驟）
   - 拍照（最多3張）
   - 語音輸入（使用Web Speech API）
   - 自動解析 + 手動調整

2. **詢價管理**
   - 按狀態分類（待回覆/已回覆/已成交）
   - 詢價狀態管理（new→viewed→replied→sold）
   - 複製聯絡方式
   - 標記已回覆/已成交

3. **數據儀表板**
   - 總上架數
   - 總詢價數
   - 總售出數
   - 待回覆數
   - 最近詢價列表

### 買家端
1. **詢價頁面**（無需註冊）
   - 填寫姓名、聯絡方式、問題
   - 提交詢價

### 系統功能
1. **認證系統**（手機/郵箱 + OTP）
2. **詢價通知**（郵件）
3. **PWA支持**（可安裝到手機主屏幕）
4. **品牌數據庫**（初版50-100個品牌）
5. **響應式設計**（手機/平板/電腦）

## 技術棧

- **前端**：React 19 + TypeScript + TailwindCSS + shadcn/ui
- **存儲**：LocalStorage（MVP階段）
- **語音識別**：Web Speech API
- **部署**：Manus平台

## 數據模型

### Seller（賣家）
```typescript
{
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  businessHours: string;
  createdAt: string;
}
```

### Part（零件）
```typescript
{
  id: string;
  sellerId: string;
  title: string;
  brand: string;
  year: string;
  partName: string;
  condition: string;
  price?: string;
  images: string[];
  status: 'sellable' | 'reserved' | 'sold';
  inquiryCount: number;
  createdAt: string;
}
```

### Inquiry（詢價）
```typescript
{
  id: string;
  partId: string;
  sellerId: string;
  buyerName: string;
  buyerContact: string;
  buyerQuestion: string;
  status: 'new' | 'viewed' | 'replied' | 'sold';
  createdAt: string;
  viewedAt?: string;
  repliedAt?: string;
  soldAt?: string;
}
```

## 開發階段

### 第1階段：基礎架構（現在）
- [x] 項目初始化
- [ ] 設計系統架構
- [ ] 創建數據模型
- [ ] 設置LocalStorage存儲

### 第2階段：賣家端主頁面
- [ ] 認證頁面（手機登入）
- [ ] 儀表板（數據展示）
- [ ] 零件列表
- [ ] 詢價管理頁面

### 第3階段：快速上架流程
- [ ] 上架頁面
- [ ] 語音輸入功能
- [ ] 照片上傳
- [ ] 自動解析
- [ ] 品牌數據庫

### 第4階段：買家端
- [ ] 詢價頁面
- [ ] 詢價提交

### 第5階段：優化和部署
- [ ] 測試
- [ ] 優化
- [ ] PWA配置
- [ ] 部署

## 設計風格

- **主題**：現代、專業、易用
- **配色**：藍色系（信任、專業）
- **字體**：清晰、易讀
- **布局**：側邊欄導航 + 主內容區

## 下一步

1. 創建基礎頁面結構
2. 實現認證系統
3. 實現儀表板
4. 實現快速上架流程
