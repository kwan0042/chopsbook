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

    const appId = "default-app-id";
    const reviewsCollectionPath = `artifacts/${appId}/public/data/reviews`;
    const restaurantsCollectionPath = `artifacts/${appId}/public/data/restaurants`;

    const result = await db.runTransaction(async (transaction) => {
      const restaurantRef = db
        .collection(restaurantsCollectionPath)
        .doc(restaurantId);
      const restaurantDoc = await transaction.get(restaurantRef);

      if (!restaurantDoc.exists) {
        throw new Error("Restaurant not found.");
      }

      const data = restaurantDoc.data();
      // 修正點：使用現有的 reviewCount
      const currentReviewCount = data.reviewCount || 0;
      // 修正點：使用 ratingSum 而非 totalRatingSum
      const currentRatingSum = data.ratingSum || 0;

      // 修正點：計算新的評論總數
      const newReviewCount = currentReviewCount + 1;
      // 修正點：計算新的總評分
      const newRatingSum = currentRatingSum + overallRating;
      const newAverageRating = newRatingSum / newReviewCount;

      // 修正點：更新餐廳文件
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
