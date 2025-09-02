// src/app/restaurants/page.js
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FilterSidebar from "../../components/FilterSidebar";
import RestaurantListPage from "../../components/RestaurantListPage";
import Navbar from "../../components/Navbar";
import Modal from "../../components/Modal";
import { useContext } from "react";
import { AuthContext } from "../../lib/auth-context";

const RestaurantsPage = () => {
  const { modalMessage, setModalMessage } = useContext(AuthContext);
  const searchParams = useSearchParams();

  // 從 URL 參數中讀取初始搜尋關鍵字和篩選條件
  const initialSearchQuery = searchParams.get("search") || "";
  const initialFilters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};

  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isGridView, setIsGridView] = useState(false);

  // 應用篩選器，這個函數會被 FilterSidebar 呼叫
  const handleApplyFilters = useCallback((filters) => {
    setAppliedFilters(filters);
    setSearchQuery(""); // 應用篩選時清除搜尋關鍵字
  }, []);

  // 重置篩選器
  const handleResetFilters = useCallback(() => {
    setAppliedFilters({});
    setSearchQuery("");
  }, []);

  // 處理搜尋
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setAppliedFilters({}); // 搜尋時清除篩選條件
  }, []);

  // 切換視圖模式
  const toggleView = useCallback(() => {
    setIsGridView((prev) => !prev);
  }, []);

  const closeModal = () => setModalMessage("");

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-inter">
      <Navbar
        onShowMerchantPage={() => {}}
        onShowAdminPage={() => {}}
        onSearch={handleSearch}
      />
      <main className="flex-grow bg-white">
        <div className="max-w-screen-xl mx-auto pb-8 px-4 sm:px-6 lg:px-8 flex mt-8 gap-x-8">
          {/* 左側篩選側邊欄 */}
          <FilterSidebar
            initialFilters={appliedFilters}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />

          {/* 右側主要內容區域：餐廳列表 */}
          <div className="flex-grow">
            <RestaurantListPage
              filters={appliedFilters}
              onClearFilters={handleResetFilters}
              searchQuery={searchQuery}
              isGridView={isGridView}
              toggleView={toggleView}
            />
          </div>
        </div>
      </main>
      <footer className="bg-gray-800 text-white text-center py-6 text-sm font-light">
        &copy; {new Date().getFullYear()} ChopsBook. 版權所有.
      </footer>
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

export default RestaurantsPage;
