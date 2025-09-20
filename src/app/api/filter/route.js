import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// 判斷營業時間邏輯
const isRestaurantOpen = (businessHours, date, time) => {
  if (!businessHours || businessHours.length === 0) return false;

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

  const pass = partySize <= restaurantMaxCapacity;
  console.log(
    `[Seating Filter] 餐廳 "${restaurant.restaurantNameZh}" - 人數: ${partySize}, 最大容量: ${restaurantMaxCapacity}, 結果: ${pass}`
  );
  return pass;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // ✅ 修正：只解析實際的篩選條件，排除分頁參數
    const filters = {};
    const searchQuery = searchParams.get("search");
    const favoriteRestaurantIds = searchParams.getAll(
      "favoriteRestaurantIds[]"
    );

    // 遍歷所有參數，只處理篩選相關的
    for (const [key, value] of searchParams.entries()) {
      if (
        key !== "limit" &&
        key !== "startAfterDocId" &&
        key !== "search" &&
        key !== "favoriteRestaurantIds[]"
      ) {
        if (key.endsWith("[]")) {
          filters[key.replace("[]", "")] = searchParams.getAll(key);
        } else {
          filters[key] = value;
        }
      }
    }


    const appId = process.env.FIREBASE_ADMIN_APP_ID;
    const restaurantsColRef = db.collection(
      `artifacts/${appId}/public/data/restaurants`
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

    // 如果有搜尋文字，則進行搜尋過濾
    if (searchQuery) {
      q = q
        .where("restaurantNameZh", ">=", searchQuery)
        .where("restaurantNameZh", "<=", searchQuery + "\uf8ff");
    }

    // 新增分頁邏輯
    const limit = parseInt(searchParams.get("limit") || 10, 10);
    const startAfterDocId = searchParams.get("startAfterDocId");

    q = q.orderBy("restaurantNameEn").limit(limit + 1);

    if (startAfterDocId) {
      const startAfterDoc = await restaurantsColRef.doc(startAfterDocId).get();
      if (startAfterDoc.exists) {
        q = q.startAfter(startAfterDoc);
      }
    }

    const snapshot = await q.get();

    let restaurants = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      restaurants.push({ id: doc.id, ...data });
    });

    // 在伺服器端進行二次篩選
    const partySizeFilter = parseInt(filters.partySize, 10);

    const hasFilters =
      Object.keys(filters).length > 0 ||
      searchQuery ||
      favoriteRestaurantIds.length > 0;

    // ✅ 核心修正：當沒有任何篩選時，直接返回所有餐廳。
    // 否則，再執行後續的程式碼篩選。
    if (!hasFilters) {
      // 如果沒有任何篩選條件，直接使用從 Firestore 讀取到的所有餐廳
      const hasMore = restaurants.length > limit;
      const paginatedRestaurants = hasMore
        ? restaurants.slice(0, limit)
        : restaurants;
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
    }

    // 進行伺服器端二次篩選，處理複雜邏輯
    const filteredRestaurants = restaurants.filter((restaurant) => {
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
  } catch (error) {
    console.error("API Filter Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
