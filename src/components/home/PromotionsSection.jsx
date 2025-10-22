"use client";
// src/components/home/PromotionsSection.js
import React, { useState } from "react";

const PromotionsSection = () => {
  // 設置網頁版每頁顯示的項目數
  const ITEMS_PER_PAGE = 4;

  // ----------------------------------------------------
  // 狀態管理：currentPage 只在 web 端 (>=md) 生效
  const [currentPage, setCurrentPage] = useState(0);
  // ----------------------------------------------------

  const promotions = [
    {
      id: 1,
      title: "Midori 每日限定優惠 ",
      subtitle: "Midori Ramen人氣日式拉麵",
      imageUrl: "https://placehold.co/300x180/FFD700/000000?text=夏日特惠",
    },
    {
      id: 2,
      title: "新用戶專享：首單八折！",
      imageUrl: "https://placehold.co/300x180/ADFF2F/000000?text=新用戶優惠",
    },
    {
      id: 3,
      title: "週末限定：家庭套餐優惠！",
      imageUrl: "https://placehold.co/300x180/8A2BE2/FFFFFF?text=週末限定",
    },
    {
      id: 4,
      title: "會員專享：積分雙倍！",
      imageUrl: "https://placehold.co/300x180/FF6B6B/FFFFFF?text=會員優惠",
    },
    // 💡 增加更多項目以展示橫向滾動效果
    {
      id: 5,
      title: "咖啡買二送一",
      imageUrl: "https://placehold.co/300x180/00BFFF/000000?text=咖啡優惠",
    },
    {
      id: 6,
      title: "甜點新品上市",
      imageUrl: "https://placehold.co/300x180/FFC0CB/000000?text=甜點新品",
    },
    {
      id: 7,
      title: "套餐升級優惠",
      imageUrl: "https://placehold.co/300x180/FF8C00/000000?text=套餐升級",
    },
    {
      id: 8,
      title: "季節限定甜品",
      imageUrl: "https://placehold.co/300x180/9370DB/FFFFFF?text=限定甜品",
    },
    {
      id: 9,
      title: "晚間特價活動",
      imageUrl: "https://placehold.co/300x180/3CB371/FFFFFF?text=晚間特價",
    },
  ];

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
    <div
      key={promo.id}
      className="
        flex-shrink-0 w-[40vw] sm:w-[20vw] md:w-auto  
        bg-gray-50 rounded-lg my-1 
        transform hover:scale-102 transition duration-300 ease-in-out border border-gray-200
      "
    >
      <img
        src={promo.imageUrl}
        alt={promo.title}
        // 圖片高度調整：h-28 (手機) -> h-36 (小平板) -> h-40 (網頁)
        className="w-full h-28 sm:h-36 md:h-40 object-cover rounded-t-lg"
      />
      <div className="p-3">
        
        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-1 wwhitespace-nowrap overflow-hidden text-ellipsis">
          {promo.title}
        </h3>
        <p className="text-sm md:text-base font-semibold text-gray-800 mb-1 whitespace-normal">
          {promo.subtitle}
        </p>
        {/* 連結文字縮小 (text-xs) */}
        <p className="text-blue-700 text-xs md:text-sm font-medium hover:underline cursor-pointer">
          查看詳情 &rarr;
        </p>
      </div>
    </div>
  );

  return (
    <section className="py-4 md:py-12 px-0 md:bg-white md:px-6 lg:px-8 md:shadow-md rounded-md md:rounded-lg">
      <h2 className="text-xl md:text-2xl md:text-center font-extrabold text-gray-900 px-4 md:px-0 mb-4 md:mb-8">
        最新推廣與精選
      </h2>

      <div className="relative max-w-screen-xl mx-auto">
        {/* 1. 【手機版容器】：只在 <md 顯示 (md:hidden)。保持橫向滾動。 */}
        <div
          className="
            flex overflow-x-scroll 
            gap-3 
            pl-4 pr-4 
            scrollbar-hide
            md:hidden
          "
        >
          {promotions.map((promo) => (
            <PromotionCard key={promo.id} promo={promo} />
          ))}

          {/* 在橫向滾動末端增加間距，防止最後一張卡片貼邊 */}
          <div className="flex-shrink-0 w-4"></div>
        </div>

        {/* 2. 【網頁版容器】：只在 >=md 顯示 (hidden md:block)。使用分頁邏輯。 */}
        <div
          className="
            hidden 
            md:grid md:grid-cols-4 
            gap-2
            md:px-0 
          "
        >
          {currentPromotions.map((promo) => (
            <PromotionCard key={promo.id} promo={promo} />
          ))}
        </div>

        {/* 3. 【網頁版分頁按鈕】：只在 >=md 顯示，且總頁數大於 1。 */}
        {totalPages > 1 && (
          <>
            {/* 上一頁按鈕 */}
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="
                        hidden md:block 
                        absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 
                        p-2 bg-white rounded-full shadow-lg z-10 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        hover:bg-gray-100 transition duration-150
                    "
              aria-label="上一頁"
            >
              &larr;
            </button>

            {/* 下一頁按鈕 */}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages - 1}
              className="
                        hidden md:block 
                        absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 
                        p-2 bg-white rounded-full shadow-lg z-10 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        hover:bg-gray-100 transition duration-150
                    "
              aria-label="下一頁"
            >
              &rarr;
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default PromotionsSection;
