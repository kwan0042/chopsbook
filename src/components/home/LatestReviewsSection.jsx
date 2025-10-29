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
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faStarHalfStroke } from "@fortawesome/free-solid-svg-icons";

// 引入 useRouter 來使用 router.push()
import { useRouter } from "next/navigation";

const renderStars = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center text-yellow-400">
      {Array.from({ length: fullStars }, (_, i) => (
        <FontAwesomeIcon key={`full-${i}`} icon={faStar} />
      ))}
      {hasHalfStar && <FontAwesomeIcon key="half" icon={faStarHalfStroke} />}
      {Array.from({ length: emptyStars }, (_, i) => (
        <FontAwesomeIcon
          key={`empty-${i}`}
          icon={faStar}
          className="text-gray-300"
        />
      ))}
    </div>
  );
};

/**
 * LatestReviewsSection: 顯示最新使用者食評的區塊。
 */
const LatestReviewsSection = () => {
  const { db, loadingUser, appId } = useContext(AuthContext);
  // 初始化 useRouter
  const router = useRouter();

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
          limit(3)
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
                `artifacts/${appId}/public/data/restaurants/${review.restaurantId}`
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

          // ✅ 讀取新的多語言 restaurantName map
          const restaurantName =
            restaurantData?.restaurantName?.["zh-TW"] ||
            restaurantData?.restaurantName?.en ||
            "未知餐廳";

          return {
            ...review,
            restaurantName,
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
    <div className="bg-white rounded-xl shadow-lg mx-3 md:mx-0 p-4 md:p-6 flex flex-col items-center text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">最新食評</h3>
      <p className="text-gray-600 mb-4">看看大家最近都在吃什麼。</p>

      {loading ? (
        <div className="text-gray-500">載入中...</div>
      ) : (
        <div className="w-full space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-3 bg-orange-100 rounded-lg text-orange-800 text-sm cursor-pointer transition-shadow duration-200 hover:shadow-md hover:bg-orange-200"
              onClick={() =>
                router.push(
                  `/restaurants/${review.restaurantId}/reviews/${review.id}`
                )
              }
            >
              <p className="font-bold text-left">{review.restaurantName}</p>
              <p className="mt-1 text-left text-gray-700">
                {review.reviewTitle}
              </p>
              <div className="mt-2 flex items-center justify-between">
                {renderStars(review.overallRating)}
                <p
                  className="ml-3 mt-1 block text-right text-xs underline hover:text-indigo-500 transition-colors duration-150 cursor-pointer truncate"
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止外層 div click
                    router.push(`/user/${review.userId}`);
                  }}
                >
                  {review.username}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestReviewsSection;
