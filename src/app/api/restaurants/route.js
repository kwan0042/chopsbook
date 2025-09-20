// src/app/api/restaurants/route.js

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

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
      snapshots.forEach((snapshot) => {
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

// ⚠️ 注意：為了確保代碼的清晰，我移除了這個檔案中的 GET 邏輯。
// 如果您的應用程式同時需要一般搜尋，請考慮將這段程式碼移回一個單獨的 GET 路由。
