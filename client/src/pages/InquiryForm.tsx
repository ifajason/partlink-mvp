import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSeller } from '@/contexts/SellerContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Send, Copy, Loader2 } from 'lucide-react';

export default function InquiryForm() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/inquiry/:partId');
  const { addInquiry } = useSeller();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [lineId, setLineId] = useState('');
  const [question, setQuestion] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryId, setInquiryId] = useState('');

  // 從 API 讀取商品數據
  const allParts = JSON.parse(localStorage.getItem('partlink_parts') || '[]');
const product = allParts.find((p: any) => p.id === params?.partId);
const isLoading = false;
const error = null;

  // 讀取賣家的其他商品
  const sellerProducts = allParts;

  const otherProducts = allParts.filter((p: any) => p.id !== params?.partId) || [];

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('請填寫您的姓名');
      return;
    }

    if (!contact.trim()) {
      toast.error('請填寫您的聯絡方式（電話或LINE）');
      return;
    }

    if (!agreePrivacy) {
      toast.error('請同意隱私政策');
      return;
    }

    if (!product) {
      toast.error('找不到該商品');
      return;
    }

    try {
      const id = `inq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const inquiries = JSON.parse(localStorage.getItem('partlink_inquiries') || '[]');
inquiries.push({
  id,
  partId: product.id.toString(),
  sellerId: product.sellerId,
  buyerName: name,
  buyerContact: contact,
  buyerEmail: email,
  buyerLineId: lineId,
  buyerQuestion: question,
  status: 'pending',
  createdAt: new Date().toISOString(),
});
localStorage.setItem('partlink_inquiries', JSON.stringify(inquiries));
// 發送LINE通知給賣家
const seller = JSON.parse(localStorage.getItem('partlink_seller') || '{}');
if (seller?.lineId) {
  fetch('/api/notify/inquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sellerLineUserId: seller.lineId,
      buyerName: name,
      buyerContact: contact,
      buyerQuestion: question,
      partName: product.partName,
      partBrand: product.brand,
    }),
  }).catch(e => console.error('LINE通知失敗:', e));
}
      setInquiryId(id);
      setSubmitted(true);
      toast.success('詢價已送出！');
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      toast.error('送出失敗，請稍後再試');
    }
  };

  const copyInquiryId = () => {
    navigator.clipboard.writeText(inquiryId);
    toast.success('已複製詢價編號');
  };

  if (isLoading) {
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

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">找不到該商品</CardTitle>
            <CardDescription>該商品可能已下架或不存在</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')} variant="outline">
              返回首頁
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">詢價已送出！</CardTitle>
            <CardDescription>賣家將盡快回覆您</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">您的詢價編號：</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm">{inquiryId}</code>
                <Button size="sm" variant="outline" onClick={copyInquiryId}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">請保存此編號以便查詢進度</p>
            </div>

            {otherProducts.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">該賣家的其他商品</h3>
                <div className="grid gap-3">
                  {otherProducts.slice(0, 3).map((p) => (
                    <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/inquiry/${p.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          {p.images && p.images.length > 0 && (
                            <img src={p.images[0]} alt={p.partName} className="w-20 h-20 object-cover rounded" />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{p.partName}</h4>
                            <p className="text-sm text-gray-600">
                              {p.brand} {p.model} {p.year}
                            </p>
                            {p.price && <p className="text-blue-600 font-semibold mt-1">NT$ {p.price}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                返回首頁
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                再次詢價
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">商品詢價</CardTitle>
          <CardDescription>填寫以下資訊，賣家將盡快回覆您</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 商品信息 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">商品資訊</h3>
            <div className="flex gap-4">
              {product.images && product.images.length > 0 && (
                <img src={product.images[0]} alt={product.partName} className="w-24 h-24 object-cover rounded" />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-lg">{product.partName}</h4>
                <p className="text-gray-600">
                  {product.brand} {product.model} {product.year}
                </p>
                <p className="text-sm text-gray-500">狀況：{product.condition}</p>
                {product.price && <p className="text-blue-600 font-semibold mt-1">NT$ {product.price}</p>}
              </div>
            </div>
          </div>

          {/* 買家信息表單 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">姓名 *</label>
              <Input
                id="buyerName"
                name="buyerName"
                placeholder="請輸入您的姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">聯絡電話 *</label>
              <Input
                id="buyerPhone"
                name="buyerPhone"
                type="tel"
                placeholder="0912345678"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email（選填）</label>
              <Input
                id="buyerEmail"
                name="buyerEmail"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">LINE ID（選填）</label>
              <Input
                id="buyerLine"
                name="buyerLine"
                placeholder="@your-line-id"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">詢問內容（選填）</label>
              <textarea
                id="message"
                name="message"
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：請問這個零件還有庫存嗎？可以寄送到台中嗎？"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="privacy"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="privacy" className="text-sm text-gray-600">
                我同意 <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">隱私政策</a>，並同意賣家使用我的聯絡資訊回覆詢價
              </label>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" size="lg">
            <Send className="w-4 h-4 mr-2" />
            送出詢價
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
