"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams, usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar as faSolidStar,
  faBookmark as faSolidBookmark,
  faComment,
  faMapMarkerAlt,
  faWallet,
  faTag,
  faClock,
  faUtensils,
  faLink,
  faPhone,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import {
  faStar as faRegularStar,
  faBookmark as faRegularBookmark,
} from "@fortawesome/free-regular-svg-icons";
import { AuthContext } from "../../../lib/auth-context";
import { RestaurantContext } from "../../../lib/restaurant-context";
import Link from "next/link";
import LoadingSpinner from "../../../components/LoadingSpinner";

// 輔助函數：根據營業時間和自定義狀態判斷餐廳營業狀態。
const getOperatingStatus = (restaurant) => {
  if (restaurant.isPermanentlyClosed) return "已結業";
  if (restaurant.isTemporarilyClosed) return "暫時休業";

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = 星期日, 1 = 星期一, ..., 6 = 星期六
  const dayNames = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  const currentDayName = dayNames[dayOfWeek];

  if (restaurant.businessHours) {
    if (
      restaurant.businessHours.includes(currentDayName) ||
      restaurant.businessHours.includes("每日")
    ) {
      return "營業中";
    }
  }
  return "休假中";
};

// Layout 元件
export default function RestaurantDetailLayout({ children }) {
  const { restaurantId } = useParams();
  const pathname = usePathname();
  const { db, currentUser, appId, setModalMessage, toggleFavoriteRestaurant } =
    useContext(AuthContext);

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFavorited =
    currentUser?.favoriteRestaurants?.includes(restaurantId) || false;

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!db || !restaurantId) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(
          db,
          `artifacts/${appId}/public/data/restaurants`,
          restaurantId
        );
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRestaurant({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("找不到該餐廳的詳細資訊。");
        }
      } catch (err) {
        console.error("Error fetching restaurant details:", err);
        setError("加載餐廳詳細資訊失敗: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [db, restaurantId, appId]);

  const handleToggleFavorite = useCallback(async () => {
    if (!currentUser) {
      setModalMessage("請先登入才能收藏或取消收藏餐廳。");
      return;
    }
    await toggleFavoriteRestaurant(restaurantId);
  }, [currentUser, toggleFavoriteRestaurant, restaurantId, setModalMessage]);

  const renderRatingStars = (rating) => (
    <div className="flex items-center">
      {Array.from({ length: 5 }, (_, index) => (
        <FontAwesomeIcon
          key={index}
          icon={index < Math.floor(rating || 0) ? faSolidStar : faRegularStar}
          className={`text-base ${
            index < Math.floor(rating || 0)
              ? "text-yellow-500"
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="text-gray-800 font-bold text-base ml-2">
        {rating?.toFixed(1) || "N/A"}
      </span>
      <span className="text-gray-600 ml-3 text-sm">
        <FontAwesomeIcon icon={faComment} className="mr-1 text-blue-500" />
        {restaurant?.reviewCount || 0} 評論
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 text-red-600 text-base p-4">
        {error}
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 text-gray-700 text-base p-4">
        沒有找到餐廳。
      </div>
    );
  }

  const operatingStatus = getOperatingStatus(restaurant);

  return (
    <RestaurantContext.Provider value={{ restaurant }}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className=" mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
          {/* 頂部名稱和收藏按鈕 */}
          <div className="relative p-6 border-b border-gray-200">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 leading-tight">
              {restaurant.restaurantNameZh ||
                restaurant.restaurantNameEn ||
                "未知餐廳"}
            </h1>
            <button
              onClick={handleToggleFavorite}
              className="absolute top-6 right-6 z-10 p-2 bg-transparent border-none
                         text-yellow-500 hover:scale-110 transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              aria-label={isFavorited ? "取消收藏" : "收藏餐廳"}
            >
              <FontAwesomeIcon
                icon={isFavorited ? faSolidBookmark : faRegularBookmark}
                className="text-3xl"
              />
            </button>
          </div>

          {/* 餐廳基本資訊 */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 border-b border-gray-200">
            <div>
              {renderRatingStars(restaurant.rating)}
              <p className="mt-2 text-base">
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  className="mr-2 text-gray-500"
                />
                {restaurant.fullAddress || "N/A"}
              </p>
              <p className="mt-1 text-base">
                <FontAwesomeIcon
                  icon={faUtensils}
                  className="mr-2 text-gray-500"
                />
                {restaurant.cuisineType || "N/A"}
                {restaurant.tags?.length > 0 &&
                  ` | ${restaurant.tags.join(", ")}`}
              </p>
            </div>
            <div className="md:text-right">
              <p className="text-base">
                <FontAwesomeIcon icon={faWallet} className="mr-2 text-gray-500" />
                人均: ${restaurant.avgSpending || "N/A"}
              </p>
              <p className="mt-1 text-base">
                <FontAwesomeIcon icon={faClock} className="mr-2 text-gray-500" />
                <span
                  className={`font-bold ${
                    operatingStatus === "營業中"
                      ? "text-green-600"
                      : operatingStatus === "暫時休業"
                      ? "text-orange-500"
                      : operatingStatus === "休假中"
                      ? "text-blue-500"
                      : "text-red-600"
                  }`}
                >
                  {operatingStatus}
                </span>
              </p>
            </div>
          </div>

          {/* 標籤 (Tags) */}
          {restaurant.tags && restaurant.tags.length > 0 && (
            <div className="p-6 border-b border-gray-200 flex flex-wrap gap-2">
              {restaurant.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full flex items-center"
                >
                  <FontAwesomeIcon icon={faTag} className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 導航標籤 */}
          <div className="flex justify-around p-4 bg-gray-100 border-b border-gray-200">
            <Link
              href={`/restaurants/${restaurantId}`}
              className={`py-2 px-4 text-base font-medium transition-colors duration-200 ease-in-out
                ${
                  pathname === `/restaurants/${restaurantId}`
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                }`}
            >
              總覽
            </Link>
            <Link
              href={`/restaurants/${restaurantId}/menu`}
              className={`py-2 px-4 text-base font-medium transition-colors duration-200 ease-in-out
                ${
                  pathname === `/restaurants/${restaurantId}/menu`
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                }`}
            >
              菜單
            </Link>
            <Link
              href={`/restaurants/${restaurantId}/photos`}
              className={`py-2 px-4 text-base font-medium transition-colors duration-200 ease-in-out
                ${
                  pathname === `/restaurants/${restaurantId}/photos`
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                }`}
            >
              照片
            </Link>
            <Link
              href={`/restaurants/${restaurantId}/reviews`}
              className={`py-2 px-4 text-base font-medium transition-colors duration-200 ease-in-out
                ${
                  pathname === `/restaurants/${restaurantId}/reviews`
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                }`}
            >
              評論
            </Link>
            <Link
              href={`/restaurants/${restaurantId}/map`}
              className={`py-2 px-4 text-base font-medium transition-colors duration-200 ease-in-out
                ${
                  pathname === `/restaurants/${restaurantId}/map`
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                }`}
            >
              地圖
            </Link>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row mt-4 gap-4">
              <div className="flex-1">
                <div className="bg-white shadow-md rounded-xl">{children}</div>
              </div>
              <div className="md:w-1/3 flex-shrink-0">
                <div className="bg-white rounded-xl shadow-xl sticky top-8">
                  <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <h2 className="text-base font-bold text-gray-800 mb-4">
                      餐廳資訊
                    </h2>
                    <div className="space-y-2 text-gray-700">
                      <p>
                        <FontAwesomeIcon
                          icon={faPhone}
                          className="mr-2 text-gray-500"
                        />
                        電話: {restaurant.phone || "N/A"}
                      </p>
                      <p>
                        <FontAwesomeIcon
                          icon={faClock}
                          className="mr-2 text-gray-500"
                        />
                        營業時間: {restaurant.businessHours || "N/A"}
                      </p>
                      <p>
                        <FontAwesomeIcon
                          icon={faGlobe}
                          className="mr-2 text-gray-500"
                        />
                        網站:{" "}
                        {restaurant.website ? (
                          <a
                            href={restaurant.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {restaurant.website}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </p>
                      {restaurant.description && (
                        <p className="pt-2">{restaurant.description}</p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RestaurantContext.Provider>
  );
}
