// src/app/help/privacy/page.js
export const metadata = {
  title: "ChopsBook 隱私政策 / Privacy Policy",
  description: "ChopsBook 平台隱私政策",
  metadataBase: new URL("https://chopsbook.com"),
  openGraph: {
    title: "ChopsBook Privacy Policy",
    description: "ChopsBook 隱私政策 / Privacy Policy",
    url: "https://your-domain.com/help/privacy",
  },
  twitter: {
    card: "summary",
    title: "ChopsBook Privacy Policy",
    description: "ChopsBook 隱私政策 / Privacy Policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="prose prose-lg max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold">
        <h1>ChopsBook 隱私政策 / Privacy Policy</h1>
      </h1>
      <p className="my-2">
        <strong>生效日期 / Effective Date：</strong>2025 年 10 月 20 日
      </p>

      {/* 1. 適用範圍 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            1. 適用範圍 / Scope
          </h2>
        </div>
        <p className="my-4 px-2">
          本隱私政策說明你使用 ChopsBook
          平台與相關服務時，我們如何收集、使用、披露與保護你的資料。
          <br />
          This Privacy Policy describes how we collect, use, disclose, and
          protect your information when you use the ChopsBook platform and
          related services.
        </p>
        <p className="my-4 px-2">
          本政策適用於我們運營之網站、行動 App、API
          以及你透過這些服務與我們互動時所涉及的資料處理行為。
          <br />
          This Policy applies to our website, mobile app, APIs, and all
          interactions you have with us via these services concerning data
          processing.
        </p>
        <p className="my-4 px-2">
          若你透過第三方服務或網站連結至我們平台，該第三方的隱私政策可能另有規範，不受本政策約束。
          <br />
          If you access our platform via third-party services or linked sites,
          their privacy policies may apply and are not governed by this Policy.
        </p>
      </section>

      {/* 2. 法律基礎與合規 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            2. 法律基礎 / Legal Basis & Compliance
          </h2>
        </div>
        <p className="my-4 px-2">
          本平台位於加拿大安大略省，因此我們在處理個人資訊時會遵循加拿大聯邦法規
          PIPEDA（《個人資訊保護與電子文件法》）。
          <br />
          We are based in Ontario, Canada, and therefore when handling personal
          information, we comply with the federal Canadian law PIPEDA (Personal
          Information Protection and Electronic Documents Act).
        </p>
        <p className="my-4 px-2">
          PIPEDA
          要求組織在商業活動過程中收集、使用或披露個人資訊時，必須符合法定原則與取得使用者同意。
          {(index = 1)} <br />
          PIPEDA requires organizations to follow statutory principles and
          obtain user consent when collecting, using, or disclosing personal
          information in the course of commercial activity.
        </p>
        <p className="my-4 px-2">
          如果資料跨境傳輸或處理，我們會採取適當措施（例如加密、合同條款）以保護資料安全。
          <br />
          If data is transferred or processed across borders, we will take
          appropriate safeguards (e.g., encryption, contractual clauses) to
          protect it.
        </p>
        <p className="my-4 px-2">
          若某些省有與 PIPEDA 類似之地方法律，我們將在適用時遵循該地方法規。
          <br />
          If provinces have privacy laws substantially similar to PIPEDA, we
          will comply with those local laws where applicable.
        </p>
      </section>

      {/* 3. 我們收集的資料 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            3. 我們收集的資料 / Information We Collect
          </h2>
        </div>

        <p className="my-4 px-2">
          我們可能從你主動提供的資料與自動收集之技術資料中取得資訊。
          <br />
          We may obtain information from data you actively provide and from
          automated technical means.
        </p>

        <p className="my-4 px-2">
          <strong>3.1 你主動提供的資料 / Data You Provide</strong>
        </p>
        <ul className="list-disc pl-6 space-y-2 font-bold">
          <li className="mb-2">
            帳戶資料（姓名、電郵、使用者名稱、密碼等）
            <br />
            Account data (name, email, username, password, etc.)
          </li>
          <li className="mb-2">
            聯絡資料（電話、地址等，如適用）
            <br />
            Contact information (phone number, address, if applicable)
          </li>
          <li className="mb-2">
            使用者內容：評論、照片、評分、地點標記等等
            <br />
            User content: reviews, photos, ratings, location tags, etc.
          </li>
          <li className="mb-2">
            交易與付費資訊（若你使用付費功能）
            <br />
            Transaction and payment information (if you use paid features)
          </li>
          <li className="mb-2">
            客服聯絡與回饋資料
            <br />
            Customer support and feedback data
          </li>
        </ul>

        <p className="my-4 px-2">
          <strong>3.2 自動收集資料 / Automatically Collected Data</strong>
        </p>
        <ul className="list-disc pl-6 space-y-2 font-bold">
          <li className="mb-2">
            裝置資訊：型號、作業系統、瀏覽器版本等
            <br />
            Device information: model, OS, browser version, etc.
          </li>
          <li className="mb-2">
            網絡／連線資料：IP 位址、ISP、訪問時間等
            <br />
            Network/connection info: IP address, ISP, access timestamps, etc.
          </li>
          <li className="mb-2">
            日誌資料：使用行為、頁面訪問、互動紀錄等
            <br />
            Log data: usage behavior, page visits, interaction logs, etc.
          </li>
          <li className="mb-2">
            Cookies、web beacons、localStorage、sessionStorage 等技術
            <br />
            Cookies, web beacons, localStorage, sessionStorage, and similar
            technologies
          </li>
          <li className="mb-2">
            Session / 會話資料：登入狀態、臨時上下文等
            <br />
            Session data: login state, temporary contexts, etc.
          </li>
          <li className="mb-2">
            快取 / 緩存資料：靜態資源或部分回應之暫存
            <br />
            Cache data: caching of static resources or partial responses
          </li>
        </ul>
      </section>

      {/* 4. 我們如何使用這些資料 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            4. 我們如何使用這些資料 / How We Use Your Information
          </h2>
        </div>
        <ul className="list-disc pl-6 space-y-2 font-bold">
          <li className="mb-2">
            提供、運營與維護平台服務
            <br />
            Provide, operate, and maintain the platform and services
          </li>
          <li className="mb-2">
            用於身份驗證、安全與風險偵測
            <br />
            For authentication, security, and risk detection
          </li>
          <li className="mb-2">
            處理交易、付款、訂閱等
            <br />
            Processing transactions, payments, subscriptions, etc.
          </li>
          <li className="mb-2">
            發送通知、平台訊息、行銷活動
            <br />
            Sending notifications, platform messages, marketing campaigns
          </li>
          <li className="mb-2">
            分析與報告、系統優化
            <br />
            Analytics & reporting, system optimization
          </li>
          <li className="mb-2">
            個性化推薦與內容排序
            <br />
            Personalization, recommendation, and content ranking
          </li>
          <li className="mb-2">
            客服支援、申訴處理
            <br />
            Customer support, complaint handling
          </li>
          <li className="mb-2">
            法律義務、調查及合規需求
            <br />
            Legal compliance, investigations, and regulatory obligations
          </li>
          <li className="mb-2">
            平台權利維護與防範濫用
            <br />
            Protecting platform rights and preventing abuse
          </li>
        </ul>
        <p className="my-4 px-2">
          若我們欲將資料用於本政策未列之用途，我們將提前通知你並在必要時取得額外同意。
          <br />
          If we intend to use data for purposes not listed here, we will notify
          you in advance and, if required, obtain additional consent.
        </p>
      </section>

      {/* 5. 資料分享與披露 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            5. 資料分享與披露 / Data Sharing & Disclosure
          </h2>
        </div>
        <ul className="list-disc pl-6 space-y-2 font-bold">
          <li className="mb-2">
            服務提供商與承包商（如主機、分析、寄信服務）
            <br />
            Service providers and contractors (hosting, analytics, email
            services)
          </li>
          <li className="mb-2">
            合作商家（在交易或優惠情境下）
            <br />
            Partner businesses (in transaction or promotion scenarios)
          </li>
          <li className="mb-2">
            第三方服務平台（若你授權整合）
            <br />
            Third-party service platforms (if you authorize integration)
          </li>
          <li className="mb-2">
            法律要求、法院命令、政府調查
            <br />
            Legal requirements, court orders, government investigations
          </li>
          <li className="mb-2">
            緊急情況下為保護生命／財產安全
            <br />
            Emergencies to protect life or property safety
          </li>
          <li className="mb-2">
            公司併購、重組或資產轉讓時披露資料
            <br />
            Disclosure during mergers, reorganizations, or asset transfers
          </li>
          <li className="mb-2">
            匿名化或合併資料方式發布統計資訊
            <br />
            Anonymized or aggregated data shared for statistical purposes
          </li>
        </ul>
        <p className="my-4 px-2">
          我們不會將你的個人資料販售予無關第三方。
          <br />
          We will not sell your personal information to unrelated third parties.
        </p>
      </section>

      {/* 6. Cookies、快取與追蹤技術 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            6. Cookies、快取與追蹤技術 / Cookies, Cache & Tracking Technologies
          </h2>
        </div>
        <p className="my-4 px-2">
          我們使用 Cookie、web beacons、localStorage、sessionStorage
          等技術，以識別裝置、保存偏好與提升體驗。
          <br />
          We use cookies, web beacons, localStorage, sessionStorage, and similar
          technologies to identify devices, store preferences, and enhance user
          experience.
        </p>
        <p className="my-4 px-2">
          為提升性能，我們可能在伺服器端或客戶端使用快取 (cache)
          儲存靜態資源或部分 API 回應。
          <br />
          To improve performance, we may cache static resources or partial API
          responses on the server or client side.
        </p>
        <p className="my-4 px-2">
          你可以在瀏覽器設定中拒絕或限制 Cookies，但這可能影響平台部分功能。
          <br />
          You can refuse or limit cookies in your browser settings, but this may
          impair some platform features.
        </p>
      </section>

      {/* 7. Session / 會話資料政策 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            7. Session / 會話資料政策 / Session Data Policies
          </h2>
        </div>
        <p className="my-4 px-2">
          當你登入時，我們會建立 session 以維持登入狀態與使用體驗。
          <br />
          When you log in, we establish a session to maintain login state and
          user experience.
        </p>
        <p className="my-4 px-2">
          Session 資料會儲存在伺服器端（如 session store）及前端技術（如 Cookie
          / token）中。
          <br />
          Session data is stored server-side (e.g. session store) and via
          front-end mechanisms (e.g. cookies / tokens).
        </p>
        <p className="my-4 px-2">
          Session 中只保留必要資料，不包含敏感資料，並在登出或過期後清除。
          <br />
          Only necessary data is stored in sessions, not sensitive data, and
          sessions are cleared upon logout or expiration.
        </p>
        <p className="my-4 px-2">
          長時間不活動的 session 會自動失效以降低風險。
          <br />
          Inactive sessions for extended periods will automatically expire to
          mitigate risk.
        </p>
      </section>

      {/* 8. 資料保存與刪除 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            8. 資料保存與刪除 / Data Retention & Deletion
          </h2>
        </div>
        <p className="my-4 px-2">
          我們僅保留你的資料於達成本政策目的所需期間，之後會刪除或匿名化處理。
          <br />
          We retain your data only as long as necessary for the purposes
          described herein, then delete or anonymize it.
        </p>
        <p className="my-4 px-2">
          當你請求刪除帳戶或資料，我們會依程序處理，但某些資料（如交易記錄）可能依法保留。
          <br />
          If you request account or data deletion, we will comply procedurally,
          but certain records (e.g. transaction logs) may be retained per legal
          requirements.
        </p>
      </section>

      {/* 9. 資料安全 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            9. 資料安全 / Security Measures
          </h2>
        </div>
        <p className="my-4 px-2">
          我們採取合理技術與組織措施保護資料安全，包括加密、存取控管、日誌記錄等。
          <br />
          We implement reasonable technical and organizational measures to
          protect data, including encryption, access controls, logging, etc.
        </p>
        <p className="my-4 px-2">
          儘管如此，無法保證絕對安全。如發生資料外洩，我們會根據法規通知受影響使用者與主管機關。
          <br />
          Nonetheless, absolute security cannot be guaranteed. In case of
          breach, we will notify affected users and regulatory authorities per
          law.
        </p>
      </section>

      {/* 10. 兒童隱私 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            10. 兒童隱私 / Children’s Privacy
          </h2>
        </div>
        <p className="my-4 px-2">
          我們的服務不針對 13
          歲以下兒童。如發現有人未經同意提供資料，我們會刪除並終止其使用。
          <br />
          Our services are not directed to children under 13. If data is
          submitted without proper consent, we will delete it and terminate
          access.
        </p>
      </section>

      {/* 11. 你的權利 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            11. 你的權利 / Your Rights
          </h2>
        </div>
        <ul className="list-disc pl-6 space-y-2 font-bold">
          <li className="mb-2">
            查詢 / 存取：請求我們提供你所持有之資料副本
            <br />
            Access: request a copy of your data held by us
          </li>
          <li className="mb-2">
            更正 / 更新：若資料不正確，你可請求修正
            <br />
            Correction / Update: request to correct inaccurate data
          </li>
          <li className="mb-2">
            刪除 / 撤回同意：在合理情況下請求刪除資料或撤回同意
            <br />
            Deletion / Withdraw Consent: request deletion or withdrawal of
            consent where reasonable
          </li>
          <li className="mb-2">
            限制 / 反對處理：在特定情況下請求限制或反對資料處理
            <br />
            Restrict / Object: request limitation or objection to data
            processing in certain circumstances
          </li>
          <li className="mb-2">
            提出申訴 / 向監管機構投訴
            <br />
            Lodge a complaint: file a complaint with the relevant data
            protection authority
          </li>
        </ul>
        <p className="my-4 px-2">
          我們可能會在處理請求時要求你進行身份驗證以保護資料安全。
          <br />
          We may require identity verification when processing requests to
          protect your data.
        </p>
      </section>

      {/* 12. 國際 / 跨境傳輸 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            12. 國際 / 跨境資料傳輸 / International / Cross-Border Transfers
          </h2>
        </div>
        <p className="my-4 px-2">
          若資料傳輸至加拿大以外地區，我們會採取適當保障措施（如加密、合同條款）確保安全。
          <br />
          If data is transferred outside Canada, we will adopt appropriate
          safeguards (e.g. encryption, contractual clauses) to ensure security.
        </p>
        <p className="my-4 px-2">
          接收國的資料保護法律可能不同，但我們仍承諾遵守本政策與適用法規。
          <br />
          Recipient countries may have different data protection laws, but we
          commit to adhere to this Policy and applicable legal standards.
        </p>
      </section>

      {/* 13. 隱私政策變更 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            13. 隱私政策變更 / Changes to This Privacy Policy
          </h2>
        </div>
        <p className="my-4 px-2">
          我們保留隨時修訂本政策之權利，並於本頁發布最新版。
          <br />
          We reserve the right to revise this Policy at any time and will post
          the latest version on this page.
        </p>
        <p className="my-4 px-2">
          若有重大變更，我們會提前通知你（例如電郵或平台公告）。
          <br />
          For material changes, we will provide advance notice (e.g. email or
          site announcements).
        </p>
        <p className="my-4 px-2">
          你在變更後持續使用服務，即視為你同意新版政策。
          <br />
          Your continued use of the service after changes constitutes acceptance
          of the updated Policy.
        </p>
      </section>

      {/* 14. 聯絡方式 */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            14. 聯絡方式 / Contact Information
          </h2>
        </div>
        <p className="my-4 px-2">
          若你對本政策有疑問、請求或意見，請聯絡我們：
          <br />
          If you have questions, requests or feedback about this Policy, please
          contact us at:
        </p>
        <p className="my-4 px-2">
          電子郵件 / Email：{" "}
          <a href="mailto:chopsbook@gmail.com">chopsbook@gmail.com</a>
        </p>
      </section>

      <p className="text-sm text-gray-500 mt-8">
        本文件可能不定期更新，請用戶定期查閱最新版。
        <br />
        This document may be updated periodically; please review the latest
        version regularly.
      </p>
      <p className="text-sm text-gray-500 mt-8 text-right">
        2025年10月25日修訂
        <br />
        Revised on October 25, 2025
      </p>
    </div>
  );
}
