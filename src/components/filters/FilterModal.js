// src/components/FilterModal.js
"use client";

import React, { useState } from "react";
import {
  cuisineOptions,
  facilitiesServiceOptions,
  provinceOptions,
} from "../../data/restaurant-options";

/**
 * FilterModal: 允許使用者根據各種條件篩選餐廳。
 * @param {object} props - 組件屬性。
 * @param {boolean} props.isOpen - 控制模態框是否可見。
 * @param {function} props.onClose - 關閉模態框的回調函數。
 * @param {function} props.onApplyFilters - 應用篩選條件的回調函數，接收一個包含篩選條件的物件。
 */
const FilterModal = ({ isOpen, onClose, onApplyFilters }) => {
  const [selectedCuisineType, setSelectedCuisineType] = useState("");
  const [priceRange, setPriceRange] = useState("0");
  const [minRating, setMinRating] = useState(0);
  const [city, setCity] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedFacilitiesServices, setSelectedFacilitiesServices] = useState(
    []
  );

  // 新增狀態變數
  const [timeOfDay, setTimeOfDay] = useState(""); // 'day' 或 'night'
  const [minAvgSpending, setMinAvgSpending] = useState("");
  const [maxAvgSpending, setMaxAvgSpending] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [partySize, setPartySize] = useState("");

  const priceRangeOptions = [
    { value: "0", label: "不限人均" },
    { value: "20", label: "低於 $20" },
    { value: "40", label: "低於 $40" },
    { value: "60", label: "低於 $60" },
    { value: "80", label: "低於 $80" },
    { value: "100", label: "低於 $100" },
    { value: "9999", label: "不限 (預設高價)" },
  ];
  const ratingOptions = [
    { value: 0, label: "不限評分" },
    { value: 3, label: "3 星或以上" },
    { value: 3.5, label: "3.5 星或以上" },
    { value: 4, label: "4 星或以上" },
    { value: 4.5, label: "4.5 星或以上" },
  ];

  const handleFacilitiesChange = (e) => {
    const { value, checked } = e.target;
    setSelectedFacilitiesServices((prev) =>
      checked ? [...prev, value] : prev.filter((item) => item !== value)
    );
  };

  const handleApply = () => {
    const filters = {};

    if (selectedCuisineType && selectedCuisineType !== "選擇菜系") {
      filters.category = selectedCuisineType;
    }

    const parsedPriceRange = parseInt(priceRange, 10);
    if (parsedPriceRange > 0 && parsedPriceRange !== 9999) {
      filters.maxAvgSpending = parsedPriceRange;
    }

    if (minRating > 0) {
      filters.minRating = minRating;
    }

    if (city) {
      filters.city = city;
    }

    if (selectedProvince && selectedProvince !== "選擇省份") {
      filters.province = selectedProvince;
    }

    if (selectedFacilitiesServices.length > 0) {
      filters.facilities = selectedFacilitiesServices;
    }

    // 新增篩選邏輯
    if (timeOfDay) {
      filters.timeOfDay = timeOfDay;
    }
    if (minAvgSpending) {
      filters.minAvgSpending = parseInt(minAvgSpending, 10);
    }
    if (maxAvgSpending) {
      filters.maxAvgSpending = parseInt(maxAvgSpending, 10);
    }
    if (reservationDate) {
      filters.reservationDate = reservationDate;
    }
    if (reservationTime) {
      filters.reservationTime = reservationTime;
    }
    if (partySize) {
      filters.partySize = parseInt(partySize, 10);
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

    // 重置新狀態
    setTimeOfDay("");
    setMinAvgSpending("");
    setMaxAvgSpending("");
    setReservationDate("");
    setReservationTime("");
    setPartySize("");

    onApplyFilters({});
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
          {/* 日間/晚間篩選 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              用餐時段
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center text-gray-700">
                <input
                  type="radio"
                  name="timeOfDay"
                  value="day"
                  checked={timeOfDay === "day"}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">日間 (11:00-17:00)</span>
              </label>
              <label className="flex items-center text-gray-700">
                <input
                  type="radio"
                  name="timeOfDay"
                  value="night"
                  checked={timeOfDay === "night"}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">晚間 (17:00-22:00)</span>
              </label>
            </div>
          </div>

          {/* 自訂預算篩選 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              預算範圍 (人均)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="最低"
                value={minAvgSpending}
                onChange={(e) => setMinAvgSpending(e.target.value)}
                className="w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="最高"
                value={maxAvgSpending}
                onChange={(e) => setMaxAvgSpending(e.target.value)}
                className="w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 日期、時間、人數篩選 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="reservationDate"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                預訂日期
              </label>
              <input
                type="date"
                id="reservationDate"
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="reservationTime"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                預訂時間
              </label>
              <input
                type="time"
                id="reservationTime"
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="partySize"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                用餐人數
              </label>
              <input
                type="number"
                id="partySize"
                placeholder="人數"
                min="1"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 其他原有篩選器... */}
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
              value={selectedCuisineType}
              onChange={(e) => setSelectedCuisineType(e.target.value)}
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

          {/* 人均消費篩選 (簡化版) */}
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
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
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
                    checked={selectedFacilitiesServices.includes(option)}
                    onChange={handleFacilitiesChange}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="ml-2">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

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
