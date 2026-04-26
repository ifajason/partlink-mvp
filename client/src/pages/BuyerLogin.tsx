/**
 * 買家強制 LINE 登入頁
 *
 * 觸發時機：買家點商品連結 → 進入 InquiryForm → 偵測未登入 → 導向此頁
 *
 * 流程：
 * 1. 接收 ?redirect=/inquiry/:partId 參數，記錄到 sessionStorage
 * 2. 點 LINE 登入按鈕 → 跳到 LINE OAuth
 * 3. LINE 回調到 /auth/line/callback (LineCallback.tsx)
 * 4. LineCallback 完成後讀 sessionStorage['line_oauth_redirect'] 自動跳回 InquiryForm
 *
 * 為什麼買家要強制登入：
 * - 防胡亂詢價（同一 LINE 5 分鐘 1 筆 / 24 小時 5 筆，後端速率限制）
 * - 解鎖雙向推播（賣家回覆時自動 push LINE 給買家）
 * - 不用手動填 LINE ID（從 LINE profile 自動帶入）
 *
 * 注意：原本這個檔案是「買家用電話查詢詢價」的舊頁面（基於 localStorage），
 * MVP 階段移除該功能，改為買家透過 LINE 推播得知賣家回覆。
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const LINE_CHANNEL_ID = "2009895830";

function generateState() {
  return Math.random().toString(36).substring(2, 15);
}

export default function BuyerLogin() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/");

  // 從 URL 參數讀 redirect（買家是從哪個商品頁過來的）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    if (redirect) {
      setRedirectTo(redirect);
    }
  }, []);

  const handleLineLogin = () => {
    setLoading(true);
    const state = generateState();
    sessionStorage.setItem("line_oauth_state", state);
    // ★ 關鍵：記錄角色 + 登入後要回去的頁面（給 LineCallback 使用）
    sessionStorage.setItem("line_oauth_role", "buyer");
    sessionStorage.setItem("line_oauth_redirect", redirectTo);

    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/line/callback`);
    const lineAuthUrl =
      `https://access.line.me/oauth2/v2.1/authorize` +
      `?response_type=code` +
      `&client_id=${LINE_CHANNEL_ID}` +
      `&redirect_uri=${redirectUri}` +
      `&state=${state}` +
      `&scope=profile%20openid`;
    window.location.href = lineAuthUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      {/* 裝飾背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-green-500/5 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo + 標題 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 mb-4 shadow-2xl shadow-green-900/40">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" stroke="#fff" strokeWidth="2.5" />
              <path
                d="M11 16l3.5 3.5L21 13"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            送出詢價前，請先登入
          </h1>
        </div>

        {/* 主卡片 */}
        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-white font-semibold mb-3 text-base">為什麼需要 LINE 登入？</h2>

          <ul className="space-y-2.5 mb-6 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>
                賣家回覆時，會直接<strong className="text-green-400">推播到你的 LINE</strong>
                ，不用一直回來查
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>
                不用手動填寫聯絡方式，<strong className="text-green-400">一鍵帶入</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>
                保護真實買家權益，<strong className="text-green-400">過濾不實詢價</strong>
              </span>
            </li>
          </ul>

          <button
            onClick={handleLineLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05b34c] active:bg-[#04a044] text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-green-900/30 text-base"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.04 2 11.04C2 15.56 5.74 19.33 10.86 19.93C11.22 20.01 11.71 20.17 11.83 20.47C11.94 20.74 11.9 21.16 11.86 21.44L11.65 22.65C11.59 22.97 11.38 23.89 12.01 23.61C12.64 23.33 17.2 20.38 19.3 18C20.73 16.41 21.44 14.78 21.44 11.04C21.44 6.04 16.96 2 12 2Z" />
              </svg>
            )}
            {loading ? "跳轉中..." : "以 LINE 登入並送出詢價"}
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full mt-3 text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
          >
            取消，返回首頁
          </button>

          <div className="mt-5 pt-5 border-t border-gray-800">
            <p className="text-gray-500 text-xs text-center leading-relaxed">
              登入即代表你同意
              <a href="/privacy" className="text-green-400 hover:text-green-300 mx-1">
                隱私政策
              </a>
              <br />
              你的 LINE 個資僅用於詢價通知，不會公開
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
