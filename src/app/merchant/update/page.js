// src/app/merchant/update/page.js
"use client"; // 標記為客戶端組件

import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation"; // 用於程式化導航
import { AuthContext } from "../../../lib/auth-context"; // 從 lib/auth-context 導入 AuthContext (已修正路徑)
import UpdateRestaurantPage from "../../../components/restaurant_req/UpdateRestaurantPage"; // 從 components/UpdateRestaurantPage 導入 UpdateRestaurantPage (已修正路徑)
import LoadingSpinner from "../../../components/LoadingSpinner"; // 導入 LoadingSpinner (已修正路徑)

/**
 * Page: Next.js App Router 的更新餐廳頁面。
 * 它會檢查用戶是否登入，如果未登入則導航到登入頁面。
 */
export default function UpdateRestaurantPageWrapper() {
  const { currentUser, loadingUser } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // 如果未登入且 AuthContext.loadingUser 為 false，則導航到登入頁面
    if (!currentUser && !loadingUser) {
      router.push("/login");
    }
  }, [currentUser, loadingUser, router]);

  // 如果 AuthContext 仍在初始化，顯示全域載入狀態
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // 如果未登入（且 loadingUser 為 false），則不渲染內容（useEffect 會導航）
  if (!currentUser) {
    return null;
  }

  // 渲染 UpdateRestaurantPage 組件，並提供返回商戶專區的邏輯
  return <UpdateRestaurantPage onBackToHome={() => router.push("/merchant")} />;
}
