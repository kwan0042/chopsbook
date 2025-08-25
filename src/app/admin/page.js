// src/app/admin/page.js
"use client"; // 標記為客戶端組件

import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation"; // 用於程式化導航
import { AuthContext } from "../../lib/auth-context"; // 從 lib/auth-context 導入 AuthContext
import AdminPage from "../../components/AdminPage"; // 從 components/AdminPage 導入 AdminPage
import LoadingSpinner from "../../components/LoadingSpinner"; // 導入 LoadingSpinner

/**
 * Page: Next.js App Router 的管理員頁面。
 * 它會檢查用戶是否登入以及是否為管理員，如果條件不符則導航到其他頁面。
 */
export default function AdminPageWrapper() {
  const { currentUser, loadingUser, isAdmin, setModalMessage } =
    useContext(AuthContext);
  const router = useRouter();


  useEffect(() => {
    // 如果未登入且 AuthContext.loadingUser 為 false，則導航到登入頁面
    if (!currentUser && !loadingUser) {
      router.push("/login");
    }
    // 如果已登入但不是管理員，則顯示訊息並導航到首頁
    else if (currentUser && !isAdmin && !loadingUser) {
      setModalMessage("您沒有權限訪問管理員頁面。請使用管理員帳戶登入。");
      router.push("/");
    }
  }, [currentUser, loadingUser, isAdmin, router, setModalMessage]);

  // 如果 AuthContext 仍在初始化，顯示全域載入狀態
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // 如果未登入或不是管理員（且 loadingUser 為 false），則不渲染內容（useEffect 會導航）
  if (!currentUser || !isAdmin) {
    return null;
  }

  // 渲染 AdminPage 組件
  return <AdminPage onBackToHome={() => router.push("/")} />;
}
