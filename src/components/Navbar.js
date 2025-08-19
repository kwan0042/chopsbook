// src/components/Navbar.js
"use client";

import React, { useContext, useState } from "react";
import { AuthContext } from "../lib/auth-context"; // 確保路徑正確

// Navbar 現在接收 onShowLoginModal, onShowFilterModal, onShowMerchantPage 和 onShowAdminPage props
const Navbar = ({
  onShowLoginModal,
  onShowFilterModal,
  onShowMerchantPage,
  onShowAdminPage,
}) => {
  const { currentUser, logout } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 控制手機版菜單開關

  // 簡化 Admin 權限檢查：如果用戶已登入且 email 是 admin@example.com (僅限範例)
  // 在實際應用中，會基於 Firestore 中的用戶角色來判斷
  const isAdmin = currentUser && currentUser.email === "kwan6d16@gmail.com"; // 替換為你的 admin email

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-md">
      {/* 頂部導航列：Logo、搜尋、帳戶/連結 - 優化響應式布局 */}
      <div className="flex items-center w-full p-3 px-4 sm:px-6 lg:px-8 lg:justify-between">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 mr-2 sm:mr-4 lg:flex-1">
          <h1 className="text-xl font-bold text-yellow-500 hover:text-yellow-400 cursor-pointer transition duration-200">
            ChopsBook
          </h1>
          <span className="ml-1 text-xs text-gray-300 hidden sm:block">
            .ca
          </span>
        </div>

        {/* 搜尋欄 */}
        <div className="flex-grow flex items-center min-w-0 lg:flex-1 lg:order-2">
          <div className="max-w-xl w-full flex">
            <input
              type="text"
              placeholder="搜尋餐廳、菜系、地點..."
              className="h-10 px-3 py-2 rounded-l-md w-full bg-white text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-transparent"
            />
            <button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 h-10 p-2.5 rounded-r-md transition duration-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {/* 篩選按鈕 */}
            <button
              onClick={onShowFilterModal}
              className="bg-gray-700 hover:bg-gray-600 text-white h-10 p-2.5 rounded-md ml-2 transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              aria-label="打開篩選器"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V19l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 帳戶及其他連結 */}
        <div className="flex items-center space-x-2 ml-auto flex-shrink-0 sm:ml-4 lg:flex-1 lg:justify-end lg:order-3">
          {currentUser ? (
            <div className="flex flex-col items-start group relative">
              <button
                onClick={logout}
                className="font-bold text-white text-xs group-hover:text-yellow-500 transition duration-200 focus:outline-none focus:underline"
              >
                {currentUser.email ? currentUser.email.split("@")[0] : "用戶"}{" "}
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={onShowLoginModal}
                className="flex flex-col items-start group relative text-white hover:text-yellow-500 transition duration-200 focus:outline-none text-xs"
              >
                <span className="text-gray-200 font-bold group-hover:text-yellow-500 transition duration-200">
                  登入
                </span>
              </button>
            </>
          )}
          {/* 新增「餐廳專區」按鈕 */}
          <button
            onClick={onShowMerchantPage}
            className="hover:text-yellow-500 transition duration-200 bg-transparent border-none text-white cursor-pointer p-0 m-0 text-xs"
          >
            餐廳專區
          </button>
          <a
            href="#"
            className="hover:text-yellow-500 transition duration-200 hidden lg:block text-xs"
          >
            寫食評
          </a>
          {/* 僅當用戶是管理員時顯示「管理員頁面」按鈕 */}
          {isAdmin && (
            <button
              onClick={onShowAdminPage}
              className="hover:text-yellow-500 transition duration-200 bg-transparent border-none text-white cursor-pointer p-0 m-0 text-xs"
            >
              管理員頁面
            </button>
          )}
          <select className="bg-gray-800 border border-gray-600 rounded-md py-0.5 px-1 text-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500">
            <option>繁體中文</option>
            <option>English</option>
          </select>

          {/* 手機版菜單圖標 (在 lg 螢幕以上隱藏) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="ml-2 lg:hidden p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            aria-label="打開菜單"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 手機版下拉菜單 (在 lg 螢幕以上隱藏) - 根據 isMobileMenuOpen 狀態顯示 */}
      {isMobileMenuOpen && (
        <div className="lg:hidden w-full bg-gray-800 border-t border-gray-700 py-2 px-4 flex flex-col items-center space-y-2">
          <button
            onClick={onShowMerchantPage}
            className="hover:text-yellow-500 transition duration-200 text-xs w-full text-center py-1 bg-transparent border-none text-white cursor-pointer"
          >
            餐廳專區
          </button>
          <a
            href="#"
            className="hover:text-yellow-500 transition duration-200 text-xs w-full text-center py-1"
          >
            寫食評
          </a>
          {isAdmin && (
            <button
              onClick={onShowAdminPage}
              className="hover:text-yellow-500 transition duration-200 text-xs w-full text-center py-1 bg-transparent border-none text-white cursor-pointer"
            >
              管理員頁面
            </button>
          )}
        </div>
      )}

      {/* 次級導航列 (類別/連結) - 所有文字設為 text-xs */}
      <div className="bg-gray-800 text-white text-xs py-2 px-6 w-full flex flex-wrap justify-center gap-4 sm:gap-6 border-t border-gray-700">
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          所有類別
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          特價優惠
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          最新上架
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
