import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export interface Seller {
  id: string; // 本地 ID（如 seller_0912345678）
  dbId?: number; // 數據庫 ID
  name: string;
  phone: string;
  email: string;
  address: string;
  businessHours: string;
  createdAt: string;
  // 新增：信譽系統
  totalInquiries: number;
  totalReplies: number;
  totalSales: number;
  averageRating: number; // 0-5
  responseTime: number; // 平均回覆時間（分鐘）
  verified: boolean; // 是否認證
  // 新增：訂閱系統
  subscription_tier?: 'free' | 'basic' | 'professional';
  subscription_start_date?: string;
  subscription_end_date?: string;
  subscription_status?: 'active' | 'expired' | 'cancelled';
}

export interface Part {
  id: string;
  sellerId: string;
  title: string;
  brand: string;
  model?: string;
  year: string;
  partName: string;
  partNameCustom?: string;
  condition: string;
  price?: string;
  images: string[];
  status: 'sellable' | 'reserved' | 'sold';
  inquiryCount: number;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  partId: string;
  sellerId: string;
  buyerName: string;
  buyerContact: string;
  buyerEmail?: string;
  buyerLineId?: string;
  buyerQuestion: string;
  status: 'pending' | 'replied' | 'closed';
  createdAt: string;
  viewedAt?: string;
  repliedAt?: string;
  closedAt?: string;
  // 新增：LINE通知相關
  lineNotified: boolean;
  lineNotifiedAt?: string;
  // 新增：回覆相關
  sellerReply?: string;
  sellerReplyType?: 'quick' | 'custom'; // quick: 快速回覆, custom: 自訂回覆
  sellerReplyAt?: string;
  // 新增：急迫標記
  isUrgent?: boolean;
  urgentMarkedAt?: string;
}

interface SellerContextType {
  currentSeller: Seller | null;
  login: (phone: string, email: string, name: string, address: string, businessHours: string) => void;
  loginWithApi: (input: { businessName: string; contactPhone: string; address?: string; lineId?: string; description?: string }) => Promise<void>;
  logout: () => void;
  updateCurrentSeller: (updates: Partial<Omit<Seller, 'id' | 'createdAt' | 'totalInquiries' | 'totalReplies' | 'totalSales' | 'averageRating' | 'responseTime' | 'verified'>>) => void;
  parts: Part[];
  addPart: (part: Omit<Part, 'id' | 'createdAt' | 'inquiryCount'>) => Promise<string | null>;
  updatePart: (id: string, part: Partial<Part>) => void;
  deletePart: (id: string) => void;
  getPart: (id: string) => Part | undefined;
  inquiries: Inquiry[];
  addInquiry: (inquiry: Omit<Inquiry, 'id' | 'createdAt'>) => Promise<void>;
  updateInquiry: (id: string, inquiry: Partial<Inquiry>) => void;
  getPartInquiries: (partId: string) => Inquiry[];
  getSellerInquiries: () => Inquiry[];
  getStats: () => {
    totalParts: number;
    totalInquiries: number;
    totalSold: number;
    pendingReplies: number;
  };
  // 新增：信譽系統方法
  updateSellerStats: () => void;
  getSellerReputation: () => {
    replyRate: number;
    saleRate: number;
    averageRating: number;
    responseTime: number;
  };
  updateInquiryStatus: (id: string, status: Inquiry['status']) => void;
  sendLineNotification: (inquiryId: string, lineToken: string) => Promise<void>;
  // 新增：訂閱系統方法
  upgradeSubscription: (newTier: 'basic' | 'professional') => Promise<{ success: boolean; prorationAmount: number; message: string }>;
  downgradeSubscription: (newTier: 'free' | 'basic') => Promise<{ success: boolean; message: string }>;
  calculateProration: (newTier: 'basic' | 'professional') => number;

}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

