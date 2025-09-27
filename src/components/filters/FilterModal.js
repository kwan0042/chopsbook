"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "@/lib/auth-context";
import {
  cuisineOptions,
  restaurantTypeOptions,
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
  SelectDropdownFilter,
} from "./FilterComponents";
// ⚡️ 導入 FilterGroup 組件 (假設路徑)
import FilterGroup from "./FilterGroup";

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

  // ⚡️ 狀態: 控制每個 FilterGroup 的收合狀態 (預設為 true = 收合)
  const [isTimeAndPartyCollapsed, setIsTimeAndPartyCollapsed] = useState(true);
  const [isRegionCollapsed, setIsRegionCollapsed] = useState(true);
  const [isCuisineTypeCollapsed, setIsCuisineTypeCollapsed] = useState(true);
  const [isRestaurantTypeCollapsed, setIsRestaurantTypeCollapsed] =
    useState(true);
  const [isAvgSpendingCollapsed, setIsAvgSpendingCollapsed] = useState(true);
  const [isSeatingCapacityCollapsed, setIsSeatingCapacityCollapsed] =
    useState(true);
  const [isBusinessHoursCollapsed, setIsBusinessHoursCollapsed] =
    useState(true);
  const [isReservationModesCollapsed, setIsReservationModesCollapsed] =
    useState(true);
  const [isPaymentMethodsCollapsed, setIsPaymentMethodsCollapsed] =
    useState(true);
  const [isFacilitiesCollapsed, setIsFacilitiesCollapsed] = useState(true);

  // 核心修正：使用 useRef 儲存上次的 initialFilters 內容的 JSON 字串
  const initialFiltersJsonRef = useRef(JSON.stringify(initialFilters));

  // 避免無限更新的 useEffect
  useEffect(() => {
    // 檢查 initialFilters 的 JSON 內容是否與上次不同
    const currentFiltersJson = JSON.stringify(initialFilters);

    if (isOpen && currentFiltersJson !== initialFiltersJsonRef.current) {
      setLocalFilters(initialFilters || {});
      setAvgSpending(initialFilters.maxAvgSpending || 0);
      setShowFavoritesOnly(!!initialFilters.favoriteRestaurantIds);

      // 更新引用，確保下次渲染時不會再次觸發
      initialFiltersJsonRef.current = currentFiltersJson;
    }
    // 此外，如果 modal 只是打開/關閉，但 initialFilters 沒變，也執行設定
    else if (
      isOpen &&
      localFilters &&
      Object.keys(localFilters).length === 0 &&
      Object.keys(initialFilters).length > 0
    ) {
      // 這是為了確保在首次打開時，即使引用沒變（但 localFilters 還是初始的 {}），也能正確加載
      setLocalFilters(initialFilters || {});
      setAvgSpending(initialFilters.maxAvgSpending || 0);
      setShowFavoritesOnly(!!initialFilters.favoriteRestaurantIds);
    }
  }, [isOpen, initialFilters]); // 保持 initialFilters 在依賴項中，但由內部邏輯控制更新

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

      // 處理單選下拉列表的清空邏輯
      const isDropdownKey = ["restaurantType", "province", "city"].includes(
        key
      );
      const isDefaultValue =
        (key === "restaurantType" && value === restaurantTypeOptions[0]) ||
        (key === "province" && value === provinceOptions[0]) ||
        (key === "city" &&
          value ===
            citiesByProvince[prevFilters.province || provinceOptions[0]]?.[0]);

      if (isDropdownKey && isDefaultValue) {
        const { [key]: _, ...rest } = prevFilters;
        return rest;
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

    // 移除所有值為空或未定義的屬性（包含下拉列表的初始值）
    Object.keys(newFilters).forEach((key) => {
      const value = newFilters[key];

      const isDefaultDropdownValue =
        (key === "restaurantType" && value === restaurantTypeOptions[0]) ||
        (key === "province" && value === provinceOptions[0]) ||
        (key === "city" &&
          localFilters.province &&
          value === citiesByProvince[localFilters.province]?.[0]);

      if (
        value === "" ||
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0) ||
        isDefaultDropdownValue
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
  // 餐廳類型，保留完整列表供下拉選單使用
  const displayRestaurantTypes = restaurantTypeOptions;

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

        {/* 使用 flex 容器和 w-full 確保在小螢幕上可以堆疊 */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
          {/* 預計用餐詳情 */}
          <FilterGroup
            title="預計用餐詳情"
            isCollapsed={isTimeAndPartyCollapsed}
            onToggle={() =>
              setIsTimeAndPartyCollapsed(!isTimeAndPartyCollapsed)
            }
          >
            <div className="space-y-4">
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
          </FilterGroup>

          {/* 地區篩選 */}
          <FilterGroup
            title="地區"
            isCollapsed={isRegionCollapsed}
            onToggle={() => setIsRegionCollapsed(!isRegionCollapsed)}
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="province"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  省份
                </label>
                <select
                  id="province"
                  value={localFilters.province || provinceOptions[0]}
                  onChange={(e) =>
                    handleFilterChange("province", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {provinceOptions.map((province) => (
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
                    value={localFilters.city || cities[0]}
                    onChange={(e) => handleFilterChange("city", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </FilterGroup>

          {/* 餐廳類型 - 單選下拉列表 */}
          <FilterGroup
            title="餐廳類型"
            isCollapsed={isRestaurantTypeCollapsed}
            onToggle={() =>
              setIsRestaurantTypeCollapsed(!isRestaurantTypeCollapsed)
            }
          >
            <SelectDropdownFilter
              options={displayRestaurantTypes}
              selectedValue={localFilters.restaurantType}
              onSelect={(value) => handleFilterChange("restaurantType", value)}
            />
          </FilterGroup>

          {/* 菜系類別 */}
          <FilterGroup
            title="菜系類別"
            isCollapsed={isCuisineTypeCollapsed}
            onToggle={() => setIsCuisineTypeCollapsed(!isCuisineTypeCollapsed)}
          >
            <CheckboxesFilter
              title="cuisine"
              options={displayCuisineTypes}
              selected={localFilters.cuisineType || []}
              onToggle={(value) =>
                handleMultiSelectFilterChange("cuisineType", value)
              }
            />
          </FilterGroup>

          {/* 人均價錢 */}
          <FilterGroup
            title="人均價錢"
            isCollapsed={isAvgSpendingCollapsed}
            onToggle={() => setIsAvgSpendingCollapsed(!isAvgSpendingCollapsed)}
          >
            <div className="space-y-4">
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
          </FilterGroup>

          {/* 座位數 */}
          <FilterGroup
            title="座位數"
            isCollapsed={isSeatingCapacityCollapsed}
            onToggle={() =>
              setIsSeatingCapacityCollapsed(!isSeatingCapacityCollapsed)
            }
          >
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
          </FilterGroup>

          {/* 營業狀態 */}
          <FilterGroup
            title="營業狀態"
            isCollapsed={isBusinessHoursCollapsed}
            onToggle={() =>
              setIsBusinessHoursCollapsed(!isBusinessHoursCollapsed)
            }
          >
            <RadioGroupFilter
              title="businessHours"
              options={businessHoursOptions}
              selectedValue={localFilters.businessHours || ""}
              onSelect={(value) => handleFilterChange("businessHours", value)}
              valueKey="value"
              labelKey="label"
            />
          </FilterGroup>

          {/* 訂座模式 */}
          <FilterGroup
            title="訂座模式"
            isCollapsed={isReservationModesCollapsed}
            onToggle={() =>
              setIsReservationModesCollapsed(!isReservationModesCollapsed)
            }
          >
            <CheckboxesFilter
              title="reservation"
              options={displayReservationModes}
              selected={localFilters.reservationModes || []}
              onToggle={(value) =>
                handleMultiSelectFilterChange("reservationModes", value)
              }
            />
          </FilterGroup>

          {/* 付款方式 */}
          <FilterGroup
            title="付款方式"
            isCollapsed={isPaymentMethodsCollapsed}
            onToggle={() =>
              setIsPaymentMethodsCollapsed(!isPaymentMethodsCollapsed)
            }
          >
            <CheckboxesFilter
              title="payment"
              options={displayPaymentMethods}
              selected={localFilters.paymentMethods || []}
              onToggle={(value) =>
                handleMultiSelectFilterChange("paymentMethods", value)
              }
            />
          </FilterGroup>

          {/* 設施/服務 */}
          <FilterGroup
            title="設施/服務"
            isCollapsed={isFacilitiesCollapsed}
            onToggle={() => setIsFacilitiesCollapsed(!isFacilitiesCollapsed)}
          >
            <CheckboxesFilter
              title="facility"
              options={displayFacilities}
              selected={localFilters.facilities || []}
              onToggle={(value) =>
                handleMultiSelectFilterChange("facilities", value)
              }
            />
          </FilterGroup>
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
