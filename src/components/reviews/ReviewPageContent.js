// src/app/personal/reviews/ReviewPageContent.js
"use client"; // 標記為客戶端元件

import React, { useContext, useCallback, useEffect } from "react"; // 導入 useEffect
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "../../lib/auth-context";
import ReviewForm from "../ReviewForm"; // 假設 ReviewForm 在同一個目錄或有正確的路徑
import LoadingSpinner from "../LoadingSpinner"; // 假設 LoadingSpinner 在同一個目錄或有正確的路徑

export default function ReviewPageContent() {
  // 從 AuthContext 獲取 currentUser, loadingUser 和 authReady 狀態
  // authReady 狀態雖然在此處沒有直接用於條件渲染，但在整個應用程式中很重要，用於確保認證系統已初始化
  const { currentUser, loadingUser, authReady } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  // 返回個人主頁的回調函數
  const handleBackToPersonal = useCallback(() => {
    router.push("/personal");
  }, [router]);

  // --- 關鍵修改：將導航邏輯移到 useEffect 中 ---
  useEffect(() => {
    // 只有在 authReady 為 true (認證系統已完成初始化檢查) 且用戶未登入時才重定向
    // 這樣可以避免在 Firebase 仍在檢查登入狀態時過早地重定向
    if (authReady && !currentUser && !loadingUser) {
      console.log(
        "ReviewPageContent: 用戶未登入且認證已就緒，重定向到 /login。"
      );
      router.push("/login");
    }
  }, [currentUser, loadingUser, authReady, router]); // 監聽 currentUser, loadingUser, authReady 和 router 變化

  // 如果 Firebase 認證系統還沒有完成初始化檢查，或者正在加載用戶信息，則顯示載入指示器
  // 這樣可以避免在 authReady 之前出現的內容閃爍，並且允許 useEffect 有機會觸發重定向
  if (!authReady || loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter">
        <LoadingSpinner />
        <p className="text-lg text-gray-700 ml-4">載入用戶資訊...</p>
      </div>
    );
  }

  // 如果 authReady 為 true 但 currentUser 為空（表示用戶未登入），
  // 並且 useEffect 已經觸發了重定向，那麼這裡不應該渲染任何東西。
  // 我們不需要再次顯式地檢查 `!currentUser` 並呼叫 `router.push`，因為 useEffect 會處理它。
  // 在重定向發生後，組件將會被卸載。
  if (!currentUser) {
    return null; // 在重定向生效前，不渲染任何內容
  }

  // 如果用戶已登入且載入完成，則渲染 ReviewForm
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center font-inter">
      <ReviewForm onBack={handleBackToPersonal} draftId={draftId} />
    </div>
  );
}
