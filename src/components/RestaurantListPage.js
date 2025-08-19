// src/components/RestaurantListPage.js
"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../lib/auth-context";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  where,
} from "firebase/firestore";
import LoadingSpinner from "./LoadingSpinner";
import Modal from "./Modal";

/**
 * RestaurantListPage: Displays a list of restaurants fetched from Firestore,
 * applying filters if provided. Includes a button to add sample data for testing purposes.
 * @param {object} props - Component properties.
 * @param {object} props.filters - An object containing filter criteria (e.g., region, cuisineType, priceRange, specialConditions, minRating).
 * @param {function} props.onClearFilters - Callback to clear filters and go back to the main home page.
 */
const RestaurantListPage = ({ filters = {}, onClearFilters }) => {
  const { db, currentUser, appId } = useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState("");
  const userId = currentUser?.uid || "anonymous";

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    let q = collection(db, `artifacts/${appId}/public/data/restaurants`);

    // 應用 Firestore 查詢過濾器（Firestore 限制每個查詢只有一個 'array-contains' 和範圍查詢，且不能混合範圍查詢和等式查詢）
    // 因此，複雜的篩選（如多個 specialConditions 或地域匹配）需在客戶端進行記憶體內過濾。
    if (filters.cuisineType) {
      q = query(q, where("cuisine", "==", filters.cuisineType));
    }
    if (filters.priceRange) {
      q = query(q, where("priceLevel", "==", filters.priceRange)); // 假設 Firestore 中有 priceLevel 欄位
    }
    if (filters.minRating && filters.minRating > 0) {
      q = query(q, where("rating", ">=", filters.minRating));
    }
    // 注意：Firestore 不直接支持對同一陣列欄位進行多個 array-contains 條件的 AND 查詢。
    // 對於 specialConditions，我們將在獲取資料後進行記憶體內過濾。
    // 如果只需要匹配一個特殊條件，可以使用 array-contains：
    // if (filters.specialConditions && filters.specialConditions.length === 1) {
    //   q = query(q, where('tags', 'array-contains', filters.specialConditions[0]));
    // }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let fetchedRestaurants = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 記憶體內過濾 region 和 specialConditions (如果有多個條件)
        if (filters.region) {
          // 使用 toLocaleLowerCase() 進行不區分大小寫的匹配
          fetchedRestaurants = fetchedRestaurants.filter(
            (restaurant) =>
              restaurant.address &&
              restaurant.address
                .toLocaleLowerCase()
                .includes(filters.region.toLocaleLowerCase())
          );
        }

        if (filters.specialConditions && filters.specialConditions.length > 0) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) => {
            const restaurantTags = restaurant.tags || []; // 假設餐廳資料中有一個名為 'tags' 的陣列欄位
            return filters.specialConditions.every((filterTag) =>
              restaurantTags.includes(filterTag)
            );
          });
        }

        setRestaurants(fetchedRestaurants);
        setLoading(false);
      },
      (error) => {
        console.error("獲取餐廳資料失敗:", error);
        setModalMessage(`獲取餐廳資料失敗: ${error.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, appId, filters]); // 依賴 filters 確保篩選條件變化時重新查詢

  const addSampleRestaurants = async () => {
    if (!db || !currentUser) {
      setModalMessage("請先登入才能新增資料。");
      return;
    }
    setLoading(true);
    try {
      const restaurantCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/restaurants`
      );
      const sampleRestaurants = [
        {
          name: "楓葉小館",
          cuisine: "加拿大菜",
          address: "多倫多市中心楓葉大道123號",
          phone: "416-123-4567",
          rating: 4.5,
          reviewCount: 25,
          priceLevel: "$$",
          tags: ["24小時", "Wi-Fi"],
          imageUrl: "https://placehold.co/400x200/FF5733/FFFFFF?text=楓葉小館",
        },
        {
          name: "海鮮碼頭",
          cuisine: "海鮮",
          address: "溫哥華海濱路456號",
          phone: "604-987-6543",
          rating: 4.8,
          reviewCount: 40,
          priceLevel: "$$$",
          tags: ["戶外座位"],
          imageUrl: "https://placehold.co/400x200/3366FF/FFFFFF?text=海鮮碼頭",
        },
        {
          name: "法式浪漫",
          cuisine: "法國菜",
          address: "蒙特婁老城區藝術街789號",
          phone: "514-234-5678",
          rating: 4.2,
          reviewCount: 18,
          priceLevel: "$$$$",
          tags: ["素食友善"],
          imageUrl: "https://placehold.co/400x200/6633FF/FFFFFF?text=法式浪漫",
        },
        {
          name: "亞洲風味",
          cuisine: "亞洲菜",
          address: "卡加利市區美食廣場101號",
          phone: "403-567-8901",
          rating: 4.0,
          reviewCount: 30,
          priceLevel: "$",
          tags: ["送餐服務", "Wi-Fi"],
          imageUrl: "https://placehold.co/400x200/33CC66/FFFFFF?text=亞洲風味",
        },
        {
          name: "義式PIZZA",
          cuisine: "意大利菜",
          address: "多倫多市中心披薩巷22號",
          phone: "416-555-1234",
          rating: 3.9,
          reviewCount: 15,
          priceLevel: "$$",
          tags: ["Wi-Fi"],
          imageUrl: "https://placehold.co/400x200/FFCC00/000000?text=義式PIZZA",
        },
      ];

      for (const restaurant of sampleRestaurants) {
        await addDoc(restaurantCollectionRef, restaurant);
      }
      setModalMessage("已新增範例餐廳資料！");
    } catch (error) {
      console.error("新增範例餐廳失敗:", error);
      setModalMessage(`新增範例餐廳失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setModalMessage("");

  const hasFilters = Object.values(filters).some(
    (value) =>
      (Array.isArray(value) && value.length > 0) ||
      (!Array.isArray(value) && value && value !== "0")
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900">
          {hasFilters ? "篩選結果" : "所有餐廳"}
        </h2>
        {hasFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            清除篩選
          </button>
        )}
      </div>
      <p className="text-sm text-gray-600 text-center mb-4">
        當前使用者 ID:{" "}
        <span className="font-mono bg-gray-200 px-2 py-1 rounded">
          {userId}
        </span>
      </p>
      <div className="flex justify-center mb-8">
        <button
          onClick={addSampleRestaurants}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          新增範例餐廳資料 (僅供測試)
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : restaurants.length === 0 ? (
        <p className="text-center text-gray-600 text-xl">
          {hasFilters
            ? "沒有餐廳符合篩選條件。"
            : "目前沒有餐廳資料。請點擊上方按鈕新增範例資料。"}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out"
            >
              <img
                src={
                  restaurant.imageUrl ||
                  `https://placehold.co/400x200/CCCCCC/333333?text=${restaurant.name}`
                }
                alt={restaurant.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://placehold.co/400x200/CCCCCC/333333?text=${restaurant.name}`;
                }}
              />
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {restaurant.name}
                </h3>
                <p className="text-gray-700 mb-1">
                  <span className="font-semibold">菜系:</span>{" "}
                  {restaurant.cuisine}
                </p>
                <p className="text-gray-700 mb-1">
                  <span className="font-semibold">地址:</span>{" "}
                  {restaurant.address}
                </p>
                <p className="text-gray-700 mb-1">
                  <span className="font-semibold">電話:</span>{" "}
                  {restaurant.phone}
                </p>
                <div className="flex items-center mt-3">
                  <span className="text-yellow-500 text-xl mr-2">⭐</span>
                  <span className="text-gray-800 font-bold text-lg">
                    {restaurant.rating?.toFixed(1) || "N/A"}
                  </span>
                  <span className="text-gray-600 text-sm ml-2">
                    ({restaurant.reviewCount || 0} 評論)
                  </span>
                </div>
                {restaurant.priceLevel && (
                  <p className="text-gray-700 mt-2">
                    <span className="font-semibold">人均價錢:</span>{" "}
                    {restaurant.priceLevel}
                  </p>
                )}
                {restaurant.tags && restaurant.tags.length > 0 && (
                  <p className="text-gray-700 mt-1">
                    <span className="font-semibold">特色:</span>{" "}
                    {restaurant.tags.join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal message={modalMessage} onClose={closeModal} />
    </div>
  );
};

export default RestaurantListPage;
