// src/components/AppLayout.js
"use client";

import React, { useState, useCallback, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "./Navbar";
import FilterModal from "@/components/filters/FilterModal";
import { AuthContext } from "@/lib/auth-context";
import Footer from "./Footer.jsx";

// 假設這裡從另一個地方導入了 setRestaurants，用於更新頁面數據
// import { useRestaurantContext } from '@/lib/restaurant-context';

const AppLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { setModalMessage } = useContext(AuthContext);
  // const { setRestaurants } = useRestaurantContext(); // 假設有這個 Context

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // 檢查是否為餐廳頁面，如果是則不顯示篩選按鈕
  const isRestaurantsPage = pathname === "/restaurants";

  const handleShowFilterModal = useCallback(() => {
    // 只有在非 /restaurants 頁面才顯示模態框
    if (!isRestaurantsPage) {
      setIsFilterModalOpen(true);
    }
  }, [isRestaurantsPage]);

  const handleCloseFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  

  // ⚡️ 修正的 handleApplyFilters：直接呼叫 API
  const handleApplyFilters = useCallback(
    async (filters) => {
      // 1. 轉換為 URLSearchParams
      // 注意：這裡假設 filters 已經被正確格式化，或者您打算將整個 filters 物件作為 JSON 傳遞
      // 為了導航到 /restaurants 頁面，我們通常會將篩選物件 JSON 編碼並作為單一參數傳遞
      const params = new URLSearchParams({ filters: JSON.stringify(filters) });

      // 2. 導航到餐廳頁面並帶上篩選參數，讓該頁面處理 API 呼叫
      router.push(`/restaurants?${params.toString()}`);

      handleCloseFilterModal();

  
    },
    [router, handleCloseFilterModal, setModalMessage] // 確保所有依賴都列出
  );

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Navbar
          onShowFilterModal={handleShowFilterModal}
          isRestaurantsPage={isRestaurantsPage}
        />
        <main className="flex-grow mb-6">{children}</main>
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={handleCloseFilterModal}
          onApplyFilters={handleApplyFilters}
          // 🚨 這是修復 onResetFilters is not a function 的關鍵！
          
        />
        <Footer/>
      </div>
    </>
  );
};

export default AppLayout;
