// src/app/restaurants/[restaurantId]/RestaurantDetailLayout.js
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
  faCreditCard,
  faInfoCircle,
  faBuilding,
  faChair,
} from "@fortawesome/free-solid-svg-icons";
import {
  faStar as faRegularStar,
  faBookmark as faRegularBookmark,
} from "@fortawesome/free-regular-svg-icons";
import { AuthContext } from "../../../lib/auth-context";
import { RestaurantContext } from "../../../lib/restaurant-context";
import Link from "next/link";
import LoadingSpinner from "../../../components/LoadingSpinner";
import Navbar from "@/components/Navbar";

// 導入新的 Hook
import useRestaurantStatus from "@/hooks/useRestaurantStatus";

// Layout 元件
export default function RestaurantDetailLayout({ children }) {
  const { restaurantId } = useParams();
  const pathname = usePathname();
  const { db, currentUser, appId, setModalMessage, toggleFavoriteRestaurant } =
    useContext(AuthContext);

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 修正：將 Hook 呼叫移到所有條件式渲染之前
  // 新的 Hook 會回傳一個物件，包含 text 和 color
  const { text: operatingStatus, color: operatingStatusColor } =
    useRestaurantStatus(restaurant);

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
          const fetchedData = docSnap.data();
          const normalizedBusinessHours = Array.isArray(
            fetchedData.businessHours
          )
            ? fetchedData.businessHours
            : [];
          const normalizedFacadePhotoUrls = Array.isArray(
            fetchedData.facadePhotoUrls
          )
            ? fetchedData.facadePhotoUrls
            : fetchedData.facadePhotoUrl
            ? [fetchedData.facadePhotoUrl]
            : [];
          const avgSpending = parseFloat(fetchedData.avgSpending);

          setRestaurant({
            id: docSnap.id,
            ...fetchedData,
            avgSpending: isNaN(avgSpending) ? null : avgSpending,
            businessHours: normalizedBusinessHours,
            facadePhotoUrls: normalizedFacadePhotoUrls,
          });
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

  const formatBusinessHours = (hoursArray) => {
    if (!Array.isArray(hoursArray) || hoursArray.length === 0) {
      return <div>N/A</div>;
    }

    const sortedHours = [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
    ].map((dayName) => hoursArray.find((h) => h.day === dayName));

    return (
      <div className="space-y-1">
        {sortedHours.map((h, index) => (
          <div key={index}>
            <span className="font-bold">{h.day}:</span>{" "}
            {h?.isOpen ? `${h.startTime} - ${h.endTime}` : "休息"}
          </div>
        ))}
      </div>
    );
  };

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

  return (
    <RestaurantContext.Provider value={{ restaurant }}>
      <div className="flex flex-col min-h-screen">
        <Navbar onShowFilterModal={() => {}} onSearch={() => {}} />
        <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
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
                         text-yellow-500 hover:scale-110 transition duration-200 "
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
                  <FontAwesomeIcon
                    icon={faWallet}
                    className="mr-2 text-gray-500"
                  />
                  人均:{" "}
                  {restaurant.avgSpending
                    ? `$${restaurant.avgSpending}`
                    : "N/A"}
                </p>
                <p className="mt-1 text-base">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="mr-2 text-gray-500"
                  />
                  <span className={`font-bold ${operatingStatusColor}`}>
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
                  <div className="bg-white shadow-md rounded-xl p-6">
                    {children}
                  </div>
                </div>
                <div className="md:w-1/3 flex-shrink-0">
                  <div className="bg-white rounded-xl shadow-xl sticky top-8">
                    <section className="bg-gray-50 p-4 rounded-lg shadow-sm space-y-4">
                      <h2 className="text-base font-bold text-gray-800 mb-4">
                        餐廳詳細資訊
                      </h2>
                      <div className="space-y-3 text-gray-700">
                        {/* 營業時間 */}
                        <div>
                          <p className="flex items-start">
                            <FontAwesomeIcon
                              icon={faClock}
                              className="mr-2 text-gray-500 mt-1"
                            />
                            <span className="font-bold">營業時間:</span>
                          </p>
                          <div className="mt-2 pl-6">
                            {formatBusinessHours(restaurant.businessHours)}
                          </div>
                        </div>

                        {/* 設施/服務 */}
                        {restaurant.facilitiesServices &&
                          restaurant.facilitiesServices.length > 0 && (
                            <div>
                              <p>
                                <FontAwesomeIcon
                                  icon={faBuilding}
                                  className="mr-2 text-gray-500"
                                />
                                <span className="font-bold">設施與服務:</span>{" "}
                              </p>
                              <ul className="mt-1 ml-6 list-disc list-inside">
                                {restaurant.facilitiesServices.map(
                                  (service, index) => (
                                    <li key={index}>{service}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {/* 付款方式 */}
                        {restaurant.paymentMethods &&
                          restaurant.paymentMethods.length > 0 && (
                            <div>
                              <p>
                                <FontAwesomeIcon
                                  icon={faCreditCard}
                                  className="mr-2 text-gray-500"
                                />
                                <span className="font-bold">付款方式:</span>{" "}
                              </p>
                              <ul className="mt-1 ml-6 list-disc list-inside">
                                {restaurant.paymentMethods.map(
                                  (method, index) => (
                                    <li key={index}>{method}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {/* 座位數 */}
                        {restaurant.seatingCapacity && (
                          <p>
                            <FontAwesomeIcon
                              icon={faChair}
                              className="mr-2 text-gray-500"
                            />
                            <span className="font-bold">座位數:</span>{" "}
                            {restaurant.seatingCapacity}
                          </p>
                        )}

                        {/* 電話 */}
                        {restaurant.phone && (
                          <p>
                            <FontAwesomeIcon
                              icon={faPhone}
                              className="mr-2 text-gray-500"
                            />
                            <span className="font-bold">電話:</span>{" "}
                            {restaurant.phone}
                          </p>
                        )}

                        {/* 網站 */}
                        {restaurant.website && (
                          <p>
                            <FontAwesomeIcon
                              icon={faGlobe}
                              className="mr-2 text-gray-500"
                            />
                            <span className="font-bold">網站:</span>{" "}
                            <a
                              href={restaurant.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {restaurant.website}
                            </a>
                          </p>
                        )}

                        {/* 其他資訊 */}
                        {restaurant.otherInfo && (
                          <div className="pt-2">
                            <p className="flex items-start">
                              <FontAwesomeIcon
                                icon={faInfoCircle}
                                className="mr-2 text-gray-500 mt-1"
                              />
                              <span className="font-bold">其他資訊:</span>
                            </p>
                            <p className="mt-1 ml-6">{restaurant.otherInfo}</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RestaurantContext.Provider>
  );
}
