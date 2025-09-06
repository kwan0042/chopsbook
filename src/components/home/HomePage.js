// src/app/HomePage.js
"use client";

import React, { useState, useContext, useCallback } from "react";
import { AuthContext } from "../../lib/auth-context";
import { useRouter } from "next/navigation"; // 導入 useRouter

// 導入所有現在獨立的組件
import Navbar from "../Navbar";
import FilterModal from "../filters/FilterModal";
import HeroSection from "./HeroSection";
import PromotionsSection from "./PromotionsSection";
import Modal from "../Modal";

/**
 * HomePage: ChopsBook 的主登陸頁面。
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
  const router = useRouter(); // 實例化 useRouter

  // 管理 FilterModal (舊有的，不同的 Modal) 的顯示狀態
  const [showFilterModal, setShowFilterModal] = useState(false);

  const handleShowFilterModal = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  const handleCloseFilterModal = useCallback(() => {
    setShowFilterModal(false);
  }, []);

  // 修改應用篩選器函數，讓它導航到餐廳列表頁面並傳遞篩選條件
  const handleApplyFilters = useCallback(
    (filters) => {
      // 將篩選條件轉換為 URL 參數
      const params = new URLSearchParams();
      if (Object.keys(filters).length > 0) {
        params.set("filters", JSON.stringify(filters));
      }
      // 導航到餐廳列表頁面並帶上參數
      router.push(`/restaurants?${params.toString()}`);
      setShowFilterModal(false); // 應用篩選後關閉 FilterModal
    },
    [router]
  );

  const closeModal = () => setModalMessage("");

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-inter">
      {/* Navbar 現在接收用於顯示 Modal 的函數，以及新的頁面導航函數 */}
      <Navbar
        onShowFilterModal={handleShowFilterModal}
        onShowMerchantPage={onShowMerchantPage}
        onShowAdminPage={onShowAdminPage}
      />
      <main className="flex-grow bg-white">
        <HeroSection />

        <div className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <PromotionsSection />
        </div>
      </main>
      <footer className="bg-gray-800 text-white text-center py-6 text-sm font-light">
        &copy; {currentYear} ChopsBook. 版權所有.
      </footer>

      {/* FilterModal 根據 showFilterModal 狀態顯示 */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={handleCloseFilterModal}
        onApplyFilters={handleApplyFilters}
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
