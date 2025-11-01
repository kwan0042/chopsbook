"use client";

import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";

// ----------------------------------------------------
// 輔助組件：Promotion Modal 內容
// ----------------------------------------------------
const PromotionModalContent = ({ promotion, isMobileView }) => {
  // 預覽時不需要真正的 ImageFullScreenModal，我們只顯示圖片
  const openImageModal = () => alert("在真實頁面中，點擊圖片會全螢幕顯示。");

  // 預覽的發佈時間
  const formattedUpdatedAt = promotion.updatedAt;

  // 模擬 Modal 內容區域的滾動和佈局
  // 注意：這裡的 w/h 僅模擬 Modal 內部的尺寸限制
  const modalClasses = isMobileView
    ? "w-full max-w-sm h-full max-h-[600px] flex flex-col overflow-y-auto"
    : "w-full max-w-[90vw] h-full max-h-[600px] flex flex-col md:flex-row overflow-y-auto";

  return (
    <div className={`relative bg-white rounded-lg shadow-xl m-5 ${modalClasses}`}>
      {/* 封面圖片 - 網頁版在左 */}
      <div
        className={`relative ${
          isMobileView ? "w-full h-[400px]" : "w-full md:w-1/2 h-[600px] p-4 "
        } flex-shrink-0    `}
        onClick={openImageModal}
        role="button"
      >
        <div className={`relative ${
          isMobileView ? "w-full h-full" : "w-full  h-full"
        } `}>
          <Image
            src={promotion.coverUrl}
            alt={promotion.title}
           fill
            sizes={isMobileView ? "100vh" : " 100vh"}
            style={{ objectFit: "contain" }}
            className="rounded-lg"
            priority
          />
        </div>
      </div>

      {/* 內容區域 */}
      <div
        className={`p-4 ${
          isMobileView ? "w-full" : "md:w-1/2"
        } flex-grow flex flex-col ${
          isMobileView ? "h-auto" : "md:h-full md:overflow-y-auto"
        }`}
      >
        {/* 標題 */}
        <h1 className="flex-shrink-0 text-lg font-extrabold text-gray-900 mb-1 ">
          {promotion.title}
        </h1>
        {/* 副標題 / 信息 */}
        <div className="flex-shrink-0 text-sm text-gray-500 mb-1 border-b pb-1">
          <p className="font-semibold text-gray-700 mb-2">
            {promotion.subtitle}
          </p>

          <p className="font-semibold text-xs text-gray-700 mb-2">
            優惠期由 {promotion.promoStart} 開始至 {promotion.promoEnd || "~"}
          </p>
          <p>發佈時間: {formattedUpdatedAt}</p>
        </div>
        {/* 文章內容 */}
        <div
          className={`prose max-w-none text-gray-700 leading-relaxed space-y-4 flex-grow ${
            isMobileView ? "overflow-y-auto" : "md:overflow-y-auto"
          }`}
        >
          <div
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: promotion.content }}
          ></div>
        </div>
      </div>

      {/* 關閉按鈕 - 只是視覺效果 */}
      <button
        className="absolute top-3 right-3 z-20 p-2 text-gray-700 bg-white rounded-full shadow-md transition"
        aria-label="關閉 (預覽用)"
      >
        <svg
          className="w-3 h-3"
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
  );
};

// ----------------------------------------------------
// 核心組件：PromotionPreview
// ----------------------------------------------------

