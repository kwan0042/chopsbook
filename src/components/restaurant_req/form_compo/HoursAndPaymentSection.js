// src/components/restaurant_req/form_compo/HoursAndPaymentSection.js

import React, { useState } from "react";
import {
  reservationModeOptions,
  paymentMethodOptions,
  facilitiesServiceOptions,
} from "../../../data/restaurant-options";

const HoursAndPaymentSection = ({
  formData,
  handleChange, // <-- 這個函數會用於單次批量更新 businessHours
  handleCheckboxChange,
  errors,
  handleBusinessHoursChange, // <-- 這個函數只用於手動單日更改
  DAYS_OF_WEEK,
  TIME_OPTIONS,
  inputRefs,
}) => {
  // ✅ State 來管理 "每日相同時間" 的狀態
  const [sameTimeSettings, setSameTimeSettings] = useState({
    isChecked: false,
    startTime: "",
    endTime: "",
  });

  // ========== 事件處理器 (處理 UI 交互 - 負責所有同步邏輯) ==========

  const handleSameTimeChange = (name, value) => {
    
    // 1. 計算新的本地狀態設定
    const newSettings = {
      ...sameTimeSettings,
      [name]: value,
    };

    // 2. 更新 local state
    setSameTimeSettings(newSettings);


    // 3. 執行外部狀態更新

    const isChecking = name === "isChecked" && value === true;
    const isTimeChange = name === "startTime" || name === "endTime";

    if (isChecking || (newSettings.isChecked && isTimeChange)) {
      
  

      const syncStartTime = newSettings.startTime;
      const syncEndTime = newSettings.endTime;

      // 🚨 關鍵修正區域開始：將多次調用替換為單次批量更新

      // 1. 從 currentBusinessHours 複製一份作為新的狀態基礎
      // 必須基於最新的 formData.businessHours
      let newBusinessHours = Array.isArray(formData.businessHours)
        ? [...formData.businessHours]
        : [];

      // 2. 確保陣列有足夠的長度 (7 天) 並初始化缺失的數據
      while (newBusinessHours.length < DAYS_OF_WEEK.length) {
        newBusinessHours.push({
          day: DAYS_OF_WEEK[newBusinessHours.length],
          isOpen: false,
          startTime: "",
          endTime: "",
        });
      }

      // 3. 在本地循環中計算出所有 7 天的更新狀態
      newBusinessHours = newBusinessHours.map((item, index) => {
        // 強制設定 isOpen 為 true (如果正在同步)
        const updatedItem = { ...item, isOpen: true };
        

        // 強制同步時間 (即使是空字串也要同步，才能清除欄位)
        updatedItem.startTime = syncStartTime;
        updatedItem.endTime = syncEndTime;
       
        return updatedItem;
      });

      // 4. 只調用一次父組件的 handleChange，傳遞完整的 businessHours 陣列
      handleChange({
        target: { name: "businessHours", value: newBusinessHours },
      });

      // 🚨 關鍵修正區域結束

      
    }
  };

  // ✅ 包裝原有的 handleBusinessHoursChange，用於監聽任何手動更改並取消勾選「每日相同時間」
  const handleDayChangeAndUncheckSameTime = (index, name, value) => {
    // 1. 執行原本的業務邏輯來更新 formData
    handleBusinessHoursChange(index, name, value);
    

    // 2. 如果用戶手動更改了任意一天的狀態/時間，則取消勾選「每日相同時間」
    if (sameTimeSettings.isChecked) {
      setSameTimeSettings((prev) => ({
        ...prev,
        isChecked: false,
      }));
      
    }
  };

  return (
    <div>
      {/* 營業時間和定休日 (保持 2 欄) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* 營業時間 (每週) */}
        <div
          // ⚠️ 將 ref 綁定到整個容器，方便滾動定位
          className="h-full"
          ref={(el) => (inputRefs.current["businessHoursContainer"] = el)}
        >
          <label className="block text-gray-700 text-sm font-bold mb-2">
            營業時間 <span className="text-red-500">*</span>
            {/* 顯示頂層錯誤 (例如：至少標記一天營業時間) */}
            {typeof errors.businessHours === "string" && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.businessHours}
              </span>
            )}
          </label>

          {/* ✅ 每日相同時間 輸入格和 Checkbox */}
          <div className="mb-2 p-2 border border-blue-200 rounded-md bg-blue-50">
            <div className="flex items-center space-x-2 mb-1">
              <input
                type="checkbox"
                id="sameTimeCheckbox"
                checked={sameTimeSettings.isChecked}
                onChange={(e) =>
                  handleSameTimeChange("isChecked", e.target.checked)
                }
                className="form-checkbox h-5 w-5 text-blue-600 rounded"
              />
              <label
                htmlFor="sameTimeCheckbox"
                className="flex-shrink-0 text-blue-700 text-sm font-bold"
              >
                每日相同時間
              </label>
            </div>
            {/* 時間選擇器 */}
            <div className="flex items-center space-x-1 mt-1">
              <span className="text-gray-700">由</span>
              <select
                value={sameTimeSettings.startTime}
                onChange={(e) =>
                  handleSameTimeChange("startTime", e.target.value)
                }
                className="p-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="" disabled>
                  請選擇
                </option>
                {TIME_OPTIONS.map((time) => (
                  <option key={`same-start-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <span className="text-gray-700">到</span>
              <select
                value={sameTimeSettings.endTime}
                onChange={(e) =>
                  handleSameTimeChange("endTime", e.target.value)
                }
                className="p-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="" disabled>
                  請選擇
                </option>
                {TIME_OPTIONS.map((time) => (
                  <option key={`same-end-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            {DAYS_OF_WEEK.map((day, index) => {
              // 獲取當天的具體錯誤 (如果是陣列形式)
              const dayErrors = Array.isArray(errors.businessHours)
                ? errors.businessHours[index]
                : null;

              const hasTimeError =
                dayErrors && (dayErrors.startTime || dayErrors.endTime);

              return (
                <div
                  key={day}
                  className={`flex flex-row items-center space-x-2 h-8 ${
                    hasTimeError ? "p-1 border border-red-300 rounded-md" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`day-${day}`}
                      checked={formData.businessHours?.[index]?.isOpen || false}
                      onChange={(e) =>
                        // ❌ 使用新的包裝函數
                        handleDayChangeAndUncheckSameTime(
                          index,
                          "isOpen",
                          e.target.checked
                        )
                      }
                      className="form-checkbox h-5 w-5 text-blue-600 rounded"
                    />
                    <label
                      htmlFor={`day-${day}`}
                      className="flex-shrink-0 w-16 text-gray-700 text-sm"
                    >
                      {day}
                    </label>
                  </div>

                  {!formData.businessHours?.[index]?.isOpen ? (
                    <span className="text-gray-500 italic text-base">休息</span>
                  ) : (
                    <div className="flex items-center space-x-1 mt-1 sm:mt-0">
                      <span className="text-gray-700">由</span>
                      <select
                        value={formData.businessHours?.[index]?.startTime || ""}
                        onChange={(e) =>
                          // ❌ 使用新的包裝函數
                          handleDayChangeAndUncheckSameTime(
                            index,
                            "startTime",
                            e.target.value
                          )
                        }
                        className={`p-1 border rounded-md text-sm ${
                          dayErrors?.startTime
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">請選擇</option>
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-700">到</span>
                      <select
                        value={formData.businessHours?.[index]?.endTime || ""}
                        onChange={(e) =>
                          // ❌ 使用新的包裝函數
                          handleDayChangeAndUncheckSameTime(
                            index,
                            "endTime",
                            e.target.value
                          )
                        }
                        className={`p-1 border rounded-md text-sm ${
                          dayErrors?.endTime
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">請選擇</option>
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 顯示時間具體錯誤 */}
                  {hasTimeError && (
                    <p className="text-red-500 font-normal text-xs ml-2 mt-1">
                      {dayErrors.startTime || dayErrors.endTime}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 定休日 (特殊日期/節日) - 保持不變 */}
        <div className="h-full flex flex-col gap-3">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              定休日 (節日或特殊日期)
            </label>
            <textarea
              type="text"
              name="closedDates"
              value={formData.closedDates || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              placeholder="例如：元旦、聖誕節、每年農曆除夕"
            />
          </div>
          <div className="flex items-center space-x-2 h-8">
            <input
              type="checkbox"
              name="isHolidayOpen"
              checked={formData.isHolidayOpen || false}
              onChange={handleChange}
              className="form-checkbox h-5 w-5 text-blue-600 rounded"
            />
            <label
              htmlFor="isHolidayOpen"
              className="block text-gray-700 text-sm font-bold "
            >
              公眾假期營業
            </label>
          </div>
          {formData.isHolidayOpen && (
            <div>
              <label
                htmlFor="holidayHours"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                公眾假期營業時間說明
              </label>
              <textarea
                id="holidayHours"
                name="holidayHours"
                value={formData.holidayHours || ""}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                placeholder="例如：公眾假期由 12:00PM 營業至 10:00PM"
              />
            </div>
          )}
        </div>
      </div>

      {/* 訂座模式 - 保持不變 */}
      <div className="mt-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          訂座模式
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {reservationModeOptions.map((option) => (
            <label key={option} className="flex items-center text-gray-700">
              <input
                type="checkbox"
                name="reservationModes"
                value={option}
                checked={formData.reservationModes?.includes(option) || false}
                onChange={handleCheckboxChange}
                className="form-checkbox h-5 w-5 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 接受付款方式 - 保持不變 */}
      <div
        className="mt-4"
        ref={(el) => (inputRefs.current["paymentMethods"] = el)} // ✅ 綁定 ref
      >
        <label className="block text-gray-700 text-sm font-bold mb-2">
          接受付款方式 <span className="text-red-500">*</span>
          {errors.paymentMethods && (
            <span className="text-red-500 font-normal text-xs ml-2">
              {errors.paymentMethods}
            </span>
          )}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {paymentMethodOptions.map((option) => (
            <label key={option} className="flex items-center text-gray-700">
              <input
                type="checkbox"
                name="paymentMethods"
                value={option}
                checked={formData.paymentMethods?.includes(option) || false}
                onChange={handleCheckboxChange}
                className="form-checkbox h-5 w-5 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 設施/服務 - 保持不變 */}
      <div className="mt-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          設施/服務
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {facilitiesServiceOptions.map((option) => (
            <label key={option} className="flex items-center text-gray-700">
              <input
                type="checkbox"
                name="facilitiesServices"
                value={option}
                checked={formData.facilitiesServices?.includes(option) || false}
                onChange={handleCheckboxChange}
                className="form-checkbox h-5 w-5 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="otherInfo"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          其他資料
        </label>
        <textarea
          id="otherInfo"
          name="otherInfo"
          value={formData.otherInfo || ""}
          onChange={handleChange}
          rows="4"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="關於餐廳的任何其他重要資訊，例如特殊飲食需求、榮譽等。"
        ></textarea>
      </div>
    </div>
  );
};

export default HoursAndPaymentSection;
