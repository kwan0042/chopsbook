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
  // 🚨 變動點 1: 初始化 Firestore 讀取計數器
  let firestoreReadCount = 0;

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
      searchLanguage, // 🚨 新增：接收前端傳來的語言標誌
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
      restaurantType, // 🚨 新增: 接收 restaurantType 參數
      subCategory, // 細分菜系/特色 (String) ⚠️ 這裡從 Array 變為 String
      businessHours,
    } = filters;

    // 將 favoriteRestaurantIds 轉換為陣列
    const favoriteIdsArray = Array.isArray(favoriteRestaurantIds)
      ? favoriteRestaurantIds
      : favoriteRestaurantIds
      ? [favoriteRestaurantIds]
      : [];

    const appId = process.env.FIREBASE_ADMIN_APP_ID;
    const restaurantsColRef = db.collection(
      `artifacts/${appId}/public/data/restaurants`
    );

    let restaurantsFromDb = [];
    let hasMore = false;
    let lastDocId = null;

    // ----------------------------------------------------
    // ⬇️ 關鍵修改區塊：處理專屬收藏列表的快速路徑 ⬇️
    // ----------------------------------------------------

    const hasOnlyFavoriteFilter =
      favoriteIdsArray.length > 0 &&
      !search &&
      !province &&
      !city &&
      !category &&
      !restaurantType &&
      !subCategory &&
      !minAvgSpending &&
      !maxAvgSpending &&
      !minRating &&
      !minSeatingCapacity &&
      !maxSeatingCapacity &&
      !reservationModes &&
      !paymentMethods &&
      !facilities &&
      !reservationDate &&
      !reservationTime &&
      !businessHours;

    if (hasOnlyFavoriteFilter) {
      console.log("[API DEBUG] Executing Favorites ONLY Fast Path.");
      const docRefs = favoriteIdsArray.map((id) => restaurantsColRef.doc(id));

      // 限制讀取數量，以避免 db.getAll 超過 Firestore 限制 (最大 10 個，但這裡用 ID 陣列長度)
      const maxBatchReadLimit = 10;
      const idsToFetch = docRefs.slice(0, maxBatchReadLimit);

      const docs = await db.getAll(...idsToFetch);
      firestoreReadCount += docs.length; // 記錄讀取量

      restaurantsFromDb = docs
        .filter((doc) => doc.exists)
        .map((doc) => ({ id: doc.id, ...doc.data() }));

      // 由於是精確讀取，不需要分頁邏輯，但為了保持API結構，還是設置 hasMore/lastDocId
      const limitNum = parseInt(limit, 10);
      restaurantsFromDb = restaurantsFromDb.slice(0, limitNum);

      if (favoriteIdsArray.length > limitNum) {
        hasMore = true;
        // 這裡的 lastDocId 應是下一批次的起始，但因為我們是 db.getAll，
        // 簡化處理：如果數量超過限制，hasMore=true
        lastDocId = favoriteIdsArray[limitNum - 1];
      }

      // 🚨 如果是純收藏列表，直接返回結果，跳過主查詢和伺服器端二次過濾
      // (因為這裡已經精確地拿到了文件，只需處理分頁/排序)

      // 確保至少依據 priority 或 ID 排序
      restaurantsFromDb.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      console.log(
        `[API REQUEST END] Total Firestore Reads (Fast Path): ${firestoreReadCount}`
      );
      const debugInfo = { firestoreReadCount, path: "FastPath" };

      return NextResponse.json({
        success: true,
        restaurants: restaurantsFromDb,
        hasMore,
        lastDocId:
          restaurantsFromDb.length > 0
            ? restaurantsFromDb[restaurantsFromDb.length - 1].id
            : null,
        debug: debugInfo,
      });
    }

    // ----------------------------------------------------
    // ⬆️ 收藏快速路徑結束 - 進入標準過濾流程 ⬇️
    // ----------------------------------------------------

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

    // 【修正】：準備 category 陣列用於 Firestore 查詢
    const categoriesArray = Array.isArray(category)
      ? category
      : category && category !== ""
      ? [category]
      : [];

    // 🚨 【修正】：準備 subCategory 陣列用於 Firestore 查詢 (DB 欄位現在是 String，但前端可能傳多個值，所以我們使用 'in')
    const subCategoriesArray = Array.isArray(subCategory)
      ? subCategory
      : subCategory && subCategory !== ""
      ? [subCategory]
      : [];

    // 🚨 【修正】：準備 restaurantType 陣列用於 Firestore 查詢 (DB 欄位現在是 Array，所以使用 array-contains-any)
    const restaurantTypesArray = Array.isArray(restaurantType)
      ? restaurantType
      : restaurantType && restaurantType !== ""
      ? [restaurantType]
      : [];

    // ----------------------------------------------------
    // ⬇️ 標準查詢邏輯 (Search) ⬇️
    // ----------------------------------------------------
    if (search) {
      const normalizedQuery = search; // 前端已處理小寫和 trim
      const endBoundary = normalizedQuery + "\uf8ff";

      // 🚨 動態選擇搜尋欄位
      let searchField;
      if (searchLanguage === "zh") {
        searchField = "restaurantName.zh-TW";
      } else {
        // 如果是 'en' 或未指定語言 (預設為英文/小寫)
        searchField = "name_lowercase_en";
      }

      console.log(
        `[Search API Debug] Searching field: ${searchField}, Query: ${normalizedQuery}`
      );

      // 設置範圍查詢
      q = q
        .where(searchField, ">=", normalizedQuery)
        .where(searchField, "<=", endBoundary);

      // 設置主要排序 (必須與 where 條件一致)
      q = q.orderBy(searchField);
      q = q.orderBy("__name__"); // 使用文件ID作為次要排序

      // 確保在搜尋模式下，地區篩選條件能夠與 searchField 一起組成有效的複合索引
      if (province) {
        q = q.where("province", "==", province);
      }
      if (city) {
        q = q.where("city", "==", city);
      }
    } else {
      // ----------------------------------------------------
      // *** 處理無 search 的篩選和排序 ***
      // ----------------------------------------------------

      // A. 處理 Where 條件 (精確匹配與單一範圍查詢)

      if (province) {
        q = q.where("province", "==", province);
      }

      if (city) {
        q = q.where("city", "==", city);
      }

      // 獨立篩選器 1: category (精確匹配 - 單一或多個)
      if (categoriesArray.length > 0) {
        if (categoriesArray.length > 1) {
          // 'in' 查詢不能與其他 array-contains-any/in 同時存在
          q = q.where("category", "in", categoriesArray.slice(0, 10)); // 限制 in 查詢最多 10 個
        } else {
          q = q.where("category", "==", categoriesArray[0]);
        }
      }

      // 🚨 獨立篩選器 1.5: subCategory (DB 欄位是 String，使用 'in' 進行多選篩選)
      if (subCategoriesArray.length > 0) {
        if (subCategoriesArray.length > 1) {
          // 'in' 查詢不能與其他 array-contains-any/in 同時存在
          q = q.where("subCategory", "in", subCategoriesArray.slice(0, 10));
        } else {
          q = q.where("subCategory", "==", subCategoriesArray[0]);
        }
      }

      // 🚨 獨立篩選器 2: restaurantType (DB 欄位是 Array，使用 'array-contains-any' 進行 OR 篩選)
      if (restaurantTypesArray.length > 0) {
        // ⚠️ 複合查詢限制: 'array-contains-any' 查詢不能與 'in' 或其他 'array-contains-any' 同時存在
        q = q.where(
          "restaurantType",
          "array-contains-any",
          restaurantTypesArray.slice(0, 10) // 限制 array-contains-any 查詢最多 10 個
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

      // 添加一個預設排序，如果沒有其他排序
      if (
        categoriesArray.length === 0 &&
        restaurantTypesArray.length === 0 &&
        subCategoriesArray.length === 0 && // 🚨 納入 subCategory 檢查
        parsedMinRating === 0
      ) {
        q = q.orderBy("__name__");
      }
    }
    // ----------------------------------------------------
    // ⬆️ 標準查詢邏輯結束 ⬆️
    // ----------------------------------------------------

    // 3. 分頁與限制區

    let startAfterReadCount = 0;
    // 處理分頁 (startAfter)
    if (startAfterDocId) {
      // 🚨 變動點 2: 記錄 startAfter 查詢的讀取量 (+1)
      const startAfterDoc = await restaurantsColRef.doc(startAfterDocId).get();
      firestoreReadCount += 1; // 記錄本次讀取
      startAfterReadCount = 1; // 追蹤讀取量

      if (startAfterDoc.exists) {
        q = q.startAfter(startAfterDoc);
      }
    }

    // 讀取比限制多一筆的文件，用於判斷是否有更多文件
    const queryLimit = parseInt(limit, 10) + 1; // 預設 18 + 1 = 19
    q = q.limit(queryLimit);

    // 執行查詢
    const snapshot = await q.get();

    // 🚨 變動點 3: 記錄主查詢的讀取量
    // Firestore 的 q.get() 讀取量等於返回的文件數量 (snapshot.size)
    firestoreReadCount += snapshot.size;

    // ✅ 新增：console.log 追蹤讀取量
    console.log(
      `[Firestore READ] /api/restaurants - Start After Read: ${startAfterReadCount} doc`
    );
    console.log(
      `[Firestore READ] /api/restaurants - Main Query Read: ${snapshot.size} docs`
    );

    restaurantsFromDb = []; // 重置為從主查詢獲取的數據
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

      // 設置為 true，因為已在 Firestore 查詢中處理 (不變)
      const passesMinRating = true;
      const passesReservationModes = true;
      const passesPaymentMethods = true;
      const passesFacilities = true;
      const passesCategory = true;

      // 🚨 修正: restaurantType 已在 Firestore 查詢中使用 array-contains-any 處理，因此這裡設為 true
      const passesRestaurantType = true;
      // 🚨 修正: subCategory 已在 Firestore 查詢中使用 ==/in 處理，因此這裡設為 true
      const passesSubCategory = true;

      // 伺服器端過濾 3: 收藏餐廳篩選 (只有在標準流程中，才在這裡過濾)
      const passesFavorites =
        !favoriteIdsArray || // 使用 favoriteIdsArray
        favoriteIdsArray.length === 0 ||
        favoriteIdsArray.includes(restaurant.id);

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
        const normalizedQuery = search.toLowerCase(); // 這裡必須轉小寫以匹配

        // 檢查中文名稱 (.includes) - 作為英文前綴搜尋的補充
        return (
          (restaurant.restaurantName?.["zh-TW"] || "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          // 檢查英文名稱 (.includes) - 雖然 DB 已經用前綴，這裡作為二次確認
          (restaurant.restaurantName?.en || "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          (restaurant.category || "") // 檢查 category 欄位
            .toLowerCase()
            .includes(normalizedQuery) ||
          // 🚨 修正: subCategory 現在是 String，直接檢查是否包含
          (restaurant.subCategory || "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          (restaurant.fullAddress || "").toLowerCase().includes(normalizedQuery)
        );
      })();

      // 最終返回所有通過的篩選條件
      return (
        passesMinAvgSpending &&
        passesMaxAvgSpending &&
        passesCategory &&
        passesRestaurantType && // 設為 true
        passesSubCategory && // 設為 true
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

    // 5. 準備最終結果與分頁資訊區

    const limitNum = parseInt(limit, 10);
    hasMore = filteredRestaurants.length > limitNum;

    const paginatedRestaurants = hasMore
      ? filteredRestaurants.slice(0, limitNum)
      : filteredRestaurants;

    lastDocId =
      paginatedRestaurants.length > 0
        ? paginatedRestaurants[paginatedRestaurants.length - 1].id
        : null;

    // 🚨 變動點 4: 在控制台輸出總讀取量
    console.log(
      `[API REQUEST END] Total Firestore Reads: ${firestoreReadCount}`
    );

    // 🚨 可選: 將讀取量加入響應 (用於調試，生產環境可能要移除)
    const debugInfo = { firestoreReadCount, path: "Standard" };

    return NextResponse.json({
      success: true,
      restaurants: paginatedRestaurants,
      hasMore,
      lastDocId,
      debug: debugInfo, // 為了方便您測試，將計數器加入響應
    });
  } catch (error) {
    console.error("API Filter Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
