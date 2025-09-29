"use client";

import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import { AuthContext } from "@/lib/auth-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"; // 導入返回圖標
import {
  cuisineOptions, // 假設這是 {Category: [SubTypes], ...} 結構
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
// 導入 FilterGroup 組件
import FilterGroup from "./FilterGroup";

// 輔助函數：解析座位數選項
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

// ⚡️ 輔助函數：檢查某個 Category 是否完全被選中 (用於菜系類別)
const isCategoryFullySelected = (category, selectedCuisines) => {
  const subTypes = cuisineOptions[category] || [];
  if (subTypes.length === 0) return false;
  return subTypes.every((sub) => selectedCuisines.includes(sub));
};

// ⚡️ 輔助函數：檢查某個 Category 是否部分被選中 (用於菜系類別)
const isCategoryPartiallySelected = (category, selectedCuisines) => {
  const subTypes = cuisineOptions[category] || [];
  if (subTypes.length === 0) return false;
  const selectedCount = subTypes.filter((sub) =>
    selectedCuisines.includes(sub)
  ).length;
  return selectedCount > 0 && selectedCount < subTypes.length;
};

// ⚡️ 輔助函數：確保值為陣列 (用於修正 onApplyFilters 參數格式)
const ensureArray = (value) => {
  if (Array.isArray(value)) {
    // 如果已經是陣列，則過濾掉空字串或 null/undefined，並返回
    return value.filter(
      (item) => item !== "" && item !== null && item !== undefined
    );
  }
  if (value !== "" && value !== null && value !== undefined) {
    // 如果是單一非空值，將其包裝成陣列
    return [value];
  }
  // 其他情況返回空陣列
  return [];
};

const FilterModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  // 💡 修正 1: onResetFilters 設為可選 (提供一個空函數作為預設值)
  onResetFilters = () => {},
  initialFilters = {},
}) => {
  const { currentUser } = useContext(AuthContext);

  const [localFilters, setLocalFilters] = useState({});
  const [avgSpending, setAvgSpending] = useState(0);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // ⚡️ 菜系類別相關狀態
  const [expandedCuisineCategory, setExpandedCuisineCategory] = useState(null);
  const [cuisineContainerHeight, setCuisineContainerHeight] = useState(0);
  const subTypeRef = useRef(null);
  const categoryRef = useRef(null);

  // ⚡️ 狀態: 控制每個 FilterGroup 的收合狀態
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

  // 避免無限更新的 useEffect (加載初始篩選條件)
  useEffect(() => {
    const currentFiltersJson = JSON.stringify(initialFilters);

    if (isOpen && currentFiltersJson !== initialFiltersJsonRef.current) {
      setLocalFilters(initialFilters || {});
      setAvgSpending(initialFilters.maxAvgSpending || 0);
      setShowFavoritesOnly(!!initialFilters.favoriteRestaurantIds);

      initialFiltersJsonRef.current = currentFiltersJson;
    } else if (
      isOpen &&
      localFilters &&
      Object.keys(localFilters).length === 0 &&
      Object.keys(initialFilters).length > 0
    ) {
      setLocalFilters(initialFilters || {});
      setAvgSpending(initialFilters.maxAvgSpending || 0);
      setShowFavoritesOnly(!!initialFilters.favoriteRestaurantIds);
    }
  }, [isOpen, initialFilters]);

  // ⚡️ 菜系類別：計算 SubType 容器的動態高度並應用於父容器
  useEffect(() => {
    if (isCuisineTypeCollapsed) {
      setCuisineContainerHeight(0);
      setExpandedCuisineCategory(null); // 收合時關閉 SubType
      return;
    }

    const timeoutId = setTimeout(() => {
      // 如果 SubType 展開，則獲取 SubType 容器的實際高度
      if (expandedCuisineCategory && subTypeRef.current) {
        setCuisineContainerHeight(subTypeRef.current.offsetHeight);
      }
      // 否則，獲取 Category 容器的實際高度
      else if (categoryRef.current) {
        setCuisineContainerHeight(categoryRef.current.offsetHeight);
      }
    }, 50);

    return () => clearTimeout(timeoutId);
    // 依賴項包含 localFilters.cuisineType，因為選中狀態可能改變高度
  }, [
    isCuisineTypeCollapsed,
    expandedCuisineCategory,
    localFilters.cuisineType,
  ]);

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

      // 餐廳類型選項是 {label, value} 物件陣列
      const isRestaurantTypeDefault = key === "restaurantType" && value === "";

      // 省份選項是字串陣列
      const isProvinceDefault =
        key === "province" && value === provinceOptions[0];

      // 城市選項是字串陣列
      const isCityDefault =
        key === "city" &&
        localFilters.province &&
        value === citiesByProvince[localFilters.province]?.[0];

      if (
        isDropdownKey &&
        (isRestaurantTypeDefault || isProvinceDefault || isCityDefault)
      ) {
        const { [key]: _, ...rest } = prevFilters;
        return rest;
      }

      // 處理省份選項清空
      if (
        key === "province" &&
        (value === provinceOptions[0] || value === "")
      ) {
        const { province, city, ...rest } = prevFilters;
        return rest;
      }
      // 處理城市選項清空
      if (key === "city" && (value === cities[0] || value === "")) {
        const { city, ...rest } = prevFilters;
        return { ...rest, province: prevFilters.province };
      }

      return {
        ...prevFilters,
        [key]: value,
      };
    });
  };

  // ⚡️ 專門處理菜系類別的聯動多選 (Category/SubType)
  const handleCuisineSelectChange = useCallback((value, isCategory = false) => {
    setLocalFilters((prevFilters) => {
      const currentValues = prevFilters.cuisineType || [];
      let newValues = [...currentValues];

      if (isCategory) {
        // 1. 如果選擇的是 Category
        const subTypes = cuisineOptions[value] || [];
        const allSelected = isCategoryFullySelected(value, currentValues);

        if (allSelected) {
          // 取消該 Category 下所有 SubType 的選擇
          newValues = newValues.filter((v) => !subTypes.includes(v));
        } else {
          // 新增該 Category 下所有 SubType 的選擇
          subTypes.forEach((sub) => {
            if (!newValues.includes(sub)) {
              newValues.push(sub);
            }
          });
        }
      } else {
        // 2. 如果選擇的是 SubType
        if (currentValues.includes(value)) {
          // 取消選擇
          newValues = newValues.filter((item) => item !== value);
        } else {
          // 選擇
          newValues.push(value);
        }
      }

      // 確保陣列是唯一的
      const uniqueNewValues = Array.from(new Set(newValues));

      return {
        ...prevFilters,
        cuisineType: uniqueNewValues.length > 0 ? uniqueNewValues : undefined,
      };
    });
  }, []);

  // 處理非菜系類別的多選 (例如 Reservation Modes)
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
    let newFilters = { ...localFilters };

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

    // ⚡️ 核心修正：確保多選篩選器的值是陣列
    const multiSelectKeys = [
      "cuisineType",
      "reservationModes",
      "paymentMethods",
      "facilities",
    ];

    multiSelectKeys.forEach((key) => {
      newFilters[key] = ensureArray(newFilters[key]);
    });

    // 移除所有值為空或未定義的屬性（包含下拉列表的初始值和空陣列）
    Object.keys(newFilters).forEach((key) => {
      const value = newFilters[key];

      // 檢查是否為預設的下拉列表值 (餐廳類型預設值為 "")
      const isRestaurantTypeDefault = key === "restaurantType" && value === "";

      // 處理地區下拉選單的預設值（字串陣列的第一個元素）
      const isProvinceDefault =
        key === "province" && value === provinceOptions[0];
      const isCityDefault =
        key === "city" &&
        localFilters.province &&
        value === citiesByProvince[localFilters.province]?.[0];

      if (
        value === "" ||
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0) ||
        isRestaurantTypeDefault ||
        isProvinceDefault ||
        isCityDefault
      ) {
        delete newFilters[key];
      }
    });

    onApplyFilters(newFilters);
    onClose();
  };

  const handleReset = () => {
    // 💡 修正 2: 還原本地狀態至初始空值 (即清空輸入格)
    setLocalFilters({});
    setAvgSpending(0);
    setShowFavoritesOnly(false);
    setExpandedCuisineCategory(null); // 確保菜系展開狀態也被清除

    // 💡 修正 3: 安全地呼叫 onResetFilters (現在它可能不存在，但沒關係)
    // 如果父組件傳遞了 onResetFilters，則執行，否則忽略
    if (typeof onResetFilters === "function") {
      onResetFilters();
    }

    // 💡 修正 4: 移除 onClose()，實現 "不要關閉" 的要求
    // onClose(); // 移除這行
  };

  if (!isOpen) return null;

  // 菜系類別的原始選項
  const allCuisineCategories = Object.keys(cuisineOptions);

  // ... (其他 display 變量保持不變)
  const displayRestaurantTypes = restaurantTypeOptions;
  const displayReservationModes = reservationModeOptions;
  const displayPaymentMethods = paymentMethodOptions;
  const displayFacilities = facilitiesServiceOptions;

  // 省份選項已包含 "選擇省份" 作為第一個元素，不需要再過濾
  const displayProvinces = provinceOptions;

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
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
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
                  value={localFilters.province || displayProvinces[0]}
                  onChange={(e) =>
                    handleFilterChange("province", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
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
              placeholder="請選擇餐廳類型" // ⚡️ 傳遞 placeholder 文本
              options={displayRestaurantTypes} // 原始選項，不含 placeholder
              selectedValue={localFilters.restaurantType}
              onSelect={(value) => handleFilterChange("restaurantType", value)}
            />
          </FilterGroup>

          {/* ⚡️ 菜系類別 - 覆蓋結構修正 */}
          <FilterGroup
            title="菜系類別"
            isCollapsed={isCuisineTypeCollapsed}
            onToggle={() => setIsCuisineTypeCollapsed(!isCuisineTypeCollapsed)}
          >
            {/* 核心修正區塊：使用動態高度和 50% 覆蓋 */}
            <div
              className="relative transition-all duration-300 ease-in-out overflow-hidden"
              style={{
                height: cuisineContainerHeight
                  ? `${cuisineContainerHeight}px`
                  : "auto",
              }}
            >
              {/* -------------------- 1. Category 列表 (底層) -------------------- */}
              <div
                ref={categoryRef}
                className={`space-y-2 text-sm transition-opacity duration-300 w-full`}
              >
                {allCuisineCategories.map((category) => {
                  const subTypes = cuisineOptions[category];
                  const hasSubTypes = subTypes && subTypes.length > 1; // 檢查是否有子類別
                  const selectedCuisines = localFilters.cuisineType || [];
                  const isSelected = isCategoryFullySelected(
                    category,
                    selectedCuisines
                  );
                  const isPartial = isCategoryPartiallySelected(
                    category,
                    selectedCuisines
                  );

                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex items-center flex-grow">
                        <input
                          type="checkbox"
                          id={`cuisine-category-${category}`}
                          checked={isSelected}
                          // 禁用邏輯：當 SubType 列表展開時，禁用所有 Category Checkbox
                          disabled={!!expandedCuisineCategory}
                          onChange={() =>
                            handleCuisineSelectChange(category, true)
                          }
                          className={`h-4 w-4 rounded focus:ring-blue-500 
                            ${
                              isPartial
                                ? "indeterminate text-blue-500 bg-blue-100 border-blue-500"
                                : "text-blue-600 border-gray-300"
                            }
                            ${
                              !!expandedCuisineCategory
                                ? "cursor-not-allowed opacity-60"
                                : ""
                            }
                          `}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = isPartial;
                            }
                          }}
                        />
                        <label
                          htmlFor={`cuisine-category-${category}`}
                          className={`ml-2 text-gray-700 cursor-pointer ${
                            !!expandedCuisineCategory ? "opacity-60" : ""
                          }`}
                        >
                          {category}
                          {isPartial && " (部分選擇)"}
                        </label>
                      </div>

                      {/* 更多按鈕 */}
                      {hasSubTypes && (
                        <button
                          onClick={() => setExpandedCuisineCategory(category)}
                          className="text-blue-500 hover:text-blue-700 text-xs py-1 px-2 rounded transition-colors duration-150"
                          disabled={!!expandedCuisineCategory} // 展開時禁用其他按鈕
                        >
                          更多
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* -------------------- 2. SubType 列表 (覆蓋層) -------------------- */}
              <div
                ref={subTypeRef}
                className={`absolute top-0 right-0 w-1/2 h-fit bg-white transition-transform duration-300 ease-in-out z-20 shadow-lg border-l border-gray-200 p-2`}
                style={{
                  width: "50%",
                  transform: expandedCuisineCategory
                    ? "translateX(0)"
                    : "translateX(100%)",
                }}
              >
                {expandedCuisineCategory && (
                  <>
                    <div className="flex items-center justify-start pb-3 border-b border-gray-100 mb-2">
                      <button
                        onClick={() => setExpandedCuisineCategory(null)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors duration-150 flex items-center"
                      >
                        <FontAwesomeIcon
                          icon={faArrowLeft}
                          className="mr-2 text-xs"
                        />
                        {expandedCuisineCategory}
                      </button>
                    </div>
                    {/* 移除高度限制和滾動條，讓其 h-fit */}
                    <div className="space-y-2 pb-2">
                      {(cuisineOptions[expandedCuisineCategory] || []).map(
                        (subType) => {
                          const isSelected = (
                            localFilters.cuisineType || []
                          ).includes(subType);
                          return (
                            <div key={subType} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`cuisine-subType-${subType}`}
                                checked={isSelected}
                                onChange={() =>
                                  handleCuisineSelectChange(subType, false)
                                }
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`cuisine-subType-${subType}`}
                                className="ml-2 text-gray-700 cursor-pointer"
                              >
                                {subType}
                              </label>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* 菜系類別層級選擇邏輯結束 */}
          </FilterGroup>
          {/* 菜系類別 結束 */}

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
