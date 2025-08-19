"use client"; // 此指令標記此檔案為客戶端組件。

import React, { useState, useContext } from "react";
import { AuthProvider, AuthContext } from "../lib/auth-context"; // 從 auth-context.js 導入 AuthProvider 和 AuthContext

// 導入所有獨立的組件
// 請確保這些檔案存在於 src/components/ 目錄中，且檔案名稱與這裡完全匹配（包括大小寫）
import LoadingSpinner from "../components/LoadingSpinner";
import LoginPage from "../components/LoginPage";
import HomePage from "../components/HomePage";
import AddRestaurantPage from "../components/AddRestaurantPage";
import MerchantPage from "../components/MerchantPage";
import AdminPage from "../components/AdminPage"; // 導入新的 AdminPage
import Modal from "../components/Modal"; // 導入 Modal 組件，用於顯示非管理員訊息

/**
 * App：主要的應用程式邏輯組件。
 * 它消費 AuthContext 並根據條件渲染不同的頁面組件。
 */
const App = () => {
  const { currentUser, loading, logout, login, signup, setModalMessage } =
    useContext(AuthContext); // 從 AuthContext 獲取所需狀態和函數，包括 setModalMessage

  // currentPage 狀態將控制當前顯示哪個頁面：
  // 'home' (主頁), 'login' (登入/註冊頁), 'addRestaurant' (新增餐廳表單),
  // 'merchantZone' (商戶專區頁), 'adminPage' (管理員頁面)
  const [currentPage, setCurrentPage] = useState("home");

  // 如果 AuthProvider 仍在載入 Firebase 認證狀態，則顯示全域載入指示器。
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // 輔助函數：處理登入操作 (用於 LoginPage)
  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      // 成功登入後，AuthContext 會自動更新 currentUser，App 組件會自動重新渲染。
      // 當 currentUser 存在時，renderPage 會根據 currentPage 顯示相應的頁面。
    } catch (error) {
      // 錯誤已由 AuthProvider 的全域 Modal 處理。
    }
  };

  // 輔助函數：處理註冊操作 (用於 LoginPage)
  const handleSignup = async (email, password) => {
    try {
      await signup(email, password);
      // 成功註冊後，會觸發 AuthContext 的 onAuthStateChanged，並自動登入。
    } catch (error) {
      // 錯誤已由 AuthProvider 的全域 Modal 處理。
    }
  };

  // 判斷是否為管理員用戶 (簡化判斷，實際應用應基於角色系統)
  // 將 admin@example.com 替換為你的管理員電子郵件地址
  const isAdminUser = currentUser && currentUser.email === "kwan6d16@gmail.com";

  // 導航到管理員頁面
  const handleShowAdminPage = () => {
    if (isAdminUser) {
      setCurrentPage("adminPage");
    } else {
      // 如果不是管理員，顯示訊息並保留在當前頁面
      setModalMessage("您沒有權限訪問管理員頁面。請使用管理員帳戶登入。");
      // 不改變 currentPage，保持在原頁面，但顯示 Modal
    }
  };

  // 根據 currentPage 狀態來渲染不同的頁面組件
  const renderPage = () => {
    // 未登入用戶的導航處理：
    // 如果用戶未登入，且當前不在登入頁面，則強制導向登入頁面。
    if (!currentUser) {
      if (currentPage === "login") {
        return (
          <LoginPage
            onBackToHome={() => setCurrentPage("home")}
            onLogin={handleLogin}
            onSignup={handleSignup}
          />
        );
      }
      // 所有其他未登入時的頁面請求，都導向登入頁面。
      return (
        <HomePage
          onShowLoginPage={() => setCurrentPage("login")}
          onShowMerchantPage={() => setCurrentPage("login")} // 未登入不能進商戶專區
          onShowAdminPage={() => setCurrentPage("login")} // 未登入不能進管理員頁面
        />
      );
    }

    // 已登入用戶的導航處理：
    switch (currentPage) {
      case "login": // 已登入用戶不應該看到登入頁面，導回首頁
        return (
          <HomePage
            onShowLoginPage={() => setCurrentPage("login")} // 儘管已登入，Navbar 仍需要此 prop
            onShowMerchantPage={() => setCurrentPage("merchantZone")}
            onShowAdminPage={handleShowAdminPage} // 傳遞新的處理函數
          />
        );
      case "addRestaurant":
        return (
          <AddRestaurantPage
            onBackToHome={() => setCurrentPage("merchantZone")}
          />
        ); // 從新增餐廳返回商戶頁
      case "merchantZone":
        return (
          <MerchantPage
            onBackToHome={() => setCurrentPage("home")}
            onShowAddRestaurantPage={() => setCurrentPage("addRestaurant")}
          />
        );
      case "adminPage":
        if (!isAdminUser) {
          // 再次檢查權限，以防直接 URL 訪問或其他情況
          setModalMessage("您沒有權限訪問管理員頁面。請使用管理員帳戶登入。");
          setCurrentPage("home"); // 重定向回主頁
          return (
            <HomePage
              onShowLoginPage={() => setCurrentPage("login")}
              onShowMerchantPage={() => setCurrentPage("merchantZone")}
              onShowAdminPage={handleShowAdminPage}
            />
          );
        }
        return <AdminPage onBackToHome={() => setCurrentPage("home")} />;
      case "home":
      default:
        return (
          <HomePage
            onShowLoginPage={() => setCurrentPage("login")}
            onShowMerchantPage={() => setCurrentPage("merchantZone")}
            onShowAdminPage={handleShowAdminPage} // 傳遞新的處理函數
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
 * 它負責向整個應用程式提供 AuthContext。
 */
export default function Page() {
  return (
    <AuthProvider>
      <App /> {/* App 組件現在是 AuthProvider 的子組件 */}
    </AuthProvider>
  );
}
