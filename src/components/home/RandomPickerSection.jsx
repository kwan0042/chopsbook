"use client";

import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

/**
 * RandomPickerSection: 讓使用者隨機抽餐廳的區塊。
 */
const RandomPickerSection = () => {
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [pickedRestaurant, setPickedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初始化 Firebase
//   const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
//   const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
//   const app = initializeApp(firebaseConfig);
//   const db = getFirestore(app);

//   useEffect(() => {
//     // 從 Firestore 獲取所有餐廳，僅在元件掛載時載入一次
//     const fetchRestaurants = async () => {
//       try {
//         const snapshot = await getDocs(collection(db, `artifacts/${appId}/public/data/restaurants`));
//         const data = snapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data()
//         }));
//         setAllRestaurants(data);
//         setLoading(false);
//       } catch (error) {
//         console.error("Failed to fetch restaurants for picker:", error);
//         setLoading(false);
//       }
//     };

//     fetchRestaurants();
//   }, [db, appId]);

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
