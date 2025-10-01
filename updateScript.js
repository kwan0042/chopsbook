// updateScript.js

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
try {
  // 解析環境變數中的 JSON 字串
  const serviceAccountJson = JSON.parse(
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
// 根據您提供的 importData.js，App ID 應為 'default-app-id'
const COLLECTION_PATH = "artifacts/default-app-id/public/data/restaurants";
// ***************************************************************

async function addLowercaseField() {
  try {
    console.log(`正在讀取集合: ${COLLECTION_PATH}`);
    const restaurantsRef = db.collection(COLLECTION_PATH);
    const snapshot = await restaurantsRef.get();

    if (snapshot.empty) {
      console.log("找不到任何文件，腳本結束。");
      return;
    }

    console.log(`找到 ${snapshot.size} 個餐廳文件，準備開始更新...`);

    // Firestore 的批次寫入上限為 500 次操作
    let batch = db.batch();
    let writeCounter = 0;
    let totalUpdated = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // 檢查文件是否符合結構：確保有 restaurantName.en 欄位且為非空字串
      if (
        data.restaurantName &&
        typeof data.restaurantName.en === "string" &&
        data.restaurantName.en.length > 0
      ) {
        const enName = data.restaurantName.en;
        const lowercaseEnName = enName.toLowerCase();

        // 準備更新操作
        batch.update(doc.ref, { name_lowercase_en: lowercaseEnName });
        writeCounter++;
        totalUpdated++;

        // console.log(`  - [準備更新] ${doc.id}: ${enName} -> ${lowercaseEnName}`);
      } else {
        // console.log(`  - [跳過] ${doc.id}: 找不到 restaurantName.en 欄位或格式不符。`);
      }

      // 當批次操作達到上限時，提交批次並建立一個新的
      if (writeCounter >= 490) {
        console.log(
          `\n正在提交 ${writeCounter} 個更新操作... (累計已處理 ${totalUpdated} 筆)\n`
        );
        await batch.commit();
        // 重設批次和計數器
        batch = db.batch();
        writeCounter = 0;
      }
    }

    // 提交剩餘的更新操作（如果有的話）
    if (writeCounter > 0) {
      console.log(`\n正在提交最後 ${writeCounter} 個更新操作...\n`);
      await batch.commit();
    }

    console.log("=============================================");
    console.log(`腳本執行完畢！成功更新了 ${totalUpdated} 個文件。`);
    console.log("=============================================");
  } catch (error) {
    console.error("執行過程中發生錯誤:", error);
  }
}

// 執行主函式
addLowercaseField();
