// src/components/profile/ProfileContent.js
"use client";

import React from "react";
import LoadingSpinner from "../LoadingSpinner";
import { useRouter } from "next/navigation";
import { deleteDoc, doc } from "firebase/firestore";


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

const ProfileContent = ({
  selectedNav,
  currentUser,
  loadingContent,
  publishedReviews,
  draftReviews, // 新增草稿評論資料
  setModalMessage,
  db,
  appId,
  formatDateTime,
}) => {
  const router = useRouter();

  // 處理草稿編輯
  const handleContinueEditingDraft = (draftId) => {
    router.push(`/personal/reviews?draftId=${draftId}`);
  };

  // 處理草稿刪除
  const handleDeleteDraft = async (draftId) => {
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
  };

  if (loadingContent) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
        <p className="ml-4 text-gray-600">載入中...</p>
      </div>
    );
  }

  // 根據 selectedNav 渲染不同的內容
  const renderContent = () => {
    switch (selectedNav) {
      case "reviews":
        return (
          <>
            {/* 我的草稿食評 */}
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              我的草稿食評
            </h3>
            {draftReviews?.length > 0 ? (
              <div className="space-y-4 mb-8">
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
              <p className="text-center text-gray-600 py-4 mb-8">
                目前沒有草稿食評。
              </p>
            )}

            {/* 已發布評論 */}
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              已發布評論
            </h3>
            {publishedReviews?.length > 0 ? (
              <div className="space-y-4">
                {publishedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <h4 className="font-semibold text-lg text-gray-900">
                      {review.restaurantName}
                    </h4>
                    <p className="text-gray-700 mt-1">{review.reviewContent}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      發布於: {formatDateTime(review.createdAt)}
                    </p>
                    {/* 未來可在此處新增評論的互動功能，如編輯、刪除 */}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 py-4">
                目前沒有已發布的評論。
              </p>
            )}
          </>
        );
      case "favorite-list":
        return (
          <div className="py-8 text-center text-gray-600">
            <h3 className="text-2xl font-bold mb-4">我的最愛餐廳</h3>
            <p>這個頁面目前正在開發中。</p>
            {/* 未來這裡會渲染最愛餐廳的列表 */}
          </div>
        );
      case "awards":
        return (
          <div className="py-8 text-center text-gray-600">
            <h3 className="text-2xl font-bold mb-4">我的成就與獎項</h3>
            <p>這個頁面目前正在開發中。</p>
            {/* 未來這裡會渲染用戶獲得的徽章或獎勵 */}
          </div>
        );
      default:
        return null;
    }
  };

  return <div>{renderContent()}</div>;
};

export default ProfileContent;
