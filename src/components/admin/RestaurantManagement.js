// src/components/admin/RestaurantManagement.js
"use client";

import React from "react";

const RestaurantManagement = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">餐廳管理</h2>
      <p className="text-gray-600">
        這裡將列出所有餐廳，並提供編輯、刪除等管理功能。
      </p>
      <p className="text-sm text-gray-500 mt-2">
        （此為佔位符內容，請在此處集成實際的餐廳管理組件）
      </p>
      {/* 未來可以在這裡集成 RestaurantListPage 或自定義的餐廳管理組件 */}
    </div>
  );
};

export default RestaurantManagement;
