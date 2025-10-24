"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faStarHalfStroke,
  faChevronDown,
  faChevronUp,
  faArrowLeft,
  faArrowRight,
  faSun,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import {
  IconCoffee,
  IconSunset2,
  IconMoon,
  IconBuildingStore,
  IconMoped,
  IconPaperBag,
} from "@tabler/icons-react";
import Link from "next/link";
import { reviewFields } from "@/lib/translation-data";

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

export default function ReviewsList({ publishedReviews }) {
  const [expandedReviews, setExpandedReviews] = useState({});
  const [currentImagePages, setCurrentImagePages] = useState({});
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

  return (
    <div className="space-y-6 mx-auto">
      {publishedReviews.map((review) => {
        const currentImagePage = currentImagePages[review.id] || 0;
        const startIndex = currentImagePage * IMAGES_PER_PAGE;
        const endIndex = startIndex + IMAGES_PER_PAGE;
        const displayedImages = review.uploadedImageUrls
          ? review.uploadedImageUrls.slice(startIndex, endIndex)
          : [];
        const totalImagePages = review.uploadedImageUrls
          ? Math.ceil(review.uploadedImageUrls.length / IMAGES_PER_PAGE)
          : 0;

        // ✅ 更新餐廳名稱的獲取方式
        const restaurantName =
          review.restaurantName?.["zh-TW"] ||
          review.restaurantName?.en ||
          "餐廳名稱未知";

        return (
          <div
            key={review.id}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              {/* 顯示餐廳名稱，使用 Link 元件 */}
              <Link
                href={`/restaurant/${review.restaurantId}/reviews`}
                className="text-xl font-bold text-gray-800 hover:underline mb-2 sm:mb-0"
              >
                {restaurantName}
              </Link>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-500">
                  第{" "}
                  <span className="text-orange-400">{review.visitCount}</span>{" "}
                  次到訪
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleString("zh-TW", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* 顯示總體評分 */}
            <div className="flex items-center space-x-2 my-2">
              {renderStars(review.overallRating)}
              <span className="font-semibold text-gray-800 text-lg">
                {review.overallRating}
              </span>
              <span className="text-sm text-gray-500">
                ({review.overallRating} / 5)
              </span>
            </div>

            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-800 text-sm">
                  {review.username}
                </span>
                <div className="flex items-center space-x-2 ml-2">
                  {renderTimeIcon(review.timeOfDay)}
                  <span className="text-sm text-gray-600">
                    {reviewFields.timeOfDay.typeFields[review.timeOfDay]?.zh}
                  </span>
                  {renderServiceTypeIcon(review.serviceType)}
                  <span className="text-sm text-gray-600">
                    {
                      reviewFields.serviceType.typeFields[review.serviceType]
                        ?.zh
                    }
                  </span>
                </div>
              </div>
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
                  {Object.entries(review.ratings || {}).map(([key, value]) => {
                    if (key === "drinks" && value === 0.0) {
                      return null;
                    }
                    return (
                      <div
                        key={key}
                        className="flex items-center capitalize whitespace-nowrap "
                      >
                        <span className="w-11">
                          {reviewFields.detailedRatings.nestedFields[key]?.zh ||
                            key}
                          :
                        </span>
                        <div className="flex items-center">
                          {renderStars(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="my-3 w-full h-0.5 bg-orange-200 rounded-full"></div>
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
              {review.uploadedImageUrls &&
                review.uploadedImageUrls.length > 0 && (
                  <div className="mx-2 p-4 relative">
                    <div className="grid grid-cols-2 gap-4">
                      {displayedImages.map((image, index) => (
                        <div
                          key={index}
                          className="relative w-full aspect-square overflow-hidden rounded-lg shadow-sm cursor-pointer"
                          onClick={() => setSelectedImage(image)}
                        >
                          <Image
                            src={image.url}
                            alt={`${reviewFields.uploadedImageUrls} ${
                              index + startIndex + 1
                            }`}
                            fill
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-cover"
                            unoptimized={process.env.NODE_ENV === "development"}
                          />
                          {image.description && (
                            <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white text-xs p-1 text-center truncate">
                              {image.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
                              review.uploadedImageUrls.length
                            )
                          }
                          disabled={currentImagePage === totalImagePages - 1}
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
            </div>
          </div>
        );
      })}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors"
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
