// src/components/RandomPickerSection.js

"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/lib/auth-context"; // ✅ 匯入 AuthContext
import { collection, getDocs } from "firebase/firestore";
import LoadingSpinner from "@/components/LoadingSpinner"; // 確保路徑正確

/**
 * RandomPickerSection: 讓使用者隨機抽餐廳的區塊。
 */
const RandomPickerSection = () => {
  const { db, loadingUser, appId } = useContext(AuthContext); // ✅ 從 AuthContext 獲取 db 和 appId

  const [allRestaurants, setAllRestaurants] = useState([]);
  const [pickedRestaurant, setPickedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 只有當 db 和 appId 存在時才開始載入資料
    if (loadingUser || !db || !appId) {
      if (!loadingUser) {
        setLoading(false); // 如果用戶狀態已經載入但 db 不可用，停止 loading
      }
      return;
    }

    // 從 Firestore 獲取所有餐廳
    const fetchRestaurants = async () => {
      try {
        const restaurantsCollectionRef = collection(
          db,
          `artifacts/${appId}/restaurants`
        );
        const snapshot = await getDocs(restaurantsCollectionRef);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllRestaurants(data);
      } catch (error) {
        console.error("Failed to fetch restaurants for picker:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [db, appId, loadingUser]); // ✅ 依賴陣列加入 db, appId, loadingUser

  const handlePickRestaurant = () => {
    if (allRestaurants.length === 0) {
      console.warn("No restaurants to pick from.");
      return;
    }
    const randomIndex = Math.floor(Math.random() * allRestaurants.length);
    setPickedRestaurant(allRestaurants[randomIndex]);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">是但食</h3>
      <p className="text-gray-600 mb-4">讓選擇困難症畢業！</p>

      {loading ? (
        <div className="text-gray-500">載入中...</div>
      ) : (
        <button
          onClick={handlePickRestaurant}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-full hover:bg-green-600 transition-colors"
          disabled={allRestaurants.length === 0}
        >
          {pickedRestaurant ? "再抽一間" : "隨機抽一間"}
        </button>
      )}

      {pickedRestaurant && (
        <div className="mt-4 p-4 w-full bg-green-100 rounded-lg text-green-800 font-medium">
          <h4>{pickedRestaurant.name}</h4>
          <p className="text-sm">地點: {pickedRestaurant.location}</p>
        </div>
      )}
    </div>
  );
};

export default RandomPickerSection;
