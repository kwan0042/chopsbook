// src/hooks/auth/useAuthCore.js
"use client";

import { useState, useEffect, useRef } from "react";
import {
  // 這些 Firebase 相關的 import 語句會保留，因為在生產環境或非繞過模式下仍然需要。
  // 它們只會被導入，但實際的初始化和使用會被條件性地跳過。
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
    // 判斷是否在開發模式。在 Next.js 中，process.env.NODE_ENV 會自動設定。
    const IS_DEVELOPMENT_MODE = process.env.NODE_ENV === "development";
    // 設置一個旗標來控制是否啟用登入繞過。
    // 在開發測試期間可以設為 true，生產環境或需要真實登入時設為 false。
    const ENABLE_DEV_LOGIN_BYPASS = false; // <--- 將此設定為 true 以啟用模擬管理員登入並跳過 Firebase 連接

    // 模擬管理員用戶的資料
    const MOCK_ADMIN_USER_DATA = {
      uid: "mock-admin-uid-kwan6d16", // 模擬一個固定的 UID
      email: "kwan6d16@gmail.com",
      isAdmin: true,
      username: "kwan6d16",
      rank: "1", // 管理員等級
      publishedReviews: [],
      favoriteRestaurants: [],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      // 根據您 `currentUser` 實際可能包含的其他屬性添加
    };
    // --- 開發模式設定結束 ---

    // --- 開發模式登入繞過邏輯 ---
    // 如果在開發模式下且啟用了繞過，則直接設定模擬用戶，並跳過 Firebase 初始化
    if (IS_DEVELOPMENT_MODE && ENABLE_DEV_LOGIN_BYPASS) {
      console.log(
        "--- DEV BYPASS: Activating mock admin user, bypassing Firebase connection ---"
      );
      // 直接設定模擬用戶資訊
      setCurrentUser(MOCK_ADMIN_USER_DATA);
      setLoadingUser(false); // 立即停止加載
      setAuthReady(true); // 立即標記認證系統已就緒
      setAppId("dev-mock-app-id"); // 為開發模式設定一個模擬的 appId
      setDb(null); // 明確設定為 null，表示沒有連接到 Firestore
      setAuth(null); // 明確設定為 null，表示沒有連接到 Auth
      setAnalytics(null); // 明確設定為 null
      setStorage(null); // 明確設定為 null
      setApp(null); // 明確設定為 null
      return; // 立即退出 useEffect，防止執行 Firebase 初始化和連接邏輯
    }
    // --- 開發模式登入繞過邏輯結束 ---

    // --- 以下為正常的 Firebase 初始化和認證邏輯，僅在未啟用開發模式繞過時執行 ---
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

              let userProfileData = {};
              let isAdmin = false;

              if (userProfileDocSnap.exists()) {
                userProfileData = userProfileDocSnap.data();
                isAdmin = userProfileData.isAdmin === true;
              }

              const updatedUserProfile = {
                email: user.email || "",
                createdAt:
                  userProfileData.createdAt || new Date().toISOString(),
                isAdmin: isAdmin,
                username:
                  userProfileData.username ||
                  (user.email ? user.email.split("@")[0] : "用戶"),
                rank: userProfileData.rank || "7",
                publishedReviews: userProfileData.publishedReviews || [],
                favoriteRestaurants: userProfileData.favoriteRestaurants || [],
                lastLogin: new Date().toISOString(),
              };

              await setDoc(userProfileDocRef, updatedUserProfile, {
                merge: true,
              });
              const userWithRole = { ...user, ...updatedUserProfile };
              setCurrentUser(userWithRole);
              console.log(
                "useAuthCore: Current user profile processed:",
                userWithRole
              );
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
  }, [setGlobalModalMessage, app]); // 依賴項不變

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
