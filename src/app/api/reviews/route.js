import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      restaurantId,
      reviewTitle,
      overallRating,
      reviewContent,
      ratings,
      costPerPerson,
      timeOfDay,
      serviceType,
      uploadedImageUrls,
      userId,
      username,
    } = body;

    if (
      !userId ||
      !restaurantId ||
      typeof overallRating !== "number" ||
      overallRating === 0 ||
      !reviewTitle ||
      !reviewContent
    ) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid required fields." },
        { status: 400 }
      );
    }

    const appId = process.env.FIREBASE_ADMIN_APP_ID;
    const reviewsCollectionPath = `artifacts/${appId}/public/data/reviews`;
    const restaurantsCollectionPath = `artifacts/${appId}/public/data/restaurants`;

    // 1. 在交易之前計算 visitCount
    // 查詢該用戶為該餐廳提交的所有食評
    const existingReviewsQuery = db
      .collection(reviewsCollectionPath)
      .where("userId", "==", userId)
      .where("restaurantId", "==", restaurantId);

    const existingReviewsSnapshot = await existingReviewsQuery.get();

    // visitCount = 現有食評數量 + 1 (這次的食評)
    const visitCount = existingReviewsSnapshot.size + 1;

    const result = await db.runTransaction(async (transaction) => {
      const restaurantRef = db
        .collection(restaurantsCollectionPath)
        .doc(restaurantId);
      const restaurantDoc = await transaction.get(restaurantRef);

      if (!restaurantDoc.exists) {
        throw new Error("Restaurant not found.");
      }

      const data = restaurantDoc.data();
      const currentReviewCount = data.reviewCount || 0;
      const currentRatingSum = data.ratingSum || 0;

      const newReviewCount = currentReviewCount + 1;
      const newRatingSum = currentRatingSum + overallRating;
      const newAverageRating = newRatingSum / newReviewCount;

      // 更新餐廳文件
      transaction.update(restaurantRef, {
        reviewCount: newReviewCount,
        ratingSum: newRatingSum,
        averageRating: newAverageRating,
      });

      const reviewRef = db.collection(reviewsCollectionPath).doc();
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
        uploadedImageUrls,
        createdAt: FieldValue.serverTimestamp(),
        status: "published",
        visitCount,
      });

      return { success: true };
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
