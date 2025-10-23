// src/components/RestaurantContent.js
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

// 輔助函數：判斷是否為中文 (新增)
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
    // 保持不變 (如果使用單一 JSON 格式的 filters 參數)
    try {
      appliedFilters = JSON.parse(filtersFromUrl);
    } catch (e) {
      console.error("Failed to parse filters from URL:", e);
    }
  } else {
    // 2. 修正的 URL 遍歷和解析邏輯
    const rawFilters = {};
    for (const [key, value] of searchParams.entries()) {
      if (key === "search" || key === "page" || key === "currentPage") continue;

      const allValues = searchParams.getAll(key);

      // 統一使用 getAll() 的結果
      if (allValues.length > 0) {
        // 處理多個值，或僅有一個值但我們想將其視為陣列的情況 (如 category/subCategory)

        // 對於應該是陣列的鍵，直接賦值 allValues (即便只有一個元素)
        if (ARRAY_KEYS.includes(key)) {
          appliedFilters[key] = allValues;
        } else if (allValues.length > 1) {
          appliedFilters[key] = allValues; // 其它多值參數
        } else {
          // 對於單值的參數 (如 province, city, maxAvgSpending)
          const singleValue = allValues[0];
          try {
            // 嘗試將數字型參數（如 maxAvgSpending, min/maxSeatingCapacity）轉換為數字
            appliedFilters[key] = JSON.parse(singleValue);
          } catch (e) {
            // 保持為字符串 (例如 province="台北", businessHours="營業中")
            appliedFilters[key] = singleValue;
          }
        }
      }
    }

    // 額外處理：確保 min/maxSeatingCapacity 被正確處理為數字
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
  const [controller, setController] = useState(null);

  // 新增狀態: 追蹤當前頁碼 (用於 UI 顯示)
  const [currentPage, setCurrentPage] = useState(1);

  // --- 核心資料獲取函式 ---
  // 現在 fetchMoreRestaurants 是 fetchRestaurants 的一個通用版本
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

      // ⬇️ 核心修改區塊 ⬇️
      if (searchQuery) {
        const query = searchQuery.trim();
        const isZh = isChinese(query);

        // 1. 告訴後端搜尋目標語言
        params.append("searchLanguage", isZh ? "zh" : "en");

        // 2. 傳遞正規化後的查詢字串
        // 如果是英文，轉為小寫，以匹配 Firestore 的 name_lowercase_en
        const normalizedQuery = isZh ? query : query.toLowerCase();
        params.append("search", normalizedQuery);

        console.log(
          `[Search Debug] Query: "${normalizedQuery}", Language: ${
            isZh ? "中文" : "英文(小寫)"
          }`
        );
      }
      // ⬆️ 核心修改區塊 ⬆️

      // 傳入分頁指標
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
        // *** 傳統分頁模式: 不論是否為第一頁，都使用新數據替換現有列表 ***
        setRestaurants(data.restaurants);
        setHasMore(data.hasMore);
        setLastDocId(data.lastDocId);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to fetch restaurants:", error);
        // 如果是第一頁請求失敗，清空列表
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
    setCurrentPage(1); // <--- 重置頁碼為第一頁

    // 啟動第一次資料獲取 (startAfterDocId 為 null)
    fetchRestaurants(null, newController.signal);

    return () => {
      console.log("useEffect cleanup. Aborting fetch.");
      newController.abort();
    };
  }, [searchParams]);

  // --- 新增: 下一頁按鈕點擊處理函式 ---
  const handleNextPage = () => {
    // 確保有更多數據、不在載入中且有 lastDocId 才能點擊
    if (!hasMore || loading || !lastDocId) return;

    console.log(`Moving to page ${currentPage + 1}...`);

    // 1. 更新頁碼
    setCurrentPage((prev) => prev + 1);

    // 2. 呼叫 fetchRestaurants 載入下一頁數據
    // 注意：這裡使用 fetchRestaurants，並傳遞 lastDocId 作為下一頁的起點
    fetchRestaurants(lastDocId, controller?.signal);
  };

  // *** 移除原有的 fetchMoreRestaurants 函式，因為它的邏輯已整合到 fetchRestaurants 並由 handleNextPage 呼叫 ***

  const updateUrl = (newFilters, newSearchQuery = "") => {
    const newSearchParams = new URLSearchParams();
    // 統一將所有篩選條件獨立地加入 URL，確保後端可以讀取
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
    // 重置分頁狀態，讓 useEffect 重新從第一頁開始

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
              currentPage={currentPage}
              onClearFilters={handleResetFilters}
              onRemoveFilter={handleRemoveFilter}
              searchQuery={searchQuery}
              isGridView={isGridView}
              toggleView={toggleView}
              restaurants={restaurants}
              loading={loading}
              isFavoritesFilterActive={isFavoritesFilterActive}
              hasMore={hasMore}
              
            />

            {/* --- 新增分頁按鈕區塊 --- */}
            <div className="flex justify-center mb-3 space-x-4">
              {/* 顯示當前頁碼 (只是視覺上的頁碼，非精確計數) */}
              <span className="flex items-center text-lg text-gray-700">
                目前頁面: {currentPage}
              </span>

              {/* 上一頁按鈕 (可選，但需要更複雜的後端邏輯來實現) */}
              {/* 由於 Firestore Cursor 分頁難以實現「上一頁」，這裡暫時隱藏或禁用 */}
              <button
                disabled={true} // 禁用上一頁按鈕 (因為 Firestore 難以反向分頁)
                className="px-6 py-3 text-lg font-semibold rounded-lg transition-colors bg-gray-300 text-gray-500 cursor-not-allowed"
              >
                上一頁
              </button>

              {/* 下一頁按鈕 */}
              <button
                onClick={handleNextPage}
                // 禁用條件：載入中 OR 沒有更多數據 OR 找不到下一頁的起始 ID
                disabled={loading || !hasMore || !lastDocId}
                className={`px-6 py-3 text-lg font-semibold rounded-lg transition-colors ${
                  loading || !hasMore || !lastDocId
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
