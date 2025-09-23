// src/components/personal/Activities.js
import React from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDate } from "@/hooks/auth/useUtils";
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
/**
 * 通用的活動列表組件，可用於顯示食評、收藏、打卡等列表。
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
    switch (type) {
      case "reviews":
        return (
          <Link key={item.id} href={`/review/${item.id}`} className="w-full ">
            <div className="flex flex-col items-start p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex-grow flex flex-col justify-start w-full">
                <span className="text-xl font-bold text-gray-800 line-clamp-1">
                  {item.restaurantName?.["zh-TW"] ||
                    item.restaurantName?.en ||
                    `未知餐廳`}
                </span>
                <div className="flex flex-col sm:flex-row justify-between w-full items-center">
                  <div className="flex items-center space-x-2 flex-grow">
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <div className="flex-shrink-0  sm:mt-0 ml-auto">
                    <span className="text-sm font-bold text-gray-500 whitespace-nowrap">
                      第{" "}
                      <span className="text-orange-400">{item.visitCount}</span>{" "}
                      次打卡
                    </span>
                  </div>
                </div>

                <span className="text-base text-gray-900 my-2 line-clamp-1">
                  {item.reviewTitle}
                </span>
                <div className="flex items-center text-black my-2">
                  <span className="text-sm pr-1">整體評分:</span>
                  {renderRatingStars(item.overallRating)}
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

      // 🚨 新增的 'favorites' 類型，使用新的佈局
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
                    {item.city || "N/A"} | {item.cuisineType || "N/A"} | 人均: $
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
                打卡次數：{item.checkInCount || 0}
              </p>
            </div>
          </Link>
        );

      default:
        return null;
    }
  };

  const gridLayout = type === "checkIns";
  const flexLayout =
    type === "reviews" || type === "mostLiked" || type === "favorites"; // 🚨 包含 'favorites'

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
              : "space-y-4"
          }
        >
          {items.slice(0, 3).map(renderItem)}
        </div>
      ) : (
        <p className="text-gray-500">{noDataMessage}</p>
      )}
    </section>
  );
};

export default Activities;
