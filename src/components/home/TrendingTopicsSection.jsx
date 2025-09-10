"use client";

import React, { useState } from "react";

const TrendingTopicsSection = () => {
  // 原始的文章或促銷資料
  const promotions = [
    { id: 1, title: "夏日特惠：飲品買一送一！", imageUrl: "https://placehold.co/300x180/FFD700/000000?text=夏日特惠" },
    { id: 2, title: "新用戶專享：首單八折！", imageUrl: "https://placehold.co/300x180/ADFF2F/000000?text=新用戶優惠" },
    { id: 3, title: "週末限定：家庭套餐優惠！", imageUrl: "https://placehold.co/300x180/8A2BE2/FFFFFF?text=週末限定" },
    { id: 4, title: "會員專享：積分雙倍！", imageUrl: "https://placehold.co/300x180/FF6B6B/FFFFFF?text=會員優惠" },
    { id: 5, title: "期間限定：人氣甜品新上市", imageUrl: "https://placehold.co/300x180/E6E6FA/000000?text=新甜品" },
    { id: 6, title: "品味生活：咖啡藝術之旅", imageUrl: "https://placehold.co/300x180/B0C4DE/000000?text=咖啡之旅" },
  ];

  // 狀態管理：currentPage 用來追蹤目前顯示的起始索引
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(promotions.length / itemsPerPage);

  const handleNextPage = () => {
    setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages - 1));
  };

  const handlePrevPage = () => {
    setCurrentPage(prevPage => Math.max(prevPage - 1, 0));
  };
  
  // 計算要顯示的項目範圍
  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const displayedPromotions = promotions.slice(start, end);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white shadow-md rounded-lg">
      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">熱門話題或文章</h2>
      <div className="flex items-center justify-center">
        {/* 上一頁按鈕 */}
        <button 
          onClick={handlePrevPage} 
          disabled={currentPage === 0}
          className="p-2 mr-4 text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 內容網格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-screen-xl mx-auto">
          {displayedPromotions.map(promo => (
            <div key={promo.id} className="bg-gray-50 rounded-lg shadow-sm overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out border border-gray-200">
              <img src={promo.imageUrl} alt={promo.title} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{promo.title}</h3>
                <p className="text-blue-700 text-sm font-medium hover:underline cursor-pointer">查看詳情 &rarr;</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* 下一頁按鈕 */}
        <button 
          onClick={handleNextPage} 
          disabled={currentPage >= totalPages - 1}
          className="p-2 ml-4 text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default TrendingTopicsSection;
