// src/app/admin/editUsers/page.js
import { Suspense } from "react";
import UserEditor from "../../../components/admin/EditUser/UserEditor";
import LoadingSpinner from "../../../components/LoadingSpinner";

/**
 * EditUsersPage：這是管理員專用的用戶資料編輯頁面。
 * 該頁面使用 <Suspense> 邊界來確保在伺服器端渲染時，
 * 可以處理使用 useSearchParams() 的客戶端元件。
 */
export default function EditUsersPage() {
  return (
    // 用 Suspense 包裹客戶端元件，以處理 useSearchParams 在伺服器渲染時的問題
    <Suspense fallback={<LoadingSpinner />}>
      <UserEditor />
    </Suspense>
  );
}
