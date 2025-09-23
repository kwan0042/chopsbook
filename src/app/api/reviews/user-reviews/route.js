import { NextResponse } from "next/server";
// ✅ 引入必要的 Firestore 函式
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { db, FieldPath } from "@/lib/firebase-admin";

// 每頁顯示的食評數量
const REVIEWS_PER_PAGE = 10;
// Firestore 'in' 查詢的限制
const IN_QUERY_LIMIT = 10;

/**
 * GET 請求處理函數，用於獲取用戶的食評及相關餐廳資訊。
 * URL 範例: /api/reviews/user-reviews?userId=someUserId&appId=someAppId&lastCreatedAt=someTimestamp
 *
 * @param {object} request - Next.js Request object.
 * @returns {NextResponse} The JSON response containing reviews and total count.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    // ✅ 關鍵：使用 lastCreatedAt 參數來實現游標式分頁
    const lastCreatedAt = searchParams.get("lastCreatedAt");
    const appId = searchParams.get("appId");

    if (!userId || !appId) {
      return NextResponse.json(
        { error: "缺少必要的參數 (userId 或 appId)" },
        { status: 400 }
      );
    }

    // 1. 建立 Firestore 查詢
    // 直接查詢食評集合，按時間戳降序排列，並限制數量
    let reviewsQuery = db
      .collection(`artifacts/${appId}/public/data/reviews`)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(REVIEWS_PER_PAGE);

    // 2. 應用游標分頁
    // 如果有提供上一個食評的時間戳，就從它之後開始獲取
    if (lastCreatedAt) {
      // ✅ 從上一個食評的時間戳之後開始獲取
      reviewsQuery = reviewsQuery.startAfter(new Date(lastCreatedAt));
    }

    const reviewsSnapshot = await reviewsQuery.get();

    let reviewsData = reviewsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 如果沒有獲取到任何評論，直接返回
    if (reviewsData.length === 0) {
      return NextResponse.json(
        { reviews: [], totalReviews: 0 },
        { status: 200 }
      );
    }

    // 3. 提取所有唯一的餐廳 ID
    const uniqueRestaurantIds = [
      ...new Set(reviewsData.map((review) => review.restaurantId)),
    ];

    // 4. 批次查詢所有相關的餐廳名稱
    const restaurantNamesMap = {};
    if (uniqueRestaurantIds.length > 0) {
      for (let i = 0; i < uniqueRestaurantIds.length; i += IN_QUERY_LIMIT) {
        const batchIds = uniqueRestaurantIds.slice(i, i + IN_QUERY_LIMIT);
        const restaurantsQuery = db
          .collection(`artifacts/${appId}/public/data/restaurants`)
          .where(FieldPath.documentId(), "in", batchIds);
        const restaurantsSnapshot = await restaurantsQuery.get();
        restaurantsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          restaurantNamesMap[doc.id] = data.restaurantName;
        });
      }
    }

    // 5. 將餐廳名稱合併到食評資料中，並轉換日期格式
    const reviewsWithNames = reviewsData.map((review) => ({
      ...review,
      restaurantName: restaurantNamesMap[review.restaurantId] || {
        "zh-TW": "餐廳名稱未知",
        en: "Unknown Restaurant",
      },
      // ✅ 轉換日期格式
      createdAt: review.createdAt.toDate().toISOString(),
    }));

    // 6. 獲取總食評數
    const totalReviewsQuery = db
      .collection(`artifacts/${appId}/public/data/reviews`)
      .where("userId", "==", userId)
      .count();
    const totalSnapshot = await totalReviewsQuery.get();
    const totalReviews = totalSnapshot.data().count;

    return NextResponse.json({
      reviews: reviewsWithNames,
      totalReviews: totalReviews,
      // ✅ 返回下一頁的游標 (最後一個食評的時間戳)
      lastCreatedAt: reviewsWithNames[reviewsWithNames.length - 1]?.createdAt,
    });
  } catch (error) {
    console.error("API 錯誤:", error);
    return NextResponse.json({ error: "內部伺服器錯誤" }, { status: 500 });
  }
}
