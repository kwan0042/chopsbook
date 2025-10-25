// src/components/home/ScrollingAnnouncement.jsx
"use client";

import React, { useState, useEffect } from "react";

// 假設的緊湊公告數據結構
// 為了簡化，我們只關注標題 (title) 和點擊時開啟 Modal 的邏輯 (onClick)
// 數據本身將是一個列表，用來滾動。
/**
 * @typedef {Object} CompactAnnouncementItem
 * @property {string} text - 滾動公告的單條文字內容。
 * @property {function(): void} onClick - 點擊此條公告時觸發的函數。
 */

/**
 * 緊湊型自動滾動公告欄
 * @param {Object} props
 * @param {CompactAnnouncementItem[]} props.announcements - 公告列表。
 */
const ScrollingAnnouncement = ({ announcements }) => {
  // 顯示的當前起始索引 (一次顯示兩條)
  const [startIndex, setStartIndex] = useState(0);

  // 計算當前應該顯示的公告列表 (最多兩條)
  // 如果公告少於或等於 2 條，則不滾動，只顯示全部。
  const itemsToShow = announcements.slice(startIndex, startIndex + 2);
  const totalItems = announcements.length;
  const isScrollable = totalItems > 2;

  // 自動滾動效果
  useEffect(() => {
    if (!isScrollable) return;

    // 定時器，每 10 秒滾動一次
    const timer = setInterval(() => {
      setStartIndex((prevIndex) => {
        // 下一組的起始索引
        let nextIndex = prevIndex + 2;

        // 如果已經到達列表末尾，則從頭開始
        if (nextIndex >= totalItems) {
          nextIndex = 0;
        }
        return nextIndex;
      });
    }, 5000); // 10 秒 (10000 毫秒)

    // 清理定時器
    return () => clearInterval(timer);
  }, [totalItems, isScrollable]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-3 border border-gray-100">
      {/* 標題行：門鈴圖標 + 公告文字 */}
      <div className="flex items-center mb-2 pb-1 border-b border-gray-100">
        {/* 門鈴圖標 🔔 */}
        <svg
          className="w-5 h-5 text-red-500 flex-shrink-0 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          ></path>
        </svg>

        {/* 公告文字 */}
        <h3 className="text-base font-semibold text-gray-900">最新公告</h3>

        {/* 箭頭指示 (如果內容多於兩條，才顯示滾動提示) */}
        {isScrollable && (
          <svg
            className="w-4 h-4 text-indigo-400 ml-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 向下箭頭 */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        )}
      </div>

      {/* 內容區域 - 固定高度，保證只顯示兩行 */}
      <div className="h-[2.75rem] overflow-hidden">
        {itemsToShow.map((item, index) => (
          <div
            key={startIndex + index} // 確保 key 在滾動時會變化
            className="flex items-center text-sm text-gray-700 mb-1 cursor-pointer hover:text-indigo-600 transition truncate"
            onClick={item.onClick}
          >
            <span className="text-red-500 mr-2">•</span> {/* 小圓點或圖標 */}
            <span className="truncate">{item.text}</span>
          </div>
        ))}

        {/* 確保即使只有一條內容，高度也能保持兩行，防止跳動 */}
        {itemsToShow.length === 1 && <div className="h-[1.375rem]"></div>}
      </div>
    </div>
  );
};

export default ScrollingAnnouncement;
