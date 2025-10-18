// src/components/RestaurantCard.js
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faSolidStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons";
import { faBookmark as faSolidBookmark } from "@fortawesome/free-solid-svg-icons";
import { faBookmark as faRegularBookmark } from "@fortawesome/free-regular-svg-icons";
import { faComment, faShare } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

// 導入自定義 Hook
import useRestaurantStatus from "@/hooks/useRestaurantStatus";
import ShareModal from "@/components/ShareModal";

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
  const router = useRouter();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // 使用 Hook 判斷餐廳營業狀態
  const { text: operatingStatus, color: operatingStatusColor } =
    useRestaurantStatus(restaurant);

  const facadePhotoUrls = Array.isArray(restaurant.facadePhotoUrls)
    ? restaurant.facadePhotoUrls
    : [];

  const hasAnyImage = facadePhotoUrls.length > 0;
  const placeholderSize = isGridView ? "400x240" : "400x200";

  const displayImageUrl = hasAnyImage
    ? facadePhotoUrls[0]
    : `https://placehold.co/${placeholderSize}/CCCCCC/333333?text=${encodeURIComponent(
        restaurant.restaurantName?.["zh-TW"] ||
          restaurant.restaurantName?.en ||
          "餐廳圖片"
      )}`;

  const CategorysText = (() => {
    // 🚨 修正: category 和 subCategory 現在是字串 (String)
    const primaryCategory = restaurant.category || "";
    const secondaryCategory = restaurant.subCategory || "";

    // 🚨 修正: restaurantType 現在是陣列 (Array)
    const types = Array.isArray(restaurant.restaurantType)
      ? restaurant.restaurantType
      : [];

    // 構建一個包含所有有效分類/子分類/類型名稱的陣列
    let allCuisines = [];

    // 1. 優先放入 subCategory (最細節的菜系)
    if (secondaryCategory && secondaryCategory !== "其他") {
      allCuisines.push(secondaryCategory);
    }

    // 2. 放入 primary Category (主菜系)
    if (primaryCategory && primaryCategory !== "其他菜系") {
      // 避免重複：如果 subCategory 和 category 相同，則只保留一個 (雖然很少見，但為了安全)
      if (!allCuisines.includes(primaryCategory)) {
        allCuisines.push(primaryCategory);
      }
    }

    // 3. 放入 restaurantType (場所類型) - 選擇前兩項作為補充資訊
    const typeSupplements = types
      .filter((type) => type !== "其他" && !allCuisines.includes(type))
      .slice(0, 2);

    allCuisines = [...allCuisines, ...typeSupplements];

    // 🚨 最終顯示邏輯:
    // 選擇前三個顯示，使用 " / " 分隔
    if (allCuisines.length > 0) {
      // 去重並連接
      const uniqueCuisines = [...new Set(allCuisines)];
      return (
        uniqueCuisines.slice(0, 3).join(" | ") +
        (uniqueCuisines.length > 3 ? "..." : "")
      );
    }

    // 如果都沒有，顯示 N/A
    return "N/A";
  })();

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleFavorite(restaurant.id);
  };

  const handleCheckInClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const restaurantName =
      restaurant.restaurantName?.["zh-TW"] ||
      restaurant.restaurantName?.en ||
      "未知餐廳";
    router.push(
      `/review?restaurantId=${
        restaurant.id
      }&restaurantName=${encodeURIComponent(restaurantName)}`
    );
  };
  const handleShareClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsShareModalOpen(true);
  };

  const restaurantLink = `${window.location.origin}/restaurants/${restaurant.id}`;

  return (
    <div className={`relative ${isGridView ? "w-full" : "w-full my-2"}`}>
      <div
        className={`bg-white shadow-lg overflow-hidden h-fit ${
          isGridView
            ? "hover:scale-105 rounded-xl transform transition duration-300 ease-in-out"
            : "flex flex-row items-start rounded-xl p-3 border border-gray-200 hover:shadow-md"
        }`}
      >
        {/* 圖片區域 - 點擊導航 */}
        <Link href={`/restaurants/${restaurant.id}`} passHref>
          <div
            className={`relative flex-shrink-0 rounded-lg overflow-hidden ${
              isGridView ? "w-full h-48" : "w-[350px] h-[200px] mr-4"
            }`}
          >
            <img
              src={displayImageUrl}
              alt={
                restaurant.restaurantName?.["zh-TW"] ||
                restaurant.restaurantName?.en ||
                "餐廳圖片"
              }
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://placehold.co/${placeholderSize}/CCCCCC/333333?text=圖片`;
              }}
            />
          </div>
        </Link>

        <div
          className={`${isGridView ? "p-6 h-60" : "flex-grow text-left py-1"}`}
        >
          {/* 餐廳名稱 - 點擊導航 */}
          <Link href={`/restaurants/${restaurant.id}`} passHref>
            <h3
              className={`font-bold text-gray-900 mb-1 leading-tight text-wrap hover:underline cursor-pointer ${
                isGridView ? "text-base" : "text-base"
              }`}
            >
              {restaurant.restaurantName?.["zh-TW"] ||
                restaurant.restaurantName?.en ||
                `未知餐廳`}
            </h3>
          </Link>

          {/* 其他資訊 - 不可點擊 */}
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
            {restaurant.city || "N/A"} | {restaurant.province || "N/A"}
          </p>
          <p
            className={`text-gray-700 mb-1 text-wrap ${
              isGridView ? "text-sm" : "text-sm"
            }`}
          >
            {" "}
            {CategorysText}{" "}
          </p>

          <p
            className={`text-gray-700 mb-1 text-wrap ${
              isGridView ? "text-sm" : "text-sm"
            }`}
          >
            電話: {restaurant.phone || "N/A"} | 人均: ${restaurant.avgSpending || "N/A"}
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

      {/* 新增功能按鈕區塊 - 獨立於卡片導航 */}
      <div className="absolute top-3 right-3 flex items-center space-x-2">
        <button
          onClick={handleFavoriteClick}
          className="p-2 bg-transparent border-none hover:text-yellow-500 transition duration-200"
          aria-label={isFavorited ? "取消收藏" : "收藏餐廳"}
          type="button"
        >
          <FontAwesomeIcon
            icon={isFavorited ? faSolidBookmark : faRegularBookmark}
            className={`text-2xl drop-shadow-md ${
              isFavorited ? "text-yellow-500" : "text-gray-400"
            }`}
          />
        </button>
      </div>

      <div className="absolute bottom-3 right-3 flex items-center space-x-2 z-10">
        <button
          onClick={handleCheckInClick}
          className="bg-cbbg text-rose-500 hover:bg-blue-600 hover:text-cbbg text-sm font-bold py-1 px-3 rounded-sm  transition duration-100"
          type="button"
        >
          到訪
        </button>
        <button
          onClick={handleShareClick}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-bold py-1 px-3 rounded-sm  transition duration-100"
          type="button"
          aria-label="分享"
        >
          <FontAwesomeIcon icon={faShare} />
        </button>
      </div>

      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          restaurantName={
            restaurant.restaurantName?.["zh-TW"] ||
            restaurant.restaurantName?.en ||
            "未知餐廳"
          }
          shareUrl={restaurantLink}
        />
      )}
    </div>
  );
};

export default RestaurantCard;
