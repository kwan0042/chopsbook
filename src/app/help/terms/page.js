// src/app/help/terms/page.js

import AccountLink from "@/components/help/AccountLink";
export const metadata = {
  title: "ChopsBook Terms of Service / 使用條款",
  metadataBase: new URL("https://chopsbook.com"),
  description: "ChopsBook 平台使用條款）",
  openGraph: {
    title: "ChopsBook Terms of Service",
    description: "ChopsBook 平台使用條款 / Terms of Service",
    url: "https://your-domain.com/help/terms",
  },
  twitter: {
    card: "summary",
    title: "ChopsBook Terms of Service",
    description: "ChopsBook 平台使用條款 / Terms of Service",
  },
};

export default function TermsPage() {
  return (
    <div className="prose prose-lg max-w-5xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold">
        ChopsBook 使用條款 / Terms of Service
      </h1>
      <p className="my-2">
        <strong>生效日期 / Effective Date：</strong>2025 年 10 月 20 日
      </p>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            1. 平台目的 / Purpose of ChopsBook
          </h2>
        </div>

        <p className="my-4 px-2">
          ChopsBook
          是一個供用戶發布關於餐廳體驗、優惠、評論、照片與評分的平台，其目的是讓其他用戶在選擇餐廳或優惠時能有所參考。
          <br />
          ChopsBook is a platform for users to publish restaurant experiences,
          promotions, reviews, photos, and ratings, with the purpose of
          providing reference for other users when selecting restaurants or
          deals.
        </p>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            2. 會員註冊程序 / Membership Registration
          </h2>
        </div>

        <p className="my-2 px-2">
          你可以根據本平台規定流程註冊成為 ChopsBook 會員（以下稱「會員」）。
          <br />
          You may register as a ChopsBook member in accordance with the
          procedures set by the Platform.
        </p>
        <p className="my-4 px-2">
          如果你尚未完成註冊程序或不是會員，平台可能限制你可使用的功能或服務。
          <br />
          If you have not completed the registration process or are not a
          member, the Platform may restrict the features or services you can
          access.
        </p>
        <p className="my-4 px-2">
          平台保留於任何時間修改非會員與會員之功能差異、服務內容或權限之權利。
          <br />
          The Platform reserves the right to modify, at any time, the difference
          in features, services or permissions between non-members and members.
        </p>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            3. 安全 / Security Measures
          </h2>
        </div>

        <p className="my-4 px-2">
          為使註冊資料傳輸安全，本平台可能採用 SSL
          或類似加密技術來保護傳輸資料。
          <br />
          To secure the transmission of registration data, the Platform may
          employ SSL or similar encryption technologies.
        </p>
        <p className="my-4 px-2">
          我們亦可能使用防毒軟體、系統監控、異常偵測等機制，以維護平台的安全性。
          <br />
          We may also use antivirus software, system monitoring, anomaly
          detection, and similar mechanisms to preserve security of the
          Platform.
        </p>
        <p className="my-4 px-2">
          然而，即使採取合理安全措施，也無法保證完全無風險；對於帳戶被盜、資料外洩、第三方入侵等風險，使用者仍需提高警覺。
          <br />
          However, even with reasonable security measures, no system is entirely
          risk-free; users should remain vigilant to risks such as account
          theft, data leakage, or third-party intrusion.
        </p>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            4. 登入帳戶管理 / Account & Login Management
          </h2>
        </div>

        <p className="my-4 px-2">
          使用者需自行管理其登入帳戶與密碼（以下合稱「帳戶」），不得向他人洩漏或共用。
          <br />
          Users must manage their login account and password themselves
          (collectively, the “Account”) and must not disclose or share them with
          others.
        </p>
        <p className="my-4 px-2">
          所有透過該帳戶所進行的行為，均視為由該帳戶持有人本人所為。
          <br />
          All actions performed through that Account shall be considered as done
          by the account holder personally.
        </p>
        <p className="my-4 px-2">
          若帳戶遭盜用、不當使用或有可疑異常，使用者應立即通知平台。
          <br />
          If the account is compromised, misused, or shows suspicious activity,
          users should notify the Platform immediately.
        </p>
        <p className="my-4 px-2">
          平台對於因為使用者管理不善、密碼洩漏、第三方使用等所產生的損害，除非本平台故意或重大過失，概不負責。
          <br />
          The Platform shall not be liable for damages caused by user
          mismanagement, password leakage, or third-party use, unless caused by
          the Platform’s intentional misconduct or gross negligence.
        </p>
        <p className="my-4 px-2">
          若法院或仲裁機構認定因平台過失（非重大過失）造成損害，平台僅對通常可預見損害負責，不包括利潤損失或特殊情況下的損害。
          <br />
          If a court or arbitrator finds that damages were caused by the
          Platform’s non-gross negligence, liability shall be limited to
          ordinary, foreseeable damages, excluding lost profits or damages from
          extraordinary circumstances.
        </p>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            5. 個人資料 / Privacy & Personal Information
          </h2>
        </div>

        <p className="my-4 px-2">
          本平台之個人資料處理方式以本平台之隱私政策（Privacy Policy）為準。
          <br />
          The handling of personal information by the Platform is governed by
          its Privacy Policy.
        </p>
        <p className="my-4 px-2">
          我們可能從使用者收集資料用於以下用途（但不限於）：
          <br />
          We may collect user information for the following purposes (among
          others):
        </p>
        <ul className="list-disc pl-6 space-y-2 font-bold">
          <li>
            驗證身份
            <br />
            Identity verification & login
          </li>
          <li>
            與使用者溝通 <br />
            Communication & support
          </li>
          <li>
            推播通知 <br /> Notifications & promotions
          </li>
          <li>
            分析平台行為
            <br /> Analytics & service improvement
          </li>
          <li>
            組織統計資料
            <br /> Aggregated anonymized data
          </li>
        </ul>
        <p className="my-4 px-2">
          我們可能將資料委託第三方處理（如寄信、訊息發送、系統維運），但會要求保護措施。
          <br />
          We may subcontract third parties (e.g. mailing, messaging, system
          maintenance) to process data, subject to requiring adequate protective
          measures.
        </p>
        <p className="my-4 px-2">
          除非取得使用者同意或法律規定，本平台不會將個人資料提供予第三方。
          <br />
          Except with user consent or as required by law, the Platform will not
          provide personal data to third parties.
        </p>
        <p className="my-4 px-2">
          使用者有權依隱私政策規定，請求查詢、更正、刪除、停止使用或移除其個人資料。
          <br />
          Users have the right, under the Privacy Policy, to request access,
          correction, deletion, suspension, or removal of their personal data.
        </p>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            6. 使用規定 / Use of ChopsBook
          </h2>
        </div>

        <p className="my-4 px-2">
          <strong>禁止商業 / Promotional Use：</strong>
          <br />
          你不得將本平台或平台上的內容用於商業、販售、推銷或營利活動（除非取得平台書面授權）。
          <br />
          You may not use the Platform or its content for commercial, resale,
          marketing, or profit-oriented activities (unless expressly authorized
          in writing).
        </p>
        <p className="my-4 px-2">
          <strong>禁止未經授權複製 / Reproduction Restrictions：</strong>
          <br />
          未經授權，不得複製、轉載、改作、發布、轉發或散布平台或用戶內容。
          <br />
          Without authorization, you shall not reproduce, repost, adapt,
          publish, retransmit, or distribute Platform or user content.
        </p>
        <p className="my-4 px-2">
          <strong>盈利使用評論 / Monetization of Reviews：</strong>
          <br />
          若你因使用本平台上的評論而獲利，本平台保留請求你支付相當於該收益之金額的權利（法律另有許可者不在此限）。
          <br />
          If you profit from the use of reviews from this Platform, we reserve
          the right to demand payment equivalent to such profit (unless
          otherwise permitted by law).
        </p>
        <p className="my-4 px-2">
          <strong>變更 / 停用 / 終止服務 / Service Changes：</strong>
          <br />
          我們保留隨時修改、停用、暫停或終止平台或部分功能的權利。
          <br />
          We reserve the right to modify, disable, suspend, or terminate the
          Platform or parts of its services at any time.
        </p>
        <p className="my-4 px-2">
          若因我們變動、停止或終止服務而對你造成損害，我們僅在本條款允許範圍內承擔責任（除因故意或重大過失者外）。
          <br />
          If modifications, suspension, or termination cause you damage, we
          shall only be liable within the limits permitted by these Terms,
          except when caused by our willful misconduct or gross negligence.
        </p>
        <p className="my-4 px-2">
          <strong>設備 / 網絡責任 / Device & Network Responsibility：</strong>
          <br />
          使用者需自備網路連線、裝置、瀏覽器與軟體，並承擔相關費用與風險。
          <br />
          Users must provide their own internet connectivity, devices, browsers,
          and software, and bear associated costs and risks.
        </p>
        <p className="my-4 px-2">
          若使用者設備/網絡不兼容、版本過舊、不支援平台功能或信號不穩，本平台不對此負責。
          <br />
          If the user’s device / network is incompatible, outdated, unsupported,
          or has unstable signal, the Platform is not responsible for any
          issues.
        </p>
        <p className="my-4 px-2">
          <strong>版本 / 準則更新 / Policy Updates：</strong>
          <br />
          平台可能不定期更新使用準則、評論政策、功能規範等，這些更新視為本條款之一部分。
          <br />
          The Platform may periodically update user guidelines, review policy,
          feature specifications, etc., which shall be considered part of these
          Terms.
        </p>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            7. 著作權 / Copyright, License & Content Use
          </h2>
        </div>

        <p className="my-4 px-2">
          本平台與用戶內容之著作權、商標、標識、設計、程式碼等智慧財產權，除另有授權者，皆屬平台或原權利人所有。
          <br />
          All intellectual property rights (copyrights, trademarks, logos,
          designs, code, etc.) in the Platform and user content belong to the
          Platform or original rights holders unless otherwise licensed.
        </p>
        <p className="my-4 px-2">
          當你上傳評論、照片、評分或其他內容時，你授予平台一個全球性、非排他、免版稅、可再授權與可轉授權的授權，以用於使用、展示、改編、散佈、存儲、宣傳等用途。
          <br />
          By submitting reviews, photos, ratings, or other content, you grant
          the Platform a global, non-exclusive, royalty-free, sublicensable and
          transferable license to use, display, adapt, distribute, store,
          promote, and otherwise exploit the content.
        </p>
        <p className="my-4 px-2">
          我們或獲授權之第三方可在全球範圍以摘錄、摘要、圖片裁切、格式變換等方式使用你的內容，無需另行支付酬勞。
          <br />
          We or authorized third parties may use your content globally via
          excerpts, summaries, image cropping, format conversion, etc., without
          additional compensation.
        </p>
        <p className="my-4 px-2">
          發表內容時，你保證你擁有所需授權與權利；若引用第三方作品，你必須確保合法使用權。
          <br />
          When publishing content, you warrant that you have necessary
          permissions and rights; if referencing third-party works, you must
          ensure lawful usage rights.
        </p>
        <p className="my-4 px-2">
          若因你侵權行為造成損害，本平台得向你請求賠償，包含追回因此獲利之金額。
          <br />
          If infringement by you causes damage, the Platform may seek
          compensation, including recovering amounts you gained thereby.
        </p>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            8. 免責聲明 / Disclaimers
          </h2>
        </div>

        <p className="my-4 px-2">
          <strong>
            平台與內容按「現狀 / as-is」與「可用 /
            as-available」提供，不作任何明示或默示保證。
          </strong>
          <br />
          The Platform and all content are provided “as-is” and “as-available,”
          without any express or implied warranties.
        </p>
        <p className="my-4 px-2">
          <strong>餐廳資訊不保證 / No Guarantee on Restaurant Info：</strong>
          <br />
          我們不保證餐廳資訊（地址、營業時間、菜單、價格、可用性等）之準確性。建議你於前往前自行確認。
          <br />
          We do not guarantee the accuracy of restaurant information (address,
          hours, menu, pricing, availability, etc.). We recommend you confirm
          with the restaurant before your visit.
        </p>
        <p className="my-4 px-2">
          若因平台資訊使用所致損害，除因本平台故意或重大過失外，我們僅對合理可預見之損害負責，不包括利潤損失或特殊損害。
          <br />
          If relying on Platform information causes damage, except for damages
          from willful misconduct or gross negligence, we shall only be liable
          for reasonable, foreseeable damages, excluding lost profits or special
          damages.
        </p>
        <p className="my-4 px-2">
          <strong>評論內容不保證 / No Guarantee on Reviews：</strong>
          <br />
          本公司對所發表評論內容不提供任何保證，請自行判斷使用。
          <br />
          The Company provides no warranties regarding the content of published
          reviews. Use at your own discretion.
        </p>
        <p className="my-4 px-2">
          若因評論內容引起任何損害（包括由內容造成的電腦病毒感染、使用者間爭議等），除重大過失或故意外，本公司不負責；若需負責，僅限合理可預見損害，不含利潤損失或特殊損害。
          <br />
          If damages arise from reviews (including virus infections from user
          content, disputes between users, etc.), except in cases of gross
          negligence or willful misconduct, the Company shall not be liable. If
          liability is imposed, it shall be limited to reasonably foreseeable
          damages, excluding lost profits or special damages.
        </p>
        <p className="my-4 px-2">
          <strong>連結網站不保證 / No Guarantee for Linked Sites：</strong>
          <br />
          對於平台中所連結之第三方網站／服務，本公司不提供任何保證。使用該等連結內容需自行承擔風險。
          <br />
          For third-party websites/services linked from the Platform, the
          Company makes no warranties. Use of those linked contents is at your
          own risk.
        </p>
        <p className="my-4 px-2">
          若因連結內容引起損害，除重大過失或故意外，本公司責任限於合理可預見之損害。
          <br />
          If damages result from linked site content, except in cases of gross
          negligence or willful misconduct, the Company’s liability is limited
          to reasonable, foreseeable damages.
        </p>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            9. 刪除評論 / Removal of Reviews
          </h2>
        </div>

        <p className="my-4 px-2">
          ChopsBook 為用戶自行發布評論的平台，使用者自行承擔發佈之責任。
          <br />
          ChopsBook is a platform where users post reviews at their own risk and
          responsibility.
        </p>
        <p className="my-4 px-2">
          為維持平台品質，如發現評論內容屬於或類似下列情況，本平台有權不通知即刪除：
          <br />
          To maintain platform quality, if reviews are found to fall into or
          resemble the following categories, the Platform reserves the right to
          delete them without prior notice:
        </p>
        <ul className="list-disc list-inside pl-6 space-y-2 font-bold ">
          <li>
            違反平台準則 <br /> Violating platform guidelines
          </li>
          <li>
            違反公共秩序或道德 <br /> Violating public order or morality
          </li>
          <li>
            與被評餐廳無關（不含日記） <br /> Content unrelated to the reviewed
            restaurant (excluding diary entries)
          </li>
          <li>
            含有有害程式或腳本 <br /> Containing harmful software or scripts
          </li>
          <li>
            以營利、廣告、轉售或商業用途 <br /> For profit, advertising, resale
            or business use
          </li>
          <li>
            其他平台認為不適當的內容 <br /> Other content deemed inappropriate
          </li>
        </ul>
        <p className="my-4 px-2">
          平台保留是否刪除該評論之最終決定權。
          <br />
          The Platform retains final authority to determine whether to remove a
          review.
        </p>
        <p className="my-4 px-2">
          對於依某些功能（如外部服務連結）所發布於第三方網站之評論，因顯示於第三方平台，平台無義務刪除。
          <br />
          For reviews posted on third-party sites via certain features (e.g.
          external service links), the Platform has no obligation to remove
          them.
        </p>
        <p className="my-4 px-2">
          若使用者申請刪除，平台得依情形要求提供證明與進行審查後再決定是否刪除。
          <br />
          If a user requests deletion, the Platform may request evidence and
          conduct review before deciding whether to remove.
        </p>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            10. 禁止行為 / Prohibited Acts
          </h2>
        </div>

        <p className="my-4 px-2">
          使用者不得從事以下行為（包括但不限於）：
          <br />
          Users must not engage in the following acts (including but not limited
          to):
        </p>
        <ul className="list-disc pl-6 space-y-2 font-bold ">
          <li>
            未經授權複製、重發、散布平台內容 <br /> Unauthorized reproduction,
            reposting or distribution of Platform content
          </li>
          <li>
            違反本條款或準則 <br />
            Violating these Terms or guidelines
          </li>
          <li>
            違反公共秩序或道德 <br /> Violating public order or morality
          </li>
          <li>
            鼓勵或協助非法或危險行為 <br /> Encouraging or assisting illegal or
            dangerous acts
          </li>
          <li>
            侵害他人智慧財產權 <br /> Infringing others’ intellectual property
            rights
          </li>
          <li>
            干擾平台運作或損害平台聲譽 <br /> Interfering with platform
            operations or harming reputation
          </li>
          <li>
            偽造註冊資料 <br />
            Falsifying registration information
          </li>
          <li>
            多重帳號濫用 <br /> Multiple account abuse
          </li>
          <li>
            未經授權使用他人帳號 <br /> Unauthorized use of others’ accounts
          </li>
          <li>
            使用平台功能進行交友、約會或非預期用途 <br /> Using platform
            functions for dating or unintended purposes
          </li>
          <li>
            輸入誹謗、歧視、虛假、不當文字 <br /> Inputting defamatory,
            discriminatory, false, or inappropriate content
          </li>
          <li>
            其他平台認為不當行為 <br /> Other actions deemed inappropriate by
            the Platform
          </li>
        </ul>
        <p className="my-4 px-2">
          若使用者違反上述條款，平台可採取處分（暫停、封鎖、刪除內容、索賠等），無需事前說明理由，除故意或重大過失外不負責任。
          <br />
          If a user violates these Terms, the Platform may take disciplinary
          actions (suspend, block, delete content, claim compensation, etc.),
          without prior explanation, and is not liable except in cases of
          willful misconduct or gross negligence.
        </p>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            11. 退出會員 / Account Withdrawal
          </h2>
        </div>

        <p className="my-4 px-2">
          使用者如欲退出會員身份，應依平台規定程序提出申請。
          <br />
          If a user wishes to withdraw membership, they must follow the
          Platform’s prescribed procedure.
        </p>
        <p className="my-4 px-2">
          會員退出後，其帳號之權益與功能將終止。
          <br />
          After withdrawal, the account’s privileges and functions will
          terminate.
        </p>
        <p className="my-4 px-2">
          即便退出會員，已發布之評論與內容不一定自動刪除 (視平台審核規則)。
          <br />
          Even after withdrawal, published reviews and content may not be
          automatically removed (depending on Platform’s removal rules).
        </p>
        <p className="my-4 px-2">
          會員退出後，某些條款（著作權、禁止行為、責任限制、爭議解決等）仍繼續有效。
          <br />
          After withdrawal, certain provisions (such as copyright, prohibited
          acts, liability limitation, dispute resolution) remain in effect.
        </p>

        {/* 刪除帳號流程：使用 Client Component 來渲染動態連結 */}
        <div className="bg-red-100 p-4 my-4 rounded">
          <h3 id="delete-account" className="font-semibold mb-2">
            刪除帳號流程 / Account Deletion Process
          </h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              {/* 嵌入 Client Component */}
              <AccountLink />
            </li>
            <li>捲動至「危險區域（Danger Zone）」</li>
            <li>點選「刪除帳戶」並依照指示完成操作</li>
            <li>
              如有問題，可聯絡客服：
              <a
                href="mailto:support@chopsbook.com"
                className="text-blue-600 underline"
              >
                support@chopsbook.com
              </a>
            </li>
          </ol>
          <p className="mt-2 text-sm text-gray-700">
            ※ 刪除帳號後，個人資料將會依平台規定流程處理。
          </p>
        </div>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            12. 條款變更 / Modification of Terms
          </h2>
        </div>

        <p className="my-4 px-2">
          本平台得修改本條款並指定生效日期。
          <br />
          The Platform may modify these Terms and designate an effective date.
        </p>
        <p className="my-4 px-2">
          平台應於變更前至少提前一個月公告或通知使用者；若變更影響較小者，可縮短公告期。
          <br />
          The Platform shall post or notify users at least one month in advance;
          if the impact is minor, the notice period may be shortened.
        </p>
        <p className="my-4 px-2">
          變更後若你持續使用平台，即視為你接受新版條款。
          <br />
          If you continue to use the Platform after changes, you are deemed to
          accept the revised Terms.
        </p>
        <p className="my-4 px-2">
          本條款及其附屬規範（如使用準則、評論政策等）若有更新，該更新視同條款一部分。
          <br />
          These Terms, including attached guidelines (usage rules, review
          policy, etc.), shall be considered part of the Terms and subject to
          updates.
        </p>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            13. 適用法律與爭議解決 / Governing Law & Dispute Resolution
          </h2>
        </div>

        <p className="my-4 px-2">
          本條款之解釋、效力與爭議，應適用安大略省法律與加拿大聯邦法。
          <br />
          These Terms shall be governed by the laws of the Province of Ontario
          and applicable Canadian federal laws.
        </p>
        <p className="my-4 px-2">
          爭議應透過仲裁或法院解決。仲裁依《安大略省 1991
          年仲裁法》進行，地點為多倫多（除雙方另有協議）。
          <br />
          Disputes shall be resolved via arbitration or in court. Arbitration
          shall follow the Ontario Arbitration Act, 1991, with venue in Toronto
          (unless otherwise agreed).
        </p>
        <p className="my-4 px-2">
          但根據安大略省《消費者保護法，2002
          年》，若強制仲裁或禁止集體訴訟之條款限制消費者赴法院之權利，可能被視為無效或不可執行。
          <br />
          However, under the Ontario Consumer Protection Act, 2002, mandatory
          arbitration clauses or className action waivers that restrict a
          consumer’s right to go to court may be invalid or unenforceable.
        </p>
        <p className="my-4 px-2">
          加拿大最高法院（Telus v.
          Wellman）判例指出，商業客戶須遵守仲裁協議，而消費者可能因消費者保護法而被豁免。
          <br />
          The Supreme Court of Canada in Telus v. Wellman held that business
          customers must abide by arbitration agreements, while consumers may be
          exempt under consumer protection law.
        </p>
        <p className="my-4 px-2">
          若法院判定仲裁條款無效或不可執行，雙方同意以多倫多法院作為第一審專屬管轄法院。
          <br />
          If a court finds the arbitration clause invalid or unenforceable,
          parties agree that courts in Toronto shall have exclusive jurisdiction
          for first instance.
        </p>
        <p className="my-4 px-2">
          在仲裁或訴訟前，可先協商或使用調解程序。
          <br />
          Before arbitration or litigation, parties may attempt negotiation or
          mediation.
        </p>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            14. 通知 / Notices
          </h2>
        </div>

        <p className="my-4 px-2">
          平台可透過電子郵件、網站公告、App 推播等方式向你送達通知。
          <br />
          The Platform may send notices via email, site announcements, app push,
          or other means.
        </p>
        <p className="my-4 px-2">
          若你需向平台送達通知，請使用以下聯絡方式：
          <br />
          If you must send notice to the Platform, use the contact details
          below:
        </p>
        <p className="my-4 px-2">
          電子郵件 / Email：{" "}
          <a href="mailto:chopsbook@gmail.com">chopsbook@gmail.com</a>
        </p>
      </section>

      <section className="py-2">
        <div className="bg-amber-200 mb-2 py-2 px-2">
          <h2 className="text-base font-bold bg-white-500">
            15. 可分割性與完整協議 / Severability & Entire Agreement
          </h2>
        </div>

        <p className="my-4 px-2">
          若本條款任何條文被法院或仲裁機構認定無效或不可執行，其餘條款仍保有法律效力。
          <br />
          If any provision is held invalid or unenforceable, the remaining
          provisions shall remain in full force and effect.
        </p>
        <p className="my-4 px-2">
          本條款（含隱私政策、使用準則、評論政策等）構成你與平台之完整協議，並取代任何先前協議。
          <br />
          These Terms (including Privacy Policy, guidelines, review policy,
          etc.) constitute the entire agreement between you and the Platform,
          superseding prior agreements.
        </p>
        <p className="my-4 px-2">
          除非平台書面同意，使用者不得放棄本條款中任何權利或條款。
          <br />
          Unless in writing and signed by the Platform, users may not waive any
          rights or provisions under these Terms.
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
