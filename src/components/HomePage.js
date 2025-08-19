// src/components/HomePage.js
"use client";

import React, { useState, useContext } from "react";
import { AuthContext } from "../lib/auth-context"; // 確保路徑正確：從 components 目錄往上一層到 src，再進入 lib

// 導入所有現在獨立的組件
// 請再次確認以下所有檔案都存在於 `src/components/` 目錄中，並且檔名與大小寫都完全正確！
import Navbar from "./Navbar";
import AuthModal from "./AuthModal"; // 仍然需要這個，因為它用於登入彈窗
import FilterModal from "./FilterModal";
import HeroSection from "./HeroSection";
import PromotionsSection from "./PromotionsSection";
import FoodCategoriesSection from "./FoodCategoriesSection";
import RestaurantListPage from "./RestaurantListPage";

/**
 * HomePage: ChopsBook 的主登陸頁面。
 * 它現在負責組合各個區塊，並管理模態框的顯示以及頁面的核心內容切換（例如篩選結果）。
 * @param {object} props - 組件屬性。
 * @param {function} props.onShowLoginPage - 顯示登入頁面的回調。
 * @param {function} props.onShowAddRestaurantPage - 導航到新增餐廳頁面的回調。
 * @param {function} props.onShowUpdateRestaurantPage - 導航到更新餐廳頁面的回調。
 * @param {function} props.onShowMerchantPage - 導航到商戶專區頁面的回調。
 * @param {function} props.onShowAdminPage - 導航到管理員頁面的回調 (新增)。
 */
const HomePage = ({
  onShowLoginPage,
  onShowAddRestaurantPage,
  onShowUpdateRestaurantPage,
  onShowMerchantPage,
  onShowAdminPage,
}) => {
  const { currentUser, logout } = useContext(AuthContext);

  // 管理 AuthModal 的顯示狀態和模式
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login"); // 'login' 或 'register'

  // 管理 FilterModal 的顯示狀態
  const [showFilterModal, setShowFilterModal] = useState(false);
  // 用於儲存已應用的篩選條件，並在篩選結果頁面顯示
  const [appliedFilters, setAppliedFilters] = useState({});
  // 控制是否顯示篩選後的餐廳列表頁面
  const [showFilteredResultsPage, setShowFilteredResultsPage] = useState(false);

  const handleShowLoginModal = () => {
    setAuthModalMode("login");
    setShowAuthModal(true);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleShowFilterModal = () => {
    setShowFilterModal(true);
  };

  const handleCloseFilterModal = () => {
    setShowFilterModal(false);
  };

  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters);
    console.log("應用篩選條件:", filters);
    setShowFilteredResultsPage(true); // 應用篩選後切換到篩選結果頁面
    setShowFilterModal(false); // 關閉篩選 Modal
  };

  const handleClearFilters = () => {
    setAppliedFilters({}); // 清除所有篩選條件
    setShowFilteredResultsPage(false); // 返回主頁面內容（即不再顯示篩選結果）
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-inter">
      {/* Navbar 現在接收用於顯示 Modal 的函數，以及新的頁面導航函數 */}
      <Navbar
        onShowLoginModal={handleShowLoginModal}
        onShowFilterModal={handleShowFilterModal}
        onShowMerchantPage={onShowMerchantPage}
        // 將 onShowAdminPage prop 傳遞給 Navbar
        onShowAdminPage={onShowAdminPage}
      />
      <main className="flex-grow">
        {showFilteredResultsPage ? (
          // 如果 showFilteredResultsPage 為 true，則顯示篩選後的餐廳列表頁面
          <RestaurantListPage
            filters={appliedFilters}
            onClearFilters={handleClearFilters}
          />
        ) : (
          // 否則顯示主頁面內容（包括 HeroSection, PromotionsSection, FoodCategoriesSection, TestDBForm）
          <>
            <HeroSection />
            <div className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <PromotionsSection />
              {/* 在主頁面時，FoodCategoriesSection 依然顯示 RestaurantListPage，但沒有應用任何篩選 */}
              <FoodCategoriesSection />
            </div>
          </>
        )}
      </main>
      <footer className="bg-gray-800 text-white text-center py-6 text-sm">
        &copy; 2025 ChopsBook. 版權所有.
      </footer>

      {/* AuthModal 根據 showAuthModal 狀態顯示 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        initialMode={authModalMode}
      />
      {/* FilterModal 根據 showFilterModal 狀態顯示 */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={handleCloseFilterModal}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default HomePage;
