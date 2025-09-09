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
  const [restaurants, setRestaurants] = useState([]); // 新增：管理餐廳列表狀態
  const [loading, setLoading] = useState(true); // 新增：管理載入狀態

  // 新增：根據 filters 和 searchQuery 取得餐廳資料的函數
  const fetchRestaurants = useCallback(async (filters, searchQuery) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Tag: 收藏餐廳篩選
      if (
        filters.favoriteRestaurantIds &&
        filters.favoriteRestaurantIds.length > 0
      ) {
        filters.favoriteRestaurantIds.forEach((id) =>
          params.append("favoriteRestaurantIds[]", id)
        );
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      } else {
        for (const key in filters) {
          const value = filters[key];
          if (key === "favoriteRestaurantIds") continue; // 已經處理過，跳過
          if (Array.isArray(value)) {
            value.forEach((item) => params.append(`${key}[]`, item));
          } else if (value !== "" && value !== undefined && value !== null) {
            params.append(key, value);
          }
        }
      }

      const response = await fetch(`/api/filter?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();
      setRestaurants(data.restaurants);
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 新增：當 filters 或 searchQuery 改變時，重新載入餐廳資料
  useEffect(() => {
    fetchRestaurants(appliedFilters, searchQuery);
  }, [appliedFilters, searchQuery, fetchRestaurants]);

  const handleApplyFilters = useCallback((filters) => {
    setAppliedFilters(filters);
    setSearchQuery("");
  }, []);

  const handleResetFilters = useCallback(() => {
    setAppliedFilters({});
    setSearchQuery("");
  }, []);

  const handleRemoveFilter = useCallback((key, valueToRemove) => {
    setAppliedFilters((prevFilters) => {
      const newFilters = { ...prevFilters };

      if (key === "favoriteRestaurantIds") {
        delete newFilters.favoriteRestaurantIds;
      } else if (Array.isArray(newFilters[key])) {
        newFilters[key] = newFilters[key].filter(
          (item) => item !== valueToRemove
        );
        if (newFilters[key].length === 0) {
          delete newFilters[key];
        }
      } else if (key === "minAvgSpending" || key === "maxAvgSpending") {
        delete newFilters.minAvgSpending;
        delete newFilters.maxAvgSpending;
      } else if (key === "minSeatingCapacity" || key === "maxSeatingCapacity") {
        delete newFilters.minSeatingCapacity;
        delete newFilters.maxSeatingCapacity;
      } else {
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

  // 判斷收藏篩選是否啟用
  const isFavoritesFilterActive =
    appliedFilters.favoriteRestaurantIds &&
    appliedFilters.favoriteRestaurantIds.length > 0;

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
            <div className="sticky top-[140px] h-[calc(-155px+100vh)]">
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
              restaurants={restaurants} // 傳遞 restaurants 列表給子組件
              loading={loading} // 傳遞 loading 狀態給子組件
              isFavoritesFilterActive={isFavoritesFilterActive} // 新增：傳遞收藏篩選狀態
            />
          </div>
        </div>
      </main>
      <footer className="mt-5 bg-gray-800 text-white text-center py-6 text-sm font-light">
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
