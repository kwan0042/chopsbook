// components/blogs/BlogFilters.js (修改後)
"use client";

import React, { useState, useEffect } from "react";

// BlogFilters 組件：負責處理輸入，並將篩選條件傳回給 BlogsClientPage
export default function BlogFilters({
  availableTags,
  onFilter,
  initialKeyword = "",
  initialTag = "",
}) {
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword);
  const [selectedTag, setSelectedTag] = useState(initialTag);

  // 同步外部 prop 到內部 state
  useEffect(() => {
    setSearchKeyword(initialKeyword);
  }, [initialKeyword]);

  useEffect(() => {
    setSelectedTag(initialTag);
  }, [initialTag]);

  // 處理搜尋關鍵字變更 (只更新本地狀態)
  const handleKeywordChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  // 核心修復：處理標籤選擇變更 (只更新本地狀態，不立即觸發 onFilter)
  const handleTagChange = (e) => {
    const newTag = e.target.value;
    setSelectedTag(newTag);
    // 移除：onFilter({ searchKeyword, selectedTag: newTag });
  };

  // 核心修復：處理點擊「篩選」按鈕 (統一觸發所有篩選)
  const handleFilterClick = () => {
    // 核心修復：在呼叫前檢查 onFilter 是否為函數
    if (typeof onFilter === "function") {
      onFilter({ searchKeyword, selectedTag });
    } else {
      // 可以在此處新增錯誤日誌，以便追蹤
      console.error("錯誤：onFilter 屬性未被傳遞或不是一個函數。");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
      <input
        type="text"
        placeholder="搜尋標題或摘要..."
        value={searchKeyword}
        onChange={handleKeywordChange}
        className="w-full sm:w-1/2 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
      />
      <select
        value={selectedTag}
        onChange={handleTagChange} // 只更新狀態
        className="w-full sm:w-1/4 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
      >
        <option value="">所有主題</option>
        {availableTags.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>

      <button
        onClick={handleFilterClick} // 統一的篩選觸發點
        className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
      >
        篩選
      </button>
    </div>
  );
}
