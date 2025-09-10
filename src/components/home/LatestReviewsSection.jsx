"use client";

import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

/**
 * LatestReviewsSection: 顯示最新使用者食評的區塊。
 */
const LatestReviewsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // 初始化 Firebase
  //   const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
  //   const firebaseConfig =
  //     typeof __firebase_config !== "undefined"
  //       ? JSON.parse(__firebase_config)
  //       : {};
  //   const app = initializeApp(firebaseConfig);
  //   const db = getFirestore(app);

  //   useEffect(() => {
  //     // 這裡設置 Firestore 的即時監聽器
  //     const q = query(
  //       collection(db, `artifacts/${appId}/public/data/reviews`),
  //       orderBy("createdAt", "desc")
  //     );

  //     const unsubscribe = onSnapshot(
  //       q,
  //       (snapshot) => {
  //         const data = snapshot.docs.map((doc) => ({
  //           id: doc.id,
  //           ...doc.data(),
  //         }));
  //         setReviews(data);
  //         setLoading(false);
  //       },
  //       (error) => {
  //         console.error("Failed to fetch latest reviews:", error);
  //         setLoading(false);
  //       }
  //     );

  //     // 清理監聽器
  //     return () => unsubscribe();
  //   }, [db, appId]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">最新食評</h3>
      <p className="text-gray-600 mb-4">看看大家最近都在吃什麼。</p>

      {loading ? (
        <div className="text-gray-500">載入中...</div>
      ) : (
        <div className="w-full space-y-4">
          {reviews.slice(0, 3).map((review) => (
            <div
              key={review.id}
              className="p-3 bg-orange-100 rounded-lg text-orange-800 text-sm"
            >
              <p className="font-bold">{review.author || "匿名"}</p>
              <p className="mt-1">{review.comment.substring(0, 50)}...</p>
              <p className="mt-1 text-right text-xs">
                來自: {review.restaurantName || "某餐廳"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestReviewsSection;
