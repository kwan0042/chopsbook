// /api/reviews/get-visit-count.js

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request) {
  // 🚀 追蹤 Firestore 讀取量的局部變數
  let firestoreReads = 0;

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

    // 執行 count() 聚合操作 (只計費 1 次文件讀取)
    const countSnapshot = await existingReviewsQuery.count().get();

    // 記錄實際的讀取文件數 (使用 count() 總是計為 1)
    const documentsRead = 1;
    firestoreReads += documentsRead;

    // 從聚合結果中獲取計數值
    const existingReviewsCount = countSnapshot.data().count;

    // 這次是第幾次拜訪 (現有文件數 + 1)
    const visitCount = existingReviewsCount + 1;

    // ✅ 輸出讀取量到控制台 (Server-side)
    console.log(
      `[API - get-visit-count] Firestore 實際讀取文件數 (Count Aggregation): ${firestoreReads} documents.`
    );
    console.log(
      `[API - get-visit-count] 成功優化: 查詢匹配 ${existingReviewsCount} 篇評論，僅產生 ${documentsRead} 次讀取。`
    );

    return NextResponse.json({ success: true, visitCount }, { status: 200 });
  } catch (error) {
    console.error("Error getting visit count:", error);
    // 錯誤時也輸出讀取量
    console.log(
      `[API - get-visit-count] Error occurred. Firestore 讀取量: ${firestoreReads} documents.`
    );

    return NextResponse.json(
      {
        success: false,
        message: error.message || "An internal error occurred.",
      },
      { status: 500 }
    );
  }
}
