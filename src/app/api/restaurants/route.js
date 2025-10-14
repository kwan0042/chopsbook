// src/app/api/restaurants/route.js

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

/**
 * 小工具：監控 Firestore Read
 * @param {string} page - API 名稱或呼叫來源
 * @param {number} count - 讀取的文件數量
 */
function logFirestoreRead(page, count) {
  console.log(`[Firestore READ] ${page} → ${count} docs`);
}

/**
 * API Route: 獲取餐廳列表，支援多種篩選、搜尋和分頁。
 * @description 這個版本專門為前端的收藏列表分頁設計。
 */
export async function POST(request) {
  try {
    const {
      favoriteRestaurantIds = [], // 從請求主體讀取，預設為空陣列
    } = await request.json();

    const appId = process.env.FIREBASE_ADMIN_APP_ID;
    const restaurantsColRef = db.collection(
      `artifacts/${appId}/public/data/restaurants`
    );

    let restaurants = [];

    console.log(
      `[API CALL] /api/restaurants POST - favorite IDs: ${favoriteRestaurantIds.length}`
    ); // 追蹤 API 呼叫

    // ✅ 這是最終且最簡單的邏輯：只處理收藏 ID 查詢
    if (favoriteRestaurantIds.length > 0) {
      // 將 ID 陣列分組，每組最多 10 個
      const chunks = [];
      for (let i = 0; i < favoriteRestaurantIds.length; i += 10) {
        chunks.push(favoriteRestaurantIds.slice(i, i + 10));
      }

      // 針對每個分組執行查詢
      const promises = chunks.map((chunk) => {
        const q = restaurantsColRef.where("__name__", "in", chunk);
        return q.get();
      });

      const snapshots = await Promise.all(promises);

      const fetchedRestaurants = [];
      snapshots.forEach((snapshot, index) => {
        // --- 【Firestore Read 追蹤點 1: 收藏餐廳分組查詢】 ---
        logFirestoreRead(
          `/api/restaurants POST [chunk ${index + 1}/${chunks.length}]`,
          snapshot.size
        );
        // ---------------------------------------------------
        snapshot.docs.forEach((doc) => {
          fetchedRestaurants.push({ id: doc.id, ...doc.data() });
        });
      });

      // 保持原始收藏順序
      fetchedRestaurants.sort((a, b) => {
        return (
          favoriteRestaurantIds.indexOf(a.id) -
          favoriteRestaurantIds.indexOf(b.id)
        );
      });

      return NextResponse.json({
        success: true,
        restaurants: fetchedRestaurants,
      });
    } else {
      // ✅ 處理沒有收藏 ID 的情況
      logFirestoreRead(`/api/restaurants POST [empty favorites]`, 0);
      return NextResponse.json({
        success: true,
        restaurants: [],
      });
    }
  } catch (error) {
    console.error("API Filter Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
