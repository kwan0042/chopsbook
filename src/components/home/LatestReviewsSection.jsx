// src/components/LatestReviewsSection.js

"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/lib/auth-context";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";

/**
 * LatestReviewsSection: 顯示最新使用者食評的區塊。
 */
const LatestReviewsSection = () => {
  const { db, loadingUser, appId } = useContext(AuthContext);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loadingUser || !db || !appId) {
      if (!loadingUser) {
        setLoading(false);
      }
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // 步驟一：讀取最新五個食評
        const reviewsQuery = query(
          collection(db, `artifacts/${appId}/public/data/reviews`),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 步驟二：為每個食評讀取對應的餐廳資料
        const restaurantFetches = reviewsData
          .map((review) => {
            if (review.restaurantId) {
              const restaurantDocRef = doc(
                db,
                `artifacts/${appId}/public/data/restaurants/${review.restaurantId}` // ✅ 修正路徑，使用動態 appId
              );
              return getDoc(restaurantDocRef);
            }
            return null;
          })
          .filter(Boolean);

        const restaurantSnapshots = await Promise.all(restaurantFetches);

        // 步驟三：將餐廳名稱合併到食評資料中
        const combinedReviews = reviewsData.map((review, index) => {
          const restaurantData = restaurantSnapshots[index]?.data();

          return {
            ...review,
            // ✅ 讀取中文名稱
            restaurantName: restaurantData?.restaurantNameZh || "未知餐廳",
          };
        });

        setReviews(combinedReviews);
        setLoading(false);
      } catch (error) {
        console.error("載入最新食評失敗:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [db, appId, loadingUser]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">最新食評</h3>
      <p className="text-gray-600 mb-4">看看大家最近都在吃什麼。</p>

      {loading ? (
        <div className="text-gray-500">載入中...</div>
      ) : (
        <div className="w-full space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-3 bg-orange-100 rounded-lg text-orange-800 text-sm"
            >
              <p className="font-bold text-left">{review.restaurantName}</p>
              <p className="mt-1 text-left">{review.reviewTitle}</p>
              <p className="mt-1 text-right text-xs">
                {review.username || "匿名"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestReviewsSection;
