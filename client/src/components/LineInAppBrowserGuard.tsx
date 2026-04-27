/**
 * LINE in-app browser 偵測 + 引導 UI
 *
 * 用途：包在需要 LINE Login 的頁面外（InquiryForm、BuyerLogin），
 *       偵測到使用者在 LINE 內建瀏覽器時，顯示「請在外部瀏覽器開啟」引導，
 *       而不是讓 LINE Login 失敗。
 *
 * 偵測方式：navigator.userAgent 包含 "Line/" 或 "Line/x.x.x"
 *
 * 解法選項：
 * 1. 提供「複製連結」按鈕讓用戶自行貼到外部瀏覽器
 * 2. 提供 intent:// 或 chrome:// scheme 連結（但相容性差）
 * 3. 提示用戶用 LINE 內建選單「在外部瀏覽器開啟」
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

function detectLineInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Line\//i.test(ua);
}

export function LineInAppBrowserGuard({ children }: { children: React.ReactNode }) {
  const [isLineBrowser, setIsLineBrowser] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsLineBrowser(detectLineInAppBrowser());
  }, []);

  const copyCurrentUrl = async () => {
    try {
      // 確保連結帶 openExternalBrowser=1（如果沒有，加上）
      const url = new URL(window.location.href);
      if (!url.searchParams.has("openExternalBrowser")) {
        url.searchParams.set("openExternalBrowser", "1");
      }
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      toast.success("已複製，請貼到 Chrome / Safari 開啟");
    } catch {
      toast.error("複製失敗，請手動長按網址列複製");
    }
  };

  if (!isLineBrowser) return <>{children}</>;

  // 在 LINE 內建瀏覽器 → 顯示引導
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">⚠️</div>
          <h1 className="text-xl font-bold text-white mb-1">請用 Chrome 或 Safari 開啟</h1>
          <p className="text-sm text-gray-400">
            LINE 內建瀏覽器不支援登入功能，必須用手機的標準瀏覽器才能送詢價
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-300 font-medium mb-3">📱 如何開啟外部瀏覽器：</p>
          <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
            <li>
              點畫面 <strong className="text-green-400">右下角的「⋮」三點選單</strong>
            </li>
            <li>
              選 <strong className="text-green-400">「在外部瀏覽器開啟」</strong>
              （或「在 Chrome 開啟」/「在 Safari 開啟」）
            </li>
            <li>連結會自動跳到正確的瀏覽器</li>
          </ol>
        </div>

        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-200 mb-3">
            或者：複製連結再到 Chrome / Safari 貼上
          </p>
          <Button
            onClick={copyCurrentUrl}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                已複製連結
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                複製這個連結
              </>
            )}
          </Button>
        </div>

        <div className="text-center">
          <a
            href={(() => {
              const url = new URL(window.location.href);
              url.searchParams.set("openExternalBrowser", "1");
              return url.toString();
            })()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-gray-400 hover:text-gray-200 underline"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            嘗試自動開啟外部瀏覽器
          </a>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          這是 LINE 平台的限制（防止登入被釣魚攻擊），所有用 LINE 登入的網站都需要外部瀏覽器
        </p>
      </div>
    </div>
  );
}
