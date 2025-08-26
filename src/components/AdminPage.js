// src/components/AdminPage.js
"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../lib/auth-context";
import {
  doc, // 雖然這裡不再直接使用 getDoc, 但為了 Firebase Firestore 相關操作，通常仍會保留
  getDoc, // 為了某些情況下的獲取數據，保留 getDoc
  collection, // collection 仍被 AdminPage 的 useEffect 用於獲獲取用戶 ID
  getDocs, // getDocs 仍被 AdminPage 的 useEffect 用於獲取用戶 ID
} from "firebase/firestore";
import Modal from "./Modal";
import { useRouter } from "next/navigation";
import LoadingSpinner from "./LoadingSpinner"; // 確保 LoadingSpinner 檔案存在

// 導入新的管理組件
import RestaurantManagement from "./admin/RestaurantManagement";
import UserRequestManagement from "./admin/UserRequestManagement";
import ReviewManagement from "./admin/ReviewManagement";
import RatingsPage from "./admin/RatingsPage";
import UserManagement from "./admin/UserManagement"; // 導入新的 UserManagement 組件

const AdminPage = ({ onBackToHome }) => {
  // 從 AuthContext 獲取所需的功能，移除了 setModalMessage 以避免衝突
  const {
    currentUser,
    db,
    updateUserAdminStatus,
    appId,
    formatDateTime,
    loadingUser,
  } = useContext(AuthContext);
  const router = useRouter();

  // AdminPage 自己的模態框狀態
  const [modalMessage, setModalMessage] = useState("");
  const [activeSection, setActiveSection] = useState("users"); // 控制當前顯示的管理區塊

  // 移除了本地的 formatDateTime 輔助函數，現在從 AuthContext 獲取。
  // 移除了 AdminPage 中直接獲取用戶列表的邏輯，現在由 UserManagement 組件處理。
  // 移除了 AdminPage 中直接處理更新用戶管理員權限的邏輯，現在由 UserManagement 組件處理。

  const closeModal = () => setModalMessage("");

  // React Hook "useEffect" is called conditionally. (已修正)
  // 將權限檢查和重定向的 useEffect 移至頂層。
  useEffect(() => {
    if (loadingUser) {
      return; // 等待用戶載入完成
    }

    // 如果用戶未登入，導向登入頁面
    if (!currentUser) {
      router.push("/login");
      setModalMessage("請先登入才能訪問管理員頁面。");
      return;
    }

    // 如果用戶已登入但不是管理員，則導向首頁並顯示無權限訊息
    if (!currentUser?.isAdmin) {
      setModalMessage("您沒有權限訪問此管理員頁面。");
      const timer = setTimeout(() => {
        window.location.href = "/";
      }, 3000); // 3秒後跳轉

      return () => clearTimeout(timer);
    }
  }, [currentUser, loadingUser, router, setModalMessage]); // 確保所有依賴都包含在內

  // 由於用戶列表的載入邏輯已移至 UserManagement，
  // AdminPage 自身的載入狀態僅在 currentUser 載入時需要。
  // 一旦 currentUser 載入完成，我們就可以渲染 AdminPage 及其內部組件了。
  // UserManagement 會有自己的 loadingUsers 狀態。
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
        <p className="text-lg text-gray-700 ml-4">正在檢查您的權限...</p>
      </div>
    );
  }

  // 如果已登入且不是管理員，顯示權限不足訊息 (useEffect 會處理重定向)
  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-red-600">
          {modalMessage || "正在驗證您的權限..."}
        </p>
        <Modal
          message={modalMessage}
          onClose={closeModal}
          isOpen={!!modalMessage}
          type="error"
        />
      </div>
    );
  }

  // 如果是管理員，渲染管理員頁面內容
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 p-4 font-inter">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 lg:p-8">
        {/* 頁面標題和返回按鈕 */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 sm:mb-0">
            管理員控制台
          </h1>
          <button
            onClick={onBackToHome}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-md flex items-center space-x-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span>返回首頁</span>
          </button>
        </div>
        {/* 當前管理員資訊 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-6 mb-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
            <span className="text-blue-700 font-bold text-2xl">
              {currentUser?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-semibold text-xl text-gray-900">
              {currentUser?.email}
            </p>
            <p className="text-sm text-blue-700 mt-1">您是當前登入的管理員。</p>
          </div>
        </div>
        {/* 導航欄 */}
        <nav className="bg-white rounded-lg shadow-md mb-8 p-2 border border-gray-200">
          <ul className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4">
            <li>
              <button
                onClick={() => setActiveSection("users")}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeSection === "users"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                用戶管理
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("restaurants")}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeSection === "restaurants"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                餐廳管理
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("requests")}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeSection === "requests"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                用家請求管理
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("reviews")}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeSection === "reviews"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                食評管理
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("ratings")}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeSection === "ratings"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                評級頁面 (未開發)
              </button>
            </li>
          </ul>
        </nav>
        {/* 內容區塊：根據 activeSection 顯示不同內容 */}
        {activeSection === "users" && (
          <UserManagement setParentModalMessage={setModalMessage} />
        )}{" "}
        {/* 渲染 UserManagement */}
        {activeSection === "restaurants" && <RestaurantManagement />}
        {activeSection === "requests" && <UserRequestManagement />}
        {activeSection === "reviews" && <ReviewManagement />}
        {activeSection === "ratings" && <RatingsPage />}
        {/* 使用說明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8 shadow-sm">
          <h3 className="text-xl font-semibold text-blue-800 mb-3">使用說明</h3>
          <ul className="text-sm text-blue-700 space-y-2 list-disc pl-5">
            <li>
              • 您可以在 Firebase Console 中直接修改用戶的{" "}
              <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded-md text-xs font-mono">
                isAdmin
              </code>{" "}
              字段
            </li>
            <li>• 或者使用本頁面中的按鈕來修改用戶權限</li>
            <li>• 管理員權限變更會立即生效</li>
            <li>• 請謹慎操作，確保不會意外移除自己的管理員權限</li>
            <li>• 點擊「查看詳細」按鈕可以查看和編輯用戶的個人資料</li>
            <li>• 使用上方的導航欄切換不同的管理區塊</li>
          </ul>
        </div>
      </div>
      <Modal message={modalMessage} onClose={closeModal} />
    </div>
  );
};

export default AdminPage;
