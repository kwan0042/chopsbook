// src/components/MerchantPage.js
"use client";

import React, { useState } from "react";
import Modal from "./Modal"; // 確保 Modal 組件已導入

/**
 * MerchantPage: 商戶專區頁面組件。
 * 提供關於為餐廳商家服務的資訊，並包含功能按鈕。
 * @param {object} props - 組件屬性。
 * @param {function} props.onBackToHome - 回到主頁的回調函數。
 * @param {function} props.onShowAddRestaurantPage - 導航到新增餐廳頁面的回調。
 * @param {function} props.onShowUpdateRestaurantPage - 導航到更新餐廳頁面的回調 (新增)。
 */
const MerchantPage = ({
  onBackToHome,
  onShowAddRestaurantPage,
  onShowUpdateRestaurantPage,
}) => {
  const [modalMessage, setModalMessage] = useState("");

  const handleAddPromotionClick = () => {
    setModalMessage("新增推廣優惠活動功能尚待開發。請稍後再試。");
  };

  const closeModal = () => {
    setModalMessage("");
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl relative">
        <button
          onClick={onBackToHome}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
          aria-label="返回首頁"
        >
          &times;
        </button>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
          商戶專區
        </h2>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed text-center">
          歡迎來到 ChopsBook 商戶專區！請選擇您要執行的操作。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* 新增餐廳按鈕 */}
          <button
            onClick={onShowAddRestaurantPage}
            className="flex flex-col items-center justify-center p-6 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transform hover:scale-105 transition duration-300 ease-in-out text-center min-h-[150px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xl font-bold">新增餐廳</span>
            <span className="text-sm opacity-90">提供您的餐廳詳細資訊</span>
          </button>

          {/* 更新餐廳按鈕 */}
          <button
            onClick={onShowUpdateRestaurantPage} // 現在導航到更新頁面
            className="flex flex-col items-center justify-center p-6 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transform hover:scale-105 transition duration-300 ease-in-out text-center min-h-[150px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span className="text-xl font-bold">更新餐廳</span>
            <span className="text-sm opacity-90">修改現有餐廳資料</span>
          </button>

          {/* 新增推廣優惠活動按鈕 */}
          <button
            onClick={handleAddPromotionClick}
            className="flex flex-col items-center justify-center p-6 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transform hover:scale-105 transition duration-300 ease-in-out text-center min-h-[150px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l-6 6-4-4m-2 8h16a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xl font-bold">新增推廣優惠</span>
            <span className="text-sm opacity-90">建立您的最新優惠活動</span>
          </button>
        </div>
      </div>
      <Modal message={modalMessage} onClose={closeModal} />
    </div>
  );
};

export default MerchantPage;
