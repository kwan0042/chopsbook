// src/components/HomePage.js
"use client";

import React, { useState, useContext } from "react";
import { AuthContext } from "../lib/auth-context"; // 從 AuthContext 導入
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import PromotionsSection from "./PromotionsSection";
import FoodCategoriesSection from "./FoodCategoriesSection";
import TestDBForm from "./TestDBForm";
import AuthModal from "./AuthModal"; // 導入 AuthModal

/**
 * HomePage: ChopsBook 的主登陸頁面。
 * 它組裝了導航欄、英雄區塊、促銷活動和食物類別。
 * 並管理 AuthModal 的顯示。
 */
const HomePage = () => {
  const { currentUser } = useContext(AuthContext); // 從 AuthContext 獲取 currentUser

  // 管理 AuthModal 的顯示狀態和模式
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login"); // 'login' 或 'register'

  const handleShowLoginModal = () => {
    setAuthModalMode("login");
    setShowAuthModal(true);
  };

  const handleShowRegisterModal = () => {
    setAuthModalMode("register");
    setShowAuthModal(true);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-inter">
      {/* Navbar 現在接收用於顯示 Modal 的函數 */}
      <Navbar
        onShowLoginModal={handleShowLoginModal}
        onShowRegisterModal={handleShowRegisterModal}
      />
      <main className="flex-grow">
        <HeroSection />
        <div className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <PromotionsSection />
          <FoodCategoriesSection />
          <TestDBForm />
        </div>
      </main>
      <footer className="bg-gray-800 text-white text-center py-6 text-sm">
        &copy; 2024 ChopsBook. 版權所有.
      </footer>

      {/* AuthModal 根據 showAuthModal 狀態顯示 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        initialMode={authModalMode}
      />
    </div>
  );
};

export default HomePage;
