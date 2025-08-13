// src/components/FoodCategoriesSection.js
import React from 'react';
import RestaurantListPage from './RestaurantListPage'; // 導入 RestaurantListPage

const FoodCategoriesSection = () => {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white shadow-md rounded-lg mb-8">
      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">探索不同食物類別</h2>
      {/* RestaurantListPage 內部已經使用了 'container mx-auto'，它默認為 max-w-7xl */}
      <RestaurantListPage />
    </section>
  );
};

export default FoodCategoriesSection;