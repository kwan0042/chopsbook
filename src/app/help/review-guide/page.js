import { IconXboxXFilled, IconCircleCheckFilled } from "@tabler/icons-react";
export const metadata = {
  title: "ChopsBook Review Guidelines / 評論準則",
  metadataBase: new URL("https://chopsbook.com"),
  description:
    "ChopsBook 平台內容發布與評論準則，維護社群公正與品質，符合加拿大與安大略省法律要求。",
  openGraph: {
    title: "ChopsBook Review Guidelines",
    description: "ChopsBook 平台評論準則 / Review Guidelines",
    url: "https://chopsbook.com/help/review-guide",
  },
  twitter: {
    card: "summary",
    title: "ChopsBook Review Guidelines",
    description: "ChopsBook 平台評論準則 / Review Guidelines",
  },
};

export default function ReviewGuidePage() {
  return (
    <div className="prose prose-lg max-w-5xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold">
        ChopsBook 評論準則 / Review Guidelines
      </h1>

      <p className="my-2">
        <strong>生效日期 / Effective Date:</strong>2025 年 10 月 25 日
      </p>

      <p className="text-sm italic text-red-700">
        **法律聲明:** 本準則為
        ChopsBook《使用條款》之補充，旨在鼓勵誠實、公正的內容交流。本準則不構成法律建議。用戶應自行了解其發布內容在加拿大及安大略省法律下的責任。
        <br />
        **Legal Disclaimer:** These guidelines supplement ChopsBook&apos;s Terms of
        Service and are intended to promote honest and fair communication. They
        do not constitute legal advice. Users are responsible for understanding
        the legal implications of their published content under Canadian and
        Ontario law.
      </p>

      <p className="my-2">
        本準則適用於所有用戶生成內容（User-Generated Content,
        UGC），包括但不限於:評論、照片、評分、留言與修改建議，並構成《使用條款》的一部分。
        <br />
        These guidelines apply to all User-Generated Content (UGC), including
        reviews, photos, ratings, comments, and edit suggestions, and form an
        integral part of the Terms of Service.
      </p>

      {/* SECTION: Intro & Scope */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold">
            1. 前言與適用範圍 / Introduction & Scope
          </h2>
        </div>

        <p className="my-4 px-2">
          ChopsBook
          鼓勵用戶分享真實的餐廳體驗（含照片與評分）。我們希望評論能幫助其他用戶做出消費決定，同時保護個人與商家的合法權益。
          <br />
          ChopsBook encourages users to share authentic dining experiences
          (including photos and ratings). Our goal is to help others make
          informed choices while protecting the rights of individuals and
          businesses.
        </p>

        <p className="my-4 px-2 font-bold">適用範圍 / Applies to</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            所有註冊與未註冊用戶的評論與上傳內容 / All reviews and uploads by
            registered or unregistered users.
          </li>
          <li>
            評論文字、照片、星等評分、回覆與編輯建議 / Review text, photos, star
            ratings, replies and edit suggestions.
          </li>
        </ul>
      </section>

      {/* SECTION: Fairness */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold">
            2. 公平原則 / Fairness Principles
          </h2>
        </div>

        <p className="my-4 px-2">
          我們期待評論真實、具參考價值且尊重他人。評論應以親身體驗為基礎，並清楚說明造訪時間與用餐類型（例如:午餐、晚餐、外帶）。
          <br />
          Reviews should be honest, informative, and respectful. They must be
          based on firsthand experience and state visit date and type (e.g.,
          lunch, dinner, takeout).
        </p>

        <div className="my-3 px-2">
          <p className="font-bold">範例 Examples</p>
          <p className="flex">
            <IconCircleCheckFilled color="Green" className="mr-2 " />{" "}
            OK:2025/10/12 午餐 —
            點了牛肉拉麵，湯頭濃郁但偏鹹，份量足夠，服務快速。
          </p>
          <p className="flex">
            <IconXboxXFilled color="red" className="mr-2" />{" "}
            NG:這家店超差！別去！——（沒有說明吃了什麼、何時造訪）
          </p>
        </div>
      </section>

      {/* SECTION: Substance */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold">
            3. 內容實質性（請說清楚你吃了什麼） / Content Substance (State what
            you ate)
          </h2>
        </div>

        <p className="my-4 px-2">
          評論應明確描述實際消費的餐點或飲品（菜名、份量、口味、送餐/堂食等），讓其他用戶能從細節判斷是否符合偏好。
          <br />
          Reviews should clearly describe what was consumed (dish name, portion,
          taste, takeout/dine-in), so others can judge relevance to their
          preferences.
        </p>

        <div className="my-3 px-2">
          <p className="font-bold">範例 Examples</p>
          <p className="flex">
            <IconCircleCheckFilled color="Green" className="mr-2 " />
            OK:2025/09/03 外帶 —
            炸豬排便當，豬排酥脆但肉略乾，附的高麗菜新鮮，飯量中等。
          </p>
          <p className="flex">
            <IconXboxXFilled color="red" className="mr-2" />{" "}
            NG:不好吃！真的浪費錢！（未說明吃了什麼、無建設性資訊）
          </p>
        </div>
      </section>

      {/* SECTION: Verifiable claims */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold">
            4. 可驗證性與健康主張 / Verifiability & Health Claims
          </h2>
        </div>

        <p className="my-4 px-2">
          避免發表難以驗證或可能造成嚴重後果的主張（如:食物中毒、食材來源等）。若涉及健康或安全問題，請先聯絡相關單位或醫療機構，再考慮發表具體可檢證的描述。
          <br />
          Avoid unverifiable or potentially serious claims (e.g., food
          poisoning, ingredient sourcing). For health or safety concerns,
          contact relevant authorities or medical professionals first and post
          only verifiable descriptions.
        </p>

        <div className="my-3 px-2">
          <p className="font-bold">範例 Examples</p>
          <p className="flex">
            <IconCircleCheckFilled color="Green" className="mr-2 " />
            OK:用餐當日我於 22:00
            後出現胃痛，已就醫並以病歷證明可提供給相關單位查驗（若平台要求）。
          </p>
          <p className="flex">
            <IconXboxXFilled color="red" className="mr-2" />{" "}
            NG:這家店讓人中毒！千萬別吃！（沒有任何可驗證細節）
          </p>
        </div>
      </section>

      {/* SECTION: Defamation */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold">
            5. 誹謗、惡意攻擊與歧視 / Defamation, Malicious Attacks &
            Discrimination
          </h2>
        </div>

        <p className="my-4 px-2">
          嚴禁針對個人或團體的誹謗、辱罵、歧視或鼓動仇恨的言論。主觀批評應聚焦於經驗與事實，而非對人的人身攻擊。
          <br />
          Personal attacks, slander, discrimination or hate speech are strictly
          prohibited. Subjective criticism should focus on experience and facts,
          not personal attacks.
        </p>

        <div className="my-3 px-2">
          <p className="font-bold">範例 Examples</p>
          <p className="flex">
            <IconCircleCheckFilled color="Green" className="mr-2 " />
            OK:服務員拿錯單，經解釋後店家很快更正。—（描述行為，不攻擊個人）
          </p>
          <p className="flex">
            <IconXboxXFilled color="red" className="mr-2" />{" "}
            NG:那個店員是白痴，你們不要去！（人身攻擊與不尊重）
          </p>
        </div>
      </section>

      {/* SECTION: Commercial/Conflict */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold">
            6. 廣告、報酬與利益衝突 / Advertising, Compensation & Conflicts of
            Interest
          </h2>
        </div>

        <p className="my-4 px-2">
          禁止為金錢、免費餐飲、折扣或其他報酬而發布的評論。若您因工作或合作關係與該餐廳有利益關係，請勿發布評論或在投稿時清楚揭露關係。
          <br />
          Reviews posted in exchange for money, free meals, discounts, or other
          compensation are prohibited. If you have a business relationship with
          the restaurant, do not post or disclose the relationship clearly when
          posting.
        </p>

        <div className="my-3 px-2">
          <p className="font-bold">範例 Examples</p>
          <p className="flex">
            <IconCircleCheckFilled color="Green" className="mr-2 " />
            OK:受邀試吃(商業邀請)並在開頭標明:&quot;*受邀試吃，意見為個人觀點*&quot;
          </p>
          <p className="flex">
            <IconXboxXFilled color="red" className="mr-2" />{" "}
            NG:收了免費餐點後發表正面評論但未揭露（未揭露報酬）
          </p>
        </div>
      </section>

      {/* SECTION: Privacy & IP */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold">
            7. 隱私與智慧財產權 / Privacy & Intellectual Property
          </h2>
        </div>

        <p className="my-4 px-2">
          禁止在評論中公開他人私人資訊（如:身份證號、個人電話、未經同意的名字或地址）。上傳照片前請確認您擁有該照片的權利或已取得被拍攝者同意。
          <br />
          Do not disclose others&apos; private information in reviews (e.g., ID
          numbers, phone numbers, names or addresses without consent). Ensure
          you own the rights to photos or have consent from subjects before
          uploading.
        </p>

        <div className="my-3 px-2">
          <p className="font-bold">範例 Examples</p>
          <p className="flex">
            <IconCircleCheckFilled color="Green" className="mr-2 " />
            OK:上傳自己拍攝的餐點照片，或使用店家官方媒體並標示來源。
          </p>
          <p className="flex">
            <IconXboxXFilled color="red" className="mr-2" />{" "}
            NG:在照片中圈出一名顧客並寫上他的全名與職業（未經同意）
          </p>
        </div>
      </section>

      {/* SECTION: Moderation & Appeals */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold">
            8. 內容審核與申訴流程 / Moderation & Appeals
          </h2>
        </div>

        <p className="my-4 px-2">
          ChopsBook
          可能採用自動與人工審核程序以判定內容是否違規。被刪除或標記的評論用戶可透過「申訴」或「回報」機制要求複核，我們將在合理時間內處理。
          <br />
          ChopsBook may use automated and manual review processes. If your
          content is removed or flagged, you may appeal via the &quot;Report/Appeal&quot;
          feature and we will review within a reasonable time.
        </p>

        <div className="my-3 px-2">
          <p className="font-bold">流程 Highlights</p>
          <ol className="list-decimal pl-6">
            <li>用戶提交申訴 / User submits appeal.</li>
            <li>
              平台複核（自動或人工） / Platform conducts review
              (automated/manual).
            </li>
            <li>
              若判定誤刪，恢復或提供編輯建議 / If removed in error, content may
              be restored or edited suggestions provided.
            </li>
          </ol>
        </div>
      </section>

      {/* SECTION: Enforcement */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold">
            9. 執行措施與帳號處置 / Enforcement & Account Actions
          </h2>
        </div>

        <p className="my-4 px-2">
          依違規情節嚴重性，平台可採取以下一或多項處置:刪除內容、暫時限制發布、永久停權、封鎖
          IP、或向相關單位通報。
          <br />
          Depending on severity, actions may include content removal, temporary
          posting restrictions, permanent bans, IP blocking, or referral to
          authorities.
        </p>

        <div className="my-3 px-2">
          <p className="font-bold">執行原則 Principles</p>
          <ul className="list-disc pl-6">
            <li>透明:被處置的用戶將收到處理通知或理由摘要（視情況）。</li>
            <li>漸進:對初次不嚴重違規者，優先提供警告或教育性通知。</li>
            <li>
              嚴懲惡意行為:對造假、重複散播誤導資訊或商業受賄之行為，採嚴厲處置。
            </li>
          </ul>
        </div>
      </section>

      {/* SECTION: Etiquette */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold">
            10. 社群禮儀與書寫建議 / Community Etiquette & Writing Tips
          </h2>
        </div>

        <p className="my-4 px-2">寫評論的時候，試著做到:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            具體:說明菜名、口味、份量、價格感受與服務流程（例:點餐到上菜時間）。
          </li>
          <li>尊重:即使不滿也避免使用人身攻擊或歧視用語。</li>
          <li>簡潔:精簡重點，避免不必要的長篇抱怨。</li>
        </ul>

        <div className="my-3 px-2">
          <p className="font-bold">範例 Examples</p>
          <p className="flex">
            <IconCircleCheckFilled color="Green" className="mr-2 " />
            OK:2025/08/01 晚餐 — 炸雞飯
            12oz，外皮香脆，內裡多汁，價格合理，但蒜味稍重，不適合不吃蒜的人。
          </p>
          <p className="flex">
            <IconXboxXFilled color="red" className="mr-2" />{" "}
            NG:最爛的店！服務員都不會做事！（情緒宣洩而無實際描述）
          </p>
        </div>
      </section>

      {/* SECTION: Updates & Legal */}
      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold">
            11. 法律適用、文件更新與聯絡方式 / Legal, Updates & Contact
          </h2>
        </div>

        <p className="my-4 px-2">
          本準則受加拿大及安大略省相關法例影響（例如誹謗法、消費者保護法等）。平台保留依法律或實務需要不定期更新本文件的權利，並於頁首公布生效日期。
          <br />
          These guidelines are subject to Canadian and Ontario laws (e.g.,
          defamation and consumer protection laws). The Platform reserves the
          right to update these guidelines and will publish an effective date at
          the top.
        </p>

        <p className=" px-2">
          如有疑問或需申訴，請聯絡:
          <br />
          If you have any questions or wish to file an appeal, please contact:
        </p>
        <a
          href="mailto:info@chopsbook.com"
          className="px-2 underline font-bold"
        >
          info@chopsbook.com
        </a>
      </section>

      {/* FOOTER */}
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
