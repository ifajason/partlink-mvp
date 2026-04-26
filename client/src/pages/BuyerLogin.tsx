import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle, Clock } from 'lucide-react';

interface BuyerInfo {
  name: string;
  contact: string;
  email?: string;
  lineId?: string;
  timestamp: number;
}

export default function BuyerLogin() {
  const [, navigate] = useLocation();
  const [contact, setContact] = useState('');
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo | null>(null);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sellers, setSellers] = useState<any>({});
  const [urgentInquiries, setUrgentInquiries] = useState<Set<string>>(new Set());

  // 生成設備ID（基於瀏覽器指紋）
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  // 自動登入（如果設備已識別）
  useEffect(() => {
    const deviceId = getDeviceId();
    const savedBuyer = localStorage.getItem(`buyer_${deviceId}`);
    
    if (savedBuyer) {
      try {
        const buyer = JSON.parse(savedBuyer);
        setBuyerInfo(buyer);
        setContact(buyer.contact);
        loadInquiries(buyer.contact);
      } catch (e) {
        console.error('Failed to load buyer info:', e);
      }
    }
  }, []);

  const loadInquiries = (buyerContact: string) => {
    try {
      const allInquiries = localStorage.getItem('partlink_inquiries');
      if (allInquiries) {
        const inquiries = JSON.parse(allInquiries);
        const buyerInquiries = inquiries.filter((inq: any) => inq.buyerContact === buyerContact);
        setInquiries(buyerInquiries);
        
        // 加載賣家信息
        const sellersData: any = {};
        const partlink_sellers = localStorage.getItem('partlink_sellers');
        if (partlink_sellers) {
          const allSellers = JSON.parse(partlink_sellers);
          buyerInquiries.forEach((inq: any) => {
            const seller = allSellers.find((s: any) => s.id === inq.sellerId);
            if (seller) {
              sellersData[inq.sellerId] = seller;
            }
          });
        }
        setSellers(sellersData);
        
        // 加載急迫標記
        const urgentSet = new Set<string>();
        buyerInquiries.forEach((inq: any) => {
          if (inq.isUrgent) {
            urgentSet.add(inq.id);
          }
        });
        setUrgentInquiries(urgentSet);
      }
    } catch (e) {
      console.error('Failed to load inquiries:', e);
    }
  };

  const handleLogin = () => {
    if (!contact.trim()) {
      toast.error('請輸入電話號碼');
      return;
    }

    setLoading(true);
    
    // 模擬查詢買家信息
    setTimeout(() => {
      const savedBuyer = localStorage.getItem(`buyer_${contact}`);
      
      if (savedBuyer) {
        try {
          const buyer = JSON.parse(savedBuyer);
          setBuyerInfo(buyer);
          loadInquiries(contact);
          toast.success(`歡迎回來，${buyer.name}！`);
          
          // 保存設備ID與買家的關聯
          const deviceId = getDeviceId();
          localStorage.setItem(`buyer_${deviceId}`, JSON.stringify(buyer));
        } catch (e) {
          toast.error('登入失敗，請重試');
        }
      } else {
        toast.error('找不到該聯絡方式的詢價記錄');
      }
      
      setLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    setBuyerInfo(null);
    setContact('');
    setInquiries([]);
    toast.success('已登出');
  };

  const handleMarkUrgent = (inquiryId: string) => {
    try {
      const allInquiries = localStorage.getItem('partlink_inquiries');
      if (allInquiries) {
        const inquiries = JSON.parse(allInquiries);
        const inquiry = inquiries.find((inq: any) => inq.id === inquiryId);
        if (inquiry) {
          inquiry.isUrgent = !inquiry.isUrgent;
          inquiry.urgentMarkedAt = new Date().toISOString();
          localStorage.setItem('partlink_inquiries', JSON.stringify(inquiries));
          
          // 更新本地狀態
          const newUrgentSet = new Set(urgentInquiries);
          if (inquiry.isUrgent) {
            newUrgentSet.add(inquiryId);
            toast.success('已標記為急迫，商家會優先處理');
          } else {
            newUrgentSet.delete(inquiryId);
            toast.success('已取消急迫標記');
          }
          setUrgentInquiries(newUrgentSet);
        }
      }
    } catch (e) {
      toast.error('標記失敗，請重試');
    }
  };

  const handleBackToProduct = (partId: string) => {
    navigate(`/inquiry/${partId}`);
  };

  if (buyerInfo) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">我的詢價</h1>
              <p className="text-gray-600">歡迎回來，{buyerInfo.name}！</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
            >
              登出
            </Button>
          </div>

          {inquiries.length > 0 ? (
            <div className="grid gap-4">
              {inquiries.map((inquiry) => {
                const seller = sellers[inquiry.sellerId];
                const isUrgent = urgentInquiries.has(inquiry.id);
                
                return (
                  <Card key={inquiry.id} className={isUrgent ? 'border-red-300 border-2' : ''}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>商品詢價</CardTitle>
                          <CardDescription>詢價ID: {inquiry.id}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {isUrgent && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                              <AlertCircle size={16} />
                              急迫
                            </div>
                          )}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            inquiry.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                            inquiry.status === 'viewed' ? 'bg-blue-100 text-blue-800' :
                            inquiry.status === 'replied' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {inquiry.status === 'new' ? '待回覆' :
                             inquiry.status === 'viewed' ? '已讀' :
                             inquiry.status === 'replied' ? '已回覆' :
                             '已成交'}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* 商家資訊 */}
                      {seller && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-sm text-gray-600 mb-2">商家資訊</p>
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{seller.name}</p>
                            <p className="text-sm text-gray-700">📞 {seller.phone}</p>
                            {seller.email && <p className="text-sm text-gray-700">📧 {seller.email}</p>}
                            {seller.businessHours && <p className="text-sm text-gray-700">🕐 {seller.businessHours}</p>}
                            {seller.address && <p className="text-sm text-gray-700">📍 {seller.address}</p>}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">商品</p>
                          <p className="font-medium">{inquiry.partId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">提交時間</p>
                          <p className="font-medium">{new Date(inquiry.createdAt).toLocaleDateString('zh-TW')}</p>
                        </div>
                      </div>
                      
                      {inquiry.buyerQuestion && (
                        <div>
                          <p className="text-sm text-gray-600">詢價內容</p>
                          <p className="font-medium">{inquiry.buyerQuestion}</p>
                        </div>
                      )}

                      {inquiry.sellerReply && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-sm text-gray-600 mb-2">商家回覆</p>
                          <p className="font-medium text-gray-800 whitespace-pre-wrap">{inquiry.sellerReply}</p>
                          {inquiry.sellerReplyAt && (
                            <p className="text-xs text-gray-500 mt-2">{new Date(inquiry.sellerReplyAt).toLocaleString('zh-TW')}</p>
                          )}
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-2">時間軸：</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>已提交 - {new Date(inquiry.createdAt).toLocaleString('zh-TW')}</span>
                          </div>
                          {inquiry.viewedAt && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">✓</span>
                              <span>商家已讀 - {new Date(inquiry.viewedAt).toLocaleString('zh-TW')}</span>
                            </div>
                          )}
                          {inquiry.repliedAt && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">✓</span>
                              <span>商家已回覆 - {new Date(inquiry.repliedAt).toLocaleString('zh-TW')}</span>
                            </div>
                          )}
                          {inquiry.status === 'new' && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">○</span>
                              <span className="text-gray-500">等待商家回覆...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 操作按鈕 */}
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => handleBackToProduct(inquiry.partId)}
                          variant="outline"
                          className="flex-1"
                        >
                          <ArrowLeft size={16} className="mr-2" />
                          返回商品
                        </Button>
                        <Button
                          onClick={() => handleMarkUrgent(inquiry.id)}
                          variant={isUrgent ? 'default' : 'outline'}
                          className={isUrgent ? 'flex-1 bg-red-600 hover:bg-red-700' : 'flex-1'}
                        >
                          <Clock size={16} className="mr-2" />
                          {isUrgent ? '取消急迫' : '標記急迫'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 mb-4">您還沒有任何詢價記錄</p>
                <Button
                  onClick={() => navigate('/')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  返回首頁
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>查詢詢價狀態</CardTitle>
            <CardDescription>輸入您的電話號碼查詢詢價狀態</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話號碼 *
              </label>
              <Input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="例：0912345678"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {loading ? '查詢中...' : '查詢詢價'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                首次訪問？
                <button
                  onClick={() => navigate('/')}
                  className="text-blue-600 hover:text-blue-700 font-medium ml-1"
                >
                  返回首頁
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <p className="text-sm text-gray-600">
            💡 <strong>提示：</strong> 我們會自動識別您的設備。下次訪問時，您可以直接查看詢價狀態，無需重複輸入。
          </p>
        </div>
      </div>
    </div>
  );
}
