import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin"; // ✅ 從統一檔案匯入 db

// 判斷營業時間邏輯
const isRestaurantOpen = (businessHours, date, time) => {
  if (!businessHours || businessHours.length === 0) return false;

  // 使用伺服器本地時區（目前為東岸時間/EDT）來判斷日期
  const correctedDate = new Date(`${date}T12:00:00`);
  const dayOfWeek = correctedDate.getDay();

  const dayMapping = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  const currentDay = dayMapping[dayOfWeek];

  console.log(`[Time Filter] 正在檢查日期: ${date}, 判斷為: ${currentDay}`);

  const hoursToday = businessHours.find((h) => h.day === currentDay);
  if (!hoursToday || !hoursToday.isOpen) return false;

  const [openHour, openMinute] = hoursToday.startTime.split(":").map(Number);
  const [closeHour, closeMinute] = hoursToday.endTime.split(":").map(Number);
  const [queryHour, queryMinute] = time.split(":").map(Number);

  const openTimeInMinutes = openHour * 60 + openMinute;
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  let queryTimeInMinutes = queryHour * 60 + queryMinute;

  if (closeTimeInMinutes < openTimeInMinutes) {
    if (queryTimeInMinutes < openTimeInMinutes) {
      queryTimeInMinutes += 24 * 60;
    }
    return (
      queryTimeInMinutes >= openTimeInMinutes &&
      queryTimeInMinutes <= closeTimeInMinutes + 24 * 60
    );
  } else {
    return (
      queryTimeInMinutes >= openTimeInMinutes &&
      queryTimeInMinutes <= closeTimeInMinutes
    );
  }
};

/**
 * 輔助函數：解析座位數字串，返回最小和最大容納人數
 * @param {any} seatingCapacityData - 餐廳座位數的資料，可能為字串、數字或 null。
 * @returns {object} - 包含 min 和 max 屬性的物件。
 */
const parseSeatingCapacity = (seatingCapacityData) => {
  let min = 0;
  let max = Infinity;

  if (typeof seatingCapacityData === "string") {
    if (seatingCapacityData.includes("+")) {
      min = parseInt(seatingCapacityData.replace("+", ""), 10);
      max = Infinity;
    } else if (seatingCapacityData.includes("-")) {
      const parts = seatingCapacityData.split("-");
      min = parseInt(parts[0], 10);
      max = parseInt(parts[1], 10);
    } else {
      min = parseInt(seatingCapacityData, 10);
      max = min;
    }
  } else if (typeof seatingCapacityData === "number") {
    min = seatingCapacityData;
    max = seatingCapacityData;
  }

  // 修正：確保返回值是有效的數字，若為 NaN 則設為預設值
  const result = {
    min: isNaN(min) ? 0 : min,
    max: isNaN(max) ? Infinity : max,
  };
  console.log(
    `[Seating Filter] 解析原始資料 "${seatingCapacityData}" =>`,
    result
  );
  return result;
};

/**
 * 檢查餐廳是否能容納指定人數。
 * @param {object} restaurant - 餐廳資料物件。
 * @param {number} partySize - 派對人數。
 * @returns {boolean} - 餐廳是否有足夠的空間容納派對。
 */
