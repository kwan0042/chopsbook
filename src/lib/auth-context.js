// src/lib/auth-context.js
"use client";

import React, { useState, useEffect, createContext } from "react";
// 請務必確認 './firebase' 的路徑和檔名 (firebase.js) 完全正確
import {
  initializeFirebaseApp,
  getFirebaseDb,
  getFirebaseAuth,
  getFirebaseAnalytics,
} from "./firebase";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithCustomToken,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
// 請務必確認 '../components/Modal' 的路徑和檔名 (Modal.js) 完全正確
import Modal from "../components/Modal"; // 確保 Modal 組件的路徑正確

const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

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

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true); // 將 loading 改為 loadingUser
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
      console.log("Firebase initialized successfully.");
    } catch (error) {
      console.error("Firebase 初始化失敗:", error);
      setModalMessage(`Firebase 初始化失敗: ${error.message}`);
      setLoadingUser(false); // 在初始化失敗時也要停止載入
      return;
    }

    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      console.log(
        "onAuthStateChanged triggered. User:",
        user ? user.email || user.uid : "None"
      );
      let userWithRole = null;
      if (user) {
        try {
          const userDocRef = doc(
            dbInstance,
            `artifacts/${appId}/users/${user.uid}/profile`,
            "main"
          );
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            userWithRole = { ...user, ...userData };
            console.log(
              "Existing user profile fetched from private path:",
              userWithRole
            );
          } else {
            const newUserProfile = {
              email: user.email,
              createdAt: new Date().toISOString(),
              isAdmin: user.email === "kwan6d16@gmail.com", // 根據電子郵件判斷是否為管理員
            };
            await setDoc(userDocRef, newUserProfile);
            userWithRole = { ...user, ...newUserProfile };
            console.log(
              "New user profile created in private path:",
              userWithRole
            );
          }
        } catch (dbError) {
          console.error("從 Firestore 獲取或創建用戶資料失敗:", dbError);
          setModalMessage(`用戶資料處理失敗: ${dbError.message}`);
          userWithRole = user;
        }
      } else {
        userWithRole = null;
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
            console.log("Signed in with custom token.");
          }
        } catch (tokenError) {
          console.error("Firebase Custom Token 認證失敗:", tokenError);
          setModalMessage(`自動認證失敗: ${tokenError.message}`);
        }
      }
      setCurrentUser(userWithRole);
      setLoadingUser(false); // 停止載入
      console.log("Current user set to:", userWithRole);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      console.log("Attempting login for:", email);
      await signInWithEmailAndPassword(authInstance, email, password);
      console.log("Login successful, auth state change will update user.");
      setModalMessage("登入成功！");
    } catch (error) {
      console.error("登入失敗:", error);
      setModalMessage(`登入失敗: ${error.message}`);
      throw error;
    }
  };

  const signup = async (email, password) => {
    try {
      console.log("Attempting signup for:", email);
      await createUserWithEmailAndPassword(authInstance, email, password);
      console.log("Signup successful, auth state change will update user.");
      setModalMessage("註冊成功！");
    } catch (error) {
      console.error("註冊失敗:", error);
      setModalMessage(`註冊失敗: ${error.message}`);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out user:", currentUser?.uid);
      await signOut(authInstance);
      console.log("Sign out successful.");
      setModalMessage("登出成功！");
    } catch (error) {
      console.error("登出失敗:", error);
      setModalMessage(`登出失敗: ${error.message}`);
    }
  };

  const closeModal = () => setModalMessage("");

  // 判斷是否為管理員
  const isAdmin = currentUser && currentUser.isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loadingUser,
        db: dbInstance,
        auth: authInstance,
        analytics: analyticsInstance,
        appId,
        setModalMessage,
        login,
        signup,
        logout,
        isAdmin,
      }}
    >
      {children}
      {modalMessage && (
        <Modal
          message={modalMessage}
          onClose={closeModal}
          isOpen={!!modalMessage}
        />
      )}
    </AuthContext.Provider>
  );
};
