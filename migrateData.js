// migrateData.js

// ❗ 載入 .env.local 檔案中的環境變數 ❗
require("dotenv").config({ path: "./.env.local" });

const admin = require("firebase-admin");
const path = require("path");

// ====================================================
// A. Firebase 設定區塊 (使用環境變數初始化)
// ====================================================

// 檢查必要的環境變數
if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY) {
  console.error(
    "❌ 錯誤: 環境變數 FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY 遺失。請確認 .env.local 文件是否存在且包含此變數。"
  );
  process.exit(1);
}
if (!process.env.FIREBASE_STORAGE_BUCKET) {
  console.error("❌ 錯誤: 環境變數 FIREBASE_STORAGE_BUCKET 遺失。");
  process.exit(1);
}

// Firestore 目標集合路徑 (與您的 importData.js 保持一致)
const TARGET_COLLECTION = "artifacts/default-app-id/public/data/restaurants";

// 初始化 Firebase Admin SDK
try {
  const serviceAccountJson = JSON.parse(
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
} catch (error) {
  console.error(
    "==============================================================="
  );
  console.error(
    "❌ Firebase 初始化失敗！請檢查服務帳號 JSON 字串格式是否正確。"
  );
  console.error(
    "==============================================================="
  );
  console.error("詳細錯誤:", error.message);
  process.exit(1);
}

const db = admin.firestore();

// ====================================================
// B. 數據遷移主函式
// ====================================================

async function migrateRestaurantData() {
  console.log(`🚀 開始從集合 ${TARGET_COLLECTION} 讀取數據並執行遷移...`);

  let migratedCount = 0;
  let batch = db.batch();
  let batchCount = 0;

  try {
    // 獲取整個集合的所有文檔
    const snapshot = await db.collection(TARGET_COLLECTION).get();

    if (snapshot.empty) {
      console.log("⚠️ 集合中沒有任何文檔，遷移結束。");
      return;
    }

    console.log(`✅ 找到 ${snapshot.size} 筆文檔，開始轉換...`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      const docRef = doc.ref;
      let updateData = {};
      let needsUpdate = false;

      // --- 1. 轉換 restaurantType: String -> Array ---
      // 預期：原為 string (e.g., "一般餐廳")，目標：array (e.g., ["一般餐廳"])
      if (
        typeof data.restaurantType === "string" &&
        data.restaurantType.trim() !== ""
      ) {
        updateData.restaurantType = [data.restaurantType.trim()];
        needsUpdate = true;
      }
      // 如果已經是陣列，則保持不變 (防止重複執行)
      else if (
        data.restaurantType === null ||
        (Array.isArray(data.restaurantType) && data.restaurantType.length === 0)
      ) {
        // 如果是空值或空陣列，則確保是空陣列
        updateData.restaurantType = [];
        needsUpdate = true;
      }
      // 注意: 如果已經是 array 且有值，我們不做任何操作

      // --- 2. 轉換 subCategory: Array -> String ---
      // 預期：原為 array (e.g., ["粵菜 (廣東菜)"])，目標：string (e.g., "粵菜 (廣東菜)")

      let subCategoryKey = "subCategory";
      let subCategoryValue = data[subCategoryKey];

      // 檢查 subCategory 是否是陣列，且有至少一個元素
      if (Array.isArray(subCategoryValue) && subCategoryValue.length > 0) {
        // 取出第一個元素作為新的字符串值
        updateData[subCategoryKey] = String(subCategoryValue[0]).trim();
        needsUpdate = true;
      }
      // 檢查 subCategory 是否是陣列，但為空
      else if (
        Array.isArray(subCategoryValue) &&
        subCategoryValue.length === 0
      ) {
        // 轉換為空字符串
        updateData[subCategoryKey] = "";
        needsUpdate = true;
      }
      // 檢查 subCategory 是否為字符串 (如果已經轉換過或本來就是字符串)
      else if (typeof subCategoryValue === "string") {
        // 保持原樣，或者如果需要確保它被 trim
        updateData[subCategoryKey] = subCategoryValue.trim();
        // 如果 data[subCategoryKey] 已經是 string，我們假設它不需要更新，除非 trim 改變了它。
      }
      // 處理其他不存在或空值的情況
      else if (subCategoryValue === undefined || subCategoryValue === null) {
        updateData[subCategoryKey] = "";
        needsUpdate = true;
      }

      if (needsUpdate) {
        batch.update(docRef, updateData);
        batchCount++;
        migratedCount++;
      }

      // 每 499 個文檔提交一次批次寫入
      if (batchCount >= 499) {
        console.log(`... 提交 ${batchCount} 筆更新批次...`);
        // 🚨 這裡會用到 await
        batch.commit();
        batch = db.batch(); // 開始新的批次
        batchCount = 0;
      }
    });

    // 提交最後的批次
    if (batchCount > 0) {
      console.log(`... 提交最後 ${batchCount} 筆更新批次...`);
      // 🚨 這裡會用到 await
      await batch.commit();
    }

    console.log(`\n🎉 數據遷移完成！總共更新了 ${migratedCount} 筆文檔。`);
  } catch (e) {
    console.error("\n❌ 數據遷移過程中發生嚴重錯誤:", e);
  }
}

// ====================================================
// C. 執行主函式 (IIFE 解決 await 錯誤)
// ====================================================

(async () => {
  try {
    await migrateRestaurantData();
    // 成功後，安全退出
    process.exit(0);
  } catch (e) {
    console.error("❌ 主程序執行失敗 (IIFE Catch):", e);
    // 失敗後，返回錯誤碼退出
    process.exit(1);
  }
})();
