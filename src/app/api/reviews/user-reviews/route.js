import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// 每頁顯示的食評數量
const REVIEWS_PER_PAGE = 10;
// Firestore 'in' 查詢的限制
const IN_QUERY_LIMIT = 10;

/**
 * GET 請求處理函數，用於獲取用戶的食評及相關餐廳資訊。
 * URL 範例: /api/reviews/user-reviews?userId=someUserId&page=1&appId=someAppId
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const appId = searchParams.get("appId");

    if (!userId || !appId) {
      return NextResponse.json(
        { error: "缺少必要的參數 (userId 或 appId)" },
        { status: 400 }
      );
    }

    // 1. 從用戶文件獲取所有食評 ID
    const userDocRef = db.collection(`artifacts/${appId}/users`).doc(userId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      return NextResponse.json(
        { reviews: [], totalReviews: 0 },
        { status: 200 }
      );
    }

    const userData = userDocSnap.data();
    const allReviewIds = (userData.publishedReviews || []).reverse();
    const reviewsCount = allReviewIds.length;

    // 2. 根據頁碼篩選出當前頁的食評 ID
    const startIndex = (page - 1) * REVIEWS_PER_PAGE;
    const endIndex = startIndex + REVIEWS_PER_PAGE;
    const idsToFetch = allReviewIds.slice(startIndex, endIndex);

    if (idsToFetch.length === 0) {
      return NextResponse.json(
        { reviews: [], totalReviews: reviewsCount },
        { status: 200 }
      );
    }

    // 3. 批次查詢當前頁的所有食評
    const reviewsCollectionRef = db.collection(
      `artifacts/${appId}/public/data/reviews`
    );
    const reviewsQuery = reviewsCollectionRef.where(
      "__name__",
      "in",
      idsToFetch
    );
    const reviewsSnapshot = await reviewsQuery.get();
    let fetchedReviews = reviewsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 4. 根據 ID 列表對食評進行排序
    fetchedReviews = idsToFetch
      .map((id) => fetchedReviews.find((review) => review.id === id))
      .filter(Boolean);

    // 5. 提取所有唯一的餐廳 ID
    const uniqueRestaurantIds = [
      ...new Set(fetchedReviews.map((review) => review.restaurantId)),
    ];

    // 6. 批次查詢所有相關的餐廳名稱
    const restaurantNamesMap = {};
    if (uniqueRestaurantIds.length > 0) {
      // 將 ID 分成最多 10 個的區塊，以符合 'in' 查詢的限制
      for (let i = 0; i < uniqueRestaurantIds.length; i += IN_QUERY_LIMIT) {
        const batchIds = uniqueRestaurantIds.slice(i, i + IN_QUERY_LIMIT);
        const restaurantsQuery = db
          .collection(`artifacts/${appId}/public/data/restaurants`)
          .where("__name__", "in", batchIds);
        const restaurantsSnapshot = await restaurantsQuery.get();
        restaurantsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          restaurantNamesMap[doc.id] = data.name;
        });
      }
    }

    // 7. 將餐廳名稱合併到食評資料中
    const reviewsWithNames = fetchedReviews.map((review) => ({
      ...review,
      restaurantName: restaurantNamesMap[review.restaurantId] || "餐廳名稱未知",
    }));

    return NextResponse.json({
      reviews: reviewsWithNames,
      totalReviews: reviewsCount,
    });
  } catch (error) {
    console.error("API 錯誤:", error);
    return NextResponse.json({ error: "內部伺服器錯誤" }, { status: 500 });
  }
}
