/**
 * 快速上架商品（Phase 2B 重寫）
 *
 * 核心改動：
 * - 改用 carBrands.ts 完整品牌清單（35+ 品牌覆蓋台灣 95%+ 市場）
 * - 車型/年份改純文字輸入（中古零件市場不適合結構化）
 * - 透過 trpc.products.create 真的寫入 DB（之前是 fake data）
 * - 上架成功後自動產生並複製分享連結
 * - 後端會檢查訂閱方案商品數量上限（超過會擋）
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSeller } from "@/contexts/SellerContext";
import { trpc } from "@/lib/trpc";
import { CAR_BRANDS } from "@/data/carBrands";
import { Upload, X, Copy, Check, ArrowLeft, Loader2 } from "lucide-react";

const COMMON_CONDITIONS = ["原廠拆件", "副廠拆件", "二手零件", "近全新二手", "全新", "翻新"];

export default function AddPart() {
  const [, navigate] = useLocation();
  const { currentUser, currentSellerDb, isLoading } = useSeller();
  const createProductMutation = trpc.products.create.useMutation();

  // 表單狀態
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [partName, setPartName] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // 上架成功後的分享連結
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  // 沒登入或沒商家資料 → 導回 dashboard 由它處理
  useEffect(() => {
    if (!isLoading && (!currentUser || !currentSellerDb)) {
      navigate("/dashboard");
    }
  }, [isLoading, currentUser, currentSellerDb]);

  const MAX_PHOTOS = 3; // free tier 預設；後端會強制檢查

  // === 圖片上傳 ===
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - images.length;
    if (files.length > remaining) {
      toast.warning(`最多只能上傳 ${MAX_PHOTOS} 張照片，已自動取前 ${remaining} 張`);
    }
    const filesToProcess = files.slice(0, remaining);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // === 送出 ===
  const handleSubmit = async () => {
    if (!brand) {
      toast.error("請選擇品牌");
      return;
    }
    if (!partName.trim()) {
      toast.error("請輸入零件名稱");
      return;
    }
    if (!currentSellerDb) {
      toast.error("商家資料尚未建立");
      return;
    }

    try {
      const product = await createProductMutation.mutateAsync({
        sellerId: currentSellerDb.id,
        brand,
        model: model.trim() || undefined,
        year: year.trim() || undefined,
        partName: partName.trim(),
        price: price.trim() || undefined,
        images: images.length > 0 ? images : undefined,
      });

      // ?openExternalBrowser=1 → LINE 看到這參數會強制用外部瀏覽器開（避免登入失效）
      const link = `${window.location.origin}/inquiry/${product.id}?openExternalBrowser=1`;
      setGeneratedLink(link);
      // 自動複製到剪貼簿
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success("商品已上架！分享連結已複製，可貼到 LINE / FB");
      } catch {
        toast.success("商品已上架！請手動複製連結");
      }
    } catch (e: any) {
      // 訂閱上限錯誤
      if (e?.data?.code === "FORBIDDEN") {
        toast.error(e.message || "已達商品數量上限，請升級方案");
      } else {
        toast.error(e?.message || "上架失敗，請稍後再試");
      }
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("連結已複製");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // === 上架成功頁 ===
  if (generatedLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">上架成功！</h2>
            <p className="text-gray-600 text-sm">
              把下面的連結貼到 LINE / FB / 蝦皮，買家點進來就能直接詢價
            </p>
          </div>

          <div className="bg-gray-50 border rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">商品分享連結</p>
            <p className="text-sm break-all text-gray-900">{generatedLink}</p>
          </div>

          <div className="flex gap-2 mb-4">
            <Button onClick={copyLink} variant="outline" className="flex-1">
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? "已複製" : "複製連結"}
            </Button>
            <Button
              onClick={() => {
                setGeneratedLink("");
                setBrand("");
                setModel("");
                setYear("");
                setPartName("");
                setCondition("");
                setPrice("");
                setImages([]);
                setCopied(false);
              }}
              variant="default"
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-1" />
              繼續上架
            </Button>
          </div>

          <Button onClick={() => navigate("/dashboard")} variant="ghost" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            回到儀表板
          </Button>
        </div>
      </div>
    );
  }

  // === 主表單 ===
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <Button onClick={() => navigate("/dashboard")} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回儀表板
        </Button>

        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-bold mb-1">快速上架新零件</h1>
          <p className="text-gray-600 text-sm mb-6">資訊越完整，買家詢價越精準</p>

          <div className="space-y-5">
            {/* 品牌（下拉清單） */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                品牌 <span className="text-red-500">*</span>
              </Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="選擇品牌（覆蓋台灣 95% 市場）" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {CAR_BRANDS.map(b => (
                    <SelectItem key={b.zh} value={b.zh}>
                      {b.zh}
                      {b.en !== b.zh && (
                        <span className="text-gray-400 text-xs ml-2">({b.en})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 車型 + 年份（純文字） */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">車型（選填）</Label>
                <Input
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder="例：Altis、CR-V、3 系列"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">年份（選填）</Label>
                <Input
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  placeholder="例：2018 或 2015-2020"
                />
              </div>
            </div>

            {/* 零件名稱 */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                零件名稱 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={partName}
                onChange={e => setPartName(e.target.value)}
                placeholder="例：原廠引擎、前保桿、整車售賣"
              />
            </div>

            {/* 狀況 */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">狀況（選填）</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀況" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CONDITIONS.map(c => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 價格 */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">價格（選填）</Label>
              <Input
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="例：3500 或「面議」"
              />
            </div>

            {/* 照片 */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                商品照片（最多 {MAX_PHOTOS} 張）
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img src={img} alt={`照片 ${idx + 1}`} className="w-full h-full object-cover rounded border" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_PHOTOS && (
                  <label className="aspect-square border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-gray-400">
                    <Upload className="w-6 h-6 text-gray-400" />
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
              <p className="text-xs text-gray-500 mt-1.5">
                可從相簿選或現場拍照（手機會跳出選擇）
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createProductMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {createProductMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {createProductMutation.isPending ? "上架中..." : "完成上架，產生分享連結"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
