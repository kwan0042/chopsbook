"use client";

import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";

/**
 * Admin Layout: 包含所有管理頁面共用的 UI 和邏輯。
 * 它會檢查用戶是否登入以及是否為管理員，並提供共享的導航。
 */
export default function AdminLayout({ children }) {
  const { currentUser, loadingUser, isAdmin } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  const [localModalMessage, setLocalModalMessage] = useState("");
  const closeModal = () => setLocalModalMessage("");

  useEffect(() => {
    if (loadingUser) {
      return;
    }

    // 如果未登入或不是管理員，則導航到首頁
    if (!currentUser) {
      router.push("/login");
    } else if (!isAdmin) {
      setLocalModalMessage("您沒有權限訪問管理員頁面。請使用管理員帳戶登入。");
      const timer = setTimeout(() => {
        router.push("/");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, loadingUser, isAdmin, router]);

  // 如果 AuthContext 仍在初始化，顯示全域載入狀態
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // 如果未登入或不是管理員（且 loadingUser 為 false），則不渲染內容
  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-red-600">
          {localModalMessage || "正在驗證您的權限..."}
        </p>
        <Modal
          message={localModalMessage}
          onClose={closeModal}
          isOpen={!!localModalMessage}
          type="error"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 p-4 font-inter">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 sm:mb-0">
            管理員控制台
          </h1>
          <button
            onClick={() => router.push("/")}
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
          </ul>
        </nav>
        {children}
      </div>
      <Modal message={localModalMessage} onClose={closeModal} />
    </div>
  );
}
