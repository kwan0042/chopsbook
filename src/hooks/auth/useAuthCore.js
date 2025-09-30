// src/hooks/auth/useAuthCore.js
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
import { doc, getDoc, updateDoc } from "firebase/firestore";

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
              const privateDocRef = doc(
                firestoreDb,
                `artifacts/${projectAppId}/users/${user.uid}/privateData/${user.uid}`
              );

              const [userDocSnap, privateDocSnap] = await Promise.all([
                getDoc(userDocRef),
                getDoc(privateDocRef),
              ]);

              const publicData = userDocSnap.exists() ? userDocSnap.data() : {};
              const privateData = privateDocSnap.exists()
                ? privateDocSnap.data()
                : {};

              const mergedData = {
                ...publicData,
                ...privateData,
                username:
                  publicData.username ||
                  user.displayName ||
                  (privateData.email ? privateData.email.split("@")[0] : ""),
                lastLogin: new Date().toISOString(),
              };

              await updateDoc(userDocRef, {
                lastLogin: mergedData.lastLogin,
              });

              const userWithProfile = { ...user, ...mergedData };
              setCurrentUser(userWithProfile);
            } catch (dbError) {
              console.error("從 Firestore 獲取或創建用戶資料失敗:", dbError);
              setGlobalModalMessage(
                `用戶資料處理失敗: ${dbError.message}`,
                "error"
              );
              setCurrentUser(user);
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
  }, [setGlobalModalMessage, app]);

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
