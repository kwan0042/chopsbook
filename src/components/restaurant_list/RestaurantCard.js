// src/components/RestaurantCard.js
"use client";

import React from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faSolidStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons";
import { faBookmark as faSolidBookmark } from "@fortawesome/free-solid-svg-icons";
import { faBookmark as faRegularBookmark } from "@fortawesome/free-regular-svg-icons";
import { faComment } from "@fortawesome/free-solid-svg-icons";

// 導入自定義 Hook
import useRestaurantStatus from "@/hooks/useRestaurantStatus";

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
  // 使用 Hook 判斷餐廳營業狀態
  const { text: operatingStatus, color: operatingStatusColor } =
    useRestaurantStatus(restaurant);

  const facadePhotoUrls = Array.isArray(restaurant.facadePhotoUrls)
    ? restaurant.facadePhotoUrls
    : restaurant.facadePhotoUrl
    ? [restaurant.facadePhotoUrl]
    : [];

  const hasAnyImage = facadePhotoUrls.length > 0;
  const placeholderSize = isGridView ? "400x240" : "400x200";

  const displayImageUrl = hasAnyImage
    ? facadePhotoUrls[0]
    : `https://placehold.co/${placeholderSize}/CCCCCC/333333?text=${encodeURIComponent(
        restaurant.restaurantNameZh || restaurant.restaurantNameEn || "餐廳圖片"
      )}`;

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleFavorite(restaurant.id);
  };

  return (
    <div className={`relative ${isGridView ? "w-full" : "w-full my-2"}`}>
      <Link href={`/restaurants/${restaurant.id}`} passHref>
        <div
          className={`bg-white shadow-lg overflow-hidden transform transition duration-300 ease-in-out cursor-pointer h-fit
            ${
              isGridView
                ? "hover:scale-105 rounded-xl"
                : "flex flex-row items-start rounded-xl p-3 border border-gray-200 hover:shadow-md"
            }`}
        >
          <div
            className={`relative flex-shrink-0 rounded-lg overflow-hidden ${
              isGridView ? "w-full h-48" : "w-[350px] h-[200px] mr-4"
            }`}
          >
            <img
              src={displayImageUrl}
              alt={
                restaurant.restaurantNameZh ||
                restaurant.restaurantNameEn ||
                "餐廳圖片"
              }
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://placehold.co/${placeholderSize}/CCCCCC/333333?text=圖片`;
              }}
            />
          </div>

          <div
            className={`${
              isGridView ? "p-6 h-60" : "flex-grow text-left py-1"
            }`}
          >
            <h3
              className={`font-bold text-gray-900 mb-1 leading-tight text-wrap ${
                isGridView ? "text-base" : "text-base"
              }`}
            >
              {restaurant.restaurantNameZh ||
                restaurant.restaurantNameEn ||
                `未知餐廳`}
            </h3>

            <div
              className={`flex items-center mb-1 ${
                isGridView ? "text-sm" : "text-sm"
              }`}
            >
              {Array.from({ length: 5 }, (_, index) => (
                <FontAwesomeIcon
                  key={index}
                  icon={
                    index < Math.floor(restaurant.averageRating || 0)
                      ? faSolidStar
                      : faRegularStar
                  }
                  className={`${isGridView ? "text-sm" : "text-sm"} ${
                    index < Math.floor(restaurant.averageRating || 0)
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
                {restaurant.averageRating?.toFixed(1) || "N/A"}
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

            <p
              className={`text-gray-700 mb-1 text-wrap ${
                isGridView ? "text-sm" : "text-sm"
              }`}
            >
              {restaurant.fullAddress || "N/A"}
            </p>

            <p
              className={`text-gray-700 mb-1 text-wrap ${
                isGridView ? "text-sm" : "text-sm"
              }`}
            >
              {restaurant.city || "N/A"} | {restaurant.cuisineType || "N/A"} |
              人均: ${restaurant.avgSpending || "N/A"}
            </p>

            <p
              className={`text-gray-700 mb-1 text-wrap ${
                isGridView ? "text-sm" : "text-sm"
              }`}
            >
              電話: {restaurant.phone || "N/A"}
            </p>

            <p
              className={`text-gray-700 mt-1 text-wrap ${
                isGridView ? "text-sm" : "text-sm"
              }`}
            >
              <span className={`font-bold ${operatingStatusColor}`}>
                {operatingStatus}
              </span>
            </p>
          </div>
        </div>
      </Link>

      <button
        onClick={handleFavoriteClick}
        className="absolute top-3 right-3 z-10 p-2 bg-transparent border-none
                   hover:text-yellow-500 transition duration-200 "
        aria-label={isFavorited ? "取消收藏" : "收藏餐廳"}
        type="button"
      >
        <FontAwesomeIcon
          icon={isFavorited ? faSolidBookmark : faRegularBookmark}
          className={`text-2xl ${
            isFavorited ? "text-yellow-500" : "text-blue-100"
          }`}
        />
      </button>
    </div>
  );
};

export default RestaurantCard;
