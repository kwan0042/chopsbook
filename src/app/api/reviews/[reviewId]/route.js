import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// 從 environment 變數中獲取必要的路徑資訊
const appId = process.env.FIREBASE_ADMIN_APP_ID;
const reviewsCollectionPath = `artifacts/${appId}/public/data/reviews`;
const restaurantsCollectionPath = `artifacts/${appId}/public/data/restaurants`;

/**
 * GET 請求處理函數，用於根據 reviewId 獲取單個評論及其相關餐廳名稱。
 * URL 範例: /api/reviews/someReviewId
 *
 * @param {object} request - Next.js Request object.
 * @param {object} context - 包含動態參數的 context object ({ params: { reviewId: '...' } })
 * @returns {NextResponse} JSON response containing the review data.
 */
export async function GET(request, { params }) {
    const { reviewId } = await params;
  

  if (!reviewId || !appId) {
    return NextResponse.json(
      { error: "缺少必要的參數 (reviewId 或 appId)" },
      { status: 400 }
    );
  }

  try {
    // 1. 獲取單個評論文件
    const reviewRef = db.collection(reviewsCollectionPath).doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return NextResponse.json({ error: "評論不存在" }, { status: 404 });
    }

    let reviewData = {
      id: reviewDoc.id,
      ...reviewDoc.data(),
    };

    // 2. 獲取相關餐廳名稱
    const restaurantId = reviewData.restaurantId;
    let restaurantName = "餐廳名稱未知";

    if (restaurantId) {
      const restaurantRef = db
        .collection(restaurantsCollectionPath)
        .doc(restaurantId);
      const restaurantDoc = await restaurantRef.get();
      if (restaurantDoc.exists) {
        // 假設 restaurantName 存在於餐廳文件中
        restaurantName = restaurantDoc.data().restaurantName || restaurantName;
      }
    }

    reviewData.restaurantName = restaurantName;

    // 3. 格式化時間戳
    if (reviewData.createdAt && reviewData.createdAt.toDate) {
      reviewData.createdAt = reviewData.createdAt
        .toDate()
        .toLocaleDateString("zh-TW", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        });
    } else {
      reviewData.createdAt = "N/A";
    }

    return NextResponse.json(reviewData, { status: 200 });
  } catch (error) {
    console.error("API 錯誤:", error);
    return NextResponse.json({ error: "內部伺服器錯誤" }, { status: 500 });
  }
}
