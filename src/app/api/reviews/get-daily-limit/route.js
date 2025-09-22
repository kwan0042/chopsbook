import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

const getStartOfToday = () => {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
};

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Missing userId." },
        { status: 400 }
      );
    }

    const appId = process.env.FIREBASE_ADMIN_APP_ID;
    const reviewsCollectionPath = `artifacts/${appId}/public/data/reviews`;
    
    const startOfToday = getStartOfToday();
    const todayReviewsQuery = db
      .collection(reviewsCollectionPath)
      .where("userId", "==", userId)
      .where("createdAt", ">=", startOfToday)
      .orderBy("createdAt", "desc");

    const todayReviewsSnapshot = await todayReviewsQuery.get();

    const isLimitReached = todayReviewsSnapshot.size >= 10;

    return NextResponse.json({ isLimitReached }, { status: 200 });

  } catch (error) {
    console.error("Error checking daily limit:", error);
    return NextResponse.json(
      { success: false, message: "An internal error occurred." },
      { status: 500 }
    );
  }
}