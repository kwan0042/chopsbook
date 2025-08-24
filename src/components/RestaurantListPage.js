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
  where,
  doc, // 新增：用於引用特定文件
  setDoc, // 新增：用於新增或更新文件
  deleteDoc, // 新增：用於刪除文件
} from "firebase/firestore"; // 確保引入所有需要的 Firestore 函數
// 請務必確認 './LoadingSpinner' 的路徑和檔名 (LoadingSpinner.js) 完全正確，注意大小寫
import LoadingSpinner from "./LoadingSpinner";
// 請務必確認 './Modal' 的路徑和檔名 (Modal.js) 完全正確，注意大小寫
import Modal from "./Modal";

// 從 Font Awesome 導入 FontAwesomeIcon 組件和所需的圖示
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faSolidStar } from "@fortawesome/free-solid-svg-icons"; // 實心星星 (用於評級)
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons"; // 空心星星 (用於評級)
import { faBookmark as faSolidBookmark } from "@fortawesome/free-solid-svg-icons"; // 新增：實心書籤 (已收藏)
import { faBookmark as faRegularBookmark } from "@fortawesome/free-regular-svg-icons"; // 新增：空心書籤 (未收藏)

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
 * RestaurantCard 組件: 顯示單個餐廳的資訊卡片，支援網格和列表視圖。
 * 現在移除了圖片輪播按鈕，並新增了收藏按鈕，並調整了資訊顯示。
 * @param {object} props - 組件屬性。
 * @param {object} props.restaurant - 餐廳資料物件。
 * @param {boolean} props.isGridView - 控制是否顯示為網格視圖。
 * @param {boolean} props.isFavorited - 該餐廳是否已被當前用戶收藏。
 * @param {function} props.onToggleFavorite - 收藏/取消收藏餐廳的回調函數。
 */
