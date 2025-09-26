"use client";
import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSlidersH } from "@fortawesome/free-solid-svg-icons";
import FilterSidebar from "../filters/FilterSidebar";
import FilterModal from "../filters/FilterModal";
import RestaurantListPage from "./RestaurantListPage";
import Modal from "../Modal";
import { AuthContext } from "../../lib/auth-context";

const RestaurantContent = () => {
  const { modalMessage, setModalMessage } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 從 URL 解析篩選條件和搜尋查詢
  let appliedFilters = {};
  const filtersFromUrl = searchParams.get("filters");
  if (filtersFromUrl) {
    try {
      appliedFilters = JSON.parse(filtersFromUrl);
    } catch (e) {
      console.error("Failed to parse filters from URL:", e);
    }
  } else {
    for (const [key, value] of searchParams.entries()) {
      if (key === "search") continue;
      const allValues = searchParams.getAll(key);
      if (allValues.length > 1) {
        appliedFilters[key] = allValues;
      } else {
        try {
          appliedFilters[key] = JSON.parse(value);
        } catch (e) {
          appliedFilters[key] = value;
        }
      }
    }
  }
  const searchQuery = searchParams.get("search") || "";

  const [isGridView, setIsGridView] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDocId, setLastDocId] = useState(null);
  const [controller, setController] = useState(null);

  // 核心邏輯：當 URL 變更時觸發資料獲取
  useEffect(() => {
    // 每次變更時，先取消前一次的請求
    if (controller) {
      controller.abort();
    }
    const newController = new AbortController();
    setController(newController);

    // 重新設定分頁狀態
    setRestaurants([]);
    setLastDocId(null);
    setHasMore(true);

    const fetchRestaurants = async (startAfterDocId = null, abortSignal) => {
      console.log("Starting to fetch restaurants...");
      setLoading(true);
      try {
        const params = new URLSearchParams();
        for (const key in appliedFilters) {
          const value = appliedFilters[key];
          if (Array.isArray(value)) {
            value.forEach((item) => params.append(key, item));
          } else if (value !== "" && value !== undefined && value !== null) {
            params.append(key, value);
          }
        }
        if (searchQuery) {
          params.append("search", searchQuery);
        }
        if (startAfterDocId) {
          params.append("startAfterDocId", startAfterDocId);
        }

        const url = `/api/filter?${params.toString()}`;
        console.log("Constructed API URL:", url);

        const response = await fetch(url, {
          signal: abortSignal,
        });
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        const data = await response.json();
        if (!abortSignal.aborted) {
          if (startAfterDocId) {
            setRestaurants((prev) => [...prev, ...data.restaurants]);
          } else {
            setRestaurants(data.restaurants);
          }
          setHasMore(data.hasMore);
          setLastDocId(data.lastDocId);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch restaurants:", error);
          if (!startAfterDocId) {
            setRestaurants([]);
          }
          setHasMore(false);
        }
      } finally {
        if (!abortSignal.aborted) {
          console.log("Finished fetching.");
          setLoading(false);
        }
      }
    };

    fetchRestaurants(null, newController.signal);

    return () => {
      console.log("useEffect cleanup. Aborting fetch.");
      newController.abort();
    };
  }, [searchParams]);

  // 單獨處理「載入更多」
  const fetchMoreRestaurants = async () => {
    if (!hasMore || loading) return;

    const abortSignal = controller?.signal;
    if (abortSignal) {
      console.log("Fetching more restaurants...");
      setLoading(true);
      try {
        const params = new URLSearchParams();
        for (const key in appliedFilters) {
          const value = appliedFilters[key];
          if (Array.isArray(value)) {
            value.forEach((item) => params.append(key, item));
          } else if (value !== "" && value !== undefined && value !== null) {
            params.append(key, value);
          }
        }
        if (searchQuery) {
          params.append("search", searchQuery);
        }
        if (lastDocId) {
          params.append("startAfterDocId", lastDocId);
        }

        const url = `/api/filter?${params.toString()}`;
        console.log("Constructed API URL for more data:", url);

        const response = await fetch(url, {
          signal: abortSignal,
        });
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        const data = await response.json();
        if (!abortSignal.aborted) {
          setRestaurants((prev) => [...prev, ...data.restaurants]);
          setHasMore(data.hasMore);
          setLastDocId(data.lastDocId);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch more restaurants:", error);
          setHasMore(false);
        }
      } finally {
        if (!abortSignal.aborted) {
          console.log("Finished fetching more data.");
          setLoading(false);
        }
      }
    }
  };

  const updateUrl = (newFilters, newSearchQuery = "") => {
    const newSearchParams = new URLSearchParams();
    if (Object.keys(newFilters).length > 0) {
      newSearchParams.set("filters", JSON.stringify(newFilters));
    }
    if (newSearchQuery) {
      newSearchParams.set("search", newSearchQuery);
    }
    const newUrl = `?${newSearchParams.toString()}`;
    router.push(newUrl);
  };

  const handleApplyFilters = (filters) => {
    updateUrl(filters);
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    updateUrl({});
    setIsFilterModalOpen(false);
  };

  const handleRemoveFilter = (key, valueToRemove) => {
    const newFilters = { ...appliedFilters };
    if (key === "favoriteRestaurantIds") {
      delete newFilters.favoriteRestaurantIds;
    } else if (Array.isArray(newFilters[key])) {
      newFilters[key] = newFilters[key].filter(
        (item) => item !== valueToRemove
      );
      if (newFilters[key].length === 0) {
        delete newFilters[key];
      }
    } else if (key === "maxAvgSpending") {
      delete newFilters.maxAvgSpending;
    } else if (key === "minSeatingCapacity" || key === "maxSeatingCapacity") {
      delete newFilters.minSeatingCapacity;
      delete newFilters.maxSeatingCapacity;
    } else {
      delete newFilters[key];
    }
    updateUrl(newFilters, searchQuery);
  };

  const handleSearch = (query) => {
    updateUrl({}, query);
  };

  const toggleView = () => setIsGridView((prev) => !prev);
  const closeModal = () => setModalMessage("");

  const isFavoritesFilterActive =
    appliedFilters.favoriteRestaurantIds &&
    appliedFilters.favoriteRestaurantIds.length > 0;

  return (
    <div className="flex flex-col font-inter mb-6">
      <div className="flex-grow pt-5">
        <div className="max-w-screen-xl mx-auto flex gap-x-8">
          <div className="w-1/4 flex-shrink-0 relative">
            <div className="sticky top-[140px] h-[calc(100vh-140px)] overflow-y-auto">
              <FilterSidebar
                initialFilters={appliedFilters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>
          <div className="flex-grow pb-8 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end md:hidden mb-4">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow hover:bg-gray-50 transition-colors"
              >
                <FontAwesomeIcon icon={faSlidersH} className="mr-2" />
                篩選
              </button>
            </div>
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
              hasMore={hasMore}
              fetchMoreRestaurants={fetchMoreRestaurants}
            />
          </div>
        </div>
      </div>
      {modalMessage && (
        <Modal
          message={modalMessage}
          onClose={closeModal}
          isOpen={!!modalMessage}
        />
      )}
      <FilterModal
        key={isFilterModalOpen ? "open" : "closed"}
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        initialFilters={appliedFilters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
};

export default RestaurantContent;
