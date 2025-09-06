// src/app/merchant/page.js
"use client"; // 標記為客戶端組件

import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation"; // 用於程式化導航
import { AuthContext } from "../../lib/auth-context"; // 從 lib/auth-context 導入 AuthContext
import MerchantPage from "../../components/restaurant_req/MerchantPage"; // 從 components/MerchantPage 導入 MerchantPage
import LoadingSpinner from "../../components/LoadingSpinner"; // 導入 LoadingSpinner

/**
 * Page: Next.js App Router 的商戶專區頁面。
 * 它會檢查用戶是否登入，如果未登入則導航到登入頁面。
 */
export default function MerchantPageWrapper() {
  const { currentUser, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // 如果未登入且 AuthContext.loading 為 false，則導航到登入頁面
    if (!currentUser && !loading) {
      router.push("/login");
    }
  }, [currentUser, loading, router]);

  // 如果 AuthContext 仍在初始化，顯示全域載入狀態
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // 如果未登入（且 loading 為 false），則不渲染內容（useEffect 會導航）
  if (!currentUser) {
    return null;
  }

  // 渲染 MerchantPage 組件
  return <MerchantPage onBackToHome={() => router.push("/")} />;
}
