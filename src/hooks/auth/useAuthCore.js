// src/hooks/auth/useAuthCore.js
"use client";

import { useState, useEffect, useRef } from "react";
import {
  initializeFirebaseApp,
  getFirebaseDb,
  getFirebaseAuth,
  getFirebaseAnalytics,
} from "../../lib/firebase"; // 相對路徑
import { onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

/**
 * useAuthCore Hook:
 * 處理 Firebase 應用程式初始化、認證狀態監聽和用戶資料載入。
 * @param {function} setModalMessage - 用於顯示模態框訊息的回調。
 * @returns {object} 包含 currentUser, loadingUser, db, auth, analytics, appId, setModalMessage 的物件。
 */
export const useAuthCore = (setModalMessage) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

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
      appInstanceRef.current = initializeFirebaseApp(currentFirebaseConfig);
      dbInstanceRef.current = getFirebaseDb(appInstanceRef.current);
      authInstanceRef.current = getFirebaseAuth(appInstanceRef.current);
      analyticsInstanceRef.current = getFirebaseAnalytics(
        appInstanceRef.current
      );

      if (authInstanceRef.current) {
        const unsubscribe = onAuthStateChanged(
          authInstanceRef.current,
          async (user) => {
            let userWithRole = null;
            if (user) {
              try {
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

                const userProfileDocRef = doc(
                  dbInstanceRef.current,
                  `artifacts/${projectAppId}/users/${user.uid}/profile`,
                  "main"
                );

                const userProfileDocSnap = await getDoc(userProfileDocRef);

                let isAdmin = false;

                if (userProfileDocSnap.exists()) {
                  const userData = userProfileDocSnap.data();
                  isAdmin = userData.isAdmin === true;

                  if (userData.username === undefined && user.email) {
                    userData.username = user.email.split("@")[0];
                  }
                  if (userData.rank === undefined) {
                    userData.rank = "銅";
                  }
                  // Ensure publishedReviews is an array for existing users
                  if (!Array.isArray(userData.publishedReviews)) {
                    userData.publishedReviews = [];
                  }
                  if (!Array.isArray(userData.favoriteRestaurants)) {
                    userData.favoriteRestaurants = [];
                  }

                  await setDoc(
                    userProfileDocRef,
                    { ...userData, isAdmin: isAdmin },
                    { merge: true }
                  );
                  userWithRole = { ...user, ...userData, isAdmin: isAdmin };
                } else {
                  const newUserProfile = {
                    email: user.email,
                    createdAt: new Date().toISOString(),
                    isAdmin: isAdmin,
                    username: user.email ? user.email.split("@")[0] : "用戶",
                    rank: "銅",
                    publishedReviews: [], // Initialize publishedReviews for new users
                    favoriteRestaurants: [], // Initialize favoriteRestaurants for new users
                  };
                  await setDoc(userProfileDocRef, newUserProfile);
                  userWithRole = { ...user, ...newUserProfile };
                }
              } catch (dbError) {
                console.error(
                  "useAuthCore: 從 Firestore 獲取或創建用戶資料失敗:",
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
                }
              } catch (tokenError) {
                console.error(
                  "useAuthCore: Firebase Custom Token 認證失敗:",
                  tokenError
                );
                setModalMessage(`自動認證失敗: ${tokenError.message}`);
              }
            }
            setCurrentUser(userWithRole);
            setLoadingUser(false);
          }
        );

        return () => unsubscribe();
      } else {
        console.error("useAuthCore: authInstance failed to initialize");
        setModalMessage("Firebase 認證服務初始化失敗");
        setLoadingUser(false);
      }
    } catch (error) {
      console.error("Firebase 初始化失敗:", error);
      setModalMessage(`Firebase 初始化失敗: ${error.message}`);
      setLoadingUser(false);
      return;
    }
  }, [setModalMessage]); // 確保 setModalMessage 在依賴項中

  return {
    currentUser,
    loadingUser,
    db: dbInstanceRef.current,
    auth: authInstanceRef.current,
    analytics: analyticsInstanceRef.current,
    appId: projectAppId,
  };
};
