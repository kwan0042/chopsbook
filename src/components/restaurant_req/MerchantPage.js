// src/components/MerchantPage.js
"use client";

import React, { useState } from "react";
import Modal from "../Modal"; // 確保 Modal 組件已導入
import { useRouter } from "next/navigation"; // 導入 useRouter

// 導入 FontAwesome 相關組件和圖示
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPenToSquare,
  faGift,
} from "@fortawesome/free-solid-svg-icons";

/**
 * MerchantPage: 商戶專區頁面組件。
 * 提供關於為餐廳商家服務的資訊，並包含功能按鈕。
 * @param {object} props - 組件屬性。
 * @param {function} props.onBackToHome - 回到主頁的回調函數。
 */
const MerchantPage = ({ onBackToHome }) => {
  const [modalMessage, setModalMessage] = useState("");
  const router = useRouter(); // 初始化 useRouter

  const handleAddPromotionClick = () => {
    setModalMessage("新增推廣優惠活動功能尚待開發。請稍後再試。");
  };

  const closeModal = () => {
    setModalMessage("");
  };

  const handleShowAddRestaurantPage = () => {
    router.push("/merchant/add");
  };

  const handleShowUpdateRestaurantPage = () => {
    router.push("/merchant/update");
  };

  return (
    // 最外層 div：背景全寬，提供外邊距和居中 flex 佈局
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center font-inter">
      {/* 內容 div：設定最大寬度，居中，帶白色背景和陰影 */}
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl relative">
        <button
          onClick={onBackToHome}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
          aria-label="返回首頁"
        >
          &times;
        </button>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6 text-center">
          餐廳管理專區
        </h2>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed text-center">
          歡迎來到 ChopsBook 餐廳管理專區！請選擇您要執行的操作。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* 新增餐廳按鈕 */}
          <button
            onClick={handleShowAddRestaurantPage}
            className="flex flex-col items-center justify-center p-6 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transform hover:scale-105 transition duration-300 ease-in-out text-center min-h-[150px]"
          >
            <FontAwesomeIcon
              icon={faPlus}
              className="h-16 w-16 mb-3"
              size="3x"
            />
            <span className="text-xl ">新增餐廳</span>
            <span className="text-sm opacity-90">提供您的餐廳詳細資訊</span>
          </button>

          {/* 更新餐廳按鈕 */}
          <button
            onClick={handleShowUpdateRestaurantPage}
            className="flex flex-col items-center justify-center p-6 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transform hover:scale-105 transition duration-300 ease-in-out text-center min-h-[150px]"
          >
            <FontAwesomeIcon
              icon={faPenToSquare}
              className="h-16 w-16 mb-3"
              size="3x"
            />
            <span className="text-xl ">更新餐廳</span>
            <span className="text-sm opacity-90">修改現有餐廳資料</span>
          </button>

          {/* 新增推廣優惠活動按鈕 */}
          <button
            onClick={handleAddPromotionClick}
            className="flex flex-col items-center justify-center p-6 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transform hover:scale-105 transition duration-300 ease-in-out text-center min-h-[150px]"
          >
            <FontAwesomeIcon
              icon={faGift}
              className="h-16 w-16 mb-3"
              size="3x"
            />
            <span className="text-xl ">新增推廣優惠</span>
            <span className="text-sm opacity-90">建立您的最新優惠活動</span>
          </button>
        </div>
      </div>
      <Modal message={modalMessage} onClose={closeModal} />
    </div>
  );
};

export default MerchantPage;
