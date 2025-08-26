// src/app/personal/reviews/page.js
"use client";

import React, { useContext, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // 導入 useSearchParams 以獲取 URL 查詢參數
import { AuthContext } from "../../../lib/auth-context"; // 確保路徑正確
import ReviewForm from "../../../components/ReviewForm"; // 導入食評表單組件
import LoadingSpinner from "../../../components/LoadingSpinner"; // 導入載入指示器

/**
 * PersonalReviewsPage: 用戶撰寫食評的頁面。
 * 負責檢查用戶認證狀態，並渲染 ReviewForm 組件。
 * 支援從 URL 查詢參數載入現有草稿。
 */
const PersonalReviewsPage = () => {
  const { currentUser, loadingUser } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams(); // 獲取 URL 查詢參數
  const draftId = searchParams.get("draftId"); // 獲取 draftId 參數，如果存在

  // 返回個人主頁的回調函數
  const handleBackToPersonal = useCallback(() => {
    router.push("/personal");
  }, [router]);

  // 如果正在載入用戶資訊，顯示載入指示器
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
        <p className="text-lg text-gray-700 ml-4">載入用戶資訊...</p>
      </div>
    );
  }

  // 如果用戶未登入，則導向登入頁面
  if (!currentUser) {
    router.push("/login");
    return null; // 防止在重定向前渲染任何內容
  }

  // 如果用戶已登入且載入完成，則渲染 ReviewForm
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center font-inter">
      <ReviewForm onBack={handleBackToPersonal} draftId={draftId} />
    </div>
  );
};

export default PersonalReviewsPage;
