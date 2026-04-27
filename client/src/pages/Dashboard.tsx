/**
 * 賣家儀表板（Phase 2B 重寫）
 *
 * 三個渲染狀態：
 * 1. 未登入 (currentUser=null) → 重導向 /
 * 2. 已 LINE 登入但未建立商家 (needsSellerSetup=true) → 顯示內嵌設定表單
 * 3. 已建立商家 → 顯示完整儀表板（統計、商品、詢價）
 *
 * 重大變更（vs 舊版）：
 * - 不再用 useSeller() 的 parts/inquiries（那些已是空陣列存根）
 * - 改用 trpc.products.getBySellerId、trpc.inquiries.getBySellerId 直接撈 API
 * - 新增「LINE 官方帳號加好友」QR code 區塊
 * - 新增詢價回覆的內嵌 UI（賣家可直接在這頁回覆，後端會 push LINE 給買家）
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSeller } from "@/contexts/SellerContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, LogOut, User, Loader2, Copy, MessageCircle, Send, ExternalLink } from "lucide-react";

const LINE_OFFICIAL_ACCOUNT_ID = "@749hiaua";
const LINE_FRIEND_ADD_URL = `https://line.me/R/ti/p/${LINE_OFFICIAL_ACCOUNT_ID}`;
const LINE_QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(LINE_FRIEND_ADD_URL)}`;

export default function Dashboard() {
  const { currentUser, currentSellerDb, isLoading, needsSellerSetup, createSellerProfile, logout, refresh } = useSeller();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // 強制硬重導，避免 wouter 客戶端路由卡住
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.replace("/");
    }
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">尚未登入，正在跳轉至登入頁...</p>
        </div>
      </div>
    );
  }

  if (needsSellerSetup) {
    return <SellerSetupForm onSubmit={createSellerProfile} userName={currentUser.name || ""} />;
  }

  return (
    <SellerDashboardContent
      sellerId={currentSellerDb!.id}
      sellerName={currentSellerDb!.businessName}
      onLogout={logout}
      onAddPart={() => window.location.assign("/add-part")}
      onAccountClick={() => window.location.assign("/account")}
      onRefresh={refresh}
    />
  );
}

function RedirectToLogin() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/");
  }, []);
  return null;
}

// ============================================================
// 賣家初次設定表單
// ============================================================
function SellerSetupForm({
  onSubmit,
  userName,
}: {
  onSubmit: (input: { businessName: string; contactPhone: string; address?: string }) => Promise<void>;
  userName: string;
}) {
  const [businessName, setBusinessName] = useState(userName || "");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!businessName.trim()) {
      toast.error("請填寫商家名稱");
      return;
    }
    if (!contactPhone.trim()) {
      toast.error("請填寫聯絡電話");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        businessName: businessName.trim(),
        contactPhone: contactPhone.trim(),
        address: address.trim() || undefined,
      });
      toast.success("商家資料已建立！");
    } catch (e: any) {
      toast.error(e?.message || "建立失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center mb-3">
            <User className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-white text-xl">建立商家資料</CardTitle>
          <CardDescription className="text-gray-400">
            填寫一次資料就能開始上架商品。日後可在「我的帳戶」修改。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              商家名稱 <span className="text-red-400">*</span>
            </label>
            <Input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="例：懿龍車業"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              聯絡電話 <span className="text-red-400">*</span>
            </label>
            <Input
              type="tel"
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              placeholder="0912345678"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">地址（選填）</label>
            <Input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="台中市..."
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 mt-2"
            size="lg"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {submitting ? "建立中..." : "完成設定，開始使用"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// 完整儀表板
// ============================================================
function SellerDashboardContent({
  sellerId,
  sellerName,
  onLogout,
  onAccountClick,
  onAddPart,
  onRefresh: _onRefresh,
}: {
  sellerId: number;
  sellerName: string;
  onLogout: () => Promise<void>;
  onAccountClick: () => void;
  onAddPart: () => void;
  onRefresh: () => Promise<void>;
}) {
  const productsQuery = trpc.products.getBySellerId.useQuery({ sellerId });
  const inquiriesQuery = trpc.inquiries.getBySellerId.useQuery({ sellerId });
  const updateInquiryMutation = trpc.inquiries.update.useMutation();
  const utils = trpc.useUtils();

  const products = productsQuery.data || [];
  const inquiries = inquiriesQuery.data || [];

  const stats = {
    totalProducts: products.length,
    totalInquiries: inquiries.length,
    pendingReplies: inquiries.filter((i: any) => i.status === "pending").length,
    replied: inquiries.filter((i: any) => i.status === "replied").length,
  };

  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const copyProductLink = (productId: number) => {
    // ?openExternalBrowser=1 → LINE 看到這參數會強制用外部瀏覽器開（避免在 LINE 內建瀏覽器登入失效）
    const url = `${window.location.origin}/inquiry/${productId}?openExternalBrowser=1`;
    navigator.clipboard.writeText(url);
    toast.success("商品連結已複製，貼到 LINE 群組買家點擊會自動用外部瀏覽器開");
  };

  const handleReply = async (inquiryId: number) => {
    if (!replyText.trim()) {
      toast.error("請輸入回覆內容");
      return;
    }
    try {
      await updateInquiryMutation.mutateAsync({
        id: inquiryId,
        status: "replied",
        sellerReply: replyText.trim(),
      });
      toast.success("回覆已送出，買家會收到 LINE 通知");
      setReplyingId(null);
      setReplyText("");
      await utils.inquiries.getBySellerId.invalidate({ sellerId });
    } catch (e: any) {
      toast.error(e?.message || "回覆失敗");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ colorScheme: "light" }}>
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PartLink 儀表板</h1>
            <p className="text-gray-600">歡迎，{sellerName}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onAccountClick}>
              <User className="w-4 h-4 mr-2" />
              我的帳戶
            </Button>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              登出
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <LineFriendReminder />

        <div>
          <Button onClick={onAddPart} className="bg-blue-600 hover:bg-blue-700" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            快速上架新零件
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="總上架商品" value={stats.totalProducts} color="blue" />
          <StatCard label="總詢價數" value={stats.totalInquiries} color="purple" />
          <StatCard label="待回覆" value={stats.pendingReplies} color="orange" highlight={stats.pendingReplies > 0} />
          <StatCard label="已回覆" value={stats.replied} color="green" />
        </div>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">詢價管理</CardTitle>
            <CardDescription className="text-gray-600">
              {stats.pendingReplies > 0
                ? `你有 ${stats.pendingReplies} 筆詢價待回覆，請盡快回應`
                : "目前沒有待回覆的詢價"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inquiriesQuery.isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                載入中...
              </div>
            ) : inquiries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>還沒有任何詢價</p>
                <p className="text-xs mt-1">分享商品連結到 LINE / FB 開始接單</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq: any) => (
                  <InquiryCard
                    key={inq.id}
                    inquiry={inq}
                    isReplying={replyingId === inq.id}
                    replyText={replyText}
                    onStartReply={() => {
                      setReplyingId(inq.id);
                      setReplyText("");
                    }}
                    onCancelReply={() => {
                      setReplyingId(null);
                      setReplyText("");
                    }}
                    onReplyTextChange={setReplyText}
                    onSubmitReply={() => handleReply(inq.id)}
                    isSubmitting={updateInquiryMutation.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">我的商品</CardTitle>
            <CardDescription className="text-gray-600">點「複製連結」即可分享到 LINE / FB / 蝦皮等</CardDescription>
          </CardHeader>
          <CardContent>
            {productsQuery.isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                載入中...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>還沒上架任何商品</p>
                <Button onClick={onAddPart} className="mt-3" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  立即上架
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white">
                    {p.images && p.images.length > 0 ? (
                      <img src={p.images[0]} alt={p.partName} className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-xs">
                        無圖
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{p.partName}</div>
                      <div className="text-sm text-gray-700">
                        {p.brand} {p.model} {p.year}
                        {p.price && ` · NT$ ${p.price}`}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => copyProductLink(p.id)}>
                      <Copy className="w-4 h-4 mr-1" />
                      複製連結
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LineFriendReminder() {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("dismissed_line_reminder") === "1");
  if (dismissed) return null;
  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <img src={LINE_QR_CODE_URL} alt="LINE QR" className="w-24 h-24 bg-white p-1 rounded" />
          <div className="flex-1">
            <div className="font-bold text-green-900 mb-1">⚠️ 必做：加官方帳號好友才能收到詢價推播</div>
            <p className="text-sm text-gray-700 mb-2">
              掃左邊 QR code 加 <strong>{LINE_OFFICIAL_ACCOUNT_ID}</strong> 好友。沒加好友的話，買家送詢價我們無法 push 通知給你，會漏單。
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => window.open(LINE_FRIEND_ADD_URL, "_blank")}>
                <ExternalLink className="w-3 h-3 mr-1" />
                直接加好友
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  sessionStorage.setItem("dismissed_line_reminder", "1");
                  setDismissed(true);
                }}
              >
                我已加好友，不再顯示
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: number;
  color: "blue" | "purple" | "orange" | "green";
  highlight?: boolean;
}) {
  const colorMap = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    green: "text-green-600",
  };
  return (
    <Card className={`bg-white ${highlight ? "border-orange-400 border-2" : "border-gray-200"}`}>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${colorMap[color]}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function InquiryCard({
  inquiry,
  isReplying,
  replyText,
  onStartReply,
  onCancelReply,
  onReplyTextChange,
  onSubmitReply,
  isSubmitting,
}: {
  inquiry: any;
  isReplying: boolean;
  replyText: string;
  onStartReply: () => void;
  onCancelReply: () => void;
  onReplyTextChange: (s: string) => void;
  onSubmitReply: () => void;
  isSubmitting: boolean;
}) {
  const isPending = inquiry.status === "pending";
  const statusBadge = {
    pending: { label: "待回覆", color: "bg-orange-100 text-orange-800" },
    replied: { label: "已回覆", color: "bg-green-100 text-green-800" },
    closed: { label: "已結案", color: "bg-gray-100 text-gray-800" },
  }[inquiry.status as "pending" | "replied" | "closed"];

  return (
    <div className={`border rounded-lg p-4 bg-white ${isPending ? "border-orange-300 border-2" : "border-gray-200"}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold text-gray-900">
            {inquiry.brand} {inquiry.model} {inquiry.partName || "（商品已刪除）"}
          </div>
          <div className="text-sm text-gray-700 mt-0.5">
            買家：{inquiry.buyerName}
            {inquiry.buyerPhone && ` · ${inquiry.buyerPhone}`}
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>{statusBadge.label}</span>
      </div>

      {inquiry.message && (
        <div className="text-sm bg-gray-100 p-2 rounded mb-2 text-gray-900">
          <span className="text-gray-600 font-medium">訊息：</span>
          {inquiry.message}
        </div>
      )}

      {inquiry.sellerReply && (
        <div className="text-sm bg-green-50 border border-green-300 p-2 rounded mb-2 text-gray-900">
          <span className="text-green-800 font-bold">你的回覆：</span>
          <span className="text-gray-900">{inquiry.sellerReply}</span>
        </div>
      )}

      {isPending && !isReplying && (
        <Button size="sm" variant="default" onClick={onStartReply} className="bg-blue-600 hover:bg-blue-700">
          <Send className="w-3 h-3 mr-1" />
          回覆此詢價
        </Button>
      )}

      {isReplying && (
        <div className="space-y-2">
          <textarea
            value={replyText}
            onChange={e => onReplyTextChange(e.target.value)}
            placeholder="例：有庫存，價格 NT$3500，可面交台中或宅配 200 元"
            className="w-full min-h-[80px] px-3 py-2 border rounded text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSubmitReply} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
              送出（買家會收到 LINE 通知）
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelReply}>
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
