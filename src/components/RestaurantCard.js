"use client";

import React from "react";
import Link from "next/link"; // 導入 Link 組件
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faSolidStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons";
import { faBookmark as faSolidBookmark } from "@fortawesome/free-solid-svg-icons"; // 實心書籤圖標
import { faBookmark as faRegularBookmark } from "@fortawesome/free-regular-svg-icons"; // 空心書籤圖標
import { faComment } from "@fortawesome/free-solid-svg-icons";

/**
 * 輔助函數：根據營業時間和自定義狀態判斷餐廳營業狀態。
 * @param {object} restaurant - 餐廳資料物件。
 * @returns {string} 營業狀態字串 (營業中, 暫時休業, 休假中, 已結業, 休息中)。
 */
const getOperatingStatus = (restaurant) => {
  if (restaurant.isPermanentlyClosed) {
    return "已結業";
  }
  if (restaurant.isTemporarilyClosed) {
    return "暫時休業";
  }

  // 檢查 businessHours 是否為有效的陣列
  const businessHours = restaurant.businessHours;
  if (!Array.isArray(businessHours) || businessHours.length === 0) {
    return "未知狀態";
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

  const todayHours = businessHours.find((h) => h.day === currentDayName);

  // 如果找不到今天的營業時間或今天不營業
  if (!todayHours || !todayHours.isOpen) {
    return "休假中";
  }

  // 判斷當前時間是否在營業時間內
  const currentTime = today.getHours() * 60 + today.getMinutes();
  const startTimeParts = todayHours.startTime.split(":");
  const endTimeParts = todayHours.endTime.split(":");
  const startTimeInMinutes =
    parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
  const endTimeInMinutes =
    parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);

  // 處理跨夜營業的情況 (例如 22:00 - 02:00)
  if (endTimeInMinutes < startTimeInMinutes) {
    if (currentTime >= startTimeInMinutes || currentTime < endTimeInMinutes) {
      return "營業中";
    }
  } else {
    // 正常當日營業的情況
    if (currentTime >= startTimeInMinutes && currentTime < endTimeInMinutes) {
      return "營業中";
    }
  }

  return "休息中";
};