const RestaurantCard = ({
  restaurant,
  isGridView,
  isFavorited,
  onToggleFavorite,
}) => {
  // 圖片前後切換按鈕已移除，因此不再需要 currentImageIndex 狀態。

  // 檢查是否有至少一張圖片
  const hasAnyImage =
    restaurant.facadePhotoUrls && restaurant.facadePhotoUrls.length > 0;

  // 根據是否有圖片獲取要顯示的圖片 URL
  // 如果有多張圖片，預設顯示第一張。如果沒有圖片，顯示預設佔位圖。
  const displayImageUrl = hasAnyImage
    ? restaurant.facadePhotoUrls[0]
    : `https://placehold.co/400x200/CCCCCC/333333?text=${encodeURIComponent(
        restaurant.restaurantNameZh || restaurant.restaurantNameEn || "餐廳圖片"
      )}`;

  const operatingStatus = getOperatingStatus(restaurant);

  /**
   * 處理收藏按鈕點擊事件。
   * @param {Event} e - 點擊事件物件。
   */
  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // 阻止事件冒泡到卡片本身，避免觸發其他潛在的卡片點擊事件。
    onToggleFavorite(restaurant.id, isFavorited); // 調用父組件傳遞的回調，切換收藏狀態
  };

  return (
    <div
      className={`bg-white shadow-lg overflow-hidden transform transition duration-300 ease-in-out relative // 添加 relative 以便收藏按鈕進行絕對定位
        ${
          isGridView
            ? "hover:scale-105 rounded-xl"
            : "flex flex-col sm:flex-row items-center sm:h-50 rounded-xl"
        }`}
    >
      {/* 收藏按鈕 (右上角) - 移除了圓形背景 */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-3 right-3 z-10 p-2 bg-transparent border-none // 明確設定無背景無邊框
                   hover:text-yellow-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        aria-label={isFavorited ? "取消收藏" : "收藏餐廳"}
      >
        <FontAwesomeIcon
          icon={isFavorited ? faSolidBookmark : faRegularBookmark} // 根據 isFavorited 顯示實心或空心書籤
          className={`text-2xl ${
            isFavorited ? "text-yellow-500" : "text-gray-400"
          }`} // 改變顏色以反映狀態
        />
      </button>

      {/* 圖片容器 */}
      <div
        className={`relative ${
          isGridView
            ? "w-full h-48 rounded-lg" // 網格視圖時圖片圓角
            : "w-full h-full sm:w-1/3 flex-shrink-0 rounded-l-lg mb-4 sm:mb-0 sm:mr-4 overflow-hidden" // 列表視圖時圖片左側圓角
        }`}
      >
        <img
          src={displayImageUrl}
          alt={
            restaurant.restaurantNameZh ||
            restaurant.restaurantNameEn ||
            "餐廳圖片"
          }
          className="w-full h-full object-cover rounded-inherit" // 圖片將完全填充其容器，並繼承父容器的圓角
          onError={(e) => {
            e.target.onerror = null; // 防止無限循環
            // 如果圖片載入失敗，顯示「圖片載入失敗」的佔位圖
            e.target.src = `https://placehold.co/400x200/CCCCCC/333333?text=圖片載入失敗`;
          }}
        />
      </div>

      {/* 餐廳資訊區塊 */}
      <div className={`${isGridView ? "p-6" : "p-4 sm:flex-grow text-left"}`}>
        {" "}
        {/* 調整了列表視圖的 padding */}
        {/* 星星評級 (移到餐廳名字前) */}
        <div className="flex items-center mt-1 mb-1">
          {Array.from({ length: 5 }, (_, index) => (
            <FontAwesomeIcon
              key={index}
              icon={
                index < Math.floor(restaurant.rating || 0)
                  ? faSolidStar
                  : faRegularStar
              }
              className={`text-xl ${
                index < Math.floor(restaurant.rating || 0)
                  ? "text-yellow-500"
                  : "text-gray-300"
              }`}
            />
          ))}
          <span className="text-gray-800 font-bold text-lg ml-2">
            {restaurant.rating?.toFixed(1) || "N/A"}
          </span>
          <span className="text-gray-600 text-sm ml-2">
            ({restaurant.reviewCount || 0} 評論)
          </span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight text-wrap">
          {" "}
          {/* 恢復正常字體大小，保留換行 */}
          {restaurant.restaurantNameZh ||
            restaurant.restaurantNameEn ||
            `未知餐廳 (ID: ${restaurant.id})`}
        </h3>
        <p className="text-base text-gray-700 mb-1 text-wrap">
          {" "}
          {/* 恢復正常字體大小，保留換行 */}
          <span className="font-semibold"></span>{" "}
          {restaurant.fullAddress || "N/A"}
        </p>
        {/* 城市 | 菜系 | 人均消費 */}
        <p className="text-base text-gray-700 mb-1 text-wrap">
          {" "}
          {/* 恢復正常字體大小，保留換行 */}
          <span className="font-semibold mr-1">🏠</span>{" "}
          {restaurant.city || "N/A"} | {restaurant.cuisineType || "N/A"} | 人均
          :${restaurant.avgSpending || "N/A"}
        </p>
        <p className="text-base text-gray-700 mb-1 text-wrap">
          {" "}
          {/* 恢復正常字體大小，保留換行 */}
          <span className="font-semibold">電話:</span>{" "}
          {restaurant.phone || "N/A"}
        </p>
        <p className="text-base text-gray-700 mt-1 text-wrap">
          {" "}
          {/* 恢復正常字體大小，保留換行 */}
          <span className="font-semibold"></span>
          <span
            className={`font-bold ${
              operatingStatus === "營業中"
                ? "text-green-600"
                : operatingStatus === "暫時休業"
                ? "text-orange-500"
                : operatingStatus === "休假中"
                ? "text-blue-500"
                : "text-red-600" // 已結業
            }`}
          >
            {operatingStatus}
          </span>
        </p>
      </div>
    </div>
  );
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
  const { db, currentUser, appId } = useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState("");
  const [favoritedRestaurantIds, setFavoritedRestaurantIds] = useState([]); // 新增：用於儲存用戶收藏的餐廳 ID 列表
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
      (snapshot) => {
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
          let minAvgSpending = 0;
          let maxAvgSpending = Infinity;
          switch (filters.priceRange) {
            case "$":
              maxAvgSpending = 20;
              break;
            case "$$":
              minAvgSpending = 21;
              maxAvgSpending = 50;
              break;
            case "$$$":
              minAvgSpending = 51;
              maxAvgSpending = 100;
              break;
            case "$$$$":
              minAvgSpending = 101;
              break;
          }
          fetchedRestaurants = fetchedRestaurants.filter(
            (restaurant) =>
              restaurant.avgSpending &&
              restaurant.avgSpending >= minAvgSpending &&
              restaurant.avgSpending <= maxAvgSpending
          );
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
      },
      (error) => {
        console.error("獲取餐廳資料失敗:", error);
        setModalMessage(`獲取餐廳資料失敗: ${error.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, appId, JSON.stringify(filters), searchQuery]);

  // Effect 2: 獲取當前用戶的收藏餐廳 ID 列表
  useEffect(() => {
    if (!db || !currentUser) {
      setFavoritedRestaurantIds([]); // 如果未登入，則清空收藏列表
      return;
    }

    const favoritesCollectionRef = collection(
      db,
      `artifacts/${appId}/users/${currentUser.uid}/favorites`
    );
    const unsubscribe = onSnapshot(
      favoritesCollectionRef,
      (snapshot) => {
        const favoriteIds = snapshot.docs.map((doc) => doc.id); // 假設收藏文件 ID 就是餐廳 ID
        setFavoritedRestaurantIds(favoriteIds);
      },
      (error) => {
        console.error("獲取收藏列表失敗:", error);
        setModalMessage(`獲取收藏列表失敗: ${error.message}`);
      }
    );

    return () => unsubscribe();
  }, [db, appId, currentUser]); // 依賴於 db, appId, currentUser

  /**
   * 處理收藏/取消收藏餐廳的邏輯。
   * @param {string} restaurantId - 要收藏或取消收藏的餐廳 ID。
   * @param {boolean} isCurrentlyFavorited - 該餐廳當前是否已收藏。
   */
  const handleToggleFavorite = async (restaurantId, isCurrentlyFavorited) => {
    if (!db || !currentUser) {
      setModalMessage("請先登入才能收藏或取消收藏餐廳。");
      return;
    }

    setLoading(true); // 在執行收藏操作時顯示載入狀態
    const favoriteDocRef = doc(
      db,
      `artifacts/${appId}/users/${currentUser.uid}/favorites`,
      restaurantId
    );

    try {
      if (isCurrentlyFavorited) {
        // 如果已經收藏，則刪除收藏
        await deleteDoc(favoriteDocRef);
        setModalMessage("已取消收藏。");
      } else {
        // 如果未收藏，則新增收藏 (可以儲存一個時間戳或其他最小資料)
        await setDoc(favoriteDocRef, {
          timestamp: new Date(),
          userId: currentUser.uid,
        });
        setModalMessage("已成功加入收藏！");
      }
    } catch (error) {
      console.error("收藏操作失敗:", error);
      setModalMessage(`收藏操作失敗: ${error.message}`);
    } finally {
      setLoading(false);
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
          otherInfo: "提供當地特色菜餚。",
          rating: 4.5,
          reviewCount: 25,
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
          otherInfo: "新鮮海產，景色優美。",
          rating: 4.8,
          reviewCount: 40,
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
          ], // 只有一張圖片
          seatingCapacity: "21-50",
          businessHours: "週二至週六 18:00-22:00",
          reservationModes: ["電話預約"],
          paymentMethods: ["信用卡"],
          otherInfo: "提供米其林星級體驗。",
          rating: 4.2,
          reviewCount: 18,
          isTemporarilyClosed: true, // 範例：暫時休業
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
          otherInfo: "多種亞洲街頭小吃。",
          rating: 4.0,
          reviewCount: 30,
          isTemporarilyClosed: false,
          isPermanentlyClosed: true, // 範例：已結業
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
          ], // 只有一張圖片
          seatingCapacity: "21-50",
          businessHours: "週一至週日 11:30-22:30",
          reservationModes: ["電話預約", "Walk-in"],
          paymentMethods: ["信用卡", "借記卡"],
          otherInfo: "傳統手工披薩。",
          rating: 3.9,
          reviewCount: 15,
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

  const closeModal = () => setModalMessage("");

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
          {hasFiltersOrSearch && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              清除篩選/搜尋
            </button>
          )}
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
              isFavorited={favoritedRestaurantIds.includes(restaurant.id)} // 傳遞收藏狀態
              onToggleFavorite={handleToggleFavorite} // 傳遞收藏切換函數
            />
          ))}
        </div>
      )}
      <Modal message={modalMessage} onClose={closeModal} />
    </div>
  );
};

export default RestaurantListPage;
