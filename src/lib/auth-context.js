// src/lib/auth-context.js
"use client";

import React, { useState, useEffect, createContext, useCallback } from "react";
// 導入新的 Custom Hooks
import { useAuthCore } from "../hooks/auth/useAuthCore";
import { useAuthOperations } from "../hooks/auth/useAuthOperations";
import { useUserProfile } from "../hooks/auth/useUserProfile";
import { useRestaurantFavorites } from "../hooks/auth/useRestaurantFavorites";
import { useReviewManagement } from "../hooks/auth/useReviewManagement";
import { formatDateTime } from "../hooks/auth/useUtils"; // 從 useUtils 導入格式化函數

// 您不需要在 AuthContext.js 中再次導入 Modal，因為它已經在下面定義
import Modal from "../components/Modal"; // 模態框組件

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info"); // "success", "error", "info"
  const [modalOpen, setModalOpen] = useState(false);

  // 記憶化全局模態框訊息設置函式
  const handleGlobalModalMessage = useCallback((msg, type = "info") => {
    setModalMessage(msg);
    setModalType(type);
    setModalOpen(true);
  }, []);

  // 核心認證和 Firebase 實例
  const {
    currentUser,
    loadingUser,
    authReady, // <<< 新增：從 useAuthCore 獲取 authReady 狀態
    db,
    auth, // 獲取 auth 物件
    storage,
    analytics,
    appId,
    app,
    setCurrentUser,
  } = useAuthCore(handleGlobalModalMessage);

  // 認證操作 (登入、註冊、登出、重設密碼)
  const { login, signup, logout, sendPasswordReset } = useAuthOperations(
    auth,
    db,
    appId,
    handleGlobalModalMessage,
    // 修正點: 新增 setCurrentUser 到 useAuthOperations 的參數中
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
      handleGlobalModalMessage
    );

  // 餐廳收藏管理，現在也從 useRestaurantFavorites 獲取 `favoriteRestaurantsCount`
  const { toggleFavoriteRestaurant, favoriteRestaurantsCount } =
    useRestaurantFavorites(
      db,
      currentUser,
      appId,
      setCurrentUser,
      handleGlobalModalMessage
    );

  // 食評管理 (提交、草稿、審核)
  const { submitReview, saveReviewDraft, checkModeration } =
    useReviewManagement(
      db,
      currentUser,
      appId,
      setCurrentUser,
      handleGlobalModalMessage
    );

  const closeMessageModal = useCallback(() => {
    setModalOpen(false);
    setModalMessage("");
    setModalType("info");
  }, []);

  // 判斷是否為管理員
  const isAdmin = currentUser && currentUser.isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loadingUser,
        authReady, // <<< 新增：將 authReady 狀態暴露給 Context
        db,
        auth, // <<< 修正點：將 auth 物件傳遞給 Context
        storage,
        analytics,
        appId,
        app,
        setModalMessage: handleGlobalModalMessage,
        login,
        signup,
        logout,
        isAdmin,
        updateUserAdminStatus,
        sendPasswordReset,
        updateUserProfile,
        sendPasswordResetLink,
        toggleFavoriteRestaurant,
        favoriteRestaurantsCount,
        submitReview,
        saveReviewDraft,
        checkModeration,
        formatDateTime,
        setCurrentUser,
      }}
    >
      {children}
      {modalOpen && modalMessage && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
            modalType === "success" ? "bg-green-100 bg-opacity-75" : ""
          } ${modalType === "error" ? "bg-red-100 bg-opacity-75" : ""} ${
            modalType === "info" ? "bg-blue-100 bg-opacity-75" : ""
          }`}
          onClick={closeMessageModal} // 點擊背景關閉
        >
          <div
            className={`bg-white rounded-lg shadow-xl p-6 max-w-sm w-full relative transform transition-all duration-300 scale-100 opacity-100
            ${modalType === "success" ? "border-green-400 border-2" : ""}
            ${modalType === "error" ? "border-red-400 border-2" : ""}
            ${modalType === "info" ? "border-blue-400 border-2" : ""}`}
            onClick={(e) => e.stopPropagation()} // 阻止事件冒泡到背景
          >
            <button
              onClick={closeMessageModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl font-bold"
              aria-label="Close"
            >
              &times;
            </button>
            <p
              className={`text-center text-lg ${
                modalType === "success" ? "text-green-700" : ""
              } ${modalType === "error" ? "text-red-700" : ""} ${
                modalType === "info" ? "text-blue-700" : ""
              }`}
            >
              {modalMessage}
            </p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
