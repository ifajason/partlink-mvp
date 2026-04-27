/**
 * 買家詢價表單
 *
 * 重大變更（vs 舊版）：
 * 1. 商品從 tRPC API 撈（不再讀 localStorage）→ 跨裝置分享連結可正常開啟
 * 2. 詢價透過 tRPC mutation 送到後端 → 寫入資料庫，賣家後台撈得到
 * 3. 偵測未登入 → 自動導向 /buyer-login → 完成後跳回此頁
 * 4. 買家姓名/LINE ID 從 LINE profile 自動帶入（無需手動填）
 * 5. 推播由後端觸發（不再由前端打 /api/notify/inquiry）
 *
 * UX 改進：
 * - 買家送出詢價後，不需要記錄詢價編號（賣家回覆會直接 LINE 推播）
 * - 同賣家其他商品改為從 API 讀取
 */

import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { LineInAppBrowserGuard } from "@/components/LineInAppBrowserGuard";

export default function InquiryForm() {
  return (
    <LineInAppBrowserGuard>
      <InquiryFormContent />
    </LineInAppBrowserGuard>
  );
}

function InquiryFormContent() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/inquiry/:partId");
  const partId = parseInt(params?.partId || "0");

  // 表單狀態
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // === 取得買家身份（檢查是否已 LINE 登入） ===
  // 用 auth.me 查當前 session 對應的 user。失敗 = 未登入。
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });
  const currentUser = meQuery.data;
  const isLoading = meQuery.isLoading;

  // === 取得商品資訊（走 API，不再讀 localStorage） ===
  const productQuery = trpc.products.getById.useQuery(
    { id: partId },
    { enabled: partId > 0 }
  );
  const product = productQuery.data;

  // === 取得同賣家其他商品 ===
  const otherProductsQuery = trpc.products.getBySellerId.useQuery(
    { sellerId: product?.sellerId || 0 },
    { enabled: !!product?.sellerId }
  );
  const otherProducts = (otherProductsQuery.data || []).filter(
    (p: any) => p.id !== partId && p.status === "active"
  );

  // === 送出詢價的 mutation ===
  const createInquiryMutation = trpc.inquiries.create.useMutation();

  // === 未登入引導：等 me 查詢結束，沒有 user 就導向買家登入 ===
  if (!isLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">送出詢價前需要 LINE 登入</CardTitle>
            <CardDescription>
              這樣賣家回覆時，我們會即時推播到你的 LINE
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() =>
                navigate(`/buyer-login?redirect=${encodeURIComponent(window.location.pathname)}`)
              }
              className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white"
              size="lg"
            >
              使用 LINE 登入
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              返回首頁
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === 載入中 ===
  if (isLoading || productQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">載入中...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === 找不到商品 ===
  if (productQuery.error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">找不到該商品</CardTitle>
            <CardDescription>該商品可能已下架或不存在</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/")} variant="outline">
              返回首頁
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === 已送出成功頁 ===
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">詢價已送出！</CardTitle>
            <CardDescription>
              賣家收到通知後會盡快回覆，回覆內容會自動推播到你的 LINE
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {otherProducts.length > 0 && (
              <div className="mt-2">
                <h3 className="font-semibold mb-3">該賣家的其他商品</h3>
                <div className="grid gap-3">
                  {otherProducts.slice(0, 3).map((p: any) => (
                    <Card
                      key={p.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSubmitted(false);
                        navigate(`/inquiry/${p.id}`);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          {p.images && p.images.length > 0 && (
                            <img
                              src={p.images[0]}
                              alt={p.partName}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{p.partName}</h4>
                            <p className="text-sm text-gray-600">
                              {p.brand} {p.model} {p.year}
                            </p>
                            {p.price && (
                              <p className="text-blue-600 font-semibold mt-1">NT$ {p.price}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                返回首頁
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === 表單送出 ===
  const handleSubmit = async () => {
    if (!phone.trim()) {
      toast.error("請填寫聯絡電話（賣家會用這支電話聯繫你）");
      return;
    }
    if (!agreePrivacy) {
      toast.error("請同意隱私政策");
      return;
    }

    try {
      await createInquiryMutation.mutateAsync({
        productId: partId,
        sellerId: product.sellerId,
        // buyerName 後端會從 LINE displayName 自動帶入，前端不傳
        buyerPhone: phone.trim(),
        message: message.trim() || undefined,
      });

      setSubmitted(true);
      toast.success("詢價已送出，賣家會收到 LINE 通知");
    } catch (e: any) {
      // 速率限制錯誤
      if (e?.data?.code === "TOO_MANY_REQUESTS") {
        toast.error(e.message || "詢價過於頻繁，請稍後再試");
      } else if (e?.data?.code === "UNAUTHORIZED") {
        toast.error("登入已失效，請重新登入");
        navigate(`/buyer-login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else {
        toast.error(e?.message || "送出失敗，請稍後再試");
      }
    }
  };

  // === 主表單 ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">商品詢價</CardTitle>
          <CardDescription>
            你好，{currentUser?.name || "買家"} 👋 賣家收到後會盡快回覆，回覆會推播到你的 LINE
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 商品資訊 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">商品資訊</h3>
            <div className="flex gap-4">
              {product.images && product.images.length > 0 && (
                <img
                  src={product.images[0]}
                  alt={product.partName}
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-lg">{product.partName}</h4>
                <p className="text-gray-600">
                  {product.brand} {product.model} {product.year}
                </p>
                {product.condition && (
                  <p className="text-sm text-gray-500">狀況：{product.condition}</p>
                )}
                {product.price && (
                  <p className="text-blue-600 font-semibold mt-1">NT$ {product.price}</p>
                )}
              </div>
            </div>
          </div>

          {/* 表單 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                聯絡電話 <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                placeholder="0912345678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                賣家會用這支電話聯繫你（與 LINE 互補）
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                詢問內容（選填）
              </label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：請問這個零件還有庫存嗎？可以寄送到台中嗎？"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="privacy"
                checked={agreePrivacy}
                onChange={e => setAgreePrivacy(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="privacy" className="text-sm text-gray-600">
                我同意{" "}
                <a
                  href="/privacy"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  隱私政策
                </a>
                ，並同意賣家使用我的聯絡資訊回覆詢價
              </label>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={createInquiryMutation.isPending}
            className="w-full"
            size="lg"
          >
            {createInquiryMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {createInquiryMutation.isPending ? "送出中..." : "送出詢價"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
