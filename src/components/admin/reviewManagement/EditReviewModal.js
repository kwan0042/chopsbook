"use client";

import React from "react";

// 定義一個用於處理嵌套物件屬性的簡單工具函數
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

// 用於美化顯示的函數
const formatDisplayValue = (key, value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  // 特殊處理時間戳記 (假設它是 Firestore Timestamp 格式的物件)
  if (
    typeof value === "object" &&
    value !== null &&
    (value._seconds || value.seconds)
  ) {
    const seconds = value._seconds || value.seconds || 0;
    const nanoseconds = value._nanoseconds || value.nanoseconds || 0;
    const milliseconds = seconds * 1000 + nanoseconds / 1000000;
    return new Date(milliseconds).toLocaleString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  // 特殊處理評分 (假設整體評分或單項評分)
  if (
    key.includes("rating") ||
    key === "overallRating" ||
    ["cp", "drinks", "environment", "hygiene", "service", "taste"].includes(key)
  ) {
    return `${value} / 5`;
  }

  // 特殊處理陣列
  if (Array.isArray(value)) {
    return value.length > 0 ? `[共 ${value.length} 項]` : "[]";
  }

  // 其他情況直接返回字串
  return String(value);
};

// 由於您要求 EditReviewModal 只是展示所有詳細內容，我們將使用一個固定的欄位列表來迭代
// 這裡包含了您提供的範例食評中的所有頂層和嵌套欄位。
const REVIEW_DETAIL_FIELDS = [
  { key: "reviewTitle", label: "食評標題" },
  { key: "overallRating", label: "總體評分" },
  { key: "ratings.taste", label: "味道評分" },
  { key: "ratings.service", label: "服務評分" },
  { key: "ratings.environment", label: "環境評分" },
  { key: "ratings.hygiene", label: "衛生評分" },
  { key: "ratings.cp", label: "性價比評分" },
  { key: "ratings.drinks", label: "飲品評分" },
  { key: "reviewContent", label: "詳細內容" },
  { key: "costPerPerson", label: "人均消費" },
  { key: "serviceType", label: "服務類型" },
  { key: "timeOfDay", label: "用餐時段" },
  { key: "visitCount", label: "到訪次數" },
  { key: "status", label: "狀態" },
  { key: "username", label: "用戶名稱" },
  { key: "userId", label: "用戶 ID" },
  { key: "restaurantId", label: "餐廳 ID" },
  { key: "createdAt", label: "建立時間" },
  { key: "uploadedImageUrls", label: "上傳圖片" },
  { key: "recommendedDishes", label: "推薦菜式" },
];

const EditReviewModal = ({ isOpen, onClose, initialData }) => {
  if (!isOpen || !initialData) return null;

  // 將 initialData 結構轉換為一個鍵/值對列表
  // 由於 ReviewManagement 傳遞的 initialData 已經是完整的食評物件
  const reviewData = initialData;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* 遮罩 */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={() => onClose()} // 點擊遮罩關閉
        ></div>

        {/* Modal 內容 */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3
                  className="text-xl leading-6 font-bold text-gray-900 border-b pb-3 mb-4"
                  id="modal-title"
                >
                  食評詳細內容 (只讀)
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  食評 ID:{" "}
                  <span className="font-mono text-gray-700">
                    {reviewData.id}
                  </span>
                </p>

                {/* 詳細內容列表 */}
                <div className="max-h-[70vh] overflow-y-auto pr-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    {REVIEW_DETAIL_FIELDS.map(({ key, label }) => {
                      const rawValue = getNestedValue(reviewData, key);
                      const displayValue = formatDisplayValue(key, rawValue);

                      return (
                        <div
                          key={key}
                          className="sm:col-span-1 border-b border-gray-100 pb-2"
                        >
                          <dt className="text-sm font-medium text-gray-500">
                            {label}
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 break-words whitespace-pre-wrap">
                            {
                              // 特殊處理圖片陣列，顯示鏈接
                              key === "uploadedImageUrls" &&
                              Array.isArray(rawValue)
                                ? rawValue.map((img, index) => (
                                    <a
                                      key={index}
                                      href={img.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline block"
                                    >
                                      圖片 {index + 1}
                                    </a>
                                  ))
                                : displayValue
                            }
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* 底部操作按鈕 */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => onClose()}
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditReviewModal;
