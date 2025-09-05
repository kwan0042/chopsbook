// src/lib/firebase-admin.js

import admin from "firebase-admin";

// 確保你的環境變數被正確載入
if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY) {
  console.error("Error: FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY not found.");
  throw new Error("Firebase Admin SDK service account key is missing.");
}

const serviceAccount = JSON.parse(
  process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
);

// 只有在應用程式尚未初始化時才進行初始化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const db = admin.firestore();
const app = admin.app();

export { auth, db, app };
