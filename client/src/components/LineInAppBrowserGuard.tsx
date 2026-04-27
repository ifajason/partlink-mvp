/**
 * 跨平台「In-App Browser 偵測 + 引導」UI
 *
 * 涵蓋所有會擋 OAuth 的 in-app browsers：
 * - LINE（最常見）
 * - Facebook / Messenger
 * - Instagram
 * - Twitter/X
 * - WeChat
 * - TikTok
 * - 其他常見 webview
 *
 * 平台分流：
 * - iOS：引導用 Safari
 * - Android：引導用 Chrome
 * - Desktop：完全不擋（return children）
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface BrowserInfo {
  isInApp: boolean;
  appName: string; // "LINE" / "Facebook" / "Instagram" 等
  platform: "ios" | "android" | "desktop" | "unknown";
}

function detectBrowser(): BrowserInfo {
  if (typeof window === "undefined") {
    return { isInApp: false, appName: "", platform: "unknown" };
  }
  const ua = navigator.userAgent || "";

  // 平台偵測
  let platform: BrowserInfo["platform"] = "unknown";
  if (/iPhone|iPad|iPod/i.test(ua)) platform = "ios";
  else if (/Android/i.test(ua)) platform = "android";
  else if (/Windows|Macintosh|Linux/i.test(ua)) platform = "desktop";

  // In-app browser 偵測（依優先順序）
  if (/Line\//i.test(ua)) {
    return { isInApp: true, appName: "LINE", platform };
  }
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) {
    return { isInApp: true, appName: "Facebook", platform };
  }
  if (/Instagram/i.test(ua)) {
    return { isInApp: true, appName: "Instagram", platform };
  }
  if (/Twitter|TwitterAndroid/i.test(ua)) {
    return { isInApp: true, appName: "Twitter / X", platform };
  }
  if (/MicroMessenger/i.test(ua)) {
    return { isInApp: true, appName: "WeChat", platform };
  }
  if (/musical_ly|Bytedance|TikTok/i.test(ua)) {
    return { isInApp: true, appName: "TikTok", platform };
  }
  // 通用 webview 偵測（Android）
  if (platform === "android" && /; wv\)/i.test(ua)) {
    return { isInApp: true, appName: "App 內建瀏覽器", platform };
  }

  return { isInApp: false, appName: "", platform };
}

export function LineInAppBrowserGuard({ children }: { children: React.ReactNode }) {
  const [browser, setBrowser] = useState<BrowserInfo>({ isInApp: false, appName: "", platform: "unknown" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  const copyCurrentUrl = async () => {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("openExternalBrowser")) {
        url.searchParams.set("openExternalBrowser", "1");
      }
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      const target = browser.platform === "ios" ? "Safari" : "Chrome";
      toast.success(`已複製！請打開 ${target} 貼到網址列`);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("複製失敗，請手動長按上方網址列複製");
    }
  };

  // Desktop 或非 in-app browser → 完全不擋
  if (!browser.isInApp || browser.platform === "desktop") {
    return <>{children}</>;
  }

  const targetBrowser = browser.platform === "ios" ? "Safari" : "Chrome";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">📱</div>
          <h1 className="text-xl font-bold text-white mb-2">請改用 {targetBrowser} 開啟</h1>
          <p className="text-sm text-gray-400">
            {browser.appName} 內建瀏覽器不支援登入功能（{browser.appName === "LINE" ? "防釣魚" : "平台限制"}）
          </p>
        </div>

        {/* 主要 CTA */}
        <div className="bg-blue-600 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-100 mb-3 font-medium">
            👇 推薦做法：複製連結再貼到 {targetBrowser}
          </p>
          <Button
            onClick={copyCurrentUrl}
            className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold py-3"
            size="lg"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                已複製！打開 {targetBrowser} 貼到網址列
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 mr-2" />
                點此複製連結
              </>
            )}
          </Button>
        </div>

        {/* 平台專屬指引 */}
        {browser.platform === "ios" ? (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300 font-medium mb-2">📲 或用 iPhone 內建功能：</p>
            <ol className="space-y-1.5 text-sm text-gray-300 list-decimal list-inside ml-1">
              <li>點畫面 <strong className="text-green-400">底部「分享」圖示</strong>（📤）</li>
              <li>選 <strong className="text-green-400">「在 Safari 中打開」</strong></li>
            </ol>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300 font-medium mb-2">📲 或用 Android 內建功能：</p>
            <ol className="space-y-1.5 text-sm text-gray-300 list-decimal list-inside ml-1">
              <li>點畫面 <strong className="text-green-400">右上角「⋮」三點</strong></li>
              <li>選 <strong className="text-green-400">「在 Chrome 中打開」</strong> 或 <strong className="text-green-400">「在其他瀏覽器中打開」</strong></li>
            </ol>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-4">
          這是 App 內建瀏覽器的安全限制，所有需要登入的網站都需要外部瀏覽器
        </p>
      </div>
    </div>
  );
}
