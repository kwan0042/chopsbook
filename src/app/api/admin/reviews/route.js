// src/app/api/admin/reviews/route.js
import { NextResponse } from "next/server";
// 確保從 "@/lib/firebase-admin" 導入 db, bucket, FieldValue, FieldPath
import { db, bucket, FieldValue, FieldPath } from "@/lib/firebase-admin";

const getAppCollectionPaths = () => {
  const appId = process.env.FIREBASE_ADMIN_APP_ID;
  const reviewsCollectionPath = `artifacts/${appId}/public/data/reviews`;
  const restaurantsCollectionPath = `artifacts/${appId}/public/data/restaurants`;
  const usersCollectionPath = `artifacts/${appId}/users`;
  return {
    reviewsCollectionPath,
    restaurantsCollectionPath,
    usersCollectionPath,
  };
};

/**
 * 🚨 最終修正: 調整輔助函數以支援所有 Storage URL 格式 (gs://, GCS 公開 URL, Firebase 下載 URL)
 * @param {string} url - 完整的 Firebase Storage URL。
 * @returns {string | null} 檔案的相對路徑。
 */
const getFilePathFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;

  try {
    // 情況 1: 處理 gs:// 格式 (gs://bucket/path/to/file)
    if (url.startsWith("gs://")) {
      const parts = url.substring(5).split("/");
      parts.shift(); // 移除第一個元素 (bucket 名稱)
      return parts.join("/");
    }

    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // 取得 Bucket 名稱，用於精準替換
    const bucketName = bucket.name; // 從 firebase-admin 的 bucket 物件中獲取 Bucket 名稱

    // 情況 2: 處理 GCS 公開 URL 格式 (https://storage.googleapis.com/bucket/path/to/file)
    if (urlObj.hostname.includes("storage.googleapis.com")) {
      // 🚨 最精確的修正：移除 /<bucket-name>/，剩下的就是檔案路徑
      const bucketPrefix = `/${bucketName}/`;

      if (path.startsWith(bucketPrefix)) {
        // 只保留 bucketPrefix 之後的部分
        const filePath = path.substring(bucketPrefix.length);
        return decodeURIComponent(filePath);
      }

      // 如果路徑不以 bucket-name 開頭，則可能是某種邊緣情況，讓它進入預設邏輯
      return null;
    }

    // 情況 3: 處理標準 Firebase 下載 URL 格式 (https://firebasestorage.googleapis.com/v0/b/bucket/o/path?token=...)
    if (urlObj.hostname.includes("firebasestorage.googleapis.com")) {
      // 路徑部分通常在 '/o/' 之後
      const pathSegment = path.split("/o/")[1];
      if (!pathSegment) return null;

      // 移除查詢參數並解碼（例如將 %2F 轉回 /）
      const encodedPath = pathSegment.split("?")[0];
      return decodeURIComponent(encodedPath);
    }

    // 如果是未知格式
    return null;
  } catch (e) {
    return null;
  }
};

