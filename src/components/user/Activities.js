// src/components/user/Activities.js
import React, { useState } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { reviewFields } from "@/lib/translation-data";
import {
  faStar,
  faStarHalfStroke,
  faArrowRight,
  faSun,
  faArrowLeft, // ✅ 新增：用於圖片導航
  faTimes, // ✅ 新增：用於圖片彈窗
} from "@fortawesome/free-solid-svg-icons";
import {
  faStar as faSolidStar,
  faHeart,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons"; // ✅ 新增：用於收藏卡片
import {
  IconRosetteNumber1,
  IconRosetteNumber2,
  IconRosetteNumber3,
} from "@tabler/icons-react"; // ✅ 新增：用於收藏排名徽章

import {
  IconCoffee,
  IconSunset2,
  IconMoon,
  IconBuildingStore,
  IconMoped,
  IconPaperBag,
} from "@tabler/icons-react";
import Image from "next/image"; // 🚨 修正: 移除重複的 {} 包裹，避免錯誤

// ✅ 新增：每頁顯示的圖片數量
const IMAGES_PER_PAGE = 3;

/**
 * 通用的活動列表組件，可用於顯示食評、收藏、到訪等列表。
 * @param {object} props - 組件屬性
 * @param {string} props.title - 區塊標題
 * @param {Array} props.items - 要顯示的項目陣列
 * @param {boolean} props.loading - 是否正在載入
 * @param {string} props.noDataMessage - 無數據時顯示的訊息
 * @param {string} props.type - 列表類型 (e.g., 'reviews', 'favorites', 'likes', 'checkIns')
 */
const Activities = ({ title, items, loading, noDataMessage, type }) => {
  const [currentImagePages, setCurrentImagePages] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  // ✅ 新增：導航至下一頁圖片
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

  // ✅ 新增：導航至上一頁圖片
  const goToPrevImagePage = (reviewId) => {
    setCurrentImagePages((prev) => {
      const currentPage = prev[reviewId] || 0;
      return {
        ...prev,
        [reviewId]: Math.max(currentPage - 1, 0),
      };
    });
  };

  const renderTimeIcon = (timeValue) => {
    switch (timeValue) {
      case "morning":
        return (
          <IconCoffee stroke={2} className="h-5 md:h-full text-orange-500" />
        );
      case "noon":
        return (
          <FontAwesomeIcon
            icon={faSun}
            className="h-5 md:text-lg text-yellow-500"
          />
        );
      case "afternoon":
        return (
          <IconSunset2 stroke={2} className="h-5 md:h-full text-red-500" />
        );
      case "night":
        return <IconMoon stroke={2} className="h-5 md:h-full text-blue-500" />;
      default:
        return null;
    }
  };

  const renderServiceTypeIcon = (serviceTypeValue) => {
    switch (serviceTypeValue) {
      case "dineIn":
        return (
          <IconBuildingStore
            stroke={2}
            className="h-5 md:h-full text-gray-600 "
          />
        );
      case "delivery":
        return <IconMoped stroke={2} className="h-5 md:h-full text-gray-600" />;
      case "pickUp":
        return (
          <IconPaperBag stroke={2} className="h-5 md:h-full text-gray-600" />
        );
      default:
        return null;
    }
  };

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
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center text-yellow-400 pr-1">
        {Array.from({ length: fullStars }, (_, i) => (
          <FontAwesomeIcon key={`full-${i}`} icon={faStar} />
        ))}
        {hasHalfStar && <FontAwesomeIcon key="half" icon={faStarHalfStroke} />}
        {Array.from({ length: emptyStars }, (_, i) => (
          <FontAwesomeIcon
            key={`empty-${i}`}
            icon={faStar}
            className="text-gray-300 "
          />
        ))}
      </div>
    );
  };
  // ✅ 新增：從 FavRestaurantCard 搬來的渲染函式
  const renderRankBadge = (rank) => {
    const rankIcons = [
      IconRosetteNumber1,
      IconRosetteNumber2,
      IconRosetteNumber3,
    ];
    const IconComponent = rankIcons[rank];
    let backgroundColor = "";

    if (rank === 0) {
      backgroundColor = "bg-yellow-500";
    } else if (rank === 1) {
      backgroundColor = "bg-slate-400";
    } else if (rank === 2) {
      backgroundColor = "bg-amber-600";
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

  const renderItem = (item, index) => {
    // 🚨 修正：根據新的結構獲取菜系顯示名稱
    const getCuisineDisplayName = (item) => {
      // 優先使用 subCategory (如果存在且非空字串)
      if (item.subCategory && item.subCategory !== "") {
        // 如果子菜系是"不適用" (由表單邏輯傳入的空字串轉化)，則使用主菜系
        if (item.subCategory === "不適用") {
          return item.category || "N/A";
        }
        return item.subCategory;
      }
      // 否則使用 category
      return item.category || "N/A";
    };

    switch (type) {
      case "reviews":
        // ✅ 新增：日期格式化邏輯
        const reviewDate = item.createdAt ? new Date(item.createdAt) : null;
        const currentImagePage = currentImagePages[item.id] || 0;
        const startIndex = currentImagePage * IMAGES_PER_PAGE;
        const endIndex = startIndex + IMAGES_PER_PAGE;
        const displayedImages = item.uploadedImageUrls
          ? item.uploadedImageUrls.slice(startIndex, endIndex)
          : [];
        // 🚨 修正: 變數名稱從 review 改為 item
        const totalImagePages = item.uploadedImageUrls
          ? Math.ceil(item.uploadedImageUrls.length / IMAGES_PER_PAGE)
          : 0;
        let formattedDate = "";
        if (reviewDate && !isNaN(reviewDate)) {
          // 使用 toLocaleDateString 進行本地化格式化
          formattedDate = reviewDate.toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        } else {
          formattedDate = "未知日期";
        }
        // ✅ 結束新增：日期格式化邏輯

        return (
          <Link
            key={item.id}
            href={`/review/${item.id}`}
            className="w-full flex-shrink-0 md:flex-1 min-w-0"
          >
            <div className="flex flex-col items-start p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex flex-wrap md:block justify-between items-start sm:flex-nowrap mb-2 w-full">
                <div className="flex flex-wrap md:block items-center  min-w-0 sm:flex-nowrap">
                  <div className=" items-center justify-between w-full break-words sm:w-auto sm:flex-shrink-0  ">
                    <div className="flex items-center mb-1">
                      {/* ⚡️ 修正: 將內層的 Link 替換為 <span>，避免巢狀 <a> 錯誤 */}
                      <span
                        className="font-semibold text-gray-800 text-lg hover:text-blue-600 transition duration-150 cursor-pointer"
                        onClick={(e) => e.stopPropagation()} // 防止點擊用戶名時觸發外部的 Link
                      >
                        {item.restaurantName?.["zh-TW"] ||
                          item.restaurantName?.en ||
                          item.restaurantName || // 兼容如果 restaurantName 是純字串的情況
                          `未知餐廳`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center ">
                        {renderStars(item.overallRating)}
                      </span>

                      <span className="text-sm font-bold text-gray-500">
                        第
                        <span className="text-orange-400">
                          {item.visitCount}
                        </span>
                        次到訪
                      </span>
                    </div>
                  </div>

                  {/* 第二行內容：時段/類型圖示 */}
                  <div className="flex items-center justify-between space-x-2  pb-1 mb-1  sm:flex-shrink-0 border-b-2">
                    <div className="flex items-center gap-x-1">
                      {renderTimeIcon(item.timeOfDay)}
                      <span className="text-sm text-gray-600">
                        {reviewFields.timeOfDay.typeFields[item.timeOfDay]?.zh}
                      </span>
                      {renderServiceTypeIcon(item.serviceType)}
                      <span className="text-sm text-gray-600">
                        {
                          reviewFields.serviceType.typeFields[item.serviceType]
                            ?.zh
                        }
                      </span>
                    </div>
                    <div className="flex-shrink-0 ">
                      <span className="text-xs text-gray-500">
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 日期保持在右側 */}

                <div className="mb-2 w-full">
                  {/* ✅ 新增：食評標題 */}
                  <p className="text-base font-bold text-gray-700 line-clamp-2 mt-2">
                    {item.reviewTitle}
                  </p>
                </div>
                {item.uploadedImageUrls &&
                  item.uploadedImageUrls.length > 0 && (
                    <div className="md:p-0 relative w-full md:w-auto ">
                      {/* 圖片網格，強制為 2x2 佈局 */}
                      <div className="grid grid-cols-3 gap-1 md:gap-4 pb-3 border-b-2 ">
                        {displayedImages.map((image, index) => (
                          <div
                            key={index}
                            className="relative w-full aspect-square overflow-hidden rounded-lg shadow-sm cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault(); // 🚨 新增：防止點擊圖片時觸發外部 Link
                              e.stopPropagation(); // 🚨 新增：防止點擊圖片時觸發外部 Link
                              setSelectedImage(image);
                            }}
                          >
                            {/* 🚨 修正: 確保 Image 元件導入正確 */}
                            <Image
                              src={image.url}
                              alt={`${reviewFields.uploadedImageUrls} ${
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
                        <div className="flex items-center justify-between mt-4">
                          <button
                            // 🚨 修正: 傳入 item.id
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              goToPrevImagePage(item.id);
                            }}
                            disabled={currentImagePage === 0}
                            className="p-2 bg-white rounded-full shadow-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <FontAwesomeIcon icon={faArrowLeft} />
                          </button>
                          <span className="text-sm text-gray-500">
                            頁面 {currentImagePage + 1} / {totalImagePages}
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              goToNextImagePage(
                                item.id,
                                item.uploadedImageUrls.length
                              );
                            }}
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
            </div>
          </Link>
        );

      case "mostLiked":
        return (
          <Link
            key={item.id}
            href={`/review/${item.id}`}
            className=" flex-shrink-0 md:flex-1 min-w-0"
          >
            <div className="flex flex-col items-start p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex-grow flex flex-col justify-start">
                <span className="font-semibold text-gray-900 mb-1 line-clamp-1">
                  {item.restaurantName}
                </span>
                <div className="flex items-center text-red-500 mb-2">
                  <FontAwesomeIcon icon={faHeart} className="mr-1" />
                  <span className="text-sm">{item.likeCount || 0}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                  {item.title}
                </h3>
              </div>
            </div>
          </Link>
        );

      case "favorites":
        return (
          <div
            key={item.id}
            className="relative  my-2 group flex-shrink-0 md:flex-1 min-w-0"
          >
            <Link href={`/restaurants/${item.id}`} passHref>
              <div className="bg-white shadow-lg overflow-hidden transform transition duration-300 ease-in-out cursor-pointer h-fit flex flex-row items-stretch rounded-xl border border-gray-200 hover:shadow-md">
                {renderRankBadge(index)}

                <div className="p-3 flex-grow">
                  <div className="flex-grow text-left py-1">
                    <div className="flex items-center mb-1">
                      <h3 className="font-bold text-gray-900 leading-tight text-wrap text-base mr-2">
                        {item.restaurantName?.["zh-TW"] ||
                          item.restaurantName?.en ||
                          `未知餐廳`}
                      </h3>
                    </div>
                  </div>
                  {renderRatingStars(item.averageRating)}
                  <p className="text-gray-700 mb-1 text-wrap text-sm">
                    {item.fullAddress || "N/A"}
                  </p>

                  <p className="text-gray-700 mb-1 text-wrap text-sm">
                    {item.city || "N/A"} |{" "}
                    {/* 🚨 修正：使用新的函式獲取菜系名稱 */}
                    {getCuisineDisplayName(item)} | 人均: $
                    {item.avgSpending || "N/A"}
                  </p>
                </div>
              </div>
            </Link>

            {/* 這裡的移除按鈕只是設計，不具備功能 */}
          </div>
        );

      case "checkIns":
        return (
          <Link key={item.id} href={`/restaurants/${item.id}`}>
            <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
              <h3 className="font-bold text-gray-900">{item.restaurantName}</h3>
              <p className="text-sm text-gray-500">
                到訪次數：{item.checkInCount || 0}
              </p>
            </div>
          </Link>
        );

      default:
        return null;
    }
  };

  // 為了讓收藏卡片能夠垂直排列，我調整了佈局邏輯。
  // 讓 'favorites' 獨立於 'reviews' 和 'mostLiked'
  const gridLayout = type === "checkIns";
  const flexLayout = type === "reviews" || type === "mostLiked";
  const favoritesLayout = type === "favorites"; // 新增：用於收藏列表

  return (
    <section className="bg-white p-6 rounded-lg shadow-sm min-w-0">
      <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
      {items.length > 0 ? (
        <div
          className={
            gridLayout
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : flexLayout
              ? "flex flex-col md:flex-row gap-6 space-y-4 md:space-y-0 w-full"
              : favoritesLayout
              ? "space-y-3" // ⚡️ 收藏列表使用 space-y 保持垂直間距
              : "space-y-4"
          }
        >
          {/* 收藏列表通常需要顯示所有項目，這裡將 slice(0, 3) 移除或調整 */}
          {/* 我假設您只想顯示前三個，保持原樣 */}
          {items.slice(0, 3).map(renderItem)}
        </div>
      ) : (
        <p className="text-gray-500">{noDataMessage}</p>
      )}

      {/* ✅ 新增：圖片彈窗邏輯 */}
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
    </section>
  );
};

export default Activities;
