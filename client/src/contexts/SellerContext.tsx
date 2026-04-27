/**
 * SellerContext — 全新架構（2026-04-27 Phase 2B）
 *
 * 重大變更（vs 舊版）：
 * - 完全移除 localStorage 商業資料儲存
 * - 透過 tRPC auth.me 從 cookie 取得當前 user
 * - 透過 tRPC sellers.getByUserId 取得當前 seller 紀錄（如有）
 * - 區分「currentUser」（LINE 登入身份）與「currentSeller」（商家設定）
 * - 商品/詢價直接走 tRPC，不再寫 localStorage
 *
 * 三種登入狀態：
 * 1. 未登入        → currentUser=null, currentSeller=null
 * 2. 已 LINE 登入但沒設商家 → currentUser=有, currentSeller=null（顯示設定表單）
 * 3. 已 LINE 登入且有商家 → currentUser=有, currentSeller=有（正常 dashboard）
 *
 * 向後相容：保留舊的 parts/inquiries/addPart 等介面為 noop 存根，
 *           讓尚未遷移的舊檔案（EditPart、Inquiries 等）不會崩潰。
 *           實際的商品/詢價資料應透過 tRPC hooks 直接取得。
 */

import { createContext, useContext, ReactNode, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import type { User, Seller as DbSeller } from "../../../drizzle/schema";

// ============================================================
// 向後相容的型別（給舊檔案用，新檔案請直接用 DbSeller）
// ============================================================

export interface Seller {
  id: string;
  dbId?: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  businessHours: string;
  createdAt: string;
  totalInquiries: number;
  totalReplies: number;
  totalSales: number;
  averageRating: number;
  responseTime: number;
  verified: boolean;
  subscription_tier?: "free" | "basic" | "professional";
  subscription_start_date?: string;
  subscription_end_date?: string;
  subscription_status?: "active" | "expired" | "cancelled";
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
  status: "sellable" | "reserved" | "sold";
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
  status: "pending" | "replied" | "closed";
  createdAt: string;
  viewedAt?: string;
  repliedAt?: string;
  closedAt?: string;
  lineNotified: boolean;
  lineNotifiedAt?: string;
  sellerReply?: string;
  sellerReplyType?: "quick" | "custom";
  sellerReplyAt?: string;
  isUrgent?: boolean;
  urgentMarkedAt?: string;
}

// ============================================================
// Context interface
// ============================================================

export interface SellerContextType {
  // === 新架構（請新檔案使用） ===
  currentUser: User | null;
  /** 商家資料（DB record）。注意：型別跟舊 Seller interface 不同 */
  currentSellerDb: DbSeller | null;
  isLoading: boolean;
  needsSellerSetup: boolean;
  createSellerProfile: (input: {
    businessName: string;
    contactPhone: string;
    address?: string;
    description?: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;

  // === 向後相容（給舊檔案用，逐步遷移後可刪） ===
  /** @deprecated 改用 currentSellerDb */
  currentSeller: Seller | null;
  /** @deprecated 改用 trpc.products.getBySellerId */
  parts: Part[];
  /** @deprecated 改用 trpc.inquiries.getBySellerId */
  inquiries: Inquiry[];
  /** @deprecated 改用 trpc.products.create */
  addPart: (part: any) => Promise<string | null>;
  /** @deprecated */
  updatePart: (id: string, part: any) => void;
  /** @deprecated */
  deletePart: (id: string) => void;
  /** @deprecated */
  getPart: (id: string) => Part | undefined;
  /** @deprecated */
  addInquiry: (inq: any) => Promise<void>;
  /** @deprecated */
  updateInquiry: (id: string, inq: any) => void;
  /** @deprecated */
  getPartInquiries: (partId: string) => Inquiry[];
  /** @deprecated */
  getSellerInquiries: () => Inquiry[];
  /** @deprecated */
  getStats: () => { totalParts: number; totalInquiries: number; totalSold: number; pendingReplies: number };
  /** @deprecated */
  updateSellerStats: () => void;
  /** @deprecated */
  getSellerReputation: () => { replyRate: number; saleRate: number; averageRating: number; responseTime: number };
  /** @deprecated */
  updateInquiryStatus: (id: string, status: any) => void;
  /** @deprecated */
  sendLineNotification: (inquiryId: string, lineToken: string) => Promise<void>;
  /** @deprecated */
  upgradeSubscription: (newTier: any) => Promise<{ success: boolean; prorationAmount: number; message: string }>;
  /** @deprecated */
  downgradeSubscription: (newTier: any) => Promise<{ success: boolean; message: string }>;
  /** @deprecated */
  calculateProration: (newTier: any) => number;
  /** @deprecated 改用 createSellerProfile */
  loginWithApi: (input: any) => Promise<void>;
  /** @deprecated */
  login: (...args: any[]) => void;
  /** @deprecated */
  updateCurrentSeller: (updates: any) => void;
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

// ============================================================
// Provider
// ============================================================

export function SellerProvider({ children }: { children: ReactNode }) {
  // 透過 cookie 取得當前 user（auth.me）
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 30 * 1000,
  });
  const currentUser = (meQuery.data as User | null) ?? null;

  // 取得 seller 紀錄
  const sellerQuery = trpc.sellers.getByUserId.useQuery(
    { userId: currentUser?.id ?? 0 },
    { enabled: !!currentUser?.id, retry: false }
  );
  const currentSellerDb = (sellerQuery.data as DbSeller | undefined) ?? null;

  // === 把 DbSeller 轉成舊 Seller 型別（向後相容） ===
  const currentSeller: Seller | null = currentSellerDb
    ? {
        id: `seller_${currentSellerDb.id}`,
        dbId: currentSellerDb.id,
        name: currentSellerDb.businessName,
        phone: currentSellerDb.contactPhone,
        email: "",
        address: currentSellerDb.address || "",
        businessHours: "",
        createdAt: currentSellerDb.createdAt?.toString() || new Date().toISOString(),
        totalInquiries: 0,
        totalReplies: 0,
        totalSales: 0,
        averageRating: 0,
        responseTime: 0,
        verified: false,
        subscription_tier: "free",
        subscription_status: "active",
      }
    : null;

  // Mutations
  const createSellerMutation = trpc.sellers.create.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();

  // 啟動時清除舊 localStorage cruft（一次性）
  useEffect(() => {
    const oldKeys = ["partlink_seller", "partlink_parts", "partlink_inquiries", "partlink_login_expiry", "device_id"];
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) localStorage.removeItem(key);
    });
    Object.keys(localStorage)
      .filter(key => key.startsWith("seller_") || key.startsWith("buyer_"))
      .forEach(key => localStorage.removeItem(key));
  }, []);

  // === Operations ===

  const createSellerProfile = async (input: {
    businessName: string;
    contactPhone: string;
    address?: string;
    description?: string;
  }) => {
    if (!currentUser) throw new Error("尚未登入");

    const lineUserId = currentUser.openId.startsWith("line_")
      ? currentUser.openId.substring(5)
      : currentUser.openId;

    await createSellerMutation.mutateAsync({
      userId: currentUser.id,
      businessName: input.businessName,
      contactPhone: input.contactPhone,
      lineId: lineUserId,
    });

    await utils.sellers.getByUserId.invalidate({ userId: currentUser.id });
  };

  const refresh = async () => {
    await utils.auth.me.invalidate();
    if (currentUser?.id) {
      await utils.sellers.getByUserId.invalidate({ userId: currentUser.id });
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      console.warn("[Logout] Backend logout failed:", e);
    }
    await utils.invalidate();
    window.location.href = "/";
  };

  // === 向後相容存根（不做事，避免舊檔案崩潰） ===
  const noop = () => {};
  const noopAsync = async () => {};
  const noopReturnNull = async () => null;
  const noopReturnUndefined = () => undefined;
  const emptyArray = [] as any[];

  const value: SellerContextType = {
    // 新架構
    currentUser,
    currentSellerDb,
    isLoading: meQuery.isLoading || (!!currentUser && sellerQuery.isLoading),
    needsSellerSetup: !!currentUser && !currentSellerDb && !sellerQuery.isLoading,
    createSellerProfile,
    refresh,
    logout,

    // 向後相容
    currentSeller,
    parts: emptyArray,
    inquiries: emptyArray,
    addPart: noopReturnNull,
    updatePart: noop,
    deletePart: noop,
    getPart: noopReturnUndefined,
    addInquiry: noopAsync,
    updateInquiry: noop,
    getPartInquiries: () => emptyArray,
    getSellerInquiries: () => emptyArray,
    getStats: () => ({ totalParts: 0, totalInquiries: 0, totalSold: 0, pendingReplies: 0 }),
    updateSellerStats: noop,
    getSellerReputation: () => ({ replyRate: 0, saleRate: 0, averageRating: 0, responseTime: 0 }),
    updateInquiryStatus: noop,
    sendLineNotification: noopAsync,
    upgradeSubscription: async () => ({ success: false, prorationAmount: 0, message: "暫不支援" }),
    downgradeSubscription: async () => ({ success: false, message: "暫不支援" }),
    calculateProration: () => 0,
    loginWithApi: noopAsync,
    login: noop,
    updateCurrentSeller: noop,
  };

  return <SellerContext.Provider value={value}>{children}</SellerContext.Provider>;
}

// ============================================================
// Hook
// ============================================================

export function useSeller(): SellerContextType {
  const ctx = useContext(SellerContext);
  if (!ctx) {
    throw new Error("useSeller must be used within SellerProvider");
  }
  return ctx;
}
