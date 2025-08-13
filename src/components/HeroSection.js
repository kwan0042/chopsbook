// src/components/HeroSection.js
import React from "react";

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-r from-blue-700 to-blue-900 text-white py-20 px-4 sm:px-6 lg:px-8 text-center shadow-lg mx-auto max-w-full">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage:
            "url('https://placehold.co/1920x600/1A5276/FFFFFF?text=ChopsBook+美食探索')",
        }}
      ></div>
      <div className="relative z-10 max-w-4xl mx-auto">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
          發現加拿大最受歡迎的餐廳
        </h2>
        <p className="text-lg sm:text-xl mb-8 opacity-90">
          從多倫多到溫哥華，尋找您的下一頓美味佳餚。
        </p>
        <button className="bg-yellow-500 text-gray-900 hover:bg-yellow-600 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105">
          立即開始探索
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
