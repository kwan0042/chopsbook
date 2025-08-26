// src/components/RestaurantCard.js
"use client";

import React from "react";
// 從 Font Awesome 導入 FontAwesomeIcon 組件和所需的圖示
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faSolidStar } from "@fortawesome/free-solid-svg-icons"; // 實心星星 (用於評級)
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons"; // 空心星星 (用於評級)
import { faBookmark as faSolidBookmark } from "@fortawesome/free-solid-svg-icons"; // 實心書籤 (已收藏)
import { faBookmark as faRegularBookmark } from "@fortawesome/free-regular-svg-icons"; // 空心書籤 (未收藏)

// 這裡已添加 faEdit 圖標用於「寫食評」功能
import { faComment } from "@fortawesome/free-solid-svg-icons";

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
  // 檢查是否有至少一張圖片
  const hasAnyImage =
    restaurant.facadePhotoUrls && restaurant.facadePhotoUrls.length > 0;

  // 根據是否有圖片獲取要顯示的圖片 URL
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
    e.stopPropagation(); // 阻止事件冒泡到卡片本身
    onToggleFavorite(restaurant.id); // 調用父組件傳遞的回調
  };

  return (
    <div
      className={`bg-white shadow-lg overflow-hidden transform transition duration-300 ease-in-out relative
        ${
          isGridView
            ? "hover:scale-105 rounded-xl"
            : "flex flex-col sm:flex-row items-center sm:h-50 rounded-xl"
        }`}
    >
      {/* 收藏按鈕 (右上角) */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-3 right-3 z-10 p-2 bg-transparent border-none
                   hover:text-yellow-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        aria-label={isFavorited ? "取消收藏" : "收藏餐廳"}
      >
        <FontAwesomeIcon
          icon={isFavorited ? faSolidBookmark : faRegularBookmark}
          className={`text-2xl ${
            isFavorited ? "text-yellow-500" : "text-gray-400"
          }`}
        />
      </button>

      {/* 圖片容器 */}
      <div
        className={`relative ${
          isGridView
            ? "w-full h-48 rounded-lg"
            : "w-full h-full sm:w-1/3 flex-shrink-0 rounded-l-lg mb-4 sm:mb-0 sm:mr-4 overflow-hidden"
        }`}
      >
        <img
          src={displayImageUrl}
          alt={
            restaurant.restaurantNameZh ||
            restaurant.restaurantNameEn ||
            "餐廳圖片"
          }
          className="w-full h-full object-cover rounded-inherit"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://placehold.co/400x200/CCCCCC/333333?text=圖片載入失敗`;
          }}
        />
      </div>

      {/* 餐廳資訊區塊 */}
      <div className={`${isGridView ? "p-6" : "p-4 sm:flex-grow text-left"}`}>
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
          <div className="flex items-center text-sm text-gray-700 mb-1">
            <span className="ml-3 flex items-center">
              <div className="relative">
                {" "}
                {/* 使用 relative 定位以便於疊加數字 */}
                <FontAwesomeIcon icon={faComment} className="text-blue-500" />
                {/* 評論數量疊加在圖標上 */}
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {restaurant.reviewCount || 0}
                </span>
              </div>
            </span>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight text-wrap">
          {restaurant.restaurantNameZh ||
            restaurant.restaurantNameEn ||
            `未知餐廳 (ID: ${restaurant.id})`}
        </h3>
        <p className="text-base text-gray-700 mb-1 text-wrap">
          <span className="font-semibold"></span>
          {restaurant.fullAddress || "N/A"}
        </p>
        <p className="text-base text-gray-700 mb-1 text-wrap">
          <span className="font-semibold mr-1">🏠</span>
          {restaurant.city || "N/A"} | {restaurant.cuisineType || "N/A"} | 人均
          :${restaurant.avgSpending || "N/A"}
        </p>
        <p className="text-base text-gray-700 mb-1 text-wrap">
          <span className="font-semibold">電話:</span>
          {restaurant.phone || "N/A"}
        </p>
        <p className="text-base text-gray-700 mt-1 text-wrap">
          <span className="font-semibold"></span>
          <span
            className={`font-bold ${
              operatingStatus === "營業中"
                ? "text-green-600"
                : operatingStatus === "暫時休業"
                ? "text-orange-500"
                : operatingStatus === "休假中"
                ? "text-blue-500"
                : "text-red-600"
            }`}
          >
            {operatingStatus}
          </span>
        </p>
      </div>
    </div>
  );
};

export default RestaurantCard;
