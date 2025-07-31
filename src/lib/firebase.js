// src/lib/firebase.js
// 這個檔案負責初始化 Firebase 應用程式及其服務。

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics"; // 導入 Firebase Analytics

/**
 * initializeFirebaseApp 函數：
 * 檢查 Firebase 應用程式是否已經初始化。
 * 如果沒有，則使用提供的配置進行初始化。
 * 這確保了 Firebase 應用程式在整個應用程式生命週期中只被初始化一次。
 * @param {object} config - 你的 Firebase 配置物件。
 * @returns {object} Firebase 應用程式實例。
 */
export function initializeFirebaseApp(config) {
  // 檢查是否有任何 Firebase 應用程式實例已經存在。
  if (!getApps().length) {
    // 如果沒有，則使用提供的配置初始化一個新的應用程式。
    return initializeApp(config);
  }
  // 如果已經存在，則返回現有的應用程式實例。
  return getApp();
}

/**
 * getFirebaseDb 函數：
 * 從已初始化的 Firebase 應用程式實例中獲取 Firestore 資料庫實例。
 * @param {object} appInstance - Firebase 應用程式實例。
 * @returns {object} Firestore 資料庫實例。
 */
export function getFirebaseDb(appInstance) {
  return getFirestore(appInstance);
}

/**
 * getFirebaseAuth 函數：
 * 從已初始化的 Firebase 應用程式實例中獲取 Firebase Auth 實例。
 * @param {object} appInstance - Firebase 應用程式實例。
 * @returns {object} Firebase Auth 實例。
 */
export function getFirebaseAuth(appInstance) {
  return getAuth(appInstance);
}

/**
 * getFirebaseAnalytics 函數：
 * 從已初始化的 Firebase 應用程式實例中獲取 Firebase Analytics 實例。
 * @param {object} appInstance - Firebase 應用程式實例。
 * @returns {object} Firebase Analytics 實例。
 */
export function getFirebaseAnalytics(appInstance) {
  // getAnalytics 會返回現有的實例（如果已為該應用程式初始化），確保只初始化一次。
  return getAnalytics(appInstance);
}
