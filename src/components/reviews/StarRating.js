"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

const StarRating = ({ value, onValueChange }) => {
  // 確保傳入的 value 是有效的整數評分 (0-5)
  const safeValue = Math.min(5, Math.max(0, Math.round(value || 0)));
  const [hoverValue, setHoverValue] = useState(0);

  // 處理滑鼠離開，重置預覽狀態
  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  // 處理點擊事件
  const handleStarClick = (starValue) => {
    if (starValue === 1 && safeValue === 1) {
      // 邏輯修改：
      // 如果用戶點擊的是第一顆星 (starValue === 1)
      // 且當前選中的評分已經是 1 (safeValue === 1)
      // 則將評分設為 0 (取消選取)
      onValueChange(0);
    } else {
      // 否則，正常設定為當前點擊的星數
      onValueChange(starValue);
    }
  };

  return (
    <>
      <div
        className="flex items-center space-x-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: 5 }, (_, index) => {
          // 評分值，從 1 到 5
          const starValue = index + 1;

          // 實際顯示的評分：優先使用懸停值，否則使用傳入的已選值
          const ratingToDisplay = hoverValue || safeValue;

          // 判斷當前星星是否應該被填滿 (整數判斷)
          const isFilled = ratingToDisplay >= starValue;

          return (
            <div
              key={index}
              className="w-12 h-12 relative flex items-center justify-center cursor-pointer"
              // 滑鼠進入：設定懸停值為當前星星的評分 (1, 2, 3, 4, 或 5)
              onMouseEnter={() => setHoverValue(starValue)}
              // 點擊：呼叫包含取消邏輯的新處理函數
              onClick={() => handleStarClick(starValue)}
            >
              {/* 滿星圖標 */}
              <FontAwesomeIcon
                icon={faStar}
                className={`w-full h-full transition-colors duration-200 fa-2xl ${
                  isFilled ? "text-yellow-400" : "text-gray-300"
                }`}
              />
            </div>
          );
        })}
        {/* 動態分數顯示 */}
      </div>
      <span className="ml-2 text-base font-bold text-gray-800 transition-opacity duration-200">
        {/* 顯示整數評分 */}
        {(hoverValue || safeValue).toFixed(0)}
      </span>
      
    </>
  );
};

export default StarRating;
