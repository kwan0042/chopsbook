// src/app/admin/page.js

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AdminPage from "../../../components/admin/AdminPage";

/**
 * Page: /admin 的主要內容頁面。
 * 權限檢查和載入狀態已由父層 AdminLayout 處理。
 */
export default function AdminPageWrapper() {
  const router = useRouter();

  // 渲染 AdminPage 組件
  // 由於 AdminLayout 已確保使用者是管理員，這裡不需要額外檢查
  return <AdminPage onBackToHome={() => router.push("/")} />;
}
