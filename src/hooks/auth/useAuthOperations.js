// src/hooks/auth/useAuthOperations.js
"use client";

import { useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  FacebookAuthProvider, // <-- 新增: 導入 FacebookAuthProvider
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"; // <-- 新增: 導入 updateDoc
import { isValidEmail } from "./useUtils";

/**
 * useAuthOperations Hook:
 * 提供認證相關的操作函數 (登入、註冊、登出、重設密碼, Google/Facebook 登入)。
 * @param {object} auth - Firebase Auth 實例。
 * @param {object} db - Firebase Firestore 實例。
 * @param {string} appId - 應用程式 ID。
 * @param {function} setModalMessage - 用於顯示模態框訊息的回調。
 * @param {function} setCurrentUser - 用於更新用戶狀態的回調。
 * @returns {object} 包含所有認證操作函數的物件。
 */
export const useAuthOperations = (
  auth,
  db,
  appId,
  setModalMessage,
  setCurrentUser
) => {
  const login = useCallback(
    async (identifier, password) => {
      try {
        if (!auth) {
          throw new Error("Firebase 認證服務未初始化");
        }
        if (!isValidEmail(identifier)) {
          throw new Error("無效的登入識別符格式 (應為電子郵件)。");
        }
        return await signInWithEmailAndPassword(auth, identifier, password);
      } catch (error) {
        console.error("useAuthOperations: 登入失敗:", error);
        throw error;
      }
    },
    [auth]
  );

  const signup = useCallback(
    async (email, password, phoneNumber, isRestaurantOwner, ownedRest) => {
      try {
        if (!auth) {
          throw new Error("Firebase 認證服務未初始化");
        }
        if (!isValidEmail(email)) {
          throw new Error("無效的電子郵件格式。");
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await sendEmailVerification(userCredential.user);

        const userDocRef = doc(
          db,
          `artifacts/${appId}/users/${userCredential.user.uid}`
        );

        const defaultUsername = email.split("@")[0];
        const isAdmin = false;

        const additionalProfileData = {
          email: email,
          createdAt: new Date().toISOString(),
          isAdmin: isAdmin,
          username: defaultUsername,
          rank: "7",
          publishedReviews: [],
          favoriteRestaurants: [],
          phoneNumber: phoneNumber || null,
          isRestaurantOwner: isRestaurantOwner || false,
        };

        if (isRestaurantOwner) {
          additionalProfileData.ownedRest = ownedRest || null;
        }

        await setDoc(userDocRef, additionalProfileData, { merge: true });

        setModalMessage(
          "註冊成功！請檢查您的電子郵件以完成驗證，然後再次登入。",
          "success"
        );
        return userCredential;
      } catch (error) {
        console.error("useAuthOperations: 註冊失敗:", error);
        throw error;
      }
    },
    [auth, db, appId, setModalMessage]
  );

  const logout = useCallback(async () => {
    try {
      if (!auth) {
        throw new Error("Firebase 認證服務未初始化");
      }
      await signOut(auth);
      setCurrentUser(null);
      setModalMessage("登出成功！", "success");
    } catch (error) {
      console.error("useAuthOperations: 登出失敗:", error);
      const errorMessage = error.message || "登出失敗，請稍後再試";
      setModalMessage(`登出失敗: ${errorMessage}`, "error");
    }
  }, [auth, setModalMessage, setCurrentUser]);

  const sendPasswordReset = useCallback(
    async (email) => {
      try {
        if (!auth) {
          throw new Error("Firebase 認證服務未初始化");
        }
        if (!isValidEmail(email)) {
          throw new Error("無效的電子郵件格式。");
        }
        await sendPasswordResetEmail(auth, email);
      } catch (error) {
        console.error("useAuthOperations: 發送密碼重設電郵失敗:", error);
        throw error;
      }
    },
    [auth]
  );

  const signupWithGoogle = useCallback(async () => {
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
      const userDocSnap = await getDoc(userDocRef);

      let fullUserData = {};
      const currentTime = new Date().toISOString();

      if (!userDocSnap.exists()) {
        const defaultUsername = user.displayName || user.email.split("@")[0];
        fullUserData = {
          email: user.email,
          createdAt: currentTime,
          isAdmin: false,
          username: defaultUsername,
          rank: "7",
          publishedReviews: [],
          favoriteRestaurants: [],
          phoneNumber: user.phoneNumber || null,
          isRestaurantOwner: false,
          isGoogleUser: true,
          lastLogin: currentTime,
        };
        await setDoc(userDocRef, fullUserData);
      } else {
        fullUserData = {
          ...userDocSnap.data(),
          isGoogleUser: true,
          lastLogin: currentTime,
        };
        await updateDoc(userDocRef, {
          isGoogleUser: true,
          lastLogin: currentTime,
        });
      }

      const userWithProfile = { ...user, ...fullUserData };
      setCurrentUser(userWithProfile);
      setModalMessage("Google 註冊/登入成功！", "success");
      return userWithProfile;
    } catch (error) {
      console.error("useAuthOperations: Google 註冊/登入失敗:", error);
      let errorMessage = "Google 註冊/登入失敗，請稍後再試。";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Google 登入視窗已被關閉。";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "已有一個進行中的登入視窗。";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setModalMessage(errorMessage, "error");
      throw error;
    }
  }, [auth, db, appId, setModalMessage, setCurrentUser]);

  // --- 新增: Facebook 登入/註冊函式 ---
  const loginWithFacebook = useCallback(async () => {
    try {
      const facebookProvider = new FacebookAuthProvider();
      facebookProvider.addScope("email"); // 請求 email 權限
      facebookProvider.addScope("public_profile"); // 請求公開個人資料權限

      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;

      const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
      const userDocSnap = await getDoc(userDocRef);

      let fullUserData = {};
      const currentTime = new Date().toISOString();

      if (!userDocSnap.exists()) {
        // 新用戶，創建個人資料
        const defaultUsername = user.displayName || user.email.split("@")[0];
        fullUserData = {
          email: user.email,
          createdAt: currentTime,
          isAdmin: false,
          username: defaultUsername,
          rank: "10",
          publishedReviews: [],
          favoriteRestaurants: [],
          phoneNumber: user.phoneNumber || null,
          isRestaurantOwner: false,
          isFacebookUser: true,
          lastLogin: currentTime,
        };
        await setDoc(userDocRef, fullUserData);
      } else {
        // 現有用戶，更新登入時間
        fullUserData = {
          ...userDocSnap.data(),
          isFacebookUser: true,
          lastLogin: currentTime,
        };
        await updateDoc(userDocRef, {
          isFacebookUser: true,
          lastLogin: currentTime,
        });
      }

      const userWithProfile = { ...user, ...fullUserData };
      setCurrentUser(userWithProfile);
      setModalMessage("Facebook 註冊/登入成功！", "success");
      return userWithProfile;
    } catch (error) {
      console.error("useAuthOperations: Facebook 註冊/登入失敗:", error);
      let errorMessage = "Facebook 註冊/登入失敗，請稍後再試。";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Facebook 登入視窗已被關閉。";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "已有一個進行中的登入視窗。";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setModalMessage(errorMessage, "error");
      throw error;
    }
  }, [auth, db, appId, setModalMessage, setCurrentUser]);

  return {
    login,
    signup,
    logout,
    sendPasswordReset,
    signupWithGoogle,
    loginWithFacebook, // <-- 新增: 將新函式暴露出去
  };
};
