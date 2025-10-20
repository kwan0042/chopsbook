// src/components/AccountLink.js
"use client";

import { useContext } from "react";
import { AuthContext } from "@/lib/auth-context"; // 請確保路徑正確

export default function AccountLink() {
  const { currentUser } = useContext(AuthContext);

  // 1. 取得當前用戶 ID (假設 AuthContext 中的 currentUser 包含 uid)
  const userId = currentUser ? currentUser.uid : null;

  // 2. 決定連結的 URL
  // 如果已登入，使用動態 URL。如果未登入，導向登入/通用設定頁。
  const settingsUrl = userId
    ? `/user/${userId}/settings`
    : "/login?redirect=/settings"; // 導向登入頁，完成後再跳轉到設定頁面

  // 3. 渲染連結
  return (
    <>
      登入您的帳號，前往
      <a href={settingsUrl} className="text-blue-600 underline">
        個人設定頁面
      </a>
    </>
  );
}
