// src/lib/auth-context.js
"use client";

import React, { useState, useEffect, createContext } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  // signInAnonymously, // 移除了匿名登入
  signInWithCustomToken,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// 請確保這個引入路徑和檔案名正確無誤：
// 相對於 src/lib/auth-context.js，需要回到 src/ 然後進入 components/Modal.js
import Modal from "../components/Modal";

// 確保 __app_id, __firebase_config, __initial_auth_token 可用
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

let parsedFirebaseConfig = {};
try {
  if (typeof __firebase_config !== "undefined" && __firebase_config) {
    parsedFirebaseConfig = JSON.parse(__firebase_config);
  } else {
    // 這裡提供一個本地開發的備用配置。在 Canvas 環境中，這不會被使用。
    console.warn("未提供 __firebase_config。正在使用本地備用配置。");
    parsedFirebaseConfig = {
      apiKey: "AIzaSyBtXmTdeY4bTn558wLhZ-9GkVejWxe_3lk", // 替換為你的本地 Firebase API Key
      authDomain: "chopsbook.firebaseapp.com", // 替換為你的本地 Firebase Auth Domain
      projectId: "chopsbook", // 替換為你的本地 Firebase Project ID
      storageBucket: "chopsbook.firebasestorage.app",
      messagingSenderId: "357146304445",
      appId: "1:357146304445:web:b97659b3ad6e276e62fcd4",
      // measurementId: "G-H4M0D99T60" // 如果使用 Analytics，請取消註釋
    };
  }
} catch (e) {
  console.error("解析 __firebase_config 錯誤:", e);
  console.warn("__firebase_config 可能格式錯誤。正在使用空配置作為備用。");
  parsedFirebaseConfig = {}; // 解析失敗時使用空配置
}
const firebaseConfig = parsedFirebaseConfig;

const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;

// Firebase 服務實例 (在 AuthProvider 內部初始化)
let appInstance;
let dbInstance;
let authInstance;

// 認證上下文 - 用於在組件樹中共享使用者認證狀態
export const AuthContext = createContext(null);

/**
 * AuthProvider: 負責 Firebase 初始化和使用者認證狀態。
 * 它透過 AuthContext 向其子組件提供 currentUser、載入狀態、認證功能及 Firebase 實例。
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    console.log("AuthProvider useEffect: 初始化 Firebase...");
    console.log("有效的 Firebase 配置:", firebaseConfig);

    // 初始化 Firebase 應用程式、Firestore 和 Auth 服務
    try {
      if (!appInstance) {
        // 避免重複初始化
        if (Object.keys(firebaseConfig).length === 0) {
          throw new Error("Firebase 配置為空。無法初始化應用程式。");
        }
        appInstance = initializeApp(firebaseConfig);
        console.log("Firebase 應用程式已初始化:", appInstance);

        dbInstance = getFirestore(appInstance);
        console.log("Firestore 已初始化:", dbInstance);

        authInstance = getAuth(appInstance);
        console.log("Auth 已初始化:", authInstance);

        if (!appInstance || !dbInstance || !authInstance) {
          throw new Error("一個或多個 Firebase 服務初始化失敗。");
        }
      }
    } catch (error) {
      console.error("Firebase 初始化失敗:", error);
      setModalMessage(`Firebase 初始化失敗: ${error.message}`);
      setLoading(false);
      return;
    }

    // 監聽 Firebase 認證狀態的變化
    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      console.log("onAuthStateChanged 回調。使用者:", user);
      if (user) {
        setCurrentUser(user);
      } else {
        // 如果沒有使用者登入 (user 為 null)，檢查是否有初始 token。
        // 如果都沒有，則不執行任何登入操作，只將 currentUser 設為 null。
        try {
          if (initialAuthToken) {
            console.log("嘗試使用自訂 token 登入...");
            await signInWithCustomToken(authInstance, initialAuthToken);
          } else {
            // 不執行匿名登入，直接將 currentUser 設為 null
            setCurrentUser(null);
            console.log("沒有使用者登入，且沒有初始 token，不執行自動登入。");
          }
        } catch (error) {
          console.error("Firebase 認證失敗:", error);
          setModalMessage(`Firebase 認證失敗: ${error.message}`);
        }
      }
      setLoading(false); // 認證狀態檢查完成後，停止載入
      console.log("AuthProvider 載入狀態設定為 false。");
    });

    return () => unsubscribe();
  }, []); // 空依賴陣列確保只在組件掛載時執行一次

  // 登入功能 (直接在這裡實現，並提供給 Context)
  const login = async (email, password) => {
    console.log("調用登入函數。當前 authInstance:", authInstance);
    if (!authInstance) {
      const errorMsg = "登入服務尚未初始化，請稍後再試。";
      setModalMessage(errorMsg);
      throw new Error(errorMsg);
    }
    try {
      await signInWithEmailAndPassword(authInstance, email, password);
    } catch (error) {
      setModalMessage(`登入失敗: ${error.message}`);
      throw error; // 重新拋出錯誤以便 AuthModal 處理
    }
  };

  // 註冊功能 (直接在這裡實現，並提供給 Context)
  const signup = async (email, password) => {
    console.log("調用註冊函數。當前 authInstance:", authInstance);
    if (!authInstance) {
      const errorMsg = "註冊服務尚未初始化，請稍後再試。";
      setModalMessage(errorMsg);
      throw new Error(errorMsg);
    }
    try {
      await createUserWithEmailAndPassword(authInstance, email, password);
    } catch (error) {
      setModalMessage(`註冊失敗: ${error.message}`);
      throw error; // 重新拋出錯誤以便 AuthModal 處理
    }
  };

  // 登出功能 (直接在這裡實現，並提供給 Context)
  const logout = async () => {
    console.log("調用登出函數。當前 authInstance:", authInstance);
    if (!authInstance) {
      const errorMsg = "登出服務尚未初始化，請稍後再試。";
      setModalMessage(errorMsg);
      throw new Error(errorMsg);
    }
    try {
      await signOut(authInstance);
    } catch (error) {
      console.error("登出失敗:", error);
      setModalMessage(`登出失敗: ${error.message}`);
    }
  };

  // 關閉 Modal
  const closeModal = () => setModalMessage("");

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        signup,
        logout,
        db: dbInstance,
        auth: authInstance,
        appId,
        setModalMessage,
      }}
    >
      {children}
      <Modal message={modalMessage} onClose={closeModal} />
    </AuthContext.Provider>
  );
};
