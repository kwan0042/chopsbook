// src/components/user/Activities.js
import React from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { reviewFields } from "@/lib/translation-data";
import {
  faStar,
  faStarHalfStroke,
  faArrowRight,
  faSun,
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
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }
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
          <Link key={item.id} href={`/review/${item.id}`} className="w-full ">
            <div className="flex flex-col items-start p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex flex-wrap justify-between items-start sm:flex-nowrap mb-2">
                <div className="flex flex-wrap items-center space-x-2 min-w-0 sm:flex-nowrap">
                  <div className="md:flex items-center justify-between w-full whitespace-nowrap sm:w-auto sm:flex-shrink-0 pb-1 mb-1 border-b-2">
                    <div className="flex items-center">
                      {/* ⚡️ 修正: 將內層的 Link 替換為 <span>，避免巢狀 <a> 錯誤 */}
                      <span
                        className="font-semibold text-gray-800 text-lg hover:text-blue-600 transition duration-150 cursor-pointer"
                        onClick={(e) => e.stopPropagation()} // 防止點擊用戶名時觸發外部的 Link
                      >
                        {item.username}
                      </span>
                      <span className="flex items-center my-1 ml-2 ">
                        {renderStars(item.overallRating)}
                      </span>
                    </div>
                    <div className="md:ml-2">
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
                  <div className="flex items-center space-x-2 ml-0 sm:ml-2 mt-1 sm:mt-0 sm:flex-shrink-0">
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
                </div>

                {/* 日期保持在右側 */}
                <div className="flex-shrink-0 mt-2 sm:mt-0">
                  <span className="text-sm text-gray-500">{formattedDate}</span>
                </div>
              </div>
            </div>
          </Link>
        );

      case "mostLiked":
        return (
          <Link key={item.id} href={`/review/${item.id}`} className="w-full">
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
          <div key={item.id} className="relative w-full my-2 group">
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
    <section className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
      {items.length > 0 ? (
        <div
          className={
            gridLayout
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : flexLayout
              ? "flex flex-col md:flex-row gap-6 space-y-4 md:space-y-0"
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
    </section>
  );
};

export default Activities;
