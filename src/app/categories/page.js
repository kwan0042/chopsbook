"use client";

import React, { useMemo, useState } from "react";
// 使用標準的 Next.js App Router 導航模組
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

// === 根據您的要求，直接從 src/data/restaurant-options.js 匯入數據 ===
// 確保您的專案中存在此檔案，並且正確匯出 cuisineOptions 和 restaurantTypeOptions
import {
  cuisineOptions,
  restaurantTypeOptions,
} from "@/data/restaurant-options";

// =======================================================
// 中菜分組配置
// =======================================================

const CHINESE_CUISINES_TO_GROUP = [
  "粵菜",
  "粵式點心/飲茶",
  "粵式海鮮",
  "潮州菜",
  "客家菜",
  "上海菜/江浙菜",
  "北京菜",
  "川菜",
  "湘菜",
  "魯菜",
  "徽菜",
  "東北菜",
  "火鍋/打邊爐", // 將火鍋也納入中菜群組
];
const CHINESE_GROUP_NAME = "中菜";
const CHINESE_GROUP_ICON = ""; // 中國國旗作為統一圖示

// =======================================================
// 圖示映射與默認圖示
// =======================================================

const ICON_MAP = {
  港式: "🇭🇰",
  下午茶: "☕",
  [CHINESE_GROUP_NAME]: CHINESE_GROUP_ICON, // 新增合一圖示
  日本菜: "🍣",
  韓國菜: "🇰🇷",
  泰國菜: "🇹🇭",
  意大利菜: "🍕",
  法國菜: "🥖",
  "美式菜 - 漢堡/炸雞": "🍔",
  素食: "🌱",
  海鮮: "🦞",
  // 餐廳類型
  茶餐廳: "🍳",
  粉麵店: "🍜",
  燒味店: "🍖",
  酒樓: "🏮",
  "咖啡廳 (Cafe)": "☕",
  "速食 (Fast Food)": "🍟",
  "甜品店 / 糖水舖": "🍰",
  "酒吧 (Bar)": "🍸",
  "高級餐飲 (Fine Dining)": "🥂",
};

const DEFAULT_CUISINE_ICON = "🍚";
const DEFAULT_TYPE_ICON = "🍴";

/**
 * CategoriesPage: 顯示所有餐廳類型和菜系的頁面。
 */
