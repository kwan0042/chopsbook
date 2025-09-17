// src/lib/firebase-admin.js

import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// 確保你的環境變數被正確載入
if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY) {
  console.error("Error: FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY not found.");
  throw new Error("Firebase Admin SDK service account key is missing.");
}

let auth;
let db;
let app;
let bucket;

// ✅ 統一使用 v9 Modular API 的寫法
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
    );

    // 再次確認 storageBucket 的值是正確的
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
      throw new Error(
        "FIREBASE_STORAGE_BUCKET environment variable is not set."
      );
    }

    const adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: storageBucket, // 這裡從 .env 讀取正確的值
    });

    auth = getAuth(adminApp);
    db = getFirestore(adminApp);
    app = adminApp;
    bucket = getStorage(adminApp).bucket();
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw new Error("Failed to initialize Firebase Admin SDK.");
  }
} else {
  // 如果已經初始化過，直接獲取實例
  const adminApp = getApp();

  auth = getAuth(adminApp);
  db = getFirestore(adminApp);
  app = adminApp;
  bucket = getStorage(adminApp).bucket();
}

// ✅ 確保在這裡匯出了 FieldValue，這樣 route.js 才能使用它
export { auth, db, app, bucket, FieldValue };
