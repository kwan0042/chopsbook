"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/lib/auth-context";
import {
  cuisineOptions,
  reservationModeOptions,
  paymentMethodOptions,
  facilitiesServiceOptions,
  provinceOptions,
  citiesByProvince,
  seatingCapacityOptions,
} from "../../data/restaurant-options";
import {
  CheckboxesFilter,
  RadioGroupFilter,
  DateTimeFilter,
} from "./FilterComponents";

const parseSeatingCapacityOptions = (options) => {
  return options
    .filter((option) => option !== "選擇座位數")
    .map((option) => {
      if (option.includes("-")) {
        const [minStr, maxStr] = option.split("-");
        return {
          label: `${option}人`,
          value: `${minStr}-${maxStr}`,
          min: parseInt(minStr, 10),
          max: parseInt(maxStr, 10),
        };
      } else if (option.includes("+")) {
        const minStr = option.replace("+", "");
        return {
          label: `${minStr}+ 人`,
          value: `${minStr}+`,
          min: parseInt(minStr, 10),
          max: 9999,
        };
      }
      return null;
    })
    .filter(Boolean);
};

const FilterModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  onResetFilters,
  initialFilters = {},
}) => {
  const { currentUser } = useContext(AuthContext);

  const [localFilters, setLocalFilters] = useState({});
  const [avgSpending, setAvgSpending] = useState(0);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // 核心修正：每次模態框打開時，用 initialFilters 初始化本地狀態
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(initialFilters);
      setAvgSpending(initialFilters.maxAvgSpending || 0);
      setShowFavoritesOnly(!!initialFilters.favoriteRestaurantIds);
    }
  }, [isOpen]);

  const cities = localFilters.province
    ? citiesByProvince[localFilters.province] || []
    : [];

  const handleFilterChange = (key, value) => {
    setLocalFilters((prevFilters) => {
      if (key === "province") {
        return {
          ...prevFilters,
          [key]: value,
          city: "",
        };
      }
      return {
        ...prevFilters,
        [key]: value,
      };
    });
  };

  const handleMultiSelectFilterChange = (key, value) => {
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
  };

  const handleApply = () => {
    const newFilters = { ...localFilters };

    if (avgSpending > 0) {
      newFilters.maxAvgSpending = avgSpending;
    } else {
      delete newFilters.maxAvgSpending;
    }

    if (showFavoritesOnly && currentUser && currentUser.favoriteRestaurants) {
      newFilters.favoriteRestaurantIds = currentUser.favoriteRestaurants;
    } else {
      delete newFilters.favoriteRestaurantIds;
    }

    // 關鍵修正：在傳遞篩選條件前，移除所有值為空或未定義的屬性
    Object.keys(newFilters).forEach((key) => {
      const value = newFilters[key];
      if (
        value === "" ||
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete newFilters[key];
      }
    });

    onApplyFilters(newFilters);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    onClose();
  };

  if (!isOpen) return null;

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

  const businessHoursOptions = [
    { label: "營業中", value: "營業中" },
    { label: "休假中 (含暫時休業)", value: "休假中" },
    { label: "不限", value: "" },
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-4xl relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
          aria-label="關閉篩選器"
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          篩選餐廳
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 預計用餐詳情 */}
          <div className="space-y-4 p-4 border rounded-xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              預計用餐詳情
            </h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showFavoritesOnly"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="showFavoritesOnly"
                className="ml-2 text-sm text-gray-700"
              >
                只顯示我的收藏餐廳
              </label>
            </div>
            <DateTimeFilter
              localFilters={localFilters}
              handleFilterChange={handleFilterChange}
            />
          </div>

          {/* 地區篩選 */}
          <div className="space-y-4 p-4 border rounded-xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">地區</h3>
            <div>
              <label
                htmlFor="province"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                省份
              </label>
              <select
                id="province"
                value={localFilters.province || ""}
                onChange={(e) => handleFilterChange("province", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">所有省份</option>
                {displayProvinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
            {localFilters.province && (
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  城市
                </label>
                <select
                  id="city"
                  value={localFilters.city || ""}
                  onChange={(e) => handleFilterChange("city", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">所有城市</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 菜系類別 */}
          <div className="space-y-4 p-4 border rounded-xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              菜系類別
            </h3>
            <CheckboxesFilter
              title="cuisine"
              options={displayCuisineTypes}
              selected={localFilters.category || []}
              onToggle={(value) =>
                handleMultiSelectFilterChange("category", value)
              }
            />
          </div>

          {/* 人均價錢 */}
          <div className="space-y-4 p-4 border rounded-xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              人均價錢
            </h3>
            <div className="flex justify-between items-center text-sm font-medium text-gray-700">
              <span>人均消費</span>
              <span>
                {avgSpending === 0
                  ? "不限"
                  : avgSpending === 200
                  ? "$200+"
                  : `<$${avgSpending}`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={avgSpending}
              onChange={(e) => setAvgSpending(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-2">
              拖曳滑動條以選擇人均消費。
            </p>
          </div>

          {/* 座位數 */}
          <div className="space-y-4 p-4 border rounded-xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">座位數</h3>
            <RadioGroupFilter
              title="seatingCapacity"
              options={[
                ...parsedSeatingCapacities,
                { label: "不限", value: "any" },
              ]}
              selectedValue={
                localFilters.minSeatingCapacity
                  ? `${localFilters.minSeatingCapacity}-${localFilters.maxSeatingCapacity}`
                  : "any"
              }
              onSelect={(value) => {
                if (value === "any") {
                  handleFilterChange("minSeatingCapacity", undefined);
                  handleFilterChange("maxSeatingCapacity", undefined);
                } else {
                  const selectedOption = parsedSeatingCapacities.find(
                    (opt) => opt.value === value
                  );
                  if (selectedOption) {
                    handleFilterChange(
                      "minSeatingCapacity",
                      selectedOption.min
                    );
                    handleFilterChange(
                      "maxSeatingCapacity",
                      selectedOption.max
                    );
                  }
                }
              }}
              valueKey="value"
              labelKey="label"
            />
          </div>

          {/* 營業狀態 */}
          <div className="space-y-4 p-4 border rounded-xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              營業狀態
            </h3>
            <RadioGroupFilter
              title="businessHours"
              options={businessHoursOptions}
              selectedValue={localFilters.businessHours || ""}
              onSelect={(value) => handleFilterChange("businessHours", value)}
              valueKey="value"
              labelKey="label"
            />
          </div>

          {/* 訂座模式 */}
          <div className="space-y-4 p-4 border rounded-xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              訂座模式
            </h3>
            <CheckboxesFilter
              title="reservation"
              options={displayReservationModes}
              selected={localFilters.reservationModes || []}
              onToggle={(value) =>
                handleMultiSelectFilterChange("reservationModes", value)
              }
            />
          </div>

          {/* 付款方式 */}
          <div className="space-y-4 p-4 border rounded-xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              付款方式
            </h3>
            <CheckboxesFilter
              title="payment"
              options={displayPaymentMethods}
              selected={localFilters.paymentMethods || []}
              onToggle={(value) =>
                handleMultiSelectFilterChange("paymentMethods", value)
              }
            />
          </div>

          {/* 設施/服務 */}
          <div className="space-y-4 p-4 border rounded-xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              設施/服務
            </h3>
            <CheckboxesFilter
              title="facility"
              options={displayFacilities}
              selected={localFilters.facilities || []}
              onToggle={(value) =>
                handleMultiSelectFilterChange("facilities", value)
              }
            />
          </div>
        </div>

        <div className="flex justify-between mt-8 space-x-4">
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            重置
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            應用篩選
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
