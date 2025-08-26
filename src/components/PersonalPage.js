// src/components/PersonalPage.js
"use client";

import React, { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../lib/auth-context";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import LoadingSpinner from "./LoadingSpinner";
import { useRouter } from "next/navigation";

// 圖標：用於編輯和刪除草稿
const EditIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-5 w-5 ${className}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.38-2.828-2.829z" />
  </svg>
);

const DeleteIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-5 w-5 ${className}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * PersonalPage: 用戶的個人主頁。
 * 顯示用戶資訊和草稿食評。
 * @param {object} props - 組件屬性。
 * @param {function} props.onBackToHome - 返回主頁的回調函數。
 */
const PersonalPage = ({ onBackToHome }) => {
  const {
    currentUser,
    db,
    appId,
    loadingUser,
    setModalMessage,
    formatDateTime,
  } = useContext(AuthContext);
  const router = useRouter();
  const [draftReviews, setDraftReviews] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  // 獲取草稿食評
  useEffect(() => {
    if (!db || !currentUser) {
      setLoadingDrafts(false);
      return;
    }

    const draftsCollectionRef = collection(
      db,
      `artifacts/${appId}/users/${currentUser.uid}/draft_reviews`
    );
    const q = query(
      draftsCollectionRef,
      orderBy("createdAt", "desc") // 按創建時間排序
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedDrafts = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((draft) => {
            // 過濾掉過期的草稿 (3天有效期)
            const expiresAt = draft.expiresAt
              ? new Date(draft.expiresAt)
              : new Date(0); // 確保 expiresAt 存在
            return new Date() < expiresAt;
          });
        setDraftReviews(fetchedDrafts);
        setLoadingDrafts(false);
      },
      (error) => {
        console.error("獲取草稿食評失敗:", error);
        setModalMessage(`獲取草稿食評失敗: ${error.message}`);
        setLoadingDrafts(false);
      }
    );

    return () => unsubscribe();
  }, [db, currentUser, appId, setModalMessage]);

  const handleContinueEditingDraft = useCallback(
    (draftId) => {
      router.push(`/personal/reviews?draftId=${draftId}`);
    },
    [router]
  );

  const handleDeleteDraft = useCallback(
    async (draftId) => {
      if (!db || !currentUser) {
        setModalMessage("請先登入才能刪除草稿。");
        return;
      }
      try {
        await deleteDoc(
          doc(
            db,
            `artifacts/${appId}/users/${currentUser.uid}/draft_reviews`,
            draftId
          )
        );
        setModalMessage("草稿已刪除。");
      } catch (error) {
        setModalMessage(`刪除草稿失敗: ${error.message}`);
        console.error("刪除草稿失敗:", error);
      }
    },
    [db, currentUser, appId, setModalMessage]
  );

  const handleWriteNewReview = useCallback(() => {
    router.push("/personal/reviews");
  }, [router]);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
        <p className="ml-4 text-gray-700">載入用戶資訊...</p>
      </div>
    );
  }

  if (!currentUser) {
    // 應該由上層路由處理未登入狀態
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center font-inter">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl relative">
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
          歡迎，{currentUser.username || currentUser.email.split("@")[0]}！
          你可以在這裡管理你的食評和個人資料。
        </p>

        {/* 寫食評按鈕 */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleWriteNewReview}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105"
          >
            撰寫新食評
          </button>
        </div>

        {/* 我的草稿食評 */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            我的草稿食評
          </h3>
          {loadingDrafts ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <p className="ml-4 text-gray-600">載入草稿中...</p>
            </div>
          ) : draftReviews.length > 0 ? (
            <div className="space-y-4">
              {draftReviews.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200"
                >
                  <div className="mb-2 sm:mb-0">
                    <p className="font-semibold text-gray-800">
                      餐廳: {draft.restaurantName || "未知餐廳"}
                    </p>
                    <p className="text-sm text-gray-600">
                      草稿內容: {draft.reviewContent?.substring(0, 50)}...
                    </p>
                    <p className="text-xs text-gray-500">
                      儲存於: {formatDateTime(draft.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      將於 {formatDateTime(new Date(draft.expiresAt))} 過期
                    </p>
                  </div>
                  <div className="flex space-x-3 mt-2 sm:mt-0">
                    <button
                      onClick={() => handleContinueEditingDraft(draft.id)}
                      className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                      aria-label="繼續編輯草稿"
                    >
                      <EditIcon className="mr-1" /> 繼續編輯
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="flex items-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                      aria-label="刪除草稿"
                    >
                      <DeleteIcon className="mr-1" /> 刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">目前沒有草稿食評。</p>
          )}
        </div>

        {/* 頁面下方按鈕 */}
        <div className="text-center mt-8">
          <button
            onClick={onBackToHome}
            className="mt-6 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
          >
            返回主頁
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalPage;
