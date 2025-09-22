// src/app/personal/reviews/page.js
"use client";

import React, { useContext, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "@/lib/auth-context";
import ReviewForm from "@/components/reviews/ReviewForm.jsx";
import LoadingSpinner from "@/components/LoadingSpinner";

/**
 * PersonalReviewsPage: 用戶撰寫食評的頁面。
 * 處理用戶認證狀態、載入草稿，並渲染食評表單。
 */
export default function PersonalReviewsPage() {
  const { currentUser, loadingUser, authReady } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const handleBackToPersonal = useCallback(() => {
    router.push("/");
  }, [router]);

  // 檢查認證狀態並重定向
  useEffect(() => {
    if (authReady && !currentUser && !loadingUser) {
      console.log("用戶未登入且認證已就緒，重定向到 /login。");
      router.push("/login");
    }
  }, [currentUser, loadingUser, authReady, router]);

  // 顯示載入狀態，直到認證系統準備好或用戶資訊載入完成
  if (!authReady || loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter">
        <LoadingSpinner />
        <p className="text-lg text-gray-700 ml-4">載入用戶資訊...</p>
      </div>
    );
  }

  // 如果 authReady 為 true 但 currentUser 為空，不渲染任何內容，
  // 而是依賴 useEffect 進行重定向。
  if (!currentUser) {
    return null;
  }

  // 如果用戶已登入，則渲染 ReviewForm
  return (
    <div className="min-h-screen bg-cbbg p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center font-inter">
      <ReviewForm onBack={handleBackToPersonal} draftId={draftId} />
    </div>
  );
}
