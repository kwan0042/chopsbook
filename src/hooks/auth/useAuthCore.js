// src/hooks/auth/useAuthCore.js (已修改)
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  initializeFirebaseApp,
  getFirebaseDb,
  getFirebaseAuth,
  getFirebaseAnalytics,
  getFirebaseStorage,
} from "../../lib/firebase";
import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
// 引入 serverTimestamp 用於創建時的時間戳 (可選, 但推薦用於創建時間)
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * 輔助函數：判斷是否應更新 lastLogin
 * @param {string} lastLoginIsoString - 上次登入時間的 ISO 8601 格式字串
 * @param {number} delayHours - 延遲更新的小時數 (例如: 24 小時)
 * @returns {boolean}
 */
const shouldUpdateLastLogin = (lastLoginIsoString, delayHours = 24) => {
  if (!lastLoginIsoString) return true; // 如果沒有上次登入記錄，則執行更新

  const lastLoginTime = new Date(lastLoginIsoString).getTime();
  const currentTime = new Date().getTime();
  const delayMs = delayHours * 60 * 60 * 1000;

  return currentTime - lastLoginTime > delayMs;
};

/**
 * useAuthCore Hook:
 * 負責 Firebase 的初始化、用戶認證狀態監聽，以及用戶基本資料的處理。
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

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const projectAppId = process.env.NEXT_PUBLIC_FIREBASE_ADMIN_APP_ID;
    if (!projectAppId) {
      console.error(
        "環境變數 NEXT_PUBLIC_FIREBASE_ADMIN_APP_ID 未設定。請檢查 .env 檔案。"
      );
      setGlobalModalMessage(
        "配置錯誤: 無法獲取 Firebase 應用程式 ID。",
        "error"
      );
      setLoadingUser(false);
      setAuthReady(true);
      return;
    }
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

    const initializeAndAuthenticateFirebase = async () => {
      try {
        const firebaseApp = initializeFirebaseApp(currentFirebaseConfig);
        setApp(firebaseApp);
        const firestoreDb = getFirebaseDb(firebaseApp);
        const firebaseAuth = getFirebaseAuth(firebaseApp);
        const firebaseAnalytics = getFirebaseAnalytics(firebaseApp);
        const firebaseStorage = getFirebaseStorage(firebaseApp);

        if (!isMountedRef.current) return;
        setDb(firestoreDb);
        setAuth(firebaseAuth);
        setAnalytics(firebaseAnalytics);
        setStorage(firebaseStorage);

        if (!firebaseAuth) {
          throw new Error("Firebase 認證服務初始化失敗");
        }

        await setPersistence(firebaseAuth, browserLocalPersistence);

        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
          if (!isMountedRef.current) return;

          if (user) {
            try {
              const userDocRef = doc(
                firestoreDb,
                `artifacts/${projectAppId}/users/${user.uid}`
              );
              // 維持原有的私人資料文檔讀取邏輯
              const privateDocRef = doc(
                firestoreDb,
                `artifacts/${projectAppId}/users/${user.uid}/privateData/${user.uid}`
              );

              // 🚀 [修改]: 只有在用戶已驗證或不是 Email/Password 登入時，才嘗試讀取 Firestore 文件
              let userDocSnap, privateDocSnap;

              // 檢查是否是 Email/Password 且尚未驗證
              const isUnverifiedEmailUser =
                user.providerData.some((p) => p.providerId === "password") &&
                !user.emailVerified;

              if (isUnverifiedEmailUser) {
                // 如果是 Email/Password 且未驗證，則跳過所有 Firestore 操作，只設置基本 user 對象
                console.log(
                  `[useAuthCore] Email 未驗證 (${user.email})，跳過 Firestore 讀寫。`
                );
                setCurrentUser(user);
                setLoadingUser(false);
                setAuthReady(true);
                return;
              }

              // 對於已驗證的 Email/Password 用戶或第三方/匿名用戶，嘗試讀取文件
              [userDocSnap, privateDocSnap] = await Promise.all([
                getDoc(userDocRef),
                getDoc(privateDocRef),
              ]);

              let publicData = userDocSnap.exists() ? userDocSnap.data() : {};
              let privateData = privateDocSnap.exists()
                ? privateDocSnap.data()
                : {};

              // 🚀 [新增創建邏輯]: 檢查文件是否存在，如果不存在，且用戶已通過某種方式驗證/登入 (非 Email 註冊流程不適用此判斷)
              if (!userDocSnap.exists()) {
                const currentTime = new Date().toISOString();
                const defaultUsername =
                  user.displayName || user.email?.split("@")[0] || "User";

                // 首次創建/初始化公開資料
                publicData = {
                  username: defaultUsername,
                  rank: "7",
                  publishedReviews: [],
                  favoriteRestaurants: [],
                  isRestaurantOwner: false,
                  lastLogin: currentTime,
                };

                // 首次創建/初始化私人資料
                privateData = {
                  email: user.email || null,
                  createdAt: currentTime,
                  isAdmin: false,
                  isSuperAdmin: false,
                  phoneNumber: user.phoneNumber || null,
                  isGoogleUser: user.providerData.some(
                    (p) => p.providerId === "google.com"
                  ),
                  isFacebookUser: user.providerData.some(
                    (p) => p.providerId === "facebook.com"
                  ),
                };

                // 創建 Firestore 文件 (使用 setDoc 確保文件創建)
                await setDoc(userDocRef, publicData);
                await setDoc(privateDocRef, privateData);
                console.log(
                  `[useAuthCore] 首次登入且已驗證，已創建用戶資料: ${user.uid}`
                );

                // 因為剛剛創建了文件，所以 lastLogin 已經是 currentTime，不需要額外更新
                publicData.lastLogin = currentTime;
              } else {
                // 檢查是否需要更新 lastLogin (如果文件已存在)
                const needsLastLoginUpdate = shouldUpdateLastLogin(
                  publicData.lastLogin,
                  24
                );
                const newLastLogin = new Date().toISOString();

                // **只有在超過 24 小時後才執行寫入操作**
                if (needsLastLoginUpdate) {
                  // [保持]: 這裡更新 lastLogin
                  await setDoc(
                    userDocRef,
                    {
                      lastLogin: newLastLogin,
                    },
                    { merge: true }
                  );
                  publicData.lastLogin = newLastLogin; // 更新本地狀態
                }
              }

              // 構建合併後的資料
              const mergedData = {
                ...publicData,
                ...privateData,
                username:
                  publicData.username ||
                  user.displayName ||
                  (privateData.email ? privateData.email.split("@")[0] : ""),
                lastLogin: publicData.lastLogin, // 使用上面已經確定的 lastLogin
              };

              const userWithProfile = { ...user, ...mergedData };
              setCurrentUser(userWithProfile);
            } catch (dbError) {
              // 如果權限錯誤發生在這裡，通常是 Firestore Security Rules 設置不允許讀取
              console.error("從 Firestore 獲取或創建用戶資料失敗:", dbError);
              setGlobalModalMessage(
                `用戶資料處理失敗: ${dbError.message}`,
                "error"
              );
              setCurrentUser(user); // 確保即使資料庫出錯，用戶仍能登入
            }
          } else {
            setCurrentUser(null);
          }
          setLoadingUser(false);
          setAuthReady(true);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Firebase 初始化或初始認證失敗:", error);
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
  }, [setGlobalModalMessage]);

  const getToken = useCallback(async () => {
    if (auth && auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken(true);
        return token;
      } catch (error) {
        console.error("獲取 ID Token 失敗:", error);
        setGlobalModalMessage("驗證失敗，請重新登入。", "error");
        return null;
      }
    }
    return null;
  }, [auth, setGlobalModalMessage]);

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
    getToken,
  };
};
