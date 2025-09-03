// src/components/RestaurantListPage.js
"use client";

import React, { useState, useContext, useEffect, useCallback } from "react"; // Added useCallback
import { AuthContext } from "../lib/auth-context";
import { collection, query, onSnapshot } from "firebase/firestore"; // Ensure all necessary Firestore functions are imported
import LoadingSpinner from "./LoadingSpinner";
import RestaurantCard from "./RestaurantCard"; // Import RestaurantCard
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThLarge,
  faList,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Helper function: Normalizes a string for case-insensitive and space-agnostic searching.
 * @param {string} str - The original string.
 * @returns {string} The normalized string.
 */
const normalizeString = (str) => {
  if (typeof str !== "string") return "";
  return str.toLowerCase().replace(/\s/g, "");
};

/**
 * Helper function: Determines the operating status of a restaurant based on business hours and custom statuses.
 * This is a simplified determination; actual applications would require more precise business hour parsing.
 * @param {object} restaurant - The restaurant data object.
 * @returns {string} The operating status string (營業中, 暫時休業, 休假中, 已結業).
 */
const getOperatingStatus = (restaurant) => {
  if (restaurant.isPermanentlyClosed) {
    return "已結業";
  }
  if (restaurant.isTemporarilyClosed) {
    return "暫時休業";
  }

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
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

  if (restaurant.businessHours) {
    // This performs a simple string inclusion check to see if today's day of the week is mentioned in the business hours string.
    // A more precise determination would require parsing specific time slots.
    if (
      restaurant.businessHours.includes(currentDayName) ||
      restaurant.businessHours.includes("每日")
    ) {
      return "營業中";
    }
  }
  return "休假中"; // Default if no specific hours or not open today
};

/**
 * RestaurantListPage: Displays a list of restaurants fetched from Firestore,
 * and can be filtered based on search keywords. Now includes list/grid view toggle functionality
 * and pagination.
 * @param {object} props - Component properties.
 * @param {object} props.filters - An object containing filter conditions (e.g., region, cuisineType, priceRange, specialConditions, minRating).
 * @param {function} props.onClearFilters - Callback to clear filters and return to the home page.
 * @param {string} props.searchQuery - The search keyword used to filter restaurants.
 * @param {boolean} props.isGridView - Controls whether to display as a grid view.
 * @param {function} props.toggleView - Callback function to toggle the view.
 */
