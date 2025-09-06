"use client";

import React, { useContext, useCallback } from "react";
import { AuthContext } from "../lib/auth-context";
import { useRouter } from "next/navigation";

// 導入所有獨立的組件
import LoadingSpinner from "../components/LoadingSpinner";
import HomePage from "../components/home/HomePage";
import Modal from "../components/Modal";

/**
 * App：主要的應用程式邏輯組件。
 * 它消費 AuthContext 並根據條件渲染頁面。
 */
const App = () => {
  const { currentUser, loadingUser, setModalMessage, modalMessage } =
    useContext(AuthContext);
  const router = useRouter();

  // 導航到登入頁面
  const handleShowLoginPage = useCallback(() => {
    router.push("/login");
  }, [router]);

  // 如果 AuthProvider 仍在載入 Firebase 認證狀態，則顯示全域載入指示器。
  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // 頁面現在只負責渲染主頁內容。
  // 所有導航邏輯都由 Navbar 或其他組件處理。
  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      <HomePage onShowLoginPage={handleShowLoginPage} />
      {modalMessage && (
        <Modal
          message={modalMessage}
          onClose={() => setModalMessage("")}
          isOpen={!!modalMessage}
        />
      )}
    </div>
  );
};

/**
 * Page：Next.js App Router 的根組件。
 */
export default function Page() {
  return <App />;
}
