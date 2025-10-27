"use client";
// src/components/home/PromotionsSection.js
import React, { useState, useCallback } from "react";
import Image from "next/image";

const ImageFullScreenModal = ({ isVisible, onClose, imageUrl }) => {
  if (!isVisible || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
      onClick={onClose} // 點擊背景關閉
    >
      {/* 圖片容器：限制最大尺寸，讓圖片不會撐破螢幕 */}
      <div
        className="relative w-full h-full max-w-[90vw] max-h-[90vh] p-2"
        onClick={(e) => e.stopPropagation()} // 阻止點擊 Modal 內容時關閉
      >
        <Image
          src={imageUrl}
          alt="推廣活動原圖"
          fill
          priority
          // 💡 關鍵設置：w-full h-full 但要限制大小
          // object-contain 確保圖片完整顯示在容器內，不會被裁切
          style={{ objectFit: "contain" }}
          sizes="90vw" // 告訴 Next.js 圖片在 Modal 中最大佔 90vw
          className="rounded-lg shadow-xl"
        />
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 m-4 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition focus:outline-none"
          aria-label="關閉圖片"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
};
// ----------------------------------------------------
// 1. 新增 PromotionModal 組件 (基於您提供的 BlogPage 結構簡化)
// 為了簡化，這裡使用一個模擬的 content 渲染，實際應用中您可能需要從 API 獲取詳細內容
const PromotionModal = ({ isVisible, onClose, promotion, openImageModal }) => {
  if (!isVisible || !promotion) return null;

  // Utility function to format timestamp
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "無";
    const date = new Date(timestamp.replace("", ""));
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose} // 點擊背景關閉
    >
      <div
        // 💡 修正 1: 移除外層的 overflow-y-auto，並將 h-auto 改為 h-full (md: 視窗下)
        // 在網頁版 (md:flex-row) 中，Flex 容器需要高度拉伸才能讓子元素同步高度。
        // 手機版 (flex-col) 依然依靠 max-h-[90vh] 和自身的 overflow-y-auto 滾動。
        className="relative w-full max-w-lg md:max-w-[90vw] h-auto max-h-[90vh] mx-4 bg-white rounded-lg shadow-2xl flex flex-col md:flex-row overflow-y-auto" // ✅ 修改：移除 overflow-y-auto
        onClick={(e) => e.stopPropagation()} // 阻止點擊 Modal 內容時關閉
      >
        {/* 封面圖片 - 網頁版在左 */}
        <div
          // 💡 修正 2: 圖片容器 (Flex Item 1) 在網頁版中需要 h-full 來被 Flexbox 拉伸，並確保圖片在容器內置中
          className="relative w-full md:w-1/2 flex-shrink-0 cursor-pointer p-4 pb-0 md:p-6 md:h-full flex md:items-center md:justify-center" // ✅ 修改：添加 md:h-full flex md:items-center md:justify-center
          onClick={() => openImageModal(promotion.coverUrl)}
          role="button"
          tabIndex="0"
          aria-label="點擊查看推廣原圖"
        >
          <Image
            src={promotion.coverUrl}
            alt={promotion.title}
            width={800} // ✅ 寫死寬度或用父層控制 w-full
            height={1000} // ✅ 設 height={0} + sizes 可令 Next.js 自動根據比例
            sizes="(max-width: 768px) 100vw, 50vw" // ✅ 根據 viewport 自動縮放
            // 💡 修正 3: 圖片元件在網頁版中需要 h-full 來佔滿拉伸後的容器高度
            className="w-full h-auto rounded-lg object-contain md:h-full" // ✅ 修改：添加 md:h-full
            priority
          />
        </div>

        {/* 內容區域 - 滾動只保留給網頁版 (md:) 處理，因為手機版已經在父層滾動 */}
        <div className="p-4 md:p-6 md:w-1/2 flex-grow flex flex-col md:h-full md:overflow-y-auto">
          {" "}
          {/* 💡 修正 4: 內容容器 (Flex Item 2) 需要 flex flex-col 和 md:h-full 佈局，並允許自身滾動 */}
          {/* 標題 */}
          <h1 className="flex-shrink-0 text-xl md:text-3xl font-extrabold text-gray-900 my-4 md:mt-0">
            {promotion.title}
          </h1>
          {/* 副標題 / 信息 */}
          <div className="flex-shrink-0 text-sm text-gray-500 mb-6 border-b pb-4">
            <p className="font-semibold text-gray-700 mb-2">
              {promotion.subtitle}
            </p>

            <p className="font-semibold text-gray-700 mb-2">
              優惠期由 {promotion.promoStart} 開始至{" "}
              {promotion?.promoEnd || "~"}
            </p>
            <p>發佈時間: {promotion.updatedAt}</p>
          </div>
          {/* 文章內容 */}
          <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4 flex-grow overflow-y-auto">
            {/* 💡 修正: 文章內容需要 flex-grow 和 overflow-y-auto 讓它佔滿剩餘空間並滾動 */}
            <p
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: promotion.content }}
            ></p>
          </div>
        </div>

        {/* 關閉按鈕 - 確保它在最上層 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 text-gray-700 bg-white rounded-full shadow-md hover:bg-gray-100 transition"
          aria-label="關閉"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// PromotionsSection 主組件

const PromotionsSection = () => {
  // 設置網頁版每頁顯示的項目數
  const ITEMS_PER_PAGE = 3;

  // ----------------------------------------------------
  // 狀態管理：
  const [currentPage, setCurrentPage] = useState(0); // web 端 (>=md) 分頁
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal 開關
  const [selectedPromo, setSelectedPromo] = useState(null); // 當前選中的 Promotion 數據

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageToView, setImageToView] = useState(null);
  // ----------------------------------------------------

  const promotions = [
    {
      promoId: 4,
      title: "Midori 每日限定優惠 ",
      subtitle: "Midori Ramen人氣日式拉麵",
      coverUrl: "/img/promotion/Midori_Ramen_promo_1a.webp",
      promoStart: "2025年10月25日",
      promoEnd: "",
      content:
        "<h1>【Midori Ramen人氣日式拉麵｜每日限定優惠】</h1><h4><strong>優惠期由 2025年10月25日 開始 ~</strong></h4><p>Midori Ramen 多倫多人氣爆燈嘅招牌雞白湯（Tori Paitan）濃得嚟又唔膩，麵條彈牙，叉燒厚切又嫩滑～ <br />店內乾淨企理，唔怪得成日大排長龍！<br /><br />而家<strong>(由2025年10月25日開始)</strong> 每日仲有限定優惠，無論你係拉麵控定丼飯迷，都一定搵到心水！<br /><br /><strong>每日優惠一覽｜Midori Ramen Daily Specials</strong><br />(部分款式如 Gyudon Ramen 及 Tori Buta Ramen 不參與優惠，詳情請向店員查詢)</p><p>&nbsp;</p><hr /><p><br />1️⃣&nbsp;<strong>星期一 MONDAY</strong>｜拉麵控必搶！<br />✨ 原味雞白湯拉麵 半價 50% OFF！<br />👉 最人氣、最多好評嘅「Original Tori Paitan」，香滑濃郁嘅雞湯底配厚切叉燒～CP值爆燈！<br /><br />2️⃣ <strong>星期二 TUESDAY</strong>｜丼飯迷最愛！<br />✨ 買一送一 &mdash; Buy 1 Donburi, Get 1 Free！<br />👉 熱門之選包括牛丼、唐揚雞丼、叉燒丼等～同朋友一齊share最抵！🥟 <br /><br />3️⃣&nbsp;<strong>星期三 WEDNESDAY</strong>｜中場放送，小食加碼！<br />✨ 點任何主餐，即送 餃子 Gyoza 或 章魚燒 Takoyaki 乙份<br />👉 打卡熱爆！每日限量供應～&nbsp;<br /><br />4️⃣&nbsp;<strong>星期四 THURSDAY</strong>｜肉食獸專屬日！<br />✨ 拉麵 免費雙倍肉量 Double Protein Free！<br />👉 叉燒控注意～滿滿肉量唔加價！<br /><br />5️⃣&nbsp;<strong>星期五 FRIDAY</strong>｜完美收尾週五賞！<br />✨ 點兩份主餐，即送 迷你丼飯 Mini Don 乙份！<br />👉 最啱情侶或朋友檔～滿足又抵食！<br /><br /></p><hr /><h3><br /><strong>優惠進行中</strong>｜Midori Ramen 全線分店同步推出！<strong><br />( Edmonton 分店除外)<br /><br /></strong>資料來源:https://midoriramen.com/, https://www.instagram.com/p/DP4jW2VDcvq</h3>",
      status: "published",
      updatedAt: "2025年10月20日",
      submittedAt: "2025年10月20日",
      submittedBy: "Annie",
      reviewedBy: "Annie",
      reviewedAt: "2025年10月20日",
    },
    {
      promoId: 3,
      title: "限定優惠|4小時任食放題",
      subtitle: "劉一手火鍋",
      coverUrl: "/img/promotion/Liuyishou_promo_1.webp",
      promoStart: "2025年10月25日",
      promoEnd: "",
      content:
        "<h1>【劉一手火鍋限定優惠 | 4小時任食放題!】</h1><h4><strong>優惠期由 即日起 開始 ~</strong></h4><h2><strong>劉一手火鍋 Liuyishou Hot Pot Toronto (Downtown 分店)</strong></h2><h4>地址:254 Spadina Ave, Toronto, ON M5T 2C2</h4><p>唔洗趕住食!劉一手推出全新 「4小時任食火鍋放題」~<br />慢慢歎、慢慢打，一次過滿足你嘅火鍋靈魂</p><p>&nbsp;</p><hr /><br /><p>每位只需 <strong>$38.95</strong></p><ul><li>包 $10 湯底</li><li>汽水任飲 All You Can Drink!</li></ul><p>真係一價全包，食到飽又唔使急!</p><p>&nbsp;</p><hr /><p>&nbsp;</p><p><strong>平日午市時段 | Weekday Lunch Hours</strong><br /><strong>11:30 AM &ndash; 4:59 PM</strong><br /><strong>提示:3:00 PM 前入座嘅客人可享用至 5:00 PM!</strong></p><p>電話:(416) 777-1682</p><br /><p>Liuyishou Hot Pot 保留最終解釋權，如有疑問請向餐廳查詢。</p><br /><p>無論你係鍋底控、牛肉控定丸類愛好者~ 4小時放題時間夠晒彈性，慢慢歎慢慢傾</p><p><br />資料來源:https://www.facebook.com/photo?fbid=1580794612891941&amp;set=a.736144957356915</p>",
      status: "published",
      updatedAt: "2025年10月20日",
      submittedAt: "2025年10月20日",
      submittedBy: "Annie",
      reviewedBy: "Annie",
      reviewedAt: "2025年10月20日",
    },
    {
      promoId: 1,
      title: "秋日海鮮盛宴限定回歸",
      subtitle: "Dragon Pearl Buffet",
      coverUrl: "/img/promotion/Dragon_Pearl.webp",
      promoStart: "2025年10月25日",
      promoEnd: "2025年11月23日",
      content:
        "<h1>【Dragon Pearl Buffet|秋日海鮮盛宴限定回歸】</h1><h4><strong>秋天又嚟啦~ 想食返啲暖笠笠又豪氣嘅?</strong></h4><h2><strong>Dragon Pearl Buffet 龍珠自助餐</strong></h2><h4>地址: 建議填寫地址（例如：2033 Kennedy Rd, Scarborough, ON M1T 3G5）</h4><p>由 10月14日至11月23日，龍珠又帶住「秋日海鮮盛宴」回歸，全部海鮮控都會尖叫嘅 lineup!</p><p>&nbsp;</p><hr /><p><strong>週末晚餐限定 | Weekend Specials</strong></p><ul><li>星期五 &amp; 星期日：烤生蠔任食~蒜香四溢、鮮味爆棚</li><li>星期六：每位送半隻龍蝦尾!肉質嫩滑到不得了</li></ul><p>&nbsp;</p><hr /><p><strong>平日晚餐限定 (星期一至四 | 公眾假期除外)</strong></p><p>蒜蓉粉絲扇貝任食~啖啖蒜香超邪惡</p><p>&nbsp;</p><p>無論係想 family dinner、同朋友聚會，定係自己想食好啲~</p><p>呢個秋天，一於去龍珠 buffet 食個夠啦！</p>",
      status: "published",
      updatedAt: "2025年10月20日",
      submittedAt: "2025年10月20日",
      submittedBy: "Annie",
      reviewedBy: "Annie",
      reviewedAt: "2025年10月20日",
    },
    {
      promoId: 2,
      title: "秋日限定優惠|KIBO Sushi 免費送餐上門!】",
      subtitle: "KIBO Sushi",
      coverUrl: "/img/promotion/Kibo_promo_1.webp",
      promoStart: "2025年10月14日",
      promoEnd: "2025年10月30日",
      content:
        "<h1>【秋日限定優惠|KIBO Sushi 免費送餐上門!】</h1><h4><strong>呢個秋天~讓 KIBO Sushi 為你送上滿滿嘅幸福滋味</strong></h4><h2><strong>KIBO Sushi 官網限定優惠</strong></h2><h4>網址: kibosushi.com</h4><p>喺屋企都食到最鮮美嘅壽司~一齊嘆住日式暖意。</p><p>&nbsp;</p><hr /><p>限時優惠:</p><p><strong>凡於官網下單滿 $50，即享免費送餐!</strong></p><ul><li>優惠只限 kibosushi.com 官網訂單</li><li>單筆訂單需滿 $50 (稅前)</li></ul><p>叫埋朋友一齊 order 外賣~開心 share 一餐好味又方便。</p><p>&nbsp;</p><hr /><p>&nbsp;</p><p><strong>優惠期:</strong><br /><strong>即日起至 10 月 30 日止</strong></p><p>KIBO Sushi 保留最終解釋權，如有疑問請向餐廳查詢。</p>",
      status: "published",
      updatedAt: "2025年10月20日",
      submittedAt: "2025年10月20日",
      submittedBy: "Annie",
      reviewedBy: "Annie",
      reviewedAt: "2025年10月20日",
    },

    // 💡 增加更多項目以展示橫向滾動效果
  ];

  // ----------------------------------------------------
  // Modal 處理函數
  const openModal = useCallback((promo) => {
    setSelectedPromo(promo);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPromo(null);
  }, []);

  const openImageModal = useCallback((imageUrl) => {
    setImageToView(imageUrl);
    setIsImageModalOpen(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setIsImageModalOpen(false);
    setImageToView(null);
  }, []);
  // ----------------------------------------------------

  // 計算分頁邏輯
  const totalPages = Math.ceil(promotions.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  // 網頁版 (>=md) 顯示的項目子集
  const currentPromotions = promotions.slice(startIndex, endIndex);

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  // ----------------------------------------------------

  // 提取卡片渲染邏輯作為一個獨立的組件或函數，方便重用
  const PromotionCard = ({ promo }) => (
    // 使用 button 讓整個卡片都可以點擊
    <button
      onClick={() => openModal(promo)} // 💡 點擊卡片打開 Modal
      key={promo.promoId}
      className="flex flex-col items-stretch flex-shrink-0 w-[60vw] sm:w-[40vw] md:w-auto bg-gray-50 rounded-lg my-1 transform hover:scale-102 transition duration-300 ease-in-out border border-gray-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500
"
    >
      <div className="relative w-full h-28 sm:h-36 md:h-40">
        <Image
          src={promo.coverUrl}
          alt={promo.title}
          fill
          priority
          className="object-cover object-[center_10%] rounded-t-lg"
        />
      </div>
      <div className="p-3">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-1 ">
          {promo.title}
        </h3>
        <p className="text-sm md:text-base font-semibold text-gray-800 mb-1 whitespace-normal">
          {promo.subtitle}
        </p>
        {/* 連結文字縮小 (text-xs) - 這裡已經被 button 的 onClick 事件取代，但保留視覺效果 */}
        <p className="text-blue-700 text-xs md:text-sm font-medium hover:underline cursor-pointer">
          查看詳情 &rarr;
        </p>
      </div>
    </button>
  );

  return (
    <section className="py-4 md:py-12 px-0 md:bg-white md:px-6 lg:px-8 md:shadow-md rounded-md md:rounded-lg">
      <h2 className="text-xl md:text-2xl md:text-center font-extrabold text-gray-900 px-4 md:px-0 mb-4 md:mb-8">
        最新推廣與精選
      </h2>

      <div className="relative max-w-screen-xl mx-auto">
        {/* 1. 【手機版容器】：只在 <md 顯示 (md:hidden)。保持橫向滾動。 */}
        <div className="flex overflow-x-scroll gap-3 px-4 scrollbar-hide md:hidden ">
          {promotions.map((promo) => (
            <PromotionCard key={promo.promoId} promo={promo} />
          ))}

          {/* 在橫向滾動末端增加間距，防止最後一張卡片貼邊 */}
          <div className="flex-shrink-0 w-4"></div>
        </div>

        {/* 2. 【網頁版容器】：只在 >=md 顯示 (hidden md:block)。使用分頁邏輯。 */}
        <div className="hidden md:grid md:grid-cols-3 gap-2 md:px-0 ">
          {currentPromotions.map((promo) => (
            <PromotionCard key={promo.promoId} promo={promo} />
          ))}
        </div>

        {/* 3. 【網頁版分頁按鈕】：只在 >=md 顯示，且總頁數大於 1。 */}
        {totalPages > 1 && (
          <>
            {/* 上一頁按鈕 */}
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              className=" hidden md:block absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg z-10 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition duration-150 "
              aria-label="上一頁"
            >
              &larr;
            </button>

            {/* 下一頁按鈕 */}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages - 1}
              className="hidden md:block absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg z-10 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition duration-150 "
              aria-label="下一頁"
            >
              &rarr;
            </button>
          </>
        )}
      </div>

      {/* 4. 💡 Promotion Modal 組件 */}
      <PromotionModal
        isVisible={isModalOpen}
        onClose={closeModal}
        promotion={selectedPromo}
        openImageModal={openImageModal}
      />
      <ImageFullScreenModal
        isVisible={isImageModalOpen}
        onClose={closeImageModal}
        imageUrl={imageToView}
      />
    </section>
  );
};

export default PromotionsSection;
