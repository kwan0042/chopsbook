// cleanupRestaurantType.js

// ❗ 載入 .env.local 檔案中的環境變數 ❗
// 這樣腳本才能讀取到 FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
require("dotenv").config({ path: "./.env.local" });

const admin = require("firebase-admin");

// 檢查必要的環境變數
if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY) {
  console.error(
    "❌ 錯誤: 環境變數 FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY 遺失。請確認 .env.local 文件是否存在且包含此變數。"
  );
  process.exit(1);
}

// 根據環境變數初始化 Firebase Admin
let serviceAccountJson;
try {
  // 解析環境變數中的 JSON 字串
  serviceAccountJson = JSON.parse(
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson),
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

// 獲取 Firestore 資料庫實例
const db = admin.firestore();

// ***************************************************************
// *** 請務必修改這裡，換成您餐廳集合的正確路徑 ***
const APP_ID =  "default-app-id";
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/restaurants`;
// ***************************************************************

/**
 * 執行資料清理：
 * 移除 restaurantType 陣列中的 "一般餐廳" 選項。
 */
async function cleanupCuisineData() {
  try {
    console.log(`\n--- 🧹 餐廳類別 (restaurantType) 清理腳本啟動 ---`);
    console.log(`正在讀取集合: ${COLLECTION_PATH}`);
    const restaurantsRef = db.collection(COLLECTION_PATH);
    const snapshot = await restaurantsRef.get();

    if (snapshot.empty) {
      console.log("找不到任何文件，腳本結束。");
      return;
    }

    console.log(`找到 ${snapshot.size} 個餐廳文件，準備開始更新...`);

    let batch = db.batch();
    let writeCounter = 0;
    let totalUpdated = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      let shouldUpdate = false;
      const updateData = {};

      // 核心邏輯：處理 restaurantType 陣列，移除 "一般餐廳"
      if (Array.isArray(data.restaurantType)) {
          const initialLength = data.restaurantType.length;
          // 過濾掉 "一般餐廳"，保留其他選項
          const newRestaurantType = data.restaurantType.filter(
              (type) => type !== "一般餐廳"
          );

          // 只有在新陣列長度小於原長度時，才需要更新
          if (newRestaurantType.length < initialLength) {
              updateData.restaurantType = newRestaurantType;
              shouldUpdate = true;
          }
      }

      // 執行批次操作
      if (shouldUpdate) {
        // 使用 update 而不是 set，以確保只修改現有文件中的指定欄位
        batch.update(doc.ref, updateData);
        writeCounter++;
        totalUpdated++;
      }

      // 當批次操作達到上限時，提交批次並建立一個新的
      if (writeCounter >= 490) {
        console.log(
          `\n正在提交 ${writeCounter} 個更新操作... (累計已處理 ${totalUpdated} 筆)`
        );
        await batch.commit();
        // 重設批次和計數器
        batch = db.batch();
        writeCounter = 0;
      }
    }

    // 提交剩餘的更新操作（如果有的話）
    if (writeCounter > 0) {
      console.log(`\n正在提交最後 ${writeCounter} 個更新操作...`);
      await batch.commit();
    }

    console.log("\n=============================================");
    console.log(`🎉 腳本執行完畢！成功清理了 ${totalUpdated} 個文件的 restaurantType 欄位。`);
    console.log("=============================================");
  } catch (error) {
    console.error("執行過程中發生錯誤:", error);
  }
}

// 執行主函式
cleanupCuisineData();