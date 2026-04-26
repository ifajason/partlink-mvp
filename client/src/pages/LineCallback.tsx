import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useSeller } from '@/contexts/SellerContext';

export default function LineCallback() {
  const [, navigate] = useLocation();
  const { loginWithApi } = useSeller();
  const [status, setStatus] = useState<'loading' | 'info' | 'error'>('loading');
  const [lineProfile, setLineProfile] = useState<any>(null);
  const [businessName, setBusinessName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const savedState = sessionStorage.getItem('line_oauth_state');

    if (!code || !state || state !== savedState) {
      setError('驗證失敗，請重新登入');
      setStatus('error');
      return;
    }

    sessionStorage.removeItem('line_oauth_state');

    fetch('/api/auth/line', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri: `${window.location.origin}/auth/line/callback` }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setLineProfile(data);
        setBusinessName(data.displayName || '');

        // 檢查localStorage是否已有此LINE用戶
        const existing = localStorage.getItem(`seller_${data.lineUserId}`);
        if (existing) {
          const seller = JSON.parse(existing);
          loginWithApi(seller).then(() => navigate('/dashboard'));
        } else {
          setStatus('info');
        }
      })
      .catch(e => {
        setError(e.message || 'LINE 登入失敗');
        setStatus('error');
      });
  }, []);

  const handleSubmit = async () => {
    if (!businessName || !contactPhone) {
      alert('請填寫商家名稱和聯絡電話');
      return;
    }
    setSubmitting(true);
    try {
      const sellerData = {
        id: Date.now(),
        businessName,
        contactPhone,
        address: address || '',
        lineId: lineProfile?.lineUserId,
        lineDisplayName: lineProfile?.displayName,
        linePictureUrl: lineProfile?.pictureUrl,
        subscription_tier: 'free',
        createdAt: new Date().toISOString(),
      };
      // 存到localStorage
      localStorage.setItem(`seller_${lineProfile?.lineUserId}`, JSON.stringify(sellerData));
      await loginWithApi(sellerData);
      localStorage.setItem('partlink_seller', JSON.stringify(sellerData));
localStorage.setItem('partlink_login_expiry', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
      navigate('/dashboard');
    } catch (e: any) {
      alert(e.message || '建立帳號失敗');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">正在驗證 LINE 身份...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-red-900 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-white font-bold mb-2">登入失敗</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/login')} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors">
            返回重試
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {lineProfile?.pictureUrl && (
          <div className="text-center mb-6">
            <img src={lineProfile.pictureUrl} alt="LINE頭像" className="w-16 h-16 rounded-full mx-auto border-2 border-green-400/50 mb-2" />
            <p className="text-gray-400 text-sm">你好，{lineProfile.displayName} 👋</p>
          </div>
        )}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-white font-bold text-lg mb-1">建立商家帳號</h2>
          <p className="text-gray-400 text-sm mb-6">請填寫你的商家資料</p>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">商家名稱 <span className="text-red-400">*</span></label>
              <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="例：懿龍車業" className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 placeholder-gray-500" />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">聯絡電話 <span className="text-red-400">*</span></label>
              <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="0912345678" className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 placeholder-gray-500" />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">地址（選填）</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="台中市..." className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 placeholder-gray-500" />
            </div>
            <button onClick={handleSubmit} disabled={submitting} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors mt-2">
              {submitting ? '建立中...' : '開始使用 PartLink'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