// --- GET (查詢、分頁、搜尋) ---
// ... (GET 函數保持不變)
export async function GET(request) {
  let totalFirestoreReads = 0;
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const anchorId = searchParams.get("anchorId");
    const searchQuery = searchParams.get("search");

    const { reviewsCollectionPath, restaurantsCollectionPath } =
      getAppCollectionPaths();

    let query = db.collection(reviewsCollectionPath);

    // 1. 處理排序和搜尋
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      query = query
        .where("reviewTitle", ">=", searchLower)
        .where("reviewTitle", "<=", searchLower + "\uf8ff")
        .orderBy("reviewTitle")
        .limit(limit);
    } else {
      query = query.orderBy("createdAt", "desc").limit(limit + 1);

      if (anchorId) {
        const anchorDoc = await db
          .collection(reviewsCollectionPath)
          .doc(anchorId)
          .get();
        totalFirestoreReads += 1;

        if (anchorDoc.exists) {
          query = query.startAfter(anchorDoc);
        } else {
          console.warn(`Anchor document with ID ${anchorId} not found.`);
        }
      }
    }

    const snapshot = await query.get();
    totalFirestoreReads += snapshot.size;

    console.log(
      `[API-GET] 食評查詢 (limit=${limit}, anchor=${
        anchorId ? "Yes" : "No"
      }, search=${searchQuery ? "Yes" : "No"}) 讀取量: ${snapshot.size} 份文檔`
    );

    let reviewsData = [];

    if (!searchQuery && snapshot.size > limit) {
      reviewsData = snapshot.docs.slice(0, limit).map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } else {
      reviewsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    const hasMore = !searchQuery && snapshot.size > limit;

    // 2. 聯結餐廳名稱
    const restaurantIds = [...new Set(reviewsData.map((r) => r.restaurantId))];
    const restaurantNamesMap = {};
    let restaurantReads = 0;

    let restaurantChunks = [];

    if (restaurantIds.length > 0) {
      for (let i = 0; i < restaurantIds.length; i += 10) {
        restaurantChunks.push(restaurantIds.slice(i, i + 10));
      }

      await Promise.all(
        restaurantChunks.map(async (chunk) => {
          const restaurantSnapshot = await db
            .collection(restaurantsCollectionPath)
            .where(FieldPath.documentId(), "in", chunk)
            .select("restaurantName")
            .get();

          restaurantReads += restaurantSnapshot.size;

          restaurantSnapshot.forEach((doc) => {
            const data = doc.data();
            restaurantNamesMap[doc.id] =
              data?.restaurantName?.["zh-TW"] ||
              data?.restaurantName?.["en"] ||
              doc.id;
          });
        })
      );
    }

    totalFirestoreReads += restaurantReads;
    console.log(
      `[API-GET] 聯結餐廳名稱讀取量: ${restaurantReads} 份文檔 (${restaurantChunks.length} 個 'in' 查詢)`
    );
    console.log(
      `[API-GET] 總 Firestore GET 讀取量: ${totalFirestoreReads} 份文檔`
    );

    // 3. 組合數據
    const finalReviews = reviewsData.map((review) => ({
      ...review,
      restaurantName:
        restaurantNamesMap[review.restaurantId] || review.restaurantId,
    }));

    return NextResponse.json(
      { reviews: finalReviews, hasMore },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// --- DELETE (刪除食評) ---

export async function DELETE(request) {
  let totalFirestoreReads = 0;
  let totalFirestoreWrites = 0;
  let rawImageUrlsToDelete = [];

  let reviewId;

  try {
    let body;
    try {
      // 確保 request.json() 的解析更健壯
      body = await request.json();
    } catch (e) {
      console.error("Error parsing request body as JSON:", e);
      // 如果請求主體無效，則返回 400 Bad Request
      return NextResponse.json(
        { success: false, message: "Invalid JSON body provided." },
        { status: 400 }
      );
    }

    reviewId = body?.reviewId;

    if (!reviewId) {
      return NextResponse.json(
        { success: false, message: "Missing required field: reviewId." },
        { status: 400 }
      );
    }

    const {
      reviewsCollectionPath,
      restaurantsCollectionPath,
      usersCollectionPath,
    } = getAppCollectionPaths();

    // 執行 Firestore 交易以確保資料一致性
    await db.runTransaction(async (transaction) => {
      const reviewRef = db.collection(reviewsCollectionPath).doc(reviewId);

      // 1. 讀取食評文檔 (1 Read)
      const reviewDoc = await transaction.get(reviewRef);
      totalFirestoreReads += 1;

      if (!reviewDoc.exists) {
        throw new Error("Review not found.");
      }

      const reviewData = reviewDoc.data();
      const { restaurantId, userId, overallRating, uploadedImageUrls } =
        reviewData;

      // 將原始圖片數據（物件陣列）存儲到外部變數
      rawImageUrlsToDelete = uploadedImageUrls || [];

      // 重新指定正確的文檔引用
      const correctRestaurantRef = db
        .collection(restaurantsCollectionPath)
        .doc(restaurantId);
      const correctUserRef = db.collection(usersCollectionPath).doc(userId);

      const [restaurantDoc, userDoc] = await Promise.all([
        transaction.get(correctRestaurantRef), // 讀取餐廳文檔 (1 Read)
        transaction.get(correctUserRef), // 讀取用戶文檔 (1 Read)
      ]);

      totalFirestoreReads += 2;

      // 2. 更新餐廳統計數據 (1 Write)
      if (restaurantDoc.exists) {
        const restaurantData = restaurantDoc.data();
        const currentReviewCount = restaurantData.reviewCount || 0;
        const currentRatingSum = restaurantData.totalRatingSum || 0;

        const newReviewCount = Math.max(0, currentReviewCount - 1);
        const newRatingSum = Math.max(0, currentRatingSum - overallRating);

        let newAverageRating =
          newReviewCount > 0 ? newRatingSum / newReviewCount : 0;

        // 四捨五入到小數點後兩位
        newAverageRating = Math.round(newAverageRating * 100) / 100;

        transaction.update(correctRestaurantRef, {
          reviewCount: newReviewCount,
          totalRatingSum: newRatingSum,
          averageRating: newAverageRating,
        });
        totalFirestoreWrites += 1;
      }

      // 3. 更新用戶 publishedReviews 陣列 (1 Write)
      if (userDoc.exists) {
        transaction.update(correctUserRef, {
          publishedReviews: FieldValue.arrayRemove(reviewId),
        });
        totalFirestoreWrites += 1;
      }

      // 4. 刪除食評文檔 (1 Delete)
      transaction.delete(reviewRef);
      totalFirestoreWrites += 1;
    });

    // 執行 Storage 刪除 (在 Firestore 交易完成之後)
    if (rawImageUrlsToDelete.length > 0) {
      // 提取實際的 URL 字串陣列
      const finalUrlsToDelete = rawImageUrlsToDelete
        .map((item) => {
          // 提取 item.url 字段，否則檢查是否為字串
          if (
            item &&
            typeof item === "object" &&
            typeof item.url === "string"
          ) {
            return item.url;
          }
          if (typeof item === "string") {
            return item;
          }
          return null;
        })
        .filter((url) => url !== null); // 移除所有 null 值

      console.log(
        `[API-DELETE] 準備刪除 ${finalUrlsToDelete.length} 個 Storage 檔案...`
      );

      // 迭代並刪除每個檔案
      await Promise.all(
        finalUrlsToDelete.map(async (fileUrl) => {
          const filePath = getFilePathFromUrl(fileUrl);

          if (!filePath) {
            console.warn(`[Storage WARN] 無法解析 URL 並取得路徑: ${fileUrl}`);
            return; // 跳過此 URL
          }

          try {
            // 使用導入的 'bucket' 變數，並使用 file(path).delete()
            await bucket.file(filePath).delete();
            console.log(`[Storage] 成功刪除檔案路徑: ${filePath}`);
          } catch (storageError) {
            // 忽略檔案不存在的錯誤 (Google Cloud Storage 錯誤代碼 404)
            if (storageError.code !== 404) {
              console.error(
                `[Storage ERROR] 刪除檔案 ${filePath} 失敗:`,
                storageError
              );
            } else {
              console.warn(
                `[Storage WARN] 檔案 ${filePath} 不存在，跳過刪除。`
              );
            }
          }
        })
      );
    }

    // 🎯 新增 Console Log 打印讀取量 (刪除操作)
    console.log(`[API-DELETE] 成功刪除食評 ID: ${reviewId}`);
    console.log(
      `[API-DELETE] 總 Firestore 讀取量 (Transaction): ${totalFirestoreReads} 份文檔`
    );
    console.log(
      `[API-DELETE] 總 Firestore 寫入/刪除操作量 (Transaction): ${totalFirestoreWrites} 次操作`
    );

    return NextResponse.json(
      { success: true, message: "Review deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "An internal error occurred during deletion.",
      },
      { status: 500 }
    );
  }
}
