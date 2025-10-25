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
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

import {
  categoryOptions,
  SUB_CATEGORY_MAP,
  restaurantTypeOptions,
  reservationModeOptions,
  paymentMethodOptions,
  facilitiesServiceOptions,
  provinceOptions,
  citiesByProvince,
  seatingCapacityOptions, // ⚡️ 重新引入 seatingCapacityOptions
} from "../../data/restaurant-options"; // 假設路徑正確

import {
  CheckboxesFilter,
  RadioGroupFilter,
  DateTimeFilter,
  SelectDropdownFilter,
} from "./FilterComponents";

import { AuthContext } from "@/lib/auth-context"; // 假設路徑正確

// ⚡️ 重新引入修正後的輔助函數：解析座位數選項
const parseSeatingCapacityOptions = (options) => {
  return options
    .filter((option) => option !== "選擇座位數")
    .map((option) => {
      // 不再解析 min/max，直接使用字串作為 value
      // 處理 51+ 格式，確保 value 是 "51+"
      const value = option.includes("+")
        ? `${option.replace("人", "")}`
        : option.replace("人", "");

      return {
        label: option, // 保持 label 為完整字串 (e.g., "51+人")
        value: value,
      };
    })
    .filter(Boolean);
};

// 輔助組件：篩選器群組 (保持不變)
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
  // ⚡️ 重新引入 seatingCapacity 的初始化
  const [localFilters, setLocalFilters] = useState({
    ...initialFilters,
    seatingCapacity:
      initialFilters.seatingCapacity ||
      initialFilters.minSeatingCapacity || // 舊欄位向下兼容
      "",
  });

  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [showTopMask, setShowTopMask] = useState(false);
  const scrollContainerRef = useRef(null);

  const [showCityError, setShowCityError] = useState(false);

  const [expandedCategory, setExpandedCategory] = useState(null);
  const [cuisineContainerHeight, setCuisineContainerHeight] = useState(0);
  const subCategoryRef = useRef(null);
  const categoryRef = useRef(null);

  const [isRegionCollapsed, setIsRegionCollapsed] = useState(true);
  const [isCuisineCollapsed, setIsCuisineCollapsed] = useState(true);
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
  // ⚡️ 重新引入 isSeatingCapacityCollapsed 狀態
  const [isSeatingCapacityCollapsed, setIsSeatingCapacityCollapsed] =
    useState(true);
  const [isTimeAndPartyCollapsed, setIsTimeAndPartyCollapsed] = useState(true);

  const [cities, setCities] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(
    !!initialFilters.favoriteRestaurantIds
  );
  const { currentUser } = useContext(AuthContext);
  const [avgSpending, setAvgSpending] = useState(
    initialFilters.maxAvgSpending || 0
  );

  // -------------------- handleScroll (保持不變) --------------------

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
    if (expandedCategory && subCategoryRef.current) {
      const height = subCategoryRef.current.offsetHeight + 10;
      setCuisineContainerHeight(height);
    } else if (categoryRef.current) {
      setCuisineContainerHeight(categoryRef.current.offsetHeight);
    }
    handleScroll();
  }, [
    expandedCategory,
    localFilters.category,
    localFilters.subCategory,
    categoryRef.current?.offsetHeight,
    handleScroll,
  ]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      handleScroll();
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // -------------------- 狀態同步 useEffect (已修正) --------------------
  useEffect(() => {
    // ⚡️ 同步時，將 min/max 的舊欄位轉換為新的 seatingCapacity 欄位
    const newSeatingCapacity =
      initialFilters.seatingCapacity || initialFilters.minSeatingCapacity || "";

    const newLocalFilters = {
      ...initialFilters,
      seatingCapacity: newSeatingCapacity,
    };

  

    // 僅當實際值發生變化時才更新狀態，避免無限循環
    if (
      JSON.stringify(localFilters) !== JSON.stringify(newLocalFilters) ||
      avgSpending !== (initialFilters.maxAvgSpending || 0) ||
      showFavoritesOnly !== !!initialFilters.favoriteRestaurantIds
    ) {
      setLocalFilters(newLocalFilters);
      setAvgSpending(initialFilters.maxAvgSpending || 0);
      setShowFavoritesOnly(!!initialFilters.favoriteRestaurantIds);
    }
  }, [initialFilters]); // 依賴於外部傳入的篩選條件

  useEffect(() => {
    setShowCityError(false);

    if (localFilters.province) {
      const citiesForProvince = citiesByProvince[localFilters.province] || [];
      setCities(citiesForProvince);
    } else {
      setCities([]);
    }
  }, [localFilters.province]);

  // -------------------- 篩選器處理函數 (保持不變) --------------------

  const handleFilterChange = useCallback((key, value) => {
    setLocalFilters((prevFilters) => {
      if (key === "province") {
        setShowCityError(false);
        return {
          ...prevFilters,
          [key]: value,
          city: "",
        };
      }
      if (key === "city") {
        setShowCityError(false);
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
        const currentCategoryValues = prevFilters.category || [];
        const currentSubCategoryValues = prevFilters.subCategory || [];
        let newCategoryValues = [...currentCategoryValues];
        let newSubCategoryValues = [...currentSubCategoryValues];

        if (isCategory) {
          const subTypes = SUB_CATEGORY_MAP[value] || [];
          const isSelected = newCategoryValues.includes(value);

          if (isSelected) {
            newCategoryValues = newCategoryValues.filter((v) => v !== value);
            newSubCategoryValues = newSubCategoryValues.filter(
              (v) => !subTypes.includes(v)
            );
          } else {
            newCategoryValues.push(value);
          }
        } else {
          if (currentSubCategoryValues.includes(value)) {
            newSubCategoryValues = newSubCategoryValues.filter(
              (item) => item !== value
            );
          } else {
            newSubCategoryValues.push(value);
          }
        }

        const nextFilters = { ...prevFilters };

        if (newCategoryValues.length > 0) {
          nextFilters.category = newCategoryValues;
        } else {
          delete nextFilters.category;
        }

        if (newSubCategoryValues.length > 0) {
          nextFilters.subCategory = newSubCategoryValues;
        } else {
          delete nextFilters.subCategory;
        }

        delete nextFilters.cuisineType;

        return nextFilters;
      });
    },
    []
  );

  const isCategorySelected = useCallback(
    (category) => (localFilters.category || []).includes(category),
    [localFilters.category]
  );

  const isSubCategoryPartiallySelected = useCallback(
    (category) => {
      const selectedSubCuisines = localFilters.subCategory || [];
      const subTypes = SUB_CATEGORY_MAP[category] || [];
      if (subTypes.length === 0) return false;
      const selectedCount = subTypes.filter((sub) =>
        selectedSubCuisines.includes(sub)
      ).length;
      const isCategoryActive = isCategorySelected(category);
      return selectedCount > 0 && !isCategoryActive;
    },
    [localFilters.subCategory, isCategorySelected]
  );

  const handleMultiSelectFilterChange = useCallback((key, value) => {
    setLocalFilters((prevFilters) => {
      const currentValues = prevFilters[key] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

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

  // -------------------- ⚡️ 修正後的 handleApply --------------------
  const handleApply = useCallback(async () => {
    if (
      localFilters.province &&
      !localFilters.city &&
      (citiesByProvince[localFilters.province] || []).length > 0
    ) {
      setShowCityError(true);
      return;
    }

    setShowCityError(false);
    const newFilters = { ...localFilters };

    delete newFilters.cuisineType;

    // ⚡️ 刪除舊的座位數欄位，只保留新的 seatingCapacity
    delete newFilters.minSeatingCapacity;
    delete newFilters.maxSeatingCapacity;
    delete newFilters.partySize;

    if (
      newFilters.category &&
      Array.isArray(newFilters.category) &&
      newFilters.category.length === 0
    ) {
      delete newFilters.category;
    }

    if (
      newFilters.subCategory &&
      Array.isArray(newFilters.subCategory) &&
      newFilters.subCategory.length === 0
    ) {
      delete newFilters.subCategory;
    }

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

    // 清理空值 (這段邏輯是正確的，用來刪除空值或空陣列)
    Object.keys(newFilters).forEach((key) => {
      const value = newFilters[key];
      const isValueEmpty =
        value === null || value === undefined || value === "";
      const isArrayEmpty = Array.isArray(value) && value.length === 0;

      const isDefaultEmpty =
        (key === "province" && value === "") ||
        (key === "city" && value === "") ||
        (key === "restaurantType" && value === "") ||
        // ⚡️ 確保 seatingCapacity 為空字串時被移除
        (key === "seatingCapacity" && value === "");

      if (isValueEmpty || isDefaultEmpty || isArrayEmpty) {
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
    setExpandedCategory(null);
    setShowCityError(false);
    onResetFilters();
    if (onClose) onClose();
  }, [onResetFilters, onClose]);

  const displayRestaurantTypes = restaurantTypeOptions;
  const displayReservationModes = reservationModeOptions;
  const displayPaymentMethods = paymentMethodOptions;
  const displayFacilities = facilitiesServiceOptions;
  const displayProvinces = provinceOptions;

  // ⚡️ 使用修正後的解析函數，只獲取 value 字串
  const parsedSeatingCapacities = parseSeatingCapacityOptions(
    seatingCapacityOptions
  );

  const businessHoursOptions = [
    { label: "營業中", value: "營業中" },
    { label: "休假中 (含暫時休業)", value: "休假中" },
    { label: "不限", value: "" },
  ];

  const hasFiltersApplied = () => {
    const filterKeys = Object.keys(localFilters).filter(
      // ⚡️ 檢查 seatingCapacity 欄位
      (key) => key !== "seatingCapacity"
    );
    // 檢查是否有其他篩選器
    const hasOtherFilters = filterKeys.length > 0;
    // 檢查 seatingCapacity 是否被選取 (非空字串)
    const isSeatingCapacitySelected = !!localFilters.seatingCapacity;

    return (
      hasOtherFilters ||
      isSeatingCapacitySelected ||
      showFavoritesOnly ||
      avgSpending > 0
    );
  };
  const isFiltersActive = hasFiltersApplied();

  return (
    <div className="relative bg-white p-6 rounded-2xl w-full flex flex-col h-full">
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
        <div className="space-y-4 mb-8">
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
                    onChange={(e) => handleFilterChange("city", e.target.value)}
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
            </div>
          </FilterGroup>

          {/* -------------------- 菜系類別 (主菜系 + 細分菜系 滑動面板) -------------------- */}
          <FilterGroup
            title="菜系類別"
            isCollapsed={isCuisineCollapsed}
            onToggle={() => setIsCuisineCollapsed(!isCuisineCollapsed)}
          >
            <div
              className="relative transition-all duration-300 ease-in-out overflow-hidden"
              style={{
                height: cuisineContainerHeight
                  ? `${cuisineContainerHeight}px`
                  : "auto",
              }}
            >
              <div
                ref={categoryRef}
                className={`space-y-2 text-sm transition-opacity duration-300 w-full`}
              >
                {categoryOptions.map((category) => {
                  const subTypes = SUB_CATEGORY_MAP[category];
                  const hasSubTypes = subTypes && subTypes.length > 0;
                  const isSelected = isCategorySelected(category);
                  const isPartial = isSubCategoryPartiallySelected(category);

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
                          disabled={!!expandedCategory}
                          onChange={() =>
                            handleCuisineSelectChange(
                              "category",
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
${!!expandedCategory ? "cursor-not-allowed opacity-60" : ""}
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
                            !!expandedCategory ? "opacity-60" : ""
                          }`}
                        >
                          {category}
                          {isPartial && " (含細分選中)"}
                        </label>
                      </div>

                      {hasSubTypes && (
                        <button
                          onClick={() => setExpandedCategory(category)}
                          className="text-blue-500 hover:text-blue-700 text-xs py-1 px-2 rounded transition-colors duration-150"
                          disabled={!!expandedCategory}
                        >
                          更多
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                ref={subCategoryRef}
                className={`absolute top-0 right-0 h-fit bg-white transition-transform duration-300 ease-in-out z-20 shadow-lg border-l border-gray-200`}
                style={{
                  width: "50%",
                  transform: expandedCategory
                    ? "translateX(0)"
                    : "translateX(100%)",
                }}
              >
                {expandedCategory && (
                  <>
                    <div className="flex items-center justify-start pb-3 border-b border-gray-100 mb-2 px-2">
                      <button
                        onClick={() => setExpandedCategory(null)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors duration-150 flex items-center"
                      >
                        <FontAwesomeIcon
                          icon={faArrowLeft}
                          className="mr-2 text-xs"
                        />
                        {expandedCategory}
                      </button>
                    </div>
                    <div className="space-y-2 px-2 pb-2">
                      {(SUB_CATEGORY_MAP[expandedCategory] || []).map(
                        (subType) => {
                          const isSelected = (
                            localFilters.subCategory || []
                          ).includes(subType);
                          return (
                            <div key={subType} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`cuisine-subType-${subType}`}
                                checked={isSelected}
                                onChange={() =>
                                  handleCuisineSelectChange(
                                    "subCategory",
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

          {/* -------------------- ⚡️ 重新加入 座位數篩選器 -------------------- */}
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
                { label: "不限", value: "" }, // ⚡️ 設為空字串，方便清除和篩選
                ...parsedSeatingCapacities,
              ]}
              // ⚡️ selectedValue 直接使用 localFilters.seatingCapacity
              selectedValue={localFilters.seatingCapacity || ""}
              onSelect={(value) => {
                // ⚡️ 直接將字串值儲存到 seatingCapacity
                handleFilterChange("seatingCapacity", value);
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
          bottom: "72px",
        }}
      ></div>
      <div className="mt-auto bg-transparent">
        {showCityError && (
          <p className="text-red-600 text-sm font-semibold text-center mb-4 px-6">
            請在選擇省份後，務必選擇城市以進行地區篩選。
          </p>
        )}
        <div className="flex items-center space-x-4 pt-6 px-6">
          <button
            onClick={handleApply}
            className="w-full bg-cbbg hover:bg-gray-600 hover:text-cbbg text-gray-600 font-bold py-3 px-4 rounded-xl shadow-md transition duration-200 "
          >
            應用篩選
          </button>
          {isFiltersActive && (
            <button
              onClick={handleReset}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-xl shadow-md transition duration-200 "
            >
              <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
              清除
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
