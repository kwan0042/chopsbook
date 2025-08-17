"use client"; // 此指令標記此檔案為客戶端組件。

import React, { useContext } from "react";
// 從獨立檔案導入 AuthProvider 和 AuthContext
import { AuthProvider, AuthContext } from "../lib/auth-context";

// 從 components 資料夾導入必要的 UI 組件
import LoadingSpinner from "../components/LoadingSpinner";
import HomePage from "../components/HomePage"; // 導入 HomePage

/**
 * App: ChopsBook 應用程式的根組件。
 * 它用 AuthProvider 包裹整個應用程式，並處理全局載入狀態。
 * HomePage 是預設視圖，登入/註冊功能現在是模態彈窗。
 */
const App = () => {
  // 從 AuthContext 獲取載入狀態。currentUser 和登入/登出邏輯現在在 AuthProvider 和 HomePage 中處理。
  const { loading } = useContext(AuthContext);

  // 如果 AuthProvider 仍在載入 Firebase，則顯示全域載入指示器。
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // 預設總是渲染 HomePage，登入/註冊彈窗由 HomePage 內部管理
  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      <HomePage />
    </div>
  );
};

// Next.js 頁面組件的預設導出。
export default function Page() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
