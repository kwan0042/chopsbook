// src/app/api/user/review-drafts/route.js

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request) {
  try {
    // 1. 從請求 URL 中解析出 userId 參數
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // 檢查 userId 是否存在
    if (!userId) {
      return NextResponse.json(
        { message: "需要 userId 參數" },
        { status: 400 } // Bad Request
      );
    }

    // 檢查 App ID 環境變數
    const appId = process.env.FIREBASE_ADMIN_APP_ID;

    if (!appId) {
      return NextResponse.json(
        { message: "環境變數 FIREBASE_ADMIN_APP_ID 未設置" },
        { status: 500 } // Internal Server Error
      );
    }

    // 2. 構建 Firestore 參考，指向該用戶的草稿集合
    const draftsRef = db.collection(
      `artifacts/${appId}/users/${userId}/draft_reviews`
    );

    // 3. 執行查詢
    const querySnapshot = await draftsRef.get();
    const drafts = [];

    // 遍歷結果並格式化數據
    querySnapshot.forEach((doc) => {
      drafts.push({ id: doc.id, ...doc.data() });
    });

    // 4. 返回成功的 JSON 響應
    return NextResponse.json({ drafts }, { status: 200 }); // OK
  } catch (error) {
    // 5. 處理任何執行錯誤並返回 500 錯誤響應
    console.error("Error fetching drafts:", error);
    return NextResponse.json(
      { message: "獲取食評草稿失敗", error: error.message },
      { status: 500 }
    );
  }
}
