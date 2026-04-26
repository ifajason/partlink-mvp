import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useSeller } from '@/contexts/SellerContext';

const LINE_CHANNEL_ID = '2009895830';

function generateState() {
  return Math.random().toString(36).substring(2, 15);
}

export default function Login() {
  const [, navigate] = useLocation();
  const { currentSeller } = useSeller();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentSeller) {
      navigate('/dashboard');
    }
  }, [currentSeller]);

  const handleLineLogin = () => {
    setLoading(true);
    const state = generateState();
    sessionStorage.setItem('line_oauth_state', state);
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-green-500/5 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-3xl" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-900 mb-5 shadow-2xl shadow-purple-900/50">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M8 20C8 13.4 13.4 8 20 8C26.6 8 32 13.4 32 20C32 26.6 26.6 32 20 32" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M20 32C16 32 12 29 10 25" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="20" cy="20" r="4" fill="#4ade80"/>
              <path d="M20 8V5M32 20H35M20 32V35" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Part<span className="text-green-400">Link</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">汽車零件詢價管理平台</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-1">歡迎使用</h2>
          <p className="text-gray-400 text-sm mb-8">
            使用 LINE 帳號快速登入<br/>開始管理你的零件詢價
          </p>

          <button
            onClick={handleLineLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05b34c] active:bg-[#04a044] text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-green-900/30 text-base"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.04 2 11.04C2 15.56 5.74 19.33 10.86 19.93C11.22 20.01 11.71 20.17 11.83 20.47C11.94 20.74 11.9 21.16 11.86 21.44L11.65 22.65C11.59 22.97 11.38 23.89 12.01 23.61C12.64 23.33 17.2 20.38 19.3 18C20.73 16.41 21.44 14.78 21.44 11.04C21.44 6.04 16.96 2 12 2Z"/>
              </svg>
            )}
            {loading ? '跳轉中...' : '以 LINE 帳號登入'}
          </button>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-gray-500 text-xs text-center leading-relaxed">
              登入即代表你同意我們的
              <a href="/privacy" className="text-green-400 hover:text-green-300 mx-1">隱私政策</a>
              與服務條款
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: '⚡', text: '30秒上架' },
            { icon: '🔗', text: '一鍵分享' },
            { icon: '📬', text: '統一收件' },
          ].map((item) => (
            <div key={item.text} className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-gray-400 text-xs">{item.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
