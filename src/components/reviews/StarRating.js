import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faStarHalfAlt } from "@fortawesome/free-solid-svg-icons";

const StarRating = ({ value, onValueChange }) => {
  const [hoverValue, setHoverValue] = useState(0);

  // 處理滑鼠移動，動態顯示半星或滿星
  const handleMouseMove = (e, index) => {
    const starElement = e.currentTarget;
    const { left, width } = starElement.getBoundingClientRect();
    const x = e.clientX - left;

    // 將星星寬度分為三個等份
    const thirdWidth = width / 3;
    const isZero = x < thirdWidth;
    const isHalf = x >= thirdWidth && x < thirdWidth * 2;

    let newValue = 0;
    if (isZero) {
      // 在星星最左三分之一時，評分為 0
      newValue = index;
    } else if (isHalf) {
      // 在中間三分之一時，評分為 0.5
      newValue = index + 0.5;
    } else {
      // 在右邊三分之一時，評分為 1
      newValue = index + 1;
    }
    setHoverValue(newValue);
  };

  // 處理滑鼠點擊，更新評分
  const handleClick = (e, index) => {
    const starElement = e.currentTarget;
    const { left, width } = starElement.getBoundingClientRect();
    const x = e.clientX - left;

    const thirdWidth = width / 3;
    const isZero = x < thirdWidth;
    const isHalf = x >= thirdWidth && x < thirdWidth * 2;

    let newValue = 0;
    if (isZero) {
      newValue = index;
    } else if (isHalf) {
      newValue = index + 0.5;
    } else {
      newValue = index + 1;
    }
    onValueChange(newValue);
  };

  // 處理滑鼠離開，重置預覽狀態
  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  return (
    <div className="flex items-center space-x-0.5 cursor-pointer">
      {Array.from({ length: 5 }, (_, index) => {
        const ratingToDisplay = hoverValue || value;
        const fullStar = ratingToDisplay >= index + 1;
        const halfStar =
          ratingToDisplay >= index + 0.5 && ratingToDisplay < index + 1;

        return (
          <div
            key={index}
            className="w-12 h-12 relative flex items-center justify-center"
            onMouseMove={(e) => handleMouseMove(e, index)}
            onClick={(e) => handleClick(e, index)}
            onMouseLeave={handleMouseLeave}
          >
            {/* 滿星圖標 */}
            <FontAwesomeIcon
              icon={faStar}
              className={`w-full h-full transition-colors duration-200 fa-2xl ${
                fullStar ? "text-yellow-400" : "text-gray-300"
              }`}
            />
            {/* 半星圖標 - 覆蓋在滿星圖標上 */}
            {halfStar && (
              <FontAwesomeIcon
                icon={faStarHalfAlt}
                className="absolute  w-full h-full text-yellow-400 transition-colors duration-200 fa-2xl"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StarRating;
