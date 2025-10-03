"use client";

import React, { useState, useContext, useEffect } from "react";
import { redirect } from "next/navigation";
import { AuthContext } from "@/lib/auth-context";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function AdminRestaurantUpdatePage() {
  const { db, appId, currentUser, loadingUser, isAdmin } =
    useContext(AuthContext);
  const [search, setSearch] = useState("");
  const [restaurants, setRestaurants] = useState([]); // 🔥 支援多結果
  const [restaurant, setRestaurant] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // 🚨 Admin check
  useEffect(() => {
    if (!loadingUser && (!currentUser || !isAdmin)) {
      redirect("/");
    }
  }, [currentUser, loadingUser, isAdmin]);

  if (loadingUser || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // 🔍 搜餐廳（英文 or 中文）
  const handleSearch = async () => {
    setLoading(true);
    try {
      let results = [];

      // 1️⃣ 英文名
      const qEn = query(
        collection(db, "artifacts", appId, "public", "data", "restaurants"),
        where("name_lowercase_en", "==", search.toLowerCase())
      );
      const snapshotEn = await getDocs(qEn);
      if (!snapshotEn.empty) {
        results = snapshotEn.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
      }

      // 2️⃣ 如果無 → 試中文名
      if (results.length === 0) {
        const qZh = query(
          collection(db, "artifacts", appId, "public", "data", "restaurants"),
          where("restaurantName.zh-TW", "==", search)
        );
        const snapshotZh = await getDocs(qZh);
        if (!snapshotZh.empty) {
          results = snapshotZh.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
        }
      }

      if (results.length > 0) {
        setRestaurants(results);
        if (results.length === 1) {
          setRestaurant(results[0]);
          setFormData(results[0]);
        } else {
          setRestaurant(null);
          setFormData({});
        }
      } else {
        alert("找不到餐廳");
        setRestaurants([]);
        setRestaurant(null);
      }
    } catch (err) {
      console.error(err);
      alert("搜尋失敗");
    } finally {
      setLoading(false);
    }
  };

  // ✏️ 表單改動
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 💾 Save
  const handleSave = async () => {
    if (!restaurant) return;
    try {
      await updateDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "restaurants",
          restaurant.id
        ),
        formData
      );
      alert("更新成功！");
    } catch (err) {
      console.error(err);
      alert("更新失敗");
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6 font-inter">
      <h1 className="text-2xl font-bold">餐廳資料更新</h1>

      {/* 搜索框 */}
      <div className="flex space-x-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="輸入餐廳英文或中文名"
          className="border p-2 flex-1"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "搜尋中..." : "Search"}
        </button>
      </div>

      {/* 多結果 → 提供選擇 */}
      {restaurants.length > 1 && (
        <div className="space-y-2">
          <p className="font-medium">找到多間餐廳，請選擇：</p>
          <ul className="list-disc pl-6 space-y-1">
            {restaurants.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => {
                    setRestaurant(r);
                    setFormData(r);
                  }}
                  className="text-blue-600 underline"
                >
                  {r.restaurantName?.["zh-TW"] || r.restaurantName?.en || r.id}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 顯示 / 編輯表單 */}
      {restaurant && (
        <div className="space-y-4 border-t pt-4">
          <h2 className="text-lg font-semibold">
            編輯：
            {restaurant.restaurantName?.["zh-TW"] ||
              restaurant.restaurantName?.en}
          </h2>
          {Object.keys(formData).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium">{field}</label>
              <input
                name={field}
                value={
                  typeof formData[field] === "string" ||
                  typeof formData[field] === "number"
                    ? formData[field]
                    : JSON.stringify(formData[field]) // 陣列/物件直接 JSON.stringify
                }
                onChange={handleChange}
                className="border p-2 w-full"
              />
            </div>
          ))}

          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
