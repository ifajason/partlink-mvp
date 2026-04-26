import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSeller } from '@/contexts/SellerContext';
import { Star, TrendingUp, Clock, CheckCircle, Edit2, X, Crown } from 'lucide-react';
import { toast } from 'sonner';

export default function Account() {
  const [, navigate] = useLocation();
  const { currentSeller, getSellerReputation, updateSellerStats, getSellerInquiries, updateCurrentSeller } = useSeller();
  const [reputation, setReputation] = useState({
    replyRate: 0,
    saleRate: 0,
    averageRating: 0,
    responseTime: 0,
  });
  const [sellerInquiries, setSellerInquiries] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    businessHours: '',
  });

  useEffect(() => {
    if (currentSeller) {
      updateSellerStats();
      setReputation(getSellerReputation());
      setSellerInquiries(getSellerInquiries());
      setEditForm({
        name: currentSeller.name,
        phone: currentSeller.phone,
        email: currentSeller.email,
        address: currentSeller.address,
        businessHours: currentSeller.businessHours,
      });
    }
  }, [currentSeller?.id]);

  const handleSaveChanges = () => {
    if (!editForm.name.trim()) {
      toast.error('商家名稱不能為空');
      return;
    }
    if (!editForm.phone.trim()) {
      toast.error('聯絡電話不能為空');
      return;
    }
    if (!editForm.email.trim()) {
      toast.error('電子郵件不能為空');
      return;
    }
    if (!editForm.address.trim()) {
      toast.error('營業地址不能為空');
      return;
    }
    if (!editForm.businessHours.trim()) {
      toast.error('營業時間不能為空');
      return;
    }

    updateCurrentSeller(editForm);
    setIsEditing(false);
    toast.success('商家信息已更新');
  };

  if (!currentSeller) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>← 返回儀表板</Button>
          <h1 className="text-3xl font-bold mt-4">我的帳戶</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Seller Info */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>商家信息</CardTitle>
                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-600">
                      {currentSeller.subscription_tier === 'professional' ? '專業版' : 
                       currentSeller.subscription_tier === 'basic' ? '基礎版' : '免費版'}
                    </span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-xs p-0 h-auto"
                      onClick={() => navigate('/pricing')}
                    >
                      {currentSeller.subscription_tier === 'professional' ? '管理訂閱' : '升級方案'}
                    </Button>
                  </div>
                  {currentSeller.subscription_end_date && currentSeller.subscription_tier !== 'free' && (
                    <p className="text-xs text-gray-500">
                      到期日：{new Date(currentSeller.subscription_end_date).toLocaleDateString('zh-TW')}
                    </p>
                  )}
                </div>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  編輯
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isEditing ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">商家名稱</label>
                  <p className="text-lg font-medium">{currentSeller.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">聯絡電話</label>
                  <p className="text-lg font-medium">{currentSeller.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">電子郵件</label>
                  <p className="text-lg font-medium">{currentSeller.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">營業地址</label>
                  <p className="text-lg font-medium">{currentSeller.address}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-600">營業時間</label>
                  <p className="text-lg font-medium">{currentSeller.businessHours}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">商家名稱 *</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="輸入商家名稱"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">聯絡電話 *</label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="輸入聯絡電話"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">電子郵件 *</label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="輸入電子郵件"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">營業地址 *</label>
                  <Input
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="輸入營業地址"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">營業時間 *</label>
                  <Input
                    value={editForm.businessHours}
                    onChange={(e) => setEditForm({ ...editForm, businessHours: e.target.value })}
                    placeholder="例如：週一至週五 09:00-18:00"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveChanges} className="flex-1">
                    保存更改
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    取消
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reputation System */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>商家信譽</CardTitle>
                <CardDescription>基於您的詢價和成交記錄</CardDescription>
              </div>
              {currentSeller.verified && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  已認證
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">回覆率</p>
                <p className="text-2xl font-bold text-blue-600">{reputation.replyRate}%</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">成交率</p>
                <p className="text-2xl font-bold text-green-600">{reputation.saleRate}%</p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">平均回覆時間</p>
                <p className="text-2xl font-bold text-purple-600">{reputation.responseTime}分</p>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-sm text-gray-600">評分</p>
                <p className="text-2xl font-bold text-yellow-600">{reputation.averageRating}/5</p>
              </div>
            </div>

            {/* Recognition Criteria */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">認證條件：</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ 至少5個詢價</li>
                <li>✓ 回覆率≥80%</li>
                <li className={currentSeller.verified ? 'text-green-600' : ''}>
                  {currentSeller.verified ? '✓ 已達成認證' : '✗ 尚未達成認證'}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>統計數據</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600">總詢價數</p>
                <p className="text-2xl font-bold">{sellerInquiries.length}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600">已回覆</p>
                <p className="text-2xl font-bold text-green-600">
                  {sellerInquiries.filter(i => i.status === 'replied' || i.status === 'sold').length}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600">已成交</p>
                <p className="text-2xl font-bold text-blue-600">
                  {sellerInquiries.filter(i => i.status === 'sold').length}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600">待回覆</p>
                <p className="text-2xl font-bold text-orange-600">
                  {sellerInquiries.filter(i => i.status === 'new' || i.status === 'viewed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>法律與隱私</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={() => navigate('/privacy')}
              className="w-full justify-start"
            >
              隱私權政策
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/terms')}
              className="w-full justify-start"
            >
              服務條款
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/disclaimer')}
              className="w-full justify-start"
            >
              免責聲明
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('mailto:support@partlink.com', '_blank')}
              className="w-full justify-start"
            >
              聯絡客服
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
