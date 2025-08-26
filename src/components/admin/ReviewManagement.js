// src/components/admin/ReviewManagement.js
"use client";

import React from "react";

const ReviewManagement = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">食評管理</h2>
      <p className="text-gray-600">
        這裡將展示所有餐廳的最新食評，並提供審核、刪除等管理功能。
      </p>
      <p className="text-sm text-gray-500 mt-2">
        （此為佔位符內容，請在此處集成實際的食評管理組件）
      </p>
      {/* 未來可以在這裡集成一個新的 ReviewManagement 組件 */}
    </div>
  );
};

export default ReviewManagement;
