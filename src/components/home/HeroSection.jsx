// src/components/HeroSection.js
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image"; // 步驟 1: 引入 Next.js 的 Image 元件
import { useRouter } from "next/navigation";

const HeroSection = () => {
  // 步驟 2: 更新 slides 陣列，將 imageUrl 指向 public 資料夾中的圖片
  // Next.js 會自動將 / 作為 public 資料夾的根目錄
  const router = useRouter(); // ✅ 初始化 router
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
      title: "夏日美食節 - 獨家優惠！",
      description: "享用多款精選餐廳的夏日限定菜單及折扣。",
      buttonText: "查看優惠詳情",
      buttonLink: "/merchant/add",
      imageUrl: "/demo/home/slide2.jpg",
    },
    {
      id: 5,
      title: "加入我們的會員俱樂部",
      description: "獨家折扣、積分獎勵和更多驚喜等待著您！",
      buttonText: "立即註冊會員",
      buttonLink: "/sign-up",
      imageUrl: "/demo/home/slide3.jpg",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prevSlide) => (prevSlide - 1 + slides.length) % slides.length
    );
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <section className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden shadow-lg mx-auto max-w-full">
      {/* 輪播圖片容器 */}
      <div
        className="flex h-full absolute inset-0 transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {/* 步驟 3: 使用 next/image 元件取代原本的 div */}
        {slides.map((slide, index) => (
          <div key={slide.id} className="relative w-full flex-shrink-0">
            <Image
              src={slide.imageUrl}
              alt={slide.title} // 使用標題作為 alt 文字，有利於 SEO
              fill // fill 會讓圖片填滿父容器，需要父容器是 relative 定位
              className="object-cover" // object-cover 的效果類似 background-size: cover
              sizes="100vw" // 告訴瀏覽器圖片在各種螢幕尺寸下都約等於視窗寬度
              priority={index === 0} // ✨ 關鍵最佳化：只將第一張圖片設為優先載入，提升 LCP
              quality={75} // 可選：設定圖片品質
            />
          </div>
        ))}
      </div>

      {/* 遮罩層 (保持不動) */}
      <div className="absolute inset-0 bg-gray-900 opacity-60"></div>

      {/* 內容區塊 (保持不動) */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold mb-3 leading-tight animate-fade-in-up">
          {currentSlideData.title}
        </h1>

        {currentSlideData.description && (
          <p className="text-md sm:text-lg mb-6 opacity-90 animate-fade-in-up delay-100 max-w-2xl">
            {currentSlideData.description}
          </p>
        )}

        {currentSlideData.buttonText && (
          <button
            onClick={() => {
              router.push(currentSlideData.buttonLink || "/restaurants");
            }}
            className="bg-yellow-500 text-gray-900 hover:bg-yellow-600 font-bold py-2.5 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105 animate-fade-in-up delay-200"
          >
            {currentSlideData.buttonText}
          </button>
        )}
      </div>

      {/* 左右箭頭導航 */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full shadow-lg z-20 transition duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full shadow-lg z-20 transition duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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

      {/* 動畫效果 CSS */}
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
