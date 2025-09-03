"use client";

import React, { useContext } from "react";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../../../lib/auth-context";
import { RestaurantContext } from "../../../lib/restaurant-context";
import { useRestaurantData } from "../../../hooks/useRestaurantData";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function RestaurantOverviewPage() {
  const { restaurantId } = useParams();
  const { restaurant } = useContext(RestaurantContext);
  const { db, appId } = useContext(AuthContext);

  const { promotions, topMenus, topPhotos, recentReviews, loading, error } =
    useRestaurantData(db, appId, restaurantId);

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
        {error}
      </div>
    );
  }

  // 從 RestaurantContext 獲取餐廳資料
  const displayImageUrl =
    (restaurant?.facadePhotoUrls && restaurant.facadePhotoUrls[0]) ||
    `https://placehold.co/800x400/CCCCCC/333333?text=${encodeURIComponent(
      restaurant?.restaurantNameZh || "餐廳圖片"
    )}`;

  return (
    <div className="space-y-8">
      {/* 餐廳門面區塊 */}
      {restaurant?.facadePhotoUrls && restaurant.facadePhotoUrls.length > 0 && (
        <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">餐廳門面</h2>
          <img
            src={displayImageUrl}
            alt={restaurant?.restaurantNameZh || "餐廳門面"}
            className="w-full h-80 object-cover rounded-lg shadow-md"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/800x400/CCCCCC/333333?text=圖片載入失敗`;
            }}
          />
        </section>
      )}

      {/* 餐廳介紹區塊 */}
      {restaurant?.introduction && (
        <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">餐廳介紹</h2>
          <p className="text-gray-700 leading-relaxed">
            {restaurant.introduction || "該餐廳暫無詳細介紹。"}
          </p>
        </section>
      )}

      {/* 優惠活動區塊 */}
      {promotions.length > 0 && (
        <section className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
          <h2 className="text-base font-bold text-blue-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faTag} className="mr-2" /> 優惠活動
          </h2>
          <ul className="list-disc list-inside text-blue-700 space-y-2">
            {promotions.map((promo) => (
              <li key={promo.id}>{promo.description}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 熱門菜品區塊 */}
      {topMenus.length > 0 && (
        <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">熱門菜品</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {topMenus.map((menuItem) => (
              <div
                key={menuItem.id}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col items-center p-3"
              >
                <img
                  src={
                    menuItem.imageUrl ||
                    `https://placehold.co/100x100/CCCCCC/333333?text=菜品`
                  }
                  alt={menuItem.name}
                  className="w-24 h-24 object-cover rounded-full mb-3 border-2 border-gray-200"
                />
                <h3 className="text-base font-semibold text-gray-800 text-center">
                  {menuItem.name}
                </h3>
                <p className="text-blue-600 font-bold mt-1">
                  NT$ {menuItem.price}
                </p>
              </div>
            ))}
          </div>
          <div className="text-right mt-4">
            <a
              href="menu"
              className="text-blue-600 hover:underline font-medium"
            >
              查看更多菜單 &gt;
            </a>
          </div>
        </section>
      )}

      {/* 精選照片區塊 */}
      {topPhotos.length > 0 && (
        <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">精選照片</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {topPhotos.map((photo, index) => (
              <img
                key={photo.id}
                src={
                  photo.url ||
                  `https://placehold.co/200x150/CCCCCC/333333?text=照片${
                    index + 1
                  }`
                }
                alt={`餐廳照片 ${index + 1}`}
                className="w-full h-24 sm:h-32 object-cover rounded-lg shadow-sm hover:scale-105 transition duration-200"
              />
            ))}
          </div>
          <div className="text-right mt-4">
            <a
              href="photos"
              className="text-blue-600 hover:underline font-medium"
            >
              查看更多 &gt;
            </a>
          </div>
        </section>
      )}

      {/* 最新評論區塊 */}
      {recentReviews.length > 0 && (
        <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">最新評論</h2>
          <div className="space-y-4">
            {recentReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
              >
                <div className="flex items-center mb-2">
                  <span className=" font-semibold text-gray-800">
                    {review.username || "匿名用戶"}
                  </span>
                  <span className="ml-auto text-sm text-gray-500">
                    {review.createdAt
                      ? new Date(review.createdAt.toDate()).toLocaleDateString(
                          "zh-TW"
                        )
                      : "N/A"}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {review.reviewContent || "沒有內容"}
                </p>
              </div>
            ))}
          </div>
          <div className="text-right mt-4">
            <a
              href="reviews"
              className="text-blue-600 hover:underline font-medium"
            >
              查看所有評論 &gt;
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
