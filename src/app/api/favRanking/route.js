// src/app/api/favRanking/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function PUT(request) {
  try {
    const { userId, favoriteIds } = await request.json();

    if (!userId || !favoriteIds || !Array.isArray(favoriteIds)) {
      return NextResponse.json(
        { success: false, error: "無效的請求數據。" },
        { status: 400 }
      );
    }

    const appId = process.env.FIREBASE_ADMIN_APP_ID;
    const userRef = db.doc(`artifacts/${appId}/users/${userId}`);

    await userRef.update({
      favoriteRestaurants: favoriteIds,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update favorite order:", error);
    return NextResponse.json(
      { success: false, error: "更新收藏順序失敗。" },
      { status: 500 }
    );
  }
}
