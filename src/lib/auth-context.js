// src/lib/auth-context.js
"use client";

import React, { useState, useEffect, createContext, useRef } from "react";
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
  sendEmailVerification,
  sendPasswordResetEmail, // 導入 sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
// 請務必確認 '../components/Modal' 的路徑和檔名 (Modal.js) 完全正確
import Modal from "../components/Modal"; // 確保 Modal 組件的路徑正確

const projectAppId =
  typeof __app_id !== "undefined" ? __app_id : "default-app-id";

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

// 已移除 adminUid 常數，管理員狀態現在直接從 Firestore 獲取

export const AuthContext = createContext(null);

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [modalMessage, setModalMessage] = useState("");

  const appInstanceRef = useRef(null);
  const dbInstanceRef = useRef(null);
  const authInstanceRef = useRef(null);
  const analyticsInstanceRef = useRef(null);

  useEffect(() => {
    const currentFirebaseConfig =
      typeof __firebase_config !== "undefined"
        ? JSON.parse(__firebase_config)
        : localFirebaseConfig;

    try {
      console.log("AuthContext: Starting Firebase initialization...");
      appInstanceRef.current = initializeFirebaseApp(currentFirebaseConfig);
      console.log("AuthContext: App instance created:", appInstanceRef.current);

      dbInstanceRef.current = getFirebaseDb(appInstanceRef.current);
      console.log("AuthContext: DB instance created:", dbInstanceRef.current);

      authInstanceRef.current = getFirebaseAuth(appInstanceRef.current);
      console.log(
        "AuthContext: Auth instance created:",
        authInstanceRef.current
      );

      analyticsInstanceRef.current = getFirebaseAnalytics(
        appInstanceRef.current
      );
      console.log(
        "AuthContext: Analytics instance created:",
        analyticsInstanceRef.current
      );

      console.log("Firebase initialized successfully.");

      // 確保 authInstance 已經初始化後再設置 onAuthStateChanged
      if (authInstanceRef.current) {
        console.log("AuthContext: Setting up onAuthStateChanged listener...");
        const unsubscribe = onAuthStateChanged(
          authInstanceRef.current,
          async (user) => {
            console.log(
              "AuthContext: onAuthStateChanged triggered. User:",
              user ? user.email || user.uid : "None"
            );
            let userWithRole = null;
            if (user) {
              try {
                // 首先在用戶根級創建文檔，如果不存在
                const userRootDocRef = doc(
                  dbInstanceRef.current,
                  `artifacts/${projectAppId}/users/${user.uid}`
                );
                const userRootDocSnap = await getDoc(userRootDocRef);

                if (!userRootDocSnap.exists()) {
                  await setDoc(
                    userRootDocRef,
                    { uid: user.uid, lastLogin: new Date().toISOString() },
                    { merge: true }
                  );
                }

                // 然後獲取或創建 profile/main 文檔
                const userProfileDocRef = doc(
                  dbInstanceRef.current,
                  `artifacts/${projectAppId}/users/${user.uid}/profile`,
                  "main"
                );

                const userProfileDocSnap = await getDoc(userProfileDocRef);

                let isAdmin = false; // 預設不是管理員

                if (userProfileDocSnap.exists()) {
                  const userData = userProfileDocSnap.data();
                  // 從 Firestore 讀取 isAdmin 字段，如果不存在則為 false
                  isAdmin = userData.isAdmin === true;

                  // 如果用戶資料中沒有 username 字段，則設置默認值
                  if (userData.username === undefined && user.email) {
                    userData.username = user.email.split("@")[0];
                  }
                  // 如果用戶資料中沒有 rank 字段，則設置默認值
                  if (userData.rank === undefined) {
                    userData.rank = "銅"; // 默認等級
                  }
                  // 更新用戶資料，確保 isAdmin 存在
                  await setDoc(
                    userProfileDocRef,
                    { ...userData, isAdmin: isAdmin },
                    { merge: true }
                  );
                  userWithRole = { ...user, ...userData, isAdmin: isAdmin }; // 更新 currentUser 的 isAdmin 屬性
                  console.log(
                    "AuthContext: Existing user profile fetched and possibly updated from private path:",
                    userWithRole
                  );
                } else {
                  // 如果 profile/main 文檔不存在，則創建新文檔
                  const newUserProfile = {
                    email: user.email,
                    createdAt: new Date().toISOString(),
                    isAdmin: isAdmin, // 新用戶預設不是管理員
                    username: user.email ? user.email.split("@")[0] : "用戶", // 新用戶的默認用戶名稱
                    rank: "銅", // 新用戶的默認等級
                  };
                  await setDoc(userProfileDocRef, newUserProfile);
                  userWithRole = { ...user, ...newUserProfile };
                  console.log(
                    "AuthContext: New user profile created in private path:",
                    userWithRole
                  );
                }
              } catch (dbError) {
                console.error(
                  "AuthContext: 從 Firestore 獲取或創建用戶資料失敗:",
                  dbError
                );
                setModalMessage(`用戶資料處理失敗: ${dbError.message}`);
                userWithRole = user;
              }
            } else {
              userWithRole = null;
              try {
                if (initialAuthToken) {
                  await signInWithCustomToken(
                    authInstanceRef.current,
                    initialAuthToken
                  );
                  console.log("AuthContext: Signed in with custom token.");
                }
              } catch (tokenError) {
                console.error(
                  "AuthContext: Firebase Custom Token 認證失敗:",
                  tokenError
                );
                setModalMessage(`自動認證失敗: ${tokenError.message}`);
              }
            }
            console.log("AuthContext: Setting currentUser to:", userWithRole);
            setCurrentUser(userWithRole);
            setLoadingUser(false); // 停止載入
            console.log("AuthContext: Current user set to:", userWithRole);
          }
        );

        return () => unsubscribe();
      } else {
        console.error("AuthContext: authInstance failed to initialize");
        setModalMessage("Firebase 認證服務初始化失敗");
        setLoadingUser(false);
      }
    } catch (error) {
      console.error("Firebase 初始化失敗:", error);
      setModalMessage(`Firebase 初始化失敗: ${error.message}`);
      setLoadingUser(false); // 在初始化失敗時也要停止載入
      return;
    }
  }, []);

  const login = async (identifier, password) => {
    try {
      if (!authInstanceRef.current) {
        throw new Error("Firebase 認證服務未初始化");
      }

      if (isValidEmail(identifier)) {
        console.log("AuthContext: Attempting login for:", identifier);
        return await signInWithEmailAndPassword(
          authInstanceRef.current,
          identifier,
          password
        );
      } else {
        throw new Error("無效的登入識別符格式 (應為電子郵件)。");
      }
    } catch (error) {
      console.error("AuthContext: 登入失敗:", error);
      throw error;
    }
  };

  const signup = async (email, password) => {
    // 移除了 phoneNumber 和 username 參數
    try {
      if (!authInstanceRef.current) {
        throw new Error("Firebase 認證服務未初始化");
      }
      if (!isValidEmail(email)) {
        throw new Error("無效的電子郵件格式。");
      }

      console.log("Attempting signup for:", email);
      const userCredential = await createUserWithEmailAndPassword(
        authInstanceRef.current,
        email,
        password
      );

      await sendEmailVerification(userCredential.user);

      const userProfileDocRef = doc(
        dbInstanceRef.current,
        `artifacts/${projectAppId}/users/${userCredential.user.uid}/profile`,
        "main"
      );

      const defaultUsername = email.split("@")[0]; // 自動生成用戶名稱
      // 新註冊用戶預設isAdmin為false，不再根據adminUid判斷
      const isAdmin = false;

      const additionalProfileData = {
        email: email,
        createdAt: new Date().toISOString(),
        isAdmin: isAdmin, // 設置管理員狀態為 false
        username: defaultUsername, // 設置預設用戶名稱
        rank: "銅", // 設置預設等級
      };

      await setDoc(userProfileDocRef, additionalProfileData, { merge: true });

      setModalMessage("註冊成功！請檢查您的電子郵件以完成驗證，然後再次登入。");
      return userCredential;
    } catch (error) {
      console.error("註冊失敗:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (!authInstanceRef.current) {
        throw new Error("Firebase 認證服務未初始化");
      }

      console.log("Logging out user:", currentUser?.uid);
      await signOut(authInstanceRef.current);
      console.log("Sign out successful.");
      setModalMessage("登出成功！");
    } catch (error) {
      console.error("登出失敗:", error);
      const errorMessage = error.message || "登出失敗，請稍後再試";
      setModalMessage(`登出失敗: ${errorMessage}`);
    }
  };

  /**
   * 發送密碼重設電郵
   * @param {string} email - 用戶的電子郵件地址
   * @returns {Promise<void>}
   */
  const sendPasswordReset = async (email) => {
    try {
      if (!authInstanceRef.current) {
        throw new Error("Firebase 認證服務未初始化");
      }
      if (!isValidEmail(email)) {
        throw new Error("無效的電子郵件格式。");
      }
      await sendPasswordResetEmail(authInstanceRef.current, email);
    } catch (error) {
      throw error;
    }
  };

  const updateUserAdminStatus = async (userId, isAdmin) => {
    try {
      if (!dbInstanceRef.current) {
        throw new Error("Firebase 資料庫服務未初始化");
      }

      const userProfileDocRef = doc(
        dbInstanceRef.current,
        `artifacts/${projectAppId}/users/${userId}/profile`,
        "main"
      );

      await setDoc(userProfileDocRef, { isAdmin }, { merge: true });
      console.log(`User ${userId} admin status updated to: ${isAdmin}`);

      // 如果更新的是當前用戶，則重新獲取用戶資料
      if (currentUser && currentUser.uid === userId) {
        const userDocSnap = await getDoc(userProfileDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({ ...currentUser, ...userData });
        }
      }

      return true;
    } catch (error) {
      console.error("更新用戶管理員權限失敗:", error);
      throw error;
    }
  };

  const closeModal = () => setModalMessage("");

  const currentIsAdmin = currentUser && currentUser.isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loadingUser,
        db: dbInstanceRef.current,
        auth: authInstanceRef.current,
        analytics: analyticsInstanceRef.current,
        appId: projectAppId,
        setModalMessage,
        login,
        signup,
        logout,
        isAdmin: currentIsAdmin,
        updateUserAdminStatus,
        sendPasswordReset, // 將 sendPasswordReset 函數暴露給上下文
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
