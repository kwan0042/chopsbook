"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faClock,
  faChevronDown,
  faArrowRight // 引入用於下拉選單的圖標
} from "@fortawesome/free-solid-svg-icons";

// 處理多選框的元件，例如菜系、設施等
const CheckboxesFilter = ({ title, options, selected, onToggle }) => (
  <div className="space-y-2">
    {options.map((option) => (
      <div key={option} className="flex items-center">
        <input
          type="checkbox"
          id={`${title}-${option}`}
          checked={selected.includes(option)}
          onChange={() => onToggle(option)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label
          htmlFor={`${title}-${option}`}
          className="ml-2 text-sm text-gray-700"
        >
          {option}
        </label>
      </div>
    ))}
  </div>
);

// 處理單選框的元件，例如座位數、營業狀態
const RadioGroupFilter = ({
  title,
  options,
  selectedValue,
  onSelect,
  valueKey = "value",
  labelKey = "label",
}) => (
  <div className="mt-3 space-y-2">
    {options.map((option) => (
      <div key={option[valueKey]} className="flex items-center">
        <input
          type="radio"
          id={`${title}-${option[valueKey]}`}
          name={title}
          checked={selectedValue === option[valueKey]}
          onChange={() => onSelect(option[valueKey])}
          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
        />
        <label
          htmlFor={`${title}-${option[valueKey]}`}
          className="ml-2 text-sm text-gray-700"
        >
          {option[labelKey]}
        </label>
      </div>
    ))}
  </div>
);

// ⚡️ 新增：處理單選下拉列表的元件 (例如餐廳類型)
const SelectDropdownFilter = ({
  title, // 用於 HTML id 和 label
  placeholder,
  options, // 字符串陣列
  selectedValue,
  onSelect,
}) => {
  const effectiveValue = selectedValue || "";
  return (
    <div>
      <label
        htmlFor={title}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {title}
      </label>
      <div className="relative">
        <select
          id={title}
          value={effectiveValue} // 預設使用第一個選項作為初始/清除狀態
          onChange={(e) => onSelect(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 appearance-none bg-white pr-8"
        >
          <option value="" disabled hidden>
            {placeholder || "請選擇..."}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <FontAwesomeIcon
          icon={faChevronDown}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
      </div>
    </div>
  );
};

// 整合日期和時間選擇器的元件
const DateTimeFilter = ({ localFilters, handleFilterChange }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const datePickerRef = useRef(null);
  const timePickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowDatePicker(false);
      }
      if (
        timePickerRef.current &&
        !timePickerRef.current.contains(event.target)
      ) {
        setShowTimePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = `${year}-${(month + 1).toString().padStart(2, "0")}-${i
        .toString()
        .padStart(2, "0")}`;
      const isSelected = localFilters.reservationDate === date;
      days.push(
        <button
          key={date}
          onClick={() => {
            handleFilterChange("reservationDate", date);
            setShowDatePicker(false);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200
            ${isSelected ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-lg p-4 mt-2">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1))}
            className="text-gray-600 hover:text-blue-600"
          >
            &lt;
          </button>
          <div className="font-bold text-gray-800">
            {currentMonth.toLocaleString("zh-TW", {
              month: "long",
              year: "numeric",
            })}
          </div>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1))}
            className="text-gray-600 hover:text-blue-600"
          >
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-2">
          <span>日</span>
          <span>一</span>
          <span>二</span>
          <span>三</span>
          <span>四</span>
          <span>五</span>
          <span>六</span>
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  const renderTimePicker = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")}`;
        const isSelected = localFilters.reservationTime === time;
        times.push(
          <button
            key={time}
            onClick={() => {
              handleFilterChange("reservationTime", time);
              setShowTimePicker(false);
            }}
            className={`p-2 rounded-lg text-sm font-semibold transition-colors duration-200
              ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
          >
            {time}
          </button>
        );
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-lg p-4 mt-2">
        <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
          {times}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <label
          htmlFor="reservationDate"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          用餐日期
        </label>
        <div
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-blue-500"
        >
          <span className="text-gray-700">
            {localFilters.reservationDate || "請選擇日期"}
          </span>
          <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
        </div>
        {showDatePicker && (
          <div ref={datePickerRef} className="absolute z-30 w-full left-0 mt-1">
            {renderCalendar()}
          </div>
        )}
      </div>
      <div className="relative">
        <label
          htmlFor="reservationTime"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          用餐時間
        </label>
        <div
          onClick={() => setShowTimePicker(!showTimePicker)}
          className="w-full p-2 border border-gray-300 rounded-lg bg-white flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-blue-500"
        >
          <span className="text-gray-700">
            {localFilters.reservationTime || "請選擇時間"}
          </span>
          <FontAwesomeIcon icon={faClock} className="text-gray-400" />
        </div>
        {showTimePicker && (
          <div ref={timePickerRef} className="absolute z-30 w-full left-0 mt-1">
            {renderTimePicker()}
          </div>
        )}
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
              e.target.value ? parseInt(e.target.value, 10) : undefined
            )
          }
          placeholder="人數"
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  );
};

export {
  CheckboxesFilter,
  RadioGroupFilter,
  DateTimeFilter,
  SelectDropdownFilter,
};
