// src/lib/auth-context.js
"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import {
  initializeFirebaseApp,
  getFirebaseDb,
  getFirebaseAuth,
  getFirebaseAnalytics,
} from "./firebase";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
} from "firebase/auth";
import Modal from "../components/Modal";

// Canvas 環境提供的全域變數，用於 Firebase 配置。
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// 這是你在本地開發/測試時使用的 Firebase 配置。
const localFirebaseConfig = {
  apiKey: "AIzaSyBtXmTdeY4bTn558wLhZ-9GkVejWxe_3lk",
  authDomain: "chopsbook.firebaseapp.com",
  projectId: "chopsbook",
  storageBucket: "chopsbook.firebasestorage.app",
  messagingSenderId: "357146304445",
  appId: "1:357146304445:web:b97659b3ad6e276e62fcd4",
  measurementId: "G-H4M0D99T60",
};

const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;

let appInstance;
let dbInstance;
let authInstance;
let analyticsInstance;

// AuthContext: 一個 React Context，用於在組件樹中共享認證狀態和 Firebase 實例。
export const AuthContext = createContext(null);

/**
 * AuthProvider：管理 Firebase 初始化和使用者認證狀態。
 * 它透過 AuthContext 向其子組件提供 currentUser、載入狀態和認證函數。
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const currentFirebaseConfig =
      typeof __firebase_config !== "undefined"
        ? JSON.parse(__firebase_config)
        : localFirebaseConfig;

    try {
      appInstance = initializeFirebaseApp(currentFirebaseConfig);
      dbInstance = getFirebaseDb(appInstance);
      authInstance = getFirebaseAuth(appInstance);
      analyticsInstance = getFirebaseAnalytics(appInstance);
    } catch (error) {
      console.error("Firebase 初始化失敗:", error);
      setModalMessage(`Firebase 初始化失敗: ${error.message}`);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
          } else {
            await signInAnonymously(authInstance);
          }
        } catch (error) {
          console.error("Firebase 認證失敗:", error);
          setModalMessage(`Firebase 認證失敗: ${error.message}`);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 這些函數將在 page.js 中定義，並作為 props 傳遞給 LoginPage
  // 因為 LoginPage 需要直接呼叫 Firebase Auth 方法。
  // 在這裡只提供 AuthContext 的值，實際的 login/signup/logout 函數
  // 會在 page.js 中定義並傳遞給 AuthProvider。
  const login = async (email, password) => {
    // 實際的登入邏輯將在 page.js 的 AuthProvider 外部處理
    // 這裡只是預留一個接口
  };

  const signup = async (email, password) => {
    // 實際的註冊邏輯將在 page.js 的 AuthProvider 外部處理
    // 這裡只是預留一個接口
  };

  const logout = async () => {
    // 實際的登出邏輯將在 page.js 的 AuthProvider 外部處理
    // 這裡只是預留一個接口
  };

  const closeModal = () => setModalMessage("");

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        db: dbInstance,
        auth: authInstance,
        appId,
        setModalMessage,
      }}
    >
      {children}
      {/* Modal 仍然由 AuthProvider 管理，因為它處理全域錯誤訊息 */}
      {modalMessage && <Modal message={modalMessage} onClose={closeModal} />}
    </AuthContext.Provider>
  );
};
