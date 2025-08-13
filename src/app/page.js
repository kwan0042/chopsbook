// src/app/page.js
'use client';

import React, { useState, useContext } from 'react';
import { AuthContext, AuthProvider } from '../lib/auth-context'; // 從新的 auth-context.js 導入 AuthContext 和 AuthProvider
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// 導入所有新的組件
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import LoginPage from '../components/LoginPage';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import PromotionsSection from '../components/PromotionsSection';
import FoodCategoriesSection from '../components/FoodCategoriesSection';
import TestDBForm from '../components/TestDBForm';

/**
 * HomePage：ChopsBook 的主登陸頁面。
 * 它包括導航欄、Hero 區塊、搜尋欄、促銷活動和食物類別。
 */
const HomePage = ({ onShowLogin, onLogout, currentUser }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-inter">
      <Navbar onShowLogin={onShowLogin} currentUser={currentUser} onLogout={onLogout} />
      <main className="flex-grow">
        <HeroSection />
        {/* 主要內容區域，類似 Amazon 的產品和類別佈局 */}
        <div className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <PromotionsSection />
          <FoodCategoriesSection />
          <TestDBForm />
        </div>
      </main>
      <footer className="bg-gray-800 text-white text-center py-6 text-sm">
        &copy; 2024 ChopsBook. 版權所有.
      </footer>
    </div>
  );
};

/**
 * App：主要的應用程式邏輯組件。
 * 它消費 AuthContext 並根據條件渲染 HomePage 或 LoginPage。
 */
const App = () => {
  // 從 AuthContext 獲取當前使用者、載入狀態和 Firebase Auth 實例
  const { currentUser, loading, auth, setModalMessage } = useContext(AuthContext);
  const [showLoginPage, setShowLoginPage] = useState(false);

  // 處理使用者登出的函數
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("登出失敗:", error);
      setModalMessage(`登出失敗: ${error.message}`);
    }
  };

  // 如果 AuthProvider 仍在載入 Firebase，則顯示全域載入指示器。
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      {showLoginPage ? (
        <LoginPage onBackToHome={() => setShowLoginPage(false)} />
      ) : (
        <HomePage
          onShowLogin={() => setShowLoginPage(true)}
          onLogout={handleLogout} // 將登出函數傳遞給 HomePage (進而傳給 Navbar)
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

// --- Next.js 頁面組件 (從 src/app/page.js 預設導出) ---

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
