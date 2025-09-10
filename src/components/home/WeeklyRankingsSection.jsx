"use client";

import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy } from "firebase/firestore";

/**
 * WeeklyRankingsSection: 顯示每週人氣餐廳排名的區塊。
 * 這個元件會即時從 Firestore 獲取資料。
 */
const WeeklyRankingsSection = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // 初始化 Firebase
//   const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
//   const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
//   const app = initializeApp(firebaseConfig);
//   const db = getFirestore(app);

//   useEffect(() => {
//     // 這裡設置 Firestore 的即時監聽器
//     // 注意：`orderBy` 查詢需要 Firestore 索引。
//     // 如果出現錯誤，請先移除 `orderBy` 並在 Firestore 中建立索引。
//     const q = query(collection(db, `artifacts/${appId}/public/data/restaurants`), orderBy("rating", "desc"));
    
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const data = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setRestaurants(data);
//       setLoading(false);
//     }, (error) => {
//       console.error("Failed to fetch weekly rankings:", error);
//       setLoading(false);
//     });

//     // 清理監聽器
//     return () => unsubscribe();
//   }, [db, appId]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">每週人氣排名</h3>
      <p className="text-gray-600 mb-4">本週最受好評的 TOP 3 餐廳。</p>
      
      {loading ? (
        <div className="text-gray-500">載入中...</div>
      ) : (
        <ul className="w-full text-left space-y-2">
          {restaurants.slice(0, 3).map((restaurant, index) => (
            <li key={restaurant.id} className="p-2 rounded-lg bg-purple-100 flex justify-between items-center text-sm">
              <span>{index + 1}. {restaurant.name || "餐廳名稱"}</span> <span className="text-purple-700 font-bold">{restaurant.rating || "N/A"} ★</span>
            </li>
          ))}
        </ul>
      )}
      
      <button className="mt-4 w-full bg-purple-500 text-white py-2 px-4 rounded-full hover:bg-purple-600 transition-colors">
        查看完整排名
      </button>
    </div>
  );
};

export default WeeklyRankingsSection;
