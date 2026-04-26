import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSeller } from '@/contexts/SellerContext';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Download, LogOut, User } from 'lucide-react';

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { currentSeller, parts, getStats, logout, updatePart, deletePart } = useSeller();

  const stats = getStats();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeletePart = (id: string) => {
    if (confirm('確定要刪除此商品嗎？')) {
      deletePart(id);
      toast.success('商品已刪除');
    }
  };

  const handleStatusChange = (partId: string, status: string) => {
    updatePart(partId, { status: status as any });
    toast.success('商品狀態已更新');
  };

  const handleExportCSV = () => {
    const sellerParts = parts.filter(p => p.sellerId === currentSeller?.id);
    const csv = [
      ['商品ID', '標題', '品牌', '車型', '年份', '零件名稱', '狀況', '詢價數', '上架時間'].join(','),
      ...sellerParts.map(p => [
        p.id,
        `"${p.title}"`,
        p.brand,
        p.model || '',
        p.year,
        p.partName,
        p.condition,
        p.inquiryCount,
        new Date(p.createdAt).toLocaleString('zh-TW'),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `partlink_parts_${Date.now()}.csv`);
    link.click();
    toast.success('商品列表已導出');
  };

  if (!currentSeller) {
    return null;
  }

  const sellerParts = parts.filter(p => p.sellerId === currentSeller.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">PartLink 儀表板</h1>
            <p className="text-gray-600">歡迎，{currentSeller.name}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/account')}
            >
              <User className="w-4 h-4 mr-2" />
              我的帳戶
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              登出
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/add-part')}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            快速上架新零件
          </Button>
        </div>

        {/* Business Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">總上架數</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalParts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">總詢價數</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalInquiries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">待回覆</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.pendingReplies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">已成交</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.totalSold}</div>
            </CardContent>
          </Card>
        </div>

        {/* Parts List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>我的商品</CardTitle>
                <CardDescription>管理您上架的所有零件</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={handleExportCSV}
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                導出列表
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sellerParts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>還沒有上架任何商品</p>
                <Button
                  onClick={() => navigate('/add-part')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  立即上架
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">商品</th>
                      <th className="text-left py-3 px-4 font-medium">品牌/車型</th>
                      <th className="text-left py-3 px-4 font-medium">詢價數</th>
                      <th className="text-left py-3 px-4 font-medium">狀態</th>
                      <th className="text-left py-3 px-4 font-medium">上架時間</th>
                      <th className="text-left py-3 px-4 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellerParts.map(part => (
                      <tr key={part.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{part.title}</p>
                            <p className="text-xs text-gray-500">{part.partName}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {part.brand || part.model}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {part.inquiryCount}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={part.status}
                            onChange={(e) => handleStatusChange(part.id, e.target.value)}
                            className="border rounded px-2 py-1 text-xs"
                          >
                            <option value="sellable">待售</option>
                            <option value="reserved">保留中</option>
                            <option value="sold">已售</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {new Date(part.createdAt).toLocaleDateString('zh-TW')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/edit-part?id=${part.id}`)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePart(part.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inquiries Link */}
        <div className="mt-8">
          <Button
            onClick={() => navigate('/inquiries')}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            查看詢價管理
          </Button>
        </div>
      </div>
    </div>
  );
}
