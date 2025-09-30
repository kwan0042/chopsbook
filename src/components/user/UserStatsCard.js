// src/components/personal/UserStatsCard.js
"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faCamera,
  faHeart,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";

/**
 * UserStatsCard: 顯示用戶統計數據的卡片。
 * @param {object} props - 組件的 props。
 * @param {object} props.stats - 包含用戶統計數據的物件。
 * @param {number} props.stats.reviewsCount - 已發布評論數。
 * @param {number} props.stats.photosCount - 上傳照片數。
 * @param {number} props.stats.likesReceived - 獲得的喜歡數。
 * @param {number} props.stats.favoriteRestaurants - 收藏的餐廳數。
 */
const UserStatsCard = ({ stats }) => {
  const {
    reviewsCount = 0,
    photosCount = 0,
    likesReceived = 0,
    favoriteRestaurants = 0,
  } = stats;

  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-4">用戶數據</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-3 text-gray-700">
          <FontAwesomeIcon icon={faStar} className="text-yellow-500 w-5 h-5" />
          <p className="font-medium">
            <span className="text-gray-900 font-bold">{reviewsCount}</span>{" "}
            則食評
          </p>
        </div>
        <div className="flex items-center space-x-3 text-gray-700">
          <FontAwesomeIcon icon={faCamera} className="text-blue-500 w-5 h-5" />
          <p className="font-medium">
            <span className="text-gray-900 font-bold">{photosCount}</span>{" "}
            張照片
          </p>
        </div>
        <div className="flex items-center space-x-3 text-gray-700">
          <FontAwesomeIcon icon={faHeart} className="text-red-500 w-5 h-5" />
          <p className="font-medium">
            <span className="text-gray-900 font-bold">{likesReceived}</span>{" "}
            個讚
          </p>
        </div>
        <div className="flex items-center space-x-3 text-gray-700">
          <FontAwesomeIcon
            icon={faBookmark}
            className="text-teal-500 w-5 h-5"
          />
          <p className="font-medium">
            <span className="text-gray-900 font-bold">
              {favoriteRestaurants}
            </span>{" "}
            個收藏
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserStatsCard;
