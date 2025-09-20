// src/app/admin/editUsers/UserEditor.js
"use client";

import React, { useContext, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "../../../lib/auth-context";
import UserDetailPage from "./UserDetailPage";
import LoadingSpinner from "../../LoadingSpinner";

export default function UserEditor() {
  const { currentUser, loadingUser, authReady, setModalMessage } =
    useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");

  // 檢查用戶狀態和權限的副作用
  useEffect(() => {
    if (loadingUser || !authReady) {
      return;
    }

    if (!currentUser) {
      setModalMessage("請先登入才能訪問管理員用戶編輯頁面。", "error");
      router.push("/login");
      return;
    }

    // 檢查用戶的 isAdmin 權限，因為它在 AuthContext 中
    if (!currentUser?.isAdmin) {
      setModalMessage("您沒有權限訪問此管理員功能。", "error");
      router.push("/");
      return;
    }

    if (!uid) {
      setModalMessage("錯誤：未指定要編輯的用戶ID。", "error");
      router.push("/admin");
    }
  }, [currentUser, loadingUser, authReady, uid, router, setModalMessage]);

  // 在等待載入時顯示載入畫面
  if (loadingUser || !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // 如果不符合權限或缺少 UID，不渲染任何內容
  if (!currentUser?.isAdmin || !uid) {
    return null;
  }

  // 如果一切正常，渲染 UserDetailPage
  return <UserDetailPage userId={uid} />;
}
