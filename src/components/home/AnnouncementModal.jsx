// components/AnnouncementModal.jsx
"use client";

import React from "react";
// 💡 必須從 'next/image' 引入
import Image from "next/image";

/**
 * @typedef {Object} AnnouncementData
 * @property {number} id - 公告的唯一 ID。
 * @property {string} title - 公告標題。
 * @property {string} subtitle - 公告副標題/簡介。
 * @property {string} date - 發佈日期。
 * @property {string} [imageUrl] - (可選) 圖片公告的 URL。
 * @property {React.ReactNode} [details] - (可選) 文字公告的詳細內容 JSX。
 */

/**
 * @typedef {Object} AnnouncementModalProps
 * @property {boolean} isVisible - 控制 Modal 是否顯示。
 * @property {function(): void} onClose - 關閉 Modal 的函數。
 * @property {AnnouncementData | null} data - 傳入完整的公告數據。
 */

/**
 * 詳細內容彈出視窗
 * @param {AnnouncementModalProps} props
 */
const AnnouncementModal = ({ isVisible, onClose, data }) => {
  if (!isVisible || !data) return null;

  const { title, date, imageUrl, details } = data;
  const isImageMode = !!imageUrl;

  // 阻止點擊 Modal 內容時事件冒泡到背景 (防止點擊內容關閉)
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`relative bg-white rounded-xl shadow-2xl transform transition-all duration-300 ${
          isImageMode
            ? "w-full h-full max-w-[90vw] max-h-[90vh] p-2" // 圖片模式：佔滿視口大部分
            : "w-full max-w-lg max-h-[90vh] overflow-y-auto" // 文字模式：固定寬度，可滾動
        }`}
        onClick={handleContentClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* 1. 圖片模式 (Image) */}
        {isImageMode && (
          // 使用 next/image
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority
            style={{ objectFit: "contain" }}
            sizes="90vw"
            className="rounded-lg"
          />
        )}

        {/* 2. 文字模式 (Text) */}
        {!isImageMode && (
          <>
            {/* 頂部 Header - 文字模式有標題和日期 */}
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 z-10">
              <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                {title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">發佈日期: {date}</p>
            </div>

            {/* 內容 Body - 文字模式顯示 details */}
            <div className="p-6 space-y-4">{details}</div>
          </>
        )}

        {/* 關閉按鈕 - 圖片和文字模式共用 */}
        <button
          onClick={onClose}
          className={`absolute z-20 m-4 p-2 transition focus:outline-none 
            ${
              isImageMode
                ? "top-0 right-0 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
                : "top-4 right-4 text-gray-500 hover:text-gray-900 bg-gray-100 rounded-full hover:bg-gray-200"
            }`}
          aria-label="關閉公告"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AnnouncementModal;
