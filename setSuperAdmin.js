// setSuperAdmin.js
require('dotenv').config({ path: '.env.local' });

const admin = require("firebase-admin");

// 確保你的 Node.js 環境已經載入 .env 檔案
// 如果在 Vercel 或其他服務上，這個變數應該已經自動載入
// 如果在本地運行，你需要確保 dotenv 被正確配置
if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY) {
  console.error(
    "Error: FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY not found in environment variables."
  );
  process.exit(1);
}

// 直接從環境變數中讀取金鑰內容，並解析成 JSON
const serviceAccountString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY;
const serviceAccount = JSON.parse(serviceAccountString);

// 初始化 Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 替換成你的 Firebase 用戶 UID
const mySuperAdminUid = "lfXDaMLUxsWyjkMgue66gMuOvFo2";

async function setSuperAdminClaim() {
  try {
    // 設定自訂聲明，同時包含 isAdmin 和 isSuperAdmin
    await admin
      .auth()
      .setCustomUserClaims(mySuperAdminUid, {
        isAdmin: true,
        isSuperAdmin: true,
      });
    console.log(
      `✅ Successfully set super admin claim for user: ${mySuperAdminUid}`
    );

    // 在 Firestore 中同步更新資料，這是一個好的實踐
    const db = admin.firestore();
    const userDocRef = db.doc(`artifacts/chopsbook/users/${mySuperAdminUid}`);
    await userDocRef.set(
      {
        isAdmin: true,
        isSuperAdmin: true,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(), // 使用伺服器時間戳
      },
      { merge: true }
    );
    console.log(
      `✅ Successfully updated Firestore document for user: ${mySuperAdminUid}`
    );
  } catch (error) {
    console.error("❌ Error setting super admin claim:", error);
    process.exit(1);
  }
}

setSuperAdminClaim();
