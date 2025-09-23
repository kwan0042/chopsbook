"use client";
import React, { useState, useCallback, useEffect, useContext } from "react";
import { useSearchParams } from "next/navigation";
import FilterSidebar from "../filters/FilterSidebar";
import RestaurantListPage from "./RestaurantListPage";

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

  // 簡化狀態：只保留餐廳列表和載入狀態
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // 核心邏輯：簡化資料獲取函式，移除所有分頁相關參數
  const fetchRestaurants = useCallback(
    async (signal) => {
      setLoading(true);

      try {
        const params = new URLSearchParams();

        if (
          appliedFilters.favoriteRestaurantIds &&
          appliedFilters.favoriteRestaurantIds.length > 0
        ) {
          appliedFilters.favoriteRestaurantIds.forEach((id) =>
            params.append("favoriteRestaurantIds[]", id)
          );
        }

        if (searchQuery) {
          params.append("search", searchQuery);
        } else {
          for (const key in appliedFilters) {
            const value = appliedFilters[key];
            if (key === "favoriteRestaurantIds") continue;
            if (Array.isArray(value)) {
              value.forEach((item) => params.append(`${key}[]`, item));
            } else if (value !== "" && value !== undefined && value !== null) {
              params.append(key, value);
            }
          }
        }

        const response = await fetch(`/api/filter?${params.toString()}`, {
          signal,
        });
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        const data = await response.json();

        if (!signal.aborted) {
          // 直接設定所有餐廳
          setRestaurants(data.restaurants);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch restaurants:", error);
          setRestaurants([]);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [appliedFilters, searchQuery]
  );

  // useEffect 現在只依賴於 `fetchRestaurants` 函式，並在篩選/搜尋條件改變時觸發
  useEffect(() => {
    const controller = new AbortController();
    fetchRestaurants(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchRestaurants]);

  // 簡化處理函式，只負責更新篩選和搜尋狀態
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

  const isFavoritesFilterActive =
    appliedFilters.favoriteRestaurantIds &&
    appliedFilters.favoriteRestaurantIds.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-cbbg font-inter">
      <main className="flex-grow pt-[140px]">
        <div className="max-w-screen-xl mx-auto flex gap-x-8">
          <div className="w-1/4 flex-shrink-0 relative">
            <div className="sticky top-[140px] h-[calc(-155px+100vh)]">
              <FilterSidebar
                key={JSON.stringify(appliedFilters)}
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
              restaurants={restaurants}
              loading={loading}
              isFavoritesFilterActive={isFavoritesFilterActive}
            />
            {/* 移除分頁按鈕 */}
          </div>
        </div>
      </main>
      
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
