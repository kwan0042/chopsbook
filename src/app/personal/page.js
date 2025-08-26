// src/app/personal/page.js
"use client";

import React, { useContext, useCallback } from "react";
import { useRouter } from "next/navigation"; // 導入 useRouter 鉤子
import { AuthContext } from "../../lib/auth-context"; // 確保路徑正確
import PersonalPageContent from "../../components/PersonalPage"; // 導入 PersonalPage 的內容組件
import LoadingSpinner from "../../components/LoadingSpinner"; // 導入 LoadingSpinner

/**
 * PersonalPageWrapper：這是實際的路由組件，負責驗證用戶並渲染 PersonalPageContent。
 * 它必須是客戶端組件，因為它使用了 React Hooks 和 Next.js 的 useRouter。
 */
const PersonalPageWrapper = () => {
  const router = useRouter();
  const { currentUser, loadingUser } = useContext(AuthContext); // 從 AuthContext 獲取用戶狀態和載入狀態

  // 處理返回主頁
  const handleBackToHome = useCallback(() => {
    router.push("/");
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
    router.push("/login"); // 未登入則導向登入頁面
    return null; // 防止在重定向前渲染任何內容
  }

  // 如果用戶已登入且載入完成，則渲染 PersonalPageContent
  return <PersonalPageContent onBackToHome={handleBackToHome} />;
};

/**
 * PersonalPage：Next.js 的頁面組件，用於處理 /personal 路由。
 * 它用 AuthProvider 包裹 PersonalPageWrapper，確保認證上下文可用。
 * 注意：RootLayout 已經包裹了 AuthProvider，這裡無需重複包裹。
 * 所以直接導出 PersonalPageWrapper 即可。
 */
export default PersonalPageWrapper;
