import { useLocation } from 'wouter';

const plans = [
  {
    name: '免費版',
    price: 0,
    period: '永久免費',
    color: 'border-gray-700',
    badge: null,
    features: [
      { text: '上架商品 5 件', included: true },
      { text: '每件商品 3 張照片', included: true },
      { text: '詢價連結分享', included: true },
      { text: '統一收件匣', included: true },
      { text: '無限上架商品', included: false },
      { text: '每件最多 10 張照片', included: false },
      { text: 'LINE 詢價通知', included: false },
      { text: 'ESG 認證標章', included: false },
    ],
    cta: '目前使用中',
    ctaDisabled: true,
  },
  {
    name: '基礎版',
    price: 500,
    period: '每月',
    color: 'border-green-600',
    badge: '即將開放',
    features: [
      { text: '無限上架商品', included: true },
      { text: '每件最多 6 張照片', included: true },
      { text: '詢價連結分享', included: true },
      { text: '統一收件匣', included: true },
      { text: 'LINE 詢價即時通知', included: true },
      { text: 'ESG 認證標章顯示', included: false },
      { text: '數據分析報表', included: false },
      { text: '優先客服支援', included: false },
    ],
    cta: '即將開放',
    ctaDisabled: true,
  },
  {
    name: '專業版',
    price: 1200,
    period: '每月',
    color: 'border-purple-600',
    badge: '即將開放',
    features: [
      { text: '無限上架商品', included: true },
      { text: '每件最多 10 張照片', included: true },
      { text: '詢價連結分享', included: true },
      { text: '統一收件匣', included: true },
      { text: 'LINE 詢價即時通知', included: true },
      { text: 'ESG 認證標章顯示', included: true },
      { text: '數據分析報表', included: true },
      { text: '優先客服支援', included: true },
    ],
    cta: '即將開放',
    ctaDisabled: true,
  },
];

export default function PricingPlans() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-950 p-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 pt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors"
          >
            ← 返回儀表板
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">選擇方案</h1>
          <p className="text-gray-400">現階段全功能免費使用，付費方案即將推出</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-gray-900 border-2 ${plan.color} rounded-2xl p-6 relative`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gray-800 border border-gray-600 text-gray-300 text-xs font-medium px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {plan.price === 0 ? '免費' : `NT$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-400 text-sm">/{plan.period}</span>
                  )}
                </div>
                {plan.price === 0 && (
                  <p className="text-gray-400 text-sm mt-0.5">{plan.period}</p>
                )}
              </div>

              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5">
                    <span className={`mt-0.5 text-sm ${f.included ? 'text-green-400' : 'text-gray-600'}`}>
                      {f.included ? '✓' : '✗'}
                    </span>
                    <span className={`text-sm ${f.included ? 'text-gray-300' : 'text-gray-600'}`}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.ctaDisabled}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.ctaDisabled
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* ESG訂閱區塊 */}
        <div className="mt-10 bg-gradient-to-r from-green-950/50 to-emerald-950/50 border border-green-800/50 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="text-4xl">🌱</div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1">ESG 協會會員 / 車主訂閱</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                加入「台灣綠能再生經濟促進協會」，年繳 NT$3,000 入會費，
                可獲得一顆認證再生電池（市值 NT$2,000+），
                並享有合作修配廠零件折扣與低碳車主認證。
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-block bg-gray-800 border border-gray-600 text-gray-300 text-xs font-medium px-4 py-2 rounded-full">
                即將開放
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
