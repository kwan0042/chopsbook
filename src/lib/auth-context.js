// src/lib/auth-context.js
"use client";

import React, { useState, useEffect, createContext, useRef } from "react";
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
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import Modal from "../components/Modal"; // 引入 Modal 組件

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
  typeof __initial_auth_token !== "undefined" ? __initialAuthToken : null;

export const AuthContext = createContext(null);

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+\.[^\s@]+$/.test(email);
};

// 輔助函數：將日期轉換為多倫多時區的 ISO 字符串
const convertToTorontoISOString = (date) => {
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Toronto",
  };
  const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(date);
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  const hour = parts.find((p) => p.type === "hour").value;
  const minute = parts.find((p) => p.type === "minute").value;
  const second = parts.find((p) => p.type === "second").value;

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000`;
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
                    {
                      uid: user.uid,
                      lastLogin: convertToTorontoISOString(new Date()),
                    },
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
                let username = user.email ? user.email.split("@")[0] : "用戶";
                let rank = 7; // 預設為數字 7
                let lastLogin = convertToTorontoISOString(new Date());
                let favoriteRestaurants = [];

                if (userProfileDocSnap.exists()) {
                  const userData = userProfileDocSnap.data();
                  isAdmin = userData.isAdmin === true;
                  username = userData.username || username;
                  rank = userData.rank !== undefined ? userData.rank : rank; // 確保 rank 為數字
                  lastLogin = userData.lastLogin || lastLogin;
                  favoriteRestaurants = userData.favoriteRestaurants || [];

                  await setDoc(
                    userProfileDocRef,
                    {
                      ...userData,
                      email: user.email,
                      isAdmin: isAdmin,
                      username: username,
                      rank: rank,
                      lastLogin: lastLogin,
                      favoriteRestaurants: favoriteRestaurants,
                    },
                    { merge: true }
                  );
                  userWithRole = {
                    ...user,
                    ...userData,
                    isAdmin: isAdmin,
                    username: username,
                    rank: rank,
                    lastLogin: lastLogin,
                    favoriteRestaurants: favoriteRestaurants,
                  };
                } else {
                  // 新用戶預設資料
                  const newUserProfile = {
                    email: user.email,
                    createdAt: convertToTorontoISOString(new Date()),
                    isAdmin: false, // 新用戶預設不是管理員
                    username: username,
                    rank: 7, // 新用戶預設等級為 7
                    lastLogin: lastLogin,
                    favoriteRestaurants: favoriteRestaurants,
                  };
                  await setDoc(userProfileDocRef, newUserProfile);
                  userWithRole = { ...user, ...newUserProfile };
                }
              } catch (dbError) {
                setModalMessage(`用戶資料處理失敗: ${dbError.message}`);
                userWithRole = user;
              }
            } else {
              if (initialAuthToken) {
                try {
                  await signInWithCustomToken(
                    authInstanceRef.current,
                    initialAuthToken
                  );
                } catch (tokenError) {
                  setModalMessage(`自動認證失敗: ${tokenError.message}`);
                }
              }
              userWithRole = null;
            }
            setCurrentUser(userWithRole);
            setLoadingUser(false);
          }
        );

        return () => unsubscribe();
      } else {
        setModalMessage("Firebase 認證服務初始化失敗");
        setLoadingUser(false);
      }
    } catch (error) {
      setModalMessage(`Firebase 初始化失敗: ${error.message}`);
      setLoadingUser(false);
    }
  }, []);

  const login = async (identifier, password) => {
    try {
      if (!authInstanceRef.current) {
        throw new Error("Firebase 認證服務未初始化");
      }

      if (isValidEmail(identifier)) {
        const userCredential = await signInWithEmailAndPassword(
          authInstanceRef.current,
          identifier,
          password
        );

        if (userCredential.user) {
          const userProfileDocRef = doc(
            dbInstanceRef.current,
            `artifacts/${projectAppId}/users/${userCredential.user.uid}/profile`,
            "main"
          );
          await updateDoc(userProfileDocRef, {
            lastLogin: convertToTorontoISOString(new Date()),
          });
        }
        return userCredential;
      } else {
        throw new Error("無效的登入識別符格式 (應為電子郵件)。");
      }
    } catch (error) {
      throw error;
    }
  };

  const signup = async (
    email,
    password,
    phoneNumber = null,
    username = null
  ) => {
    try {
      if (!authInstanceRef.current) {
        throw new Error("Firebase 認證服務未初始化");
      }
      if (!isValidEmail(email)) {
        throw new Error("無效的電子郵件格式。");
      }

      const userCredential = await createUserWithEmailAndPassword(
        authInstanceRef.current,
        email,
        password
      );
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
        const userProfileDocRef = doc(
          dbInstanceRef.current,
          `artifacts/${projectAppId}/users/${userCredential.user.uid}/profile`,
          "main"
        );
        const defaultUsername = username || email.split("@")[0];
        const defaultRank = 7; // 註冊時預設等級為數字 7
        const currentTorontoTimestamp = convertToTorontoISOString(new Date());

        const additionalProfileData = {
          email: email,
          createdAt: currentTorontoTimestamp,
          isAdmin: false, // 註冊時預設不是管理員
          username: defaultUsername,
          rank: defaultRank,
          lastLogin: currentTorontoTimestamp,
          phoneNumber: phoneNumber,
          photoURL: null,
          favoriteRestaurants: [],
          publishedReviews: [],
        };

        await setDoc(userProfileDocRef, additionalProfileData, { merge: true });

        setModalMessage(
          "註冊成功！請檢查您的電子郵件以完成驗證，然後再次登入。"
        );
      }
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (!authInstanceRef.current) {
        throw new Error("Firebase 認證服務未初始化");
      }
      await signOut(authInstanceRef.current);
      setModalMessage("登出成功！");
    } catch (error) {
      const errorMessage = error.message || "登出失敗，請稍後再試";
      setModalMessage(`登出失敗: ${errorMessage}`);
    }
  };

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

  const updateUserAdminStatus = async (userId, newIsAdmin) => {
    try {
      if (!dbInstanceRef.current) {
        throw new Error("Firebase 資料庫服務未初始化");
      }
      if (!currentUser?.isAdmin) {
        throw new Error("您沒有權限執行此操作。");
      }

      const userProfileDocRef = doc(
        dbInstanceRef.current,
        `artifacts/${projectAppId}/users/${userId}/profile`,
        "main"
      );

      // 更新 isAdmin 狀態，並根據其設置 rank
      const updates = { isAdmin: newIsAdmin };
      if (newIsAdmin) {
        updates.rank = 0; // 設為管理員時，等級設為 0
      } else {
        // 如果取消管理員權限，可以設為某個預設等級，例如 7
        updates.rank = 7;
      }

      await updateDoc(userProfileDocRef, updates);

      if (currentUser && currentUser.uid === userId) {
        setCurrentUser((prevUser) => ({ ...prevUser, ...updates }));
      }
      return true;
    } catch (error) {
      console.error("更新用戶管理員權限失敗:", error);
      throw error;
    }
  };

  const updateUserProfile = async (userId, updates) => {
    try {
      if (!dbInstanceRef.current) {
        throw new Error("Firebase 資料庫服務未初始化");
      }
      if (!currentUser?.isAdmin && currentUser?.uid !== userId) {
        throw new Error("您沒有權限更新此用戶資料。");
      }

      const userProfileDocRef = doc(
        dbInstanceRef.current,
        `artifacts/${projectAppId}/users/${userId}/profile`,
        "main"
      );
      await updateDoc(userProfileDocRef, updates);

      if (currentUser && currentUser.uid === userId) {
        setCurrentUser((prevUser) => ({ ...prevUser, ...updates }));
      }
      return true;
    } catch (error) {
      console.error("更新用戶資料失敗:", error);
      throw error;
    }
  };

  const sendPasswordResetLink = async (email) => {
    try {
      if (!authInstanceRef.current) {
        throw new Error("Firebase 認證服務未初始化");
      }
      if (!isValidEmail(email)) {
        throw new Error("無效的電子郵件格式。");
      }
      if (!currentUser?.isAdmin) {
        throw new Error("您沒有權限執行此操作。");
      }
      await sendPasswordResetEmail(authInstanceRef.current, email);
      return true;
    } catch (error) {
      console.error("管理員發送密碼重設電郵失敗:", error);
      throw error;
    }
  };

  /**
   * 切換餐廳在用戶收藏列表中的狀態（新增或移除）。
   * @param {string} restaurantId - 要收藏或取消收藏的餐廳 ID。
   * @returns {Promise<boolean>} - 如果操作成功則返回 true。
   */
  const toggleFavoriteRestaurant = async (restaurantId) => {
    if (!dbInstanceRef.current || !currentUser) {
      setModalMessage("請先登入才能收藏或取消收藏餐廳。");
      return false;
    }

    const userId = currentUser.uid;
    const userProfileDocRef = doc(
      dbInstanceRef.current,
      `artifacts/${projectAppId}/users/${userId}/profile`,
      "main"
    );

    try {
      const docSnap = await getDoc(userProfileDocRef);
      let currentFavorites = [];

      if (docSnap.exists()) {
        const userData = docSnap.data();
        currentFavorites = userData.favoriteRestaurants || [];
      }

      let newFavorites;
      if (currentFavorites.includes(restaurantId)) {
        newFavorites = currentFavorites.filter((id) => id !== restaurantId);
        setModalMessage("已從收藏移除。");
      } else {
        newFavorites = [...currentFavorites, restaurantId];
        setModalMessage("已添加到收藏。");
      }

      await updateDoc(userProfileDocRef, { favoriteRestaurants: newFavorites });

      setCurrentUser((prevUser) => ({
        ...prevUser,
        favoriteRestaurants: newFavorites,
      }));
      return true;
    } catch (error) {
      console.error("切換收藏餐廳狀態失敗:", error);
      setModalMessage("收藏操作失敗: " + error.message);
      throw error;
    }
  };

  const closeModal = () => {
    setModalMessage("");
  };

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
        sendPasswordReset,
        updateUserProfile,
        sendPasswordResetLink,
        toggleFavoriteRestaurant,
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
