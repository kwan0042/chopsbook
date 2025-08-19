// src/components/FilterModal.js
"use client";

import React, { useState } from "react";

const FilterModal = ({ isOpen, onClose, onApplyFilters }) => {
  const [region, setRegion] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [specialConditions, setSpecialConditions] = useState([]);
  const [minRating, setMinRating] = useState("0"); // '0' for no minimum, '1' for 1 star, etc.

  // 預設篩選選項
  const regions = ["多倫多", "溫哥華", "蒙特婁", "卡加利", "渥太華"];
  const cuisineTypes = [
    "加拿大菜",
    "海鮮",
    "法國菜",
    "亞洲菜",
    "意大利菜",
    "美式菜",
    "中餐",
    "日式料理",
  ];
  const priceRanges = [
    { label: "$ (便宜)", value: "$" },
    { label: "$$ (中等)", value: "$$" },
    { label: "$$$ (昂貴)", value: "$$$" },
    { label: "$$$$ (非常昂貴)", value: "$$$$" },
  ];
  const tags = [
    "24小時",
    "Wi-Fi",
    "允許寵物",
    "戶外座位",
    "素食友善",
    "送餐服務",
  ];

  const handleTagChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSpecialConditions([...specialConditions, value]);
    } else {
      setSpecialConditions(specialConditions.filter((tag) => tag !== value));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 收集所有篩選條件
    const filters = {
      region,
      cuisineType,
      priceRange,
      specialConditions,
      minRating: parseFloat(minRating),
    };
    onApplyFilters(filters); // 將篩選條件傳回父組件
    onClose(); // 關閉 Modal
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          篩選餐廳
        </h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
          aria-label="關閉"
        >
          &times;
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 地區選擇 */}
          <div>
            <label
              htmlFor="region"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              地區
            </label>
            <select
              id="region"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">選擇地區</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* 餐廳類型選擇 */}
          <div>
            <label
              htmlFor="cuisineType"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              餐廳類型
            </label>
            <select
              id="cuisineType"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={cuisineType}
              onChange={(e) => setCuisineType(e.target.value)}
            >
              <option value="">選擇餐廳類型</option>
              {cuisineTypes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 人均價錢選擇 */}
          <div>
            <label
              htmlFor="priceRange"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              人均價錢
            </label>
            <select
              id="priceRange"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            >
              <option value="">選擇價錢範圍</option>
              {priceRanges.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* 特別條件 (Tags) */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              特別條件
            </label>
            <div className="grid grid-cols-2 gap-3">
              {tags.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center text-gray-700 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={tag}
                    checked={specialConditions.includes(tag)}
                    onChange={handleTagChange}
                    className="form-checkbox h-4 w-4 text-yellow-500 rounded focus:ring-yellow-500"
                  />
                  <span className="ml-2">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 五星評級 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              五星評級 (最低)
            </label>
            <div className="flex flex-wrap gap-4">
              {[0, 1, 2, 3, 4, 5].map((star) => (
                <label
                  key={star}
                  className="flex items-center text-gray-700 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="minRating"
                    value={star.toString()}
                    checked={minRating === star.toString()}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="form-radio h-4 w-4 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="ml-2">
                    {star === 0 ? "不限" : `${star} 星以上`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 提交按鈕 */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 mt-6"
          >
            應用篩選
          </button>
        </form>
      </div>
    </div>
  );
};

export default FilterModal;
