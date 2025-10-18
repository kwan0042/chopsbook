// src/components/CategoriesPage.js (或 src/app/categories/page.js)

"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
// 移除所有圖標匯入，只保留需要的 hook
// import { Search, ChevronDown, ChevronUp } from "lucide-react";

// === 匯入數據 (修正 categoryOptions 的大小寫) ===
import {
  categoryOptions, // 🚨 修正: 匯入名稱與數據檔案一致
  restaurantTypeOptions,
  SUB_CATEGORY_MAP, // 匯入用於子分類映射的物件
} from "@/data/restaurant-options";

// =======================================================
// 圖示映射與默認圖示 (全部移除或清空)
// =======================================================

const CHINESE_GROUP_NAME = "中菜";
const RESTAURANT_TYPE_GROUP_NAME = "餐廳類型";

const DEFAULT_CUISINE_ICON = ""; // 清空圖示
const DEFAULT_TYPE_ICON = ""; // 清空圖示

/**
 * CategoriesPage: 顯示所有餐廳類型和菜系的頁面。
 */
const CategoriesPage = () => {
  const router = useRouter();

  // 處理和合併所有類別數據
  const { categoryGroups, typeGroup } = useMemo(() => {
    // 1. 數據檢查
    // 🚨 修正 1: 確保它們是陣列，如果不是，則將其視為空陣列
    const categories = Array.isArray(categoryOptions) ? categoryOptions : []; // 🚨 使用修正後的名稱
    const restaurantTypes = Array.isArray(restaurantTypeOptions)
      ? restaurantTypeOptions
      : [];

    const validCuisine = categories.length > 0;
    const validRestaurantType = restaurantTypes.length > 0;

    if (!validCuisine || !validRestaurantType) {
      console.error(
        "❌ 錯誤: 數據匯入失敗。categoryOptions 或 restaurantTypeOptions 不是有效的陣列或為空。"
      );
      // 返回空的數據結構
      return { categoryGroups: [], typeGroup: null };
    }

    // --- 數據準備助手函式 ---
    const prepareItems = (names, filterKey) => {
      return names
        .filter((name) => typeof name === "string" && name.trim() !== "")
        .map((name) => ({
          name,
          filterKey,
          icon: "", // 移除圖示
        }));
    };

    // --- A. 處理菜系群組 (Cuisine Groups) ---
    // ⚡️ 修正 2: 直接遍歷 categories 陣列
    const categoryGroups = categories.map((groupName) => {
      // ⚡️ 修正 3: 從 SUB_CATEGORY_MAP 中查找子分類。
      const rawSubNames = SUB_CATEGORY_MAP[groupName];
      const subNames = Array.isArray(rawSubNames) ? rawSubNames : [];

      const mainCategory = {
        name: groupName,
        filterKey: "category", // 確保使用 'category'
        icon: "", // 移除圖示
        filterValue: groupName,
      };

      // 這裡的 subNames 執行 .map() 時，現在保證是一個 Array
      const subCategories = subNames.map((subName) => ({
        name: subName,
        filterKey: "subCategory", // 確保使用 'subCategory'
        icon: "", // 移除圖示
        filterValue: subName,
      }));

      return {
        mainCategory,
        subCategories,
      };
    });

    // --- B. 處理餐廳類型 (Restaurant Types) ---
    const typeCategories = prepareItems(
      restaurantTypes, // ⚡️ 使用修正後的 restaurantTypes 陣列
      "restaurantType"
    ).map((item) => ({ ...item, filterValue: item.name }));

    const typeGroup = {
      title: RESTAURANT_TYPE_GROUP_NAME,
      items: typeCategories,
    };

    return {
      categoryGroups,
      typeGroup,
    };
  }, []); // 依賴項為空，只在第一次渲染時計算

  /**
   * 點擊類別時的處理函式。
   */
  const handleCategoryClick = (category) => {
    const { name, filterKey, filterValue } = category;

    const finalFilterValue = filterValue || name;

    const params = new URLSearchParams();

    // 根據 DB 結構的最終定案（subCategory: String, restaurantType: Array）來設定篩選鍵
    if (filterKey === "category") {
      // category: String (精確匹配)
      params.set(filterKey, finalFilterValue);
    } else if (filterKey === "subCategory") {
      // subCategory: String (精確匹配)
      params.set(filterKey, finalFilterValue);
    } else if (filterKey === "restaurantType") {
      // restaurantType: Array (後端需用 array-contains 處理)
      params.set(filterKey, finalFilterValue);
    }

    const path = `/restaurants?${params.toString()}`;
    router.push(path);

    console.log(
      `正在導航到 /restaurants 頁面並篩選: ${filterKey}=${finalFilterValue}`
    );
  };

  // --- 渲染助手函式：單一分類項目的樣式 ---
  const CategoryItem = ({ category, isMain }) => {
    // 移除所有圖標和中菜特殊樣式

    return (
      <div
        onClick={() => handleCategoryClick(category)}
        className={`flex  items-center p-2 rounded-lg transition-all duration-200 cursor-pointer ${
          isMain
            ? "group hover:bg-indigo-100/70 h-full "
            : "group hover:bg-gray-100 hover:text-indigo-600"
        }`}
      >
        <p
          className={`font-semibold text-gray-700 ${
            isMain ? "text-base text-center" : "text-sm"
          } group-hover:text-indigo-800`}
        >
          {category.name}
          {/* 移除圖標顯示 */}
        </p>
      </div>
    );
  };

  // --- 渲染助手函式：單一菜系群組的行佈局 ---
  const CuisineRow = ({ group }) => {
    // 移除 isChinese 判斷和相關樣式

    const subItemsToDisplay = group.subCategories;

    return (
      <div className={`flex border-b border-gray-200`}>
        {/* 左欄：主群組 (Category) - 應用垂直置中 */}
        <div
          className={`w-1/6 p-4 flex items-center justify-start border-r border-r-2 border-indigo-200`}
        >
          <div className=" h-full w-full bg-indigo-50 rounded-lg shadow-sm ">
            <CategoryItem category={group.mainCategory} isMain={true} />
          </div>
        </div>

        {/* 右欄：細分菜系 (Sub-Types) */}
        <div className="w-5/6 p-4 flex flex-wrap gap-x-6 gap-y-3">
          {subItemsToDisplay.map((sub, index) => (
            <CategoryItem key={index} category={sub} isMain={false} />
          ))}
        </div>
      </div>
    );
  };

  // --- 渲染助手函式：餐廳類型群組 ---
  const TypeRow = ({ group }) => {
    return (
      <div className="flex border-b border-gray-200 last:border-b-0">
        {/* 左欄：主群組 (Category) - 應用垂直置中 */}
        <div
          className={`w-1/6 p-4 flex items-center justify-start border-r border-r-2 border-indigo-200 bg-indigo-50/50`}
        >
          <h3 className="text-xl font-bold text-gray-800">{group.title}</h3>
        </div>

        {/* 右欄：餐廳類型列表 (Sub-Types) */}
        <div className="w-5/6 p-4 flex flex-wrap gap-x-6 gap-y-3">
          {group.items.map((type, index) => (
            <CategoryItem key={index} category={type} isMain={false} />
          ))}
        </div>
      </div>
    );
  };

  if (!categoryGroups.length) {
    return (
      <div className="text-center p-12">
        <h1 className="text-xl font-bold text-red-600">數據載入錯誤</h1>
        <p className="text-gray-600 mt-2">
          請確認您的數據檔案 `src/data/restaurant-options.js` 結構是否正確。
        </p>
      </div>
    );
  }

  return (
    <div className=" bg-cbbg p-4 sm:p-8 lg:p-12">
      <header className="mb-5 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          所有餐廳/菜系分類
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          以群組和細項方式，探索加拿大各地豐富的餐廳選擇。
        </p>
      </header>

      <main className="max-w-6xl mx-auto   overflow-hidden">
        {/* 1. 菜系群組列表 */}
        <section className="border border-gray-200 bg-white text-center">
          <h2 className="text-xl font-bold text-gray-800 p-4 border-b border-gray-200 bg-gray-50">
            主要菜系分類
          </h2>
          <div className="divide-y divide-gray-100">
            {categoryGroups.map((group, index) => (
              <CuisineRow key={index} group={group} />
            ))}
          </div>
        </section>

        {/* 2. 餐廳類型列表 */}
        <section className="mt-8 border border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-800 p-4 border-b border-gray-200 bg-gray-50">
            餐廳類型與服務模式
          </h2>
          <TypeRow group={typeGroup} />
        </section>
      </main>
    </div>
  );
};

export default CategoriesPage;
