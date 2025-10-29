// src/lib/restaurant/restaurantPage-data-fetcher.js (修正版)

// 🚨 假設你的 Firebase Admin 實例和相關工具從這裡導入
import { db } from "@/lib/firebase-admin";
// 為了處理 Timestamp，我們需要從 Admin SDK 導入 Timestamp 類型
// 假設您的 db 實例是 Admin SDK 的 firestore。
// 這裡用一個輔助函數來檢查並轉換。
// import { Timestamp } from "@google-cloud/firestore"; // 假設引入方式

// 每頁顯示的食評數量
const REVIEWS_LIMIT = 5;

// --- 輔助函數：遞迴地將 Firestore Timestamp 轉換為 ISO 字符串 ---
function serializeFirestoreTimestamps(data) {
  if (data === null || typeof data !== "object") {
    return data;
  }

  // 檢查是否為陣列
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreTimestamps);
  }

  // 檢查是否為 Firestore Timestamp 類型 (Admin SDK)
  if (data.toDate && typeof data.toDate === "function") {
    return data.toDate().toISOString();
  }

  // 檢查是否為 GeoPoint 類型 (可選，但最好也處理)
  if (data.latitude !== undefined && data.longitude !== undefined) {
    // 將 GeoPoint 轉換為簡單物件
    return { latitude: data.latitude, longitude: data.longitude };
  }

  // 檢查是否為 Object 類型
  const serialized = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      serialized[key] = serializeFirestoreTimestamps(data[key]);
    }
  }

  return serialized;
}

/**
 * Server-Side Utility: 獲取單一餐廳頁面所需的所有數據。
 * @param {string} restaurantId - 餐廳 ID。
 * @returns {Promise<object>} 包含餐廳、優惠、菜單、照片、評論等數據的物件。
 */
export async function fetchRestaurantPageDataServer(restaurantId) {
  if (!restaurantId) {
    return { error: "Missing restaurant ID" };
  }

  const appId = process.env.FIREBASE_ADMIN_APP_ID;

  if (!appId) {
    console.error("FIREBASE_ADMIN_APP_ID is not defined.");
    return { error: "Configuration Error: App ID missing." };
  }

  try {
    // --- 1. 獲取餐廳主文檔 (包含 topMenus 和 topPhotos) ---
    const restaurantRef = db.doc(
      `artifacts/${appId}/public/data/restaurants/${restaurantId}`
    );
    const restaurantSnapshot = await restaurantRef.get();

    if (!restaurantSnapshot.exists) {
      return {
        error: "找不到餐廳資料。",
        restaurant: null,
        promotions: [],
        recentReviews: [],
        topMenus: [],
        topPhotos: [],
      };
    }

    // ⚠️ 修正：將 Firestore Timestamp 轉換為原生類型
    const rawRestaurantData = restaurantSnapshot.data();
    const serializedRestaurantData =
      serializeFirestoreTimestamps(rawRestaurantData);

    const restaurantData = {
      id: restaurantSnapshot.id,
      ...serializedRestaurantData,
    };

    // 提取內嵌數據 (基於你的要求：topPhotos 和 topMenus 在主文檔內)
    const restaurant = {
      ...restaurantData,
      topPhotos: restaurantData.topPhotos || [],
      topMenus: restaurantData.topMenus || [],
    };

    // --- 2. 獲取優惠活動 (Promotions) ---
    const promotionsColRef = db.collection(
      `artifacts/${appId}/public/data/promotions`
    );

    const promotionsQuery = promotionsColRef
      .where("restaurantId", "==", restaurantId)
      .limit(10);

    const promotionsSnapshot = await promotionsQuery.get();
    const promotions = promotionsSnapshot.docs.map((doc) => {
      // ⚠️ 修正：將優惠活動數據中的所有 Timestamp 轉換為原生類型
      return serializeFirestoreTimestamps({
        id: doc.id,
        ...doc.data(),
      });
    });

    // --- 3. 獲取最新評論 (Recent Reviews) ---
    const reviewColRef = db.collection(
      `artifacts/${appId}/public/data/reviews`
    );

    const recentReviewsQuery = reviewColRef
      .where("restaurantId", "==", restaurantId)
      .orderBy("createdAt", "desc")
      .limit(REVIEWS_LIMIT);

    const reviewsSnapshot = await recentReviewsQuery.get();
    const recentReviews = reviewsSnapshot.docs.map((doc) => {
      // ⚠️ 修正：將評論數據中的所有 Timestamp 轉換為原生類型
      return serializeFirestoreTimestamps({
        id: doc.id,
        ...doc.data(),
        // createdAt 已經在 serializeFirestoreTimestamps 中處理，
        // 這裡不需要額外的手動轉換。
      });
    });

    // --- 4. 返回所有整合的數據 ---
    return {
      restaurant: restaurant,
      promotions: promotions,
      topMenus: restaurant.topMenus,
      topPhotos: restaurant.topPhotos,
      recentReviews: recentReviews,
      loading: false,
      error: null,
    };
  } catch (error) {
    // 確保錯誤返回的是一個可序列化的物件
    console.error(
      `Server Fetch Details Error for ${restaurantId}:`,
      error.message
    );
    return {
      error: `數據獲取失敗: ${error.message}. 請檢查 Firebase 索引是否已建立。`,
      restaurant: null,
      promotions: [],
      topMenus: [],
      topPhotos: [],
      recentReviews: [],
      loading: false,
    };
  }
}
