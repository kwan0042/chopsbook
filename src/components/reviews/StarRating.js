"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faStarHalf } from "@fortawesome/free-solid-svg-icons";

const StarRating = ({ value, onValueChange }) => {
  const [hoverValue, setHoverValue] = useState(0);

  // 處理滑鼠移動，動態顯示分數
  const handleMouseMove = (e) => {
    const container = e.currentTarget;
    const { left, width } = container.getBoundingClientRect();
    const x = e.clientX - left;

    // 將滑鼠位置轉換為 0-5 的評分，並四捨五入到最近的 0.5
    const rawRating = (x / width) * 5;
    const newHoverValue = Math.round(rawRating * 2) / 2;
    setHoverValue(newHoverValue);
  };

  // 處理滑鼠點擊，更新評分
  const handleClick = (e) => {
    const container = e.currentTarget;
    const { left, width } = container.getBoundingClientRect();
    const x = e.clientX - left;

    const rawRating = (x / width) * 5;
    const newValue = Math.round(rawRating * 2) / 2;
    onValueChange(newValue);
  };

  // 處理滑鼠離開，重置預覽狀態
  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  return (
    <>
      <div
        className="flex items-center space-x-0.5 cursor-pointer"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: 5 }, (_, index) => {
          // 根據滑鼠懸停或已選擇的評分來決定顯示狀態
          const ratingToDisplay = hoverValue || value;
          const fullStar = ratingToDisplay >= index + 1;
          const halfStar =
            ratingToDisplay >= index + 0.5 && ratingToDisplay < index + 1;

          return (
            <div
              key={index}
              className="w-12 h-12 relative flex items-center justify-center"
            >
              {/* 滿星圖標 */}
              <FontAwesomeIcon
                icon={faStar}
                className={`w-full h-full transition-colors duration-200 fa-2xl ${
                  fullStar || halfStar ? "text-yellow-400" : "text-gray-300"
                }`}
              />
              {/* 半星圖標 - 覆蓋在滿星圖標上 */}
              {halfStar && (
                <FontAwesomeIcon
                  icon={faStarHalf}
                  className="absolute w-full h-full text-yellow-400 transition-colors duration-200 fa-2xl"
                />
              )}
            </div>
          );
        })}
        {/* 動態分數顯示 */}
      </div>
      <span className="mx-2 text-base font-bold text-gray-800 transition-opacity duration-200">
        {(hoverValue || value).toFixed(1)}
      </span>
    </>
  );
};

export default StarRating;
