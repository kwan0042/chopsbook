// src/app/personal/reviews/ReviewPageContent.js
"use client"; // 標記為客戶端元件

import React, { useContext, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "../../lib/auth-context";
import ReviewForm from "../ReviewForm";
import LoadingSpinner from "../LoadingSpinner";

export default function ReviewPageContent() {
  const { currentUser, loadingUser } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams(); // 在此客戶端元件中使用 useSearchParams
  const draftId = searchParams.get("draftId");

  // 返回個人主頁的回調函數
  const handleBackToPersonal = useCallback(() => {
    router.push("/personal");
  }, [router]);

  // 如果正在載入用戶資訊，顯示載入指示器
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter">
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
}
