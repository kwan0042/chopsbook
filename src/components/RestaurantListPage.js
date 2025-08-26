// src/components/RestaurantListPage.js
"use client";

import React, { useState, useContext, useEffect } from "react";
// 請務必確認 '../lib/auth-context' 的路徑和檔名 (auth-context.js) 完全正確，注意大小寫
import { AuthContext } from "../lib/auth-context";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  getDocs, // 引入 getDocs 用於獲取評論數量
  where, // 引入 where 用於查詢評論
} from "firebase/firestore"; // 確保引入所有需要的 Firestore 函數
// 請務必確認 './LoadingSpinner' 的路徑和檔名 (LoadingSpinner.js) 完全正確，注意大小寫
import LoadingSpinner from "./LoadingSpinner";
// 請務必確認 './Modal' 的路徑和檔名 (Modal.js) 完全正確，注意大小寫
// AuthContext 已處理全局 Modal，此處不再需要直接導入並渲染 Modal
// import Modal from "./Modal";

import RestaurantCard from "./RestaurantCard"; // 導入 RestaurantCard

/**
 * 輔助函數：正規化字串，用於不區分大小寫和空格的搜尋。
 * @param {string} str - 原始字串。
 * @returns {string} 經過正規化處理的字串。
 */
const normalizeString = (str) => {
  if (typeof str !== "string") return "";
  return str.toLowerCase().replace(/\s/g, "");
};

/**
 * 輔助函數：根據營業時間和自定義狀態判斷餐廳營業狀態。
 * 這是一個簡化判斷，實際應用需要更精確的營業時間解析。
 * @param {object} restaurant - 餐廳資料物件。
 * @returns {string} 營業狀態字串 (營業中, 暫時休業, 休假中, 已結業)。
 */
const getOperatingStatus = (restaurant) => {
  if (restaurant.isPermanentlyClosed) {
    return "已結業";
  }
  if (restaurant.isTemporarilyClosed) {
    return "暫時休業";
  }

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = 星期日, 1 = 星期一, ..., 6 = 星期六
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
    // 這裡只做一個簡單的字串包含判斷，判斷今天的星期是否在營業時間字串中被提及。
    // 更精確的判斷需要解析具體時間段。
    if (
      restaurant.businessHours.includes(currentDayName) ||
      restaurant.businessHours.includes("每日")
    ) {
      return "營業中";
    }
  }
  return "休假中";
};

