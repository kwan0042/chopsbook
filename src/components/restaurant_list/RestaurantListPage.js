// src/components/RestaurantListPage.js
"use client";

import React, { useState, useContext, useEffect, useCallback } from "react";
import { AuthContext } from "../../lib/auth-context";
import { collection, query, onSnapshot } from "firebase/firestore";
import LoadingSpinner from "../LoadingSpinner";
import RestaurantCard from "./RestaurantCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThLarge,
  faList,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";

// Helper functions
const normalizeString = (str) => {
  if (typeof str !== "string") return "";
  return str.toLowerCase().replace(/\s/g, "");
};

const getOperatingStatus = (restaurant) => {
  if (restaurant.isPermanentlyClosed) return "已結業";
  if (restaurant.isTemporarilyClosed) return "暫時休業";

  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayNames = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  const currentDayName = dayNames[dayOfWeek];

  const businessHoursArray = Array.isArray(restaurant.businessHours)
    ? restaurant.businessHours
    : [];

  const todayHours = businessHoursArray.find(
    (item) => item.day === currentDayName
  );

  if (todayHours?.isOpen) {
    const now = new Date();
    let currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] = todayHours.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = todayHours.endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
      if (currentMinutes < startMinutes) {
        currentMinutes += 24 * 60;
      }
    }

    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return "營業中";
    }
  }

  return "休假中";
};

// 修正後的用餐日期篩選邏輯，處理時區問題
const isDateWithinOperatingDays = (restaurant, reservationDate) => {
  if (!reservationDate) return true;
  if (restaurant.isPermanentlyClosed || restaurant.isTemporarilyClosed) {
    return false;
  }

  // 創建日期物件時，將其設為當日開始，以避免時區偏移
  const date = new Date(reservationDate + "T00:00:00");
  const dayOfWeek = date.getDay();
  const dayNames = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  const dayName = dayNames[dayOfWeek];

  const businessHoursArray = Array.isArray(restaurant.businessHours)
    ? restaurant.businessHours
    : [];

  const operatingDay = businessHoursArray.find((item) => item.day === dayName);

  return operatingDay?.isOpen || false;
};

const isTimeWithinOperatingHours = (
  restaurant,
  reservationTime,
  reservationDate
) => {
  if (!reservationTime || !reservationDate) return true;

  const date = new Date(reservationDate + "T00:00:00");
  const dayOfWeek = date.getDay();
  const dayNames = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  const dayName = dayNames[dayOfWeek];

  const businessHoursArray = Array.isArray(restaurant.businessHours)
    ? restaurant.businessHours
    : [];

  const operatingDay = businessHoursArray.find((item) => item.day === dayName);

  if (!operatingDay || !operatingDay.isOpen) return false;

  let requestedMinutes =
    parseInt(reservationTime.split(":")[0], 10) * 60 +
    parseInt(reservationTime.split(":")[1], 10);

  const [startHour, startMinute] = operatingDay.startTime
    .split(":")
    .map(Number);
  const [endHour, endMinute] = operatingDay.endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
    if (requestedMinutes < startMinutes) {
      requestedMinutes += 24 * 60;
    }
  }

  return requestedMinutes >= startMinutes && requestedMinutes <= endMinutes;
};

const hasSufficientSeating = (restaurant, partySize) => {
  if (!partySize || isNaN(partySize)) return true; // 如果沒有輸入或輸入無效，則不過濾

  // 檢查餐廳的 seatingCapacity 屬性是否存在
  if (!restaurant.seatingCapacity) {
    return false; // 如果沒有座位數資訊，則不符合
  }

  const capacityStr = restaurant.seatingCapacity;
  let min = 0;
  let max = Infinity;

  if (capacityStr.includes("+")) {
    min = parseInt(capacityStr.replace("+", ""), 10);
    max = Infinity; // 表示無上限
  } else if (capacityStr.includes("-")) {
    const parts = capacityStr.split("-");
    min = parseInt(parts[0], 10);
    max = parseInt(parts[1], 10);
  } else {
    // 處理單一數字的情況，例如 "20"
    min = parseInt(capacityStr, 10);
    max = min;
  }

  // 檢查使用者輸入的人數是否在餐廳的座位範圍內
  return partySize >= min && partySize <= max;
};

// -----------------------------------------------------------------------------

