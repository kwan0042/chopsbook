// src/app/api/filter/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// 判斷營業時間邏輯 (保持不變)
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

// 輔助函式：檢查多選陣列篩選 (用於二次過濾)
const checkArrayFilter = (dbValue, filterValue) => {
  if (!filterValue || filterValue.length === 0) return true;
  const filterArray = Array.isArray(filterValue) ? filterValue : [filterValue];
  // 確保篩選陣列中的每一個值，都存在於餐廳的 DB 欄位中
  return filterArray.every((f) => dbValue?.includes(f));
};

// 💡 新增：安全地將 cuisineType 物件轉換為可搜尋的字串
const getCuisineSearchString = (cuisineData) => {
  if (typeof cuisineData === "string") {
    return cuisineData;
  }
  if (typeof cuisineData === "object" && cuisineData !== null) {
    const category = cuisineData.category || "";
    // 將子類型陣列轉換為字串，用空格分隔以便於單詞匹配
    const subTypes = Array.isArray(cuisineData.subType)
      ? cuisineData.subType.join(" ")
      : "";
    return `${category} ${subTypes}`;
  }
  return "";
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    let allFilters = {};
    const filtersJson = searchParams.get("filters");

    // 核心解析區塊：優先處理 JSON 參數，然後才是扁平化參數
    if (filtersJson) {
      try {
        allFilters = JSON.parse(filtersJson);
      } catch (e) {
        // 如果 JSON 解析失敗，回退到扁平化參數解析
        console.error(
          "Error parsing filters JSON, falling back to flat params:",
          e
        );
      }
    }

    // 如果 JSON 解析失敗或 filters 參數不存在，讀取傳統的扁平化參數
    if (Object.keys(allFilters).length === 0 || !filtersJson) {
      for (const key of searchParams.keys()) {
        const values = searchParams.getAll(key);
        // 確保將多值參數作為陣列處理
        if (values.length > 1) {
          allFilters[key] = values;
        } else {
          allFilters[key] = values[0];
        }
      }
    }

    // 從 allFilters 中解構出所有參數
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
      cuisineType, // 保持解構，用於二次過濾
      restaurantType,
      businessHours,
    } = allFilters;

    const appId = process.env.FIREBASE_ADMIN_APP_ID;
    const restaurantsColRef = db.collection(
      `artifacts/${appId}/public/data/restaurants`
    );

    // 核心查詢：構建 Firestore 查詢
    let q = restaurantsColRef;

    // ⚡️ 【已移除】針對 cuisineType 的 Firestore 查詢，因為 DB 欄位是 Object。

    // 應用單值篩選 (保持不變)
    if (restaurantType) {
      q = q.where("restaurantType", "==", restaurantType);
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

    // 依據 priority 降序排序
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

    // 讀取比限制多一筆的文件
    const queryLimit = parseInt(limit, 10) + 1;
    q = q.limit(queryLimit);

    const snapshot = await q.get();

    let restaurantsFromDb = [];
    snapshot.forEach((doc) => {
      restaurantsFromDb.push({ id: doc.id, ...doc.data() });
    });

    // 第二步：在伺服器端對結果進行二次過濾
    let filteredRestaurants = restaurantsFromDb.filter((restaurant) => {
      const passesMinAvgSpending =
        !minAvgSpending ||
        restaurant.avgSpending >= parseInt(minAvgSpending, 10);
      const passesMinRating =
        !minRating || restaurant.rating >= parseInt(minRating, 10);

      // ⚡️ 修正：處理 cuisineType 的 Category 和 SubType 匹配 (二次過濾)
      const passesCuisineType = (() => {
        if (!cuisineType || cuisineType.length === 0) return true;

        // 確保 cuisineType 是一個陣列 (無論是 JSON 還是扁平化參數)
        const filterCuisineArray = Array.isArray(cuisineType)
          ? cuisineType
          : [cuisineType];

        // 檢查 restaurant.cuisineType 或 restaurant.cuisine
        const restaurantCuisine = restaurant.cuisineType || restaurant.cuisine;

        // 如果餐廳的 cuisineType/cuisine 資料不存在，則不通過
        if (!restaurantCuisine || typeof restaurantCuisine !== "object") {
          // 如果是單一字串，則直接匹配
          if (typeof restaurantCuisine === "string") {
            return filterCuisineArray.some(
              (filterValue) => restaurantCuisine === filterValue
            );
          }
          return false;
        }

        const restaurantCategory = restaurantCuisine.category;
        const restaurantSubType = Array.isArray(restaurantCuisine.subType)
          ? restaurantCuisine.subType
          : restaurantCuisine.subType
          ? [restaurantCuisine.subType]
          : [];

        // 檢查篩選陣列中的任何一個值是否匹配 Category 或 SubType
        return filterCuisineArray.some((filterValue) => {
          // 嘗試匹配 category
          if (restaurantCategory === filterValue) return true;
          // 嘗試匹配 subType
          if (restaurantSubType.includes(filterValue)) return true;

          return false;
        });
      })();

      // 處理所有其他多選陣列
      const passesReservationModes = checkArrayFilter(
        restaurant.reservationModes,
        reservationModes
      );

      const passesPaymentMethods = checkArrayFilter(
        restaurant.paymentMethods,
        paymentMethods
      );

      const passesFacilities = checkArrayFilter(
        restaurant.facilitiesServices,
        facilities
      );

      const passesFavorites =
        !favoriteRestaurantIds ||
        favoriteRestaurantIds.length === 0 ||
        (Array.isArray(favoriteRestaurantIds)
          ? favoriteRestaurantIds.includes(restaurant.id)
          : favoriteRestaurantIds === restaurant.id);

      const { min: restaurantMinCapacity, max: restaurantMaxCapacity } =
        parseSeatingCapacity(restaurant.seatingCapacity);
      const passesMinMaxSeating =
        !minSeatingCapacity ||
        (restaurantMinCapacity >= parseInt(minSeatingCapacity, 10) &&
          restaurantMaxCapacity <= parseInt(maxSeatingCapacity, 10));

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

        // 🚨 修正點：使用 getCuisineSearchString 確保 cuisineType 是字串
        const cuisineSearchString = getCuisineSearchString(
          restaurant.cuisineType || restaurant.cuisine
        );

        return (
          (restaurant.restaurantName?.["zh-TW"] || "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          (restaurant.restaurantName?.en || "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          // 替換掉舊的出錯代碼，改為使用轉換後的字串
          cuisineSearchString.toLowerCase().includes(normalizedQuery) ||
          (restaurant.restaurantType || "")
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
        passesSearch &&
        passesCuisineType // 👈 確保將修正後的 cuisineType 檢查納入最終條件
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
