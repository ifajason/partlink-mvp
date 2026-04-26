import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSeller } from '@/contexts/SellerContext';
import { toast } from 'sonner';
import { Upload, X, Copy, Share2 } from 'lucide-react';

interface BrandData {
  brands: Array<{
    id: string;
    name: string;
    nameZh: string;
    models: string[];
  }>;
  parts: string[];
  conditions: string[];
}

export default function EditPart() {
  const [, navigate] = useLocation();
  const { currentSeller, parts, updatePart } = useSeller();
  const [partId, setPartId] = useState<string | null>(null);
  const [part, setPart] = useState<any>(null);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [partsList, setPartsList] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [partName, setPartName] = useState('');
  const [partNameCustom, setPartNameCustom] = useState('');
  const [condition, setCondition] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Get part ID from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setPartId(id);
      const foundPart = parts.find(p => p.id === id);
      if (foundPart && foundPart.sellerId === currentSeller?.id) {
        setPart(foundPart);
        setBrand(foundPart.brand || '');
        setModel(foundPart.model || '');
        setYear(foundPart.year || '');
        setPartName(foundPart.partName || '');
        setPartNameCustom(foundPart.partNameCustom || '');
        setCondition(foundPart.condition || '');
        setPrice(foundPart.price || '');
        setImages(foundPart.images || []);
      } else {
        toast.error('商品不存在或無權編輯');
        navigate('/dashboard');
      }
    }
  }, []);

  useEffect(() => {
    if (!currentSeller) {
      navigate('/');
      return;
    }

    // Load brand data
    fetch('/brands.json')
      .then(res => res.json())
      .then(data => {
        setBrandData(data);
        setBrands(data.brands.map((b: any) => b.nameZh));
        setPartsList(data.parts);
      })
      .catch(err => console.error('Failed to load brands:', err));
  }, [currentSeller, navigate]);

  // Update models when brand changes
  useEffect(() => {
    if (brand && brandData) {
      const brandObj = brandData.brands.find(b => b.nameZh === brand);
      setModels(brandObj?.models || []);
    } else {
      setModels([]);
    }
  }, [brand, brandData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > 800) {
              height = (height * 800) / width;
              width = 800;
            }
          } else {
            if (height > 800) {
              width = (width * 800) / height;
              height = 800;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const compressedData = canvas.toDataURL('image/jpeg', 0.7);
          setImages(prev => [...prev, compressedData]);
        };
        img.src = result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
    toast.success('照片已刪除');
  };

  const inquiryLink = part ? `${window.location.origin}/inquiry/${part.id}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inquiryLink);
    toast.success('詢價連結已複製');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${part.brand} ${part.year} ${part.partName}`,
        text: `查詢我的汽車零件：${part.brand} ${part.year} ${part.partName}`,
        url: inquiryLink,
      }).catch(err => console.log('Share failed:', err));
    } else {
      toast.info('您的瀏覽器不支持分享功能，請複製連結手動分享');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand || !model || !year || !condition) {
      toast.error('請填寫所有必填欄位');
      return;
    }

    const finalPartName = partName || partNameCustom;
    if (!finalPartName) {
      toast.error('請選擇或填寫零件名稱');
      return;
    }

    if (partId) {
      updatePart(partId, {
        brand,
        model,
        year,
        partName: partName || '',
        partNameCustom: partNameCustom || '',
        condition,
        price: price ? price : '',
        images,
        title: `${brand} ${year} ${finalPartName} ${condition}`,
      });
      toast.success('商品已更新');
      navigate('/dashboard');
    }
  };

  if (!part) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>← 返回儀表板</Button>
          <h1 className="text-3xl font-bold mt-4">編輯商品</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">品牌 *</label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇品牌" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">車型 *</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇車型" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">年份 *</label>
                  <Input
                    type="text"
                    placeholder="2020"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">狀況 *</label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇狀況" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="原廠">原廠</SelectItem>
                      <SelectItem value="副廠">副廠</SelectItem>
                      <SelectItem value="中古">中古</SelectItem>
                      <SelectItem value="翻新">翻新</SelectItem>
                      <SelectItem value="拆車件">拆車件</SelectItem>
                      <SelectItem value="庫存品">庫存品</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Part Info */}
          <Card>
            <CardHeader>
              <CardTitle>零件信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">零件名稱（從列表選擇）</label>
                <Select value={partName} onValueChange={setPartName}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇零件" />
                  </SelectTrigger>
                  <SelectContent>
                    {partsList.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">零件名稱（手動填寫）</label>
                <Input
                  type="text"
                  placeholder="如果上面沒有，可以手動填寫"
                  value={partNameCustom}
                  onChange={(e) => setPartNameCustom(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">價格（可選）</label>
                <Input
                  type="text"
                  placeholder="例：2000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>商品照片</CardTitle>
              <CardDescription>最多上傳5張照片</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 5}
              >
                <Upload className="w-4 h-4 mr-2" />
                上傳照片
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={`商品 ${idx + 1}`} className="w-full h-32 object-cover rounded" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(idx)}
                        className="absolute top-0 right-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sharing */}
          <Card>
            <CardHeader>
              <CardTitle>分享詢價連結</CardTitle>
              <CardDescription>讓買家可以直接詢價此商品</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={inquiryLink}
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  variant="outline"
                  title="複製詢價連結"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  onClick={handleShare}
                  variant="outline"
                  title="分享詢價連結"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">複製連結後，您可以通過LINE、WhatsApp或其他社交媒體分享給客戶</p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              保存更改
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              取消
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
