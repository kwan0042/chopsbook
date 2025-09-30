// src/lib/reviewsService.js
import { db } from "@/lib/firebase-admin";

export async function getReviewById(reviewId, appId) {
  const reviewsPath = `artifacts/${appId}/public/data/reviews`;
  const restaurantsPath = `artifacts/${appId}/public/data/restaurants`;

  const reviewRef = db.collection(reviewsPath).doc(reviewId);
  const reviewDoc = await reviewRef.get();
  if (!reviewDoc.exists) return null;

  let reviewData = { id: reviewDoc.id, ...reviewDoc.data() };

  // 拿餐廳名稱
  if (reviewData.restaurantId) {
    const restaurantRef = db
      .collection(restaurantsPath)
      .doc(reviewData.restaurantId);
    const restaurantDoc = await restaurantRef.get();
    if (restaurantDoc.exists) {
      reviewData.restaurantName =
        restaurantDoc.data().restaurantName || "餐廳名稱未知";
    }
  }

  // 🚩 將 Firestore Timestamp 轉換成普通 string / number
  if (reviewData.createdAt?.toDate) {
    reviewData.createdAt = reviewData.createdAt.toDate().toISOString();
  }

  // 保證一定係 plain object
  return JSON.parse(JSON.stringify(reviewData));
}
