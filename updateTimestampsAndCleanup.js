// updateTimestampsAndCleanup.js

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
const APP_ID = "default-app-id";
// 腳本會對此路徑下的所有文件執行更新
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/restaurants`;
// ***************************************************************

/**
 * 執行資料時間戳記更新和欄位移除：
 * 1. 確保文件有 'createdAt' (創建時間) 和 'updatedAt' (更新時間)。
 * - 如果只有 'createdAt' 或 'submittedAt' (舊欄位)，會將其值複製給 'updatedAt'。
 * - 如果有舊的 'submittedAt' 欄位，會將其值複製給 'updatedAt' 並移除 'submittedAt' 欄位。
 * 2. 移除 'type' 欄位。
 */
async function updateTimestampsAndCleanup() {
  try {
    console.log(
      `\n--- ⏱️ 時間戳記欄位轉換 (submittedAt -> updatedAt) 及清理腳本啟動 ---`
    );
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

    // 獲取當前伺服器時間戳，用於初始化新的時間戳欄位
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      let shouldUpdate = false;
      const updateData = {};

      const hasCreatedAt = data.createdAt !== undefined;
      const hasSubmittedAt = data.submittedAt !== undefined; // 舊欄位檢查
      const hasUpdatedAt = data.updatedAt !== undefined; // 新欄位檢查

      // 1. 處理時間戳記新增/同步/轉換

      // 確保 createdAt 存在 (優先使用現有的值)
      if (!hasCreatedAt) {
        // 如果連 createdAt 都沒有，我們設為伺服器時間戳
        updateData.createdAt = serverTimestamp;
        shouldUpdate = true;
      }

      // 確保 updatedAt 存在 (優先使用現有的 submittedAt/updatedAt 的值)
      if (!hasUpdatedAt) {
        if (hasSubmittedAt) {
          // 如果有 submittedAt，將其值作為 updatedAt 的初始值
          updateData.updatedAt = data.submittedAt;
          shouldUpdate = true;
        } else if (hasCreatedAt) {
          // 如果只有 createdAt，將 createdAt 的值作為 updatedAt 的初始值
          updateData.updatedAt = data.createdAt;
          shouldUpdate = true;
        } else {
          // 如果兩者都沒有 (前面已處理)，則設為伺服器時間戳
          updateData.updatedAt = serverTimestamp;
          shouldUpdate = true;
        }
      }
      // 否則，如果 updatedAt 已經存在，則保持原樣。

      // 2. 處理欄位移除：submittedAt (舊欄位)
      if (hasSubmittedAt) {
        // 標記 submittedAt 欄位為刪除
        updateData.submittedAt = admin.firestore.FieldValue.delete();
        shouldUpdate = true;
      }

      // 3. 處理欄位移除：type
      if (data.type !== undefined) {
        // 標記 type 欄位為刪除
        updateData.type = admin.firestore.FieldValue.delete();
        shouldUpdate = true;
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
    console.log(`🎉 腳本執行完畢！成功更新了 ${totalUpdated} 個文件。`);
    console.log("=============================================");
  } catch (error) {
    console.error("執行過程中發生錯誤:", error);
  }
}

// 執行主函式
updateTimestampsAndCleanup();
