"use client";

import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/lib/auth-context";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import ReviewsList from "@/components/personal/ReviewsList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";

// 每頁顯示的食評數量
const REVIEWS_PER_PAGE = 10;

/**
 * UserReviewsPage: 顯示使用者已發布的食評，並支援分頁。
 * 這是 /user/[userId]/reviews 路徑下的頁面。
 */
export default function UserReviewsPage() {
  const { userId } = useParams();
  const { db, appId, setModalMessage } = useContext(AuthContext);

  const [publishedReviews, setPublishedReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reviewsCount, setReviewsCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        // ✅ 傳遞 appId 給 API 路由
        const response = await fetch(
          `/api/reviews/user-reviews?userId=${userId}&page=${currentPage}&appId=${appId}`
        );
        const data = await response.json();

        if (response.ok) {
          setPublishedReviews(data.reviews);
          setReviewsCount(data.totalReviews);
        } else {
          setModalMessage(`獲取評論失敗: ${data.error}`);
        }
      } catch (error) {
        console.error("獲取評論失敗:", error);
        setModalMessage(`獲取評論失敗: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [userId, currentPage, setModalMessage, appId]); // ✅ 在依賴陣列中新增 appId

  const goToNextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const totalPages = Math.ceil(reviewsCount / REVIEWS_PER_PAGE);
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage >= totalPages || totalPages === 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className=" p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">所有食評</h2>
      {publishedReviews.length === 0 && reviewsCount === 0 ? (
        <div className="text-center text-gray-600 p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p>此用戶尚未發佈任何食評。</p>
        </div>
      ) : (
        <div className="space-y-6 mx-auto">
          <ReviewsList publishedReviews={publishedReviews} />

          {/* 分頁按鈕 */}
          <div className="flex justify-between items-center mt-8">
            {/* 條件渲染「上一頁」按鈕 */}
            {!isFirstPage && (
              <button
                onClick={goToPrevPage}
                className="p-2 bg-white rounded-full shadow-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                上一頁
              </button>
            )}
            {/* 使用佔位符確保在第一頁時，「下一頁」按鈕位於右側 */}
            <div className="flex-grow"></div>
            <span className="text-sm text-gray-500">
              頁碼 {currentPage} / {totalPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={isLastPage}
              className="p-2 bg-white rounded-full shadow-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一頁
              <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
