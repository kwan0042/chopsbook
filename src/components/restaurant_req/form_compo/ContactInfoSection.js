import React from "react";

const ContactInfoSection = ({ formData, handleChange, errors, inputRefs }) => {
  return (
    <div>
      {/* 僅在小螢幕上顯示標題 */}
      <h3 className="text-2xl font-bold text-gray-800 mb-4 lg:hidden">
        聯絡人資訊
      </h3>

      <div className="mb-4">
        <label className="flex items-center text-gray-700 text-sm font-bold">
          <input
            type="checkbox"
            name="isManager"
            checked={formData.isManager || false}
            onChange={handleChange}
            className="form-checkbox h-5 w-5 text-blue-600 rounded"
          />
          <span className="ml-2">您是餐廳的負責人嗎？</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 姓名 */}
        <div>
          <label
            htmlFor="contactName"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            姓名 <span className="text-red-500">*</span>
            {errors.contactName && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.contactName}
              </span>
            )}
          </label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            value={formData.contactName || ""}
            onChange={handleChange}
            ref={(el) => (inputRefs.current["contactName"] = el)}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
              errors.contactName
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="您的姓名"
          />
        </div>

        {/* 電話 */}
        <div>
          <label
            htmlFor="contactPhone"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            電話 <span className="text-red-500">*</span>
            {errors.contactPhone && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.contactPhone}
              </span>
            )}
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone || ""}
            onChange={handleChange}
            ref={(el) => (inputRefs.current["contactPhone"] = el)}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
              errors.contactPhone
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="您的聯絡電話"
          />
        </div>
      </div>

      {/* 電郵 */}
      <div className="mt-4">
        <label
          htmlFor="contactEmail"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          電郵
          {/* 💥 添加錯誤顯示 */}
          {errors.contactEmail && (
            <span className="text-red-500 font-normal text-xs ml-2">
              {errors.contactEmail}
            </span>
          )}
        </label>
        <input
          type="email"
          id="contactEmail"
          name="contactEmail"
          value={formData.contactEmail || ""}
          onChange={handleChange}
          ref={(el) => (inputRefs.current["contactEmail"] = el)}
          // 💥 根據錯誤狀態調整邊框樣式
          className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
            errors.contactEmail
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}
          placeholder="您的電郵地址"
        />
      </div>
    </div>
  );
};

export default ContactInfoSection;
