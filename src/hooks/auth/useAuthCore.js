// src/hooks/auth/useAuthCore.js
"use client";

import { useState, useEffect, useRef } from "react";
import {
  initializeFirebaseApp,
  getFirebaseDb,
  getFirebaseAuth,
  getFirebaseAnalytics,
  getFirebaseStorage,
} from "../../lib/firebase";
import {
  onAuthStateChanged,
  signInWithCustomToken,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * useAuthCore Hook:
 * 負責 Firebase 的初始化、用戶認證狀態監聽，以及用戶基本資料的處理。
 * 現在也負責設定 Firebase Auth 的持久化並暴露 `authReady` 狀態。
 * 在開發模式下，可以選擇性地啟用模擬管理員用戶，以繞過登入並防止連接 Firebase。
 * @param {function} setGlobalModalMessage - 用於在全局範圍顯示模態框訊息的回調。
 * @returns {object} 包含 currentUser, loadingUser, authReady, db, auth, analytics, appId, app, storage, setCurrentUser 的物件。
 */
export const useAuthCore = (setGlobalModalMessage) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [storage, setStorage] = useState(null);
  const [appId, setAppId] = useState(null);
  const [app, setApp] = useState(null);

  const authInstanceRef = useRef(null);
  const dbInstanceRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // --- 開發模式設定：控制是否啟用登入繞過與 Firebase 連接禁用 ---
    const IS_DEVELOPMENT_MODE = process.env.NODE_ENV === "development";
    const ENABLE_DEV_LOGIN_BYPASS = false;

    const MOCK_ADMIN_USER_DATA = {
      uid: "mock-admin-uid-kwan6d16",
      email: "kwan6d16@gmail.com",
      isAdmin: true,
      username: "kwan6d16",
      rank: "1",
      publishedReviews: [],
      favoriteRestaurants: [],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    // --- 開發模式設定結束 ---

    if (IS_DEVELOPMENT_MODE && ENABLE_DEV_LOGIN_BYPASS) {
      console.log(
        "--- DEV BYPASS: Activating mock admin user, bypassing Firebase connection ---"
      );
      setCurrentUser(MOCK_ADMIN_USER_DATA);
      setLoadingUser(false);
      setAuthReady(true);
      setAppId("dev-mock-app-id");
      setDb(null);
      setAuth(null);
      setAnalytics(null);
      setStorage(null);
      setApp(null);
      return;
    }

    const projectAppId =
      typeof __app_id !== "undefined" ? __app_id : "default-app-id";
    setAppId(projectAppId);

    const currentFirebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    const initialAuthToken =
      typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;

    const initializeAndAuthenticateFirebase = async () => {
      try {
        console.log("useAuthCore: Starting Firebase initialization...");
        const firebaseApp = initializeFirebaseApp(currentFirebaseConfig);
        setApp(firebaseApp);
        const firestoreDb = getFirebaseDb(firebaseApp);
        const firebaseAuth = getFirebaseAuth(firebaseApp);
        const firebaseAnalytics = getFirebaseAnalytics(firebaseApp);
        const firebaseStorage = getFirebaseStorage(firebaseApp);

        dbInstanceRef.current = firestoreDb;
        authInstanceRef.current = firebaseAuth;

        if (!isMountedRef.current) return;
        setDb(firestoreDb);
        setAuth(firebaseAuth);
        setAnalytics(firebaseAnalytics);
        setStorage(firebaseStorage);
        console.log("useAuthCore: Firebase initialized successfully.");

        if (!firebaseAuth) {
          throw new Error("Firebase 認證服務初始化失敗");
        }

        await setPersistence(firebaseAuth, browserLocalPersistence)
          .then(() => {
            console.log("useAuthCore: Firebase Auth 持久化設定為 LOCAL。");
          })
          .catch((error) => {
            console.error("useAuthCore: 設定 Firebase Auth 持久化失敗:", error);
            setGlobalModalMessage(
              `設定認證持久化失敗: ${error.message}`,
              "error"
            );
          });

        console.log("useAuthCore: Setting up onAuthStateChanged listener...");
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
          if (!isMountedRef.current) return;
          console.log(
            "useAuthCore: onAuthStateChanged triggered. User:",
            user ? user.email || user.uid : "None"
          );

          if (user) {
            try {
              // 🚨 修正點：只讀取頂層文檔
              const userDocRef = doc(
                firestoreDb,
                `artifacts/${projectAppId}/users/${user.uid}`
              );
              const userDocSnap = await getDoc(userDocRef);

              if (!userDocSnap.exists()) {
                // 如果用戶文件不存在，則創建一個基本的
                const defaultUserData = {
                  uid: user.uid,
                  email: user.email || "",
                  isAdmin: false,
                  createdAt: new Date().toISOString(),
                  lastLogin: new Date().toISOString(),
                };
                await setDoc(userDocRef, defaultUserData, { merge: true });
                setCurrentUser({ ...user, ...defaultUserData });
                console.log(
                  "useAuthCore: 新用戶文件已創建並處理。",
                  userDocRef.path
                );
              } else {
                // 如果用戶文件存在，讀取所有數據並更新最後登入時間
                const userData = userDocSnap.data();
                const updatedUserData = {
                  ...userData,
                  lastLogin: new Date().toISOString(),
                };
                await setDoc(userDocRef, updatedUserData, { merge: true });

                const userWithProfile = { ...user, ...updatedUserData };
                setCurrentUser(userWithProfile);
                console.log(
                  "useAuthCore: 現有用戶資料已處理:",
                  userWithProfile
                );
              }
            } catch (dbError) {
              console.error(
                "useAuthCore: 從 Firestore 獲取或創建用戶資料失敗:",
                dbError
              );
              setGlobalModalMessage(
                `用戶資料處理失敗: ${dbError.message}`,
                "error"
              );
              setCurrentUser(user);
            }
          } else {
            setCurrentUser(null);
            console.log("useAuthCore: No authenticated user.");
          }
          setLoadingUser(false);
          setAuthReady(true);
        });

        if (!firebaseAuth.currentUser && initialAuthToken) {
          console.log(
            "useAuthCore: Attempting to sign in with custom token..."
          );
          try {
            await signInWithCustomToken(firebaseAuth, initialAuthToken);
            console.log("useAuthCore: Signed in with custom token.");
          } catch (error) {
            console.error("useAuthCore: Custom token sign-in failed:", error);
            setGlobalModalMessage(
              `認證失敗: ${error.message}。請確認您已登入。`,
              "error"
            );
          }
        } else if (!firebaseAuth.currentUser && !initialAuthToken) {
          console.log(
            "useAuthCore: No initial authentication token provided and no current user. User will remain unauthenticated."
          );
        } else {
          console.log(
            "useAuthCore: User already authenticated or no initial token needed to sign-in."
          );
        }

        return () => unsubscribe();
      } catch (error) {
        console.error(
          "useAuthCore: Firebase initialization or initial authentication failed:",
          error
        );
        if (isMountedRef.current) {
          setGlobalModalMessage(
            `Firebase 初始化失敗: ${error.message}`,
            "error"
          );
          setLoadingUser(false);
          setAuthReady(true);
        }
      }
    };

    initializeAndAuthenticateFirebase();
  }, [setGlobalModalMessage, app]);

  return {
    currentUser,
    loadingUser,
    authReady,
    db,
    auth,
    analytics,
    storage,
    appId,
    app,
    setCurrentUser,
  };
};
