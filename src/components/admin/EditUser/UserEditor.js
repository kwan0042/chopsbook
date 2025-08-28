// src/app/admin/editUsers/UserEditor.js
"use client";

import React, { useContext, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "../../../lib/auth-context";
import UserDetailPage from "../../UserDetailPage";
import LoadingSpinner from "../../LoadingSpinner";

export default function UserEditor() {
  const { currentUser, loadingUser, isAdmin, setModalMessage } =
    useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");

  useEffect(() => {
    if (loadingUser) {
      return;
    }

    if (!currentUser) {
      router.push("/login");
      setModalMessage("請先登入才能訪問管理員用戶編輯頁面。");
      return;
    }

    if (!isAdmin) {
      router.push("/");
      setModalMessage("您沒有權限訪問此管理員功能。");
      return;
    }

    if (!uid) {
      router.push("/admin");
      setModalMessage("錯誤：未指定要編輯的用戶ID。");
    }
  }, [currentUser, loadingUser, isAdmin, uid, router, setModalMessage]);

  if (loadingUser || !uid || !isAdmin) {
    if (loadingUser) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <LoadingSpinner />
        </div>
      );
    }
    return null;
  }

  return <UserDetailPage userId={uid} />;
}
