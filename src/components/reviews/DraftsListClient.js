// src/components/reviews/DraftsListClient.js
"use client";

import React, { useState, useContext } from "react";
import Link from "next/link";
import { doc, deleteDoc } from "firebase/firestore";
import { AuthContext } from "@/lib/auth-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrashAlt,
  faUtensils,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../LoadingSpinner";

const DraftsListClient = ({ drafts: initialDrafts }) => {
  const { currentUser, db, appId, formatDateTime } = useContext(AuthContext);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteDraft = async (draftId) => {
    if (!currentUser || !db) return;

    setDeletingId(draftId);
    try {
      const draftDocRef = doc(
        db,
        `artifacts/${appId}/users/${currentUser.uid}/draft_reviews`,
        draftId
      );
      await deleteDoc(draftDocRef);
      setDrafts(drafts.filter((draft) => draft.id !== draftId));
    } catch (error) {
      console.error("Error deleting draft:", error);
      // 可以在這裡添加一個錯誤訊息提示給用戶
    } finally {
      setDeletingId(null);
    }
  };

  // 如果沒有草稿，顯示一個友好的提示
  if (!drafts.length) {
    return (
      <div className="text-center p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg max-w-2xl mx-auto min-h-[300px] flex flex-col justify-center items-center">
        <h2 className="text-3xl font-extrabold text-indigo-800 mb-4">
          沒有食評草稿
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          你的草稿箱目前是空的。
          <br />
          立即動筆，分享你的用餐體驗吧！
        </p>
        <Link
          href="/review-form"
          className="inline-block px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-md hover:bg-indigo-700 transform hover:scale-105 transition-all duration-300 ease-in-out"
        >
          <FontAwesomeIcon icon={faEdit} className="mr-2" />
          開始撰寫食評
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 🚨 核心列表佈局：單列，每個項目佔滿一行 */}
      <div className="space-y-4">
        {drafts.map((draft) => {
          const rawTimestamp = draft.expiresAt;
          let extendedExpirationDate = null;

          // 24 小時的毫秒數 (24 * 60 * 60 * 1000)
          const TWENTY_FOUR_HOURS_MS = 86400000;

          // --- 2. 核心邏輯：解析、計算和設置結果 ---

          if (rawTimestamp && typeof rawTimestamp === "object") {
            // 檢查並解析 {_seconds: X, _nanoseconds: Y} 格式的 Firestore Timestamp POJO
            const seconds = rawTimestamp._seconds;
            const nanoseconds = rawTimestamp._nanoseconds;

            if (seconds !== undefined && nanoseconds !== undefined) {
              // 將秒數轉換為毫秒 ( * 1000)
              // 將納秒轉換為毫秒 ( / 1,000,000)
              const totalMs = seconds * 1000 + nanoseconds / 1000000;

              // 創建原始日期物件
              const originalDate = new Date(totalMs);

              // 檢查日期是否有效
              if (!isNaN(originalDate.getTime())) {
                // 計算：在原始毫秒數的基礎上加上 24 小時的毫秒數
                const futureMs = originalDate.getTime() + TWENTY_FOUR_HOURS_MS;

                // 創建延長後的日期物件
                extendedExpirationDate = new Date(futureMs);
              }
            }
          }

          return (
            <div
              key={draft.id}
              className="group relative p-4 md:flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 hover:shadow-md transition-all duration-200"
            >
              {/* 左側：草稿資訊 */}
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate mb-1">
                  {draft.reviewTitle || "無標題食評"}
                </h3>
                <p className="flex items-center truncate mb-1">
                  <FontAwesomeIcon
                    icon={faUtensils}
                    className="mr-2 text-indigo-400"
                  />
                  <span className="font-medium text-gray-700">餐廳：</span>
                  {draft.restaurantName?.["zh-TW"] ||
                    draft.restaurantName?.en ||
                    draft.id}
                </p>
                <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-600 mt-1 md:mt-0">
                  <p className="flex items-center text-xs text-gray-500 mt-1 sm:mt-0">
                    <FontAwesomeIcon
                      icon={faClock}
                      className="mr-2 text-gray-400"
                    />
                    儲存時間：{formatDateTime(draft.createdAt)}
                  </p>
                  <p className="flex items-center text-xs text-gray-500 mt-1 md:mt-0">
                    <FontAwesomeIcon
                      icon={faClock}
                      className="mr-2 text-gray-400"
                    />
                    到期時間：
                    {extendedExpirationDate &&
                      formatDateTime(extendedExpirationDate)}
                  </p>
                </div>
              </div>

              {/* 右側：操作按鈕 */}
              <div className="flex space-x-2 flex-shrink-0 z-10 mt-4 sm:mt-0">
                <Link
                  href={`/user/${currentUser.uid}/review-draft/${draft.id}`}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                  aria-label="編輯草稿"
                >
                  <FontAwesomeIcon icon={faEdit} className="mr-2" />
                  編輯
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 防止點擊按鈕時觸發父級 Link
                    handleDeleteDraft(draft.id);
                  }}
                  className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors shadow-sm relative"
                  disabled={deletingId === draft.id}
                  aria-label="刪除草稿"
                >
                  {deletingId === draft.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faTrashAlt} className="mr-2" />
                      刪除
                    </>
                  )}
                </button>
              </div>

              {/* 整個卡片都是可點擊的編輯連結（覆蓋大部分區域，但不包括按鈕） */}
              <Link
                href={`/user/${currentUser.uid}/review-draft/${draft.id}`}
                className="absolute inset-0 z-0"
                aria-label={`編輯 ${draft.reviewTitle || "無標題食評"}`}
              ></Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DraftsListClient;
