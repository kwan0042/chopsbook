// src/app/restaurants/[restaurantId]/page.js
"use client";

import React, { useState, useEffect, useCallback, useContext } from "react"; // 導入 useContext
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar as faSolidStar,
  faBookmark as faSolidBookmark,
  faComment,
  faMapMarkerAlt,
  faWallet,
  faTag,
  faPhone,
  faClock,
  faUtensils,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import {
  faStar as faRegularStar,
  faBookmark as faRegularBookmark,
} from "@fortawesome/free-regular-svg-icons";

// 從您的 lib/auth-context.js 導入 AuthContext
import { AuthContext } from "../../../lib/auth-context";

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

// 模擬數據或佔位符數據
const mockPromotions = [
  "新客限定：首單立減 $50",
  "週二會員日：全單八折優惠",
  "套餐優惠：雙人套餐僅 $399",
];

const mockTopMenus = [
  {
    id: "m1",
    name: "招牌紅燒肉",
    price: 120,
    imageUrl: "https://placehold.co/100x100/FFD700/FFFFFF?text=紅燒肉",
  },
  {
    id: "m2",
    name: "特色海鮮面",
    price: 98,
    imageUrl: "https://placehold.co/100x100/87CEEB/FFFFFF?text=海鮮面",
  },
  {
    id: "m3",
    name: "經典揚州炒飯",
    price: 78,
    imageUrl: "https://placehold.co/100x100/90EE90/FFFFFF?text=炒飯",
  },
];

const mockTopPhotos = [
  "https://placehold.co/200x150/FF6347/FFFFFF?text=照片1",
  "https://placehold.co/200x150/4682B4/FFFFFF?text=照片2",
  "https://placehold.co/200x150/32CD32/FFFFFF?text=照片3",
  "https://placehold.co/200x150/FFD700/FFFFFF?text=照片4",
  "https://placehold.co/200x150/DA70D6/FFFFFF?text=照片5",
  "https://placehold.co/200x150/20B2AA/FFFFFF?text=照片6",
  "https://placehold.co/200x150/B0C4DE/FFFFFF?text=照片7",
  "https://placehold.co/200x150/FFE4B5/FFFFFF?text=照片8",
  "https://placehold.co/200x150/9370DB/FFFFFF?text=照片9",
  "https://placehold.co/200x150/8A2BE2/FFFFFF?text=照片10",
];

const mockRecentReviews = [
  {
    id: "r1",
    author: "美食家A",
    rating: 5,
    date: "2023-10-26",
    content: "味道超棒，服務一流，環境也很舒適！強烈推薦他們家的招牌菜！",
  },
  {
    id: "r2",
    author: "小吃貨B",
    rating: 4,
    date: "2023-10-25",
    content: "菜品很地道，價格也合理，就是週末人有點多，需要等位。",
  },
  {
    id: "r3",
    author: "探店C",
    rating: 4,
    date: "2023-10-24",
    content: "第一次來，嘗試了幾個小吃，味道不錯。下次會再來嘗試其他菜品。",
  },
];