const PromotionPreview = ({ data, previewUrl }) => {
  // 預設為模式 1 (Homepage Card)
  const [mode, setMode] = useState(1);

  // 準備數據
  const finalCoverUrl =
    previewUrl || data.coverImage || "/img/placeholder.webp";
  const promotion = useMemo(
    () => ({
      title: data.title || "推廣活動預覽標題",
      subtitle: data.subtitle || "副標題 (餐廳名稱)",
      coverUrl: finalCoverUrl,
      promoStart: data.promoStart || "N/A",
      promoEnd: data.promoEnd || "~",
      updatedAt: new Date().toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      content:
        data.content ||
        "<p>活動內容預覽區。請在這裡填寫您的 HTML 格式內容。</p>",
    }),
    [data, finalCoverUrl]
  );

  // 處理 Mode 4 和 5 的全頁面容器模擬
  const isFullPage = mode === 4 || mode === 5;
  const isMobileView = mode === 1 || mode === 3 || mode === 5;

  // 根據 Mode 決定內部容器的樣式 (外層 div w/h 不變)
  const containerClasses = useMemo(() => {
    // Mode 1: Homepage Card (卡片寬度模擬)
    if (mode === 1) return "w-full flex justify-start p-4"; // 靠左顯示卡片

    // Mode 2 & 3: Modal (模擬居中彈窗)
    if (mode === 2 || mode === 3)
      return "w-full h-full flex items-center justify-center p-4 bg-gray-100/50";

    // Mode 4 & 5: Full Page (模擬頁面容器的寬度約束)
    if (isFullPage) return `w-full h-full flex items-start justify-center p-4`; // items-start 讓內容從頂部開始

    return "w-full h-full p-4"; // 預設
  }, [mode, isFullPage]);

  // 渲染不同模式的內容
  const renderPreviewContent = () => {
    // 模式 1: Homepage 顯示的 Card
    if (mode === 1) {
      return (
        <div className="space-y-10 mx-auto flex flex-col items-center">
          <div
            className={`flex flex-col items-stretch w-[320px] h-fit  bg-gray-50 rounded-lg shadow-md border border-gray-200 text-left`}
          >
            <div className="relative w-full h-40">
              {" "}
              {/* 模擬 md:h-40 */}
              <Image
                src={promotion.coverUrl}
                alt={promotion.title}
                fill
                priority
                className="object-cover object-[center_10%] rounded-t-lg"
              />
            </div>
            <div className="p-3">
              <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                {promotion.title}
              </h3>
              <p className="text-base font-semibold text-gray-800 mb-1 whitespace-normal line-clamp-1">
                {promotion.subtitle}
              </p>
              <p className="text-blue-700 text-xs font-medium">
                查看詳情 &rarr;
              </p>
            </div>
          </div>
          <div
            className={`flex flex-col items-stretch h-fit w-[258px]  bg-gray-50 rounded-lg shadow-md border border-gray-200 text-left`}
          >
            <div className="relative w-full h-28
            ">
              
              <Image
                src={promotion.coverUrl}
                alt={promotion.title}
                fill
                priority
                className="object-cover object-[center_10%] rounded-t-lg"
              />
            </div>
            <div className="p-3">
              <h3 className="text-base font-semibold text-gray-800 mb-1 line-clamp-2">
                {promotion.title}
              </h3>
              <p className="text-sm font-semibold text-gray-800 mb-1 whitespace-normal line-clamp-1">
                {promotion.subtitle}
              </p>
              <p className="text-blue-700 text-xs font-medium">
                查看詳情 &rarr;
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 模式 2 & 3: Modal (Web/Mobile)
    if (mode === 2 || mode === 3) {
      // 模擬 Modal 結構: 固定背景 + Modal 內容
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg backdrop-blur-sm"></div>
          <PromotionModalContent
            promotion={promotion}
            isMobileView={mode === 3}
          />
        </div>
      );
    }

    // 模式 4 & 5: Full Page (Web/Mobile) - 移除背景，只顯示內容
    if (isFullPage) {
      // Full Page 模式：使用 max-w 模擬頁面寬度限制
      const fullPageClasses = mode === 5 ? "max-w-md" : "max-w-4xl";
      return (
        <div
          className={`relative w-full h-full bg-white rounded-lg shadow-xl ${fullPageClasses}`}
        >
          <PromotionModalContent
            promotion={promotion}
            isMobileView={mode === 5}
          />
        </div>
      );
    }

    return <div className="text-gray-500 p-4">請選擇一個預覽模式。</div>;
  };

  const modes = [
    { id: 1, name: "Card" },
    { id: 2, name: "Web Modal" },
    { id: 3, name: "手機 Modal" },
    { id: 4, name: "Full Page Web" },
    { id: 5, name: "Full Page 手機" },
  ];

  // 渲染
  return (
    // 最外層 div W/H 不變，由 PromotionForm 傳入 h-[80vh]
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="mx-auto py-2 text-xl font-bold text-gray-900 ">
        推廣活動預覽
      </h2>
      {/* 頂部導航 (Nav) */}
      <div className="w-full flex flex-wrap gap-2 justify-center pb-2 border-b bg-gray-50">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-150 ${
              m.id === mode
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* 預覽內容區 (內部的 div 自己變化大小) */}
      <div className={`flex-grow overflow-y-auto ${containerClasses}`}>
        {renderPreviewContent()}
      </div>
    </div>
  );
};

export default PromotionPreview;
