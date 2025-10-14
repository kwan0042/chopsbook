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

/**
 * 小工具：監控 Firestore Read
 * @param {string} page - API 名稱或呼叫來源
 * @param {number} count - 讀取的文件數量
 */
function logFirestoreRead(page, count) {
  console.log(`[Firestore READ] ${page} → ${count} docs`);
}

// 每頁顯示的食評數量
const REVIEWS_PER_PAGE = 10;
// Firestore 'in' 查詢的限制
const IN_QUERY_LIMIT = 10;

/**
 * GET 請求處理函數，用於獲取用戶的食評及相關餐廳資訊。
 * URL 範例: /api/reviews/user-reviews?userId=someUserId&lastCreatedAt=someTimestamp
 *
 * @param {object} request - Next.js Request object.
 * @returns {NextResponse} The JSON response containing reviews and total count.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const lastCreatedAt = searchParams.get("lastCreatedAt");

    // V V V V V V V V 修正點：從環境變量獲取 appId V V V V V V V V
    const appId = process.env.FIREBASE_ADMIN_APP_ID;

    if (!userId || !appId) {
      return NextResponse.json(
        { error: "缺少必要的參數 (userId 或 FIREBASE_ADMIN_APP_ID)" },
        { status: 400 }
      );
    }

    console.log(
      `[API CALL] /api/reviews/user-reviews GET - User ID: ${userId}, Cursor: ${lastCreatedAt}`
    );

    const reviewsColRef = db.collection(
      `artifacts/${appId}/public/data/reviews`
    );

    // 1. 建立 Firestore 查詢
    let reviewsQuery = reviewsColRef
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(REVIEWS_PER_PAGE);

    // 2. 應用游標分頁
    if (lastCreatedAt) {
      reviewsQuery = reviewsQuery.startAfter(new Date(lastCreatedAt));
    }

    const reviewsSnapshot = await reviewsQuery.get();

    // --- 【Firestore Read 追蹤點 1: 食評分頁查詢】 ---
    logFirestoreRead(
      "/api/reviews/user-reviews [Reviews Batch]",
      reviewsSnapshot.size
    );
    // ---------------------------------------------------

    let reviewsData = reviewsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 如果沒有獲取到任何評論，直接返回 (這裡的總數將會是 0，跳過步驟 3, 4, 6)
    if (reviewsData.length === 0) {
      // 6. 獲取總食評數 (如果 reviewsData.length === 0, 總數應該是 0)
      // 為了避免額外的 count() 查詢，我們假設如果分頁查詢為空，則可以返回總數 0。
      // 如果你需要精確的總數，即使 reviewsData 為空也需要執行 count 查詢。

      // 為了節省讀取，這裡假設如果 reviewsData 為空，則總數為 0
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
    const restaurantsColRef = db.collection(
      `artifacts/${appId}/public/data/restaurants`
    );

    if (uniqueRestaurantIds.length > 0) {
      for (let i = 0; i < uniqueRestaurantIds.length; i += IN_QUERY_LIMIT) {
        const batchIds = uniqueRestaurantIds.slice(i, i + IN_QUERY_LIMIT);

        const restaurantsQuery = restaurantsColRef.where(
          FieldPath.documentId(),
          "in",
          batchIds
        );

        const restaurantsSnapshot = await restaurantsQuery.get();

        // --- 【Firestore Read 追蹤點 2: 餐廳名稱批次查詢】 ---
        logFirestoreRead(
          `/api/reviews/user-reviews [Restaurant Name Batch ${
            i / IN_QUERY_LIMIT + 1
          }]`,
          restaurantsSnapshot.size
        );
        // ---------------------------------------------------

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
      createdAt: review.createdAt.toDate().toISOString(),
    }));

    // 6. 獲取總食評數
    const totalReviewsQuery = reviewsColRef
      .where("userId", "==", userId)
      .count();

    const totalSnapshot = await totalReviewsQuery.get();

    // --- 【Firestore Read 追蹤點 3: 總數查詢 (Count 查詢)】 ---
    logFirestoreRead("/api/reviews/user-reviews [Total Count]", 1);
    // ---------------------------------------------------

    const totalReviews = totalSnapshot.data().count;

    return NextResponse.json({
      reviews: reviewsWithNames,
      totalReviews: totalReviews,
      lastCreatedAt: reviewsWithNames[reviewsWithNames.length - 1]?.createdAt,
    });
  } catch (error) {
    console.error("API 錯誤:", error);
    return NextResponse.json({ error: "內部伺服器錯誤" }, { status: 500 });
  }
}
