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
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";

// 導入新的扁平化菜系選項
import {
  categoryOptions, // 這是頂層 category 陣列
  subcategoryOptions, // 這是細分 subCategory 陣列
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
import FilterGroup from "./FilterGroup";

// 輔助函數：解析座位數選項 (保持不變)
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
        // 修正：確保處理 '51+人' 的情況
        const minStr = option.replace("+", "").replace("人", "");
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

// 輔助函數：確保值為陣列 (用於修正 onApplyFilters 參數格式) (保持不變)
const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(
      (item) => item !== "" && item !== null && item !== undefined
    );
  }
  if (value !== "" && value !== null && value !== undefined) {
    return [value];
  }
  return [];
};

const FilterModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  onResetFilters = () => {},
  initialFilters = {},
}) => {
  const { currentUser } = useContext(AuthContext);

  const [localFilters, setLocalFilters] = useState({});
  const [avgSpending, setAvgSpending] = useState(0);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [isTimeAndPartyCollapsed, setIsTimeAndPartyCollapsed] = useState(true);
  const [isRegionCollapsed, setIsRegionCollapsed] = useState(true);
  // ⚡️ 修正：將菜系篩選合併到一個折疊狀態
  const [isCuisineCollapsed, setIsCuisineCollapsed] = useState(true);
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

  // ⚡️ 移除：不再需要獨立的 isCategoryCollapsed 和 isSubCategoryCollapsed
  // const [isCategoryCollapsed, setIsCategoryCollapsed] = useState(true);
  // const [isSubCategoryCollapsed, setIsSubCategoryCollapsed] = useState(true);

  const initialFiltersJsonRef = useRef(JSON.stringify(initialFilters));

  // 載入初始篩選條件 (保持不變)
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

  const cities = localFilters.province
    ? citiesByProvince[localFilters.province] || []
    : [];

  const handleFilterChange = useCallback(
    (key, value) => {
      setLocalFilters((prevFilters) => {
        // 省份和城市處理邏輯 (保持不變)
        if (key === "province") {
          const isProvinceDefault =
            value === provinceOptions[0] || value === "";
          if (isProvinceDefault) {
            const { province, city, ...rest } = prevFilters;
            return rest; // 清空省份和城市
          }
          return {
            ...prevFilters,
            [key]: value,
            city: "", // 重置城市
          };
        }
        if (key === "city") {
          const isCityDefault = value === cities[0] || value === "";
          if (isCityDefault) {
            const { city, ...rest } = prevFilters;
            return { ...rest, province: prevFilters.province };
          }
        }

        // 處理單選下拉列表和單選按鈕的清空邏輯
        // 包含 restaurantType, businessHours, category, subCategory
        const isDefaultSelect =
          (key === "restaurantType" ||
            key === "category" ||
            key === "subCategory" ||
            key === "businessHours") &&
          value === "";

        if (
          value === "" ||
          value === null ||
          value === undefined ||
          isDefaultSelect
        ) {
          const { [key]: _, ...rest } = prevFilters;
          return rest;
        }

        return {
          ...prevFilters,
          [key]: value,
        };
      });
    },
    [cities]
  );

  // 處理多選篩選器的通用函數 (用於 reservationModes, paymentMethods, facilities...) (保持不變)
  const handleMultiSelectFilterChange = useCallback((key, value) => {
    setLocalFilters((prevFilters) => {
      const currentValues = prevFilters[key] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      // 如果結果為空，則刪除該屬性
      if (newValues.length === 0) {
        const { [key]: _, ...rest } = prevFilters;
        return rest;
      }

      return {
        ...prevFilters,
        [key]: newValues,
      };
    });
  }, []);

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

    // ⚡️ 核心修正：只對 Reservation Modes, Payment Methods, Facilities 進行陣列化處理
    const multiSelectKeys = [
      "reservationModes",
      "paymentMethods",
      "facilities",
    ];

    multiSelectKeys.forEach((key) => {
      const arr = ensureArray(newFilters[key]);
      if (arr.length > 0) {
        newFilters[key] = arr;
      } else {
        delete newFilters[key];
      }
    });

    // 移除所有值為空或未定義的屬性
    Object.keys(newFilters).forEach((key) => {
      const value = newFilters[key];

      // 檢查是否為預設的下拉列表值 (category, subCategory, restaurantType 預設值為 "")
      const isDefaultSelect =
        (key === "restaurantType" ||
          key === "category" ||
          key === "subCategory" ||
          key === "businessHours") &&
        value === "";

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
        isDefaultSelect ||
        isProvinceDefault ||
        isCityDefault
      ) {
        delete newFilters[key];
      }
    });

    // 傳遞 newFilters
    onApplyFilters(newFilters);
    onClose();
  };

  const handleReset = () => {
    // 還原本地狀態至初始空值
    setLocalFilters({});
    setAvgSpending(0);
    setShowFavoritesOnly(false);
    initialFiltersJsonRef.current = JSON.stringify({});

    if (typeof onResetFilters === "function") {
      onResetFilters();
    }
  };

  if (!isOpen) return null;

  const displayRestaurantTypes = restaurantTypeOptions;
  const displayReservationModes = reservationModeOptions;
  const displayPaymentMethods = paymentMethodOptions;
  const displayFacilities = facilitiesServiceOptions;
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 h-[100vh]">
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

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
          {/* 預計用餐詳情 (保持不變) */}
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

          {/* 地區篩選 (保持不變) */}
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
              {localFilters.province && cities.length > 0 && (
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

          {/* 餐廳類型 - 單選下拉列表 (保持不變) */}
          <FilterGroup
            title="餐廳類型"
            isCollapsed={isRestaurantTypeCollapsed}
            onToggle={() =>
              setIsRestaurantTypeCollapsed(!isRestaurantTypeCollapsed)
            }
          >
            <SelectDropdownFilter
              title="餐廳類型"
              placeholder="請選擇餐廳類型"
              options={displayRestaurantTypes}
              selectedValue={localFilters.restaurantType}
              onSelect={(value) => handleFilterChange("restaurantType", value)}
            />
          </FilterGroup>

          {/* -------------------- ⚡️ 菜系類別 (主菜系/細分特色) - 合併為單一滑動面板 -------------------- */}
          <FilterGroup
            title="菜系類別"
            isCollapsed={isCuisineCollapsed}
            onToggle={() => setIsCuisineCollapsed(!isCuisineCollapsed)}
          >
            <div className="space-y-4">
              {/* 主菜系 (Category) */}
              <SelectDropdownFilter
                title="category"
                placeholder="請選擇主菜系"
                options={categoryOptions}
                selectedValue={localFilters.category}
                onSelect={(value) => handleFilterChange("category", value)}
              />
              {/* 細分菜系/特色餐飲 (SubCategory) */}
              <SelectDropdownFilter
                title="subCategory"
                placeholder="請選擇細分菜系"
                options={subcategoryOptions}
                selectedValue={localFilters.subCategory}
                onSelect={(value) => handleFilterChange("subCategory", value)}
              />
            </div>
          </FilterGroup>
          {/* ---------------------------------------------------------------------- */}

          {/* 人均價錢 (保持不變) */}
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

          {/* 座位數 (保持不變) */}
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
                  // 解析 value 的格式 (e.g., "1-20" 或 "51+")
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

          {/* 營業狀態 (保持不變) */}
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

          {/* 訂座模式 (保持不變) */}
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

          {/* 付款方式 (保持不變) */}
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

          {/* 設施/服務 (保持不變) */}
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
