// src/components/HomePage.js

"use client";

import React, { useState, useContext, useCallback, useEffect } from "react"; // ✅ 導入 useEffect
import { AuthContext } from "../../lib/auth-context";
import { useRouter } from "next/navigation";

// 導入所有現在獨立的組件

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
  const { currentUser, logout, setModalMessage, modalMessage, db, appId } =
    useContext(AuthContext); // ✅ 從 AuthContext 獲取 db 和 appId
  var currentYear = new Date().getFullYear();
  const router = useRouter();

  // 管理 FilterModal (舊有的，不同的 Modal) 的顯示狀態
  const [showFilterModal, setShowFilterModal] = useState(false);

  // ✅ 關鍵修正：添加一個狀態來強制 TrendingTopicsSection 重新載入
  const [trendingKey, setTrendingKey] = useState(0);

  // ✅ 關鍵修正：在元件載入時更新 key
  useEffect(() => {
    // 每次 HomePage 掛載時，都增加 key 的值
    // 這會強制 TrendingTopicsSection 元件完全重新渲染，從而避免快取問題
    if (db && appId) {
      // 確保 Firebase 已初始化
      setTrendingKey((prevKey) => prevKey + 1);
    }
  }, [db, appId]); // 依賴項是 db 和 appId，確保在它們可用時才執行

  const handleShowFilterModal = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  const handleCloseFilterModal = useCallback(() => {
    setShowFilterModal(false);
  }, []);

  const handleApplyFilters = useCallback(
    (filters) => {
      const params = new URLSearchParams();
      if (Object.keys(filters).length > 0) {
        params.set("filters", JSON.stringify(filters));
      }
      router.push(`/restaurants?${params.toString()}`);
      setShowFilterModal(false);
    },
    [router]
  );

  const closeModal = () => setModalMessage("");

  return (
    <div className="min-h-screen flex flex-col  font-inter">
      
      <main className="flex-grow">
        <HeroSection />

        <div className=" mx-auto py-21 px-2 sm:px-2 lg:px-12">
          <div className="grid grid-cols-6 md:grid-cols-6 gap-4">
            <div className="col-span-1  grid grid-cols-1 gap-4 h-fit">
              {/* <WeeklyRankingsSection /> */}
              <PersonalizedSection />
            </div>
            <div className="col-span-4 grid grid-cols-1 gap-4">
              <PromotionsSection />
              {/* ✅ 關鍵修正：將 key prop 傳遞給 TrendingTopicsSection */}
              <TrendingTopicsSection key={trendingKey} />
            </div>
            <div className="col-span-1 grid grid-cols-1 gap-4 h-fit">
              <InteractivePollSection />
              {/* <RandomPickerSection /> */}
              <LatestReviewsSection />
            </div>
          </div>
          <TrendingCateSection />
        </div>
      </main>
      <footer className="bg-gray-800 text-white text-center py-6 text-sm font-light">
        &copy; {currentYear} ChopsBook. 版權所有.
      </footer>

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
