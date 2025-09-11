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
  faArrowLeft, // 引入左箭頭圖標
  faArrowRight, // 引入右箭頭圖標
  faSun, // 引入太陽圖標
  faTimes, // 引入關閉圖標
} from "@fortawesome/free-solid-svg-icons";
import {
  IconCoffee,
  IconSunset2,
  IconMoon,
  IconBuildingStore,
  IconMoped,
  IconPaperBag,
} from "@tabler/icons-react";

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

// 輔助函數：根據時段渲染圖標
const renderTimeIcon = (timeValue) => {
  switch (timeValue) {
    case "morning":
      return <IconCoffee stroke={2} className="text-2xl text-orange-500" />;
    case "noon":
      return (
        <FontAwesomeIcon icon={faSun} className="text-2xl text-yellow-500" />
      );
    case "afternoon":
      return <IconSunset2 stroke={2} className="text-2xl text-red-500" />;
    case "night":
      return <IconMoon stroke={2} className="text-2xl text-blue-500" />;
    default:
      return null;
  }
};

// 輔助函數：根據服務類型渲染圖標
const renderServiceTypeIcon = (serviceTypeValue) => {
  switch (serviceTypeValue) {
    case "dineIn":
      return <IconBuildingStore stroke={2} className="text-xl text-gray-600" />;
    case "delivery":
      return <IconMoped stroke={2} className="text-xl text-gray-600" />;
    case "pickUp":
      return <IconPaperBag stroke={2} className="text-xl text-gray-600" />;
    default:
      return null;
  }
};

// 每頁顯示的圖片數量
const IMAGES_PER_PAGE = 4;

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
  // 狀態來管理每條評論的圖片頁碼
  const [currentImagePages, setCurrentImagePages] = useState({});
  // 狀態來管理被點擊放大的圖片
  const [selectedImage, setSelectedImage] = useState(null);

  const toggleDetails = (reviewId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const goToNextImagePage = (reviewId, totalImages) => {
    setCurrentImagePages((prev) => {
      const currentPage = prev[reviewId] || 0;
      const maxPage = Math.ceil(totalImages / IMAGES_PER_PAGE) - 1;
      return {
        ...prev,
        [reviewId]: Math.min(currentPage + 1, maxPage),
      };
    });
  };

  const goToPrevImagePage = (reviewId) => {
    setCurrentImagePages((prev) => {
      const currentPage = prev[reviewId] || 0;
      return {
        ...prev,
        [reviewId]: Math.max(currentPage - 1, 0),
      };
    });
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
          {recentReviews.map((review) => {
            const currentImagePage = currentImagePages[review.id] || 0;
            const startIndex = currentImagePage * IMAGES_PER_PAGE;
            const endIndex = startIndex + IMAGES_PER_PAGE;
            const displayedImages = review.uploadedImages
              ? review.uploadedImages.slice(startIndex, endIndex)
              : [];
            const totalImagePages = review.uploadedImages
              ? Math.ceil(review.uploadedImages.length / IMAGES_PER_PAGE)
              : 0;

            return (
              <div
                key={review.id}
                className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-800 text-lg">
                      {review.username}
                    </span>
                    {renderStars(review.overallRating)}{review.overallRating} ｜
                    {/* 在總評分旁顯示用餐時段和用餐類型圖示 */}
                    <div className="flex items-center space-x-2 ml-2">
                      {renderTimeIcon(review.timeOfDay)}
                      <span className="text-sm text-gray-600">
                        {
                          reviewFields.timeOfDay.typeFields[review.timeOfDay]
                            ?.zh
                        }
                      </span> 
                      {renderServiceTypeIcon(review.serviceType)}
                      <span className="text-sm text-gray-600">
                        {
                          reviewFields.serviceType.typeFields[
                            review.serviceType
                          ]?.zh
                        }
                      </span>
                    </div>
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
                          expandedReviews[review.id]
                            ? faChevronUp
                            : faChevronDown
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
                {/* 修正 'gip-4' 為 'gap-4' 並加入圖片分頁邏輯 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h1 className="text-gray-700 leading-relaxed mb-2 mt-0 text-lg font-bold">
                      {review.reviewTitle}
                    </h1>
                    <div className="my-1 w-full h-0.5 bg-gray-100 rounded-full"></div>
                    <p className="text-gray-700 leading-relaxed mb-4 mt-2">
                      {review.reviewContent}
                    </p>
                  </div>
                  {/* 圖片區域 */}
                  {review.uploadedImages &&
                    review.uploadedImages.length > 0 && (
                      <div className="mx-2 p-4 relative">
                        {/* 圖片網格，強制為 2x2 佈局 */}
                        <div className="grid grid-cols-2 gap-4">
                          {displayedImages.map((image, index) => (
                            <div
                              key={index}
                              className="relative w-full aspect-square overflow-hidden rounded-lg shadow-sm cursor-pointer"
                              onClick={() => setSelectedImage(image)}
                            >
                              <Image
                                src={image.url}
                                alt={`${reviewFields.uploadedImages.zh} ${
                                  index + startIndex + 1
                                }`}
                                fill
                                sizes="(max-width: 640px) 50vw, 25vw"
                                className="object-cover"
                                unoptimized={
                                  process.env.NODE_ENV === "development"
                                }
                              />
                              {/* 顯示圖片描述 */}
                              {image.description && (
                                <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white text-xs p-1 text-center truncate">
                                  {image.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* 導航按鈕和頁碼 */}
                        {totalImagePages > 1 && (
                          <div className="flex items-center justify-between mt-2">
                            <button
                              onClick={() => goToPrevImagePage(review.id)}
                              disabled={currentImagePage === 0}
                              className="p-2 bg-white rounded-full shadow-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <FontAwesomeIcon icon={faArrowLeft} />
                            </button>
                            <span className="text-sm text-gray-500">
                              頁面 {currentImagePage + 1} / {totalImagePages}
                            </span>
                            <button
                              onClick={() =>
                                goToNextImagePage(
                                  review.id,
                                  review.uploadedImages.length
                                )
                              }
                              disabled={
                                currentImagePage === totalImagePages - 1
                              }
                              className="p-2 bg-white rounded-full shadow-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <FontAwesomeIcon icon={faArrowRight} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-4">
                  <span className="bg-gray-100 px-3 py-1 rounded-full">
                    {reviewFields.costPerPerson.zh}: CAD$ {review.costPerPerson}
                  </span>
                  {/* 移除 serviceType 的文字顯示 */}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 圖片放大檢視模式 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"
          onClick={() => setSelectedImage(null)} // 點擊背景關閉
        >
          <div
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()} // 點擊此區域不關閉
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <Image
              src={selectedImage.url}
              alt={selectedImage.description || "放大圖片"}
              width={800}
              height={600}
              className="rounded-lg shadow-lg"
              style={{ objectFit: "contain", maxHeight: "80vh" }}
              unoptimized={process.env.NODE_ENV === "development"}
            />
            {selectedImage.description && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white text-sm p-2 rounded-lg">
                {selectedImage.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
