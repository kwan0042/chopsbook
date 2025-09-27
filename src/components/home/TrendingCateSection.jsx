// src/components/TrendingCateSection.js
"use client";

import React from "react";
import { useRouter } from "next/navigation"; // 

/**
 * TrendingCateSection: 顯示熱門餐廳類別和菜系的區塊。
 * 點擊後會導航至餐廳列表頁面並帶上篩選條件。
 */
const TrendingCateSection = () => {
  const router = useRouter();

  // 現有的餐廳類型列表 (使用 restaurantType 作為篩選 key)
  const restaurantTypes = [
    { name: "茶餐廳", icon: "🥢", filterKey: "restaurantType" },
    { name: "日式料理", icon: "🍣", filterKey: "restaurantType" },
    { name: "西式料理", icon: "🍝", filterKey: "restaurantType" },
    { name: "火鍋", icon: "🍲", filterKey: "restaurantType" },
    { name: "咖啡廳 (Cafe)", icon: "☕", filterKey: "restaurantType" },
    { name: "甜點", icon: "🍰", filterKey: "restaurantType" },
  ];

  // 關鍵修正：將 filterKey 設為 "cuisineType"
  const cuisineTypes = [
    { name: "香港菜", icon: "🇭🇰", filterKey: "cuisineType" },
    { name: "台灣菜", icon: "🇹🇼", filterKey: "cuisineType" },
    { name: "韓國菜", icon: "🇰🇷", filterKey: "cuisineType" },
    { name: "美國菜", icon: "🍔", filterKey: "cuisineType" },
    { name: "泰國菜", icon: "🇹🇭", filterKey: "cuisineType" },
    { name: "中國菜", icon: "🍜", filterKey: "cuisineType" },
  ];

  // 將兩種列表合併
  const categories = [...restaurantTypes, ...cuisineTypes];

  /**
   * 點擊類別時的處理函式。
   * 會將選定的 typeName 加入 URL 的 filters 參數中，並使用對應的 filterKey。
   * @param {string} typeName - 被點擊的餐廳類型/菜系名稱。
   * @param {string} filterKey - 用於 URL 篩選條件的 key (e.g., "restaurantType" or "cuisineType")
   */
  const handleCategoryClick = (typeName, filterKey) => {
    // 建立新的篩選條件物件，動態使用 filterKey
    const newFilters = { [filterKey]: typeName };

    // 建立新的 URL 查詢參數，並將篩選條件字串化後加入
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("filters", JSON.stringify(newFilters));

    // 導航到 /restaurants 頁面，並帶上篩選參數
    router.push(`/restaurants?${newSearchParams.toString()}`);

    console.log(`正在導航到 /restaurants 頁面並篩選: ${filterKey}=${typeName}`);
  };

  return (
    <section className="mt-12 text-center">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        熱門餐廳類別與菜系
      </h3>

      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-12 gap-6">
        {categories.map((type) => (
          <div
            key={type.name}
            
            onClick={() => handleCategoryClick(type.name, type.filterKey)}
            className="bg-white rounded-xl shadow-lg p-4 flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl sm:text-3xl">
              {type.icon}
            </div>
            <p className="mt-2 text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
              {type.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendingCateSection;
