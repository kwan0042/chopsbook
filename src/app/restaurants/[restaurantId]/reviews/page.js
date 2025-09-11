"use client";

import React, { useContext, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image"; // 引入 Next.js 的 Image 元件
import { AuthContext } from "../../../../lib/auth-context";
import { useRestaurantData } from "../../../../hooks/useRestaurantData";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faStarHalfStroke,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

// 引入翻譯數據
import { reviewFields } from "../../../../lib/translation-data";

// 輔助函數：將評分轉換為星星圖標
const renderStars = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center text-yellow-400">
      {Array.from({ length: fullStars }, (_, i) => (
        <FontAwesomeIcon key={`full-${i}`} icon={faStar} />
      ))}
      {hasHalfStar && <FontAwesomeIcon key="half" icon={faStarHalfStroke} />}
      {Array.from({ length: emptyStars }, (_, i) => (
        <FontAwesomeIcon
          key={`empty-${i}`}
          icon={faStar}
          className="text-gray-300"
        />
      ))}
    </div>
  );
};

export default function RestaurantReviewsPage() {
  const { restaurantId } = useParams();
  const { db, appId } = useContext(AuthContext);

  const { recentReviews, loading, error } = useRestaurantData(
    db,
    appId,
    restaurantId
  );

  // 狀態來管理詳細評分的顯示/隱藏
  const [expandedReviews, setExpandedReviews] = useState({});

  const toggleDetails = (reviewId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[300px] text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 ">所有評論</h2>
      {recentReviews.length === 0 ? (
        <div className="text-center text-gray-600 p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p>此餐廳尚未有任何評論。</p>
        </div>
      ) : (
        <div className="space-y-6  mx-auto">
          {recentReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-800 text-lg">
                    {review.username || "匿名用戶"}
                  </span>
                  {renderStars(review.overallRating)}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleString("zh-TW", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() => toggleDetails(review.id)}
                    className="flex items-center text-blue-500 hover:text-blue-700 transition-colors duration-200 focus:outline-none"
                  >
                    <span className="text-sm">詳細評分</span>
                    <FontAwesomeIcon
                      icon={
                        expandedReviews[review.id] ? faChevronUp : faChevronDown
                      }
                      className="ml-1 text-xs"
                    />
                  </button>
                </div>
              </div>

              {/* 詳細評分區域 - 根據狀態顯示/隱藏 */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedReviews[review.id]
                    ? "max-h-96 opacity-100 mt-4"
                    : "max-h-0 opacity-0 mt-0"
                }`}
              >
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    {reviewFields.detailedRatings.zh}
                  </h3>
                  <div className="grid grid-cols-6 gap-2 text-sm text-gray-600">
                    {Object.entries(review.detailedRatings || {}).map(
                      ([key, value]) => {
                        // 如果 key 是 'drinks' 且值為 0，則不渲染此項目
                        if (key === "drinks" && value === 0.0) {
                          return null;
                        }

                        return (
                          <div
                            key={key}
                            className="flex items-center capitalize"
                          >
                            <span>
                              {reviewFields.detailedRatings.nestedFields[key]
                                ?.zh || key}
                              :
                            </span>
                            <div className="flex items-center">
                              {renderStars(value)}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
              <div className="my-3 w-full h-0.5 bg-orange-200 rounded-full"></div>
              <h1 className="text-gray-700 leading-relaxed mb-2 mt-4 text-lg font-bold">
                {review.reviewTitle}
              </h1>
              <div className="my-1 w-100 h-0.5 bg-gray-100 rounded-full"></div>
              <p className="text-gray-700 leading-relaxed mb-4 mt-2">
                {review.reviewContent}
              </p>

              {/* 圖片區域 */}
              {review.uploadedImages && review.uploadedImages.length > 0 && (
                <div className="mt-4">
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {review.uploadedImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative w-50 h-50 aspect-square overflow-hidden rounded-lg "
                      >
                        <Image
                          src={image.url}
                          alt={`${reviewFields.uploadedImages.zh} ${index + 1}`}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          className="object-cover"
                          unoptimized // 由於圖片來自外部來源，通常加上此屬性
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-4">
                <span className="bg-gray-100 px-3 py-1 rounded-full">
                  {reviewFields.costPerPerson.zh}: CAD$ {review.costPerPerson}
                </span>
                <span className="bg-gray-100 px-3 py-1 rounded-full">
                  {reviewFields.serviceType.zh}:{" "}
                  {reviewFields.serviceType.typeFields[review.serviceType]
                    ?.zh || review.serviceType}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
