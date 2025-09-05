// src/hooks/auth/useUserProfile.js
"use client";

import { useCallback } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
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
  const updateUserAdminStatus = useCallback(
    async (userId, isAdmin) => {
      if (!auth.currentUser) {
        setModalMessage("認證失敗，請重新登入。", "error");
        return;
      }

      try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch("/api/admin/manage-users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            action: "updateAdminStatus",
            targetUid: userId,
            newStatus: isAdmin,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // 在 API 請求成功後，同時更新 Firestore 中的 isAdmin 欄位
          // 現在直接更新頂層文檔
          const userDocRef = doc(db, `artifacts/${appId}/users/${userId}`);
          await setDoc(userDocRef, { isAdmin: isAdmin }, { merge: true });

          setModalMessage(data.message, "success");

          // 如果更新的是當前登入的使用者自己，也更新客戶端狀態
          if (currentUser.uid === userId) {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setCurrentUser({ ...currentUser, ...userData });
            }
          }
        } else {
          throw new Error(data.message || "更新管理員狀態失敗。");
        }

        return true;
      } catch (error) {
        console.error("useUserProfile: 更新用戶管理員權限失敗:", error);
        setModalMessage(`更新用戶管理員權限失敗: ${error.message}`, "error");
        throw error;
      }
    },
    [db, appId, auth, currentUser, setCurrentUser, setModalMessage]
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

        // 修正點：只更新頂層文檔，避免資料庫不一致
        const userDocRef = doc(db, `artifacts/${appId}/users/${userId}`);
        await updateDoc(userDocRef, updates);

        if (currentUser && currentUser.uid === userId) {
          setCurrentUser((prevUser) => ({ ...prevUser, ...updates }));
        }

        return true;
      } catch (error) {
        console.error("useUserProfile: 更新用戶資料失敗:", error);
        setModalMessage(`更新用戶資料失敗: ${error.message}`, "error");
        throw error;
      }
    },
    [db, appId, currentUser, setCurrentUser, setModalMessage]
  );

  const sendPasswordResetLink = useCallback(
    async (email) => {
      if (!auth.currentUser) {
        setModalMessage("認證失敗，請重新登入。", "error");
        return;
      }

      try {
        if (!isValidEmail(email)) {
          throw new Error("無效的電子郵件格式。");
        }

        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch("/api/admin/manage-users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            action: "sendPasswordResetLink",
            email,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setModalMessage(`已向 ${email} 發送密碼重設電郵。`, "success");
        } else {
          throw new Error(data.message || "發送重設密碼連結失敗。");
        }

        return true;
      } catch (error) {
        console.error("useUserProfile: 管理員發送密碼重設電郵失敗:", error);
        setModalMessage(
          `管理員發送密碼重設電郵失敗: ${error.message}`,
          "error"
        );
        throw error;
      }
    },
    [auth, setModalMessage]
  );

  return { updateUserAdminStatus, updateUserProfile, sendPasswordResetLink };
};
