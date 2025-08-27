"use client"; // 此指令標記此檔案為客戶端組件。

import React, { useState, useContext, useCallback } from "react";
import { AuthProvider, AuthContext } from "../lib/auth-context"; // 從 auth-context.js 導入 AuthProvider 和 AuthContext
import { useRouter } from "next/navigation"; // 導入 useRouter

// 導入所有獨立的組件
// 請確保這些檔案存在於 src/components/ 目錄中，且檔案名稱與這裡完全匹配（包括大小寫）
import LoadingSpinner from "../components/LoadingSpinner";
import HomePage from "../components/HomePage";
import AddRestaurantPage from "../components/AddRestaurantPage";
import MerchantPage from "../components/MerchantPage";
import AdminPage from "../components/admin/AdminPage"; // 導入新的 AdminPage
import Modal from "../components/Modal"; // 導入 Modal 組件，用於顯示非管理員訊息

/**
 * App：主要的應用程式邏輯組件。
 * 它消費 AuthContext 並根據條件渲染不同的頁面組件。
 */
const App = () => {
  const {
    currentUser,
    loadingUser,
    logout,
    login,
    signup,
    setModalMessage,
    isAdmin,
  } = useContext(AuthContext); // 從 AuthContext 獲取所需狀態和函數，包括 setModalMessage
  const router = useRouter(); // 初始化 useRouter

  // currentPage 狀態將控制當前顯示哪個內部頁面 (不包括獨立路由的頁面，如 /personal)：
  // 'home' (主頁), 'addRestaurant' (新增餐廳表單),
  // 'merchantZone' (商戶專區頁), 'adminPage' (管理員頁面)
  const [currentPage, setCurrentPage] = useState("home");

  // 導航到管理員頁面
  // 將 useCallback 定義移至條件渲染之前
  const handleShowAdminPage = useCallback(() => {
    if (isAdmin) {
      setCurrentPage("adminPage");
    } else {
      setModalMessage("您沒有權限訪問管理員頁面。請使用管理員帳戶登入。");
    }
  }, [isAdmin, setModalMessage]);

  // 導航到個人主頁 - 現在透過 router.push 處理
  // 將 useCallback 定義移至條件渲染之前
  const handleShowPersonalPage = useCallback(() => {
    if (currentUser) {
      router.push("/personal"); // 導航到新的 /personal 路由
    } else {
      setModalMessage("請先登入才能訪問個人主頁。");
    }
  }, [currentUser, router, setModalMessage]);

  // 導航到登入頁面 - 現在透過 router.push 處理
  const handleShowLoginPage = useCallback(() => {
    router.push("/login"); // 導航到獨立的登入頁面
  }, [router]);

  // 如果 AuthProvider 仍在載入 Firebase 認證狀態，則顯示全域載入指示器。
  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">載入用戶資訊...</p>
      </div>
    );
  }

  // 根據 currentPage 狀態來渲染不同的頁面組件
  const renderPage = () => {
    // 未登入用戶的導航處理：
    if (!currentUser) {
      return (
        <HomePage
          onShowLoginPage={handleShowLoginPage}
          onShowMerchantPage={handleShowLoginPage} // 未登入不能進商戶專區，導向登入頁
          onShowAdminPage={handleShowAdminPage} // 未登入時嘗試訪問管理員頁面
          onShowPersonalPage={handleShowPersonalPage} // 未登入時嘗試訪問個人主頁
        />
      );
    }

    // 已登入用戶的導航處理：
    switch (currentPage) {
      case "addRestaurant":
        return (
          <AddRestaurantPage
            onBackToHome={() => setCurrentPage("merchantZone")}
          />
        );
      case "merchantZone":
        return (
          <MerchantPage
            onBackToHome={() => setCurrentPage("home")}
            onShowAddRestaurantPage={() => setCurrentPage("addRestaurant")}
          />
        );
      case "adminPage":
        if (!isAdmin) {
          // 再次檢查權限
          setModalMessage("您沒有權限訪問管理員頁面。請使用管理員帳戶登入。");
          setCurrentPage("home");
          return (
            <HomePage
              onShowLoginPage={handleShowLoginPage}
              onShowMerchantPage={() => setCurrentPage("merchantZone")}
              onShowAdminPage={handleShowAdminPage}
              onShowPersonalPage={handleShowPersonalPage}
            />
          );
        }
        return <AdminPage onBackToHome={() => setCurrentPage("home")} />;
      // 'personalPage' 狀態和路由已移除，現在由 /personal/page.js 處理
      case "home":
      default:
        return (
          <HomePage
            onShowLoginPage={handleShowLoginPage}
            onShowMerchantPage={() => setCurrentPage("merchantZone")}
            onShowAdminPage={handleShowAdminPage}
            onShowPersonalPage={handleShowPersonalPage}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-inter">{renderPage()}</div>
  );
};

/**
 * Page：Next.js App Router 的根組件。
 * 它不再需要 AuthProvider，因為 layout.js 中已經提供了。
 */
export default function Page() {
  return <App />; // App 組件直接返回，不需要 AuthProvider 包裹
}
