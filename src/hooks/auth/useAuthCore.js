// src/hooks/auth/useAuthCore.js
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  initializeFirebaseApp,
  getFirebaseDb,
  getFirebaseAuth,
  getFirebaseAnalytics,
} from "../../lib/firebase"; // 確保路徑正確
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signInAnonymously, // 確保導入 signInAnonymously
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * useAuthCore Hook:
 * 負責 Firebase 的初始化、用戶認證狀態監聽，以及用戶基本資料的處理。
 * @param {function} setGlobalModalMessage - 用於在全局範圍顯示模態框訊息的回調。
 * @returns {object} 包含 currentUser, loadingUser, db, auth, analytics, appId, setCurrentUser 的物件。
 */
export const useAuthCore = (setGlobalModalMessage) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [appId, setAppId] = useState(null);

  // 使用 useRef 避免在 useEffect 依賴中包含對象，導致不必要的重新運行
  const authInstanceRef = useRef(null);
  const dbInstanceRef = useRef(null);

  useEffect(() => {
    // 從全局變量獲取配置，或使用本地開發配置
    const projectAppId =
      typeof __app_id !== "undefined" ? __app_id : "default-app-id";
    setAppId(projectAppId);

    const currentFirebaseConfig =
      typeof __firebase_config !== "undefined"
        ? JSON.parse(__firebase_config)
        : {
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

    const initializeFirebase = async () => {
      try {
        console.log("useAuthCore: Starting Firebase initialization...");
        const app = initializeFirebaseApp(currentFirebaseConfig);
        const firestoreDb = getFirebaseDb(app);
        const firebaseAuth = getFirebaseAuth(app);
        const firebaseAnalytics = getFirebaseAnalytics(app);

        dbInstanceRef.current = firestoreDb;
        authInstanceRef.current = firebaseAuth;

        setDb(firestoreDb);
        setAuth(firebaseAuth);
        setAnalytics(firebaseAnalytics);
        console.log("useAuthCore: Firebase initialized successfully.");

        if (!firebaseAuth) {
          throw new Error("Firebase 認證服務初始化失敗");
        }

        console.log("useAuthCore: Setting up onAuthStateChanged listener...");
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
          console.log(
            "useAuthCore: onAuthStateChanged triggered. User:",
            user ? user.email || user.uid : "None"
          );
          let userWithRole = null;
          if (user) {
            try {
              const userRootDocRef = doc(
                firestoreDb,
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

              const userProfileDocRef = doc(
                firestoreDb,
                `artifacts/${projectAppId}/users/${user.uid}/profile`,
                "main"
              );

              const userProfileDocSnap = await getDoc(userProfileDocRef);

              let isAdmin = false;

              if (userProfileDocSnap.exists()) {
                const userData = userProfileDocSnap.data();
                isAdmin = userData.isAdmin === true;

                // 確保 username, rank, publishedReviews, favoriteRestaurants 默認值
                if (userData.username === undefined && user.email) {
                  userData.username = user.email.split("@")[0];
                }
                if (userData.rank === undefined) {
                  userData.rank = "7";
                }
                if (!userData.publishedReviews) {
                  userData.publishedReviews = [];
                }
                if (!userData.favoriteRestaurants) {
                  userData.favoriteRestaurants = [];
                }
                await setDoc(
                  userProfileDocRef,
                  { ...userData, isAdmin: isAdmin },
                  { merge: true }
                );
                userWithRole = { ...user, ...userData, isAdmin: isAdmin };
                console.log(
                  "useAuthCore: Existing user profile fetched and possibly updated:",
                  userWithRole
                );
              } else {
                const newUserProfile = {
                  email: user.email,
                  createdAt: new Date().toISOString(),
                  isAdmin: isAdmin,
                  username: user.email ? user.email.split("@")[0] : "用戶",
                  rank: "7",
                  publishedReviews: [],
                  favoriteRestaurants: [],
                };
                await setDoc(userProfileDocRef, newUserProfile);
                userWithRole = { ...user, ...newUserProfile };
                console.log(
                  "useAuthCore: New user profile created:",
                  userWithRole
                );
              }
            } catch (dbError) {
              console.error(
                "useAuthCore: 從 Firestore 獲取或創建用戶資料失敗:",
                dbError
              );
              setGlobalModalMessage(`用戶資料處理失敗: ${dbError.message}`);
              userWithRole = user; // 即使資料庫操作失敗，也設置基礎用戶資訊
            }
          } else {
            userWithRole = null;
            try {
              // 如果沒有當前用戶，嘗試使用自定義 token 登入
              if (initialAuthToken) {
                await signInWithCustomToken(firebaseAuth, initialAuthToken);
                console.log("useAuthCore: Signed in with custom token.");
              } else {
                // 如果沒有自定義 token，則匿名登入
                await signInAnonymously(firebaseAuth);
                console.log("useAuthCore: Signed in anonymously.");
              }
            } catch (tokenError) {
              console.error(
                "useAuthCore: Firebase Custom Token / Anonymous 認證失敗:",
                tokenError
              );
              setGlobalModalMessage(`自動認證失敗: ${tokenError.message}`);
            }
          }
          console.log("useAuthCore: Setting currentUser to:", userWithRole);
          setCurrentUser(userWithRole);
          setLoadingUser(false);
          console.log("useAuthCore: Current user set to:", userWithRole);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("useAuthCore: Firebase initialization failed:", error);
        setGlobalModalMessage(`Firebase 初始化失敗: ${error.message}`);
        setLoadingUser(false);
      }
    };

    initializeFirebase();
  }, [setGlobalModalMessage]); // 僅在 setGlobalModalMessage 變化時重新運行

  // 返回所有 AuthContext 需要的值，包括 setCurrentUser
  return {
    currentUser,
    loadingUser,
    db,
    auth,
    analytics,
    appId,
    setCurrentUser,
  };
};
