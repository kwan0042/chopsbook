// src/components/restaurant/RestaurantOverviewClient.jsx

"use client";

import React from "react";
// 移除：useContext, useParams, AuthContext, RestaurantContext, useRestaurantData
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  faStar,
  faStarHalfStroke,
  faArrowRight,
  faSun,
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

// 接收 Server Component 傳遞的 Props
export default function RestaurantOverviewClient({
  restaurantId,
  restaurant,
  promotions,
  topMenus,
  topPhotos,
  recentReviews,
}) {
  const router = useRouter();

  // 渲染星星的輔助函數 (不變)
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

  // 輔助函數：根據時段渲染圖標 (不變)
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

  // 輔助函數：根據服務類型渲染圖標 (不變)
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

  // 處理多語言名稱 (不變，從 props 獲取 restaurant)
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

  const restaurantName = getRestaurantName(restaurant);
  const displayImageUrl =
    restaurant?.facadePhotoUrls && restaurant.facadePhotoUrls[0];

  // 檢查數據是否存在，以確保渲染邏輯正確
  if (!restaurant) return null;

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
        {promotions && promotions.length > 0 ? (
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

      <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4">餐廳內部</h2>
        {displayImageUrl ? (
          <div className="relative w-full h-80 object-cover rounded-lg shadow-md overflow-hidden">
            <Image
              src={displayImageUrl}
              alt={restaurantName}
              fill
              className="object-cover"
              sizes="(max-width: 600px) 100vw, 50vw"
              unoptimized
            />
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed">餐廳尚未提供相片。</p>
        )}
      </section>

      {/* 熱門菜品區塊 */}

      <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4">熱門菜品</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {topMenus && topMenus.length > 0 ? (
            topMenus.map((menuItem) => (
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
            ))
          ) : (
            // 修正：當沒有菜單時，直接顯示提示訊息 (注意此處沒有使用 col-span-full，確保單獨佔一行)
            <div className="col-span-full">
              <p className="text-gray-700 leading-relaxed">
                {"餐廳尚未新增菜單。"}
              </p>
            </div>
          )}
        </div>

        {topMenus && topMenus.length > 0 && (
          <div className="text-right mt-4">
            <Link
              href={`/restaurants/${restaurantId}/meanu`}
              className="text-blue-600 hover:underline font-medium"
            >
              查看更多菜單 <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        )}
      </section>

      {/* 精選照片區塊 */}

      <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4">精選照片</h2>
        {topPhotos && topPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {topPhotos.map((photo, index) => (
              <Image
                key={photo.id}
                src={photo.url || "/img/error/imgError_tw.webp"}
                alt={`餐廳照片 ${index + 1}`}
                className="w-full h-24 sm:h-32 object-cover rounded-lg shadow-sm hover:scale-105 transition duration-200"
                width={500}
                height={200}
                unoptimized
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed">餐廳尚未提供照片。</p>
        )}
        {topPhotos && topPhotos.length > 0 && (
          <div className="text-right mt-4">
            <Link
              href={`/restaurants/${restaurantId}/photos`}
              className="text-blue-600 hover:underline font-medium"
            >
              查看更多 <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        )}
      </section>

      {/* 最新評論區塊 */}
      {recentReviews && recentReviews.length > 0 && (
        <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">最新評論</h2>
          <div className="space-y-4">
            {recentReviews.map((review) => {
              // 檢查 review 物件是否有日期欄位，並將其格式化
              const reviewDate = review.createdAt
                ? new Date(review.createdAt)
                : null;

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

              // --- 從這裡開始才是你的 JSX 回傳 ---
              return (
                <div
                  key={review.id}
                  onClick={() =>
                    router.push(
                      `/restaurants/${restaurantId}/reviews/${review.id}`
                    )
                  }
                  className="bg-white p-4 rounded-lg shadow-md border border-gray-200 cursor-pointer hover:shadow-lg transition"
                >
                  <div className="flex flex-wrap justify-between items-start sm:flex-nowrap mb-2">
                    <div className="flex flex-wrap items-center space-x-2 min-w-0 sm:flex-nowrap">
                      <div className="md:flex items-center justify-between w-full whitespace-nowrap sm:w-auto sm:flex-shrink-0 pb-1 mb-1 border-b-2">
                        <div className="flex items-center">
                          <Link
                            href={`/user/${review.userId}`}
                            className="font-semibold text-gray-800 text-lg hover:text-blue-600 transition duration-150 cursor-pointer"
                            onClick={(e) => e.stopPropagation()} // 防止點擊 Link 時觸發外層的 router.push
                          >
                            {review.username}
                          </Link>
                          <span className="flex items-center my-1 ml-2 ">
                            {renderStars(review.overallRating)}
                          </span>
                        </div>
                        <div className="md:ml-2">
                          <span className="text-sm font-bold text-gray-500">
                            第
                            <span className="text-orange-400">
                              {review.visitCount}
                            </span>
                            次到訪
                          </span>
                        </div>
                      </div>

                      {/* 第二行內容：時段/類型圖示 */}
                      <div className="flex items-center space-x-2 ml-0 sm:ml-2 mt-1 sm:mt-0 sm:flex-shrink-0">
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

                    {/* 日期保持在右側 */}
                    <div className="flex-shrink-0 mt-2 sm:mt-0">
                      <span className="text-sm text-gray-500">
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {review.reviewTitle}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="text-right mt-4">
            <Link
              href={`/restaurants/${restaurantId}/reviews`}
              className="text-blue-600 hover:underline font-medium"
            >
              查看所有評論 <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
} // ⬅️ 這裡就是第 373 行，現在結構是完整的
