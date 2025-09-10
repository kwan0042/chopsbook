"use client";

import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/lib/auth-context";
import UserRequestManagement from "@/components/admin/UserRequestManagement";
import LoadingSpinner from "@/components/LoadingSpinner";


/**
 * Admin User Requests Page: 用於管理用戶請求。
 * 檢查使用者是否為管理員，如果不是，則重新導向。
 */
export default function AdminUserRequestsPage() {
  const { currentUser, loadingUser, isAdmin, setModalMessage } =
    useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loadingUser && (!currentUser || !isAdmin)) {
      router.push("/");
    }
  }, [currentUser, loadingUser, isAdmin, router]);

  if (loadingUser || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-inter">
      <UserRequestManagement setParentModalMessage={setModalMessage} />
    </div>
  );
}
