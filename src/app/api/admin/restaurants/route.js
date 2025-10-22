// src/app/api/admin/restaurants/route.js

import { NextResponse } from "next/server";
// 🎯 修正點 1: 不再需要 admin。只導入 db 和 bucket。
import { db, bucket } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// --- 小工具：監控 Firestore Read/Write ---
/**
 * 小工具：監控 Firestore Read/Write
 * @param {'READ'|'WRITE'} type - 操作類型
 * @param {string} page - API 名稱或呼叫來源
 * @param {number} [count=0] - 讀取/寫入的文件數量
 */
function logFirestoreAction(type, page, count = 0) {
  const action = type === "READ" ? "Read" : "Write";
  const docCount = count > 0 ? `→ ${count} docs` : "";
  console.log(`[Firestore ${action}] ${page} ${docCount}`);
}
// ----------------------------------------

const COLLECTION_PATH = "artifacts/YOUR_APP_ID/public/data/restaurants"; // 請替換 YOUR_APP_ID

/**
 * 助手函數：獲取餐廳集合的引用
 */
function getRestaurantsCollectionRef() {
  const appId = process.env.FIREBASE_ADMIN_APP_ID || "YOUR_APP_ID_FALLBACK"; // 確保您設置了環境變量
  const path = COLLECTION_PATH.replace("YOUR_APP_ID", appId);
  return db.collection(path);
}

/**
 * 助手函數：獲取餐廳文件的引用
 */
function getRestaurantDocRef(restaurantId) {
  const appId = process.env.FIREBASE_ADMIN_APP_ID || "YOUR_APP_ID_FALLBACK";
  const docPath =
    COLLECTION_PATH.replace("YOUR_APP_ID", appId) + `/${restaurantId}`;
  return db.doc(docPath);
}

/**
 * API Route: 管理員獲取餐廳列表 (GET)
 * 支援分頁、搜尋 (中/英)、排序。
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const searchQuery = searchParams.get("search") || "";
    const anchorId = searchParams.get("anchorId"); // 用於 startAfter 的文件 ID

    let startAfterDoc = null;
    let isSearching = false;

    const restaurantsColRef = getRestaurantsCollectionRef();
    let q = restaurantsColRef;

    // 1. 處理排序和搜尋邏輯
    if (searchQuery.trim()) {
      isSearching = true;
      const isChinese = /[\u4e00-\u9fff]/.test(searchQuery.trim());

      const searchTarget = isChinese
        ? "restaurantName.zh-TW"
        : "name_lowercase_en";

      let normalizedQuery = searchQuery.trim();

      if (!isChinese) {
        normalizedQuery = normalizedQuery.toLowerCase();
      }

      // 設置查詢約束 (範圍查詢)
      // 搜尋時，主要按搜尋目標欄位排序，然後按 submittedAt
      q = q
        .where(searchTarget, ">=", normalizedQuery)
        .where(searchTarget, "<=", normalizedQuery + "\uf8ff")
        .orderBy(searchTarget)
        // 🚨 變更點: 搜尋結果的次要排序使用 submittedAt
        .orderBy("updatedAt", "desc")
        .orderBy("createdAt", "desc")
        .orderBy("__name__");
    }

    // 🚨 變更點: 非搜尋時，預設按 submittedAt 降序排列，再按文件 ID
    if (!isSearching) {
      q = q
        .orderBy("updatedAt", "desc")
        .orderBy("createdAt", "desc")
        .orderBy("__name__");
    }

    // 2. 處理分頁錨點 (必須在 orderBy 之後)
    if (anchorId) {
      // 獲取錨點文件
      startAfterDoc = await restaurantsColRef.doc(anchorId).get();
      // 讀取量監察點 1: 獲取分頁錨點文件 (1 次讀取)
      logFirestoreAction(
        "READ",
        `/api/admin/restaurants GET (Anchor Doc ${anchorId})`,
        1
      );

      if (startAfterDoc.exists) {
        q = q.startAfter(startAfterDoc);
      } else {
        console.warn(
          `Anchor document ${anchorId} not found. Starting from the beginning.`
        );
      }
    }

    // 4. 設置限制數量 (10 + 1)
    q = q.limit(limit + 1);

    const snapshot = await q.get();

    // --- 【Firestore Read 追蹤點 2: 主查詢讀取量】 ---
    logFirestoreAction(
      "READ",
      `/api/admin/restaurants GET (Main Query) - Search: ${searchQuery}, Anchor: ${anchorId}`,
      snapshot.size
    );
    // ---------------------------------------------------

    const docs = snapshot.docs;
    let restaurants = docs
      .slice(0, limit)
      .map((doc) => ({ id: doc.id, ...doc.data() }));
    const hasMore = docs.length > limit;
    const nextAnchorId = hasMore ? docs[limit - 1].id : null;

    return NextResponse.json({
      success: true,
      restaurants,
      hasMore,
      nextAnchorId,
    });
  } catch (error) {
    console.error("API Admin Restaurants GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------------------
// 🎯 修正點：新增 POST 函式以處理新增餐廳的請求 (POST)
// -------------------------------------------------------------------------
/**
 * API Route: 管理員新增餐廳資料 (POST)
 */
