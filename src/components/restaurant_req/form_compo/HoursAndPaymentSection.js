import React from "react";
import {
  reservationModeOptions,
  paymentMethodOptions,
  facilitiesServiceOptions,
} from "../../../data/restaurant-options";

const HoursAndPaymentSection = ({
  formData,
  handleChange,
  handleCheckboxChange,
  errors,
  handleBusinessHoursChange,
  DAYS_OF_WEEK,
  TIME_OPTIONS,
  inputRefs, // ✅ 新增傳入
}) => {
  return (
    <div>
      {/* 僅在小螢幕上顯示標題 */}
      <h3 className="text-2xl font-bold text-gray-800 mb-4 lg:hidden">
        營業、服務與付款
      </h3>

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
                  className={`flex flex-col sm:flex-row sm:items-center space-x-2 h-auto sm:h-8 ${
                    hasTimeError ? "p-1 border border-red-300 rounded-md" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`day-${day}`}
                      checked={formData.businessHours?.[index]?.isOpen || false}
                      onChange={(e) =>
                        handleBusinessHoursChange(
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
                          handleBusinessHoursChange(
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
                          handleBusinessHoursChange(
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
