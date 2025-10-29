// src/app/restaurants/[restaurantId]/page.js (最終且最安全的修正版)

import LoadingSpinner from "@/components/LoadingSpinner";
import RestaurantOverviewClient from "@/components/restaurant/RestaurantOverviewClient";
import { fetchRestaurantPageDataServer } from "@/lib/restaurant/restaurantPage-data-fetcher";

// --- 輔助函數：處理多語言名稱 (不變) ---
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
  return `餐廳 (ID: ${restaurant?.id})`;
};

// --- 1. SEO Metadata (Server Side) ---
export async function generateMetadata({ params }) {
  // ✅ 必須 await params，因為在 Next.js 14+ 中它是 Promise
  const { restaurantId } = await params;

  try {
    const { restaurant, error } = await fetchRestaurantPageDataServer(
      restaurantId
    );

    if (error || !restaurant) {
      return {
        title: "餐廳資料載入失敗",
        description: "找不到指定的餐廳資訊。",
      };
    }

    const restaurantName = getRestaurantName(restaurant);
    const description =
      restaurant.introduction ||
      `${restaurantName}是一間${restaurant.category}的餐廳。快來查看菜單、優惠和最新評論！`;

    return {
      title: `${restaurantName} - 餐廳概覽`,
      description,
      keywords: [restaurantName, "餐廳", "菜單", "評論", "優惠", restaurantId],
      openGraph: {
        title: `${restaurantName} - 餐廳概覽`,
        description,
        url: `/restaurants/${restaurantId}`,
        images: [
          {
            url:
              restaurant.topPhotos?.[0]?.url || "/img/default-restaurant.jpg",
            alt: `${restaurantName} 的外觀照片`,
          },
        ],
      },
    };
  } catch (err) {
    return {
      title: "餐廳資料錯誤",
      description: "載入餐廳資料時發生問題。",
    };
  }
}

// --- 2. Server Component ---
export default async function RestaurantOverviewPage({ params }) {
  // ✅ 同樣要 await params
  const { restaurantId } = await params;

  try {
    const {
      restaurant,
      promotions,
      topMenus,
      topPhotos,
      recentReviews,
      loading,
      error,
    } = await fetchRestaurantPageDataServer(restaurantId);

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

    if (!restaurant) {
      return (
        <div className="flex justify-center items-center min-h-[300px] text-gray-500">
          找不到該餐廳資料。
        </div>
      );
    }

    return (
      <RestaurantOverviewClient
        restaurantId={restaurantId}
        restaurant={restaurant}
        promotions={promotions || []}
        topMenus={topMenus || []}
        topPhotos={topPhotos || []}
        recentReviews={recentReviews || []}
      />
    );
  } catch (err) {
    console.error("RestaurantOverviewPage Render Error:", err);
    return (
      <div className="flex justify-center items-center min-h-[300px] text-red-600">
        餐廳資料載入失敗。請檢查控制台錯誤。
      </div>
    );
  }
}
