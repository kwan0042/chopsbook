// src/components/FilterSidebar.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronUp,
  faChevronDown,
  faTimesCircle, // 用於清除按鈕圖標
} from "@fortawesome/free-solid-svg-icons";

/**
 * FilterSidebar 元件: 提供可摺疊的篩選選項。
 * 每個篩選類別（如菜系、價格範圍等）都可以獨立地展開和收合。
 * 側邊欄將始終保持展開狀態，並具有固定的寬度。
 *
 * @param {object} props - 組件屬性。
 * @param {object} props.initialFilters - 初始篩選條件物件。
 * @param {function} props.onApplyFilters - 應用篩選時的回調函數。
 * @param {function} props.onResetFilters - 清除所有篩選時的回調函數。
 */
const FilterSidebar = ({
  initialFilters = {},
  onApplyFilters,
  onResetFilters,
}) => {
  // 本地元件狀態，用於管理表單輸入
  const [localFilters, setLocalFilters] = useState(initialFilters);

  // 每個篩選區塊的摺疊狀態 (內部管理)
  const [isRegionCollapsed, setIsRegionCollapsed] = useState(false);
  const [isCategoryCollapsed, setIsCategoryCollapsed] = useState(false);
  const [isAvgSpendingCollapsed, setIsAvgSpendingCollapsed] = useState(false);
  const [isMinRatingCollapsed, setIsMinRatingCollapsed] = useState(false);
  const [isBusinessHoursCollapsed, setIsBusinessHoursCollapsed] =
    useState(false);
  const [isReservationModesCollapsed, setIsReservationModesCollapsed] =
    useState(false);
  const [isPaymentMethodsCollapsed, setIsPaymentMethodsCollapsed] =
    useState(false);
  const [isFacilitiesCollapsed, setIsFacilitiesCollapsed] = useState(false);
  const [isSeatingCapacityCollapsed, setIsSeatingCapacityCollapsed] =
    useState(false);

  // 同步外部 initialFilters 到內部 localFilters
  useEffect(() => {
    setLocalFilters(initialFilters);
  }, [initialFilters]);

  // 處理單選/輸入框篩選條件的變化
  const handleFilterChange = useCallback((key, value) => {
    setLocalFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  }, []);

  // 處理多選篩選條件的變化
  const handleMultiSelectFilterChange = useCallback((key, value) => {
    setLocalFilters((prevFilters) => {
      const currentValues = prevFilters[key] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      return {
        ...prevFilters,
        [key]: newValues,
      };
    });
  }, []);

  // 當點擊 "應用篩選" 按鈕時
  const handleApply = useCallback(() => {
    onApplyFilters(localFilters); // 將本地篩選條件傳遞給父組件
  }, [localFilters, onApplyFilters]);

  // 當點擊 "清除所有篩選" 按鈕時
  const handleReset = useCallback(() => {
    setLocalFilters({}); // 清空本地篩選條件
    onResetFilters(); // 通知父組件清除所有篩選
  }, [onResetFilters]);

  // 以下是篩選選項的靜態數據
  const provinces = ["安大略省", "卑詩省", "魁北克省", "亞伯達省"];
  const cuisineTypes = ["加拿大菜", "海鮮", "法國菜", "亞洲菜", "意大利菜"];
  const reservationModes = ["電話預約", "Walk-in", "官方網站", "第三方平台"];
  const paymentMethods = [
    "現金",
    "信用卡",
    "借記卡",
    "微信支付",
    "支付寶",
    "Apple Pay",
    "Google Pay",
  ];
  const facilities = [
    "室外座位",
    "Wi-Fi服務",
    "酒精飲品",
    "無障礙設施",
    "外賣速遞",
    "兒童友善",
    "停車場",
    "包廂",
  ];
  const seatingCapacities = [
    { label: "1-20人", min: 1, max: 20 },
    { label: "21-50人", min: 21, max: 50 },
    { label: "51-100人", min: 51, max: 100 },
    { label: "101-200人", min: 101, max: 200 },
    { label: "200人以上", min: 201, max: 9999 },
  ];

  return (
    <div
      className="relative bg-white p-6 shadow-lg rounded-2xl w-60 space-y-6 flex-shrink-0 h-fit" // 固定寬度 w-60，並確保不被壓縮 flex-shrink-0
    >
      {/* 移除側邊欄整體摺疊按鈕 */}

      <h3 className="text-xl font-bold text-gray-900 mb-6">篩選餐廳</h3>

      {/* 篩選類別區塊 */}
      <div className="space-y-4">
        {/* 地區篩選 */}
        <div className="border-b pb-4 border-gray-200">
          <div
            className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            onClick={() => setIsRegionCollapsed(!isRegionCollapsed)}
          >
            <h4 className="text-base font-semibold text-gray-800">地區</h4>
            <FontAwesomeIcon
              icon={isRegionCollapsed ? faChevronDown : faChevronUp}
              className="text-gray-500"
            />
          </div>
          {!isRegionCollapsed && (
            <div className="mt-3 space-y-3">
              <div>
                <label
                  htmlFor="province"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  省份
                </label>
                <select // 將 select 元素的 class 與 input 保持一致
                  id="province"
                  value={localFilters.province || ""}
                  onChange={(e) =>
                    handleFilterChange("province", e.target.value)
                  }
                  // 使用與城市輸入框相同的 Tailwind CSS 類別
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                >
                  <option value="">所有省份</option>
                  {provinces.map((province) => (
                    // 對於 <option> 標籤，直接用 CSS 樣式化它們在大多數瀏覽器中是無效的
                    // 這些樣式將主要影響 <select> 框本身，而非下拉選項列表
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  城市
                </label>
                <input
                  type="text"
                  id="city"
                  placeholder="輸入城市名稱"
                  value={localFilters.city || ""}
                  onChange={(e) => handleFilterChange("city", e.target.value)}
                  // 使用與省份下拉選單相同的 Tailwind CSS 類別
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                />
              </div>
            </div>
          )}
        </div>

        {/* 菜系類別篩選 (多選) */}
        <div className="border-b pb-4 border-gray-200">
          <div
            className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            onClick={() => setIsCategoryCollapsed(!isCategoryCollapsed)}
          >
            <h4 className="text-base font-semibold text-gray-800">菜系類別</h4>
            <FontAwesomeIcon
              icon={isCategoryCollapsed ? faChevronDown : faChevronUp}
              className="text-gray-500"
            />
          </div>
          {!isCategoryCollapsed && (
            <div className="mt-3 space-y-2">
              {cuisineTypes.map((type) => (
                <div key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`cuisine-${type}`}
                    checked={(localFilters.category || []).includes(type)}
                    onChange={() =>
                      handleMultiSelectFilterChange("category", type)
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`cuisine-${type}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 人均價錢篩選 */}
        <div className="border-b pb-4 border-gray-200">
          <div
            className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            onClick={() => setIsAvgSpendingCollapsed(!isAvgSpendingCollapsed)}
          >
            <h4 className="text-base font-semibold text-gray-800">人均價錢</h4>
            <FontAwesomeIcon
              icon={isAvgSpendingCollapsed ? faChevronDown : faChevronUp}
              className="text-gray-500"
            />
          </div>
          {!isAvgSpendingCollapsed && (
            <div className="mt-3 space-y-2">
              <div>
                <label
                  htmlFor="minAvgSpending"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  最低人均消費 ($)
                </label>
                <input
                  type="number"
                  id="minAvgSpending"
                  value={localFilters.minAvgSpending || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "minAvgSpending",
                      e.target.value ? parseInt(e.target.value, 10) : undefined
                    )
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                  min="0"
                />
              </div>
              <div>
                <label
                  htmlFor="maxAvgSpending"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  最高人均消費 ($)
                </label>
                <input
                  type="number"
                  id="maxAvgSpending"
                  value={localFilters.maxAvgSpending || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "maxAvgSpending",
                      e.target.value ? parseInt(e.target.value, 10) : undefined
                    )
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                  min="0"
                />
              </div>
            </div>
          )}
        </div>

        {/* 最低評分篩選 */}
        <div className="border-b pb-4 border-gray-200">
          <div
            className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            onClick={() => setIsMinRatingCollapsed(!isMinRatingCollapsed)}
          >
            <h4 className="text-base font-semibold text-gray-800">最低評分</h4>
            <FontAwesomeIcon
              icon={isMinRatingCollapsed ? faChevronDown : faChevronUp}
              className="text-gray-500"
            />
          </div>
          {!isMinRatingCollapsed && (
            <div className="mt-3">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={localFilters.minRating || 0}
                onChange={(e) =>
                  handleFilterChange("minRating", parseFloat(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm"
              />
              <span className="block text-center text-sm text-gray-700 mt-2">
                {localFilters.minRating || 0} 星及以上
              </span>
            </div>
          )}
        </div>

        {/* 座位數篩選 */}
        <div className="border-b pb-4 border-gray-200">
          <div
            className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            onClick={() =>
              setIsSeatingCapacityCollapsed(!isSeatingCapacityCollapsed)
            }
          >
            <h4 className="text-base font-semibold text-gray-800">座位數</h4>
            <FontAwesomeIcon
              icon={isSeatingCapacityCollapsed ? faChevronDown : faChevronUp}
              className="text-gray-500"
            />
          </div>
          {!isSeatingCapacityCollapsed && (
            <div className="mt-3 space-y-2">
              {seatingCapacities.map((capacity) => (
                <div key={capacity.label} className="flex items-center">
                  <input
                    type="radio"
                    id={`seating-${capacity.label}`}
                    name="seatingCapacity"
                    checked={
                      localFilters.minSeatingCapacity === capacity.min &&
                      localFilters.maxSeatingCapacity === capacity.max
                    }
                    onChange={() => {
                      handleFilterChange("minSeatingCapacity", capacity.min);
                      handleFilterChange("maxSeatingCapacity", capacity.max);
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`seating-${capacity.label}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {capacity.label}
                  </label>
                </div>
              ))}
              <div className="flex items-center">
                <input
                  type="radio"
                  id="seating-any"
                  name="seatingCapacity"
                  checked={
                    !localFilters.minSeatingCapacity &&
                    !localFilters.maxSeatingCapacity
                  }
                  onChange={() => {
                    handleFilterChange("minSeatingCapacity", undefined);
                    handleFilterChange("maxSeatingCapacity", undefined);
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="seating-any"
                  className="ml-2 text-sm text-gray-700"
                >
                  不限
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 營業狀態篩選 */}
        <div className="border-b pb-4 border-gray-200">
          <div
            className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            onClick={() =>
              setIsBusinessHoursCollapsed(!isBusinessHoursCollapsed)
            }
          >
            <h4 className="text-base font-semibold text-gray-800">營業狀態</h4>
            <FontAwesomeIcon
              icon={isBusinessHoursCollapsed ? faChevronDown : faChevronUp}
              className="text-gray-500"
            />
          </div>
          {!isBusinessHoursCollapsed && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="status-open"
                  name="businessHours"
                  value="營業中"
                  checked={localFilters.businessHours === "營業中"}
                  onChange={(e) =>
                    handleFilterChange("businessHours", e.target.value)
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="status-open"
                  className="ml-2 text-sm text-gray-700"
                >
                  營業中
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="status-closed"
                  name="businessHours"
                  value="休假中"
                  checked={localFilters.businessHours === "休假中"}
                  onChange={(e) =>
                    handleFilterChange("businessHours", e.target.value)
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="status-closed"
                  className="ml-2 text-sm text-gray-700"
                >
                  休假中 (含暫時休業)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="status-any"
                  name="businessHours"
                  value=""
                  checked={!localFilters.businessHours}
                  onChange={() => handleFilterChange("businessHours", "")}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="status-any"
                  className="ml-2 text-sm text-gray-700"
                >
                  不限
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 訂座模式篩選 (多選) */}
        <div className="border-b pb-4 border-gray-200">
          <div
            className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            onClick={() =>
              setIsReservationModesCollapsed(!isReservationModesCollapsed)
            }
          >
            <h4 className="text-base font-semibold text-gray-800">訂座模式</h4>
            <FontAwesomeIcon
              icon={isReservationModesCollapsed ? faChevronDown : faChevronUp}
              className="text-gray-500"
            />
          </div>
          {!isReservationModesCollapsed && (
            <div className="mt-3 space-y-2">
              {reservationModes.map((mode) => (
                <div key={mode} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`reservation-${mode}`}
                    checked={(localFilters.reservationModes || []).includes(
                      mode
                    )}
                    onChange={() =>
                      handleMultiSelectFilterChange("reservationModes", mode)
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`reservation-${mode}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {mode}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 付款方式篩選 (多選) */}
        <div className="border-b pb-4 border-gray-200">
          <div
            className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            onClick={() =>
              setIsPaymentMethodsCollapsed(!isPaymentMethodsCollapsed)
            }
          >
            <h4 className="text-base font-semibold text-gray-800">付款方式</h4>
            <FontAwesomeIcon
              icon={isPaymentMethodsCollapsed ? faChevronDown : faChevronUp}
              className="text-gray-500"
            />
          </div>
          {!isPaymentMethodsCollapsed && (
            <div className="mt-3 space-y-2">
              {paymentMethods.map((method) => (
                <div key={method} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`payment-${method}`}
                    checked={(localFilters.paymentMethods || []).includes(
                      method
                    )}
                    onChange={() =>
                      handleMultiSelectFilterChange("paymentMethods", method)
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`payment-${method}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {method}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 設施/服務篩選 (多選) */}
        <div className="pb-4">
          {" "}
          {/* 移除最後一個區塊的 border-b */}
          <div
            className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            onClick={() => setIsFacilitiesCollapsed(!isFacilitiesCollapsed)}
          >
            <h4 className="text-base font-semibold text-gray-800">設施/服務</h4>
            <FontAwesomeIcon
              icon={isFacilitiesCollapsed ? faChevronDown : faChevronUp}
              className="text-gray-500"
            />
          </div>
          {!isFacilitiesCollapsed && (
            <div className="mt-3 space-y-2">
              {facilities.map((facility) => (
                <div key={facility} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`facility-${facility}`}
                    checked={(localFilters.facilities || []).includes(facility)}
                    onChange={() =>
                      handleMultiSelectFilterChange("facilities", facility)
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`facility-${facility}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {facility}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 應用篩選和清除篩選按鈕 */}
      <div className="flex flex-col space-y-4 pt-6 border-t border-gray-200">
        <button
          onClick={handleApply}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          應用篩選
        </button>
        <button
          onClick={handleReset}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-xl shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
        >
          <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
          清除所有篩選
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;
