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

  // 處理搜尋關鍵字變更
  const handleKeywordChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  // 處理標籤選擇變更 (立即觸發導航，因為標籤篩選是在伺服器端完成的)
  const handleTagChange = (e) => {
    const newTag = e.target.value;
    setSelectedTag(newTag);
    onFilter({ searchKeyword, selectedTag: newTag });
  };

  // 處理點擊「篩選」按鈕 (用於觸發 Keyword 的 SSR 搜尋)
  const handleFilterClick = () => {
    onFilter({ searchKeyword, selectedTag });
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
        onChange={handleTagChange}
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
        onClick={handleFilterClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
      >
        篩選
      </button>
    </div>
  );
}
