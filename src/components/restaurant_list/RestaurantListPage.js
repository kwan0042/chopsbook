"use client";

import React, { useContext, useCallback } from "react";
import { AuthContext } from "../../lib/auth-context";
import LoadingSpinner from "../LoadingSpinner";
import RestaurantCard from "./RestaurantCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThLarge,
  faList,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";

const RestaurantListPage = ({
  filters = {},
  onClearFilters,
  onRemoveFilter,
  searchQuery = "",
  isGridView,
  toggleView,
  restaurants, // 從父組件接收已篩選好的餐廳列表
  loading, // 從父組件接收載入狀態
}) => {
  const { toggleFavoriteRestaurant, currentUser } = useContext(AuthContext);

  const handleToggleFavorite = async (restaurantId) => {
    try {
      await toggleFavoriteRestaurant(restaurantId);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  // 檢查是否有篩選條件或搜尋詞 (邏輯保持不變，但移除舊的物件形式檢查)
  const hasFiltersOrSearch =
    Object.entries(filters).some(([key, value]) => {
      // 排除不應該被視為篩選條件的 key
      if (key === "maxSeatingCapacity") return false;

      // 檢查陣列：長度大於 0 則為有效篩選
      if (Array.isArray(value)) return value.length > 0;

      // 檢查字串：非空、非預設值則為有效篩選
      if (
        typeof value === "string" &&
        value !== "" &&
        value !== "所有省份" &&
        value !== "0"
      )
        return true;

      // 檢查數字：大於 0 則為有效篩選
      if (typeof value === "number" && value > 0) return true;

      // 排除所有物件形式 (因為 cuisineType 現在是陣列，舊的物件形式應該被淘汰)
      if (typeof value === "object" && value !== null) return false;

      return false;
    }) || searchQuery.length > 0;

  const getFilterLabel = (key) => {
    const labels = {
      province: "省份",
      city: "城市",
      cuisineType: "餐廳菜系",
      minRating: "最低評分",
      minSeatingCapacity: "座位數",
      maxSeatingCapacity: "座位數",
      businessHours: "營業狀態",
      reservationModes: "訂座模式",
      paymentMethods: "付款方式",
      facilities: "設施",
      reservationDate: "用餐日期",
      reservationTime: "用餐時間",
      partySize: "用餐人數",
      favoriteRestaurantIds: "收藏",
      restaurantType: "餐廳類型",
      maxAvgSpending: "人均價錢",
    };
    return labels[key] || key;
  };

  const getFilterValueText = (key, value) => {
    if (key === "minRating") {
      return `${value} 星以上`;
    }
    if (key === "businessHours") {
      return `${value}`;
    }
    if (key === "maxAvgSpending") {
      if (value === 200) return "$200+";
      if (value > 0) return `<$${value}`;
      return "不限";
    }
    if (key === "favoriteRestaurantIds") {
      return "我的收藏";
    }
    // 💥 移除舊的 cuisineType 物件處理邏輯 (因為現在 cuisineType 應該是陣列)
    // 最終防護：如果 value 意外是物件，將其轉換為字串
    return String(value);
  };

  const renderFilterTags = useCallback(() => {
    const tags = [];
    const processedKeys = new Set();

    if (searchQuery) {
      tags.push(
        <span
          key="search-query"
          className="flex items-center bg-gray-300 text-gray-800 px-3 py-1 rounded-full whitespace-nowrap"
        >
          搜尋: &quot;{searchQuery}&quot;
          {/* 搜尋是全清除，所以保持 onClearFilters */}
          <button
            onClick={onClearFilters}
            className="ml-2 text-gray-600 hover:text-gray-900"
          >
            <FontAwesomeIcon icon={faTimesCircle} />
          </button>
        </span>
      );
    }

    for (const [key, value] of Object.entries(filters)) {
      if (processedKeys.has(key)) continue;

      // ⚡️ 處理收藏 (Array)
      if (
        key === "favoriteRestaurantIds" &&
        Array.isArray(value) &&
        value.length > 0
      ) {
        tags.push(
          <span
            key="favorite-restaurants"
            className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full whitespace-nowrap"
          >
            {getFilterLabel(key)}: 我的收藏
            <button
              onClick={() => onRemoveFilter(key)}
              className="ml-2 text-blue-600 hover:text-blue-900"
            >
              <FontAwesomeIcon icon={faTimesCircle} />
            </button>
          </span>
        );
        processedKeys.add(key);
        continue;
      }

      // ⚡️ 處理座位數 (Min/Max 聯動)
      if (key === "minSeatingCapacity" || key === "maxSeatingCapacity") {
        const min = filters.minSeatingCapacity;
        const max = filters.maxSeatingCapacity;
        let text = "";

        if (typeof min === "number" && typeof max === "number") {
          text = max === 9999 ? `${min}+ 人` : `${min}-${max} 人`;
        }

        if (text) {
          tags.push(
            <span
              key="seating-capacity"
              className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full whitespace-nowrap"
            >
              座位數: {text}
              <button
                // 只需移除其中一個 key，因為邏輯會同時處理 min 和 max
                onClick={() => {
                  onRemoveFilter("minSeatingCapacity");
                }}
                className="ml-2 text-blue-600 hover:text-blue-900"
              >
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            </span>
          );
        }
        processedKeys.add("minSeatingCapacity");
        processedKeys.add("maxSeatingCapacity");
        continue;
      }

      // ⚡️ 核心修正：處理所有多選列表 (包含 cuisineType, reservationModes, paymentMethods, facilities)
      if (Array.isArray(value) && value.length > 0) {
        value.forEach((val) => {
          // 確保陣列內的值是原始類型 (字串/數字)，並排除空值
          if (typeof val !== "string" && typeof val !== "number") return;
          if (val === undefined || val === null || val === "") return;

          tags.push(
            <span
              key={`${key}-${val}`}
              className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full whitespace-nowrap"
            >
              {`${getFilterLabel(key)}: ${String(val)}`}
              <button
                // 對於陣列，移除時需要傳入 key 和 value，讓父組件能從陣列中移除特定項
                onClick={() => onRemoveFilter(key, val)}
                className="ml-2 text-blue-600 hover:text-blue-900"
              >
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            </span>
          );
        });
        processedKeys.add(key);
        continue;
      }

      // 💥 移除對單個物件形式 cuisineType 的處理 (已淘汰)

      // 處理所有其他單值篩選器
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        // 排除 '所有省份' 和 0 (除非是 minRating=0，但通常不會有)
        value !== "所有省份" &&
        value !== 0 &&
        // 💥 確保單值也不是物件（例如 reservationDate/Time/partySize 可能是物件）
        typeof value !== "object"
      ) {
        tags.push(
          <span
            key={key}
            className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full whitespace-nowrap"
          >
            {`${getFilterLabel(key)}: ${getFilterValueText(key, value)}`}
            <button
              // 對於單值，只需要傳入 key
              onClick={() => onRemoveFilter(key)}
              className="ml-2 text-blue-600 hover:text-blue-900"
            >
              <FontAwesomeIcon icon={faTimesCircle} />
            </button>
          </span>
        );
      }
    }

    return tags;
  }, [filters, searchQuery, onClearFilters, onRemoveFilter]); // 依賴項保持不變

  return (
    <div className="h-full flex flex-col">
      {/* ... (頂部標題和清除按鈕邏輯不變) ... */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl px-3 font-bold text-gray-800">
          {hasFiltersOrSearch ? "搜尋/篩選結果" : "所有餐廳"}
        </h2>
        <div className="flex items-center space-x-4">
          {hasFiltersOrSearch && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center text-red-600 hover:text-red-800 transition duration-150"
            >
              <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
              清除所有篩選/搜尋
            </button>
          )}
          {toggleView && (
            <button
              onClick={toggleView}
              className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition duration-150"
              aria-label={isGridView ? "切換到列表視圖" : "切換到網格視圖"}
            >
              <FontAwesomeIcon
                icon={isGridView ? faList : faThLarge}
                className="text-xl"
              />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
        {renderFilterTags()}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : restaurants.length === 0 ? (
        <p className="text-center text-gray-600 text-lg mt-10 flex-grow">
          {hasFiltersOrSearch
            ? "沒有餐廳符合搜尋/篩選條件。"
            : "目前沒有餐廳資料。"}
        </p>
      ) : (
        <>
          <div
            className={
              isGridView
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
                : "flex flex-col space-y-4"
            }
          >
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                isGridView={isGridView}
                isFavorited={
                  currentUser?.favoriteRestaurants?.includes(restaurant.id) ||
                  false
                }
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RestaurantListPage;