/**
 * RestaurantCard 組件: 顯示單個餐廳的資訊卡片，支援網格和列表視圖。
 * 新增了收藏按鈕，並調整了資訊顯示。
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
  // 檢查 facadePhotoUrls 是否為有效的陣列，並處理舊版單一圖片的情況
  const facadePhotoUrls = Array.isArray(restaurant.facadePhotoUrls)
    ? restaurant.facadePhotoUrls
    : restaurant.facadePhotoUrl
    ? [restaurant.facadePhotoUrl]
    : [];

  const hasAnyImage = facadePhotoUrls.length > 0;

  // 根據視圖模式調整圖片佔位符大小
  const placeholderSize = isGridView ? "400x240" : "400x200";

  const displayImageUrl = hasAnyImage
    ? facadePhotoUrls[0]
    : `https://placehold.co/${placeholderSize}/CCCCCC/333333?text=${encodeURIComponent(
        restaurant.restaurantNameZh || restaurant.restaurantNameEn || "餐廳圖片"
      )}`;

  const operatingStatus = getOperatingStatus(restaurant);

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // 阻止事件冒泡到卡片本身，避免觸發 Link 導航
    e.preventDefault(); // 確保 Link 導航不會被觸發
    onToggleFavorite(restaurant.id);
  };

  return (
    // 外層容器，用於相對定位收藏按鈕
    <div
      className={`relative ${
        isGridView
          ? "w-full" // 網格模式下，外層容器寬度適應
          : "w-full my-2" // 列表模式下，外層容器寬度適應，並保留 my-2 間距
      }`}
    >
      {/* 主要的餐廳卡片內容，被 Link 包裹 */}
      <Link href={`/restaurants/${restaurant.id}`} passHref>
        <div
          className={`bg-white shadow-lg overflow-hidden transform transition duration-300 ease-in-out cursor-pointer h-fit
            ${
              isGridView
                ? "hover:scale-105 rounded-xl" // 網格模式樣式
                : "flex flex-row items-start rounded-xl p-3 border border-gray-200 hover:shadow-md" // 列表模式樣式
            }`}
        >
          {/* 圖片容器 */}
          <div
            className={`relative flex-shrink-0 rounded-lg overflow-hidden ${
              isGridView
                ? "w-full h-48" // 網格模式圖片大小，高度 192px
                : "w-[350px] h-[200px] mr-4" // 列表模式圖片容器固定 400x200px
            }`}
          >
            <img
              src={displayImageUrl}
              alt={
                restaurant.restaurantNameZh ||
                restaurant.restaurantNameEn ||
                "餐廳圖片"
              }
              className="w-full h-full object-cover" // 統一圖片樣式，填滿容器
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://placehold.co/${placeholderSize}/CCCCCC/333333?text=圖片`; // 使用動態佔位符大小
              }}
            />
          </div>

          {/* 餐廳資訊區塊 */}
          <div
            className={`${
              isGridView ? "p-6 h-60" : "flex-grow text-left py-1"
            }`}
          >
            {/* 餐廳名稱 - 網格模式 16pt (text-base), 列表模式 16pt (text-base) */}
            <h3
              className={`font-bold text-gray-900 mb-1 leading-tight text-wrap ${
                isGridView ? "text-base" : "text-base"
              }`}
            >
              {restaurant.restaurantNameZh ||
                restaurant.restaurantNameEn ||
                `未知餐廳`}
            </h3>

            {/* 評分和評論數 - 網格模式 14pt (text-sm), 列表模式 14pt (text-sm) */}
            <div
              className={`flex items-center mb-1 ${
                isGridView ? "text-sm" : "text-sm"
              }`}
            >
              {Array.from({ length: 5 }, (_, index) => (
                <FontAwesomeIcon
                  key={index}
                  icon={
                    index < Math.floor(restaurant.rating || 0)
                      ? faSolidStar
                      : faRegularStar
                  }
                  className={`${isGridView ? "text-sm" : "text-sm"} ${
                    index < Math.floor(restaurant.rating || 0)
                      ? "text-yellow-500"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span
                className={`text-gray-800 font-bold ml-1 ${
                  isGridView ? "text-sm" : "text-sm"
                }`}
              >
                {restaurant.rating?.toFixed(1) || "N/A"}
              </span>
              <span
                className={`ml-2 flex items-center text-gray-700 ${
                  isGridView ? "text-sm" : "text-sm"
                }`}
              >
                <div className="relative">
                  <FontAwesomeIcon icon={faComment} className="text-blue-500" />
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {restaurant.reviewCount || 0}
                  </span>
                </div>
              </span>
            </div>

            {/* 地址 - 網格模式 14pt (text-sm), 列表模式 14pt (text-sm) */}
            <p
              className={`text-gray-700 mb-1 text-wrap ${
                isGridView ? "text-sm" : "text-sm"
              }`}
            >
              {restaurant.fullAddress || "N/A"}
            </p>

            {/* 城市 | 菜系 | 人均 - 網格模式 14pt (text-sm), 列表模式 14pt (text-sm) */}
            <p
              className={`text-gray-700 mb-1 text-wrap ${
                isGridView ? "text-sm" : "text-sm"
              }`}
            >
              {restaurant.city || "N/A"} | {restaurant.cuisineType || "N/A"} |
              人均: ${restaurant.avgSpending || "N/A"}
            </p>

            {/* 電話 - 網格模式 14pt (text-sm), 列表模式 14pt (text-sm) */}
            <p
              className={`text-gray-700 mb-1 text-wrap ${
                isGridView ? "text-sm" : "text-sm"
              }`}
            >
              電話: {restaurant.phone || "N/A"}
            </p>

            {/* 營業狀態 - 網格模式 14pt (text-sm), 列表模式 14pt (text-sm) */}
            <p
              className={`text-gray-700 mt-1 text-wrap ${
                isGridView ? "text-sm" : "text-sm"
              }`}
            >
              <span
                className={`font-bold ${
                  operatingStatus === "營業中"
                    ? "text-green-600"
                    : operatingStatus === "暫時休業"
                    ? "text-orange-500"
                    : operatingStatus === "休假中" ||
                      operatingStatus === "休息中"
                    ? "text-blue-500"
                    : "text-red-600"
                }`}
              >
                {operatingStatus}
              </span>
            </p>
          </div>
        </div>
      </Link>

      {/* 收藏按鈕 (現在作為兄弟元素，獨立於 Link) */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-3 right-3 z-10 p-2 bg-transparent border-none
                   hover:text-yellow-500 transition duration-200 "
        aria-label={isFavorited ? "取消收藏" : "收藏餐廳"}
        type="button" // 明確指定為按鈕類型
      >
        <FontAwesomeIcon
          icon={isFavorited ? faSolidBookmark : faRegularBookmark}
          className={`text-2xl ${
            isFavorited
              ? "text-yellow-500"
              : "text-blue-100" /* 未收藏時顯示灰色書籤 */
          }`}
        />
      </button>
    </div>
  );
};

export default RestaurantCard;
