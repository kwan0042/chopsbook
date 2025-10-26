import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Helper function to get the start of the current day in UTC
const getStartOfToday = () => {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0); // Set to midnight UTC
  return now;
};

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      restaurantId,
      reviewTitle,
      overallRating,
      reviewContent, // reviewContent 現在是可選的
      ratings,
      costPerPerson,
      timeOfDay,
      serviceType,
      recommendedDishes,
      uploadedImageUrls,
      userId,
      username,
      // 【✅ 修正 1: 新增接收餐廳名稱與小寫英文名稱】
      restaurantName,
      restaurantNameLowercaseEn,
      // 【修正 1 結束】
    } = body;

    // 1. 基本欄位驗證
    if (
      !userId ||
      !restaurantId ||
      typeof overallRating !== "number" ||
      overallRating === 0 ||
      !reviewTitle ||
      !costPerPerson
    ) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid required fields." },
        { status: 400 }
      );
    }

    const appId = process.env.FIREBASE_ADMIN_APP_ID;
    const reviewsCollectionPath = `artifacts/${appId}/public/data/reviews`;
    const restaurantsCollectionPath = `artifacts/${appId}/public/data/restaurants`;
    const usersCollectionPath = `artifacts/${appId}/users`;

    // 2. 提交次數限制邏輯
    const startOfToday = getStartOfToday();
    const todayReviewsQuery = db
      .collection(reviewsCollectionPath)
      .where("userId", "==", userId)
      .where("createdAt", ">=", startOfToday)
      .orderBy("createdAt", "desc");

    const todayReviewsSnapshot = await todayReviewsQuery.get();

    if (todayReviewsSnapshot.size >= 10) {
      return NextResponse.json(
        {
          success: false,
          isLimitReached: true,
          message: "每日提交次數已達上限。",
        },
        { status: 200 }
      );
    }

    // 3. 計算 visitCount
    const existingReviewsQuery = db
      .collection(reviewsCollectionPath)
      .where("userId", "==", userId)
      .where("restaurantId", "==", restaurantId);

    const existingReviewsSnapshot = await existingReviewsQuery.get();
    const visitCount = existingReviewsSnapshot.size + 1;

    // 4. 執行 Firestore 交易
    const result = await db.runTransaction(async (transaction) => {
      const restaurantRef = db
        .collection(restaurantsCollectionPath)
        .doc(restaurantId);
      const userRef = db.collection(usersCollectionPath).doc(userId);
      const reviewRef = db.collection(reviewsCollectionPath).doc();

      const [restaurantDoc, userDoc] = await Promise.all([
        transaction.get(restaurantRef),
        transaction.get(userRef),
      ]);

      if (!restaurantDoc.exists) {
        throw new Error("Restaurant not found.");
      }
      if (!userDoc.exists) {
        throw new Error("User not found.");
      }

      const restaurantData = restaurantDoc.data();
      const currentReviewCount = restaurantData.reviewCount || 0;
      const currentRatingSum = restaurantData.totalRatingSum || 0;

      const newReviewCount = currentReviewCount + 1;
      const newRatingSum = currentRatingSum + overallRating;

      let newAverageRating = newRatingSum / newReviewCount;

      // ✅ 修正：四捨五入到小數點後兩位 (乘以 100 後四捨五入，然後除以 100)
      newAverageRating = Math.round(newAverageRating * 100) / 100;

      transaction.update(restaurantRef, {
        reviewCount: newReviewCount,
        totalRatingSum: newRatingSum,
        averageRating: newAverageRating, // 儲存四捨五入後的數值
      });

      // 【✅ 修正 2: 在 review 文件中加入餐廳名稱相關欄位】
      transaction.set(reviewRef, {
        userId,
        username,
        restaurantId,
        reviewTitle,
        overallRating,
        reviewContent,
        ratings,
        costPerPerson,
        timeOfDay,
        serviceType,
        recommendedDishes,
        uploadedImageUrls,
        createdAt: FieldValue.serverTimestamp(),
        status: "published",
        visitCount,
        // 新增欄位
        restaurantName: restaurantName, // 儲存中/英名稱物件
        restaurantNameLowercaseEn: restaurantNameLowercaseEn, // 儲存小寫英文名稱
      });
      // 【修正 2 結束】

      // 更新：將新創建的 reviewId 加入用戶的 publishedReviews 陣列
      transaction.update(userRef, {
        publishedReviews: FieldValue.arrayUnion(reviewRef.id),
      });

      return { success: true, reviewId: reviewRef.id };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "An internal error occurred.",
      },
      { status: 500 }
    );
  }
}
