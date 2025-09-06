// src/components/FilterSidebar.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronUp,
  faChevronDown,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";

import {
  cuisineOptions,
  reservationModeOptions,
  paymentMethodOptions,
  facilitiesServiceOptions,
  provinceOptions,
  seatingCapacityOptions,
} from "../../data/restaurant-options";

const parseSeatingCapacityOptions = (options) => {
  return options
    .filter((option) => option !== "選擇座位數")
    .map((option) => {
      if (option.includes("-")) {
        const [minStr, maxStr] = option.split("-");
        return {
          label: `${option}人`,
          min: parseInt(minStr, 10),
          max: parseInt(maxStr, 10),
        };
      } else if (option.includes("+")) {
        const minStr = option.replace("+", "");
        return {
          label: `${minStr}+ 人`,
          min: parseInt(minStr, 10),
          max: 9999,
        };
      }
      return null;
    })
    .filter(Boolean);
};

const FilterSidebar = ({
  initialFilters = {},
  onApplyFilters,
  onResetFilters,
}) => {
  const [localFilters, setLocalFilters] = useState(initialFilters);

  const [isRegionCollapsed, setIsRegionCollapsed] = useState(true);
  const [isCategoryCollapsed, setIsCategoryCollapsed] = useState(true);
  const [isAvgSpendingCollapsed, setIsAvgSpendingCollapsed] = useState(true);
  const [isMinRatingCollapsed, setIsMinRatingCollapsed] = useState(true);
  const [isBusinessHoursCollapsed, setIsBusinessHoursCollapsed] =
    useState(true);
  const [isReservationModesCollapsed, setIsReservationModesCollapsed] =
    useState(true);
  const [isPaymentMethodsCollapsed, setIsPaymentMethodsCollapsed] =
    useState(true);
  const [isFacilitiesCollapsed, setIsFacilitiesCollapsed] = useState(true);
  const [isSeatingCapacityCollapsed, setIsSeatingCapacityCollapsed] =
    useState(true);

  const [isTimeAndPartyCollapsed, setIsTimeAndPartyCollapsed] = useState(false);

  useEffect(() => {
    setLocalFilters(initialFilters);
  }, [initialFilters]);

  const handleFilterChange = useCallback((key, value) => {
    setLocalFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  }, []);

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

  const handleApply = useCallback(() => {
    onApplyFilters(localFilters);
  }, [localFilters, onApplyFilters]);

  const handleReset = useCallback(() => {
    setLocalFilters({});
    onResetFilters();
  }, [onResetFilters]);

  const displayCuisineTypes = cuisineOptions.filter(
    (option) => option !== "選擇菜系"
  );
  const displayReservationModes = reservationModeOptions;
  const displayPaymentMethods = paymentMethodOptions;
  const displayFacilities = facilitiesServiceOptions;
  const displayProvinces = provinceOptions.filter(
    (option) => option !== "選擇省份"
  );

  const parsedSeatingCapacities = parseSeatingCapacityOptions(
    seatingCapacityOptions
  );

  const hasFiltersApplied = () => {
    for (const key in localFilters) {
      const value = localFilters[key];
      if (
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === "string" && value !== "" && value !== "所有省份") ||
        (typeof value === "number" && value !== 0 && !isNaN(value)) ||
        (typeof value === "object" &&
          value !== null &&
          Object.keys(value).length > 0)
      ) {
        return true;
      }
    }
    return false;
  };

  const isFiltersActive = hasFiltersApplied();

  return (
    <div className="relative bg-white p-6 shadow-lg rounded-2xl w-full flex flex-col h-full">
      <h3 className="text-xl font-bold text-gray-900 mb-6">篩選餐廳</h3>

      <div className="h-full overflow-y-auto pr-2 -mr-2">
        <div className="space-y-4 flex-grow overflow-y-auto pr-2 -mr-2">
          {/* 新增：日期、時間、人數及時段篩選 */}
          <div className="border-b pb-4 border-gray-200">
            <div
              className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              onClick={() =>
                setIsTimeAndPartyCollapsed(!isTimeAndPartyCollapsed)
              }
            >
              <h4 className="text-base font-semibold text-gray-800">
                預計用餐時間
              </h4>
              <FontAwesomeIcon
                icon={isTimeAndPartyCollapsed ? faChevronDown : faChevronUp}
                className="text-gray-500"
              />
            </div>
            {!isTimeAndPartyCollapsed && (
              <div className="mt-3 space-y-3">
                <div>
                  <label
                    htmlFor="reservationDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    用餐日期
                  </label>
                  <input
                    type="date"
                    id="reservationDate"
                    value={localFilters.reservationDate || ""}
                    onChange={(e) =>
                      handleFilterChange("reservationDate", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reservationTime"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    用餐時間
                  </label>
                  <input
                    type="time"
                    id="reservationTime"
                    value={localFilters.reservationTime || ""}
                    onChange={(e) =>
                      handleFilterChange("reservationTime", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="partySize"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    用餐人數
                  </label>
                  <input
                    type="number"
                    id="partySize"
                    value={localFilters.partySize || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "partySize",
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined
                      )
                    }
                    placeholder="人數"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
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
                  <div className="relative">
                    <select
                      id="province"
                      value={localFilters.province || ""}
                      onChange={(e) =>
                        handleFilterChange("province", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 appearance-none bg-white pr-8"
                    >
                      <option value="">所有省份</option>
                      {displayProvinces.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>
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
              <h4 className="text-base font-semibold text-gray-800">
                菜系類別
              </h4>
              <FontAwesomeIcon
                icon={isCategoryCollapsed ? faChevronDown : faChevronUp}
                className="text-gray-500"
              />
            </div>
            {!isCategoryCollapsed && (
              <div className="mt-3 space-y-2">
                {displayCuisineTypes.map((type) => (
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

          {/* 人均價錢篩選 (改為自訂範圍) */}
          <div className="border-b pb-4 border-gray-200">
            <div
              className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              onClick={() => setIsAvgSpendingCollapsed(!isAvgSpendingCollapsed)}
            >
              <h4 className="text-base font-semibold text-gray-800">
                人均價錢
              </h4>
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
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined
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
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined
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
              <h4 className="text-base font-semibold text-gray-800">
                最低評分
              </h4>
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
                {parsedSeatingCapacities.map((capacity) => (
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
              <h4 className="text-base font-semibold text-gray-800">
                營業狀態
              </h4>
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
              <h4 className="text-base font-semibold text-gray-800">
                訂座模式
              </h4>
              <FontAwesomeIcon
                icon={isReservationModesCollapsed ? faChevronDown : faChevronUp}
                className="text-gray-500"
              />
            </div>
            {!isReservationModesCollapsed && (
              <div className="mt-3 space-y-2">
                {displayReservationModes.map((mode) => (
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
              <h4 className="text-base font-semibold text-gray-800">
                付款方式
              </h4>
              <FontAwesomeIcon
                icon={isPaymentMethodsCollapsed ? faChevronDown : faChevronUp}
                className="text-gray-500"
              />
            </div>
            {!isPaymentMethodsCollapsed && (
              <div className="mt-3 space-y-2">
                {displayPaymentMethods.map((method) => (
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
            <div
              className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              onClick={() => setIsFacilitiesCollapsed(!isFacilitiesCollapsed)}
            >
              <h4 className="text-base font-semibold text-gray-800">
                設施/服務
              </h4>
              <FontAwesomeIcon
                icon={isFacilitiesCollapsed ? faChevronDown : faChevronUp}
                className="text-gray-500"
              />
            </div>
            {!isFacilitiesCollapsed && (
              <div className="mt-3 space-y-2">
                {displayFacilities.map((facility) => (
                  <div key={facility} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`facility-${facility}`}
                      checked={(localFilters.facilities || []).includes(
                        facility
                      )}
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
      </div>

      {/* 按鈕區域：使用絕對定位，將其固定在最底部 */}
      <div className="flex flex-col space-y-4 pt-6 mt-auto flex-shrink-0">
        <button
          onClick={handleApply}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          應用篩選
        </button>
        {isFiltersActive && (
          <button
            onClick={handleReset}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-xl shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
          >
            <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
            清除所有篩選
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterSidebar;
