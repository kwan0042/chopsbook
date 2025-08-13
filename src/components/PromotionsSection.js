// src/components/PromotionsSection.js
import React from 'react';

const PromotionsSection = () => {
  const promotions = [
    { id: 1, title: "夏日特惠：飲品買一送一！", imageUrl: "https://placehold.co/300x180/FFD700/000000?text=夏日特惠" },
    { id: 2, title: "新用戶專享：首單八折！", imageUrl: "https://placehold.co/300x180/ADFF2F/000000?text=新用戶優惠" },
    { id: 3, title: "週末限定：家庭套餐優惠！", imageUrl: "https://placehold.co/300x180/8A2BE2/FFFFFF?text=週末限定" },
    { id: 4, title: "會員專享：積分雙倍！", imageUrl: "https://placehold.co/300x180/FF6B6B/FFFFFF?text=會員優惠" },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white shadow-md rounded-lg mb-8">
      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">最新推廣與精選</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-screen-xl mx-auto">
        {promotions.map(promo => (
          <div key={promo.id} className="bg-gray-50 rounded-lg shadow-sm overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out border border-gray-200">
            <img src={promo.imageUrl} alt={promo.title} className="w-full h-40 object-cover" />
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{promo.title}</h3>
              <p className="text-blue-700 text-sm font-medium hover:underline cursor-pointer">查看詳情 &rarr;</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PromotionsSection;