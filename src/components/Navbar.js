// src/components/Navbar.js
"use client";

import React, { useContext, useState } from "react"; // 導入 useState
// 請務必確認以下路徑和檔案名正確無誤：
// 1. 你的專案中 src/lib/ 資料夾下是否存在一個名為 'auth-context.js' 的檔案？
// 2. 檔案的名稱是否完全是 'auth-context.js' (包括大小寫)？
// 3. 該檔案內部是否正確導出了 AuthContext，例如：export const AuthContext = createContext(null);
import { AuthContext } from "../lib/auth-context";

// Navbar 現在接收 onShowLoginModal 和 onShowRegisterModal props
const Navbar = ({ onShowLoginModal, onShowRegisterModal }) => {
  const { currentUser, logout } = useContext(AuthContext); // 從 AuthContext 獲取 logout
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 控制手機版菜單開關

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-md">
      {/* 頂部導航列：Logo、搜尋、帳戶/連結 - 優化響應式布局 */}
      {/* 在大螢幕 (lg+) 時，主容器會使用 justify-between 確保兩端對齊，中間自動撐開 */}
      {/* 在小螢幕時，維持 flex-grow / flex-shrink-0 的邏輯 */}
      <div className="flex items-center w-full p-3 px-4 sm:px-6 lg:px-8 lg:justify-between">
        {" "}
        {/* 添加 lg:justify-between */}
        {/* Logo - flex-shrink-0 在小螢幕不收縮，lg:flex-1 在大螢幕均分 */}
        <div className="flex items-center flex-shrink-0 mr-2 sm:mr-4 lg:flex-1">
          <h1 className="text-xl font-bold text-yellow-500 hover:text-yellow-400 cursor-pointer transition duration-200">
            {" "}
            {/* Logo 文本保持較大，但相較於其他元素已調整 */}
            ChopsBook
          </h1>
          <span className="ml-1 text-xs text-gray-300 hidden sm:block">
            {" "}
            {/* .ca 部分設為 text-xs */}
            .ca
          </span>
        </div>
        {/* 搜尋欄 - flex-grow 盡可能擴展，並在 lg 螢幕時均分空間 */}
        {/* 在小螢幕時移除 justify-center，讓搜尋欄貼近 Logo */}
        <div className="flex-grow flex items-center min-w-0 lg:flex-1 lg:order-2">
          {" "}
          {/* lg:order-2 確保在大螢幕時置中 */}
          <div className="max-w-xl w-full flex">
            {" "}
            {/* 移除 mx-4，間距由 flex 容器的 item 之間決定 */}
            <input
              type="text"
              placeholder="搜尋餐廳、菜系、地點..."
              className="h-10 px-3 py-2 rounded-l-md w-full bg-white text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-transparent" // 輸入框文字設為 text-xs
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
          </div>
        </div>
        {/* 帳戶及其他連結 - ml-auto 將其推到最右邊，flex-shrink-0 確保其緊湊，lg:flex-1 在大螢幕均分 */}
        <div className="flex items-center space-x-2 ml-auto flex-shrink-0 sm:ml-4 lg:flex-1 lg:justify-end lg:order-3">
          {" "}
          {/* lg:justify-end 確保在大螢幕時靠右對齊 */}
          {currentUser ? (
            <div className="flex flex-col items-start group relative">
              <button
                onClick={logout} // 使用從 context 獲取的 logout 函數
                className="font-bold text-white text-xs group-hover:text-yellow-500 transition duration-200 focus:outline-none focus:underline" // 登出按鈕文字設為 text-xs
              >
                {currentUser.email ? currentUser.email.split("@")[0] : "用戶"}{" "}
              </button>
            </div>
          ) : (
            <>
              {" "}
              {/* 使用 Fragment 包裹多個按鈕 */}
              <button
                onClick={onShowLoginModal} // 觸發登入 Modal
                className="flex flex-col items-start group relative text-white hover:text-yellow-500 transition duration-200 focus:outline-none text-xs" // 登入按鈕文字設為 text-xs
              >
                <span className="text-gray-200 font-bold group-hover:text-yellow-500 transition duration-200">
                  登入
                </span>
              </button>
              <button
                onClick={onShowRegisterModal} // 觸發註冊 Modal
                className="flex flex-col items-start group relative text-white hover:text-yellow-500 transition duration-200 focus:outline-none text-xs" // 註冊按鈕文字設為 text-xs
              >
                <span className="text-gray-200 font-bold group-hover:text-yellow-500 transition duration-200">
                  註冊
                </span>
              </button>
            </>
          )}
          {/* 在 lg 螢幕尺寸以上顯示這些連結，在 lg 以下則隱藏 */}
          <a
            href="#"
            className="hover:text-yellow-500 transition duration-200 hidden lg:block text-xs"
          >
            {" "}
            {/* 連結文字設為 text-xs */}
            寫食評
          </a>
          <a
            href="#"
            className="hover:text-yellow-500 transition duration-200 hidden lg:block text-xs"
          >
            {" "}
            {/* 連結文字設為 text-xs */}
            商戶專區
          </a>
          <a
            href="#"
            className="hover:text-yellow-500 transition duration-200 hidden lg:block text-xs"
          >
            {" "}
            {/* 連結文字設為 text-xs */}
            更新餐廳資料
          </a>
          <select className="bg-gray-800 border border-gray-600 rounded-md py-0.5 px-1 text-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500">
            {" "}
            {/* 選擇框文字設為 text-xs */}
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
          <a
            href="#"
            className="hover:text-yellow-500 transition duration-200 text-xs w-full text-center py-1"
          >
            寫食評
          </a>
          <a
            href="#"
            className="hover:text-yellow-500 transition duration-200 text-xs w-full text-center py-1"
          >
            商戶專區
          </a>
          <a
            href="#"
            className="hover:text-yellow-500 transition duration-200 text-xs w-full text-center py-1"
          >
            更新餐廳資料
          </a>
        </div>
      )}

      {/* 次級導航列 (類別/連結) - 所有文字設為 text-xs */}
      <div className="bg-gray-800 text-white text-xs py-2 px-6 w-full flex flex-wrap justify-center  gap-4 sm:gap-6 border-t border-gray-700">
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          所有類別
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          特價優惠
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          最新上架
        </a>

        {/* 語言選擇器已移至主導航列 */}
      </div>
    </nav>
  );
};

export default Navbar;
