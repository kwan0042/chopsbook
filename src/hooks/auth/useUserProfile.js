// src/hooks/auth/useUserProfile.js
"use client";

import { useCallback } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { isValidEmail } from "./useUtils"; // 從 useUtils 導入 isValidEmail

/**
 * useUserProfile Hook:
 * 提供更新用戶個人資料和管理員相關操作的函數。
 * @param {object} db - Firebase Firestore 實例。
 * @param {object} auth - Firebase Auth 實例。
 * @param {object} currentUser - 當前登入用戶物件。
 * @param {string} appId - 應用程式 ID。
 * @param {function} setCurrentUser - 更新 currentUser 狀態的回調。
 * @param {function} setModalMessage - 用於顯示模態框訊息的回調。
 * @returns {object} 包含 updateUserAdminStatus, updateUserProfile, sendPasswordResetLink 的物件。
 */
export const useUserProfile = (
  db,
  auth,
  currentUser,
  appId,
  setCurrentUser,
  setModalMessage
) => {
  const updateUserAdminStatus = useCallback(
    async (userId, isAdmin) => {
      try {
        if (!db) {
          throw new Error("Firebase 資料庫服務未初始化");
        }

        const userProfileDocRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/profile`,
          "main"
        );

        await setDoc(userProfileDocRef, { isAdmin }, { merge: true });

        if (currentUser && currentUser.uid === userId) {
          const userDocSnap = await getDoc(userProfileDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setCurrentUser({ ...currentUser, ...userData });
          }
        }
        return true;
      } catch (error) {
        console.error("useUserProfile: 更新用戶管理員權限失敗:", error);
        throw error;
      }
    },
    [db, appId, currentUser, setCurrentUser]
  );

  const updateUserProfile = useCallback(
    async (userId, updates) => {
      try {
        if (!db) {
          throw new Error("Firebase 資料庫服務未初始化");
        }
        if (!currentUser?.isAdmin && currentUser?.uid !== userId) {
          throw new Error("您沒有權限更新此用戶資料。");
        }

        const userProfileDocRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/profile`,
          "main"
        );
        await updateDoc(userProfileDocRef, updates);

        if (currentUser && currentUser.uid === userId) {
          setCurrentUser((prevUser) => ({ ...prevUser, ...updates }));
        }
        return true;
      } catch (error) {
        console.error("useUserProfile: 更新用戶資料失敗:", error);
        throw error;
      }
    },
    [db, appId, currentUser, setCurrentUser]
  );

  const sendPasswordResetLink = useCallback(
    async (email) => {
      try {
        if (!auth) {
          throw new Error("Firebase 認證服務未初始化");
        }
        if (!isValidEmail(email)) {
          throw new Error("無效的電子郵件格式。");
        }
        if (!currentUser?.isAdmin) {
          throw new Error("您沒有權限執行此操作。");
        }
        await sendPasswordResetEmail(auth, email);
        return true;
      } catch (error) {
        console.error("useUserProfile: 管理員發送密碼重設電郵失敗:", error);
        throw error;
      }
    },
    [auth, currentUser, setModalMessage]
  );

  return { updateUserAdminStatus, updateUserProfile, sendPasswordResetLink };
};
