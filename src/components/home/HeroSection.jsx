"use client";

import React, { useState, useEffect, useRef, useCallback } from "react"; // 引入 useRef 和 useCallback
import Image from "next/image";
import { useRouter } from "next/navigation";

// 定義手勢常量
const SWIPE_THRESHOLD = 50; // 最小滑動距離（像素）

const HeroSection = () => {
  const router = useRouter();
  const containerRef = useRef(null); // 引用輪播容器用於手勢檢測
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const slides = [
    {
      id: 1,
      title: "歡迎使用ChopsBook",
      subtitle: "多倫多餐廳食評交流平台",
      description: "由用戶共建的交流平台，探索並分享更多美食。",
      buttonText: "立即開始探索",
      buttonLink: "/restaurants",
      imageUrl: "/demo/home/slide0.png",
    },

    {
      id: 2,
      title: "成為會員，分享你的第一則食評",
      description: "加入會員，分享餐廳體驗，協助更多人找到美食。",
      buttonText: "立即分享第一則食評",
      buttonLink: "/review",
      imageUrl: "/demo/home/slide2.jpg",
    },
    {
      id: 3,
      title: "新增你的第一間餐廳",
      description: "若餐廳未被收錄，立即新增並與社群共享。",
      buttonText: "新增心水餐廳",
      buttonLink: "/merchant/add",
      imageUrl: "/demo/home/slide3.jpg",
    },
    
    {
      id: 4,
      title: "加入我們的會員",
      description: "一齊建立多倫多美食地圖。",
      buttonText: "立即註冊會員",
      buttonLink: "/sign-up",
      imageUrl: "/demo/home/slide3.jpg",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // -------------------------
  // 輪播導航功能 (使用 useCallback 最佳化)
  // -------------------------
  const nextSlide = useCallback(() => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(
      (prevSlide) => (prevSlide - 1 + slides.length) % slides.length
    );
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // -------------------------
  // 自動輪播 (保持)
  // -------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 8000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  // -------------------------
  // 【新增手勢處理邏輯】
  // -------------------------
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(0); // 重置 touchEnd
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchEnd) return; // 沒有移動
    const distance = touchStart - touchEnd;
    const isSwipe = Math.abs(distance) > SWIPE_THRESHOLD;

    if (isSwipe) {
      if (distance > 0) {
        // 向左滑動 (看下一張)
        nextSlide();
      } else {
        // 向右滑動 (看上一張)
        prevSlide();
      }
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    // 【修改點 1】：調整高度：手機版高度大幅縮小 (h-[200px])，網頁版維持原樣 (md:h-[500px] lg:h-[600px])
    <section
      ref={containerRef} // 引用容器
      onTouchStart={handleTouchStart} // 註冊觸控事件
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[200px] sm:h-[300px] md:h-[500px] lg:h-[600px] overflow-hidden shadow-lg mx-auto max-w-full cursor-grab"
    >
      {/* 輪播圖片容器 */}
      <div
        className="flex h-full absolute inset-0 transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={slide.id} className="relative w-full flex-shrink-0">
            <Image
              src={slide.imageUrl}
              alt={slide.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority={index === 0}
              quality={75}
            />
          </div>
        ))}
      </div>

      {/* 遮罩層 (保持不動) */}
      <div className="absolute inset-0 bg-gray-900 opacity-60"></div>

      {/* 【修改點 2】：內容區塊 - 文字變小，適合手機閱讀 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center p-4 sm:p-6 lg:p-8">
        <h1 className="text-xl sm:text-3xl lg:text-6xl font-extrabold mb-1 sm:mb-3 leading-tight animate-fade-in-up">
          {currentSlideData.title}
        </h1>

        {currentSlideData.description && (
          // 手機版描述文字縮小 (text-sm)
          <p className="hidden sm:block text-sm sm:text-lg mb-2 sm:mb-6 opacity-90 animate-fade-in-up delay-100 max-w-2xl">
            {currentSlideData.description}
          </p>
        )}

        {currentSlideData.buttonText && (
          // 手機版按鈕 padding 縮小 (py-2 px-4)
          <button
            onClick={() => {
              router.push(currentSlideData.buttonLink || "/restaurants");
            }}
            className="bg-yellow-500 text-gray-900 hover:bg-yellow-600 font-bold py-2 px-4 sm:py-2.5 sm:px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105 animate-fade-in-up delay-200 text-sm sm:text-base"
          >
            {currentSlideData.buttonText}
          </button>
        )}
      </div>

      {/* 【修改點 3】：左右箭頭導航 - 在 md 以下隱藏 */}
      <button
        onClick={prevSlide}
        className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full shadow-lg z-20 transition duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        aria-label="上一張"
      >
        {/* SVG Icon */}
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
        className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full shadow-lg z-20 transition duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        aria-label="下一張"
      >
        {/* SVG Icon */}
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

      {/* 底部導航圓點 (保持不動，圓點是手機上最好的導航指示器) */}
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

      {/* 動畫效果 CSS (保持不動) */}
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
