// src/app/personal/reviews/page.js
import { Suspense } from "react";
import ReviewPageContent from "../../../components/reviews/ReviewPageContent";
import LoadingSpinner from "../../../components/LoadingSpinner"; // 確保路徑正確

/**
 * PersonalReviewsPage: 用戶撰寫食評的頁面。
 * 此頁面作為伺服器元件，使用 <Suspense> 邊界來確保在使用
 * useSearchParams() 的客戶端元件被載入之前，顯示一個載入狀態。
 */
export default function PersonalReviewsPage() {
  return (
    // 用 Suspense 包裹客戶端元件，以處理 useSearchParams 在伺服器渲染時的問題
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter">
          <LoadingSpinner />
          <p className="text-lg text-gray-700 ml-4">載入食評頁面...</p>
        </div>
      }
    >
      <ReviewPageContent />
    </Suspense>
  );
}
