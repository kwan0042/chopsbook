// src/components/HeroSection.js
"use client";

import React, { useState, useEffect } from "react";

const HeroSection = () => {
  // 定義輪播的內容
  const slides = [
    {
      id: 1,
      title: "發現加拿大最受歡迎的餐廳",
      description: "從多倫多到溫哥華，尋找您的下一頓美味佳餚。",
      buttonText: "立即開始探索",
      imageUrl:
        "https://placehold.co/1920x600/1A5276/FFFFFF?text=ChopsBook+美食探索", // Placeholder image
    },
    {
      id: 2,
      title: "夏日美食節 - 獨家優惠！",
      description: "享用多款精選餐廳的夏日限定菜單及折扣。",
      buttonText: "查看優惠詳情",
      imageUrl: "https://placehold.co/1920x600/FFD700/000000?text=夏日美食節", // Placeholder image
    },
    {
      id: 3,
      title: "加入我們的會員俱樂部",
      description: "獨家折扣、積分獎勵和更多驚喜等待著您！",
      buttonText: "立即註冊會員",
      imageUrl: "https://placehold.co/1920x600/8A2BE2/FFFFFF?text=會員專享", // Placeholder image
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0); // 當前顯示的幻燈片索引

  // 自動切換幻燈片的邏輯
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 3000); // 每 3 秒切換一次

    // 清理函數：組件卸載時清除定時器
    return () => clearInterval(interval);
  }, [slides.length]); // 依賴 slides.length 以便在幻燈片數量變化時重新設定定時器

  // 切換到下一張幻燈片
  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
  };

  // 切換到上一張幻燈片
  const prevSlide = () => {
    setCurrentSlide(
      (prevSlide) => (prevSlide - 1 + slides.length) % slides.length
    );
  };

  // 直接跳轉到指定幻燈片
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <section className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden shadow-lg mx-auto max-w-full">
      {/* 輪播背景圖片的容器，使用 flex 和 translateX 實現滑動效果 */}
      <div
        className="flex h-full absolute inset-0 transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="w-full flex-shrink-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${slide.imageUrl}')` }}
          ></div>
        ))}
      </div>

      {/* 遮罩層 (保持不動，疊在圖片上方) */}
      <div className="absolute inset-0 bg-gray-900 opacity-60"></div>

      {/* 內容區塊 (保持不動，疊在遮罩上方) */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center p-4 sm:p-6 lg:p-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight animate-fade-in-up">
          {currentSlideData.title}
        </h2>
        <p className="text-md sm:text-lg mb-6 opacity-90 animate-fade-in-up delay-100">
          {currentSlideData.description}
        </p>
        <button className="bg-yellow-500 text-gray-900 hover:bg-yellow-600 font-bold py-2.5 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105 animate-fade-in-up delay-200">
          {currentSlideData.buttonText}
        </button>
      </div>

      {/* 左右箭頭導航 */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full shadow-lg z-20 transition duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        aria-label="上一張"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full shadow-lg z-20 transition duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        aria-label="下一張"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 底部導航圓點 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-yellow-500 w-6"
                : "bg-gray-400 hover:bg-gray-300"
            }`}
            aria-label={`切換到第 ${index + 1} 張幻燈片`}
          ></button>
        ))}
      </div>

      {/* 為了內容動畫效果添加的自定義 CSS 類 */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animate-fade-in-up.delay-100 {
          animation-delay: 0.1s;
        }
        .animate-fade-in-up.delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
