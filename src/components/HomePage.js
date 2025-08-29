// src/app/HomePage.js
"use client";

import React, { useState, useContext, useCallback } from "react";
import { AuthContext } from "../lib/auth-context";

// 導入所有現在獨立的組件
import Navbar from "../components/Navbar";
import FilterModal from "../components/FilterModal";
import HeroSection from "../components/HeroSection";
import PromotionsSection from "../components/PromotionsSection";
import RestaurantListPage from "../components/RestaurantListPage";
import Modal from "../components/Modal";
import FilterSidebar from "../components/FilterSidebar";

/**
 * HomePage: ChopsBook 的主登陸頁面。
 * 它現在負責組合各個區塊，並管理模態框的顯示以及頁面的核心內容切換。
 * @param {object} props - 組件屬性。
 * @param {function} props.onShowLoginPage - 顯示登入頁面的回調。
 * @param {function} props.onShowAddRestaurantPage - 導航到新增餐廳頁面的回調。
 * @param {function} props.onShowUpdateRestaurantPage - 導航到更新餐廳頁面的回調。
 * @param {function} props.onShowMerchantPage - 導航到商戶專區頁面的回調。
 * @param {function} props.onShowAdminPage - 導航到管理員頁面的回調 (新增)。
 * @param {function} props.onShowPersonalPage - 導航到個人主頁的回調 (新增)。
 */
const HomePage = ({
  onShowLoginPage,
  onShowMerchantPage,
  onShowAdminPage,
  onShowPersonalPage,
}) => {
  const { currentUser, logout, setModalMessage, modalMessage } =
    useContext(AuthContext);
  var currentYear = new Date().getFullYear();

  // 管理 FilterModal (舊有的，不同的 Modal) 的顯示狀態
  const [showFilterModal, setShowFilterModal] = useState(false);

  // 管理篩選側邊欄的篩選條件
  const [appliedFilters, setAppliedFilters] = useState({});
  // 搜尋關鍵字狀態
  const [searchQuery, setSearchQuery] = useState("");
  // 列表視圖模式
  const [isGridView, setIsGridView] = useState(false);
  // 移除 isSidebarCollapsed 狀態，因為側邊欄不再整體摺疊

  const handleShowFilterModal = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  const handleCloseFilterModal = useCallback(() => {
    setShowFilterModal(false);
  }, []);

  // 應用篩選器，來自 FilterSidebar
  const handleApplyFilters = useCallback((filters) => {
    setAppliedFilters(filters);
    console.log("應用篩選條件:", filters);
    setSearchQuery(""); // 應用篩選時清除搜尋關鍵字
  }, []);

  // 重置篩選器，來自 FilterSidebar 的重置按鈕
  const handleResetFilters = useCallback(() => {
    setAppliedFilters({}); // 清除所有篩選條件
    setSearchQuery(""); // 清除搜尋關鍵字
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setAppliedFilters({}); // 搜尋時清除篩選條件
  }, []);

  const toggleView = useCallback(() => {
    setIsGridView((prev) => !prev);
  }, []);

  const closeModal = () => setModalMessage("");

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-inter">
      {/* Navbar 現在接收用於顯示 Modal 的函數，以及新的頁面導航函數 */}
      <Navbar
        onShowFilterModal={handleShowFilterModal} // 這個是舊的 FilterModal
        onShowMerchantPage={onShowMerchantPage}
        onShowAdminPage={onShowAdminPage}
        onSearch={handleSearch}
      />
      <main className="flex-grow bg-white">
        <HeroSection />

        {/* PromotionsSection 自己一行，佔滿 max-w-screen-xl 寬度 */}
        <div className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <PromotionsSection />
        </div>

        {/* 篩選器與餐廳列表區域 */}
        {/* 調整這裡的 gap-x-8 來增加篩選器和列表之間的橫向間距 */}
        <div className="max-w-screen-xl mx-auto pb-8 px-4 sm:px-6 lg:px-8 flex mt-8 gap-x-8">
          {/* 左側篩選側邊欄 */}
          {/* 不再傳遞 isCollapsed 和 onToggleCollapse props */}
          <FilterSidebar
            initialFilters={appliedFilters} // 傳遞已應用的篩選條件，以便側邊欄顯示當前狀態
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />

          {/* 右側主要內容區域：餐廳列表 */}
          <div className="flex-grow">
            <RestaurantListPage
              filters={appliedFilters}
              onClearFilters={handleResetFilters} // 現在 RestaurantListPage 的清除篩選也指向新的重置函數
              searchQuery={searchQuery}
              isGridView={isGridView}
              toggleView={toggleView}
            />
          </div>
        </div>
      </main>
      <footer className="bg-gray-800 text-white text-center py-6 text-sm font-light">
        &copy; {currentYear} ChopsBook. 版權所有.
      </footer>

      {/* FilterModal (舊的，獨立於側邊欄) 根據 showFilterModal 狀態顯示 */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={handleCloseFilterModal}
        onApplyFilters={(filters) =>
          console.log("FilterModal applied:", filters)
        }
      />
      {modalMessage && (
        <Modal
          message={modalMessage}
          onClose={closeModal}
          isOpen={!!modalMessage}
        />
      )}
    </div>
  );
};

export default HomePage;
