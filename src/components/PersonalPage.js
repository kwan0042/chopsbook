// src/components/PersonalPage.js
"use client";

import React from "react";

/**
 * PersonalPage: 用戶的個人主頁。
 * 目前為佔位內容，未來可擴展為顯示用戶資訊、訂單歷史等。
 * @param {object} props - 組件屬性。
 * @param {function} props.onBackToHome - 返回主頁的回調函數。
 */
const PersonalPage = ({ onBackToHome }) => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-3xl relative">
        <button
          onClick={onBackToHome}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
          aria-label="返回首頁"
        >
          &times;
        </button>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
          個人主頁
        </h2>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed text-center">
          這裡是你的個人主頁。你可以在這裡管理你的個人資料、訂單、評論等。
        </p>

        <div className="text-center mt-8">
          <p className="text-gray-600">此頁面功能目前正在開發中。</p>
          <button
            onClick={onBackToHome}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
          >
            返回主頁
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalPage;
