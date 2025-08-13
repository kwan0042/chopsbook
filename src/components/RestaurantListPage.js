// src/components/RestaurantListPage.js
'use client';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../lib/auth-context'; // 從新的 auth-context.js 導入
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';
import LoadingSpinner from './LoadingSpinner'; // 導入 LoadingSpinner
import Modal from './Modal'; // 導入 Modal

const RestaurantListPage = () => {
  const { db, currentUser, appId, setModalMessage } = useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localModalMessage, setLocalModalMessage] = useState(''); // 用於本地訊息
  const userId = currentUser?.uid || 'anonymous';

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const restaurantCollectionRef = collection(db, `artifacts/${appId}/public/data/restaurants`);
    const q = query(restaurantCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const restaurantList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRestaurants(restaurantList);
      setLoading(false);
    }, (error) => {
      console.error("獲取餐廳資料失敗:", error);
      setLocalModalMessage(`獲取餐廳資料失敗: ${error.message}`); // 使用本地模態框
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, appId]);

  const addSampleRestaurants = async () => {
    if (!db) {
      setLocalModalMessage("Firebase 資料庫尚未初始化。");
      return;
    }
    if (!currentUser) {
      setLocalModalMessage("請先登入才能新增資料。");
      return;
    }

    setLoading(true);
    try {
      const restaurantCollectionRef = collection(db, `artifacts/${appId}/public/data/restaurants`);
      const sampleRestaurants = [
        {
          name: "楓葉小館",
          cuisine: "加拿大菜",
          address: "多倫多市中心楓葉大道123號",
          phone: "416-123-4567",
          rating: 4.5,
          reviewCount: 25,
          imageUrl: "https://placehold.co/400x200/FF5733/FFFFFF?text=楓葉小館"
        },
        {
          name: "海鮮碼頭",
          cuisine: "海鮮",
          address: "溫哥華海濱路456號",
          phone: "604-987-6543",
          rating: 4.8,
          reviewCount: 40,
          imageUrl: "https://placehold.co/400x200/3366FF/FFFFFF?text=海鮮碼頭"
        },
        {
          name: "法式浪漫",
          cuisine: "法國菜",
          address: "蒙特婁老城區藝術街789號",
          phone: "514-234-5678",
          rating: 4.2,
          reviewCount: 18,
          imageUrl: "https://placehold.co/400x200/6633FF/FFFFFF?text=法式浪漫"
        },
        {
          name: "亞洲風味",
          cuisine: "亞洲菜",
          address: "卡加利市區美食廣場101號",
          phone: "403-567-8901",
          rating: 4.0,
          reviewCount: 30,
          imageUrl: "https://placehold.co/400x200/33CC66/FFFFFF?text=亞洲風味"
        }
      ];

      for (const restaurant of sampleRestaurants) {
        await addDoc(restaurantCollectionRef, restaurant);
      }
      setLocalModalMessage("已新增範例餐廳資料！");
    } catch (error) {
      console.error("新增範例餐廳失敗:", error);
      setLocalModalMessage(`新增範例餐廳失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setLocalModalMessage('');

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">所有餐廳</h2>
      <p className="text-sm text-gray-600 text-center mb-4">
        當前使用者 ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{userId}</span>
      </p>
      <div className="flex justify-center mb-8">
        <button
          onClick={addSampleRestaurants}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          新增範例餐廳資料 (僅供測試)
        </button>
      </div>

      {restaurants.length === 0 ? (
        <p className="text-center text-gray-600 text-xl">
          目前沒有餐廳資料。請點擊上方按鈕新增範例資料。
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out">
              <img
                src={restaurant.imageUrl || `https://placehold.co/400x200/CCCCCC/333333?text=${restaurant.name}`}
                alt={restaurant.name}
                className="w-full h-48 object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x200/CCCCCC/333333?text=${restaurant.name}`; }}
              />
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{restaurant.name}</h3>
                <p className="text-gray-700 mb-1">
                  <span className="font-semibold">菜系:</span> {restaurant.cuisine}
                </p>
                <p className="text-gray-700 mb-1">
                  <span className="font-semibold">地址:</span> {restaurant.address}
                </p>
                <p className="text-gray-700 mb-1">
                  <span className="font-semibold">電話:</span> {restaurant.phone}
                </p>
                <div className="flex items-center mt-3">
                  <span className="text-yellow-500 text-xl mr-2">⭐</span>
                  <span className="text-gray-800 font-bold text-lg">{restaurant.rating?.toFixed(1) || 'N/A'}</span>
                  <span className="text-gray-600 text-sm ml-2">({restaurant.reviewCount || 0} 評論)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal message={localModalMessage} onClose={closeModal} />
    </div>
  );
};

export default RestaurantListPage;