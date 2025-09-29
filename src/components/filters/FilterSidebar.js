"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronUp,
  faChevronDown,
  faTimesCircle,
  faArrowLeft, // 新增用於 "Less" 按鈕的圖標
} from "@fortawesome/free-solid-svg-icons";

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

import { AuthContext } from "@/lib/auth-context";

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

// 輔助組件：篩選器群組
const FilterGroup = ({ title, isCollapsed, onToggle, children }) => {
  return (
    <div className="border-b pb-4 border-gray-200">
      <div
        className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        onClick={onToggle}
      >
        <h4 className="text-base font-semibold text-gray-800">{title}</h4>
        <FontAwesomeIcon
          icon={isCollapsed ? faChevronDown : faChevronUp}
          className="text-gray-500 transition-transform duration-200"
        />
      </div>
      {!isCollapsed && <div className="mt-3">{children}</div>}
    </div>
  );
};

const FilterSidebar = ({
  initialFilters = {},
  onApplyFilters,
  onResetFilters,
  onClose,
}) => {
  const initialFiltersRef = useRef(initialFilters);

  const [localFilters, setLocalFilters] = useState(initialFilters);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [showTopMask, setShowTopMask] = useState(false);
  const scrollContainerRef = useRef(null);

  // 菜系類別相關狀態
  const [expandedCuisineCategory, setExpandedCuisineCategory] = useState(null);

  // ⚡️ 新增狀態和引用來處理動態高度
  const [cuisineContainerHeight, setCuisineContainerHeight] = useState(0);
  const subTypeRef = useRef(null);
  const categoryRef = useRef(null);

  // 折疊狀態 (保持不變)
  const [isRegionCollapsed, setIsRegionCollapsed] = useState(true);
  const [isCuisineTypeCollapsed, setIsCuisineTypeCollapsed] = useState(true);
  const [isRestaurantTypeCollapsed, setIsRestaurantTypeCollapsed] =
    useState(true);
  const [isAvgSpendingCollapsed, setIsAvgSpendingCollapsed] = useState(true);
  const [isBusinessHoursCollapsed, setIsBusinessHoursCollapsed] =
    useState(true);
  const [isReservationModesCollapsed, setIsReservationModesCollapsed] =
    useState(true);
  const [isPaymentMethodsCollapsed, setIsPaymentMethodsCollapsed] =
    useState(true);
  const [isFacilitiesCollapsed, setIsFacilitiesCollapsed] = useState(true);
  const [isSeatingCapacityCollapsed, setIsSeatingCapacityCollapsed] =
    useState(true);
  const [isTimeAndPartyCollapsed, setIsTimeAndPartyCollapsed] = useState(true);

  // 地區/其他狀態 (保持不變)
  const [cities, setCities] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(
    !!initialFilters.favoriteRestaurantIds
  );
  const { currentUser } = useContext(AuthContext);
  const [avgSpending, setAvgSpending] = useState(
    initialFilters.maxAvgSpending || 0
  );

  // ⚡️ 新增 useEffect 來計算 SubType 容器的動態高度
  useEffect(() => {
    if (expandedCuisineCategory && subTypeRef.current) {
      // SubType 展開時，使用 SubType 的內容高度
      // + 4px for padding, + 1px for border-bottom
      const height = subTypeRef.current.offsetHeight + 10;
      setCuisineContainerHeight(height);
    } else if (categoryRef.current) {
      // SubType 收起時，使用 Category 列表的實際高度
      setCuisineContainerHeight(categoryRef.current.offsetHeight);
    }
    // 每次高度變化後重新運行 scroll 處理程序
    handleScroll();
  }, [
    expandedCuisineCategory,
    localFilters.cuisineType,
    categoryRef.current?.offsetHeight,
  ]);

  // 其他 useEffects (保持不變)
  useEffect(() => {
    if (
      JSON.stringify(initialFiltersRef.current) !==
      JSON.stringify(initialFilters)
    ) {
      setLocalFilters(initialFilters);
      setAvgSpending(initialFilters.maxAvgSpending || 0);
      setShowFavoritesOnly(!!initialFilters.favoriteRestaurantIds);
      initialFiltersRef.current = initialFilters;
    }
  }, [initialFilters]);

  useEffect(() => {
    if (localFilters.province) {
      const citiesForProvince = citiesByProvince[localFilters.province] || [];
      setCities(citiesForProvince);
    } else {
      setCities([]);
    }
  }, [localFilters.province]);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 5;
      setIsScrolledToBottom(atBottom);
      setShowTopMask(scrollTop > 10);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      handleScroll();
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // 處理篩選器變更的函數 (保持不變)
  const handleFilterChange = useCallback((key, value) => {
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
  }, []);

  const handleCuisineSelectChange = useCallback(
    (key, value, isCategory = false) => {
      setLocalFilters((prevFilters) => {
        const currentValues = prevFilters.cuisineType || [];
        let newValues = [...currentValues];

        if (isCategory) {
          const subTypes = cuisineOptions[value] || [];
          const allSelected = subTypes.every((sub) =>
            currentValues.includes(sub)
          );

          if (allSelected) {
            newValues = newValues.filter((v) => !subTypes.includes(v));
          } else {
            subTypes.forEach((sub) => {
              if (!newValues.includes(sub)) {
                newValues.push(sub);
              }
            });
          }
        } else {
          if (currentValues.includes(value)) {
            newValues = newValues.filter((item) => item !== value);
          } else {
            newValues.push(value);
          }
        }

        return {
          ...prevFilters,
          cuisineType: newValues,
        };
      });
    },
    []
  );

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

  const isCategoryFullySelected = useCallback(
    (category) => {
      const selectedCuisines = localFilters.cuisineType || [];
      const subTypes = cuisineOptions[category] || [];
      if (subTypes.length === 0) return false;
      return subTypes.every((sub) => selectedCuisines.includes(sub));
    },
    [localFilters.cuisineType]
  );

  const isCategoryPartiallySelected = useCallback(
    (category) => {
      const selectedCuisines = localFilters.cuisineType || [];
      const subTypes = cuisineOptions[category] || [];
      if (subTypes.length === 0) return false;
      const selectedCount = subTypes.filter((sub) =>
        selectedCuisines.includes(sub)
      ).length;
      return selectedCount > 0 && selectedCount < subTypes.length;
    },
    [localFilters.cuisineType]
  );

  const handleApply = useCallback(async () => {
    const newFilters = {
      ...localFilters,
    };
    if (avgSpending > 0) {
      newFilters.maxAvgSpending = avgSpending;
    } else {
      delete newFilters.maxAvgSpending;
    }

    if (showFavoritesOnly && currentUser && currentUser.favoriteRestaurants) {
      newFilters.favoriteRestaurantIds = currentUser.favoriteRestaurants;
    }

    Object.keys(newFilters).forEach((key) => {
      const value = newFilters[key];
      if (
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0) ||
        (key === "province" && value === "") ||
        (key === "city" && value === "") ||
        (key === "restaurantType" && value === "")
      ) {
        delete newFilters[key];
      }
    });

    onApplyFilters(newFilters);
    if (onClose) onClose();
  }, [
    localFilters,
    avgSpending,
    showFavoritesOnly,
    currentUser,
    onApplyFilters,
    onClose,
  ]);

  const handleReset = useCallback(() => {
    setLocalFilters({});
    setShowFavoritesOnly(false);
    setAvgSpending(0);
    setExpandedCuisineCategory(null);
    onResetFilters();
    if (onClose) onClose();
  }, [onResetFilters, onClose]);

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

  const hasFiltersApplied = () => {
    return (
      Object.keys(localFilters).length > 0 ||
      showFavoritesOnly ||
      avgSpending > 0
    );
  };
  const isFiltersActive = hasFiltersApplied();

  return (
    <div className="relative bg-white p-6  rounded-2xl w-full flex flex-col h-full">
      <h3 className="text-xl font-bold text-gray-900 mb-6">篩選餐廳</h3>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close filters"
        >
          <FontAwesomeIcon icon={faTimesCircle} size="lg" />
        </button>
      )}
      <div
        className={`absolute inset-x-0 h-[50px] pointer-events-none bg-gradient-to-b from-white to-white/0 z-10 transition-opacity duration-300 ${
          showTopMask ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: "70px" }}
      ></div>
      <div
        ref={scrollContainerRef}
        className="flex-grow h-full overflow-y-auto pr-2 -mr-2 scrollbar-hide"
      >
        <div className="space-y-4">
          <FilterGroup
            title="預計用餐詳情"
            isCollapsed={isTimeAndPartyCollapsed}
            onToggle={() =>
              setIsTimeAndPartyCollapsed(!isTimeAndPartyCollapsed)
            }
          >
            <div className="space-y-3">
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

          <FilterGroup
            title="地區"
            isCollapsed={isRegionCollapsed}
            onToggle={() => setIsRegionCollapsed(!isRegionCollapsed)}
          >
            <div className="space-y-3">
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
                    <option value="">選擇省份</option>
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

              {(localFilters.province || cities.length > 0) && (
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    城市
                  </label>
                  <div className="relative">
                    <select
                      id="city"
                      value={localFilters.city || ""}
                      onChange={(e) =>
                        handleFilterChange("city", e.target.value)
                      }
                      className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 appearance-none bg-white pr-8 ${
                        !localFilters.province || cities.length === 0
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={!localFilters.province || cities.length === 0}
                    >
                      <option value="">選擇城市</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </FilterGroup>

          <FilterGroup
            title="菜系類別"
            isCollapsed={isCuisineTypeCollapsed}
            onToggle={() => setIsCuisineTypeCollapsed(!isCuisineTypeCollapsed)}
          >
            {/* ⚡️ 核心修正區塊：使用動態高度和 50% 覆蓋 */}
            <div
              className="relative transition-all duration-300 ease-in-out overflow-hidden"
              // 應用動態計算的高度
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
                {Object.keys(cuisineOptions).map((category) => {
                  const subTypes = cuisineOptions[category];
                  const hasSubTypes = subTypes.length > 1;
                  const isSelected = isCategoryFullySelected(category);
                  const isPartial = isCategoryPartiallySelected(category);

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
                            handleCuisineSelectChange(
                              "cuisineType",
                              category,
                              true
                            )
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
                className={`absolute top-0 right-0 w-1/2 h-fit bg-white transition-transform duration-300 ease-in-out z-20 shadow-lg border-l border-gray-200 ${
                  expandedCuisineCategory
                    ? "translate-x-0" // 滑入到 0% 覆蓋右半邊
                    : "translate-x-full" // 初始或返回時位於右側 (不可見)
                }`}
                style={{
                  // 確保 Category 列表顯示 50%，Sub 列表覆蓋剩下的 50%
                  width: "50%",
                  transform: expandedCuisineCategory
                    ? "translateX(0)"
                    : "translateX(100%)",
                }}
              >
                {expandedCuisineCategory && (
                  <>
                    <div className="flex items-center justify-start pb-3 border-b border-gray-100 mb-2 px-2">
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
                    <div className="space-y-2 px-2 pb-2">
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
                                  handleCuisineSelectChange(
                                    "cuisineType",
                                    subType,
                                    false
                                  )
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

          <FilterGroup
            title="餐廳類型"
            isCollapsed={isRestaurantTypeCollapsed}
            onToggle={() =>
              setIsRestaurantTypeCollapsed(!isRestaurantTypeCollapsed)
            }
          >
            <SelectDropdownFilter
              placeholder="請選擇餐廳類型" 
              options={displayRestaurantTypes}
              selectedValue={localFilters.restaurantType}
              onSelect={(value) => handleFilterChange("restaurantType", value)}
            />
          </FilterGroup>

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
              <div className="relative h-6">
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={avgSpending}
                  onChange={(e) => setAvgSpending(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                拖曳滑動條以選擇人均消費。
              </p>
            </div>
          </FilterGroup>

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
                { label: "不限", value: "any" },
                ...parsedSeatingCapacities,
              ]}
              selectedValue={
                localFilters.minSeatingCapacity
                  ? `${localFilters.minSeatingCapacity}-${localFilters.maxSeatingCapacity}`
                  : "any"
              }
              onSelect={(value) => {
                if (value === "any") {
                  handleFilterChange("minSeatingCapacity", "");
                  handleFilterChange("maxSeatingCapacity", "");
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
      </div>
      <div
        className={`absolute inset-x-0 h-24 pointer-events-none z-20 `}
        style={{
          background:
            "linear-gradient(to top, #ffffff, rgba(255, 255, 255, 0))",
          bottom: isFiltersActive ? "160px" : "100px",
        }}
      ></div>
      <div className="mt-auto bg-transparent">
        <div className="flex flex-col space-y-4 pt-6 pb-6 px-6">
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
    </div>
  );
};

export default FilterSidebar;
