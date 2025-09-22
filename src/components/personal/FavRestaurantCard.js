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
 */
const FavRestaurantCard = ({ restaurant, onRemove, index }) => {
  const { toggleFavoriteRestaurant, setModalMessage } = useContext(AuthContext);

  const handleRemoveFavorite = useCallback(async () => {
    try {
      if (onRemove) {
        onRemove(restaurant.id);
      }
      await toggleFavoriteRestaurant(restaurant.id);
      setModalMessage("已從收藏清單中移除。");
    } catch (error) {
      console.error("Failed to remove from favorites:", error);
      setModalMessage(`移除收藏失敗: ${error.message}`);
    }
  }, [restaurant.id, onRemove, toggleFavoriteRestaurant, setModalMessage]);

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
          // ✅ 修正這裡：使用 flex items-center justify-center 進行雙向置中
          className={`flex-shrink-0 w-12 flex items-center justify-center ${backgroundColor}`}
        >
          <IconComponent className="w-8 h-8 text-white" stroke={2} />
        </div>
      );
    }
    return null;
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
                  {/* ✅ 修正：使用新的多語言 restaurantName map */}
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

            <p className="text-gray-700 mb-1 text-wrap text-sm">
              {restaurant.city || "N/A"} | {restaurant.cuisineType || "N/A"} |
              人均: ${restaurant.avgSpending || "N/A"}
            </p>

            <p className="text-gray-700 mb-1 text-wrap text-sm">
              電話: {restaurant.phone || "N/A"}
            </p>
          </div>
        </div>
      </Link>

      <button
        onClick={handleRemoveFavorite}
        className="absolute top-1 right-1 p-1 text-red-500 hover:text-gray-700 rounded-full group-hover:opacity-100"
        aria-label="從收藏清單中移除"
        type="button"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
};

export default FavRestaurantCard;