const RestaurantDetailPage = () => {
  const { restaurantId } = useParams();
  const router = useRouter();
  // 從 AuthContext 中獲取所有需要的上下文值
  const { db, currentUser, appId, setModalMessage, toggleFavoriteRestaurant } =
    useContext(AuthContext);

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // 預設顯示 overview

  // 檢查當前餐廳是否已被收藏
  const isFavorited =
    currentUser?.favoriteRestaurants?.includes(restaurantId) || false;

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!db || !restaurantId) {
        // 如果 db 或 restaurantId 缺失，則不能獲取數據
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
  }, [db, restaurantId, appId]); // 依賴項包含 db, restaurantId, appId

  const handleToggleFavorite = useCallback(async () => {
    if (!currentUser) {
      setModalMessage("請先登入才能收藏或取消收藏餐廳。");
      return;
    }
    // toggleFavoriteRestaurant 內部會通過 setCurrentUser 更新 currentUser
    // 因此這裡不需要額外操作來更新 isFavorited，狀態會自動通過 Context 傳播
    await toggleFavoriteRestaurant(restaurantId);
  }, [currentUser, toggleFavoriteRestaurant, restaurantId, setModalMessage]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-base font-semibold text-gray-700">加載中...</div>
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

  const displayImageUrl =
    (restaurant.facadePhotoUrls && restaurant.facadePhotoUrls[0]) ||
    `https://placehold.co/800x400/CCCCCC/333333?text=${encodeURIComponent(
      restaurant.restaurantNameZh || restaurant.restaurantNameEn || "餐廳圖片"
    )}`;

  const operatingStatus = getOperatingStatus(restaurant);

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
        {restaurant.reviewCount || 0} 評論
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
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
          {["overview", "menu", "photos", "reviews", "map"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 text-base font-medium transition-colors duration-200 ease-in-out
                ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* 內容區塊 - 僅顯示 Overview */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* facade image section */}
              <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <h2 className="text-base font-bold text-gray-800 mb-4">
                  餐廳門面
                </h2>
                <img
                  src={displayImageUrl}
                  alt={restaurant.restaurantNameZh || "餐廳門面"}
                  className="w-full h-80 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://placehold.co/800x400/CCCCCC/333333?text=圖片載入失敗`;
                  }}
                />
              </section>

              {/* restaurant intro section */}
              <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <h2 className="text-base font-bold text-gray-800 mb-4">
                  餐廳介紹
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {restaurant.introduction || "該餐廳暫無詳細介紹。"}
                </p>
              </section>

              {/* Promotion section */}
              {mockPromotions.length > 0 && (
                <section className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
                  <h2 className="text-base font-bold text-blue-800 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faTag} className="mr-2" /> 優惠活動
                  </h2>
                  <ul className="list-disc list-inside text-blue-700 space-y-2">
                    {mockPromotions.map((promo, index) => (
                      <li key={index}>{promo}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 3 top menu section */}
              {mockTopMenus.length > 0 && (
                <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h2 className="text-base font-bold text-gray-800 mb-4">
                    熱門菜品
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {mockTopMenus.slice(0, 3).map((menuItem) => (
                      <div
                        key={menuItem.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col items-center p-3"
                      >
                        <img
                          src={menuItem.imageUrl}
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
                    <button
                      onClick={() => setActiveTab("menu")}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      查看更多菜單 &gt;
                    </button>
                  </div>
                </section>
              )}

              {/* 10 top liked photos section */}
              {mockTopPhotos.length > 0 && (
                <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h2 className="text-base font-bold text-gray-800 mb-4">
                    精選照片
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {mockTopPhotos.slice(0, 10).map((photoUrl, index) => (
                      <img
                        key={index}
                        src={photoUrl}
                        alt={`餐廳照片 ${index + 1}`}
                        className="w-full h-24 sm:h-32 object-cover rounded-lg shadow-sm hover:scale-105 transition duration-200"
                      />
                    ))}
                  </div>
                  <div className="text-right mt-4">
                    <button
                      onClick={() => setActiveTab("photos")}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      查看更多 &gt;
                    </button>
                  </div>
                </section>
              )}

              {/* reviews section recent 3 reviews */}
              {mockRecentReviews.length > 0 && (
                <section className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h2 className="text-base font-bold text-gray-800 mb-4">
                    最新評論
                  </h2>
                  <div className="space-y-4">
                    {mockRecentReviews.slice(0, 3).map((review) => (
                      <div
                        key={review.id}
                        className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
                      >
                        <div className="flex items-center mb-2">
                          {Array.from({ length: 5 }, (_, index) => (
                            <FontAwesomeIcon
                              key={index}
                              icon={
                                index < Math.floor(review.rating || 0)
                                  ? faSolidStar
                                  : faRegularStar
                              }
                              className={`text-base ${
                                index < Math.floor(review.rating || 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-3 font-semibold text-gray-800">
                            {review.author}
                          </span>
                          <span className="ml-auto text-sm text-gray-500">
                            {review.date}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          {review.content}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="text-right mt-4">
                    <button
                      onClick={() => setActiveTab("reviews")}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      查看所有評論 &gt;
                    </button>
                  </div>
                </section>
              )}

              {/* Restaurant information section */}
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
                  {/* 可以添加更多餐廳資訊，如 WiFi, 停車場等 */}
                  {restaurant.description && (
                    <p className="pt-2">{restaurant.description}</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* 其他標籤內容 (暫時為佔位符) */}
          {activeTab === "menu" && (
            <div className="text-center p-8 text-gray-600">
              <h2 className="text-base font-bold mb-4">菜單 (待開發)</h2>
              <p>這裡將顯示詳細的菜單列表。</p>
            </div>
          )}
          {activeTab === "photos" && (
            <div className="text-center p-8 text-gray-600">
              <h2 className="text-base font-bold mb-4">照片 (待開發)</h2>
              <p>這裡將顯示餐廳的所有照片。</p>
            </div>
          )}
          {activeTab === "reviews" && (
            <div className="text-center p-8 text-gray-600">
              <h2 className="text-base font-bold mb-4">評論 (待開發)</h2>
              <p>這裡將顯示所有的用戶評論。</p>
            </div>
          )}
          {activeTab === "map" && (
            <div className="text-center p-8 text-gray-600">
              <h2 className="text-base font-bold mb-4">地圖 (待開發)</h2>
              <p>這裡將顯示餐廳在地圖上的位置。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetailPage;
