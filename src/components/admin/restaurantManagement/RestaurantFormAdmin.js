// src/components/admin/restaurantManagement/RestaurantFormAdmin.js
"use client";

import React, { useState, useRef, useEffect } from "react";
// 🚨 移除 Firebase 和 AuthContext 相關導入

// 引入所有選項數據
import {
  categoryOptions,
  restaurantTypeOptions,
  seatingCapacityOptions,
  reservationModeOptions,
  paymentMethodOptions,
  facilitiesServiceOptions,
  provinceOptions,
  citiesByProvince,
  SUB_CATEGORY_MAP,
} from "@/data/restaurant-options";

// 引入三個子組件
import RestaurantDetailsSection from "@/components/restaurant_req/form_compo/RestaurantDetailsSection";
import HoursAndPaymentSection from "@/components/restaurant_req/form_compo/HoursAndPaymentSection";
import ContactInfoSection from "@/components/restaurant_req/form_compo/ContactInfoSection";

// 引入整合後的單一驗證函數
import { validateRestaurantForm } from "../../../lib/validation";
// 假設 validation.js 的路徑相對正確

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

// 🚨 關鍵變更 1: 接收所有 Admin Modal 傳入的 props
const RestaurantFormAdmin = ({
  formData,
  handleChange,
  handleCheckboxChange,
  handleSubmit, // 父組件 (NewRestaurantModal) 傳入的最終提交函數
  isUpdateForm = false,
  selectedRestaurantData,
  initialErrors = {},
  // 🚨 接收 Admin Modal 傳入的圖片狀態和處理函數
  selectedFile,
  onFileChange,
  onRemovePhoto,
  isUploading,
  isSubmitting, // Modal 的提交狀態
}) => {
  // 🚨 移除 AuthContext 的 useContext

  // --- 圖片處理狀態 ---
  const fileInputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(
    formData.facadePhotoUrls?.[0] || ""
  );

  // 🚨 移除本地的 isUploading 和 isSubmittingForm 狀態

  // 1. 核心：用於儲存所有輸入欄位的 Ref
  const inputRefs = useRef({});

  // 錯誤狀態現在是本地的
  const flatInitialErrors =
    initialErrors.step1 || initialErrors.step2 || initialErrors.step3
      ? {
          ...initialErrors.step1,
          ...initialErrors.step2,
          ...initialErrors.step3,
        }
      : initialErrors;

  const [errors, setErrors] = useState(flatInitialErrors);
  const [globalErrorMsg, setGlobalErrorMsg] = useState("");

  // ===========================================
  // 圖片預覽邏輯 (依賴傳入的 selectedFile)
  // ===========================================
  useEffect(() => {
    if (selectedFile) {
      const newPreviewUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(newPreviewUrl);
      return () => {
        URL.revokeObjectURL(newPreviewUrl);
      };
    }

    // 如果沒有本地檔案，則顯示 formData 中的 DB URL
    const dbUrl = formData.facadePhotoUrls?.[0] || "";
    setPreviewUrl(dbUrl);
  }, [selectedFile, formData.facadePhotoUrls]);

  // ---------------------------------------------
  // 圖片處理邏輯 (現在只負責調用父組件的 props)
  // ---------------------------------------------
  const openFilePicker = () => {
    if (!isUploading && !isSubmitting) {
      fileInputRef.current?.click();
    }
  };

  const localHandleFileChange = (event) => {
    const file = event.target.files[0];

    // 🚨 調用父組件傳入的 onFileChange prop
    if (onFileChange) {
      onFileChange(file);
    }

    // 選了新檔案，清空 formData 中的 URL (通知父組件準備上傳)
    if (file) {
      handleChange({ target: { name: "facadePhotoUrls", value: [] } });
    }
  };

  const localHandleRemovePhoto = () => {
    // 清除檔案輸入框的值
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // 🚨 調用父組件傳入的 onRemovePhoto prop
    if (onRemovePhoto) {
      onRemovePhoto();
    }

    // 清空 formData 中的 URL (通知父組件要刪除)
    handleChange({ target: { name: "facadePhotoUrls", value: [] } });
  };
  // ---------------------------------------------

  // --- 地址/菜系/營業時間處理邏輯 (保持不變) ---
  const handleProvinceChange = (e) => {
    const newProvince = e.target.value;
    handleChange({ target: { name: "province", value: newProvince } });
    handleChange({ target: { name: "city", value: "" } });
  };

  const handleCuisineCategoryChange = (e) => {
    const newCategory = e.target.value;
    handleChange({ target: { name: "category", value: newCategory } });
    handleChange({ target: { name: "subCategory", value: "" } });
  };

  const handleSubCuisineChange = (e) => {
    const newSubType = e.target.value;
    handleChange({ target: { name: "subCategory", value: newSubType } });
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
    newBusinessHours[index] = { ...newBusinessHours[index], [field]: value };

    handleChange({
      target: { name: "businessHours", value: newBusinessHours },
    });
  };
  // --- 處理邏輯結束 ---

  // 輔助函數：找出第一個錯誤的欄位 Ref Key (保持與原版一致)
  const getFirstErrorFieldName = (flatErrors) => {
    // ... (保持與原版 RestaurantForm.js 一致)
    const errorKeys = Object.keys(flatErrors);

    if (errorKeys.length === 0) return null;

    const priorityKeys = [
      "restaurantName",
      "province",
      "city",
      "postalCode",
      "fullAddress",
      "facadePhotoUrls",
      "phone",
      "category",
      "subCategory",
      "restaurantType",
      "businessHours",
      "paymentMethods",
      "contactEmail",
      "managerName",
    ];

    for (const key of priorityKeys) {
      if (
        flatErrors[key] ||
        flatErrors[`${key}.zh-TW`] ||
        flatErrors[`${key}.en`]
      ) {
        if (key === "restaurantName") return "restaurantName.en";
        if (key === "category" || key === "subCategory")
          return "cuisineTypeContainer";
        if (key === "facadePhotoUrls") return "facadePhotoUrls";
        if (key === "businessHours") return "businessHoursContainer";
        return key;
      }
    }
    return null;
  };

  /**
   * 處理提交 - 執行單一全面驗證
   * 🚨 關鍵變更 2: 驗證成功後，直接調用父組件的 handleSubmit，不執行 Firebase 上傳
   */
  const localHandleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setGlobalErrorMsg("");

    // 1. 執行全面同步驗證
    const flatValidationResult = validateRestaurantForm(
      { ...formData, tempSelectedFile: selectedFile },
      isUpdateForm,
      selectedRestaurantData?.originalFacadePhotoUrls
    );

    // 2. 檢查是否有錯誤
    const hasError = Object.keys(flatValidationResult).length > 0;

    if (hasError) {
      setErrors(flatValidationResult);
      setGlobalErrorMsg("表單驗證失敗。請檢查紅色標記的欄位並更正錯誤。");

      // 3. 滾動到第一個錯誤欄位
      const firstErrorName = getFirstErrorFieldName(flatValidationResult);
      if (firstErrorName && inputRefs.current[firstErrorName]) {
        window.requestAnimationFrame(() => {
          const element = inputRefs.current[firstErrorName];
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.focus?.();
          }
        });
      }

      return; // 阻止提交
    }

    // 4. 驗證通過，直接調用父組件的提交函數
    // 父組件 (NewRestaurantModal) 將負責圖片上傳和 API 提交。
    await handleSubmit(formData);
  };

  const currentSubcategoryOptions = SUB_CATEGORY_MAP[formData.category] || [];

  const getSubmitButtonText = () => {
    return isUpdateForm ? "更新餐廳資料" : "新增餐廳";
  };

  return (
    <form onSubmit={localHandleSubmit} className="space-y-8 p-6 bg-white ">
      <input
        type="file"
        ref={fileInputRef}
        onChange={localHandleFileChange}
        className="hidden"
        accept="image/*"
      />

      {isUpdateForm && selectedRestaurantData && (
        <p className="text-lg font-semibold text-gray-800 mb-6 border-b pb-4">
          您正在為以下餐廳提交更新申請：
          <br />
          **{selectedRestaurantData?.restaurantName?.["zh-TW"]}** (
          {selectedRestaurantData?.restaurantName?.en})
        </p>
      )}

      {/* 全局錯誤訊息 */}
      {globalErrorMsg && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-medium">
          {globalErrorMsg}
        </div>
      )}

      {/* =======================================
           Section 1: 餐廳詳細資料 
           ======================================= */}
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">
        1. 餐廳詳細資料
      </h2>
      <RestaurantDetailsSection
        inputRefs={inputRefs}
        formData={formData}
        handleChange={handleChange}
        errors={errors}
        handleCheckboxChange={handleCheckboxChange}
        handleProvinceChange={handleProvinceChange}
        handleCuisineCategoryChange={handleCuisineCategoryChange}
        handleSubCuisineChange={handleSubCuisineChange}
        subCategoryOptions={currentSubcategoryOptions}
        openFilePicker={openFilePicker}
        previewUrl={previewUrl}
        handleRemovePhoto={localHandleRemovePhoto}
        isUploading={isUploading}
        isSubmittingForm={isSubmitting} // 🚨 使用傳入的 isSubmitting
        restaurantTypeOptions={restaurantTypeOptions}
        seatingCapacityOptions={seatingCapacityOptions}
        provinceOptions={provinceOptions}
        citiesByProvince={citiesByProvince}
        CategoryOptions={categoryOptions}
      />

      {/* =======================================
           Section 2: 營業、服務與付款 
           ======================================= */}
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 pt-8">
        2. 營業、服務與付款
      </h2>
      <HoursAndPaymentSection
        inputRefs={inputRefs}
        formData={formData}
        handleChange={handleChange}
        errors={errors}
        handleCheckboxChange={handleCheckboxChange}
        handleBusinessHoursChange={handleBusinessHoursChange}
        DAYS_OF_WEEK={DAYS_OF_WEEK}
        TIME_OPTIONS={TIME_OPTIONS}
        reservationModeOptions={reservationModeOptions}
        paymentMethodOptions={paymentMethodOptions}
        facilitiesServiceOptions={facilitiesServiceOptions}
      />

      {/* =======================================
           Section 3: 聯絡人資訊 
           ======================================= */}
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 pt-8">
        3. 聯絡人資訊
      </h2>
      <ContactInfoSection
        inputRefs={inputRefs}
        formData={formData}
        handleChange={handleChange}
        errors={errors}
      />

      {/* 提交按鈕 */}
      <div className="pt-6 border-t flex justify-center">
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isUploading || isSubmitting} // 🚨 使用傳入的 isUploading/isSubmitting
        >
          {getSubmitButtonText()}
        </button>
      </div>
    </form>
  );
};

export default RestaurantFormAdmin;
