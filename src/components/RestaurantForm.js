// src/components/RestaurantForm.js
import React from "react";
import {
  cuisineOptions,
  restaurantTypeOptions,
  seatingCapacityOptions,
  reservationModeOptions,
  paymentMethodOptions,
  facilitiesServiceOptions,
  provinceOptions,
} from "../data/restaurant-options"; // 引入靜態選項數據

const RestaurantForm = ({
  formData,
  handleChange,
  handleCheckboxChange,
  handleSubmit,
  isUpdateForm = false, // 新增屬性來區分是新增還是更新表單
  selectedRestaurantData,
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isUpdateForm && selectedRestaurantData && (
        <p className="text-lg font-semibold text-gray-800 mb-4">
          您正在為以下餐廳提交更新申請：
          <br />
          **{selectedRestaurantData?.restaurantNameZh}** (
          {selectedRestaurantData?.restaurantNameEn})
        </p>
      )}

      {/* 餐廳詳細資料 */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">餐廳詳細資料</h3>
        {/* ... (這裡的表單欄位內容與您提供的原始碼完全相同，只是被移到這個新檔案中) ... */}
        {/* 請注意，為了簡潔，我在此處省略了所有表單欄位，請將您舊檔案中的所有表單內容 (input, select, textarea, label) 貼到這裡 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="restaurantNameZh"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              餐廳名稱 (中文) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="restaurantNameZh"
              name="restaurantNameZh"
              value={formData.restaurantNameZh || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：楓葉小館"
              required
            />
          </div>
          <div>
            <label
              htmlFor="restaurantNameEn"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              餐廳名稱 (英文)
            </label>
            <input
              type="text"
              id="restaurantNameEn"
              name="restaurantNameEn"
              value={formData.restaurantNameEn || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：Maple Leaf Bistro"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label
              htmlFor="province"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              省份
            </label>
            <select
              id="province"
              name="province"
              value={formData.province || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {provinceOptions.map((option) => (
                <option
                  key={option}
                  value={option === "選擇省份" ? "" : option}
                >
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="city"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              城市
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：多倫多"
            />
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="fullAddress"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            完整地址
          </label>
          <textarea
            id="fullAddress"
            name="fullAddress"
            value={formData.fullAddress || ""}
            onChange={handleChange}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="請輸入餐廳完整地址，包含街號、門牌號、郵遞區號"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label
              htmlFor="phone"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              電話
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：416-123-4567"
            />
          </div>
          <div>
            <label
              htmlFor="website"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              網站
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：https://www.example.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label
              htmlFor="cuisineType"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              菜系
            </label>
            <select
              id="cuisineType"
              name="cuisineType"
              value={formData.cuisineType || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {cuisineOptions.map((option) => (
                <option
                  key={option}
                  value={option === "選擇菜系" ? "" : option}
                >
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="restaurantType"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              餐廳類型
            </label>
            <select
              id="restaurantType"
              name="restaurantType"
              value={formData.restaurantType || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {restaurantTypeOptions.map((option) => (
                <option
                  key={option}
                  value={option === "選擇餐廳類型" ? "" : option}
                >
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label
              htmlFor="avgSpending"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              人均消費 ($)
            </label>
            <input
              type="number"
              id="avgSpending"
              name="avgSpending"
              value={formData.avgSpending || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：30 (僅數字)"
              min="0"
            />
          </div>
          <div>
            <label
              htmlFor="facadePhotoUrl"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              門面相片 (URL)
            </label>
            <input
              type="url"
              id="facadePhotoUrl"
              name="facadePhotoUrl"
              value={formData.facadePhotoUrl || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：https://image.com/restaurant.jpg"
            />
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="seatingCapacity"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            座位數
          </label>
          <select
            id="seatingCapacity"
            name="seatingCapacity"
            value={formData.seatingCapacity || ""}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {seatingCapacityOptions.map((option) => (
              <option
                key={option}
                value={option === "選擇座位數" ? "" : option}
              >
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label
            htmlFor="businessHours"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            營業時間
          </label>
          <textarea
            id="businessHours"
            name="businessHours"
            value={formData.businessHours || ""}
            onChange={handleChange}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：週一至週五 11:00-22:00, 週六日 10:00-23:00"
          ></textarea>
        </div>

        <div className="mt-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            訂座模式
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

        <div className="mt-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            接受付款方式
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

        <div className="mt-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            設施/服務
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {facilitiesServiceOptions.map((option) => (
              <label key={option} className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  name="facilitiesServices"
                  value={option}
                  checked={
                    formData.facilitiesServices?.includes(option) || false
                  }
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

      {/* 聯絡人資訊 */}
      <div className="pt-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">聯絡人資訊</h3>
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
          <div>
            <label
              htmlFor="contactName"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="您的姓名"
              required
            />
          </div>
          <div>
            <label
              htmlFor="contactPhone"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              電話 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="您的聯絡電話"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="contactEmail"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            電郵
          </label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail || ""}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="您的電郵地址"
          />
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
        >
          提交餐廳更新申請
        </button>
      </div>
    </form>
  );
};

export default RestaurantForm;
