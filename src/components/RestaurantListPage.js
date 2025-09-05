// src/components/RestaurantListPage.js
"use client";

import React, { useState, useContext, useEffect, useCallback } from "react";
import { AuthContext } from "../lib/auth-context";
import { collection, query, onSnapshot } from "firebase/firestore";
import LoadingSpinner from "./LoadingSpinner";
import RestaurantCard from "./RestaurantCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThLarge,
  faList,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";

// ... (其他 Helper functions 和 mock data 保持不變) ...
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
  if (
    restaurant.businessHours?.includes(currentDayName) ||
    restaurant.businessHours?.includes("每日")
  ) {
    return "營業中";
  }
  return "休假中";
};

const isWithinTimeOfDay = (restaurant, timeOfDayFilter) => {
  if (!timeOfDayFilter || !restaurant.businessHours) return true;
  const now = new Date();
  const currentHour = now.getHours();
  if (timeOfDayFilter === "day") return currentHour >= 11 && currentHour < 17;
  if (timeOfDayFilter === "night") return currentHour >= 17 && currentHour < 22;
  return true;
};

const hasSufficientSeating = (restaurant, partySize) => {
  if (!partySize) return true;
  return (restaurant.seatingCapacity || 0) >= partySize;
};

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

  const IS_DEVELOPMENT_MODE = process.env.NODE_ENV === "development";
  const ENABLE_DEV_MOCK_DATA = false;

  const MOCK_RESTAURANTS = [
    {
      id: "mock-res-1",
      restaurantNameZh: "模擬餐廳一號",
      restaurantNameEn: "Mock Restaurant One",
      cuisineType: "中式",
      rating: 4.5,
      reviewCount: 120,
      province: "廣東省",
      city: "廣州市",
      fullAddress: "廣州市天河區模擬大道100號",
      description: "這是一個提供美味中餐的模擬餐廳。",
      imageUrl: "https://placehold.co/400x300/e0e0e0/333?text=Mock+Res+1",
      avgSpending: 150,
      seatingCapacity: 50,
      businessHours: "每日 11:00-22:00",
      reservationModes: ["線上預訂", "電話預訂"],
      paymentMethods: ["現金", "支付寶", "微信支付"],
      facilitiesServices: ["WIFI", "空調", "兒童椅"],
      isPermanentlyClosed: false,
      isTemporarilyClosed: false,
    },
    {
      id: "mock-res-2",
      restaurantNameZh: "模擬餐廳二號",
      restaurantNameEn: "Mock Restaurant Two",
      cuisineType: "西式",
      rating: 3.8,
      reviewCount: 75,
      province: "廣東省",
      city: "深圳市",
      fullAddress: "深圳市南山區模擬路200號",
      description: "提供精緻西餐和舒適環境的模擬餐廳。",
      imageUrl: "https://placehold.co/400x300/d0d0d0/444?text=Mock+Res+2",
      avgSpending: 280,
      seatingCapacity: 80,
      businessHours: "星期一至五 10:00-21:00",
      reservationModes: ["線上預訂"],
      paymentMethods: ["信用卡", "現金"],
      facilitiesServices: ["WIFI", "停車場"],
      isPermanentlyClosed: false,
      isTemporarilyClosed: false,
    },
    {
      id: "mock-res-3",
      restaurantNameZh: "模擬咖啡店",
      restaurantNameEn: "Mock Coffee Shop",
      cuisineType: "咖啡甜點",
      rating: 4.2,
      reviewCount: 200,
      province: "廣東省",
      city: "珠海市",
      fullAddress: "珠海市香洲區模擬街300號",
      description: "悠閒的咖啡時光。",
      imageUrl: "https://placehold.co/400x300/c0c0c0/555?text=Mock+Coffee",
      avgSpending: 80,
      seatingCapacity: 30,
      businessHours: "每日 08:00-23:00",
      reservationModes: [],
      paymentMethods: ["現金", "微信支付"],
      facilitiesServices: ["WIFI"],
      isPermanentlyClosed: false,
      isTemporarilyClosed: false,
    },
    {
      id: "mock-res-4",
      restaurantNameZh: "模擬日本料理",
      restaurantNameEn: "Mock Japanese Cuisine",
      cuisineType: "日式",
      rating: 4.8,
      reviewCount: 300,
      province: "廣東省",
      city: "廣州市",
      fullAddress: "廣州市越秀區模擬巷400號",
      description: "正宗日式料理體驗。",
      imageUrl: "https://placehold.co/400x300/b0b0b0/666?text=Mock+JP+Food",
      avgSpending: 350,
      seatingCapacity: 60,
      businessHours: "星期二至日 17:00-22:00",
      reservationModes: ["電話預訂"],
      paymentMethods: ["現金", "信用卡"],
      facilitiesServices: ["私人包廂"],
      isPermanentlyClosed: false,
      isTemporarilyClosed: true,
    },
    {
      id: "mock-res-5",
      restaurantNameZh: "模擬火鍋店",
      restaurantNameEn: "Mock Hotpot Place",
      cuisineType: "火鍋",
      rating: 4.0,
      reviewCount: 150,
      province: "四川省",
      city: "成都市",
      fullAddress: "成都市錦江區模擬街500號",
      description: "麻辣鮮香的火鍋。",
      imageUrl: "https://placehold.co/400x300/a0a0a0/777?text=Mock+Hotpot",
      avgSpending: 180,
      seatingCapacity: 100,
      businessHours: "每日 10:00-02:00",
      reservationModes: ["線上預訂"],
      paymentMethods: ["支付寶", "微信支付"],
      facilitiesServices: ["WIFI"],
      isPermanentlyClosed: true,
      isTemporarilyClosed: false,
    },
  ];

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
      if (filters.timeOfDay) {
        filtered = filtered.filter((r) =>
          isWithinTimeOfDay(r, filters.timeOfDay)
        );
      }
      if (filters.partySize) {
        filtered = filtered.filter((r) =>
          hasSufficientSeating(r, filters.partySize)
        );
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
    if (IS_DEVELOPMENT_MODE && ENABLE_DEV_MOCK_DATA) {
      console.log("--- DEV MODE: Using mock data, bypassing Firestore ---");
      const timer = setTimeout(() => {
        const filteredMockRestaurants =
          applyClientSideFilters(MOCK_RESTAURANTS);
        setRestaurants(filteredMockRestaurants);
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
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
  }, [
    db,
    appId,
    setModalMessage,
    IS_DEVELOPMENT_MODE,
    ENABLE_DEV_MOCK_DATA,
    applyClientSideFilters,
  ]);

  const handleToggleFavorite = async (restaurantId) => {
    if (IS_DEVELOPMENT_MODE && ENABLE_DEV_MOCK_DATA) {
      console.log(
        `--- DEV MODE: Mocking toggle favorite for ${restaurantId} ---`
      );
      return;
    }
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

  // 輔助函數：將篩選器鍵名轉換為中文標籤
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
      timeOfDay: "時段",
      partySize: "用餐人數",
    };
    return labels[key] || key;
  };

  // 輔助函數：獲取篩選器值的顯示文本
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
    // 處理座位數範圍顯示
    if (key === "minSeatingCapacity" && filters.maxSeatingCapacity) {
      if (filters.maxSeatingCapacity === 9999) {
        return `${value}+ 人`;
      }
      return `${value}-${filters.maxSeatingCapacity} 人`;
    }
    return value;
  };

  // 修正後的篩選標籤列表
  const renderFilterTags = () => {
    const tags = [];
    const processedKeys = new Set();

    // 處理搜尋關鍵字
    if (searchQuery) {
      tags.push(
        <span
          key="search-query"
          className="flex items-center bg-gray-300 text-gray-800 px-3 py-1 rounded-full whitespace-nowrap"
        >
          搜尋: &quot{searchQuery}&quot
          <button
            onClick={onClearFilters}
            className="ml-2 text-gray-600 hover:text-gray-900"
          >
            <FontAwesomeIcon icon={faTimesCircle} />
          </button>
        </span>
      );
    }

    // 迭代處理篩選器
    for (const [key, value] of Object.entries(filters)) {
      if (processedKeys.has(key)) continue;

      // 處理人均價錢範圍
      if (key === "minAvgSpending" || key === "maxAvgSpending") {
        const min = filters.minAvgSpending;
        const max = filters.maxAvgSpending;
        let text = "";
        if (min && max) {
          text = `$${min} - $${max}`;
        } else if (min) {
          text = `最低 $${min}`;
        } else if (max) {
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
      }
      // 處理座位數範圍
      else if (key === "minSeatingCapacity" || key === "maxSeatingCapacity") {
        const min = filters.minSeatingCapacity;
        const max = filters.maxSeatingCapacity;
        let text = "";
        if (min && max) {
          text = max === 9999 ? `${min}+ 人` : `${min}-${max} 人`;
        } else if (min) {
          text = `${min}+ 人`;
        } else if (max) {
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
                onClick={() => onRemoveFilter("minSeatingCapacity")}
                className="ml-2 text-blue-600 hover:text-blue-900"
              >
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            </span>
          );
        }
        processedKeys.add("minSeatingCapacity");
        processedKeys.add("maxSeatingCapacity");
      }
      // 處理多選
      else if (Array.isArray(value) && value.length > 0) {
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
      }
      // 處理單選（包括最低評分）
      else if (value && typeof value !== "object") {
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
  };

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
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
      {/* 呼叫 renderFilterTags 函數來顯示標籤 */}
      <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
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
