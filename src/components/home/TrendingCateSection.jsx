// src/components/TrendingCateSection.js
"use client";

import React, { useRef } from "react"; // 引入 useRef
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react"; // 引入圖標 (假設您有安裝 lucide-react)

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
    { display:"茶餐廳",name: "茶餐廳", filterKey: "restaurantType", imageUrl: "img/restType/hkCafe.webp" },
    { display:"Café",name: "咖啡廳", filterKey: "restaurantType", imageUrl: "/img/restType/cafe.webp" },
    { display:"壽司/刺身",name: "壽司/刺身專門店", filterKey: "restaurantType", imageUrl: "/img/restType/sushi.webp" },
    { display:"韓式炸雞",name: "韓式炸雞 (Korean Fried Chicken)", filterKey: "restaurantType", imageUrl: "/img/restType/kChicken.webp" },
    { display:"糖水舖/中式甜品店",name: "糖水舖/中式甜品店", filterKey: "restaurantType", imageUrl: "/img/restType/cDessert.webp" },
    { display:"拉麵/沾麵",name: "拉麵/沾麵店", filterKey: "restaurantType", imageUrl: "/img/restType/ramen.webp" },
  ];

  // 【修改點 1】：新增 imageUrl 屬性
  const categorys = [
    { display:"港式",name: "港式", filterKey: "category", imageUrl: "/img/category/hk.webp" },
    { display:"中菜",name: "中菜", filterKey: "category", imageUrl: "/img/category/cn.webp" },
    { display:"日本菜",name: "日本菜", filterKey: "category", imageUrl: "/img/category/jp.webp" },
    { display:"台灣菜",name: "台灣菜", filterKey: "category", imageUrl: "/img/category/tw.webp" },
    { display:"韓國菜",name: "韓國菜", filterKey: "category", imageUrl: "/img/category/kr.webp" },
    { display:"泰國菜",name: "泰國菜", filterKey: "category", imageUrl: "/img/category/th.webp" },
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
              // 【修改點 2】：新增 style 屬性來設定背景圖片
              style={
                type.imageUrl
                  ? {
                      backgroundImage: `url(${type.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {}
              }
              className={`
                /* 共同樣式 */
                text-center transition-transform hover:scale-105 cursor-pointer relative 
                overflow-hidden
                
                /* 手機版樣式 */
                flex-shrink-0 w-auto 
                py-2 px-4 
                text-sm font-medium whitespace-nowrap 
                shadow-sm
                ${type.imageUrl ? 'my-1 rounded-xl text-white' : 'bg-gray-100 text-gray-700 border border-gray-200 rounded-full'} 
                
                /* 網頁版樣式：正方形、緊貼、一行八個 */
                md:flex-shrink md:w-full
                md:aspect-square 
                md:p-0 md:m-0 
                md:flex md:flex-col md:items-center md:justify-center
                md:text-base md:shadow-md 
                ${type.imageUrl ? 'md:rounded-xl md:border-none' : 'md:bg-white md:rounded-xl md:border md:border-gray-100'} 
              `}
            >
              {/* 【修改點 3】：新增半透明疊加層 (僅在有圖片時顯示) */}
              {type.imageUrl && (
                <div className="absolute inset-0 bg-black/40 rounded-xl md:rounded-xl z-0"></div>
              )}
              
              {/* 摩登簡約設計：將文字作為卡片主體 */}
              <p className=" 
                  text-sm md:text-base font-bold 
                  whitespace-nowrap 
                  md:whitespace-normal
                  z-10 relative // 確保文字在疊加層上方
                  
                  ${type.imageUrl ? 'text-white' : 'text-gray-700'}
                ">
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