const RestaurantListPage = ({
  filters = {},
  onClearFilters,
  searchQuery = "",
  isGridView,
  toggleView,
}) => {
  const { db, currentUser, appId, toggleFavoriteRestaurant, setModalMessage } =
    useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]); // All fetched and filtered restaurants
  const [loading, setLoading] = useState(true);

  // --- 開發模式設定 ---
  const IS_DEVELOPMENT_MODE = process.env.NODE_ENV === "development";
  // 將此設定為 true 以啟用模擬數據，跳過 Firebase 連接
  const ENABLE_DEV_MOCK_DATA = false;
  // --- 開發模式設定結束 ---

  // --- Mock Restaurant Data ---
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
      isTemporarilyClosed: true, // 暫時休業
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
      isPermanentlyClosed: true, // 已結業
      isTemporarilyClosed: false,
    },
  ];
  // --- End Mock Restaurant Data ---

  // --- Pagination states ---
  const itemsPerPage = 9;
  const [currentPage, setCurrentPage] = useState(1);
  // --- End Pagination states ---

  // Effect 1: Fetches all restaurant data and applies filter and search logic
  // This effect now combines data fetching and client-side filtering.
  useEffect(() => {
    setLoading(true); // Set loading true at the start of fetch/filter cycle

    // --- 開發模式模擬數據邏輯 ---
    if (IS_DEVELOPMENT_MODE && ENABLE_DEV_MOCK_DATA) {
      console.log(
        "--- DEV MODE: Using mock restaurant data, bypassing Firestore ---"
      );
      // 使用 setTimeout 模擬網絡延遲
      const timer = setTimeout(() => {
        let filteredMockRestaurants = [...MOCK_RESTAURANTS];

        // 應用所有的篩選和搜尋邏輯到模擬數據
        // Province filter
        if (filters.province && filters.province !== "所有省份") {
          filteredMockRestaurants = filteredMockRestaurants.filter(
            (restaurant) =>
              normalizeString(restaurant.province || "").includes(
                normalizeString(filters.province)
              )
          );
        }
        // City filter
        if (filters.city) {
          filteredMockRestaurants = filteredMockRestaurants.filter(
            (restaurant) =>
              normalizeString(restaurant.city || "").includes(
                normalizeString(filters.city)
              )
          );
        }
        // Category (CuisineType) filter
        if (filters.category && filters.category.length > 0) {
          filteredMockRestaurants = filteredMockRestaurants.filter(
            (restaurant) => filters.category.includes(restaurant.cuisineType)
          );
        }

        // Min Average Spending
        if (filters.minAvgSpending !== undefined) {
          filteredMockRestaurants = filteredMockRestaurants.filter(
            (restaurant) =>
              (restaurant.avgSpending || 0) >= filters.minAvgSpending
          );
        }
        // Max Average Spending
        if (filters.maxAvgSpending !== undefined) {
          filteredMockRestaurants = filteredMockRestaurants.filter(
            (restaurant) =>
              (restaurant.avgSpending || 0) <= filters.maxAvgSpending
          );
        }

        // Min Seating Capacity
        if (
          filters.minSeatingCapacity !== undefined &&
          filters.maxSeatingCapacity !== undefined
        ) {
          filteredMockRestaurants = filteredMockRestaurants.filter(
            (restaurant) =>
              (restaurant.seatingCapacity || 0) >= filters.minSeatingCapacity &&
              (restaurant.seatingCapacity || 0) <= filters.maxSeatingCapacity
          );
        }

        // Min Rating
        if (filters.minRating && filters.minRating > 0) {
          filteredMockRestaurants = filteredMockRestaurants.filter(
            (restaurant) => (restaurant.rating || 0) >= filters.minRating
          );
        }

        // Business Hours (Operating Status) filter
        if (filters.businessHours) {
          filteredMockRestaurants = filteredMockRestaurants.filter(
            (restaurant) => {
              const status = getOperatingStatus(restaurant);
              // Translate the filter value if needed to match getOperatingStatus output
              let filterStatus = filters.businessHours;
              if (filterStatus === "營業中") filterStatus = "營業中";
              else if (filterStatus === "休假中") filterStatus = "休假中";
              else if (filterStatus === "暫時休業") filterStatus = "暫時休業";
              else if (filterStatus === "已結業") filterStatus = "已結業";

              return filterStatus === status;
            }
          );
        }

        // Reservation Modes filter (multi-select: must have at least one selected mode)
        if (filters.reservationModes && filters.reservationModes.length > 0) {
          filteredMockRestaurants = filteredMockRestaurants.filter(
            (restaurant) =>
              filters.reservationModes.some((mode) =>
                restaurant.reservationModes?.includes(mode)
              )
          );
        }

        // Payment Methods filter (multi-select: must have at least one selected method)
        if (filters.paymentMethods && filters.paymentMethods.length > 0) {
          filteredMockRestaurants = filteredMockRestaurants.filter(
            (restaurant) =>
              filters.paymentMethods.some((method) =>
                restaurant.paymentMethods?.includes(method)
              )
          );
        }

        // Facilities/Services filter (multi-select: must have ALL selected facilitiesServices)
        if (filters.facilitiesServicesServices && filters.facilitiesServices.length > 0) {
          filteredMockRestaurants = filteredMockRestaurants.filter(
            (restaurant) =>
              filters.facilitiesServices.every((facility) =>
                restaurant.facilitiesServices?.includes(facility)
              )
          );
        }

        // Search Query filter (applies to multiple fields)
        if (searchQuery) {
          const normalizedSearchQuery = normalizeString(searchQuery);
          filteredMockRestaurants = filteredMockRestaurants.filter(
            (restaurant) => {
              const nameZh = normalizeString(restaurant.restaurantNameZh || "");
              const nameEn = normalizeString(restaurant.restaurantNameEn || "");
              const cuisine = normalizeString(restaurant.cuisineType || "");
              const address = normalizeString(restaurant.fullAddress || "");

              return (
                nameZh.includes(normalizedSearchQuery) ||
                nameEn.includes(normalizedSearchQuery) ||
                cuisine.includes(normalizedSearchQuery) ||
                address.includes(normalizedSearchQuery)
              );
            }
          );
        }

        setRestaurants(filteredMockRestaurants);
        setLoading(false);
        setCurrentPage(1); // Reset to first page when filters/search change
      }, 500); // 模擬 500ms 的網絡延遲

      return () => clearTimeout(timer); // 清理定時器
    }
    // --- 開發模式模擬數據邏輯結束 ---

    // --- 正常 Firebase 數據獲取邏輯 (當ENABLE_DEV_MOCK_DATA為false或非開發模式時執行) ---
    if (!db) {
      if (!appId || !db) {
        console.warn(
          "Firestore DB or App ID not available. Cannot fetch restaurants."
        );
        // setModalMessage("未能連接到數據庫。請檢查設定。"); // AuthContext 已經處理了 db 為 null 的情況，避免重複顯示
        setLoading(false);
      }
      return;
    }

    let q = collection(db, `artifacts/${appId}/public/data/restaurants`);

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        let fetchedRestaurants = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Ensure reviewCount is present, default to 0 if not
          reviewCount: doc.data().reviewCount || 0,
          // Ensure rating is present, default to 0 if not
          rating: doc.data().rating || 0,
        }));

        // --- Client-side in-memory filtering logic (unchanged) ---
        // Province filter
        if (filters.province && filters.province !== "所有省份") {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            normalizeString(restaurant.province || "").includes(
              normalizeString(filters.province)
            )
          );
        }
        // City filter
        if (filters.city) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            normalizeString(restaurant.city || "").includes(
              normalizeString(filters.city)
            )
          );
        }
        // Category (CuisineType) filter
        if (filters.category && filters.category.length > 0) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            filters.category.includes(restaurant.cuisineType)
          );
        }

        // Min Average Spending
        if (filters.minAvgSpending !== undefined) {
          fetchedRestaurants = fetchedRestaurants.filter(
            (restaurant) =>
              (restaurant.avgSpending || 0) >= filters.minAvgSpending
          );
        }
        // Max Average Spending
        if (filters.maxAvgSpending !== undefined) {
          fetchedRestaurants = fetchedRestaurants.filter(
            (restaurant) =>
              (restaurant.avgSpending || 0) <= filters.maxAvgSpending
          );
        }

        // Min Seating Capacity
        if (
          filters.minSeatingCapacity !== undefined &&
          filters.maxSeatingCapacity !== undefined
        ) {
          fetchedRestaurants = fetchedRestaurants.filter(
            (restaurant) =>
              (restaurant.seatingCapacity || 0) >= filters.minSeatingCapacity &&
              (restaurant.seatingCapacity || 0) <= filters.maxSeatingCapacity
          );
        }

        // Min Rating
        if (filters.minRating && filters.minRating > 0) {
          fetchedRestaurants = fetchedRestaurants.filter(
            (restaurant) => (restaurant.rating || 0) >= filters.minRating
          );
        }

        // Business Hours (Operating Status) filter
        if (filters.businessHours) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) => {
            const status = getOperatingStatus(restaurant);
            // Translate the filter value if needed to match getOperatingStatus output
            let filterStatus = filters.businessHours;
            if (filterStatus === "營業中") filterStatus = "營業中";
            else if (filterStatus === "休假中") filterStatus = "休假中";
            else if (filterStatus === "暫時休業") filterStatus = "暫時休業";
            else if (filterStatus === "已結業") filterStatus = "已結業";

            return filterStatus === status;
          });
        }

        // Reservation Modes filter (multi-select: must have at least one selected mode)
        if (filters.reservationModes && filters.reservationModes.length > 0) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            filters.reservationModes.some((mode) =>
              restaurant.reservationModes?.includes(mode)
            )
          );
        }

        // Payment Methods filter (multi-select: must have at least one selected method)
        if (filters.paymentMethods && filters.paymentMethods.length > 0) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            filters.paymentMethods.some((method) =>
              restaurant.paymentMethods?.includes(method)
            )
          );
        }

        // Facilities/Services filter (multi-select: must have ALL selected facilitiesServices)
        if (filters.facilitiesServices && filters.facilitiesServices.length > 0) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            filters.facilitiesServices.every((facility) =>
              restaurant.facilitiesServices?.includes(facility)
            )
          );
        }

        // Search Query filter (applies to multiple fields)
        if (searchQuery) {
          const normalizedSearchQuery = normalizeString(searchQuery);
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) => {
            const nameZh = normalizeString(restaurant.restaurantNameZh || "");
            const nameEn = normalizeString(restaurant.restaurantNameEn || "");
            const cuisine = normalizeString(restaurant.cuisineType || "");
            const address = normalizeString(restaurant.fullAddress || "");

            return (
              nameZh.includes(normalizedSearchQuery) ||
              nameEn.includes(normalizedSearchQuery) ||
              cuisine.includes(normalizedSearchQuery) ||
              address.includes(normalizedSearchQuery)
            );
          });
        }

        setRestaurants(fetchedRestaurants);
        setLoading(false);
        setCurrentPage(1); // Reset to first page when filters/search change
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
    JSON.stringify(filters),
    searchQuery,
    setModalMessage,
    IS_DEVELOPMENT_MODE,
    ENABLE_DEV_MOCK_DATA,
  ]); // 添加新的依賴項

  /**
   * Handles the logic for favoriting/unfavoriting a restaurant.
   * Now directly calls the toggleFavoriteRestaurant function provided by AuthContext.
   * @param {string} restaurantId - The ID of the restaurant to favorite or unfavorite.
   */
  const handleToggleFavorite = async (restaurantId) => {
    // 在模擬模式下，可以選擇性地模擬收藏行為，或者簡單地不執行任何操作。
    // 這裡我們選擇在模擬模式下直接返回，不嘗試連接 Firebase。
    if (IS_DEVELOPMENT_MODE && ENABLE_DEV_MOCK_DATA) {
      console.log(
        `--- DEV MODE: Mocking toggle favorite for ${restaurantId} (no Firebase interaction) ---`
      );
      // 可選：在這裡添加模擬的狀態更新邏輯，以在 UI 上反映收藏狀態
      // 例如：
      // setCurrentUser(prevUser => {
      //     const isCurrentlyFavorited = prevUser?.favoriteRestaurants?.includes(restaurantId);
      //     if (isCurrentlyFavorited) {
      //         return { ...prevUser, favoriteRestaurants: prevUser.favoriteRestaurants.filter(id => id !== restaurantId) };
      //     } else {
      //         return { ...prevUser, favoriteRestaurants: [...(prevUser?.favoriteRestaurants || []), restaurantId] };
      //     }
      // });
      return;
    }

    try {
      await toggleFavoriteRestaurant(restaurantId);
    } catch (error) {
      // Error message is already handled by AuthContext's setModalMessage
      console.error("Failed to toggle favorite:", error); // Log error for debugging
    }
  };

  // Check if any filters or search query are active for the "Clear All" button
  const hasFiltersOrSearch =
    Object.values(filters).some(
      (value) =>
        (Array.isArray(value) && value.length > 0) ||
        (!Array.isArray(value) &&
          value &&
          value !== "0" && // For number inputs, 0 might be a valid filter
          value !== "所有省份" && // Specific default for province
          value !== "" &&
          value !== null && // Handle null values
          value !== undefined) // Handle undefined values
    ) || searchQuery.length > 0;

  // --- Pagination Logic ---
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
  // --- End Pagination Logic ---

  return (
    <div className="py-6 flex-1">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {hasFiltersOrSearch ? "搜尋/篩選結果" : "所有餐廳"}
          {restaurants.length > 0 && ` (${restaurants.length} 間)`}{" "}
          {/* Display count */}
        </h2>
        <div className="flex items-center space-x-4">
          {/* Clear Filter/Search button, only shown if filters or search are active */}
          {hasFiltersOrSearch && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center text-red-600 hover:text-red-800 transition duration-150"
            >
              <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
              清除所有篩選/搜尋
            </button>
          )}
          {/* Toggle View button, always shown */}
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
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6" // 修改為 xl:grid-cols-3
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
                } // Get favorite status from currentUser
                onToggleFavorite={handleToggleFavorite} // Pass favorite toggle function
              />
            ))}
          </div>

          {/* Pagination Controls */}
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
