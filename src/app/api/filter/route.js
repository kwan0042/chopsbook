import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// 判斷營業時間邏輯
const isRestaurantOpen = (businessHours, date, time) => {
  if (!businessHours || Object.keys(businessHours).length === 0) return false;

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

  const hoursToday = businessHours.find((h) => h.day === currentDay);
  if (!hoursToday || !hoursToday.isOpen) return false;

  const [openHour, openMinute] = hoursToday.startTime.split(":").map(Number);
  const [closeHour, closeMinute] = hoursToday.endTime.split(":").map(Number);
  const [queryHour, queryMinute] = time.split(":").map(Number);

  const openTimeInMinutes = openHour * 60 + openMinute;
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  let queryTimeInMinutes = queryHour * 60 + queryMinute;

  // 處理跨夜營業時間
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
  return result;
};

const passesSeatingFilter = (restaurant, partySize) => {
  if (isNaN(partySize) || partySize <= 0) {
    return true;
  }

  const seatingCapacityData = restaurant.seatingCapacity;
  const { max: restaurantMaxCapacity } =
    parseSeatingCapacity(seatingCapacityData);

  const pass = partySize <= restaurantMaxCapacity;
  return pass;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // 解析所有查詢參數，處理多值參數
    const filters = {};
    for (const key of searchParams.keys()) {
      const values = searchParams.getAll(key);
      if (values.length > 1) {
        filters[key] = values;
      } else {
        filters[key] = values[0];
      }
    }

    const {
      limit = 10,
      startAfterDocId,
      search,
      favoriteRestaurantIds,
      province,
      city,
      minAvgSpending,
      maxAvgSpending,
      minRating,
      partySize,
      minSeatingCapacity,
      maxSeatingCapacity,
      reservationModes,
      paymentMethods,
      facilities,
      reservationDate,
      reservationTime,
      category,
      businessHours,
    } = filters;

    const appId = process.env.FIREBASE_ADMIN_APP_ID;
    const restaurantsColRef = db.collection(
      `artifacts/${appId}/public/data/restaurants`
    );

    // 核心查詢：構建 Firestore 查詢以利用索引
    let q = restaurantsColRef;

    // 應用菜系篩選，使用 `in` 運算子
    const categoriesArray = Array.isArray(category)
      ? category
      : category
      ? [category]
      : [];
    if (categoriesArray.length > 0) {
      // 請注意：Firestore 的 `in` 運算子最多支援 10 個值
      q = q.where("cuisineType", "in", categoriesArray);
    }

    if (province) {
      q = q.where("province", "==", province);
    }

    if (city) {
      q = q.where("city", "==", city);
    }

    if (maxAvgSpending) {
      q = q.where("avgSpending", "<=", parseInt(maxAvgSpending, 10));
    }

    // 依據 priority 降序排序，這對於 Firestore 查詢是必要的
    q = q.orderBy("priority", "desc");

    // 如果有 avgSpending 範圍查詢，Firestore 必須同時以該欄位排序。
    if (maxAvgSpending) {
      q = q.orderBy("avgSpending", "desc");
    }

    // 處理分頁
    if (startAfterDocId) {
      const startAfterDoc = await restaurantsColRef.doc(startAfterDocId).get();
      if (startAfterDoc.exists) {
        q = q.startAfter(startAfterDoc);
      }
    }

    // 讀取比限制多一筆的文件，用於判斷是否有更多文件
    const queryLimit = parseInt(limit, 10) + 1;
    q = q.limit(queryLimit);

    const snapshot = await q.get();

    let restaurantsFromDb = [];
    snapshot.forEach((doc) => {
      restaurantsFromDb.push({ id: doc.id, ...doc.data() });
    });

    // 第二步：在伺服器端對結果進行二次過濾
    let filteredRestaurants = restaurantsFromDb.filter((restaurant) => {
      // 檢查不在 Firestore 查詢中的篩選條件
      const passesMinAvgSpending =
        !minAvgSpending ||
        restaurant.avgSpending >= parseInt(minAvgSpending, 10);
      const passesMinRating =
        !minRating || restaurant.rating >= parseInt(minRating, 10);

      const passesReservationModes =
        !reservationModes ||
        (Array.isArray(reservationModes)
          ? reservationModes.every((mode) =>
              restaurant.reservationModes?.includes(mode)
            )
          : restaurant.reservationModes?.includes(reservationModes));

      const passesPaymentMethods =
        !paymentMethods ||
        (Array.isArray(paymentMethods)
          ? paymentMethods.every((method) =>
              restaurant.paymentMethods?.includes(method)
            )
          : restaurant.paymentMethods?.includes(paymentMethods));

      const passesFacilities =
        !facilities ||
        (Array.isArray(facilities)
          ? facilities.every((facility) =>
              restaurant.facilitiesServices?.includes(facility)
            )
          : restaurant.facilitiesServices?.includes(facilities));

      const passesFavorites =
        !favoriteRestaurantIds ||
        favoriteRestaurantIds.length === 0 ||
        (Array.isArray(favoriteRestaurantIds)
          ? favoriteRestaurantIds.includes(restaurant.id)
          : favoriteRestaurantIds === restaurant.id);

      // 新增座位數範圍篩選，確保同時檢查 minSeatingCapacity 和 maxSeatingCapacity
      const { min: restaurantMinCapacity, max: restaurantMaxCapacity } =
        parseSeatingCapacity(restaurant.seatingCapacity);
      const passesMinMaxSeating =
        !minSeatingCapacity ||
        (restaurantMinCapacity >= parseInt(minSeatingCapacity, 10) &&
          restaurantMaxCapacity <= parseInt(maxSeatingCapacity, 10));

      // 保留 partySize 篩選
      const passesPartySize = passesSeatingFilter(
        restaurant,
        parseInt(partySize, 10)
      );

      const passesTimeAndHoursFilter = (() => {
        if (!reservationDate && !reservationTime && !businessHours) {
          return true;
        }

        const targetDate =
          reservationDate || new Date().toISOString().split("T")[0];
        const targetTime =
          reservationTime ||
          `${String(new Date().getHours()).padStart(2, "0")}:${String(
            new Date().getMinutes()
          ).padStart(2, "0")}`;
        const isOpen = isRestaurantOpen(
          restaurant.businessHours,
          targetDate,
          targetTime
        );

        if (businessHours) {
          if (businessHours === "營業中") return isOpen;
          if (businessHours === "休假中") return !isOpen;
        }

        return isOpen;
      })();

      const passesSearch = (() => {
        if (!search) return true;
        const normalizedQuery = search.toLowerCase();
        return (
          (restaurant.restaurantName?.["zh-TW"] || "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          (restaurant.restaurantName?.en || "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          (restaurant.cuisineType || "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          (restaurant.fullAddress || "").toLowerCase().includes(normalizedQuery)
        );
      })();

      return (
        passesMinAvgSpending &&
        passesMinRating &&
        passesReservationModes &&
        passesPaymentMethods &&
        passesFacilities &&
        passesFavorites &&
        passesMinMaxSeating &&
        passesPartySize &&
        passesTimeAndHoursFilter &&
        passesSearch
      );
    });

    // 第三步：準備分頁的最終結果
    const hasMore = filteredRestaurants.length > parseInt(limit, 10);
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