const RestaurantListPage = ({
  filters = {},
  onClearFilters,
  onRemoveFilter,
  searchQuery = "",
  isGridView,
  toggleView,
}) => {
  const { db, currentUser, appId, toggleFavoriteRestaurant, setModalMessage } =
    useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 9;
  const [currentPage, setCurrentPage] = useState(1);

  const applyClientSideFilters = useCallback(
    (fetchedRestaurants) => {
      let filtered = [...fetchedRestaurants];
      if (filters.province && filters.province !== "所有省份") {
        filtered = filtered.filter((r) =>
          normalizeString(r.province || "").includes(
            normalizeString(filters.province)
          )
        );
      }
      if (filters.city) {
        filtered = filtered.filter((r) =>
          normalizeString(r.city || "").includes(normalizeString(filters.city))
        );
      }
      if (filters.category && filters.category.length > 0) {
        filtered = filtered.filter((r) =>
          filters.category.includes(r.cuisineType)
        );
      }
      if (filters.minAvgSpending !== undefined) {
        filtered = filtered.filter(
          (r) => (r.avgSpending || 0) >= filters.minAvgSpending
        );
      }
      if (filters.maxAvgSpending !== undefined) {
        filtered = filtered.filter(
          (r) => (r.avgSpending || 0) <= filters.maxAvgSpending
        );
      }
      if (filters.minRating > 0) {
        filtered = filtered.filter((r) => (r.rating || 0) >= filters.minRating);
      }
      if (
        filters.minSeatingCapacity !== undefined &&
        filters.maxSeatingCapacity !== undefined
      ) {
        filtered = filtered.filter(
          (r) =>
            (r.seatingCapacity || 0) >= filters.minSeatingCapacity &&
            (r.seatingCapacity || 0) <= filters.maxSeatingCapacity
        );
      }
      if (filters.businessHours) {
        filtered = filtered.filter(
          (r) => getOperatingStatus(r) === filters.businessHours
        );
      }
      if (filters.reservationModes && filters.reservationModes.length > 0) {
        filtered = filtered.filter((r) =>
          filters.reservationModes.some((mode) =>
            r.reservationModes?.includes(mode)
          )
        );
      }
      if (filters.paymentMethods && filters.paymentMethods.length > 0) {
        filtered = filtered.filter((r) =>
          filters.paymentMethods.some((method) =>
            r.paymentMethods?.includes(method)
          )
        );
      }
      if (filters.facilities && filters.facilities.length > 0) {
        filtered = filtered.filter((r) =>
          filters.facilities.every((facility) =>
            r.facilitiesServices?.includes(facility)
          )
        );
      }

      if (filters.reservationDate) {
        filtered = filtered.filter((r) =>
          isDateWithinOperatingDays(r, filters.reservationDate)
        );
      }
      if (filters.reservationTime && filters.reservationDate) {
        filtered = filtered.filter((r) =>
          isTimeWithinOperatingHours(
            r,
            filters.reservationTime,
            filters.reservationDate
          )
        );
      }
      if (filters.partySize) {
        const partySize = parseInt(filters.partySize, 10);
        if (!isNaN(partySize) && partySize > 0) {
          filtered = filtered.filter((r) => hasSufficientSeating(r, partySize));
        }
      }

      if (searchQuery) {
        const normalizedSearchQuery = normalizeString(searchQuery);
        filtered = filtered.filter((r) => {
          const nameZh = normalizeString(r.restaurantNameZh || "");
          const nameEn = normalizeString(r.restaurantNameEn || "");
          const cuisine = normalizeString(r.cuisineType || "");
          const address = normalizeString(r.fullAddress || "");
          return (
            nameZh.includes(normalizedSearchQuery) ||
            nameEn.includes(normalizedSearchQuery) ||
            cuisine.includes(normalizedSearchQuery) ||
            address.includes(normalizedSearchQuery)
          );
        });
      }
      return filtered;
    },
    [filters, searchQuery]
  );

  useEffect(() => {
    setLoading(true);
    setCurrentPage(1);
    if (!db || !appId) {
      console.warn("Firestore DB or App ID not available.");
      setLoading(false);
      return;
    }
    const collectionPath = `artifacts/${appId}/public/data/restaurants`;
    const q = query(collection(db, collectionPath));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedRestaurants = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          reviewCount: doc.data().reviewCount || 0,
          rating: doc.data().rating || 0,
        }));
        const filteredRestaurants = applyClientSideFilters(fetchedRestaurants);
        setRestaurants(filteredRestaurants);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch restaurant data:", error);
        setModalMessage(`獲取餐廳資料失敗: ${error.message}`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db, appId, setModalMessage, applyClientSideFilters]);

  const handleToggleFavorite = async (restaurantId) => {
    try {
      await toggleFavoriteRestaurant(restaurantId);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

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
      category: "菜系",
      minAvgSpending: "人均消費",
      maxAvgSpending: "人均消費",
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

      if (key === "minAvgSpending" || key === "maxAvgSpending") {
        const min = filters.minAvgSpending;
        const max = filters.maxAvgSpending;
        let text = "";
        if (min !== undefined && max !== undefined) {
          text = `$${min} - $${max}`;
        } else if (min !== undefined) {
          text = `最低 $${min}`;
        } else if (max !== undefined) {
          text = `最高 $${max}`;
        }
        if (text) {
          tags.push(
            <span
              key="avg-spending"
              className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full whitespace-nowrap"
            >
              人均消費: {text}
              <button
                onClick={() => onRemoveFilter("minAvgSpending")}
                className="ml-2 text-blue-600 hover:text-blue-900"
              >
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            </span>
          );
        }
        processedKeys.add("minAvgSpending");
        processedKeys.add("maxAvgSpending");
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
                  onRemoveFilter("maxSeatingCapacity");
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
        typeof value !== "object"
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

  const totalPages = Math.ceil(restaurants.length / itemsPerPage);
  const indexOfLastRestaurant = currentPage * itemsPerPage;
  const indexOfFirstRestaurant = indexOfLastRestaurant - itemsPerPage;
  const currentRestaurants = restaurants.slice(
    indexOfFirstRestaurant,
    indexOfLastRestaurant
  );

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  return (
    <div className="flex-grow">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl px-3 font-bold text-gray-800">
          {hasFiltersOrSearch ? "搜尋/篩選結果" : "所有餐廳"}
          {restaurants.length > 0 && ` (${restaurants.length} 間)`}
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
        <p className="text-center text-gray-600 text-lg mt-10">
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
            {currentRestaurants.map((restaurant) => (
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
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 transition duration-150"
              >
                上一頁
              </button>
              <span className="text-lg font-medium text-gray-700">
                頁 {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 transition duration-150"
              >
                下一頁
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RestaurantListPage;
