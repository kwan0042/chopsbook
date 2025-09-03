"use client";

import { useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { isValidEmail } from "./useUtils"; // 從 useUtils 導入 isValidEmail

/**
 * useAuthOperations Hook:
 * 提供認證相關的操作函數 (登入、註冊、登出、重設密碼)。
 * @param {object} auth - Firebase Auth 實例。
 * @param {object} db - Firebase Firestore 實例。
 * @param {object} currentUser - 當前登入用戶物件。
 * @param {string} appId - 應用程式 ID。
 * @param {function} setModalMessage - 用於顯示模態框訊息的回調。
 * @returns {object} 包含 login, signup, logout, sendPasswordReset 的物件。
 */
export const useAuthOperations = (
  auth,
  db,
  currentUser,
  appId,
  setModalMessage
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
    // 移除 ownedRestId 參數
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

        const userProfileDocRef = doc(
          db,
          `artifacts/${appId}/users/${userCredential.user.uid}/profile`,
          "main"
        );

        const defaultUsername = email.split("@")[0];
        const isAdmin = false;

        // 包含新的用戶資料
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

        // 如果是餐廳擁有人，添加餐廳名稱
        if (isRestaurantOwner) {
          additionalProfileData.ownedRest = ownedRest || null;
        }

        await setDoc(userProfileDocRef, additionalProfileData, { merge: true });
        setModalMessage(
          "註冊成功！請檢查您的電子郵件以完成驗證，然後再次登入。"
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
      setModalMessage("登出成功！");
    } catch (error) {
      console.error("useAuthOperations: 登出失敗:", error);
      const errorMessage = error.message || "登出失敗，請稍後再試";
      setModalMessage(`登出失敗: ${errorMessage}`);
    }
  }, [auth, setModalMessage]);

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

  return { login, signup, logout, sendPasswordReset };
};
