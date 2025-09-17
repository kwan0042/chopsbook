// src/components/admin/blogsManagement/WeeklyRankingsSection.js

"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/lib/auth-context";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const WeeklyRankingsSection = () => {
  const { db, loadingUser, appId } = useContext(AuthContext);

  const [restaurants, setRestaurants] = useState([]);
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
        const restaurantsRef = collection(db, `artifacts/${appId}/restaurants`);
        const q = query(restaurantsRef, orderBy("rating", "desc"));

       
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setRestaurants(data);
        setLoading(false);
      } catch (error) {
        console.error("載入每週人氣排名失敗:", error);
        setLoading(false);
      }
    };

    fetchData();

    // ✅ 移除 unsubscribe 函式，因為 getDocs 不需要清理
  }, [db, appId, loadingUser]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">每週人氣排名</h3>
      <p className="text-gray-600 mb-4">本週最受好評的 TOP 3 餐廳。</p>

      {loading ? (
        <div className="text-gray-500">載入中...</div>
      ) : (
        <ul className="w-full text-left space-y-2">
          {restaurants.slice(0, 3).map((restaurant, index) => (
            <li
              key={restaurant.id}
              className="p-2 rounded-lg bg-purple-100 flex justify-between items-center text-sm"
            >
              <span>
                {index + 1}. {restaurant.name || "餐廳名稱"}
              </span>{" "}
              <span className="text-purple-700 font-bold">
                {restaurant.rating || "N/A"} ★
              </span>
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