const passesSeatingFilter = (restaurant, partySize) => {
  if (isNaN(partySize) || partySize <= 0) {
    return true;
  }

  const seatingCapacityData = restaurant.seatingCapacity;
  const { max: restaurantMaxCapacity } =
    parseSeatingCapacity(seatingCapacityData);

  // 核心篩選邏輯
  const pass = partySize <= restaurantMaxCapacity;
  console.log(
    `[Seating Filter] 餐廳 "${restaurant.restaurantNameZh}" - 人數: ${partySize}, 最大容量: ${restaurantMaxCapacity}, 結果: ${pass}`
  );
  return pass;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {};
    for (const [key, value] of searchParams.entries()) {
      if (key.endsWith("[]")) {
        const paramKey = key.replace("[]", "");
        filters[paramKey] = searchParams.getAll(key);
      } else {
        filters[key] = value;
      }
    }

    console.log("[API] 接收到的篩選條件:", filters);

    const restaurantsColRef = db.collection(
      "artifacts/default-app-id/public/data/restaurants"
    );
    let q = restaurantsColRef;

    // 進行 Firestore 伺服器端篩選
    if (filters.province) {
      q = q.where("province", "==", filters.province);
    }
    if (filters.city) {
      q = q.where("city", "==", filters.city);
    }
    if (filters.minAvgSpending) {
      q = q.where("avgSpending", ">=", parseInt(filters.minAvgSpending, 10));
    }
    if (filters.maxAvgSpending) {
      q = q.where("avgSpending", "<=", parseInt(filters.maxAvgSpending, 10));
    }
    if (filters.minRating) {
      q = q.where("rating", ">=", parseFloat(filters.minRating));
    }

    // --- 新增分頁邏輯 ---
    const limit = parseInt(searchParams.get("limit") || 10, 10);
    const startAfterDocId = searchParams.get("startAfterDocId");

    // 分頁必須依賴一個排序欄位，這裡使用 restaurantNameEn
    q = q.orderBy("restaurantNameEn").limit(limit + 1);

    if (startAfterDocId) {
      // 獲取起始文件
      const startAfterDoc = await restaurantsColRef.doc(startAfterDocId).get();
      if (startAfterDoc.exists) {
        q = q.startAfter(startAfterDoc);
      }
    }
    // --- 分頁邏輯結束 ---

    const snapshot = await q.get();

    let restaurants = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      restaurants.push({ id: doc.id, ...data });
    });

    // 在伺服器端進行二次篩選，處理 Firestore 無法直接處理的複雜邏輯
    const partySizeFilter = parseInt(filters.partySize, 10);
    const searchQuery = filters.search || "";
    // 新增：安全地獲取收藏餐廳 ID
    const favoriteRestaurantIds = filters.favoriteRestaurantIds || [];

    // 將所有篩選邏輯整合到一個 filter 函數中
    const filteredRestaurants = restaurants.filter((restaurant) => {
      const hasFilters = Object.keys(filters).length > 0 || searchQuery;
      if (!hasFilters && favoriteRestaurantIds.length === 0) {
        return true;
      }

      const passesFavorites =
        favoriteRestaurantIds.length === 0 ||
        favoriteRestaurantIds.includes(restaurant.id);

      const passesSeating = passesSeatingFilter(restaurant, partySizeFilter);
      const passesReservationModes = (filters.reservationModes || []).every(
        (mode) => restaurant.reservationModes?.includes(mode)
      );
      const passesPaymentMethods = (filters.paymentMethods || []).every(
        (method) => restaurant.paymentMethods?.includes(method)
      );
      const passesFacilities = (filters.facilities || []).every((facility) =>
        restaurant.facilitiesServices?.includes(facility)
      );

      const hasTimeOrDateFilter =
        filters.reservationDate || filters.reservationTime;
      const passesTimeFilter =
        !hasTimeOrDateFilter ||
        isRestaurantOpen(
          restaurant.businessHours,
          filters.reservationDate || new Date().toISOString().split("T")[0],
          filters.reservationTime || "12:00"
        );

      const passesCategory =
        (filters.category || []).length === 0 ||
        (filters.category || []).includes(restaurant.cuisineType);

      const passesSearch =
        !searchQuery ||
        (restaurant.restaurantNameZh || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (restaurant.restaurantNameEn || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (restaurant.cuisineType || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (restaurant.fullAddress || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return (
        passesSeating &&
        passesReservationModes &&
        passesPaymentMethods &&
        passesFacilities &&
        passesTimeFilter &&
        passesCategory &&
        passesSearch &&
        passesFavorites
      );
    });

    // --- 調整回傳值以符合分頁邏輯 ---
    const hasMore = filteredRestaurants.length > limit;
    const paginatedRestaurants = hasMore
      ? filteredRestaurants.slice(0, limit)
      : filteredRestaurants;
    const lastDocId =
      paginatedRestaurants.length > 0
        ? paginatedRestaurants[paginatedRestaurants.length - 1].id
        : null;

    return NextResponse.json({
      success: true,
      restaurants: paginatedRestaurants,
      hasMore,
      lastDocId,
    });
    // --- 回傳值調整結束 ---
  } catch (error) {
    console.error("API Filter Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
