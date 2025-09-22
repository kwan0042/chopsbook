import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const { userId, restaurantId } = await request.json();

    if (!userId || !restaurantId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    const appId = process.env.FIREBASE_ADMIN_APP_ID;
    const reviewsCollectionPath = `artifacts/${appId}/public/data/reviews`;
    
    // 獲取該用戶在此餐廳的評論次數
    const existingReviewsQuery = db
      .collection(reviewsCollectionPath)
      .where("userId", "==", userId)
      .where("restaurantId", "==", restaurantId);

    const existingReviewsSnapshot = await existingReviewsQuery.get();
    const visitCount = existingReviewsSnapshot.size + 1; // 這次是第幾次拜訪

    return NextResponse.json({ success: true, visitCount }, { status: 200 });

  } catch (error) {
    console.error("Error getting visit count:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "An internal error occurred.",
      },
      { status: 500 }
    );
  }
}