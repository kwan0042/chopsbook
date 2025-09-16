"use client";

import React, { useContext, useState, useRef, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { AuthContext } from "../../lib/auth-context";
import {
  cuisineOptions,
  restaurantTypeOptions,
  seatingCapacityOptions,
  reservationModeOptions,
  paymentMethodOptions,
  facilitiesServiceOptions,
  provinceOptions,
} from "../../data/restaurant-options";

// 營業時間 UI 相關的輔助資料
const DAYS_OF_WEEK = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
];

const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      times.push(`${hour}:${minute}`);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

const RestaurantForm = ({
  formData,
  handleChange,
  handleCheckboxChange,
  handleSubmit,
  isUpdateForm = false,
  selectedRestaurantData,
  errors = {}, // 接收 errors prop，並提供默認值
}) => {
  const { storage, setModalMessage, appId } = useContext(AuthContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (formData.facadePhotoUrls?.[0] && !selectedFile) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [formData.facadePhotoUrls?.[0], selectedFile]);

  const openFilePicker = () => {
    if (!isUploading && !isSubmittingForm) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setModalMessage(`已選擇檔案: ${file.name}`, "info");
      handleChange({ target: { name: "facadePhotoUrl", value: "" } });
    } else {
      setSelectedFile(null);
      setModalMessage("未選擇任何檔案", "info");
      handleChange({ target: { name: "facadePhotoUrl", value: "" } });
    }
  };

  const handleBusinessHoursChange = (index, field, value) => {
    const currentBusinessHours = Array.isArray(formData.businessHours)
      ? [...formData.businessHours]
      : [];

    while (currentBusinessHours.length <= index) {
      currentBusinessHours.push({
        day: DAYS_OF_WEEK[currentBusinessHours.length],
        isOpen: false,
        startTime: "",
        endTime: "",
      });
    }

    const newBusinessHours = [...currentBusinessHours];
    newBusinessHours[index] = {
      ...newBusinessHours[index],
      [field]: value,
    };

    handleChange({
      target: {
        name: "businessHours",
        value: newBusinessHours,
      },
    });
  };

  const localHandleSubmit = async (event) => {
    event.preventDefault();

    setIsSubmittingForm(true);
    let finalPhotoUrl = formData.facadePhotoUrls?.[0] || "";

    try {
      if (selectedFile) {
        if (!storage || !appId) {
          setModalMessage("Firebase Storage 未初始化，無法上傳圖片。", "error");
          setIsSubmittingForm(false);
          return;
        }

        setIsUploading(true);
        setModalMessage("正在上傳圖片...", "info");

        const restaurantId =
          selectedRestaurantData?.id || `new-restaurant-${Date.now()}`;

        const imageRef = ref(
          storage,
          `public/restaurants/${restaurantId}/facade/${Date.now()}`
        );

        const snapshot = await uploadBytes(imageRef, selectedFile);
        finalPhotoUrl = await getDownloadURL(snapshot.ref);

        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }

      const updatedFormData = {
        ...formData,
        facadePhotoUrls: finalPhotoUrl ? [finalPhotoUrl] : [],
      };

      await handleSubmit(event, updatedFormData);
    } catch (error) {
      console.error("表單提交失敗:", error);
      setModalMessage(`表單提交失敗: ${error.message}`, "error");
    } finally {
      setIsUploading(false);
      setIsSubmittingForm(false);
    }
  };

  return (
    <form onSubmit={localHandleSubmit} className="space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="restaurantNameZh"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              餐廳名稱 (中文) <span className="text-red-500">*</span>
              {errors.restaurantNameZh && (
                <span className="text-red-500 font-normal text-xs ml-2">
                  {errors.restaurantNameZh}
                </span>
              )}
            </label>
            <input
              type="text"
              id="restaurantNameZh"
              name="restaurantNameZh"
              value={formData.restaurantNameZh || ""}
              onChange={handleChange}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                errors.restaurantNameZh
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="例如：楓葉小館"
            />
          </div>
          <div>
            <label
              htmlFor="restaurantNameEn"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              餐廳名稱 (英文) <span className="text-red-500">*</span>
              {errors.restaurantNameEn && (
                <span className="text-red-500 font-normal text-xs ml-2">
                  {errors.restaurantNameEn}
                </span>
              )}
            </label>
            <input
              type="text"
              id="restaurantNameEn"
              name="restaurantNameEn"
              value={formData.restaurantNameEn || ""}
              onChange={handleChange}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                errors.restaurantNameEn
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
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
              省份 <span className="text-red-500">*</span>
              {errors.province && (
                <span className="text-red-500 font-normal text-xs ml-2">
                  {errors.province}
                </span>
              )}
            </label>
            <select
              id="province"
              name="province"
              value={formData.province || ""}
              onChange={handleChange}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                errors.province
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
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
              城市 <span className="text-red-500">*</span>
              {errors.city && (
                <span className="text-red-500 font-normal text-xs ml-2">
                  {errors.city}
                </span>
              )}
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city || ""}
              onChange={handleChange}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                errors.city
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="例如：多倫多"
            />
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="fullAddress"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            完整地址 <span className="text-red-500">*</span>
            {errors.fullAddress && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.fullAddress}
              </span>
            )}
          </label>
          <textarea
            id="fullAddress"
            name="fullAddress"
            value={formData.fullAddress || ""}
            onChange={handleChange}
            rows="3"
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
              errors.fullAddress
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="請輸入餐廳完整地址，包含街號、門牌號"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label
              htmlFor="postalCode"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              郵遞區號 <span className="text-red-500">*</span>
              {errors.postalCode && (
                <span className="text-red-500 font-normal text-xs ml-2">
                  {errors.postalCode}
                </span>
              )}
            </label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={formData.postalCode || ""}
              onChange={handleChange}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                errors.postalCode
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="例如：A1A 1A1"
            />
          </div>

          <div>
            <label
              htmlFor="facadePhotoUrlDisplay"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              門面相片
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                id="facadePhotoUrlDisplay"
                name="facadePhotoUrl"
                value={formData.facadePhotoUrls?.[0] || ""}
                readOnly
                className="flex-grow p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600 focus:outline-none"
                placeholder="圖片將在此處顯示"
              />
              <button
                type="button"
                onClick={openFilePicker}
                className="p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading || isSubmittingForm}
              >
                瀏覽
              </button>
            </div>
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-2">
                已選擇檔案:{" "}
                <span className="font-semibold">{selectedFile.name}</span>
              </p>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label
              htmlFor="phone"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              電話 <span className="text-red-500">*</span>
              {errors.phone && (
                <span className="text-red-500 font-normal text-xs ml-2">
                  {errors.phone}
                </span>
              )}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                errors.phone
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
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
              菜系 <span className="text-red-500">*</span>
              {errors.cuisineType && (
                <span className="text-red-500 font-normal text-xs ml-2">
                  {errors.cuisineType}
                </span>
              )}
            </label>
            <select
              id="cuisineType"
              name="cuisineType"
              value={formData.cuisineType || ""}
              onChange={handleChange}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                errors.cuisineType
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
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
              餐廳類型 <span className="text-red-500">*</span>
              {errors.restaurantType && (
                <span className="text-red-500 font-normal text-xs ml-2">
                  {errors.restaurantType}
                </span>
              )}
            </label>
            <select
              id="restaurantType"
              name="restaurantType"
              value={formData.restaurantType || ""}
              onChange={handleChange}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                errors.restaurantType
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
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
        </div>

        {/* 營業時間和定休日合併 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* 營業時間 (每週) */}
          <div className="h-full">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              營業時間 <span className="text-red-500">*</span>
              {errors.businessHours && (
                <span className="text-red-500 font-normal text-xs ml-2">
                  {errors.businessHours}
                </span>
              )}
            </label>
            <div className="space-y-1">
              {DAYS_OF_WEEK.map((day, index) => (
                <div key={day} className="flex items-center space-x-2 h-8">
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
                  {!formData.businessHours?.[index]?.isOpen ? (
                    <span className="text-gray-500 italic text-base">休息</span>
                  ) : (
                    <>
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
                        className={`p-1 border rounded-md text-sm border-gray-300`}
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
                        className={`p-1 border rounded-md text-sm border-gray-300`}
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* 定休日 (特殊日期/節日) */}
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
                checked={formData.businessHours?.isOpen || false}
                onChange={(e) =>
                  handleBusinessHoursChange(index, "isOpen", e.target.checked)
                }
                className="form-checkbox h-5 w-5 text-blue-600 rounded"
              />
              <label className="block text-gray-700 text-sm font-bold ">
                公眾假期營業
              </label>
            </div>
          </div>
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
            接受付款方式 <span className="text-red-500">*</span>
            {errors.paymentMethods && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.paymentMethods}
              </span>
            )}
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
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                errors.contactName
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="您的姓名"
            />
          </div>
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
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                errors.contactPhone
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="您的聯絡電話"
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
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmittingForm}
        >
          {isSubmittingForm ? "提交中..." : "提交餐廳更新申請"}
        </button>
      </div>
    </form>
  );
};

export default RestaurantForm;