const CategoriesPage = () => {
  const router = useRouter();
  // 狀態來控制中菜群組是否展開
  const [showChineseSub, setShowChineseSub] = useState(false);

  // 處理和合併所有類別數據
  const { mainCategories, chineseSubGroup } = useMemo(() => {
    // 1. 確保數據存在且有效
    const validCuisine =
      Array.isArray(cuisineOptions) && cuisineOptions.length > 0;
    const validRestaurantType =
      Array.isArray(restaurantTypeOptions) && restaurantTypeOptions.length > 0;

    if (!validCuisine || !validRestaurantType) {
      console.error(
        "錯誤: cuisineOptions 或 restaurantTypeOptions 匯入失敗，請檢查數據檔案。"
      );
      return { mainCategories: [], chineseSubGroup: { title: "", items: [] } };
    }

    // 2. 過濾主菜系列表，移除所有細分中菜
    const filteredCuisineOptions = cuisineOptions.filter(
      (name) => !CHINESE_CUISINES_TO_GROUP.includes(name)
    );

    // 3. 將新的「中菜合一」群組插入到主菜系列表中，放在「港式」之後
    const hongKongIndex = filteredCuisineOptions.indexOf("港式");
    if (hongKongIndex !== -1) {
      filteredCuisineOptions.splice(hongKongIndex + 1, 0, CHINESE_GROUP_NAME);
    } else {
      // 備用：如果找不到港式，就插在第一個有效選項之後
      filteredCuisineOptions.splice(1, 0, CHINESE_GROUP_NAME);
    }

    const prepareCategories = (options, filterKey, defaultIcon) => {
      // 排除第一個 "選擇..." 項目
      return options.slice(1).map((name) => ({
        name,
        filterKey,
        // 為中菜合一群組指定統一圖示
        icon: ICON_MAP[name] || defaultIcon,
      }));
    };

    const mainCuisineCategories = prepareCategories(
      filteredCuisineOptions,
      "cuisineType",
      DEFAULT_CUISINE_ICON
    );
    const typeCategories = prepareCategories(
      restaurantTypeOptions,
      "restaurantType",
      DEFAULT_TYPE_ICON
    );

    // 4. 準備專門的中菜細分列表
    const chineseSubCategories = prepareCategories(
      ["Placeholder", ...CHINESE_CUISINES_TO_GROUP],
      "cuisineType",
      DEFAULT_CUISINE_ICON
    );

    return {
      mainCategories: [
        {
          title: "主要菜系 (Main Cuisine Types)",
          items: mainCuisineCategories,
        },
        { title: "所有餐廳類型 (Restaurant Types)", items: typeCategories },
      ],
      chineseSubGroup: {
        title: CHINESE_GROUP_NAME + " - 詳細菜式",
        items: chineseSubCategories,
      },
    };
  }, [cuisineOptions, restaurantTypeOptions]);

  /**
   * 點擊類別時的處理函式。
   */
  const handleCategoryClick = (typeName, filterKey) => {
    // 如果點擊的是「中菜合一」，則只切換展開狀態，不導航
    if (typeName === CHINESE_GROUP_NAME) {
      setShowChineseSub((prev) => !prev);
      return;
    }

    // 否則，執行正常的導航與篩選
    const newFilters = { [filterKey]: typeName };
    const path = `/restaurants?filters=${encodeURIComponent(
      JSON.stringify(newFilters)
    )}`;
    router.push(path);

    console.log(`正在導航到 /restaurants 頁面並篩選: ${filterKey}=${typeName}`);
  };

  const mainCuisineGroup = mainCategories.find((g) =>
    g.title.includes("主要菜系")
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 lg:p-12">
      <header className="mb-10 lg:mb-16 text-center">
        <h1 className="text-2xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          探索所有美食類別
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          根據餐廳類型或菜系，輕鬆篩選您想尋找的美食地點。
        </p>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* 1. 主要菜系區塊 */}
        {mainCuisineGroup && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6 border-b-2 border-indigo-200 pb-2 flex items-center">
              <Search className="w-6 h-6 mr-3 text-indigo-600" />
              {mainCuisineGroup.title}
            </h2>

            {/* 主網格佈局 */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 sm:gap-6">
              {mainCuisineGroup.items.map((category) => {
                const isChineseGroup = category.name === CHINESE_GROUP_NAME;
                const Icon = showChineseSub ? ChevronUp : ChevronDown;

                return (
                  <div
                    key={category.name}
                    onClick={() =>
                      handleCategoryClick(category.name, category.filterKey)
                    }
                    // 為中菜合一提供視覺上的區別和展開提示
                    className={`group bg-white rounded-xl shadow-lg hover:shadow-xl p-4 flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.03] cursor-pointer border border-gray-100 ${
                      isChineseGroup
                        ? "hover:border-red-400 border-2 border-red-200"
                        : "hover:border-indigo-400"
                    }`}
                  >
                    {/* 圖示區 */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-3xl sm:text-4xl transition-colors duration-300">
                      {category.icon}
                    </div>

                    {/* 名稱區 */}
                    <p className="mt-3 text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-indigo-600 text-center leading-tight flex items-center justify-center">
                      {category.name}
                      {isChineseGroup && <Icon className="w-4 h-4 ml-1" />}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. 中菜詳細菜式 (展開內容) */}
        {showChineseSub && chineseSubGroup.items.length > 0 && (
          <section className="mb-12 pt-8 border-t border-red-200 mt-8">
            <h2 className="text-3xl font-bold text-red-700 mb-6 border-b-2 border-red-300 pb-2 flex items-center">
              {chineseSubGroup.title}
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 sm:gap-6">
              {chineseSubGroup.items.map((category) => (
                <div
                  key={category.name}
                  onClick={() =>
                    handleCategoryClick(category.name, category.filterKey)
                  }
                  className="group bg-white rounded-xl shadow-md hover:shadow-lg p-4 flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.03] cursor-pointer border border-gray-100 hover:border-red-400"
                >
                  {/* 圖示區 */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-50 group-hover:bg-red-100 flex items-center justify-center text-3xl sm:text-4xl transition-colors duration-300">
                    {category.icon}
                  </div>

                  {/* 名稱區 */}
                  <p className="mt-3 text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-red-600 text-center leading-tight">
                    {category.name}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. 餐廳類型區塊 */}
        {mainCategories
          .filter((g) => g.title.includes("餐廳類型"))
          .map((group, groupIndex) => (
            <section key={groupIndex} className="mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-indigo-200 pb-2 flex items-center">
                <Search className="w-6 h-6 mr-3 text-indigo-600" />
                {group.title}
              </h2>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 sm:gap-6">
                {group.items.map((category) => (
                  <div
                    key={category.name}
                    onClick={() =>
                      handleCategoryClick(category.name, category.filterKey)
                    }
                    className="group bg-white rounded-xl shadow-lg hover:shadow-xl p-4 flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.03] cursor-pointer border border-gray-100 hover:border-indigo-400"
                  >
                    {/* 圖示區 */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-3xl sm:text-4xl transition-colors duration-300">
                      {category.icon}
                    </div>

                    {/* 名稱區 */}
                    <p className="mt-3 text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-indigo-600 text-center leading-tight">
                      {category.name}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
      </main>

      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>&copy; 2024 Category Explorer. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CategoriesPage;
