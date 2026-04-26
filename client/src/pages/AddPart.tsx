import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useSeller } from '@/contexts/SellerContext';
import { Upload, X, Copy, Check } from 'lucide-react';

// 台灣 2010-2026 年排行前 20 的汽車品牌
const TOP_BRANDS = [
  '豐田', '本田', '馬自達', '福特', '現代', '起亞', '日產', '鈴木', '三菱',
  '寶馬', '賓士', '奧迪', '福斯', '雪佛蘭', '別克', '凌志', '斯巴魯', '大發', '五十鈴', '吉普'
];

// 常見車型（根據品牌）
const BRAND_MODELS: Record<string, string[]> = {
  '豐田': ['Corolla', 'Camry', 'RAV4', 'Yaris', 'Vios', 'Altis', 'Wish'],
  '本田': ['Civic', 'Accord', 'CR-V', 'Fit', 'Odyssey'],
  '馬自達': ['CX-5', 'Mazda3', 'Mazda6', 'CX-3'],
  '福特': ['Focus', 'Fiesta', 'Escape'],
  '現代': ['Elantra', 'Sonata', 'Tucson'],
  '起亞': ['Forte', 'Optima', 'Sportage'],
  '日產': ['Altima', 'Maxima', 'Rogue'],
  '鈴木': ['Swift', 'Vitara', 'Ertiga'],
  '三菱': ['Outlander', 'Lancer', 'Pajero'],
  '寶馬': ['3 Series', '5 Series', 'X3', 'X5'],
  '賓士': ['C-Class', 'E-Class', 'GLC'],
  '奧迪': ['A3', 'A4', 'A6', 'Q3', 'Q5'],
  '福斯': ['Golf', 'Passat', 'Tiguan'],
  '雪佛蘭': ['Cruze', 'Malibu', 'Equinox'],
  '別克': ['Excelle', 'LaCrosse', 'Envision'],
  '凌志': ['ES', 'RX', 'NX'],
  '斯巴魯': ['Legacy', 'Outback', 'XV'],
  '大發': ['Mira', 'Move', 'Tanto'],
  '五十鈴': ['D-Max', 'MU-X'],
  '吉普': ['Wrangler', 'Cherokee', 'Compass'],
};

// 常見零件狀況
const COMMON_CONDITIONS = [
  '原廠拆件', '副廠拆件', '二手零件', '近全新二手', '全新', '翻新'
];

