import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSeller } from '@/contexts/SellerContext';
import { toast } from 'sonner';
import { Copy, Check, Send, Bell, MessageSquare, TrendingUp, X, ArrowLeft } from 'lucide-react';

interface InquiryCardProps {
  inquiry: any;
  parts: any[];
  replyingId: string | null;
  setReplyingId: (id: string | null) => void;
  replyType: 'quick' | 'custom';
  setReplyType: (type: 'quick' | 'custom') => void;
  quickReplyType: 'received' | 'quote' | 'outofstock' | 'find';
  setQuickReplyType: (type: 'received' | 'quote' | 'outofstock' | 'find') => void;
  customReply: string;
  setCustomReply: (reply: string) => void;
  quoteData: { price: string; stock: string; delivery: string };
  setQuoteData: (data: { price: string; stock: string; delivery: string }) => void;
  copiedId: string | null;
  handleCopyContact: (contact: string, inquiryId: string) => void;
  handleSendLineNotification: (inquiryId: string) => void;
  handleSendReply: (inquiryId: string) => void;
  updateInquiry: (id: string, updates: any) => void;
}

const InquiryCard = React.memo(({ 
  inquiry, parts, replyingId, setReplyingId, replyType, setReplyType,
  quickReplyType, setQuickReplyType, customReply, setCustomReply,
  quoteData, setQuoteData, copiedId, handleCopyContact,
  handleSendLineNotification, handleSendReply, updateInquiry
}: InquiryCardProps) => {
  
  const isReplying = replyingId === inquiry.id;
  // 核心對齊：資料庫欄位轉換
  const partName = inquiry.partName || "整車";
  const contactInfo = inquiry.buyerPhone || inquiry.buyerContact || "無聯絡資訊";
  const displayImage = inquiry.imageUrl ? (inquiry.imageUrl.startsWith('/uploads') ? inquiry.imageUrl : `/uploads/${inquiry.imageUrl}`) : null;

  const getQuickReplyText = () => {
    switch (quickReplyType) {
      case 'received': return '感謝您的詢問，我們已收到您的詢價，會盡快回電給您。';
      case 'quote': return `報價如下:\n價格:${quoteData.price}\n庫存:${quoteData.stock}\n交期:${quoteData.delivery}`;
      case 'outofstock': return '很抱歉，此商品目前缺貨。';
      case 'find': return '目前缺貨，可幫您尋找替代品，請稍候。';
      default: return '';
    }
  };
  
  return (
    <Card className="mb-4">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded border overflow-hidden flex-shrink-0">
              {displayImage ? (
                <img src={displayImage} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100?text=無圖片')} />
              ) : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">無圖</div>}
            </div>
            <div>
              <p className="font-semibold text-lg">{partName}</p>
              <p className="text-sm text-gray-600">買家: <strong>{inquiry.buyerName}</strong></p>
              <p className="text-xs text-gray-400">{new Date(inquiry.createdAt).toLocaleString('zh-TW')}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => handleSendLineNotification(inquiry.id)}><Bell className="w-4 h-4 mr-1" /> LINE</Button>
        </div>

        <div className="bg-gray-50 p-3 rounded flex justify-between items-center">
          <code className="text-sm font-mono">{contactInfo}</code>
          <Button size="sm" variant="outline" onClick={() => handleCopyContact(contactInfo, inquiry.id)}>
            {copiedId === inquiry.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        <div className="bg-blue-50 p-3 rounded border italic text-sm">
          "{inquiry.message || inquiry.buyerQuestion || "詢問商品詳情"}"
        </div>

        {inquiry.sellerReply && (
          <div className="bg-green-50 p-3 rounded border border-green-200 text-sm">
            <p className="text-xs text-green-700 font-bold mb-1">已回覆內容：</p>
            <p className="whitespace-pre-wrap">{inquiry.sellerReply}</p>
          </div>
        )}

        {isReplying && (
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200 space-y-3">
            <div className="flex gap-2">
              <Button size="sm" variant={replyType === 'quick' ? 'default' : 'outline'} onClick={() => setReplyType('quick')}>快速回覆</Button>
              <Button size="sm" variant={replyType === 'custom' ? 'default' : 'outline'} onClick={() => setReplyType('custom')}>自訂回覆</Button>
            </div>

            {replyType === 'quick' && (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {['received', 'quote', 'outofstock', 'find'].map((t: any) => (
                    <Button key={t} size="sm" variant={quickReplyType === t ? 'default' : 'outline'} onClick={() => setQuickReplyType(t)}>
                      {t === 'received' ? '已收到' : t === 'quote' ? '報價' : t === 'outofstock' ? '缺貨' : '可幫找'}
                    </Button>
                  ))}
                </div>
                {quickReplyType === 'quote' && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="價格" value={quoteData.price} onChange={e => setQuoteData({...quoteData, price: e.target.value})} />
                    <Input placeholder="庫存" value={quoteData.stock} onChange={e => setQuoteData({...quoteData, stock: e.target.value})} />
                    <Input placeholder="交期" value={quoteData.delivery} onChange={e => setQuoteData({...quoteData, delivery: e.target.value})} />
                  </div>
                )}
                <div className="bg-white p-3 rounded border text-xs italic">{getQuickReplyText()}</div>
              </div>
            )}
            {replyType === 'custom' && <Textarea placeholder="輸入回覆..." value={customReply} onChange={e => setCustomReply(e.target.value)} className="min-h-24" />}
            <div className="flex gap-2">
              <Button size="sm" className="bg-green-600" onClick={() => handleSendReply(inquiry.id)}><Send className="w-4 h-4 mr-1"/>發送回覆</Button>
              <Button size="sm" variant="outline" onClick={() => setReplyingId(null)}>取消</Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {inquiry.status === 'pending' && !isReplying && (
            <Button size="sm" className="bg-blue-600" onClick={() => setReplyingId(inquiry.id)}><MessageSquare className="w-4 h-4 mr-1" /> 快速回覆</Button>
          )}
          {inquiry.status === 'replied' && (
            <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => updateInquiry(inquiry.id, { status: 'closed' })}>
              <TrendingUp className="w-4 h-4 mr-1" /> 標記成交
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default function Inquiries() {
  const [, navigate] = useLocation();
  const { currentSeller, getSellerInquiries, updateInquiry, sendLineNotification, updateSellerStats, parts } = useSeller();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyType, setReplyType] = useState<'quick' | 'custom'>('quick');
  const [quickReplyType, setQuickReplyType] = useState<'received' | 'quote' | 'outofstock' | 'find'>('received');
  const [customReply, setCustomReply] = useState('');
  const [quoteData, setQuoteData] = useState({ price: '', stock: '', delivery: '' });

  const inquiries = getSellerInquiries() || [];
  // 核心對齊：使用 pending / replied 狀態碼
  const pending = inquiries.filter((i: any) => i.status === 'pending');
  const replied = inquiries.filter((i: any) => i.status === 'replied');

  const handleSendReply = (inquiryId: string) => {
    let text = replyType === 'custom' ? customReply : '';
    if (replyType === 'quick') {
      if (quickReplyType === 'received') text = '感謝您的詢問，我們已收到您的詢價，會盡快回電給您。';
      else if (quickReplyType === 'quote') text = `報價如下:\n價格:${quoteData.price}\n庫存:${quoteData.stock}\n交貨時間:${quoteData.delivery}`;
      else if (quickReplyType === 'outofstock') text = '感謝您的詢問，此商品目前缺貨，如有其他需求歡迎詢問。';
      else if (quickReplyType === 'find') text = '感謝您的詢問，此商品目前缺貨，但我們可以幫您尋找替代品，請稍候。';
    }
    updateInquiry(inquiryId, { status: 'replied', sellerReply: text, repliedAt: new Date().toISOString() });
    setReplyingId(null);
    toast.success("回覆已送出");
  };

  if (!currentSeller) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">詢價管理 ({inquiries.length})</h1>
          <Button variant="outline" onClick={() => navigate('/dashboard')}><ArrowLeft className="w-4 h-4 mr-2" />返回</Button>
        </div>
        {pending.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-red-600 mb-4">待處理 ({pending.length})</h2>
            {pending.map((iq: any) => <InquiryCard key={iq.id} inquiry={iq} parts={parts} replyingId={replyingId} setReplyingId={setReplyingId} replyType={replyType} setReplyType={setReplyType} quickReplyType={quickReplyType} setQuickReplyType={setQuickReplyType} customReply={customReply} setCustomReply={setCustomReply} quoteData={quoteData} setQuoteData={setQuoteData} copiedId={copiedId} handleCopyContact={(c, id) => { navigator.clipboard.writeText(c); setCopiedId(id); setTimeout(()=>setCopiedId(null), 2000); }} handleSendLineNotification={(id) => sendLineNotification(id, "TOKEN")} handleSendReply={handleSendReply} updateInquiry={updateInquiry} />)}
          </section>
        )}
        {replied.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-blue-600 mb-4">已回覆 ({replied.length})</h2>
            {replied.map((iq: any) => <InquiryCard key={iq.id} inquiry={iq} parts={parts} replyingId={replyingId} setReplyingId={setReplyingId} replyType={replyType} setReplyType={setReplyType} quickReplyType={quickReplyType} setQuickReplyType={setQuickReplyType} customReply={customReply} setCustomReply={setCustomReply} quoteData={quoteData} setQuoteData={setQuoteData} copiedId={copiedId} handleCopyContact={(c, id) => { navigator.clipboard.writeText(c); setCopiedId(id); }} handleSendLineNotification={()=>{}} handleSendReply={handleSendReply} updateInquiry={updateInquiry} />)}
          </section>
        )}
      </div>
    </div>
  );
}
