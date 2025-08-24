// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics"; // 導入 Analytics

// 初始化 Firebase App，並確保只初始化一次
export const initializeFirebaseApp = (config) => {
  if (!getApps().length) {
    console.log("Firebase.js: Initializing new Firebase App instance.");
    return initializeApp(config);
  } else {
    console.log("Firebase.js: Reusing existing Firebase App instance.");
    return getApp();
  }
};

// 獲取 Firestore 實例
export const getFirebaseDb = (app) => {
  console.log("Firebase.js: Getting Firestore instance.");
  return getFirestore(app);
};

// 獲取 Auth 實例
export const getFirebaseAuth = (app) => {
  console.log("Firebase.js: Getting Auth instance.");
  return getAuth(app);
};

// 獲取 Analytics 實例
export const getFirebaseAnalytics = (app) => {
  if (app && typeof window !== "undefined" && "measurementId" in app.options) {
    console.log("Firebase.js: Getting Analytics instance.");
    return getAnalytics(app);
  } else {
    console.log(
      "Firebase.js: Analytics not available or measurementId not found."
    );
    return null; // 在伺服器端或沒有 measurementId 時返回 null
  }
};