export default function AddPart() {
  const [, navigate] = useLocation();
  const { addPart, currentSeller } = useSeller();
  const [images, setImages] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  
  // 表單欄位
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [model, setModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [year, setYear] = useState('');
  const [partName, setPartName] = useState('');
  const [condition, setCondition] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  
  // 根據訂閱版本動態設置照片上傳限制
  const getMaxPhotos = () => {
    if (!currentSeller?.subscription_tier) return 3;
    switch (currentSeller.subscription_tier) {
      case 'free':
        return 3;
      case 'basic':
        return 4;
      case 'professional':
        return 5;
      default:
        return 3;
    }
  };
  
  const maxPhotos = getMaxPhotos();
  const tierName = currentSeller?.subscription_tier === 'free' ? '免費版' : 
                   currentSeller?.subscription_tier === 'basic' ? '基礎版' : '專業版';

  // 處理照片上傳
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = maxPhotos - images.length;
    if (files.length > remainingSlots) {
      toast.error(`最多只能上傳 ${maxPhotos} 張照片 (${tierName})`);
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 16 * 1024 * 1024) {
        toast.error(`檔案 ${file.name} 超過 16MB 限制`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 刪除照片
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentSeller) {
      toast.error('請先登入');
      return;
    }

    // 驗證必填欄位
    if (!partName.trim()) {
      toast.error('請填寫零件名稱');
      return;
    }

    // 獲取最終的品牌、車型、狀況值
    const finalBrand = brand === 'custom' ? customBrand : brand;
    const finalModel = model === 'custom' ? customModel : model;
    const finalCondition = condition === 'custom' ? customCondition : condition;

    try {
      const productId = await addPart({
        sellerId: currentSeller.id,
        title: partName.trim(),
        brand: finalBrand || '',
        model: finalModel,
        year: year || '',
        partName: partName.trim(),
        condition: finalCondition || '',
        price: price,
        images: images,
        status: 'sellable',
      });

      toast.success('商品上架成功！');

      // 生成詢價連結
      const link = `${window.location.origin}/inquiry/${productId}`;
      setGeneratedLink(link);

      // 自動複製連結
      navigator.clipboard.writeText(link);
      toast.success('詢價連結已複製到剪貼板');

      // 3 秒後返回儀表板
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('上架失敗:', error);
      toast.error('上架失敗，請稍後再試');
    }
  };

  // 複製連結
  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success('連結已複製');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 如果已生成連結，顯示成功頁面
  if (generatedLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">商品上架成功！</h2>
            <p className="text-gray-600 mb-6">您的商品已成功上架，詢價連結已生成</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">詢價連結</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <Button onClick={copyLink} variant="outline" size="sm">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => navigate('/dashboard')} className="flex-1">
                返回儀表板
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                繼續上架
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">快速上架商品</h1>
          <p className="text-gray-600 mb-8">填寫商品信息，快速生成詢價連結</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 照片上傳 */}
            <div>
              <Label className="text-base font-semibold mb-3 block">商品照片</Label>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                    <img src={img} alt={`商品照片 ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {images.length < maxPhotos && (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {images.length} / {maxPhotos} 張 ({tierName})
                  </span>
                  <span className="text-xs text-gray-500 mt-1">支持選擇多張照片</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* 品牌 */}
            <div>
              <Label htmlFor="brand" className="text-base font-semibold mb-3 block">品牌（選填）</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇品牌或手動輸入" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">手動輸入品牌</SelectItem>
                  {TOP_BRANDS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {brand === 'custom' && (
                <Input
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="請輸入品牌名稱"
                  className="mt-2"
                />
              )}
            </div>

            {/* 車型 */}
            <div>
              <Label htmlFor="model" className="text-base font-semibold mb-3 block">車型（選填）</Label>
              {brand && brand !== 'custom' && BRAND_MODELS[brand] ? (
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇車型或手動輸入" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">手動輸入車型</SelectItem>
                    {BRAND_MODELS[brand].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="請輸入車型"
                />
              )}
              {brand && brand !== 'custom' && BRAND_MODELS[brand] && model === 'custom' && (
                <Input
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="請輸入車型"
                  className="mt-2"
                />
              )}
            </div>

            {/* 年份 */}
            <div>
              <Label htmlFor="year" className="text-base font-semibold mb-3 block">年份（選填）</Label>
              <Input
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="例如：2015 或 2015-2018"
              />
            </div>

            {/* 零件名稱 */}
            <div>
              <Label htmlFor="partName" className="text-base font-semibold mb-3 block">零件名稱 *</Label>
              <Input
                id="partName"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="例如：前保險桿、引擎蓋、大燈"
                required
              />
            </div>

            {/* 狀況 */}
            <div>
              <Label htmlFor="condition" className="text-base font-semibold mb-3 block">狀況（選填）</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀況或手動輸入" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">手動輸入狀況</SelectItem>
                  {COMMON_CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {condition === 'custom' && (
                <Input
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  placeholder="請輸入狀況"
                  className="mt-2"
                />
              )}
            </div>

            {/* 價格 */}
            <div>
              <Label htmlFor="price" className="text-base font-semibold mb-3 block">價格（選填）</Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="例如：5000 或 面議"
              />
            </div>

            {/* 商品描述 */}
            <div>
              <Label htmlFor="description" className="text-base font-semibold mb-3 block">商品描述（選填）</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="補充說明、注意事項等"
                rows={4}
              />
            </div>

            {/* 提交按鈕 */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                取消
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                立即上架
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
