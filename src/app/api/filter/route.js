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

// 解析座位容量邏輯 (保持不變)
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

// 檢查 Party Size 邏輯 (保持不變)
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

// --- API 核心函數 ---
export async function GET(request) {
  try {
    // 1. 參數解析區
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
      limit = 18,
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
      category, // 頂層菜系 (String)
      subCategory, // 細分菜系/特色 (Array)
      businessHours,
    } = filters;

    // 2. Firestore 查詢構建區
    const appId = process.env.FIREBASE_ADMIN_APP_ID;
    const restaurantsColRef = db.collection(
      `artifacts/${appId}/public/data/restaurants`
    );

    // 核心查詢：構建 Firestore 查詢以利用索引
    let q = restaurantsColRef;

    // 將多值參數轉換為陣列，便於 Firestore 查詢
    const facilitiesArray = Array.isArray(facilities)
      ? facilities
      : facilities
      ? [facilities]
      : [];

    const paymentMethodsArray = Array.isArray(paymentMethods)
      ? paymentMethods
      : paymentMethods
      ? [paymentMethods]
      : [];

    const reservationModesArray = Array.isArray(reservationModes)
      ? reservationModes
      : reservationModes
      ? [reservationModes]
      : [];

    // 【新增】：準備 subCategory 陣列用於 Firestore 查詢
    const subCategoryArray = Array.isArray(subCategory)
      ? subCategory
      : subCategory
      ? [subCategory]
      : [];

    // 【修正】：準備 category 陣列用於 Firestore 查詢
    const categoriesArray = Array.isArray(category)
      ? category
      : category
      ? [category]
      : [];

    // *** 滿足需求 1: 處理 search 邏輯 (不變) ***
    if (search) {
      const normalizedQuery = search.toLowerCase();
      const endBoundary = normalizedQuery + "\uf8ff";

      q = q
        .where("name_lowercase_en", ">=", normalizedQuery)
        .where("name_lowercase_en", "<=", endBoundary);

      q = q.orderBy("name_lowercase_en");

      if (province) {
        q = q.where("province", "==", province);
      }
      if (city) {
        q = q.where("city", "==", city);
      }
    } else {
      // *** 滿足需求 2 & 3: 處理無 search 的篩選和排序 ***

      // A. 處理 Where 條件 (精確匹配與單一範圍查詢)

      if (province) {
        q = q.where("province", "==", province);
      }

      if (city) {
        q = q.where("city", "==", city);
      }

      // 獨立篩選器 1: category (精確匹配 - 單一或多個)
      // category 應是字串，但為了應對 UI 可能的多選，這裡假設它在 Firestore 中是單一 String
      // 由於 Firestore 限制，如果 categoriesArray.length > 1，只能使用 array-contains-any，
      // 但 category 是 String。因此，這裡改用 array-contains-any 搜尋 'category' 欄位。
      // 這是假設 category 在 DB 中是 String，但 UI 可能多選，會使用 'in' 查詢（限制 10 個）。
      if (categoriesArray.length > 0) {
        // 如果有多個主菜系，使用 where('category', 'in', categoriesArray)
        if (categoriesArray.length > 1) {
          // ⚠️ 複合查詢限制: 'in' 查詢不能與其他 array-contains-any 同時存在，請確認索引
          q = q.where("category", "in", categoriesArray.slice(0, 10)); // 限制 in 查詢最多 10 個
        } else {
          q = q.where("category", "==", categoriesArray[0]);
        }
      }

      // 獨立篩選器 2: subCategory (陣列 OR)
      // subCategory 是一個陣列，使用 array-contains-any 查詢 (最多 10 個)
      if (subCategoryArray.length > 0) {
        // ⚠️ 這需要複合索引 (category/province/city), (subCategory, array-contains-any)
        q = q.where(
          "subCategory",
          "array-contains-any",
          subCategoryArray.slice(0, 10) // 限制 array-contains-any 查詢最多 10 個
        );
      }

      // 獨立篩選器 3: facilities (陣列 OR)
      if (facilitiesArray.length > 0) {
        q = q.where(
          "facilitiesServices",
          "array-contains-any",
          facilitiesArray
        );
      }

      // 獨立篩選器 4: paymentMethods (陣列 OR)
      if (paymentMethodsArray.length > 0) {
        q = q.where(
          "paymentMethods",
          "array-contains-any",
          paymentMethodsArray
        );
      }

      // 獨立篩選器 5: reservationModes (陣列 OR)
      if (reservationModesArray.length > 0) {
        q = q.where(
          "reservationModes",
          "array-contains-any",
          reservationModesArray
        );
      }

      // 獨立篩選器 6: minRating (單一範圍查詢)
      const parsedMinRating = minRating ? parseInt(minRating, 10) : 0;
      if (parsedMinRating > 0) {
        q = q.where("rating", ">=", parsedMinRating);
      }

      // B. 處理 OrderBy 條件

      // 依據 priority 降序排序 (必須保留)
      q = q.orderBy("priority", "desc");

      // 如果 minRating 存在，必須在 priority 之後以 rating 排序
      if (parsedMinRating > 0) {
        // ⚠️ 這需要複合索引 (priority, desc), (rating, desc)
        q = q.orderBy("rating", "desc");
      }
    }

    // 3. 分頁與限制區 (保持不變)

    // 處理分頁 (startAfter)
    if (startAfterDocId) {
      const startAfterDoc = await restaurantsColRef.doc(startAfterDocId).get();
      if (startAfterDoc.exists) {
        q = q.startAfter(startAfterDoc);
      }
    }

    // 讀取比限制多一筆的文件，用於判斷是否有更多文件
    const queryLimit = parseInt(limit, 10) + 1; // 預設 18 + 1 = 19
    q = q.limit(queryLimit);

    // 執行查詢
    const snapshot = await q.get();

    let restaurantsFromDb = [];
    snapshot.forEach((doc) => {
      restaurantsFromDb.push({ id: doc.id, ...doc.data() });
    });

    // 4. 伺服器端二次過濾區 (處理不在 Firestore 查詢中的篩選條件)
    let filteredRestaurants = restaurantsFromDb.filter((restaurant) => {
      // 檢查不在 Firestore 查詢中的篩選條件

      // 伺服器端過濾 1: minAvgSpending (不變)
      const passesMinAvgSpending =
        !minAvgSpending ||
        restaurant.avgSpending >= parseInt(minAvgSpending, 10);

      // 伺服器端過濾 2: maxAvgSpending (不變)
      const passesMaxAvgSpending =
        !maxAvgSpending ||
        restaurant.avgSpending <= parseInt(maxAvgSpending, 10);

      // 【移除】： passesCategory 邏輯，因為 category 和 subCategory 已移到 Firestore 查詢
      // const passesCategory = true;

      // 設定為 true，因為已在 Firestore 查詢中處理 (不變)
      const passesMinRating = true;
      const passesReservationModes = true;
      const passesPaymentMethods = true;
      const passesFacilities = true;

      // 伺服器端過濾 3: 收藏餐廳篩選 (不變)
      const passesFavorites =
        !favoriteRestaurantIds ||
        favoriteRestaurantIds.length === 0 ||
        (Array.isArray(favoriteRestaurantIds)
          ? favoriteRestaurantIds.includes(restaurant.id)
          : favoriteRestaurantIds === restaurant.id);

      // 伺服器端過濾 4: Min/Max Seating Capacity (不變)
      const { min: restaurantMinCapacity, max: restaurantMaxCapacity } =
        parseSeatingCapacity(restaurant.seatingCapacity);

      const parsedMinSeating = minSeatingCapacity
        ? parseInt(minSeatingCapacity, 10)
        : 0;
      const parsedMaxSeating = maxSeatingCapacity
        ? parseInt(maxSeatingCapacity, 10)
        : Infinity;

      const passesMinMaxSeating =
        (!minSeatingCapacity || restaurantMinCapacity >= parsedMinSeating) &&
        (!maxSeatingCapacity || restaurantMaxCapacity <= parsedMaxSeating);

      // 伺服器端過濾 5: partySize (不變)
      const passesPartySize = passesSeatingFilter(
        restaurant,
        parseInt(partySize, 10)
      );

      // 伺服器端過濾 6: 營業時間篩選 (不變)
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

      // 伺服器端過濾 7: Search 輔助過濾 
      const passesSearch = (() => {
        if (!search) return true;
        const normalizedQuery = search.toLowerCase();

        // 檢查中文名稱 (.includes) - 作為英文前綴搜尋的補充
        return (
          (restaurant.restaurantName?.["zh-TW"] || "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          // 檢查英文名稱 (.includes) - 雖然 DB 已經用前綴，這裡作為二次確認
          (restaurant.restaurantName?.en || "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          (restaurant.category || "") // 檢查新的 category 欄位
            .toLowerCase()
            .includes(normalizedQuery) ||
          (restaurant.subCategory || []).some(
            (sub) => sub.toLowerCase().includes(normalizedQuery) // 檢查新的 subCategory 陣列
          ) ||
          (restaurant.fullAddress || "").toLowerCase().includes(normalizedQuery)
        );
      })();

      // 最終返回所有通過的篩選條件
      return (
        passesMinAvgSpending &&
        passesMaxAvgSpending &&
        // passesCategory 已經移除
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

    // 5. 準備最終結果與分頁資訊區 (不變)

    const limitNum = parseInt(limit, 10);
    const hasMore = filteredRestaurants.length > limitNum;

    const paginatedRestaurants = hasMore
      ? filteredRestaurants.slice(0, limitNum)
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
