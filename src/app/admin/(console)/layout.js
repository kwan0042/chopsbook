// src/app/admin/(console)/layout.js
"use client";

import React, { useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "../../../lib/auth-context";
import LoadingSpinner from "../../../components/LoadingSpinner";
import Modal from "../../../components/Modal";

/**
 * 判斷當前路徑是否在 [xxx] 動態資料夾
 * 規則：
 * - /admin/.../[id] → 跳過 AdminLayout
 */
function isInsideDynamicFolder(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.some(
    (segment) => segment.startsWith("[") && segment.endsWith("]")
  );
}

/**
 * Admin Layout: 包含所有管理頁面共用的 UI 和邏輯。
 * 預設會包住所有 `/admin/*` 路由，但 `[xxx]` 動態資料夾會交給子 layout。
 */
export default function AdminLayout({ children }) {
  const { currentUser, loadingUser, isAdmin } = useContext(AuthContext);
  const pathname = usePathname();

  const [localModalMessage, setLocalModalMessage] = useState("");
  const closeModal = () => setLocalModalMessage("");

  // 🔑 權限檢查
  useEffect(() => {
    // 等待用戶狀態載入完成
    if (loadingUser) return;

    // 如果未登入，重導向到登入頁
    if (!currentUser) {
      redirect("/login");
    }

    // 如果已登入但不是管理員，顯示訊息並重導向到首頁
    if (!isAdmin) {
      setLocalModalMessage("您沒有權限訪問管理員頁面。請使用管理員帳戶登入。");
      const timer = setTimeout(() => {
        redirect("/");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, loadingUser, isAdmin]);

  // ⏳ 載入中 (在權限檢查前，如果 loadingUser 為 true，顯示載入狀態)
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // ❌ 無權限 (當 loadingUser 為 false 且無權限時，顯示錯誤訊息)
  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-xl text-red-600 font-semibold text-center mb-4">
          {localModalMessage || "正在驗證您的權限..."}
        </p>
        <LoadingSpinner />
        <Modal
          message={localModalMessage}
          onClose={closeModal}
          isOpen={!!localModalMessage}
          type="error"
        />
      </div>
    );
  }

  // 🛠️ 如果在 [xxx] 動態資料夾 → 跳過父層 layout
  if (isInsideDynamicFolder(pathname)) {
    return <>{children}</>;
  }

  // 🌟 一般情況：完整 Admin Layout
  return (
    <div className="min-h-screen bg-cbbg p-4 font-inter">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 lg:p-8">
        {/* Header */}
        <div className="flex md:flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-extrabold text-gray-900 md:mb-4 ">
            管理員控制台
          </h1>
          <button
            onClick={() => redirect("/")}
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

        {/* User Info */}
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

        {/* Navigation */}
        <nav className="bg-white rounded-lg shadow-md mb-8 p-2 border border-gray-200">
          <ul className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4">
            <li>
              <Link href="/admin">
                <button
                  className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                    pathname === "/admin"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  用戶管理
                </button>
              </Link>
            </li>
            <li>
              <Link href="/admin/admin_restaurants">
                <button
                  className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                    pathname.startsWith("/admin/admin_restaurants")
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  餐廳管理
                </button>
              </Link>
            </li>
            <li>
              <Link href="/admin/admin_requests">
                <button
                  className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                    pathname.startsWith("/admin/admin_requests")
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  用家請求管理
                </button>
              </Link>
            </li>
            <li>
              <Link href="/admin/admin_reviews">
                <button
                  className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                    pathname.startsWith("/admin/admin_reviews")
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  食評管理
                </button>
              </Link>
            </li>
            <li>
              <Link href="/admin/admin_ratings">
                <button
                  className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                    pathname.startsWith("/admin/admin_ratings")
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  評級頁面 (未開發)
                </button>
              </Link>
            </li>
            <li>
              <Link href="/admin/admin_blogs">
                <button
                  className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                    pathname.startsWith("/admin/admin_ratings")
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  文章管理
                </button>
              </Link>
            </li>
          </ul>
        </nav>

        {/* 渲染子頁面內容 */}
        {children}
      </div>
      <Modal message={localModalMessage} onClose={closeModal} />
    </div>
  );
}
