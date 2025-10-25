"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
// 🚨 移除整合後的單一驗證函數 validateRestaurantForm 導入

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
  // 確保路徑正確
} from "@/data/restaurant-options";

// 引入三個子組件
import RestaurantDetailsSection from "@/components/restaurant_req/form_compo/RestaurantDetailsSection";
import HoursAndPaymentSection from "@/components/restaurant_req/form_compo/HoursAndPaymentSection";
import ContactInfoSectionAdmin from "@/components/admin/restaurantManagement/form_compo_admin/ContactInfoSectionAdmin.jsx";

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
  initialErrors = {}, // ✅ 關鍵變更: 這是來自父組件的 errors
  selectedFile,
  onFileChange,
  onRemovePhoto,
  isUploading,
  isSubmitting, // Modal 的提交狀態
}) => {
  // --- 圖片處理狀態 ---
  const fileInputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(
    formData.facadePhotoUrls?.[0] || ""
  );

  const inputRefs = useRef({});

  // 🚨 關鍵修改 1: 移除本地 errors 狀態（或將其保留為不使用）
  const [errors, setErrors] = useState({}); // 保持，但忽略其在提交時的設置

  // 🚨 關鍵修改 2: 移除本地 globalErrorMsg 狀態的初始化，改為使用計算屬性
  const [globalErrorMsg, setGlobalErrorMsg] = useState("");

  // ✅ 關鍵修改 3: 移除整個 useEffect 區塊，只保留圖片預覽的 useEffect
  useEffect(() => {
    if (selectedFile) {
      const newPreviewUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(newPreviewUrl);
      return () => {
        URL.revokeObjectURL(newPreviewUrl);
      };
    } // 如果沒有本地檔案，則顯示 formData 中的 DB URL

    const dbUrl = formData.facadePhotoUrls?.[0] || "";
    setPreviewUrl(dbUrl);
  }, [selectedFile, formData.facadePhotoUrls]);

  // --------------------------------------------- // 圖片處理邏輯 (現在只負責調用父組件的 props) // ---------------------------------------------

  const openFilePicker = () => {
    if (!isUploading && !isSubmitting) {
      fileInputRef.current?.click();
    }
  };

  const localHandleFileChange = (event) => {
    const file = event.target.files[0]; // 🚨 調用父組件傳入的 onFileChange prop

    if (onFileChange) {
      onFileChange(file);
    } // 選了新檔案，清空 formData 中的 URL (通知父組件準備上傳)

    if (file) {
      handleChange({ target: { name: "facadePhotoUrls", value: [] } });
    }
  };

  const localHandleRemovePhoto = () => {
    // 清除檔案輸入框的值
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    } // 🚨 調用父組件傳入的 onRemovePhoto prop

    if (onRemovePhoto) {
      onRemovePhoto();
    } // 清空 formData 中的 URL (通知父組件要刪除)

    handleChange({ target: { name: "facadePhotoUrls", value: [] } });
  }; // --------------------------------------------- // --- 地址/菜系/營業時間處理邏輯 (保持不變) ---
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
  }; // ✅ 關鍵新增：處理英文名稱變更，同時更新小寫名稱

  const handleNameEnChange = (e) => {
    const newNameEn = e.target.value; // 1. 更新 restaurantName.en

    handleChange({
      target: { name: "restaurantName.en", value: newNameEn },
    }); // 2. 更新 name_lowercase_en //  如果 newNameEn 存在，則轉為小寫；否則設為空字串

    const newNameLowercaseEn = newNameEn ? newNameEn.toLowerCase() : "";
    handleChange({
      target: { name: "name_lowercase_en", value: newNameLowercaseEn },
    });
  };

  // ✅ 關鍵新增：專門處理 noChineseName 的 Checkbox 改變 (確保它不是 array)
  const handleNoChineseNameToggle = useCallback(
    (e) => {
      // 這裡我們只傳遞 name 和 checked 給父組件的 handleChange
      // 由於父組件的 handleChange 會檢查 type="checkbox"
      // 這裡只需要模擬一個包含 name 和 checked 的 event
      handleChange({
        target: {
          name: "noChineseName",
          type: "checkbox",
          checked: e.target.checked,
          value: e.target.value, // 傳遞 value 雖然 checkbox 不需要，但保持結構一致性
        },
      });
    },
    [handleChange]
  );

  // ✅ 關鍵修改：使用 useCallback 包裹 handleBusinessHoursChange

  const handleBusinessHoursChange = useCallback(
    (index, field, value) => {
      // 確保我們從當前的 formData 獲取 businessHours 的值
      const currentBusinessHours = Array.isArray(formData.businessHours)
        ? [...formData.businessHours]
        : []; // 確保陣列有足夠的長度

      while (currentBusinessHours.length <= index) {
        currentBusinessHours.push({
          day: DAYS_OF_WEEK[currentBusinessHours.length],
          isOpen: false,
          startTime: "",
          endTime: "",
        });
      } // 創建一個新的 businessHours 陣列，並更新指定的 index

      const newBusinessHours = currentBusinessHours.map((item, i) => {
        if (i === index) {
          // 使用展開運算符確保淺拷貝，避免直接修改舊對象
          return { ...item, [field]: value };
        }
        return item;
      }); // 僅調用一次 handleChange，傳入新的陣列 // 雖然 handleChange 來自外部，但我們假設它會用新的陣列引用來觸發重新渲染

      handleChange({
        target: { name: "businessHours", value: newBusinessHours },
      });
    },
    [formData.businessHours, handleChange]
  ); // 依賴於 formData.businessHours 和 handleChange // --- 處理邏輯結束 ---
  /**
   * 處理提交 - 🚨 移除驗證邏輯，直接調用父組件的 handleSubmit
   */
  const localHandleSubmit = async (event) => {
    event.preventDefault();
    // 🚨 關鍵修改 4: 移除 setErrors/setGlobalErrorMsg 的調用，讓父組件來設置 errors prop
    // setErrors({});
    // setGlobalErrorMsg("");

    // 父組件 (NewRestaurantModal) 將負責驗證，如果失敗，它會傳遞 initialErrors prop
    await handleSubmit(formData);
  };

  const currentSubcategoryOptions = SUB_CATEGORY_MAP[formData.category] || [];

  const getSubmitButtonText = () => {
    return isUpdateForm ? "更新餐廳資料" : "新增餐廳";
  };

  // ✅ 關鍵修改 5: 使用計算屬性來決定是否顯示全局錯誤訊息
  const hasErrors = Object.keys(initialErrors).length > 0;
  const displayGlobalErrorMsg = hasErrors
    ? "請檢查表單中標記的必填/格式錯誤欄位。"
    : "";

  return (
    <form onSubmit={localHandleSubmit} className="space-y-8 p-6 bg-white ">
      {" "}
      <input
        type="file"
        ref={fileInputRef}
        onChange={localHandleFileChange}
        className="hidden"
        accept="image/*"
      />{" "}
      {isUpdateForm && selectedRestaurantData && (
        <p className="text-lg font-semibold text-gray-800 mb-6 border-b pb-4">
          您正在為以下餐廳提交更新申請： <br /> **
          {selectedRestaurantData?.restaurantName?.["zh-TW"]}** ({" "}
          {selectedRestaurantData?.restaurantName?.en}){" "}
        </p>
      )}{" "}
      {/* 全局錯誤訊息 (✅ 現在使用計算屬性 displayGlobalErrorMsg) */}{" "}
      {displayGlobalErrorMsg && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-medium">
          {displayGlobalErrorMsg}{" "}
        </div>
      )}{" "}
      {/* =======================================
     Section 1: 餐廳詳細資料 
     ======================================= */}{" "}
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">
        1. 餐廳詳細資料{" "}
      </h2>{" "}
      <RestaurantDetailsSection
        inputRefs={inputRefs}
        formData={formData}
        handleChange={handleChange}
        errors={initialErrors} // ✅ 關鍵修改 6: 直接傳遞 initialErrors
        handleCheckboxChange={handleCheckboxChange} // 傳遞給多選 (e.g. restaurantType)
        handleProvinceChange={handleProvinceChange}
        handleCuisineCategoryChange={handleCuisineCategoryChange}
        handleSubCuisineChange={handleSubCuisineChange}
        handleNameEnChange={handleNameEnChange}
        // 🎯 關鍵修改 7: 將處理 noChineseName 的函數替換為專門的 Toggle 函數
        handleNoChineseNameChange={handleNoChineseNameToggle}
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
      />{" "}
      {/* =======================================
     Section 2: 營業、服務與付款 
     ======================================= */}{" "}
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 pt-8">
        2. 營業、服務與付款{" "}
      </h2>{" "}
      <HoursAndPaymentSection
        inputRefs={inputRefs}
        formData={formData}
        handleChange={handleChange}
        errors={initialErrors} // ✅ 關鍵修改 6: 直接傳遞 initialErrors
        handleCheckboxChange={handleCheckboxChange}
        handleBusinessHoursChange={handleBusinessHoursChange} // ✅ 現在是穩定的 useCallback 函數
        DAYS_OF_WEEK={DAYS_OF_WEEK}
        TIME_OPTIONS={TIME_OPTIONS}
        reservationModeOptions={reservationModeOptions}
        paymentMethodOptions={paymentMethodOptions}
        facilitiesServiceOptions={facilitiesServiceOptions}
      />{" "}
      {/* =======================================
     Section 3: 聯絡人資訊 
     ======================================= */}{" "}
      <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 pt-8">
        3. 聯絡人資訊{" "}
      </h2>{" "}
      <ContactInfoSectionAdmin
        inputRefs={inputRefs}
        formData={formData}
        handleChange={handleChange}
        errors={initialErrors} // ✅ 關鍵修改 6: 直接傳遞 initialErrors
      />
      {/* 提交按鈕 */}{" "}
      <div className="pt-6 border-t flex justify-center">
        {" "}
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isUploading || isSubmitting} // 🚨 使用傳入的 isUploading/isSubmitting
        >
          {getSubmitButtonText()}{" "}
        </button>{" "}
      </div>{" "}
    </form>
  );
};

export default RestaurantFormAdmin;