export async function POST(request) {
  try {
    const data = await request.json();

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing restaurant data in request body" },
        { status: 400 }
      );
    }

    const restaurantsColRef = getRestaurantsCollectionRef();

    // 創建新文件所需的數據
    const newRestaurantData = {
      ...data,

      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(), // 首次提交時 updatedAt 等於 submittedAt
      // 🚨 注意: 如果您的資料庫要求 name_lowercase_en，您應該在此處計算並添加
      // 這裡假設 restaurantName.en 存在
      name_lowercase_en: data.restaurantName?.en
        ? data.restaurantName.en.toLowerCase()
        : "",
    };

    // 讓 Firestore 自動生成文件 ID (使用 .add())
    const docRef = await restaurantsColRef.add(newRestaurantData);

    // --- 【Firestore Write 追蹤點】 ---
    logFirestoreAction("WRITE", `/api/admin/restaurants POST (New)`);
    // -----------------------------------

    return NextResponse.json({
      success: true,
      message: `Restaurant created successfully with ID: ${docRef.id}`,
      id: docRef.id,
    });
  } catch (error) {
    console.error("API Admin Restaurants POST Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create new restaurant: " + error.message,
      },
      { status: 500 }
    );
  }
}
// -------------------------------------------------------------------------

/**
 * API Route: 管理員更新單個餐廳資料 (PUT)
 */
export async function PUT(request) {
  try {
    const { id, data } = await request.json();

    if (!id || !data) {
      return NextResponse.json(
        { success: false, error: "Missing restaurant ID or data" },
        { status: 400 }
      );
    }

    const restaurantsColRef = getRestaurantsCollectionRef();
    const docRef = restaurantsColRef.doc(id);

    // 添加更新時間戳
    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.update(updateData);

    // --- 【Firestore Write 追蹤點】 ---
    logFirestoreAction("WRITE", `/api/admin/restaurants PUT (ID: ${id})`, 1);
    // -----------------------------------

    return NextResponse.json({
      success: true,
      message: `Restaurant ${id} updated successfully.`,
    });
  } catch (error) {
    console.error("API Admin Restaurants PUT Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------------------
// 🎯 新增的邏輯：處理刪除餐廳的請求 (DELETE)
// -------------------------------------------------------------------------
/**
 * API Route: 管理員刪除餐廳資料 (DELETE)
 * 需刪除 Firestore 文件和 Storage 相關資料夾。
 */
export async function DELETE(request) {
  // 從 request body 獲取 restaurantId
  const { restaurantId } = await request.json();

  if (!restaurantId) {
    return NextResponse.json(
      { success: false, message: "Missing restaurantId in request body." },
      { status: 400 }
    );
  }

  try {
    // 1. 刪除 Firestore 文件
    const restaurantDocRef = getRestaurantDocRef(restaurantId);
    await restaurantDocRef.delete();
    logFirestoreAction(
      "WRITE",
      `/api/admin/restaurants DELETE (ID: ${restaurantId})`,
      1
    );

    // 2. 刪除 Storage 中的相關資料夾 (public/restaurants/${restaurantId})
    // 🎯 修正點 2: 直接使用從 firebase-admin 匯出的 bucket 實例
    const prefix = `public/restaurants/${restaurantId}/`; // 指定要刪除的資料夾路徑 (前綴)

    // 獲取該前綴下的所有檔案
    const [files] = await bucket.getFiles({ prefix: prefix });

    if (files.length > 0) {
      // 批量刪除所有檔案
      await Promise.all(
        files.map(async (file) => {
          await file.delete();
        })
      );
      console.log(
        `[Storage DELETE] Successfully deleted ${files.length} files in folder: ${prefix}`
      );
    } else {
      console.log(
        `[Storage DELETE] No files found to delete in folder: ${prefix}`
      );
    }

    return NextResponse.json({
      success: true,
      message: `Restaurant ${restaurantId} and associated storage data deleted successfully.`,
    });
  } catch (error) {
    console.error(
      `API Admin Restaurants DELETE Error for ${restaurantId}:`,
      error
    );

    // 如果錯誤訊息包含 "not found" 或錯誤碼指示文件不存在，則視為成功
    if (error.code === 5 || error.message.includes("NOT_FOUND")) {
      return NextResponse.json(
        {
          success: true,
          message: `Restaurant ${restaurantId} was already deleted or not found.`,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: `Failed to delete restaurant ${restaurantId}.`,
      },
      { status: 500 }
    );
  }
}
