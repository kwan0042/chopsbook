// src/hooks/auth/useUserProfile.js
"use client";

import { useCallback } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { isValidEmail } from "./useUtils";

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
  // DEBUG LOG: 檢查 setCurrentUser 在 Hook 初始化時的值
  console.log(
    "useUserProfile: setCurrentUser received:",
    typeof setCurrentUser
  );

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
            // DEBUG LOG: 在呼叫前檢查 setCurrentUser
            console.log(
              "updateUserAdminStatus: Attempting to call setCurrentUser, type:",
              typeof setCurrentUser
            );
            setCurrentUser({ ...currentUser, ...userData });
          }
        }
        setModalMessage(
          `用戶 ${userId} 的管理員權限已更新為: ${
            isAdmin ? "管理員" : "普通用戶"
          }`
        );
        return true;
      } catch (error) {
        console.error("useUserProfile: 更新用戶管理員權限失敗:", error);
        setModalMessage(`更新用戶管理員權限失敗: ${error.message}`);
        throw error;
      }
    },
    [db, appId, currentUser, setCurrentUser, setModalMessage]
  );

  const updateUserProfile = useCallback(
    async (userId, updates) => {
      try {
        if (!db) {
          throw new Error("Firebase 資料庫服務未初始化");
        }
        // 確保只有管理員或用戶本人可以更新資料
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
          // DEBUG LOG: 在呼叫前檢查 setCurrentUser
          console.log(
            "updateUserProfile: Attempting to call setCurrentUser, type:",
            typeof setCurrentUser
          );
          // 使用傳入的 setCurrentUser 函數來更新全局狀態
          setCurrentUser((prevUser) => ({ ...prevUser, ...updates }));
        }
        setModalMessage("用戶資料更新成功！");
        return true;
      } catch (error) {
        console.error("useUserProfile: 更新用戶資料失敗:", error);
        setModalMessage(`更新用戶資料失敗: ${error.message}`);
        throw error;
      }
    },
    [db, appId, currentUser, setCurrentUser, setModalMessage]
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
        // 通常只有管理員才能為其他用戶發送重設鏈接，或者用戶自己通過 /login 頁面發送
        // 這裡假設是管理員操作
        if (!currentUser?.isAdmin) {
          throw new Error("您沒有權限執行此操作。");
        }
        await sendPasswordResetEmail(auth, email);
        setModalMessage(`已向 ${email} 發送密碼重設電郵。`);
        return true;
      } catch (error) {
        console.error("useUserProfile: 管理員發送密碼重設電郵失敗:", error);
        setModalMessage(`管理員發送密碼重設電郵失敗: ${error.message}`);
        throw error;
      }
    },
    [auth, currentUser, setModalMessage]
  );

  return { updateUserAdminStatus, updateUserProfile, sendPasswordResetLink };
};
