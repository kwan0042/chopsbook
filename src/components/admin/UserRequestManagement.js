// src/components/admin/UserRequestManagement.js
"use client";

import React from "react";

const UserRequestManagement = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        用家請求管理
      </h2>
      <p className="text-gray-600">
        這裡將顯示用戶提交的餐廳更新或新增申請，等待管理員審批。
      </p>
      <p className="text-sm text-gray-500 mt-2">
        （此為佔位符內容，請在此處集成實際的請求管理組件）
      </p>
      {/* 未來可以在這裡集成一個新的 RequestManagement 組件 */}
    </div>
  );
};

export default UserRequestManagement;
