"use client";

import React, { useContext } from "react";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../../../lib/auth-context";
import { RestaurantContext } from "../../../lib/restaurant-context";
import { useRestaurantData } from "../../../hooks/useRestaurantData";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  faStar,
  faStarHalfStroke,
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
import { reviewFields } from "@/lib/translation-data";
import Image from "next/image";

export default function RestaurantOverviewPage() {
  const router = useRouter();
  const { restaurantId } = useParams();
  const { restaurant } = useContext(RestaurantContext);
  const { db, appId } = useContext(AuthContext);

  const { promotions, topMenus, topPhotos, recentReviews, loading, error } =
    useRestaurantData(db, appId, restaurantId);

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
        return (
          <IconBuildingStore stroke={2} className="text-xl text-gray-600" />
        );
      case "delivery":
        return <IconMoped stroke={2} className="text-xl text-gray-600" />;
      case "pickUp":
        return <IconPaperBag stroke={2} className="text-xl text-gray-600" />;
      default:
        return null;
    }
  };
  // 處理多語言名稱
  const getRestaurantName = (restaurant) => {
    if (
      restaurant?.restaurantName &&
      typeof restaurant.restaurantName === "object"
    ) {
      return (
        restaurant.restaurantName["zh-TW"] ||
        restaurant.restaurantName.en ||
        `未知餐廳 (ID: ${restaurant.id})`
      );
    }
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
        {error}
      </div>
    );
  }

  // 從 RestaurantContext 獲取餐廳資料
  const restaurantName = getRestaurantName(restaurant);
  const displayImageUrl =
    restaurant?.facadePhotoUrls && restaurant.facadePhotoUrls[0];

  return (
    <div className="space-y-8">
      {/* 餐廳介紹區塊 */}

      <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4">餐廳介紹</h2>
        <p className="text-gray-700 leading-relaxed">
          {restaurant.introduction || "餐廳尚未提供詳細介紹。"}
        </p>
      </section>

      {/* 優惠活動區塊 */}

      <section className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
        <h2 className="text-base font-bold text-blue-800 mb-4 flex items-center">
          <FontAwesomeIcon icon={faTag} className="mr-2" /> 優惠活動
        </h2>
        {promotions.length > 0 ? (
          <ul className="list-disc list-inside text-blue-700 space-y-2">
            {promotions.map((promo) => (
              <li key={promo.id}>{promo.description}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700 leading-relaxed">餐廳尚未新增優惠。</p>
        )}
      </section>

      {/* 餐廳內部區塊 */}

      {/* <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4">餐廳內部</h2>
        {restaurant?.facadePhotoUrls &&
        restaurant.facadePhotoUrls.length > 0 ? (
          <img
            src={displayImageUrl}
            alt={restaurantName}
            className="w-full h-80 object-cover rounded-lg shadow-md"
            fill={true}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = ``;
            }}
          />
        ) : (
          <p className="text-gray-700 leading-relaxed">餐廳尚未提供相片。</p>
        )}
      </section> */}

      {/* 熱門菜品區塊 */}

      <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4">熱門菜品</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {topMenus.map((menuItem) => (
            <div
              key={menuItem.id}
              className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col items-center p-3"
            >
              <div className="relative w-24 h-24 overflow-hidden rounded-full mb-3">
                <Image
                  src={menuItem.imageUrl || "/img/error/imgError_tw.webp"}
                  alt={menuItem.name}
                  fill
                  className="object-cover object-[right_top] transition-transform duration-300 hover:scale-110"
                  unoptimized
                />
              </div>

              <h3 className="text-base font-semibold text-gray-800 text-center">
                {menuItem.name}
              </h3>
              <p className="text-blue-600 font-bold mt-1">
                CAD$ {menuItem.price}
              </p>
            </div>
          ))}
          <p className="text-gray-700 leading-relaxed">
            {"餐廳尚未新增菜單。"}
          </p>
        </div>

        <div className="text-right mt-4">
          <Link
            href={`/restaurants/${restaurantId}/meanu`}
            className="text-blue-600 hover:underline font-medium"
          >
            查看更多菜單 <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </section>

      {/* 精選照片區塊 */}

      <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4">精選照片</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {topPhotos.map((photo, index) => (
            <Image
              key={photo.id}
              src={photo.url || "/img/error/imgError_tw.webp"}
              alt={`餐廳照片 ${index + 1}`}
              className="w-full h-24 sm:h-32 object-cover rounded-lg shadow-sm hover:scale-105 transition duration-200"
              width={500} // 必需：Next Image 要求 width/height
              height={200}
              unoptimized // 🔸避免自動優化（否則外層會包住一個div，className會唔完全一樣）
            />
          ))}
        </div>
        <div className="text-right mt-4">
          <Link
            href={`/restaurants/${restaurantId}/photos`}
            className="text-blue-600 hover:underline font-medium"
          >
            查看更多 <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </section>

      {/* 最新評論區塊 */}
      {recentReviews.length > 0 && (
        <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">最新評論</h2>
          <div className="space-y-4">
            {recentReviews.map((review) => (
              <div
                key={review.id}
                onClick={() =>
                  router.push(
                    `/restaurants/${restaurantId}/reviews/${review.id}`
                  )
                }
                className="bg-white p-4 rounded-lg shadow-md border border-gray-200 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/user/${review.userId}`}
                      onClick={(e) => e.stopPropagation()} // 🚨 阻止冒泡
                      className="font-semibold text-gray-800 hover:underline hover:text-blue-400 pr-3"
                    >
                      {review.username}
                    </Link>
                    {renderStars(review.overallRating)}
                    {review.overallRating}{" "}
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
                    </div>{" "}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-500">
                      第{" "}
                      <span className="text-orange-400">
                        {review.visitCount}
                      </span>{" "}
                      次到訪
                    </span>
                    <span className="ml-auto text-sm text-gray-500">
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
                <p className="text-gray-700 leading-relaxed">
                  {review.reviewTitle}
                </p>
              </div>
            ))}
          </div>
          <div className="text-right mt-4">
            <Link
              href={`/restaurants/${restaurantId}/reviews`} // 修正點：使用 Link 組件並加上動態路由
              className="text-blue-600 hover:underline font-medium"
            >
              查看所有評論 <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
