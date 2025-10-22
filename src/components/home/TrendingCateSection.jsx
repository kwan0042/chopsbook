// src/components/TrendingCateSection.js
"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image"; // 【修改點 1】：引入 Image 組件

/**
 * TrendingCateSection: 顯示熱門餐廳類別和菜系的區塊。
 * 點擊後會導航至餐廳列表頁面並帶上篩選條件。
 */
const TrendingCateSection = () => {
  const router = useRouter();
  // 1. 創建一個 ref 來引用可滾動的 DOM 元素 (僅用於手機版滾動)
  const scrollContainerRef = useRef(null);

  // 【修改點 1】：新增 imageUrl 屬性
  const restaurantTypes = [
    {
      display: "茶餐廳",
      name: "茶餐廳",
      filterKey: "restaurantType",
      imageUrl: "/img/restType/hkCafe.webp",
    },
    {
      display: "Café",
      name: "咖啡廳",
      filterKey: "restaurantType",
      imageUrl: "/img/restType/cafe.webp",
    },
    {
      display: "壽司/刺身",
      name: "壽司/刺身專門店",
      filterKey: "restaurantType",
      imageUrl: "/img/restType/sushi.webp",
    },
    {
      display: "韓式炸雞",
      name: "韓式炸雞 (Korean Fried Chicken)",
      filterKey: "restaurantType",
      imageUrl: "/img/restType/kChicken.webp",
    },
    {
      display: "糖水舖/中式甜品店",
      name: "糖水舖/中式甜品店",
      filterKey: "restaurantType",
      imageUrl: "/img/restType/cDessert.webp",
    },
    {
      display: "茶樓/早茶",
      name: "茶樓/早茶",
      filterKey: "restaurantType",
      imageUrl: "/img/restType/tea.webp",
    },
    {
      display: "燒味/燒臘",
      name: "燒味店/燒臘專門店",
      filterKey: "restaurantType",
      imageUrl: "/img/restType/hkbbq.webp",
    },
    {
      display: "居酒屋",
      name: "居酒屋 (Izakaya)",
      filterKey: "restaurantType",
      imageUrl: "/img/restType/izakaya.webp",
    },
    {
      display: "拉麵/沾麵",
      name: "拉麵/沾麵店",
      filterKey: "restaurantType",
      imageUrl: "/img/restType/ramen.webp",
    },
    {
      display: "麵包/烘焙",
      name: "麵包店/烘焙店",
      filterKey: "restaurantType",
      imageUrl: "/img/restType/bakery.webp",
    },
  ];

  // 【修改點 1】：新增 imageUrl 屬性
  const categorys = [
    {
      display: "港式",
      name: "港式",
      filterKey: "category",
      imageUrl: "/img/category/hk.webp",
    },
    {
      display: "中菜",
      name: "中菜",
      filterKey: "category",
      imageUrl: "/img/category/cn.webp",
    },
    {
      display: "日本菜",
      name: "日本菜",
      filterKey: "category",
      imageUrl: "/img/category/jp.webp",
    },
    {
      display: "台灣菜",
      name: "台灣菜",
      filterKey: "category",
      imageUrl: "/img/category/tw.webp",
    },
    {
      display: "韓國菜",
      name: "韓國菜",
      filterKey: "category",
      imageUrl: "/img/category/kr.webp",
    },
    {
      display: "泰國菜",
      name: "泰國菜",
      filterKey: "category",
      imageUrl: "/img/category/th.webp",
    },
  ];

  // 將兩種列表合併
  const categories = [...restaurantTypes, ...categorys];

  /**
   * 點擊類別時的處理函式。
   */
  const handleCategoryClick = (typeName, filterKey) => {
    // 建立新的篩選條件物件，動態使用 filterKey
    const newFilters = { [filterKey]: [typeName] };

    // 建立新的 URL 查詢參數，並將篩選條件字串化後加入
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("filters", JSON.stringify(newFilters));

    // 導航到 /restaurants 頁面，並帶上篩選參數
    router.push(`/restaurants?${newSearchParams.toString()}`);

    console.log(`正在導航到 /restaurants 頁面並篩選: ${filterKey}=${typeName}`);
  };

  /**
   * 2. 實作滾動函式 (網頁版不再使用，但保留以備手機版調用)
   * @param {string} direction - 'left' or 'right'
   */
  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200; // 每次滾動的像素
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll =
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth", // 平滑滾動
      });
    }
  };

  // 樣式調整: 確保手機和網頁版有不同的間距
  return (
    <section className="py-4 md:py-12 px-0 text-left md:text-center">
      {/* 標題調整：手機左對齊，網頁居中，字體變小，增加手機左右邊距 */}
      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 px-4 md:px-0">
        熱門餐廳類別與菜系
      </h3>

      {/* 核心修改：移除 absolute/relative 容器，直接使用內容容器 */}
      <div className="px-0">
        <div
          ref={scrollContainerRef}
          className="
            flex overflow-x-scroll scroll-smooth
            md:grid md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 
            gap-3 md:gap-4 
            pl-4 pr-4 md:px-0 
            scrollbar-hide 
            md:overflow-x-visible md:flex-wrap
          "
        >
          {categories.map((type) => (
            <div
              key={type.name}
              onClick={() => handleCategoryClick(type.name, type.filterKey)}
              // 【修改點 2】：移除 style 屬性，改用 Next/Image
              className={`
                /* 共同樣式 */
                text-center transition-transform hover:scale-105 cursor-pointer relative 
                overflow-hidden
                
                /* 手機版樣式 */
                flex-shrink-0 w-auto 
                py-2 px-4 
                text-sm font-medium whitespace-nowrap 
                shadow-sm
                ${
                  type.imageUrl
                    ? "my-1 rounded-xl text-white"
                    : "bg-gray-100 text-gray-700 border border-gray-200 rounded-full"
                } 
                
                /* 網頁版樣式：正方形、緊貼、一行八個 */
                md:flex-shrink md:w-full
                md:aspect-square 
                md:p-0 md:m-0 
                md:flex md:flex-col md:items-center md:justify-center
                md:text-base md:shadow-md 
                ${
                  type.imageUrl
                    ? "md:rounded-xl md:border-none"
                    : "md:bg-white md:rounded-xl md:border md:border-gray-100"
                } 
              `}
            >
              {/* 【新增/修改】：使用 Next.js Image 組件作為背景 */}
              {type.imageUrl && (
                <Image
                  src={type.imageUrl}
                  alt={type.display}
                  fill // 讓圖片填滿父層 div
                  sizes="(max-width: 768px) 15vw, 10vw" // 提示 Next.js 在不同螢幕尺寸下使用的圖片大小
                  className="rounded-xl object-cover" // 確保圖片覆蓋且不會變形
                  priority={true} // 由於這是首屏內容，設為 priority 優先載入
                />
              )}

              {/* 【修改點 3】：調整半透明疊加層的 z-index (僅在有圖片時顯示) */}
              {type.imageUrl && (
                <div className="absolute inset-0 bg-black/40 rounded-xl md:rounded-xl z-10"></div> // z-10 確保在圖片上方
              )}

              {/* 摩登簡約設計：將文字作為卡片主體 */}
              <p
                className=" 
                  text-sm md:text-base font-bold 
                  whitespace-nowrap 
                  md:whitespace-normal
                  z-20 relative // z-20 確保文字在圖片和疊加層上方
                  
                  ${type.imageUrl ? 'text-white' : 'text-gray-700'}
                "
              >
                {type.display}
              </p>
            </div>
          ))}
          {/* 橫向滾動末端間距 (僅作用於手機版) */}
          <div className="flex-shrink-0 w-8 md:hidden"></div>
        </div>
      </div>
    </section>
  );
};

export default TrendingCateSection;
