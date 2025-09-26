"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * TrendingCateSection: 顯示熱門餐廳類別的區塊。
 * 點擊後會導航至餐廳列表頁面並帶上篩選條件。
 */
const TrendingCateSection = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const restaurantTypes = [
    { name: "茶餐廳", icon: "🥢" },
    { name: "日式料理", icon: "🍣" },
    { name: "西式料理", icon: "🍝" },
    { name: "火鍋", icon: "🍲" },
    { name: "咖啡廳", icon: "☕" },
    { name: "甜點", icon: "🍰" },
  ];

  /**
   * 點擊類別時的處理函式。
   * 會將選定的 restaurantType 加入 URL 的 filters 參數中。
   * @param {string} typeName - 被點擊的餐廳類型名稱。
   */
  const handleCategoryClick = (typeName) => {
    // 建立新的篩選條件物件
    const newFilters = { restaurantType: typeName };

    // 建立新的 URL 查詢參數，並將篩選條件字串化後加入
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("filters", JSON.stringify(newFilters));

    // 導航到 /restaurants 頁面，並帶上篩選參數
    router.push(`/restaurants?${newSearchParams.toString()}`);

    console.log(`正在導航到 /restaurants 頁面並篩選類別: ${typeName}`);
  };

  return (
    <section className="mt-12 text-center">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">熱門餐廳類別</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
        {restaurantTypes.map((type) => (
          <div
            key={type.name}
            onClick={() => handleCategoryClick(type.name)}
            className="bg-white rounded-xl shadow-lg p-4 flex flex-col items-center transition-transform hover:scale-105 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
              {type.icon}
            </div>
            <p className="mt-2 text-sm font-medium">{type.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendingCateSection;
