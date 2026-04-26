import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Privacy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/account')}>← 返回</Button>
          <h1 className="text-3xl font-bold mt-4">隱私權政策</h1>
          <p className="text-gray-600 mt-2">最後更新：2025年1月</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 prose prose-sm max-w-none">
            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-bold mb-3">1. 簡介</h2>
                <p>
                  PartLink（「本平台」）致力於保護用戶的隱私權。本隱私權政策說明我們如何收集、使用、保護和披露您的個人信息。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">2. 我們收集的信息</h2>
                <p>我們可能收集以下類型的信息：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>個人識別信息：</strong>姓名、電話號碼、電子郵件地址、營業地址</li>
                  <li><strong>商品信息：</strong>您上架的汽車零件信息、照片、價格等</li>
                  <li><strong>詢價信息：</strong>買家的聯絡方式、詢價內容</li>
                  <li><strong>使用數據：</strong>訪問時間、使用功能、設備信息等</li>
                  <li><strong>交易數據：</strong>成交記錄、評分、評論等</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">3. 信息的使用</h2>
                <p>我們使用收集的信息用於以下目的：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>提供和改進平台服務</li>
                  <li>促進買賣雙方的交易</li>
                  <li>發送通知和更新</li>
                  <li>解決糾紛和提供客戶支持</li>
                  <li>防止欺詐和非法活動</li>
                  <li>遵守法律義務</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">4. 信息的保護</h2>
                <p>
                  我們採用適當的技術和組織措施保護您的個人信息，包括加密、訪問控制和定期安全審計。
                  然而，互聯網傳輸不是100%安全的，我們無法保證絕對的安全。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">5. 信息的分享</h2>
                <p>
                  我們不會向第三方出售或出租您的個人信息。我們可能在以下情況下分享信息：
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>為了完成交易（與買家分享賣家的聯絡方式）</li>
                  <li>遵守法律要求或政府請求</li>
                  <li>保護我們的權利和用戶的安全</li>
                  <li>與服務提供商合作（如支付處理、數據存儲）</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">6. Cookie和追蹤技術</h2>
                <p>
                  我們使用Cookie和類似技術來改進用戶體驗。您可以通過瀏覽器設置控制Cookie。
                  禁用Cookie可能會影響某些功能的使用。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">7. 用戶權利</h2>
                <p>根據適用法律，您可能有權：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>訪問我們持有的您的個人信息</li>
                  <li>更正不準確的信息</li>
                  <li>要求刪除您的信息</li>
                  <li>反對某些信息處理</li>
                  <li>請求信息的可攜帶性</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">8. 兒童隱私</h2>
                <p>
                  本平台不面向18歲以下的人士。我們不會有意收集兒童的個人信息。
                  如果我們發現已收集兒童信息，將立即刪除。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">9. 第三方鏈接</h2>
                <p>
                  本平台可能包含第三方網站的鏈接。我們不對這些網站的隱私慣例負責。
                  請查看第三方網站的隱私政策。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">10. 政策更新</h2>
                <p>
                  我們可能不時更新本隱私權政策。重大更改將通過電子郵件或平台通知通知您。
                  繼續使用本平台表示您同意更新的政策。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">11. 聯絡我們</h2>
                <p>
                  如果您對本隱私權政策有任何疑問或想行使您的權利，請聯絡我們：
                </p>
                <ul className="space-y-1">
                  <li>電子郵件：privacy@partlink.tw</li>
                  <li>郵件地址：台灣，待補充</li>
                </ul>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
