// src/app/restaurants/[restaurantId]/layout.js
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
  faShare,
  faInfo, // 💡 新增：用於手機版按鈕
  faTimes, // 💡 新增：用於 Modal 關閉按鈕
} from "@fortawesome/free-solid-svg-icons";
import {
  faStar as faRegularStar,
  faBookmark as faRegularBookmark,
} from "@fortawesome/free-regular-svg-icons";

import { IconFileDots } from "@tabler/icons-react";

// 💡 導入 MUI 元件
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";

import { AuthContext } from "../../../lib/auth-context";
import { RestaurantContext } from "../../../lib/restaurant-context";
import Link from "next/link";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ShareModal from "@/components/ShareModal";
import { useRouter } from "next/navigation";
import Image from "next/image";

// 導入新的 Hook
import useRestaurantStatus from "@/hooks/useRestaurantStatus";

// 💡 提取「餐廳詳細資訊」內容為一個獨立的組件或函數，方便重用和條件渲染
const RestaurantInfoPanel = ({ restaurant, formatBusinessHours }) => (
  // 保持橫向佈局不變
  <section className="bg-gray-50 p-4 rounded-lg shadow-sm space-y-4">
    <h2 className="text-base font-bold text-gray-800 mb-4">餐廳詳細資訊</h2>
    <div className="space-y-3 text-gray-700">
      {/* 營業時間 */}
      <div>
        <p className="flex items-start">
          <FontAwesomeIcon icon={faClock} className="mr-2 text-gray-500 mt-1" />
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
              {restaurant.facilitiesServices.map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
          </div>
        )}

      {/* 付款方式 */}
      {restaurant.paymentMethods && restaurant.paymentMethods.length > 0 && (
        <div>
          <p>
            <FontAwesomeIcon
              icon={faCreditCard}
              className="mr-2 text-gray-500"
            />
            <span className="font-bold">付款方式:</span>{" "}
          </p>
          <ul className="mt-1 ml-6 list-disc list-inside">
            {restaurant.paymentMethods.map((method, index) => (
              <li key={index}>{method}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 座位數 */}
      {restaurant.seatingCapacity && (
        <p>
          <FontAwesomeIcon icon={faChair} className="mr-2 text-gray-500" />
          <span className="font-bold">座位數:</span>{" "}
          {restaurant.seatingCapacity}
        </p>
      )}

      {/* 電話 */}
      {restaurant.phone && (
        <p>
          <FontAwesomeIcon icon={faPhone} className="mr-2 text-gray-500" />
          <span className="font-bold">電話:</span> {restaurant.phone}
        </p>
      )}

      {/* 網站 */}
      {restaurant.website && (
        <p>
          <FontAwesomeIcon icon={faGlobe} className="mr-2 text-gray-500" />
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
);

// Layout 元件
export default function RestaurantDetailLayout({ children }) {
  const { restaurantId } = useParams();
  const pathname = usePathname();
  const { db, currentUser, appId, setModalMessage, toggleFavoriteRestaurant } =
    useContext(AuthContext);

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 💡 新增狀態：控制手機版詳細資訊 Modal/Drawer
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

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

  const router = useRouter();

  const handleCheckInClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const restaurantName =
      restaurant.restaurantName?.["zh-TW"] ||
      restaurant.restaurantName?.en ||
      "未知餐廳";
    router.push(
      `/review?restaurantId=${restaurantId}&restaurantName=${encodeURIComponent(
        restaurantName
      )}`
    );
  };
  const restaurantLink = `${process.env.NEXT_PUBLIC_SITE_URL}restaurants/${restaurantId}`;

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const handleShareClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsShareModalOpen(true);
  };

  const handleToggleFavorite = useCallback(async () => {
    if (!currentUser) {
      setModalMessage("請先登入才能收藏或取消收藏餐廳。");
      return;
    }
    await toggleFavoriteRestaurant(restaurantId);
  }, [currentUser, toggleFavoriteRestaurant, restaurantId, setModalMessage]);

  // 💡 關鍵修正函數：用於安全地將菜系/類型物件轉換為字串 (保持不變)
  const renderCuisineOrType = (data) => {
    if (!data) return "N/A";

    // 1. 處理 Array: 適用於 restaurantType, paymentMethods 等多選字段 (字串陣列)
    if (Array.isArray(data)) {
      // 確保陣列非空，且元素是字串，然後用頓號連接
      const filteredData = data.filter(
        (item) => typeof item === "string" && item.trim() !== ""
      );
      return filteredData.length > 0 ? filteredData.join("、") : "N/A";
    }

    // 2. 處理 Object: 主要用於菜系結構 { category, subCategory: [...] }
    if (typeof data === "object" && data !== null) {
      // 檢查是否包含 category 屬性 (標記為菜系結構)
      if ("category" in data) {
        const category = data.category || "";
        // 🚨 使用 subCategory 欄位 (預期是陣列或空值)
        const subCategories = data.subCategory;

        if (!category && (!subCategories || subCategories.length === 0)) {
          return "N/A"; // 兩者都空
        }

        let subCategoryDisplay = "";

        // 處理 subCategory：如果是陣列，連起來
        if (Array.isArray(subCategories)) {
          const filteredSubCategories = subCategories.filter(
            (item) => typeof item === "string" && item.trim() !== ""
          );
          subCategoryDisplay = filteredSubCategories.join("、");
        }
        // 如果 subCategory 碰巧是單一非空字串 (防禦性處理，儘管預期是陣列)
        else if (typeof subCategories === "string") {
          subCategoryDisplay = subCategories.trim();
        }

        // 組合顯示
        if (category && subCategoryDisplay) {
          return `${category} (${subCategoryDisplay})`;
        }
        if (category) {
          return category;
        }

        return "N/A";
      }

      // 處理 { label, value } 或其他單層次物件 (保持原邏輯)
      if (data.label) {
        return data.label;
      }
    }

    // 3. 最終防線：處理單一非空字串 (如果 data 碰巧是字串)
    if (typeof data === "string" && data.trim() !== "") {
      return data.trim();
    }

    // 最終預設值
    return "N/A";
  };

  const renderRatingStars = (averageRating) => (
    <div className="flex items-center">
      {Array.from({ length: 5 }, (_, index) => (
        <FontAwesomeIcon
          key={index}
          icon={
            index < Math.floor(averageRating || 0) ? faSolidStar : faRegularStar
          }
          className={`text-base ${
            index < Math.floor(averageRating || 0)
              ? "text-yellow-500"
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="text-gray-800 font-bold text-base ml-2">
        {averageRating?.toFixed(1) || "N/A"}
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
            <span className="font-bold">{h?.day}:</span>{" "}
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

  // 處理多語言名稱
  const getRestaurantName = (restaurant) => {
    if (
      restaurant.restaurantName &&
      typeof restaurant.restaurantName === "object"
    ) {
      return (
        restaurant.restaurantName["zh-TW"] ||
        restaurant.restaurantName.en ||
        `未知餐廳 (ID: ${restaurantId})`
      );
    }
    // 確保返回字串
    return restaurant.restaurantName || `未知餐廳 (ID: ${restaurantId})`;
  };

  // 決定要渲染的菜系/類型字串
  const cuisineDisplay = renderCuisineOrType(
    restaurant.category || restaurant.subCategory || restaurant.restaurantType
  );

  // 獲取門面照片 URL
  const facadePhotoUrl = restaurant.facadePhotoUrls?.[0];

  return (
    <RestaurantContext.Provider value={{ restaurant }}>
      <div className="flex flex-col font-inter mb-6">
        {/* 🚨 行動裝置 (md: 以下) 浮動按鈕與 Drawer 區塊 🚨 */}
        <div className="md:hidden sticky top-[116px] z-40 w-full bg-gray-700">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 ">
            <div className="flex justify-between items-center w-full ">
              {/* 浮動按鈕：左側中央定位，文字直寫 (flex-col) 保持不變 */}
              <button
                onClick={() => setIsInfoModalOpen(true)}
                className="inline-flex items-center justify-center p-2 text-sm font-medium  rounded-lg shadow-md group bg-gradient-to-br  transition-colors duration-200 w-fit h-fit"
                aria-label="查看餐廳詳細資訊"
              >
                <span className="relative px-3 py-1 transition-all ease-in duration-75  bg-white dark:bg-gray-900 rounded-lg group-hover:bg-transparent  group-hover:dark:bg-transparent text-gray-900 dark:text-white font-bold  flex items-center space-x-2">
                  <IconFileDots stroke={2} />
                </span>
              </button>
            </div>
          </div>

          {/* 💡 MUI Drawer 元件實現滑出滑入效果 (從左到右滑出) */}
          <Drawer
            anchor="left" // 從左邊滑出
            open={isInfoModalOpen}
            onClose={() => setIsInfoModalOpen(false)} // 點擊背景自動關閉
            // 設置 Drawer 容器的寬度為全螢幕
            PaperProps={{
              sx: {
                width: "100%", // full screen width on mobile
              },
            }}
          >
            <Box
              role="presentation"
              sx={{
                width: "100%",
                height: "100%",
                p: 2, // 使用 MUI 的 spacing 系統來代替 Tailwind 的 p-4
                backgroundColor: "white",
              }}
            >
              {/* 關閉按鈕：MUI IconButton，使用 FontAwesome icon */}
              <IconButton
                onClick={() => setIsInfoModalOpen(false)}
                sx={{
                  position: "absolute",
                  top: 8, // 1/2 Tailwind unit
                  right: 8, // 1/2 Tailwind unit
                  zIndex: 10,
                  color: "grey.500", // 使用 MUI 顏色系統
                }}
                aria-label="關閉詳細資訊"
              >
                <FontAwesomeIcon icon={faTimes} />
              </IconButton>

              {/* 餐廳詳細資訊內容 (重用 RestaurantInfoPanel) */}
              <div className="pt-10">
                {" "}
                {/* 調整內容，為 X 騰出空間 */}
                <RestaurantInfoPanel
                  restaurant={restaurant}
                  formatBusinessHours={formatBusinessHours}
                />
              </div>
            </Box>
          </Drawer>
        </div>
        {/* 🚨 行動裝置區塊結束 🚨 */}
        <div className="flex flex-col min-h-screen bg-cbbg">
          <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8 ">
            <div className=" mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
              {/* 🚨 關鍵結構變更：將頂部資訊、基本資訊和標籤放在一個父容器中，並與圖片並排 */}

              <div className="flex flex-col md:flex-row border-b border-gray-200 md:pr-3 ">
                {/* 門面照片區塊 (左側 25% / w-1/4) */}
                <div className="md:w-1/5 w-full p-4 flex-shrink-0  ">
                  <div className="relative w-full h-50">
                    {" "}
                    {/* 👈 設定高度 + relative */}
                    <Image
                      src={facadePhotoUrl || "/img/error/imgError_tw.webp"}
                      alt={`${getRestaurantName(restaurant)} 門面照片`}
                      fill
                      className="object-cover rounded-lg shadow-md"
                      unoptimized
                    />
                  </div>
                </div>

                {/* 資訊區塊 (右側 75% / w-3/4) - 包含名稱、評分、菜系、標籤 */}
                <div className="md:w-4/5 w-full flex flex-col ">
                  {/* 頂部名稱和收藏按鈕 */}
                  <div className="flex items-center justify-between py-4 mx-6 border-b-2 pb-2">
                    <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                      {getRestaurantName(restaurant)}
                    </h1>
                    <div className="flex justify-center items-center gap-2 overflow-ellipsis whitespace-nowrap">
                      <button
                        onClick={handleCheckInClick}
                        className="bg-cbbg text-rose-500 hover:bg-blue-600 hover:text-cbbg text-sm font-bold py-1 px-3 rounded-sm  transition duration-100"
                        type="button"
                      >
                        到訪
                      </button>
                      <button
                        onClick={handleShareClick}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-bold py-1 px-3 rounded-sm  transition duration-100"
                        type="button"
                        aria-label="分享"
                      >
                        <FontAwesomeIcon icon={faShare} />
                      </button>
                      {isShareModalOpen && (
                        <ShareModal
                          isOpen={isShareModalOpen}
                          onClose={() => setIsShareModalOpen(false)}
                          restaurantName={
                            restaurant.restaurantName?.["zh-TW"] ||
                            restaurant.restaurantName?.en ||
                            "未知餐廳"
                          }
                          shareUrl={restaurantLink}
                        />
                      )}

                      <button
                        onClick={handleToggleFavorite}
                        className="py-2 bg-transparent border-none text-yellow-500 hover:scale-110 transition duration-200"
                        aria-label={isFavorited ? "取消收藏" : "收藏餐廳"}
                      >
                        <FontAwesomeIcon
                          icon={
                            isFavorited ? faSolidBookmark : faRegularBookmark
                          }
                          className="text-3xl"
                        />
                      </button>
                    </div>
                  </div>

                  {/* 餐廳基本資訊 */}
                  <div className="p-6 pt-2 grid grid-cols-1 md:grid-cols-2  text-gray-700">
                    <div>
                      {renderRatingStars(restaurant.averageRating)}
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
                        {/* 使用 cuisineDisplay 確保是字串 */}
                        {cuisineDisplay}
                        {restaurant.rTags?.length > 0 &&
                          ` | ${restaurant.rTags.join(", ")}`}
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
                  {restaurant.rTags && restaurant.rTags.length > 0 && (
                    <div className="p-6 pt-2 flex flex-wrap gap-2">
                      {restaurant.rTags.map((tag, index) => (
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
                </div>
              </div>
              {/* 🚨 結構變更結束 */}

              {/* 導航標籤 (保持不變) */}
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
                  <div className="flex-1">{children}</div>

                  {/* 桌面版側欄：添加 hidden md:block 確保手機上隱藏 */}
                  <div className="hidden md:block md:w-1/3 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-xl sticky top-8">
                      <RestaurantInfoPanel
                        restaurant={restaurant}
                        formatBusinessHours={formatBusinessHours}
                      />
                    </div>
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
