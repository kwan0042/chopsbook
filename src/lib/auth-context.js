// src/lib/auth-context.js
"use client";

import React, { useState, useEffect, createContext } from "react";
// 導入新的 Custom Hooks
import { useAuthCore } from "../hooks/auth/useAuthCore";
import { useAuthOperations } from "../hooks/auth/useAuthOperations";
import { useUserProfile } from "../hooks/auth/useUserProfile";
import { useRestaurantFavorites } from "../hooks/auth/useRestaurantFavorites";
import { useReviewManagement } from "../hooks/auth/useReviewManagement";
import { formatDateTime } from "../hooks/auth/useUtils"; // 從 useUtils 導入格式化函數

import Modal from "../components/Modal"; // 模態框組件

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [modalMessage, setModalMessage] = useState("");

  // 核心認證和 Firebase 實例，並獲取 setCurrentUser
  const {
    currentUser,
    loadingUser,
    db,
    auth,
    analytics,
    appId,
    setCurrentUser,
  } = useAuthCore(setModalMessage);

  // 認證操作 (登入、註冊、登出、重設密碼)
  const { login, signup, logout, sendPasswordReset } = useAuthOperations(
    auth,
    db,
    currentUser,
    appId,
    setModalMessage,
    setCurrentUser
  );

  // 用戶個人資料管理 (更新資料、管理員權限、管理員發送重設密碼鏈接)
  const { updateUserAdminStatus, updateUserProfile, sendPasswordResetLink } =
    useUserProfile(
      db,
      auth,
      currentUser,
      appId,
      setCurrentUser,
      setModalMessage
    );

  // 餐廳收藏管理
  const { toggleFavoriteRestaurant } = useRestaurantFavorites(
    db,
    currentUser,
    appId,
    setCurrentUser,
    setModalMessage
  );

  // 食評管理 (提交、草稿、審核)
  const { submitReview, saveReviewDraft, checkModeration } =
    useReviewManagement(
      db,
      currentUser,
      appId,
      setCurrentUser,
      setModalMessage
    );

  const closeModal = () => setModalMessage("");

  // 判斷是否為管理員
  const isAdmin = currentUser && currentUser.isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loadingUser,
        db,
        auth,
        analytics,
        appId,
        setModalMessage,
        login,
        signup,
        logout,
        isAdmin,
        updateUserAdminStatus,
        sendPasswordReset,
        updateUserProfile,
        sendPasswordResetLink,
        toggleFavoriteRestaurant,
        submitReview,
        saveReviewDraft,
        checkModeration,
        formatDateTime, // 確保格式化函數仍然暴露
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
