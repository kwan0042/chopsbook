// src/components/FilterModal.js
"use client";

import React, { useState } from "react";

/**
 * FilterModal: 允許使用者根據各種條件篩選餐廳。
 * @param {object} props - 組件屬性。
 * @param {boolean} props.isOpen - 控制模態框是否可見。
 * @param {function} props.onClose - 關閉模態框的回調函數。
 * @param {function} props.onApplyFilters - 應用篩選條件的回調函數，接收一個包含篩選條件的物件。
 */
const FilterModal = ({ isOpen, onClose, onApplyFilters }) => {
  const [cuisineType, setCuisineType] = useState("");
  const [priceRange, setPriceRange] = useState("0"); // 使用數字表示最大消費
  const [minRating, setMinRating] = useState(0);
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [facilitiesServices, setFacilitiesServices] = useState([]); // 新增設施/服務

  // Dropdown 選項
  const cuisineOptions = [
    "選擇菜系",
    "加拿大菜",
    "海鮮",
    "法國菜",
    "亞洲菜",
    "意大利菜",
    "美式菜",
    "中餐",
    "日式料理",
    "其他",
  ];
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
  const provinceOptions = [
    "選擇省份",
    "安大略省",
    "魁北克省",
    "卑詩省",
    "亞伯達省",
    "曼尼托巴省",
    "薩斯喀徹溫省",
    "新斯科細亞省",
    "新不倫瑞克省",
    "紐芬蘭與拉布拉多省",
    "愛德華王子島省",
    "西北地區",
    "育空地區",
    "努納武特地區",
  ];
  const facilitiesServiceOptions = [
    "室外座位",
    "電視播放",
    "酒精飲品",
    "Wi-Fi服務",
    "切餅費",
    "可自帶酒水",
    "外賣速遞",
    "停車場",
    "無障礙設施",
    "兒童友善",
  ];

  const handleFacilitiesChange = (e) => {
    const { value, checked } = e.target;
    setFacilitiesServices((prev) =>
      checked ? [...prev, value] : prev.filter((item) => item !== value)
    );
  };

  const handleApply = () => {
    const filters = {
      cuisineType,
      priceRange: parseInt(priceRange, 10), // 確保是數字
      minRating,
      city,
      province,
      facilitiesServices,
    };
    onApplyFilters(filters);
  };

  const handleReset = () => {
    setCuisineType("");
    setPriceRange("0");
    setMinRating(0);
    setCity("");
    setProvince("");
    setFacilitiesServices([]);
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
              value={cuisineType}
              onChange={(e) => setCuisineType(e.target.value)}
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
              value={province}
              onChange={(e) => setProvince(e.target.value)}
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
                    checked={facilitiesServices.includes(option)}
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
