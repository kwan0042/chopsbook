// src/lib/firebase-admin.js

import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, FieldPath } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// 確保你的環境變數被正確載入
if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY) {
  throw new Error("Firebase Admin SDK service account key is missing.");
}
if (!process.env.FIREBASE_STORAGE_BUCKET) {
  throw new Error("FIREBASE_STORAGE_BUCKET environment variable is not set.");
}

// 統一使用 v9 Modular API 的寫法
// 如果應用程式已經初始化，則使用現有實例；否則，初始化新實例。
const adminApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert(
          JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY)
        ),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });

// 匯出各個服務的實例和 FieldValue
export const auth = getAuth(adminApp);
export const db = getFirestore(adminApp);
export const app = adminApp;
export const bucket = getStorage(adminApp).bucket();
export { FieldValue, FieldPath };
