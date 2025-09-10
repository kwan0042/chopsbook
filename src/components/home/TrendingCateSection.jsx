"use client";

import React from "react";

/**
 * CategoriesSection: 顯示所有餐廳類別的區塊。
 * 這裡使用靜態資料，方便快速開發，未來可改為從 Firebase 讀取。
 */
const TrendingCateSection = () => {
  const categories = [
    { name: "中式料理", icon: "🥢" },
    { name: "日式料理", icon: "🍣" },
    { name: "西式料理", icon: "🍝" },
    { name: "火鍋", icon: "🍲" },
    { name: "咖啡廳", icon: "☕" },
    { name: "甜點", icon: "🍰" },
  ];

  const handleCategoryClick = (categoryName) => {
    // 這裡可以實現導航邏輯，例如：
    // router.push(`/restaurants?category=${categoryName}`);
    console.log(`點擊了類別: ${categoryName}`);
  };

  return (
    <section className="mt-12 text-center">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        熱門餐廳類別
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
        {categories.map((category) => (
          <div
            key={category.name}
            onClick={() => handleCategoryClick(category.name)}
            className="bg-white rounded-xl shadow-lg p-4 flex flex-col items-center transition-transform hover:scale-105 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
              {category.icon}
            </div>
            <p className="mt-2 text-sm font-medium">{category.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendingCateSection;
