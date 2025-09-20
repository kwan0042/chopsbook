// src/app/admin/restaurants/page.js
"use client";

import React, { useContext, useEffect } from "react";
import { redirect } from "next/navigation";
import { AuthContext } from "@/lib/auth-context";
import RestaurantManagement from "@/components/admin/RestaurantManagement";
import LoadingSpinner from "@/components/LoadingSpinner";

/**
 * Admin Restaurants Page: 用於管理餐廳資訊。
 * 檢查使用者是否為管理員，如果不是，則重新導向。
 */
export default function AdminRestaurantsPage() {
  const { currentUser, loadingUser, isAdmin } = useContext(AuthContext);

  useEffect(() => {
    // 當用戶狀態載入完成後，如果不是管理員，則重定向到首頁
    if (!loadingUser && (!currentUser || !isAdmin)) {
      redirect("/");
    }
  }, [currentUser, loadingUser, isAdmin]);

  // 在用戶狀態載入中或非管理員時顯示載入畫面
  if (loadingUser || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // 如果是管理員，則渲染 RestaurantManagement 組件
  return (
    <div className="min-h-screen font-inter">
      <RestaurantManagement />
    </div>
  );
}
