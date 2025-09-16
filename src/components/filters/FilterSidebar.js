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
} from "@fortawesome/free-solid-svg-icons";

import {
  cuisineOptions,
  reservationModeOptions,
  paymentMethodOptions,
  facilitiesServiceOptions,
  provinceOptions,
  seatingCapacityOptions,
} from "../../data/restaurant-options";

import {
  CheckboxesFilter,
  RadioGroupFilter,
  DateTimeFilter,
} from "./FilterComponents";

// 引入 AuthContext 以獲取使用者資料
import { AuthContext } from "@/lib/auth-context";

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
  const [localFilters, setLocalFilters] = useState(initialFilters);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [showTopMask, setShowTopMask] = useState(false);
  const scrollContainerRef = useRef(null);

  const [isRegionCollapsed, setIsRegionCollapsed] = useState(true);
  const [isCategoryCollapsed, setIsCategoryCollapsed] = useState(true);
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

  // 新增狀態來處理收藏餐廳篩選
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { currentUser } = useContext(AuthContext);

  // 移除導致無限迴圈的 useEffect 鉤子。
  // 現在，當 key 屬性改變時，useState 會自動使用新的 initialFilters 值進行初始化。

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

  const handleApply = useCallback(async () => {
    const newFilters = { ...localFilters };
    if (showFavoritesOnly && currentUser && currentUser.favoriteRestaurants) {
      newFilters.favoriteRestaurantIds = currentUser.favoriteRestaurants;
    }
    onApplyFilters(newFilters);
    if (onClose) onClose();
  }, [localFilters, showFavoritesOnly, currentUser, onApplyFilters, onClose]);

  const handleReset = useCallback(() => {
    setLocalFilters({});
    setShowFavoritesOnly(false);
    onResetFilters();
    if (onClose) onClose();
  }, [onResetFilters, onClose]);

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

  const hasFiltersApplied = () => {
    const defaultFilters = {};
    return (
      JSON.stringify(localFilters) !== JSON.stringify(defaultFilters) ||
      showFavoritesOnly
    );
  };
  const isFiltersActive = hasFiltersApplied();

  return (
    <div className="relative bg-white p-6 shadow-lg rounded-2xl w-full flex flex-col h-full">
      <h3 className="text-xl font-bold text-gray-900 mb-6">篩選餐廳</h3>
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
          </FilterGroup>

          <FilterGroup
            title="菜系類別"
            isCollapsed={isCategoryCollapsed}
            onToggle={() => setIsCategoryCollapsed(!isCategoryCollapsed)}
          >
            <CheckboxesFilter
              title="cuisine"
              options={displayCuisineTypes}
              selected={localFilters.category || []}
              onToggle={(value) =>
                handleMultiSelectFilterChange("category", value)
              }
            />
          </FilterGroup>

          <FilterGroup
            title="人均價錢"
            isCollapsed={isAvgSpendingCollapsed}
            onToggle={() => setIsAvgSpendingCollapsed(!isAvgSpendingCollapsed)}
          >
            <div className="space-y-2">
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