/**
 * RestaurantListPage: 顯示從 Firestore 獲取的餐廳列表，
 * 並可根據搜尋關鍵字進行篩選。現在新增了列表/網格視圖切換功能。
 * @param {object} props - 組件屬性。
 * @param {object} props.filters - 一個包含篩選條件的物件 (例如：region, cuisineType, priceRange, specialConditions, minRating)。
 * @param {function} props.onClearFilters - 清除篩選並返回主頁的回調。
 * @param {string} props.searchQuery - 用於篩選餐廳的搜尋關鍵字。
 * @param {boolean} props.isGridView - 控制是否顯示為網格視圖。
 * @param {function} props.toggleView - 切換視圖的回調函數。
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
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = currentUser?.uid || "anonymous";

  // Effect 1: 獲取所有餐廳資料並應用篩選和搜尋邏輯
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    let q = collection(db, `artifacts/${appId}/public/data/restaurants`);

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        // Make this async to allow await inside
        let fetchedRestaurants = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // --- 客戶端記憶體內篩選邏輯 ---
        if (filters.cuisineType && filters.cuisineType !== "選擇菜系") {
          fetchedRestaurants = fetchedRestaurants.filter(
            (restaurant) => restaurant.cuisineType === filters.cuisineType
          );
        }
        if (filters.priceRange && filters.priceRange !== "0") {
          let maxAvgSpending = parseInt(filters.priceRange, 10);
          if (maxAvgSpending > 0 && maxAvgSpending !== 9999) {
            fetchedRestaurants = fetchedRestaurants.filter(
              (restaurant) =>
                restaurant.avgSpending &&
                restaurant.avgSpending <= maxAvgSpending
            );
          }
        }
        if (filters.minRating && filters.minRating > 0) {
          fetchedRestaurants = fetchedRestaurants.filter(
            (restaurant) => restaurant.rating >= filters.minRating
          );
        }
        if (filters.city) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            normalizeString(restaurant.city || "").includes(
              normalizeString(filters.city)
            )
          );
        }
        if (filters.province && filters.province !== "選擇省份") {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            normalizeString(restaurant.province || "").includes(
              normalizeString(filters.province)
            )
          );
        }
        if (
          filters.facilitiesServices &&
          filters.facilitiesServices.length > 0
        ) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            filters.facilitiesServices.every((service) =>
              restaurant.facilitiesServices?.includes(service)
            )
          );
        }
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

        // Fetch review counts for all restaurants
        const reviewCountsPromises = fetchedRestaurants.map(
          async (restaurant) => {
            // Use the reviewCount field directly from the restaurant document if it exists.
            // This is more efficient as it doesn't require a separate query per restaurant.
            // If a reviewCount field is not maintained in the restaurant document,
            // then a sub-query like the commented-out code below would be needed.
            // const reviewsQuery = query(
            //   collection(db, `artifacts/${appId}/public/data/reviews`),
            //   where("restaurantId", "==", restaurant.id)
            // );
            // const reviewsSnapshot = await getDocs(reviewsQuery);
            // const reviewCount = reviewsSnapshot.size;

            return {
              ...restaurant,
              reviewCount: restaurant.reviewCount || 0, // Assume reviewCount is already in restaurant data, default to 0
            };
          }
        );

        const restaurantsWithReviewCounts = await Promise.all(
          reviewCountsPromises
        );

        setRestaurants(restaurantsWithReviewCounts);
        setLoading(false);
      },
      (error) => {
        console.error("獲取餐廳資料失敗:", error);
        setModalMessage(`獲取餐廳資料失敗: ${error.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, appId, JSON.stringify(filters), searchQuery, setModalMessage]);

  /**
   * 處理收藏/取消收藏餐廳的邏輯。
   * 現在直接調用 AuthContext 提供的 toggleFavoriteRestaurant 函數。
   * @param {string} restaurantId - 要收藏或取消收藏的餐廳 ID。
   */
  const handleToggleFavorite = async (restaurantId) => {
    try {
      await toggleFavoriteRestaurant(restaurantId);
    } catch (error) {
      // Error message is already handled by AuthContext's setModalMessage
    }
  };

  const addSampleRestaurants = async () => {
    if (!db || !currentUser) {
      setModalMessage("請先登入才能新增資料。");
      return;
    }
    setLoading(true);
    try {
      const restaurantCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/restaurants`
      );
      const sampleRestaurants = [
        {
          restaurantNameZh: "楓葉小館",
          restaurantNameEn: "Maple Leaf Bistro",
          city: "多倫多",
          province: "安大略省",
          fullAddress: "多倫多市中心楓葉大道123號, M5V 2L9",
          phone: "416-123-4567",
          website: "https://mapleleafbistro.ca",
          cuisineType: "加拿大菜",
          restaurantType: "Casual Dining (休閒餐飲)",
          avgSpending: 30,
          facadePhotoUrls: [
            "https://placehold.co/400x200/FF5733/FFFFFF?text=楓葉小館+1",
            "https://placehold.co/400x200/FF5733/FFFFFF?text=楓葉小館+2",
            "https://placehold.co/400x200/FF5733/FFFFFF?text=楓葉小館+3",
          ],
          seatingCapacity: "51-100",
          businessHours: "週一至週五 11:00-22:00, 週六日 10:00-23:00",
          reservationModes: ["電話預約", "Walk-in"],
          paymentMethods: ["現金", "信用卡"],
          facilitiesServices: ["室外座位", "Wi-Fi服務"], // 新增服務
          otherInfo: "提供當地特色菜餚。",
          rating: 4.5,
          reviewCount: 0, // Initialize reviewCount
          isTemporarilyClosed: false,
          isPermanentlyClosed: false,
        },
        {
          restaurantNameZh: "海鮮碼頭",
          restaurantNameEn: "Seafood Wharf",
          city: "溫哥華",
          province: "卑詩省",
          fullAddress: "溫哥華海濱路456號, V6G 2R5",
          phone: "604-987-6543",
          website: "https://seafoodwharf.com",
          cuisineType: "海鮮",
          restaurantType: "Fine Dining (高級餐飲)",
          avgSpending: 80,
          facadePhotoUrls: [
            "https://placehold.co/400x200/3366FF/FFFFFF?text=海鮮碼頭+1",
            "https://placehold.co/400x200/3366FF/FFFFFF?text=海鮮碼頭+2",
          ],
          seatingCapacity: "101-200",
          businessHours: "每日 17:00-23:00",
          reservationModes: ["官方網站"],
          paymentMethods: ["信用卡", "Apple Pay"],
          facilitiesServices: ["室外座位", "酒精飲品", "無障礙設施"], // 新增服務
          otherInfo: "新鮮海產，景色優美。",
          rating: 4.8,
          reviewCount: 0, // Initialize reviewCount
          isTemporarilyClosed: false,
          isPermanentlyClosed: false,
        },
        {
          restaurantNameZh: "法式浪漫",
          restaurantNameEn: "French Romance",
          city: "蒙特婁",
          province: "魁北克省",
          fullAddress: "蒙特婁老城區藝術街789號, H2Y 1C3",
          phone: "514-234-5678",
          website: "https://frenchromance.ca",
          cuisineType: "法國菜",
          restaurantType: "Fine Dining (高級餐飲)",
          avgSpending: 90,
          facadePhotoUrls: [
            "https://placehold.co/400x200/6633FF/FFFFFF?text=法式浪漫+1",
          ],
          seatingCapacity: "21-50",
          businessHours: "週二至週六 18:00-22:00",
          reservationModes: ["電話預約"],
          paymentMethods: ["信用卡"],
          facilitiesServices: ["酒精飲品"], // 新增服務
          otherInfo: "提供米其林星級體驗。",
          rating: 4.2,
          reviewCount: 0, // Initialize reviewCount
          isTemporarilyClosed: true,
          isPermanentlyClosed: false,
        },
        {
          restaurantNameZh: "亞洲風味小吃",
          restaurantNameEn: "Asian Flavors Snacks",
          city: "卡加利",
          province: "亞伯達省",
          fullAddress: "卡加利市區美食廣場101號, T2P 0C1",
          phone: "403-567-8901",
          website: "",
          cuisineType: "亞洲菜",
          restaurantType: "Food Court (美食廣場)",
          avgSpending: 15,
          facadePhotoUrls: [
            "https://placehold.co/400x200/33CC66/FFFFFF?text=亞洲風味+1",
            "https://placehold.co/400x200/33CC66/FFFFFF?text=亞洲風味+2",
            "https://placehold.co/400x200/33CC66/FFFFFF?text=亞洲風味+3",
            "https://placehold.co/400x200/33CC66/FFFFFF?text=亞洲風味+4",
          ],
          seatingCapacity: "200+",
          businessHours: "每日 10:00-21:00",
          reservationModes: ["Walk-in"],
          paymentMethods: ["現金", "微信支付"],
          facilitiesServices: ["外賣速遞", "兒童友善"], // 新增服務
          otherInfo: "多種亞洲街頭小吃。",
          rating: 4.0,
          reviewCount: 0, // Initialize reviewCount
          isTemporarilyClosed: false,
          isPermanentlyClosed: true,
        },
        {
          restaurantNameZh: "義式PIZZA坊",
          restaurantNameEn: "Italian Pizza Place",
          city: "多倫多",
          province: "安大略省",
          fullAddress: "多倫多市中心披薩巷22號, M5S 1A1",
          phone: "416-555-1234",
          website: "https://italianpizzaplace.ca",
          cuisineType: "意大利菜",
          restaurantType: "Casual Dining (休閒餐飲)",
          avgSpending: 25,
          facadePhotoUrls: [
            "https://placehold.co/400x200/FFCC00/000000?text=義式PIZZA+1",
          ],
          seatingCapacity: "21-50",
          businessHours: "週一至週日 11:30-22:30",
          reservationModes: ["電話預約", "Walk-in"],
          paymentMethods: ["信用卡", "借記卡"],
          facilitiesServices: ["Wi-Fi服務", "停車場"], // 新增服務
          otherInfo: "傳統手工披薩。",
          rating: 3.9,
          reviewCount: 0, // Initialize reviewCount
          isTemporarilyClosed: false,
          isPermanentlyClosed: false,
        },
      ];

      for (const restaurant of sampleRestaurants) {
        await addDoc(restaurantCollectionRef, restaurant);
      }
      setModalMessage("已新增範例餐廳資料！");
    } catch (error) {
      console.error("新增範例餐廳失敗:", error);
      setModalMessage(`新增範例餐廳失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const hasFiltersOrSearch =
    Object.values(filters).some(
      (value) =>
        (Array.isArray(value) && value.length > 0) ||
        (!Array.isArray(value) &&
          value &&
          value !== "0" &&
          value !== "選擇菜系" &&
          value !== "選擇省份")
    ) || searchQuery.length > 0;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900">
          {hasFiltersOrSearch ? "搜尋/篩選結果" : "所有餐廳"}
        </h2>
        <div className="flex space-x-4">
          {/* 清除篩選/搜尋按鈕，僅在有篩選或搜尋時顯示 */}
          {hasFiltersOrSearch && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              清除篩選/搜尋
            </button>
          )}
          {/* 切換視圖按鈕，總是顯示 */}
          {toggleView && (
            <button
              onClick={toggleView}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {isGridView ? "切換到列表模式" : "切換到網格模式"}
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 text-center mb-4">
        當前使用者 ID:{" "}
        <span className="font-mono bg-gray-200 px-2 py-1 rounded">
          {userId}
        </span>
      </p>
      <div className="flex justify-center mb-8">
        <button
          onClick={addSampleRestaurants}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          新增範例餐廳資料 (僅供測試)
        </button>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : restaurants.length === 0 ? (
        <p className="text-center text-gray-600 text-xl">
          {hasFiltersOrSearch
            ? "沒有餐廳符合搜尋/篩選條件。"
            : "目前沒有餐廳資料。請點擊上方按鈕新增範例資料。"}
        </p>
      ) : (
        <div
          className={
            isGridView
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
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
              } // 從 currentUser 獲取收藏狀態
              onToggleFavorite={toggleFavoriteRestaurant} // 傳遞收藏切換函數
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantListPage;
