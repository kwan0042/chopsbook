"use client";
import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSlidersH, faTimes } from "@fortawesome/free-solid-svg-icons";
import FilterSidebar from "../filters/FilterSidebar";
import RestaurantListPage from "./RestaurantListPage";
import Modal from "../Modal";
import { AuthContext } from "../../lib/auth-context";

// 輔助函數：判斷是否為中文
const isChinese = (text) => /[\u4e00-\u9fff]/.test(text.trim());

const RestaurantContent = () => {
  const { modalMessage, setModalMessage } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. 初始化一個集合，包含所有應視為陣列的鍵
  const ARRAY_KEYS = [
    "category",
    "subCategory",
    "reservationModes",
    "paymentMethods",
    "facilities",
    "favoriteRestaurantIds",
  ];

  let appliedFilters = {};
  const filtersFromUrl = searchParams.get("filters");

  if (filtersFromUrl) {
    try {
      appliedFilters = JSON.parse(filtersFromUrl);
    } catch (e) {
      console.error("Failed to parse filters from URL:", e);
    }
  } else {
    const rawFilters = {};
    for (const [key, value] of searchParams.entries()) {
      if (key === "search" || key === "page" || key === "currentPage") continue;

      const allValues = searchParams.getAll(key);

      if (allValues.length > 0) {
        if (ARRAY_KEYS.includes(key)) {
          appliedFilters[key] = allValues;
        } else if (allValues.length > 1) {
          appliedFilters[key] = allValues;
        } else {
          const singleValue = allValues[0];
          try {
            appliedFilters[key] = JSON.parse(singleValue);
          } catch (e) {
            appliedFilters[key] = singleValue;
          }
        }
      }
    }

    if (appliedFilters.minSeatingCapacity) {
      appliedFilters.minSeatingCapacity = Number(
        appliedFilters.minSeatingCapacity
      );
    }
    if (appliedFilters.maxSeatingCapacity) {
      appliedFilters.maxSeatingCapacity = Number(
        appliedFilters.maxSeatingCapacity
      );
    }
    if (appliedFilters.maxAvgSpending) {
      appliedFilters.maxAvgSpending = Number(appliedFilters.maxAvgSpending);
    }
  }
  const searchQuery = searchParams.get("search") || "";

  const [isGridView, setIsGridView] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [lastDocId, setLastDocId] = useState(null);
  const [pageHistory, setPageHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [controller, setController] = useState(null);

  // ⭐️ 新增邏輯：控制背景頁面滾動 ⭐️
  useEffect(() => {
    if (isFilterModalOpen) {
      // 禁用背景頁面滾動
      document.body.style.overflow = "hidden";
    } else {
      // 啟用背景頁面滾動
      document.body.style.overflow = "unset";
    }

    // 清理函式：確保元件卸載或狀態變更時，滾動會恢復
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFilterModalOpen]);
  // ------------------------------------

  // --- 核心資料獲取函式 (保持不變) ---
  const fetchRestaurants = async (anchorIdToUse = null, abortSignal) => {
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
        const query = searchQuery.trim();
        const isZh = isChinese(query);
        params.append("searchLanguage", isZh ? "zh" : "en");
        const normalizedQuery = isZh ? query : query.toLowerCase();
        params.append("search", normalizedQuery);

        console.log(
          `[Search Debug] Query: "${normalizedQuery}", Language: ${
            isZh ? "中文" : "英文(小寫)"
          }`
        );
      }

      if (anchorIdToUse) {
        params.append("startAfterDocId", anchorIdToUse);
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
        setRestaurants(data.restaurants);
        setHasMore(data.hasMore);
        setLastDocId(data.lastDocId);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to fetch restaurants:", error);
        if (!anchorIdToUse) {
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

  // 核心邏輯：當 URL 變更時觸發資料獲取 (保持不變)
  useEffect(() => {
    if (controller) {
      controller.abort();
    }
    const newController = new AbortController();
    setController(newController);

    setRestaurants([]);
    setLastDocId(null);
    setHasMore(true);

    if (currentPage !== 1 || pageHistory.length > 0) {
      setCurrentPage(1);
      setPageHistory([]);
      fetchRestaurants(null, newController.signal);
    } else {
      fetchRestaurants(null, newController.signal);
    }

    return () => {
      console.log("useEffect cleanup. Aborting fetch.");
      newController.abort();
    };
  }, [searchParams]);

  // 監聽 currentPage 變化 (保持不變)
  useEffect(() => {
    if (loading) return;

    let anchorIdToUse = null;

    if (currentPage === 1) {
      anchorIdToUse = null;
    } else {
      anchorIdToUse = pageHistory[currentPage - 2];

      if (!anchorIdToUse) {
        console.warn(
          `[Pagination] Missing anchorId for page ${currentPage}. Re-fetching page 1.`
        );
        setCurrentPage(1);
        return;
      }
    }

    fetchRestaurants(anchorIdToUse, controller?.signal);
  }, [currentPage]);

  // --- 新增: 下一頁按鈕點擊處理函式 (保持不變) ---
  const handleNextPage = () => {
    if (!hasMore || loading || !lastDocId) return;

    console.log(`Moving to page ${currentPage + 1}...`);

    setPageHistory((prev) => [...prev, lastDocId]);
    setCurrentPage((prev) => prev + 1);
  };

  // --- 上一頁按鈕點擊處理函式 (保持不變) ---
  const handlePrevPage = () => {
    if (currentPage > 1 && !loading) {
      console.log(`Moving back to page ${currentPage - 1}...`);

      const newPage = currentPage - 1;

      setPageHistory((prev) => prev.slice(0, newPage - 1));
      setCurrentPage(newPage);
    }
  };

  // --- URL 更新邏輯 (保持不變) ---
  const updateUrl = (newFilters, newSearchQuery = "") => {
    const newSearchParams = new URLSearchParams();
    for (const key in newFilters) {
      const value = newFilters[key];
      if (Array.isArray(value)) {
        value.forEach((item) => newSearchParams.append(key, item));
      } else if (value !== "" && value !== undefined && value !== null) {
        newSearchParams.append(key, value);
      }
    }

    if (newSearchQuery) {
      newSearchParams.set("search", newSearchQuery);
    }

    const newUrl = `?${newSearchParams.toString()}`;
    router.push(newUrl);
  };

  const handleApplyFilters = (filters) => {
    updateUrl(filters);
    setIsFilterModalOpen(false); // 應用後關閉側邊欄
  };

  const handleResetFilters = () => {
    updateUrl({});
    setIsFilterModalOpen(false); // 重設後關閉側邊欄
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
      {/* ⚡️ 修正 1：將 Sticky 橫幅移到最頂層，確保其粘性作用於整個視口滾動 ⚡️ */}
      <div className="md:hidden sticky top-[116px] z-40 w-full bg-gray-700 ">
        {/* 內層容器：用於限制內容的最大寬度並添加邊距 */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="flex justify-between items-center w-full ">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="inline-flex items-center justify-center p-2 text-sm font-medium 
                             rounded-lg shadow-md group bg-gradient-to-br 
                             transition-colors duration-200 w-fit h-fit"
              aria-label="開啟篩選側邊欄"
            >
              <span
                className="relative px-3 py-1 transition-all ease-in duration-75 
                               bg-white dark:bg-gray-900 rounded-lg group-hover:bg-transparent 
                               group-hover:dark:bg-transparent
                               text-gray-900 dark:text-white font-bold 
                               flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faSlidersH} className="text-base" />
                <span>篩選</span>
              </span>
            </button>
          </div>
        </div>
      </div>
      {/* ------------------------------------------------ */}

      <div className="flex-grow pt-5">
        <div className="max-w-screen-xl mx-auto flex gap-x-8">
          {/* --- 桌面版 FilterSidebar (保持不變) --- */}
          <div className="hidden md:block w-1/4 flex-shrink-0 relative">
            <div className="sticky top-[140px] h-[calc(100vh-140px)] overflow-y-auto">
              <FilterSidebar
                initialFilters={appliedFilters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>

          <div className="flex-grow pb-8 md:px-4 sm:px-6 lg:px-8 ">
            <RestaurantListPage
              filters={appliedFilters}
              currentPage={currentPage}
              onClearFilters={handleResetFilters}
              onRemoveFilter={handleRemoveFilter}
              searchQuery={searchQuery}
              isGridView={isGridView}
              toggleView={toggleView}
              restaurants={restaurants}
              loading={loading}
              isFavoritesFilterActive={isFavoritesFilterActive}
            />

            {/* --- 分頁按鈕區塊 (保持不變) --- */}
            <div className="flex justify-center mb-3 space-x-4">
              <span className="flex items-center text-lg text-gray-700">
                目前頁面: {currentPage}
              </span>

              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1 || loading || searchQuery}
                className={`px-6 py-3 text-lg font-semibold rounded-lg transition-colors ${
                  currentPage === 1 || loading || searchQuery
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                上一頁
              </button>

              <button
                onClick={handleNextPage}
                disabled={loading || !hasMore || !lastDocId || searchQuery}
                className={`px-6 py-3 text-lg font-semibold rounded-lg transition-colors ${
                  loading || !hasMore || !lastDocId || searchQuery
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                下一頁
              </button>
            </div>
            {/* --------------------- */}
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

      {/* ⚡️ 修正 3: 手機版 FilterSidebar 的自訂 Modal 實作 (從左側滑入/滑出) ⚡️ */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 h-[100dvh]
          ${isFilterModalOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        {/* 1. 背景遮罩 (Fade-in/out) */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsFilterModalOpen(false)} // 點擊背景關閉
        />

        {/* 2. 側邊欄內容 (Slide-in/out) */}
        <div
          // 定位保持不變
          className={`absolute left-0 top-0 h-full w-full sm:w-80 max-w-[80%] 
            bg-white shadow-2xl  transform transition-transform duration-300 ease-out overflow-y-auto`}
          style={{
            transform: isFilterModalOpen
              ? "translateX(0)"
              : "translateX(-100%)",
          }}
          // 阻止點擊側邊欄內容時關閉 Modal
          onClick={(e) => e.stopPropagation()}
        >
          {/* ❌ 移除原有的關閉按鈕，現在它將由 FilterSidebar 內部處理 ❌ */}

          {/* 重新渲染 FilterSidebar，現在它成為移動端的 Modal 內容 */}
          <FilterSidebar
            initialFilters={appliedFilters}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            // ⭐️ 新增 prop: 將關閉 Modal 的動作傳遞給 FilterSidebar ⭐️
            onCloseModal={() => setIsFilterModalOpen(false)}
          />
        </div>
      </div>
      {/* --------------------------------------------- */}
    </div>
  );
};

export default RestaurantContent;
