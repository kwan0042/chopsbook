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

// 導入新的功能區塊元件
import WeeklyRankingsSection from "./WeeklyRankingsSection.jsx";
import RandomPickerSection from "./RandomPickerSection.jsx";
import LatestReviewsSection from "./LatestReviewsSection.jsx";
import TrendingCateSection from "./TrendingCateSection.jsx";
import InteractivePollSection from "./InteractivePollSection.jsx";
import PersonalizedSection from "./PersonalizedSection.jsx";
import TrendingTopicsSection from "./TrendingTopicsSection.jsx";
import PopularReviewsSection from "./PopularReviewsSection.jsx";

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
    // 更新背景色以匹配新設計的專業感
    <div className="min-h-screen flex flex-col bg-gray-50 font-inter">
      {/* Navbar 現在接收用於顯示 Modal 的函數，以及新的頁面導航函數 */}
      <Navbar
        onShowFilterModal={handleShowFilterModal}
        onShowMerchantPage={onShowMerchantPage}
        onShowAdminPage={onShowAdminPage}
      />
      <main className="flex-grow">
        {/* HeroSection 保持不變，但更新了背景色以匹配新設計 */}
        <HeroSection />

        <div className=" mx-auto py-21 px-2 sm:px-2 lg:px-12">
          {/* 使用網格佈局來集中展示多個功能區塊 */}
          <div className="grid grid-cols-6 md:grid-cols-6 gap-8">
            <div className="col-span-1  grid grid-cols-1 gap-8 h-fit">
              <WeeklyRankingsSection />
              <PersonalizedSection />
            </div>
            <div className="col-span-4 grid grid-cols-1 gap-8">
              <PromotionsSection />
              <TrendingTopicsSection />
              <PopularReviewsSection />
            </div>
            <div className="col-span-1 grid grid-cols-1 gap-8 h-fit">
              <InteractivePollSection />
              <RandomPickerSection />
              <LatestReviewsSection />
            </div>
          </div>

          

          {/* 獨立的餐廳類別區塊，位於主要網格下方 */}
          <TrendingCateSection />
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
