"use client";

import React, { useContext } from "react";
import { AuthContext } from "../../lib/auth-context";
import UserManagement from "./admin_user/UserManagement";

/**
 * Admin Page: 管理員主控台的預設頁面。
 * 包含用戶管理和使用說明。
 */
export default function AdminPage() {
  const { currentUser } = useContext(AuthContext);

  return (
    <>
      <UserManagement />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8 shadow-sm">
        <h3 className="text-xl font-semibold text-blue-800 mb-3">使用說明</h3>
        <ul className="text-sm text-blue-700 space-y-2 list-disc pl-5">
          <li>
            • 您可以在 Firebase Console 中直接修改用戶的{" "}
            <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded-md text-xs font-mono">
              isAdmin
            </code>{" "}
            字段
          </li>
          <li>• 或者使用本頁面中的按鈕來修改用戶權限</li>
          <li>• 管理員權限變更會立即生效</li>
          <li>• 請謹慎操作，確保不會意外移除自己的管理員權限</li>
          <li>• 點擊「查看詳細」按鈕可以查看和編輯用戶的個人資料</li>
          <li>• 使用上方的導航欄切換不同的管理區塊</li>
        </ul>
      </div>
    </>
  );
}
