// src/app/admin/editUsers/page.js
"use client";

import React, { useContext, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // 導入 useSearchParams
import { AuthContext } from "../../../lib/auth-context"; // 相對路徑
import UserDetailPage from "../../../components/UserDetailPage"; // 相對路徑
import LoadingSpinner from "../../../components/LoadingSpinner"; // 相對路徑

/**
 * EditUsersPage：這是管理員專用的用戶資料編輯頁面。
 * 它負責從 URL 的查詢參數中提取 `uid`，並將其傳遞給 `UserDetailPage`。
 * 同時，它會進行頂層的認證和授權檢查，確保只有管理員才能訪問此頁面。
 */
export default function EditUsersPage() {
  const { currentUser, loadingUser, isAdmin, setModalMessage } =
    useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams(); // 獲取 URL 查詢參數
  const uid = searchParams.get("uid"); // 從查詢參數中獲取 uid

  useEffect(() => {
    if (loadingUser) {
      return; // 等待用戶載入完成
    }

    // 如果用戶未登入，導向登入頁面
    if (!currentUser) {
      router.push("/login");
      setModalMessage("請先登入才能訪問管理員用戶編輯頁面。");
      return;
    }

    // 如果用戶已登入但不是管理員，則導向首頁並顯示無權限訊息
    // 這裡只允許 isAdmin 訪問，因為這是管理員專用頁面
    if (!isAdmin) {
      router.push("/");
      setModalMessage("您沒有權限訪問此管理員功能。");
      return;
    }

    // 如果沒有提供 uid 參數，也視為錯誤，導回管理員列表
    if (!uid) {
      router.push("/admin");
      setModalMessage("錯誤：未指定要編輯的用戶ID。");
      return;
    }
  }, [currentUser, loadingUser, isAdmin, uid, router, setModalMessage]);

  if (loadingUser || !uid || !isAdmin) {
    // 如果還在載入，或者 uid 缺失，或者不是管理員，則顯示載入或不渲染
    if (loadingUser) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <LoadingSpinner />
        </div>
      );
    }
    return null; // 在重定向前不渲染任何內容
  }

  // 如果已登入且是管理員，且 uid 存在，則渲染 UserDetailPage
  return <UserDetailPage userId={uid} />;
}
