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

  // 移除客戶端分頁狀態和邏輯
  // const itemsPerPage = 9;
  // const [currentPage, setCurrentPage] = useState(1);
  // const totalPages = Math.ceil(restaurants.length / itemsPerPage);
  // const indexOfLastRestaurant = currentPage * itemsPerPage;
  // const indexOfFirstRestaurant = indexOfLastRestaurant - itemsPerPage;
  // const currentRestaurants = restaurants.slice(
  //   indexOfFirstRestaurant,
  //   indexOfLastRestaurant
  // );

  const handleToggleFavorite = async (restaurantId) => {
    try {
      await toggleFavoriteRestaurant(restaurantId);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  // 移除分頁按鈕處理函數
  // const handleNextPage = useCallback(() => {
  //   setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  // }, [totalPages]);

  // const handlePrevPage = useCallback(() => {
  //   setCurrentPage((prev) => Math.max(prev - 1, 1));
  // }, []);

  const hasFiltersOrSearch =
    Object.values(filters).some(
      (value) =>
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === "object" &&
          value !== null &&
          Object.keys(value).length > 0) ||
        (typeof value === "string" &&
          value !== "" &&
          value !== "0" &&
          value !== "所有省份") ||
        (typeof value === "number" && value > 0)
    ) || searchQuery.length > 0;

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
      restaurantType:"餐廳類型 "
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
    if (key === "timeOfDay") {
      return value === "day" ? "日間" : "晚間";
    }
    if (key === "partySize") {
      return `${value} 人`;
    }
    if (key === "reservationDate") {
      return value;
    }
    if (key === "reservationTime") {
      return value;
    }
    if (key === "minSeatingCapacity" && filters.maxSeatingCapacity) {
      if (filters.maxSeatingCapacity === 9999) {
        return `${value}+ 人`;
      }
      return `${value}-${filters.maxSeatingCapacity} 人`;
    }
    if (key === "favoriteRestaurantIds") {
      return "我的收藏";
    }
    return value;
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
          <button
            onClick={onClearFilters} // 這裡保持呼叫 onClearFilters
            className="ml-2 text-gray-600 hover:text-gray-900"
          >
            <FontAwesomeIcon icon={faTimesCircle} />
          </button>
        </span>
      );
    }

    for (const [key, value] of Object.entries(filters)) {
      if (processedKeys.has(key)) continue;

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
      } else if (key === "minSeatingCapacity" || key === "maxSeatingCapacity") {
        const min = filters.minSeatingCapacity;
        const max = filters.maxSeatingCapacity;
        let text = "";
        if (min !== undefined && max !== undefined) {
          text = max === 9999 ? `${min}+ 人` : `${min}-${max} 人`;
        } else if (min !== undefined) {
          text = `${min}+ 人`;
        } else if (max !== undefined) {
          text = `最多 ${max} 人`;
        }
        if (text) {
          tags.push(
            <span
              key="seating-capacity"
              className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full whitespace-nowrap"
            >
              座位數: {text}
              <button
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
      } else if (Array.isArray(value) && value.length > 0) {
        value.forEach((val) => {
          tags.push(
            <span
              key={`${key}-${val}`}
              className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full whitespace-nowrap"
            >
              {/* 這裡的 key 可能是 cuisineType、reservationModes 等 */}
              {`${getFilterLabel(key)}: ${val}`}
              <button
                onClick={() => onRemoveFilter(key, val)}
                className="ml-2 text-blue-600 hover:text-blue-900"
              >
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            </span>
          );
        });
      } else if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        typeof value !== "object" &&
        value !== "所有省份" &&
        value !== 0
      ) {
        tags.push(
          <span
            key={key}
            className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full whitespace-nowrap"
          >
            {`${getFilterLabel(key)}: ${getFilterValueText(key, value)}`}
            <button
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
  }, [filters, searchQuery, onClearFilters, onRemoveFilter]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl px-3 font-bold text-gray-800">
          {hasFiltersOrSearch ? "搜尋/篩選結果" : "所有餐廳"}
          {/* 由於現在只顯示部分餐廳，故移除總數顯示 */}
          {/* {restaurants &&
            restaurants.length > 0 &&
            ` (${restaurants.length} 間)`} */}
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
            {/* 直接渲染從父組件傳遞來的餐廳列表 */}
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
