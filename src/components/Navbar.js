// src/components/Navbar.js
"use client";

import React, { useContext } from "react";
import { AuthContext } from "../lib/auth-context"; // 從新的 auth-context.js 導入
import { signOut } from "firebase/auth"; // 導入 signOut

const Navbar = ({ onShowLogin }) => {
  const { currentUser, auth, setModalMessage } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("登出失敗:", error);
      setModalMessage(`登出失敗: ${error.message}`);
    }
  };

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-md">
      {/* Top Nav Bar */}
      <div className="flex items-center justify-between p-3 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 mr-4">
          <h1 className="text-2xl font-bold text-yellow-500 hover:text-yellow-400 cursor-pointer transition duration-200">
            ChopsBook
          </h1>
          <span className="ml-2 text-sm text-gray-300 hidden sm:block">
            .ca
          </span>
        </div>

        {/* Search Bar (integrated into Navbar) */}
        <div className="flex-grow flex items-center mx-4 max-w-xl">
          <input
            type="text"
            placeholder="搜尋餐廳、菜系、地點..."
            className="h-10 px-3 py-2 rounded-l-md w-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-transparent"
            // 調整: 移除 p-2.5，改為 h-10 和 px-3 py-2 以確保高度一致且有內部間距
          />
          <button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 h-10 p-2.5 rounded-r-md transition duration-200">
            {/* 調整: 添加 h-10 */}
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
        </div>

        {/* Account & Other Links */}
        <div className="flex items-center space-x-4 ml-4 flex-shrink-0">
          {currentUser ? (
            <div className="flex flex-col items-start group relative">
              <button
                onClick={handleLogout}
                className="font-bold text-white hover:text-yellow-500 transition duration-200 focus:outline-none focus:underline"
              >
                你好{" "}
                {currentUser.email ? currentUser.email.split("@")[0] : "用戶"}{" "}
                <span className="hidden sm:inline">帳戶 & 列表</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onShowLogin}
              className="flex flex-col items-start group relative text-white hover:text-yellow-500 transition duration-200 focus:outline-none text-sm"
            >
              {/* 將 group-hover 直接應用於 span 以改變文字顏色 */}
              <span className="text-gray-200 font-bold group-hover:text-yellow-500 transition duration-200">
                登入
              </span>
            </button>
          )}

          <a
            href="#"
            className="flex flex-col items-start text-white hover:text-yellow-500 transition duration-200 text-sm hidden md:block"
          >
            <span className="font-bold">我的訂單</span>
          </a>

          <a
            href="#"
            className="flex items-center text-white hover:text-yellow-500 transition duration-200 text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="font-bold">購物車</span>
          </a>
        </div>
      </div>

      {/* Secondary Nav Bar (Categories/Links) */}
      <div className="bg-gray-800 text-white text-sm py-2 px-6 w-full flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 border-t border-gray-700">
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          所有類別
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          特價優惠
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          最新上架
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          寫食評
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          更新餐廳資料
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          商戶專區
        </a>
        {/* Language selector moved here for better consistency with Amazon's bottom nav */}
        <select className="bg-gray-800 border border-gray-600 rounded-md py-0.5 px-1 text-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500">
          <option>繁體中文</option>
          <option>English</option>
        </select>
      </div>
    </nav>
  );
};

export default Navbar;
