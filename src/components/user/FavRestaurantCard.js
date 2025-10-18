// src/components/user/FavRestaurantCard.js
"use client";

import React, { useContext, useCallback } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar as faSolidStar,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons";
import { AuthContext } from "@/lib/auth-context";
import {
  IconRosetteNumber1,
  IconRosetteNumber2,
  IconRosetteNumber3,
  IconRosetteNumber4,
  IconRosetteNumber5,
} from "@tabler/icons-react";

/**
 * 顯示單一收藏餐廳的卡片元件，採用列表視圖。
 * 包含餐廳資訊和一個「移除收藏」按鈕。
 *
 * @param {object} props - 組件的屬性。
 * @param {object} props.restaurant - 包含餐廳資料的物件。
 * @param {function} props.onRemove - 移除收藏時的回調函數。
 * @param {number} props.index - 餐廳在列表中的索引（從 0 開始）。
 * @param {boolean} props.isMyProfile - 判斷是否為當前用戶。
 */
const FavRestaurantCard = ({ restaurant, onRemove, index, isMyProfile }) => {
  const { setModalMessage } = useContext(AuthContext);

  const handleRemoveFavorite = useCallback(async () => {
    try {
      if (onRemove) {
        onRemove(restaurant.id);
      }
    } catch (error) {
      console.error("Failed to remove from favorites:", error);
      setModalMessage(`移除收藏失敗: ${error.message}`);
    }
  }, [restaurant.id, onRemove, setModalMessage]);

  const renderRatingStars = (averageRating) => {
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, index) => (
          <FontAwesomeIcon
            key={index}
            icon={
              index < Math.floor(averageRating || 0)
                ? faSolidStar
                : faRegularStar
            }
            className={`text-sm ${
              index < Math.floor(averageRating || 0)
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-gray-800 font-bold text-sm ml-2">
          {averageRating?.toFixed(1) || "N/A"}
        </span>
      </div>
    );
  };

  const renderRankBadge = (rank) => {
    const rankIcons = [
      IconRosetteNumber1,
      IconRosetteNumber2,
      IconRosetteNumber3,
      IconRosetteNumber4,
      IconRosetteNumber5,
    ];
    const IconComponent = rankIcons[rank];
    let backgroundColor = "";

    if (rank === 0) {
      backgroundColor = "bg-yellow-500";
    } else if (rank === 1) {
      backgroundColor = "bg-slate-400";
    } else if (rank === 2) {
      backgroundColor = "bg-amber-600";
    } else {
      backgroundColor = "bg-blue-500";
    }

    if (IconComponent) {
      return (
        <div
          className={`flex-shrink-0 w-12 flex items-center justify-center ${backgroundColor}`}
        >
          <IconComponent className="w-8 h-8 text-white" stroke={2} />
        </div>
      );
    }
    return null;
  };

  // 🚨 修正：根據新的結構獲取菜系顯示名稱
  const getCuisineDisplayName = (restaurant) => {
    // 優先使用 subCategory (如果存在且非空字串)
    if (restaurant.subCategory && restaurant.subCategory !== "") {
      // 檢查是否為 "不適用" (這來自表單邏輯，雖然我們希望它存為 ""，但作為防禦性檢查)
      if (restaurant.subCategory === "不適用") {
        return restaurant.category || "N/A";
      }
      return restaurant.subCategory;
    }
    // 否則使用 category
    return restaurant.category || "N/A";
  };

  const showRankBadge = index < 5;

  return (
    <div className="relative w-full my-2 group">
      <Link href={`/restaurants/${restaurant.id}`} passHref>
        <div className="bg-white shadow-lg overflow-hidden transform transition duration-300 ease-in-out cursor-pointer h-fit flex flex-row items-stretch rounded-xl border border-gray-200 hover:shadow-md">
          {showRankBadge && renderRankBadge(index)}

          <div className="p-3 flex-grow">
            <div className="flex-grow text-left py-1">
              <div className="flex items-center mb-1">
                <h3 className="font-bold text-gray-900 leading-tight text-wrap text-base mr-2">
                  {restaurant.restaurantName?.["zh-TW"] ||
                    restaurant.restaurantName?.en ||
                    `未知餐廳`}
                </h3>
                {renderRatingStars(restaurant.averageRating)}
              </div>
            </div>

            <p className="text-gray-700 mb-1 text-wrap text-sm">
              {restaurant.fullAddress || "N/A"}
            </p>

            {/* ⚡️ 修正：直接傳遞 restaurant 物件給新的 getCuisineDisplayName */}
            <p className="text-gray-700 mb-1 text-wrap text-sm">
              {restaurant.city || "N/A"} | {getCuisineDisplayName(restaurant)} |
              人均: ${restaurant.avgSpending || "N/A"}
            </p>

            <p className="text-gray-700 mb-1 text-wrap text-sm">
              電話: {restaurant.phone || "N/A"}
            </p>
          </div>
        </div>
      </Link>

      {/* ✅ 關鍵修正：根據 isMyProfile 條件渲染移除按鈕 */}
      {isMyProfile && (
        <button
          onClick={handleRemoveFavorite}
          className="absolute top-1 right-1 p-1 text-red-500 hover:text-gray-700 rounded-full group-hover:opacity-100"
          aria-label="從收藏清單中移除"
          type="button"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
    </div>
  );
};

export default FavRestaurantCard;
