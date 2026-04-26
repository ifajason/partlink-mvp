import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSeller } from '@/contexts/SellerContext';
import { Star, Clock, TrendingUp, CheckCircle, ArrowLeft } from 'lucide-react';

export default function SellerProfile() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/seller/:sellerId');
  const { parts, inquiries, getSellerReputation } = useSeller();

  if (!match) {
    return null;
  }

  const sellerId = params?.sellerId;
  const sellerParts = parts.filter(p => p.sellerId === sellerId);
  const sellerInquiries = inquiries.filter(i => i.sellerId === sellerId);
  const reputation = getSellerReputation();

  // 獲取商家信息（從第一個商品）
  const sellerName = sellerParts[0]?.sellerId || '商家';
  const totalInquiries = sellerInquiries.length;
  const repliedInquiries = sellerInquiries.filter(i => i.status === 'replied' || i.status === 'closed').length;
  const soldInquiries = sellerInquiries.filter(i => i.status === 'closed').length;

  const replyRate = totalInquiries > 0 ? Math.round((repliedInquiries / totalInquiries) * 100) : 0;
  const saleRate = repliedInquiries > 0 ? Math.round((soldInquiries / repliedInquiries) * 100) : 0;
  const isVerified = totalInquiries >= 5 && replyRate >= 80;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{sellerName}</h1>
                <p className="text-gray-600">商家信譽檔案</p>
              </div>
              {isVerified && (
                <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">已認證</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reputation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">回覆率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">{replyRate}%</div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
              <p className="text-xs text-gray-500 mt-2">{repliedInquiries} / {totalInquiries} 詢價</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">成交率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">{saleRate}%</div>
                <TrendingUp className="w-8 h-8 text-green-200" />
              </div>
              <p className="text-xs text-gray-500 mt-2">{soldInquiries} / {repliedInquiries} 成交</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">平均回覆時間</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-600">{reputation.responseTime}</div>
                <Clock className="w-8 h-8 text-orange-200" />
              </div>
              <p className="text-xs text-gray-500 mt-2">分鐘</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">評分</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-yellow-600">{reputation.averageRating}</div>
                <Star className="w-8 h-8 text-yellow-200 fill-yellow-200" />
              </div>
              <p className="text-xs text-gray-500 mt-2">/ 5.0</p>
            </CardContent>
          </Card>
        </div>

        {/* Inquiry Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>詢價統計</CardTitle>
            <CardDescription>過去30天的詢價數據</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">總詢價數</p>
                <p className="text-2xl font-bold text-blue-600">{totalInquiries}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">已回覆</p>
                <p className="text-2xl font-bold text-green-600">{repliedInquiries}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">已成交</p>
                <p className="text-2xl font-bold text-purple-600">{soldInquiries}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">待回覆</p>
                <p className="text-2xl font-bold text-orange-600">{totalInquiries - repliedInquiries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle>在售商品</CardTitle>
            <CardDescription>{sellerParts.length} 個商品</CardDescription>
          </CardHeader>
          <CardContent>
            {sellerParts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">暫無商品</p>
            ) : (
              <div className="space-y-2">
                {sellerParts.map(part => (
                  <div key={part.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <p className="font-medium">{part.title}</p>
                    <p className="text-sm text-gray-600">
                      {part.brand} {part.model} {part.year}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      詢價: {part.inquiryCount} | 上架時間: {new Date(part.createdAt).toLocaleDateString('zh-TW')}
                    </p>
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
