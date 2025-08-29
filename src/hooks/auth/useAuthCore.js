// src/hooks/auth/useAuthCore.js
"use client";

import { useState, useEffect, useRef } from "react";
// 移除 useRouter，因為重定向邏輯已移出此 Hook
// import { useRouter } from "next/navigation";
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
  setPersistence, // 導入 setPersistence
  browserLocalPersistence, // 導入 browserLocalPersistence
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * useAuthCore Hook:
 * 負責 Firebase 的初始化、用戶認證狀態監聽，以及用戶基本資料的處理。
 * 現在也負責設定 Firebase Auth 的持久化並暴露 `authReady` 狀態。
 * @param {function} setGlobalModalMessage - 用於在全局範圍顯示模態框訊息的回調。
 * @returns {object} 包含 currentUser, loadingUser, authReady, db, auth, analytics, appId, app, storage, setCurrentUser 的物件。
 */
export const useAuthCore = (setGlobalModalMessage) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [authReady, setAuthReady] = useState(false); // 新增：指示 Firebase 認證檢查是否完成
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [storage, setStorage] = useState(null);
  const [appId, setAppId] = useState(null);
  const [app, setApp] = useState(null);

  const authInstanceRef = useRef(null);
  const dbInstanceRef = useRef(null);
  const isMountedRef = useRef(true);
  // 移除 useRouter，因為重定向邏輯已移出此 Hook
  // const router = useRouter();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
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

        // --- 關鍵修改：設定 Firebase Auth 持久化 ---
        // 這應在 onAuthStateChanged 監聽器設置之前完成
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
            // 即使持久化設定失敗，仍繼續嘗試其他認證流程
          });

        // 設定 onAuthStateChanged 監聽器
        console.log("useAuthCore: Setting up onAuthStateChanged listener...");
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
          if (!isMountedRef.current) return;
          console.log(
            "useAuthCore: onAuthStateChanged triggered. User:",
            user ? user.email || user.uid : "None"
          );

          if (user) {
            try {
              // 確保用戶的根級文檔存在
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

              // 獲取或創建用戶個人資料
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

              // 設定默認值並更新
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
              setCurrentUser(user); // 即使資料庫操作失敗，也設置基礎用戶資訊
            }
          } else {
            setCurrentUser(null); // 如果用戶未認證，設置為 null
            console.log("useAuthCore: No authenticated user.");
          }
          setLoadingUser(false); // 無論是否登入，都結束加載狀態
          setAuthReady(true); // --- 關鍵修改：認證檢查完成，標記為就緒 ---
        });

        // 在監聽器設置完成後，嘗試進行一次性登入 (如果沒有現有用戶)
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
              `認證失敗: ${error.message}。請確認您已登入。`, // 更明確的訊息
              "error"
            );
            if (isMountedRef.current) {
              // 在此處不要設置 setLoadingUser(false) 或 setAuthReady(true)，讓 onAuthStateChanged 來處理
              // 因為 onAuthStateChanged 會在 custom token 登入失敗後以 null user 再次觸發
            }
          }
        } else if (!firebaseAuth.currentUser && !initialAuthToken) {
          console.log(
            "useAuthCore: No initial authentication token provided and no current user. User will remain unauthenticated."
          );
          // 在此處的處理會被 onAuthStateChanged 覆蓋
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
          setAuthReady(true); // 初始化失敗也標記為就緒
        }
      }
    };

    initializeAndAuthenticateFirebase();
  }, [setGlobalModalMessage, app]); // 依賴 `setGlobalModalMessage` 和 `app` 實例，避免重複初始化

  // --- 關鍵修改：移除此處的重定向邏輯 ---
  // useEffect(() => {
  //   if (!currentUser && !loadingUser) {
  //     console.log("useAuthCore: 用戶未認證且載入完成。重定向到 /login。");
  //     router.push("/login");
  //   }
  // }, [currentUser, loadingUser, router]);

  return {
    currentUser,
    loadingUser,
    authReady, // <<< 新增：將 authReady 狀態暴露出去
    db,
    auth,
    analytics,
    storage,
    appId,
    app,
    setCurrentUser,
  };
};
