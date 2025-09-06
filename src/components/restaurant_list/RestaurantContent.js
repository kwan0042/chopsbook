// src/components/RestaurantContent.js
"use client";
import React, { useState, useCallback, useEffect, useContext } from "react";
import { useSearchParams } from "next/navigation";
import FilterSidebar from "../filters/FilterSidebar";
import RestaurantListPage from "./RestaurantListPage";
import Navbar from "@/components/Navbar";
import Modal from "../Modal";
import { AuthContext } from "../../lib/auth-context";

const RestaurantContent = () => {
  const { modalMessage, setModalMessage } = useContext(AuthContext);
  const searchParams = useSearchParams();

  const initialSearchQuery = searchParams.get("search") || "";
  const initialFilters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};

  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isGridView, setIsGridView] = useState(false);

  const handleApplyFilters = useCallback((filters) => {
    setAppliedFilters(filters);
    setSearchQuery("");
  }, []);

  const handleResetFilters = useCallback(() => {
    setAppliedFilters({});
    setSearchQuery("");
  }, []);

  // 修正後的 handleRemoveFilter 函數
  const handleRemoveFilter = useCallback((key, valueToRemove) => {
    setAppliedFilters((prevFilters) => {
      const newFilters = { ...prevFilters };

      if (Array.isArray(newFilters[key])) {
        // 多選（例如菜系），從陣列中移除該值
        newFilters[key] = newFilters[key].filter(
          (item) => item !== valueToRemove
        );
        if (newFilters[key].length === 0) {
          delete newFilters[key];
        }
      } else if (key.includes("AvgSpending")) {
        // 處理人均消費範圍篩選
        delete newFilters.minAvgSpending;
        delete newFilters.maxAvgSpending;
      } else if (key.includes("SeatingCapacity")) {
        // 處理座位數範圍篩選
        delete newFilters.minSeatingCapacity;
        delete newFilters.maxSeatingCapacity;
      } else {
        // 處理單選和數值型篩選（包含 minRating）
        delete newFilters[key];
      }
      return newFilters;
    });
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setAppliedFilters({});
  }, []);

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
      <main className="flex-grow pt-[140px]">
        <div className="max-w-screen-xl mx-auto flex gap-x-8">
          <div className="w-1/4 flex-shrink-0 relative">
            <div className="sticky top-[140px] h-[calc(90vh-140px)]">
              <FilterSidebar
                initialFilters={appliedFilters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>
          <div className="flex-grow pb-8 px-4 sm:px-6 lg:px-8">
            <RestaurantListPage
              filters={appliedFilters}
              onClearFilters={handleResetFilters}
              onRemoveFilter={handleRemoveFilter}
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

export default RestaurantContent;
