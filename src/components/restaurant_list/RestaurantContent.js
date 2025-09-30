"use client";
import React, { useState, useEffect, useContext, useCallback } from "react"; // ⚡️ 導入 useCallback
import { useSearchParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSlidersH } from "@fortawesome/free-solid-svg-icons";
import FilterSidebar from "../filters/FilterSidebar";
import FilterModal from "../filters/FilterModal";
import RestaurantListPage from "./RestaurantListPage";
import Modal from "../Modal";
import { AuthContext } from "../../lib/auth-context";

// ⚡️ 輔助函數：將物件形式的菜系篩選器轉換為字串陣列
const normalizeCuisineFilters = (filters) => {
  const normalizedFilters = {};

  for (const [key, value] of Object.entries(filters)) {
    if (key === "cuisineType") {
      let cuisineValues = [];

      if (Array.isArray(value)) {
        // 情況 1: 已經是字串陣列或物件陣列 (需要轉換)
        cuisineValues = value
          .map((v) => {
            if (typeof v === "string") return v;
            if (typeof v === "object" && v !== null && v.subType)
              return v.subType; // 優先取 subType
            return null;
          })
          .filter(Boolean);
      } else if (typeof value === "object" && value !== null && value.subType) {
        // 情況 2: 是單個物件 {category: "...", subType: "..."}
        cuisineValues = [value.subType];
      } else if (typeof value === "string") {
        // 情況 3: 單個字串
        cuisineValues = [value];
      }

      if (cuisineValues.length > 0) {
        // 確保結果是去重後的字串陣列
        normalizedFilters[key] = Array.from(new Set(cuisineValues));
      }
    } else {
      normalizedFilters[key] = value;
    }
  }
  return normalizedFilters;
};

const RestaurantContent = () => {
  const { modalMessage, setModalMessage } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  // ⚡️ 核心修正：更穩定的 URL 參數解析邏輯
  let appliedFilters = {};
  const filtersFromUrl = searchParams.get("filters");

  if (filtersFromUrl) {
    // 1. PRIMARY PATH: 嘗試解析 JSON 'filters' 參數
    try {
      const parsedFilters = JSON.parse(filtersFromUrl);
      appliedFilters = normalizeCuisineFilters(parsedFilters);
    } catch (e) {
      console.error("Failed to parse 'filters' JSON from URL:", e);
      // 如果解析失敗，appliedFilters 保持為 {}，將進入 fallback
    }
  }

  // 2. FALLBACK PATH: 如果 appliedFilters 仍然為空，檢查扁平化參數
  if (Object.keys(appliedFilters).length === 0) {
    let flatFilters = {};
    for (const [key, value] of searchParams.entries()) {
      if (key === "search" || key === "filters") continue;

      const allValues = searchParams.getAll(key);
      if (allValues.length > 1) {
        flatFilters[key] = allValues; // 處理多值參數
      } else {
        // 嘗試解析單值，如數字、布林值或被 JSON.stringify 過的單個物件
        try {
          flatFilters[key] = JSON.parse(value);
        } catch (e) {
          flatFilters[key] = value; // 視為單個字串
        }
      }
    }
    // 對從扁平參數讀取到的篩選器進行規範化
    appliedFilters = normalizeCuisineFilters(flatFilters);
  }

  // 保持 search 獨立
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

        // 確保將所有篩選條件 JSON 編碼到 'filters' 參數中，以便API集中處理
        const apiFilters = normalizeCuisineFilters(appliedFilters);
        if (Object.keys(apiFilters).length > 0) {
          params.set("filters", JSON.stringify(apiFilters));
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
  }, [searchParams]); // 依賴於 searchParams 的變動

  // 單獨處理「載入更多」
  const fetchMoreRestaurants = async () => {
    if (!hasMore || loading) return;

    const abortSignal = controller?.signal;
    if (abortSignal) {
      console.log("Fetching more restaurants...");
      setLoading(true);
      try {
        const params = new URLSearchParams();

        // ⚡️ 使用 JSON 編碼的 'filters' 參數
        const apiFilters = normalizeCuisineFilters(appliedFilters);
        if (Object.keys(apiFilters).length > 0) {
          params.set("filters", JSON.stringify(apiFilters));
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

  // ⚡️ 修正：使用 useCallback 包裹 updateUrl
  const updateUrl = useCallback(
    (newFilters, newSearchQuery = "") => {
      const newSearchParams = new URLSearchParams();

      // 將所有篩選條件 JSON 編碼到 'filters' 參數
      const filtersToStore = normalizeCuisineFilters(newFilters);

      if (Object.keys(filtersToStore).length > 0) {
        newSearchParams.set("filters", JSON.stringify(filtersToStore));
      }
      if (newSearchQuery) {
        newSearchParams.set("search", newSearchQuery);
      }
      const newUrl = `/restaurants?${newSearchParams.toString()}`;
      router.push(newUrl); // 觸發 URL 變更，進而觸發 useEffect 進行數據獲取
    },
    [router]
  );

  // ⚡️ 修正：使用 useCallback 包裹 handleApplyFilters
  const handleApplyFilters = useCallback(
    (filters) => {
      // 這裡的 filters 可能是來自 FilterSidebar/Modal 的物件
      // updateUrl 函數會負責將其 JSON 編碼並更新 URL
      updateUrl(filters);
      setIsFilterModalOpen(false);
    },
    [updateUrl]
  );

  // ⚡️ 修正：使用 useCallback 包裹 handleResetFilters
  const handleResetFilters = useCallback(() => {
    updateUrl({});
    setIsFilterModalOpen(false);
  }, [updateUrl]);

  // ⚡️ 修正：使用 useCallback 包裹 handleRemoveFilter
  const handleRemoveFilter = useCallback(
    (key, valueToRemove) => {
      let newFilters = { ...appliedFilters };

      if (key === "favoriteRestaurantIds") {
        delete newFilters.favoriteRestaurantIds;
      } else if (key === "cuisineType") {
        // 處理 cuisineType 的移除
        if (Array.isArray(newFilters[key])) {
          newFilters[key] = newFilters[key].filter(
            (item) => item !== valueToRemove
          );
        }
        // 處理單個字串的移除 (從 fallback 邏輯中來)
        else if (newFilters[key] === valueToRemove) {
          delete newFilters[key];
        }

        if (Array.isArray(newFilters[key]) && newFilters[key].length === 0) {
          delete newFilters[key];
        }
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

      // 再次呼叫 updateUrl，它會進行最終的正規化並更新 URL
      updateUrl(newFilters, searchQuery);
    },
    [appliedFilters, searchQuery, updateUrl]
  );

  const handleSearch = (query) => {
    updateUrl(appliedFilters, query);
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
                // 這裡傳遞給 FilterSidebar 的 appliedFilters 已經是正確解析的物件
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
              filters={appliedFilters} // 確保這裡接收到正確的 filters
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
              onSearch={handleSearch}
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
