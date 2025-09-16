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

  // 管理分頁相關的狀態
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDocMap, setLastDocMap] = useState({ 0: null });

  const ITEMS_PER_PAGE = 10;

  // 使用 useEffect 來處理資料獲取，這樣可以避免無限迴圈
  useEffect(() => {
    // 建立一個 AbortController，用於在元件卸載或依賴項改變時取消請求
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchRestaurants = async () => {
      setLoading(true);
      setRestaurants([]);

      try {
        const params = new URLSearchParams();
        params.append("limit", ITEMS_PER_PAGE);

        const startAfterDocId = lastDocMap[currentPage - 1];
        if (startAfterDocId) {
          params.append("startAfterDocId", startAfterDocId);
        }

        // Tag: 收藏餐廳篩選
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

        // 檢查請求是否已取消，如果沒有才更新狀態
        if (!signal.aborted) {
          setRestaurants(data.restaurants);
          setHasMore(data.hasMore);

          setLastDocMap((prevMap) => ({
            ...prevMap,
            [currentPage]: data.lastDocId,
          }));
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
    };

    fetchRestaurants();

    // 清理函數：在下一個 useEffect 運行或元件卸載時取消請求
    return () => {
      controller.abort();
    };
  }, [appliedFilters, searchQuery, currentPage]); // 僅依賴於這些狀態，不會再形成循環

  const handleApplyFilters = useCallback((filters) => {
    setAppliedFilters(filters);
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setAppliedFilters({});
    setSearchQuery("");
    setCurrentPage(1);
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
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setAppliedFilters({});
    setCurrentPage(1);
  }, []);

  const toggleView = useCallback(() => {
    setIsGridView((prev) => !prev);
  }, []);

  const closeModal = () => setModalMessage("");

  const handleNextPage = () => {
    if (hasMore && !loading) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

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
            {!loading && restaurants.length > 0 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                {/* 僅當不在第一頁時才顯示「上一頁」按鈕 */}
                {currentPage > 1 && (
                  <button
                    onClick={handlePrevPage}
                    className="px-6 py-3 bg-white border border-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:bg-gray-200 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    上一頁
                  </button>
                )}
                <span className="text-gray-700 font-medium">
                  第 {currentPage} 頁
                </span>
                {/* 僅當有更多結果時才顯示「下一頁」按鈕 */}
                {hasMore && (
                  <button
                    onClick={handleNextPage}
                    className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? "載入中..." : "下一頁"}
                  </button>
                )}
              </div>
            )}
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
