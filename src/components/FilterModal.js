"use client";

import React, { useState } from "react";
// 引入 restaurant-options.js 中的選項
import {
  cuisineOptions,
  facilitiesServiceOptions, // 更名為 facilitiesServiceOptions 以匹配 restaurant-options.js
  provinceOptions,
} from "../data/restaurant-options"; // 確保路徑正確

/**
 * FilterModal: 允許使用者根據各種條件篩選餐廳。
 * @param {object} props - 組件屬性。
 * @param {boolean} props.isOpen - 控制模態框是否可見。
 * @param {function} props.onClose - 關閉模態框的回調函數。
 * @param {function} props.onApplyFilters - 應用篩選條件的回調函數，接收一個包含篩選條件的物件。
 */
const FilterModal = ({ isOpen, onClose, onApplyFilters }) => {
  const [selectedCuisineType, setSelectedCuisineType] = useState(""); // 將狀態名稱更改為更清晰的 selectedCuisineType
  const [priceRange, setPriceRange] = useState("0"); // 使用數字表示最大消費
  const [minRating, setMinRating] = useState(0);
  const [city, setCity] = useState("");
  const [selectedProvince, setSelectedProvince] = useState(""); // 將狀態名稱更改為更清晰的 selectedProvince
  const [selectedFacilitiesServices, setSelectedFacilitiesServices] = useState(
    []
  ); // 將狀態名稱更改為更清晰的 selectedFacilitiesServices

  // Dropdown 選項 - 現在直接從導入的檔案中使用
  // cuisineOptions (已導入)
  const priceRangeOptions = [
    { value: "0", label: "不限人均" },
    { value: "20", label: "低於 $20" },
    { value: "40", label: "低於 $40" },
    { value: "60", label: "低於 $60" },
    { value: "80", label: "低於 $80" },
    { value: "100", label: "低於 $100" },
    { value: "9999", label: "不限 (預設高價)" }, // 用一個很大的數字表示不限，以便於篩選邏輯處理
  ];
  const ratingOptions = [
    { value: 0, label: "不限評分" },
    { value: 3, label: "3 星或以上" },
    { value: 3.5, label: "3.5 星或以上" },
    { value: 4, label: "4 星或以上" },
    { value: 4.5, label: "4.5 星或以上" },
  ];
  // provinceOptions (已導入)
  // facilitiesServiceOptions (已導入)

  const handleFacilitiesChange = (e) => {
    const { value, checked } = e.target;
    setSelectedFacilitiesServices((prev) =>
      checked ? [...prev, value] : prev.filter((item) => item !== value)
    );
  };

  const handleApply = () => {
    // 构建一个临时的 filters 对象
    const filters = {};

    // 1. 菜系篩選: 確保鍵名為 'category'，且不是 "選擇菜系"
    if (selectedCuisineType && selectedCuisineType !== "選擇菜系") {
      filters.category = selectedCuisineType;
    }

    // 2. 人均消費篩選: 將 priceRange 轉換為 maxAvgSpending，並處理 "不限" 情況
    const parsedPriceRange = parseInt(priceRange, 10);
    // 只有當 parsedPriceRange 大於 0 且不是 "9999" (不限高價) 時才應用此篩選
    if (parsedPriceRange > 0 && parsedPriceRange !== 9999) {
      filters.maxAvgSpending = parsedPriceRange;
    }

    // 3. 最低評分篩選: 確保鍵名為 'minRating'，且大於 0
    if (minRating > 0) {
      filters.minRating = minRating;
    }

    // 4. 城市篩選
    if (city) {
      filters.city = city;
    }

    // 5. 省份篩選: 確保鍵名為 'province'，且不是 "選擇省份"
    if (selectedProvince && selectedProvince !== "選擇省份") {
      filters.province = selectedProvince;
    }

    // 6. 設施/服務篩選: 確保鍵名為 'facilities'
    if (selectedFacilitiesServices.length > 0) {
      filters.facilities = selectedFacilitiesServices;
    }

    onApplyFilters(filters);
  };

  const handleReset = () => {
    setSelectedCuisineType("");
    setPriceRange("0");
    setMinRating(0);
    setCity("");
    setSelectedProvince("");
    setSelectedFacilitiesServices([]);
    onApplyFilters({}); // 清除所有篩選
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
          aria-label="關閉篩選器"
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          篩選餐廳
        </h2>

        <div className="space-y-4">
          {/* 菜系篩選 */}
          <div>
            <label
              htmlFor="cuisineType"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              菜系
            </label>
            <select
              id="cuisineType"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCuisineType} // 使用新的狀態變數
              onChange={(e) => setSelectedCuisineType(e.target.value)} // 使用新的狀態變數的設置函數
            >
              {cuisineOptions.map((option) => (
                <option
                  key={option}
                  value={option === "選擇菜系" ? "" : option}
                >
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* 人均消費篩選 */}
          <div>
            <label
              htmlFor="priceRange"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              人均消費
            </label>
            <select
              id="priceRange"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            >
              {priceRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 最低評分篩選 */}
          <div>
            <label
              htmlFor="minRating"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              最低評分
            </label>
            <select
              id="minRating"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
            >
              {ratingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 城市篩選 */}
          <div>
            <label
              htmlFor="city"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              城市
            </label>
            <input
              type="text"
              id="city"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="例如：多倫多"
            />
          </div>

          {/* 省份篩選 */}
          <div>
            <label
              htmlFor="province"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              省份
            </label>
            <select
              id="province"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedProvince} // 使用新的狀態變數
              onChange={(e) => setSelectedProvince(e.target.value)} // 使用新的狀態變數的設置函數
            >
              {provinceOptions.map((option) => (
                <option
                  key={option}
                  value={option === "選擇省份" ? "" : option}
                >
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* 設施/服務篩選 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              設施/服務
            </label>
            <div className="grid grid-cols-2 gap-2">
              {facilitiesServiceOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center text-gray-700 text-sm"
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={selectedFacilitiesServices.includes(option)} // 使用新的狀態變數
                    onChange={handleFacilitiesChange}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="ml-2">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 按鈕組 */}
        <div className="flex justify-between mt-6 space-x-4">
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            重置
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            應用篩選
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
