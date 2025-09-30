// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics"; // 導入 Analytics
import { getStorage } from "firebase/storage"; // <-- 新增：導入 getStorage

// 初始化 Firebase App，並確保只初始化一次
export const initializeFirebaseApp = (config) => {
  if (!getApps().length) {
    
    return initializeApp(config);
  } else {
    
    return getApp();
  }
};

// 獲取 Firestore 實例
export const getFirebaseDb = (app) => {
  
  return getFirestore(app);
};

// 獲取 Auth 實例
export const getFirebaseAuth = (app) => {
  
  return getAuth(app);
};

// 獲取 Analytics 實例
export const getFirebaseAnalytics = (app) => {
  if (app && typeof window !== "undefined" && "measurementId" in app.options) {
    
    return getAnalytics(app);
  } else {
    console.log(
      "Firebase.js: Analytics not available or measurementId not found."
    );
    return null; // 在伺服器端或沒有 measurementId 時返回 null
  }
};

// <-- 新增：獲取 Storage 實例
export const getFirebaseStorage = (app) => {
  return getStorage(app);
};