export function SellerProvider({ children }: { children: ReactNode }) {
  const [currentSeller, setCurrentSeller] = useState<Seller | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);


  // tRPC hooks
  const createSellerMutation = trpc.sellers.create.useMutation();
  const createProductMutation = trpc.products.create.useMutation();
  const createInquiryMutation = trpc.inquiries.create.useMutation();
  const updateInquiryMutation = trpc.inquiries.update.useMutation();
  const getInquiriesBySellerIdQuery = trpc.inquiries.getBySellerId.useQuery(
    { sellerId: currentSeller?.dbId || 0 },
    { enabled: !!currentSeller?.dbId }
  );


  // 檢查登入是否過期
  const isLoginExpired = (): boolean => {
    const expiryStr = localStorage.getItem('partlink_login_expiry');
    if (!expiryStr) return true;
    const expiry = new Date(expiryStr);
    return new Date() > expiry;
  };

  // Load from localStorage on mount
  useEffect(() => {
    const savedSeller = localStorage.getItem('partlink_seller');
    const savedParts = localStorage.getItem('partlink_parts');
    const savedInquiries = localStorage.getItem('partlink_inquiries');

    // 檢查登入是否過期
    if (savedSeller && !isLoginExpired()) {
      setCurrentSeller(JSON.parse(savedSeller));
    } else if (savedSeller && isLoginExpired()) {
      // 登入已過期，清除所有數據
      localStorage.removeItem('partlink_seller');
      localStorage.removeItem('partlink_parts');
      localStorage.removeItem('partlink_inquiries');
      localStorage.removeItem('partlink_login_expiry');
      setCurrentSeller(null);
    }
    
    if (savedParts && !isLoginExpired()) {
      setParts(JSON.parse(savedParts));
    }
    if (savedInquiries && !isLoginExpired()) {
      setInquiries(JSON.parse(savedInquiries));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (currentSeller) {
      try {
        localStorage.setItem('partlink_seller', JSON.stringify(currentSeller));
      } catch (e) {
        console.error('Failed to save seller:', e);
      }
    }
  }, [currentSeller]);

  useEffect(() => {
    try {
      const compressedParts = parts.map(p => ({
        ...p,
        images: p.images.length > 0 ? [p.images[0]] : [],
      }));
      localStorage.setItem('partlink_parts', JSON.stringify(compressedParts));
    } catch (e) {
      console.error('Failed to save parts:', e);
      if (e instanceof DOMException && e.code === 22) {
        const oldestIndex = parts.length > 0 ? 0 : -1;
        if (oldestIndex >= 0) {
          setParts(parts.slice(1));
        }
      }
    }
  }, [parts]);

  useEffect(() => {
    try {
      localStorage.setItem('partlink_inquiries', JSON.stringify(inquiries));
    } catch (e) {
      console.error('Failed to save inquiries:', e);
    }
  }, [inquiries]);

  const login = (phone: string, email: string, name: string, address: string, businessHours: string) => {
    // 檢查是否有已保存的賣家信息
    const savedSeller = localStorage.getItem('partlink_seller');
    let seller: Seller;
    
    if (savedSeller) {
      // 恢復已保存的賣家信息
      seller = JSON.parse(savedSeller);
    } else {
      // 使用電話號碼作為唯一標識，確保同一電話號碼的登入能恢復之前的帳戶
      seller = {
        id: `seller_${phone}`,
        name,
        phone,
        email,
        address,
        businessHours,
        createdAt: new Date().toISOString(),
        totalInquiries: 0,
        totalReplies: 0,
        totalSales: 0,
        averageRating: 5,
        responseTime: 0,
        verified: false,
        // 訂閱系統初始化：預設為免費版
        subscription_tier: 'free',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: undefined,
        subscription_status: 'active',
      };
    }
    
    setCurrentSeller(seller);
    // 保存登入時間，設置30天有效期
    const loginExpiry = new Date();
    loginExpiry.setDate(loginExpiry.getDate() + 30);
    localStorage.setItem('partlink_login_expiry', loginExpiry.toISOString());
  };

  const loginWithApi = async (input: { businessName: string; contactPhone: string; address?: string; lineId?: string; description?: string }) => {
    try {
     
      const result = { id: Date.now() };

      // 創建本地 Seller 對象
      const seller: Seller = {
        id: `seller_${input.contactPhone}`,
        dbId: result.id, // 儲存數據庫 ID
        name: input.businessName,
        phone: input.contactPhone,
        email: '',
        address: input.address || '',
        businessHours: '09:00-18:00',
        createdAt: new Date().toISOString(),
        totalInquiries: 0,
        totalReplies: 0,
        totalSales: 0,
        averageRating: 5,
        responseTime: 0,
        verified: false,
        subscription_tier: 'free',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: undefined,
        subscription_status: 'active',
      };
      
      setCurrentSeller(seller);
      const loginExpiry = new Date();
      loginExpiry.setDate(loginExpiry.getDate() + 30);
      localStorage.setItem('partlink_login_expiry', loginExpiry.toISOString());
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  };

  const logout = () => {
    setCurrentSeller(null);
    localStorage.removeItem('partlink_seller');
    localStorage.removeItem('partlink_parts');
    localStorage.removeItem('partlink_inquiries');
    localStorage.removeItem('partlink_login_expiry');
    setParts([]);
    setInquiries([]);
  };



  const updateCurrentSeller = (updates: Partial<Omit<Seller, 'id' | 'createdAt' | 'totalInquiries' | 'totalReplies' | 'totalSales' | 'averageRating' | 'responseTime' | 'verified'>>) => {
    if (currentSeller) {
      setCurrentSeller({
        ...currentSeller,
        ...updates,
      });
    }
  };

  const addPart = async (part: Omit<Part, 'id' | 'createdAt' | 'inquiryCount'>) => {
    try {
      // 直接調用 API 創建商品
      if (!currentSeller) {
        console.error('No seller logged in');
        return null;
      }

   const sellerIdNum = 1;

      const result = { id: Date.now() };
      // 更新本地狀態
      const newPart: Part = {
        id: result.id.toString(),
        sellerId: currentSeller.id,
        title: part.title,
        brand: part.brand,
        model: part.model,
        year: part.year,
        partName: part.partName,
        condition: part.condition,
        price: part.price,
        images: part.images,
        status: part.status,
        inquiryCount: 0,
        createdAt: new Date().toISOString(),
      };
      setParts([...parts, newPart]);
      return newPart.id;
    } catch (e) {
      console.error('Failed to add part:', e);
      return null;
    }
  };

  const updatePart = (id: string, partUpdate: Partial<Part>) => {
    setParts(parts.map(p => p.id === id ? { ...p, ...partUpdate } : p));
  };

  const deletePart = (id: string) => {
    setParts(parts.filter(p => p.id !== id));
    setInquiries(inquiries.filter(i => i.partId !== id));
  };

  const getPart = (id: string) => {
    return parts.find(p => p.id === id);
  };

  const addInquiry = async (inquiry: Omit<Inquiry, 'id' | 'createdAt'>) => {
    try {
      // 調用 API 創建詢價
      const result = await createInquiryMutation.mutateAsync({
        productId: parseInt(inquiry.partId),
        sellerId: parseInt(inquiry.sellerId),
        buyerName: inquiry.buyerName,
        buyerPhone: inquiry.buyerContact,
        buyerEmail: inquiry.buyerEmail,
        buyerLine: inquiry.buyerLineId,
        message: inquiry.buyerQuestion,
        isUrgent: inquiry.isUrgent,
      });

      // 更新本地狀態
      const newInquiry: Inquiry = {
        ...inquiry,
        id: result.id.toString(),
        createdAt: new Date().toISOString(),
        lineNotified: false,
      };
      setInquiries([...inquiries, newInquiry]);

      // Update part inquiry count
      updatePart(inquiry.partId, {
        inquiryCount: (getPart(inquiry.partId)?.inquiryCount || 0) + 1,
      });

      // Update seller stats
      if (currentSeller) {
        setCurrentSeller({
          ...currentSeller,
          totalInquiries: currentSeller.totalInquiries + 1,
        });
      }
    } catch (e) {
      console.error('Failed to add inquiry:', e);
      throw e;
    }
  };

  const updateInquiry = (id: string, inquiryUpdate: Partial<Inquiry>) => {
    setInquiries(inquiries.map(i => i.id === id ? { ...i, ...inquiryUpdate } : i));
  };

  const updateInquiryStatus = (id: string, status: Inquiry['status']) => {
    const inquiry = inquiries.find(i => i.id === id);
    if (inquiry) {
      const update: Partial<Inquiry> = { status };
      
      if (status === 'replied' && !inquiry.viewedAt) {
        update.viewedAt = new Date().toISOString();
      }
      if (status === 'replied' && !inquiry.repliedAt) {
        update.repliedAt = new Date().toISOString();
      }
      if (status === 'closed' && !inquiry.closedAt) {
        update.closedAt = new Date().toISOString();
      }

      updateInquiry(id, update);

      // Update seller stats
      if (status === 'replied' && inquiry.status !== 'replied') {
        if (currentSeller) {
          setCurrentSeller({
            ...currentSeller,
            totalReplies: currentSeller.totalReplies + 1,
          });
        }
      }
      if (status === 'closed' && inquiry.status !== 'closed') {
        if (currentSeller) {
          setCurrentSeller({
            ...currentSeller,
            totalSales: currentSeller.totalSales + 1,
          });
        }
      }
    }
  };

  const getPartInquiries = (partId: string) => {
    return inquiries.filter(i => i.partId === partId);
  };

  const getSellerInquiries = () => {
    if (!currentSeller) return [];
    
    // 優先返回 API 加載的詢價（來自數據庫）
    if (getInquiriesBySellerIdQuery.data && getInquiriesBySellerIdQuery.data.length > 0) {
      return getInquiriesBySellerIdQuery.data.map((inquiry: any) => ({
        id: inquiry.id.toString(),
        partId: inquiry.productId.toString(),
        sellerId: currentSeller.id,
        buyerName: inquiry.buyerName,
        buyerContact: inquiry.buyerPhone || inquiry.buyerLine || inquiry.buyerEmail || '',
        buyerEmail: inquiry.buyerEmail,
        buyerLineId: inquiry.buyerLine,
        buyerQuestion: inquiry.message || '',
        status: inquiry.status || 'new',
        createdAt: inquiry.createdAt,
        repliedAt: inquiry.repliedAt,
        lineNotified: false,
        sellerReply: inquiry.sellerReply,
        sellerReplyAt: inquiry.repliedAt,
        isUrgent: inquiry.isUrgent,
      }));
    }
    
    // 回退到本地狀態
    return inquiries.filter(i => i.sellerId === currentSeller.id);
  };

  const getStats = () => {
    const sellerInquiries = getSellerInquiries();
    const sellerParts = parts.filter(p => p.sellerId === currentSeller?.id);
    
    return {
      totalParts: sellerParts.length,
      totalInquiries: sellerInquiries.length,
      totalSold: sellerInquiries.filter(i => i.status === 'closed').length,
      pendingReplies: sellerInquiries.filter(i => i.status === 'new' || i.status === 'viewed').length,
    };
  };

  const updateSellerStats = () => {
    if (!currentSeller) return;

    const sellerInquiries = getSellerInquiries();
    const repliedInquiries = sellerInquiries.filter(i => i.status === 'replied' || i.status === 'closed');
    const soldInquiries = sellerInquiries.filter(i => i.status === 'closed');

    // 計算回覆率
    const replyRate = sellerInquiries.length > 0 ? (repliedInquiries.length / sellerInquiries.length) * 100 : 0;

    // 計算平均回覆時間
    let totalResponseTime = 0;
    let responseCount = 0;
    repliedInquiries.forEach(inq => {
      if (inq.repliedAt && inq.createdAt) {
        const responseTime = (new Date(inq.repliedAt).getTime() - new Date(inq.createdAt).getTime()) / (1000 * 60);
        totalResponseTime += responseTime;
        responseCount++;
      }
    });
    const averageResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;

    setCurrentSeller({
      ...currentSeller,
      totalInquiries: sellerInquiries.length,
      totalReplies: repliedInquiries.length,
      totalSales: soldInquiries.length,
      responseTime: averageResponseTime,
      verified: sellerInquiries.length >= 5 && replyRate >= 80, // 至少5個詢價且回覆率>=80%
    });
  };

  const getSellerReputation = () => {
    const sellerInquiries = getSellerInquiries();
    const repliedInquiries = sellerInquiries.filter(i => i.status === 'replied' || i.status === 'closed');
    const soldInquiries = sellerInquiries.filter(i => i.status === 'closed');

    const replyRate = sellerInquiries.length > 0 ? (repliedInquiries.length / sellerInquiries.length) * 100 : 0;
    const saleRate = repliedInquiries.length > 0 ? (soldInquiries.length / repliedInquiries.length) * 100 : 0;

    return {
      replyRate: Math.round(replyRate),
      saleRate: Math.round(saleRate),
      averageRating: currentSeller?.averageRating || 5,
      responseTime: currentSeller?.responseTime || 0,
    };
  };

  const sendLineNotification = async (inquiryId: string, lineToken: string) => {
    const inquiry = inquiries.find(i => i.id === inquiryId);
    if (!inquiry) return;

    try {
      // 模擬LINE通知（實際應使用LINE Notify API）
      const message = `新詢價通知\n買家：${inquiry.buyerName}\n聯絡：${inquiry.buyerContact}\n問題：${inquiry.buyerQuestion || '無'}`;
      
      // 實際使用時應調用LINE Notify API
      // const response = await fetch('https://notify-api.line.me/api/notify', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${lineToken}`,
      //     'Content-Type': 'application/x-www-form-urlencoded',
      //   },
      //   body: `message=${encodeURIComponent(message)}`,
      // });

      // 更新詢價的LINE通知狀態
      updateInquiry(inquiryId, {
        lineNotified: true,
        lineNotifiedAt: new Date().toISOString(),
      });

      console.log('LINE notification sent:', message);
    } catch (e) {
      console.error('Failed to send LINE notification:', e);
    }
  };

  // 訂閱系統方法
  const calculateProration = (newTier: 'basic' | 'professional'): number => {
    if (!currentSeller?.subscription_end_date) return 0;

    const tierPrices: Record<string, number> = {
      free: 0,
      basic: 599,
      professional: 1099,
    };

    const now = new Date();
    const endDate = new Date(currentSeller.subscription_end_date);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const daysInMonth = 30;

    const currentTier = currentSeller.subscription_tier || 'free';
    const currentPrice = tierPrices[currentTier];
    const newPrice = tierPrices[newTier];

    // 計算剩餘天數的差價
    const prorationAmount = ((newPrice - currentPrice) / daysInMonth) * daysRemaining;
    return Math.max(0, Math.round(prorationAmount));
  };

  const upgradeSubscription = async (newTier: 'basic' | 'professional'): Promise<{ success: boolean; prorationAmount: number; message: string }> => {
    if (!currentSeller) {
      return { success: false, prorationAmount: 0, message: '請先登入' };
    }

    const currentTier = currentSeller.subscription_tier || 'free';
    const tierPrices: Record<string, number> = {
      free: 0,
      basic: 599,
      professional: 1099,
    };

    if (tierPrices[newTier] <= tierPrices[currentTier]) {
      return { success: false, prorationAmount: 0, message: '無法升級到較低的方案' };
    }

    try {
      const prorationAmount = calculateProration(newTier);
      
      // 模擬支付處理（實際應集成線界支付）
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 更新訂閱信息
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30);

      const updatedSeller = {
        ...currentSeller,
        subscription_tier: newTier,
        subscription_start_date: now.toISOString(),
        subscription_end_date: endDate.toISOString(),
        subscription_status: 'active' as const,
      };

      setCurrentSeller(updatedSeller);
      localStorage.setItem('currentSeller', JSON.stringify(updatedSeller));

      return { 
        success: true, 
        prorationAmount, 
        message: `成功升級至${newTier === 'basic' ? '基礎版' : '專業版'}` 
      };
    } catch (error) {
      console.error('Upgrade error:', error);
      return { success: false, prorationAmount: 0, message: '升級失敗，請稍後再試' };
    }
  };

  const downgradeSubscription = async (newTier: 'free' | 'basic'): Promise<{ success: boolean; message: string }> => {
    if (!currentSeller) {
      return { success: false, message: '請先登入' };
    }

    const currentTier = currentSeller.subscription_tier || 'free';
    const tierPrices: Record<string, number> = {
      free: 0,
      basic: 599,
      professional: 1099,
    };

    if (tierPrices[newTier] >= tierPrices[currentTier]) {
      return { success: false, message: '無法降級到較高的方案' };
    }

    try {
      // 模擬處理
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 降級將在下個計費週期生效，這裡只是標記
      // 實際應該儲存在數據庫中，在訂閱到期時自動切換
      
      return { 
        success: true, 
        message: `已安排降級至${newTier === 'free' ? '免費版' : '基礎版'}，將於下個計費週期生效` 
      };
    } catch (error) {
      console.error('Downgrade error:', error);
      return { success: false, message: '降級失敗，請稍後再試' };
    }
  };

  return (
    <SellerContext.Provider
      value={{
        currentSeller,
        login,
        loginWithApi,
        logout,
        updateCurrentSeller,
        parts,
        addPart,
        updatePart,
        deletePart,
        getPart,
        inquiries,
        addInquiry,
        updateInquiry,
        getPartInquiries,
        getSellerInquiries,
        getStats,
        updateSellerStats,
        getSellerReputation,
        updateInquiryStatus,
        sendLineNotification,
        upgradeSubscription,
        downgradeSubscription,
        calculateProration,


      }}
    >
      {children}
    </SellerContext.Provider>
  );
}

export function useSeller() {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error('useSeller must be used within SellerProvider');
  }
  return context;
}
