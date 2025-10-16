import React from "react";

/**
 * Chopsbook 網站頁尾組件
 * * 包含 Logo、導航連結、版權資訊，並使用 Tailwind CSS 確保響應式設計。
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ">
        {/* 主要內容區塊：Logo 和導航連結 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Logo 及版權資訊 */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2 flex flex-col items-start space-y-4">
            {/* 將 Link 替換為標準的 <a> 標籤以解決編譯錯誤 */}
            <a href="/" className="flex items-center space-x-2 group">
              {/* 替換為您的實際 Logo 路徑 */}
              {/*  */}
              <img
                src="/Chopsbook_logo_white_v2.png"
                alt="Chopsbook Logo"
                className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
                // Fallback for image loading error (Good practice)
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://placehold.co/120x32/374151/ffffff?text=Chopsbook";
                }}
              />
            </a>
            <p className="text-sm text-gray-400 mt-4 leading-relaxed">
              探索您的下一頓美食。 <br />
              Chopsbook - 由用戶共建的多倫多餐廳食評交流平台。
            </p>
          </div>
          {/* 導航連結群組 1: 網站地圖 (範例) */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-gray-700 pb-1">
              探索 Chopsbook
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/promotions"
                  className="text-base text-gray-400 hover:text-white transition duration-150"
                >
                  所有優惠
                </a>
              </li>
              <li>
                <a
                  href="/restaurants"
                  className="text-base text-gray-400 hover:text-white transition duration-150"
                >
                  所有餐廳
                </a>
              </li>
              <li>
                <a
                  href="/categories"
                  className="text-base text-gray-400 hover:text-white transition duration-150"
                >
                  所有類別
                </a>
              </li>
              <li>
                <a
                  href="/blogs"
                  className="text-base text-gray-400 hover:text-white transition duration-150"
                >
                  所有文章
                </a>
              </li>
              <li>
                <a
                  href="/new-arrivals"
                  className="text-base text-gray-400 hover:text-white transition duration-150"
                >
                  新開業餐廳
                </a>
              </li>
            </ul>
          </div>
          {/* 導航連結群組 2: 服務與政策 */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-gray-700 pb-1">
              服務與政策
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/help/terms"
                  className="text-base text-gray-400 hover:text-white transition duration-150"
                >
                  使用條款
                </a>
              </li>
              <li>
                <a
                  href="/help/privacy-policy"
                  className="text-base text-gray-400 hover:text-white transition duration-150"
                >
                  隱私權政策
                </a>
              </li>
              <li>
                <a
                  href="/help/review-policy"
                  className="text-base text-gray-400 hover:text-white transition duration-150"
                >
                  評論政策
                </a>
              </li>
            </ul>
          </div>

          {/* 導航連結群組 3: 幫助與支援 */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-gray-700 pb-1">
              幫助中心
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/help"
                  className="text-base text-gray-400 hover:text-white transition duration-150"
                >
                  常見問題 (FAQs)
                </a>
              </li>
              <li>
                <a
                  href="/help/contact"
                  className="text-base text-gray-400 hover:text-white transition duration-150"
                >
                  聯繫我們
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部版權聲明 */}
        <div className="mt-10 pt-8 border-t border-gray-800">
          <p className="text-center text-sm text-gray-500 font-light">
            &copy; {currentYear} ChopsBook. All rights reserved. 版權所有。
          </p>
        </div>
      </div>
    </footer>
  );
}
