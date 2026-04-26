/**
 * LINE OAuth 回調頁
 *
 * 流程：
 * 1. LINE 跳回此頁，URL 有 code & state
 * 2. 驗證 state 與 sessionStorage 一致（防 CSRF）
 * 3. 讀 sessionStorage['line_oauth_role'] 判斷是 seller 還是 buyer
 * 4. 呼叫後端 /api/auth/line（後端會 upsert users + 設 cookie）
 * 5. 依角色 + redirect 跳到對應頁面
 *
 * 注意：登入用的 cookie 由「後端」設定（HttpOnly），前端拿不到也不需要。
 *       前端只需要把使用者導向正確的下一頁。
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface LineProfile {
  userId: number;
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
  role: string;
}

export default function LineCallback() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<LineProfile | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const savedState = sessionStorage.getItem("line_oauth_state");
    const role = sessionStorage.getItem("line_oauth_role") || "unknown";
    const redirect = sessionStorage.getItem("line_oauth_redirect") || "/dashboard";

    // CSRF 驗證
    if (!code || !state || state !== savedState) {
      setError("驗證失敗，請重新登入");
      setStatus("error");
      return;
    }

    // 清掉 state（一次性）
    sessionStorage.removeItem("line_oauth_state");

    // 呼叫後端換 token + 設 cookie
    fetch("/api/auth/line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // 確保後端 set-cookie 能寫進來
      body: JSON.stringify({
        code,
        redirectUri: `${window.location.origin}/auth/line/callback`,
        role,
      }),
    })
      .then(r => r.json())
      .then((data: any) => {
        if (data.error) {
          throw new Error(data.error);
        }
        const p = data as LineProfile;
        setProfile(p);

        // 清掉導向標記
        sessionStorage.removeItem("line_oauth_role");
        sessionStorage.removeItem("line_oauth_redirect");

        // 依角色分流
        if (role === "buyer") {
          // 買家登入完成，回到他原本要詢價的商品頁
          // 給 cookie 一點時間生效再導頁（保險）
          setTimeout(() => {
            window.location.href = redirect;
          }, 300);
        } else {
          // 賣家登入完成，去儀表板
          // 注意：賣家若是首次登入需要建商家資料，由 dashboard 自行檢查 + 導頁
          setTimeout(() => {
            window.location.href = redirect || "/dashboard";
          }, 300);
        }
      })
      .catch(e => {
        console.error("[LineCallback] Error:", e);
        setError(e?.message || "LINE 登入失敗");
        setStatus("error");
      });
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">正在驗證 LINE 身份...</p>
          {profile && (
            <p className="text-green-400 text-sm mt-2">你好，{profile.displayName} 👋</p>
          )}
        </div>
      </div>
    );
  }

  // status === "error"
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-red-900 rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-white font-bold mb-2">登入失敗</h2>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors"
        >
          返回首頁
        </button>
      </div>
    </div>
  );
}
