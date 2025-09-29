// src/components/restaurant_req/RestaurantForm.js

"use client";

import React, {
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { AuthContext } from "../../lib/auth-context";

// 引入所有選項數據
import {
  cuisineOptions,
  restaurantTypeOptions,
  seatingCapacityOptions,
  reservationModeOptions,
  paymentMethodOptions,
  facilitiesServiceOptions,
  provinceOptions,
  citiesByProvince,
} from "../../data/restaurant-options";

// 引入三個子組件
import RestaurantDetailsSection from "./form_compo/RestaurantDetailsSection";
import HoursAndPaymentSection from "./form_compo/HoursAndPaymentSection";
import ContactInfoSection from "./form_compo/ContactInfoSection";

// 引入整合後的單一驗證函數
import { validateRestaurantForm } from "../../lib/validation";
// 舊的 Step 驗證已被移除

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
  initialErrors = {},
}) => {
  const { storage, setModalMessage, appId } = useContext(AuthContext);

  // --- 圖片處理狀態 ---
  // 核心狀態：儲存使用者選中的本地檔案物件
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 核心狀態：儲存用於 <img src="..."> 的 URL (可能是 Blob URL 或 DB URL)
  const [previewUrl, setPreviewUrl] = useState(
    formData.facadePhotoUrls?.[0] || ""
  );
  // --- 圖片處理狀態結束 ---

  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // 1. 核心：用於儲存所有輸入欄位的 Ref
  const inputRefs = useRef({});

  // 錯誤狀態現在是本地的，結構為扁平的 { [fieldName]: errorMsg }
  // 將 initialErrors 結構扁平化，以防父組件傳入舊的 Step 結構
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

  const [cuisineChoice, setCuisineChoice] = useState({
    category: formData.cuisineType?.category || "",
    subType: formData.cuisineType?.subType || "",
  });

  useEffect(() => {
    setCuisineChoice({
      category: formData.cuisineType?.category || "",
      subType: formData.cuisineType?.subType || "",
    });
  }, [formData.cuisineType]);

  // ===========================================
  // 圖片預覽邏輯 (修正版 - 依賴 selectedFile 狀態)
  // ===========================================
  useEffect(() => {
    // 檢查是否有選中的本地檔案
    if (selectedFile) {
      // 1. 為本地檔案創建一個可供瀏覽器顯示的 URL
      const newPreviewUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(newPreviewUrl);

      // 2. Cleanup 函式：在下一次運行 effect 之前或組件卸載時運行
      return () => {
        // 清理前一個由 createObjectURL 創建的 URL，防止記憶體洩漏
        URL.revokeObjectURL(newPreviewUrl);
      };
    }

    // 如果 selectedFile 為 null (沒有本地檔案)，則退回使用 DB 或初始 URL

    const dbUrl = formData.facadePhotoUrls?.[0] || "";
    const originalDbUrl =
      selectedRestaurantData?.originalFacadePhotoUrls?.[0] || "";

    if (dbUrl) {
      setPreviewUrl(dbUrl);
    } else if (isUpdateForm && originalDbUrl) {
      setPreviewUrl(originalDbUrl);
    } else {
      setPreviewUrl("");
    }

    // 這裡不需要額外的 return，因為非 Blob URL 不需要 revoke
  }, [
    // 依賴 selectedFile：它改變時，會觸發新的 Blob URL 生成
    selectedFile,
    // 依賴 DB URL 相關的 props，確保更新模式下可以切換 DB 圖片
    formData.facadePhotoUrls,
    isUpdateForm,
    selectedRestaurantData?.originalFacadePhotoUrls,
  ]);

  const openFilePicker = () => {
    if (!isUploading && !isSubmittingForm) {
      fileInputRef.current?.click();
    }
  };

  // ===========================================
  // handleFileChange: 處理檔案選擇 (修正版)
  // ===========================================
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file);
      // 清空 formData 中的 URL，直到上傳成功為止
      handleChange({ target: { name: "facadePhotoUrls", value: [] } });
    } else {
      setSelectedFile(null);

      // 當用戶點擊取消或清除時，恢復到資料庫或空值
      const originalDbUrl =
        selectedRestaurantData?.originalFacadePhotoUrls?.[0] || "";

      if (isUpdateForm && originalDbUrl) {
        handleChange({
          target: { name: "facadePhotoUrls", value: [originalDbUrl] },
        });
      } else {
        handleChange({ target: { name: "facadePhotoUrls", value: [] } });
      }
    }
  };

  // ===========================================
  // handleRemovePhoto: 處理移除相片 (修正版)
  // ===========================================
  const handleRemovePhoto = () => {
    // 清除本地檔案狀態 (觸發 useEffect 清理 Blob URL)
    setSelectedFile(null);

    // 清除預覽 URL 狀態
    setPreviewUrl("");

    // 清除檔案輸入框的值
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // 清空 formData 中的 URL
    handleChange({ target: { name: "facadePhotoUrls", value: [] } });
  };
  // --- 圖片預覽邏輯結束 ---

  // --- 地址/菜系選擇邏輯 (保持不變) ---
  const handleProvinceChange = (e) => {
    const newProvince = e.target.value;
    handleChange({
      target: { name: "province", value: newProvince },
    });
    handleChange({
      target: { name: "city", value: "" },
    });
  };

  const handleCuisineCategoryChange = (e) => {
    const newCategory = e.target.value;

    setCuisineChoice({
      category: newCategory,
      subType: "",
    });

    handleChange({
      target: {
        name: "cuisineType",
        value: {
          category: newCategory,
          subType: "",
        },
      },
    });
  };

  const handleSubCuisineChange = (e) => {
    const newSubType = e.target.value;

    setCuisineChoice((prev) => ({
      ...prev,
      subType: newSubType,
    }));

    handleChange({
      target: {
        name: "cuisineType",
        value: {
          category: cuisineChoice.category,
          subType: newSubType,
        },
      },
    });
  };
  // --- 地址/菜系選擇邏輯結束 ---

  // --- 營業時間處理邏輯 (保持不變) ---
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
  // --- 營業時間處理邏輯結束 ---

  // 輔助函數：找出第一個錯誤的欄位 Ref Key (直接從扁平錯誤中查找)
  const getFirstErrorFieldName = (flatErrors) => {
    const errorKeys = Object.keys(flatErrors);

    if (errorKeys.length === 0) return null;

    // 優先檢查順序 (反映表單佈局)
    const priorityKeys = [
      "restaurantName",
      "province",
      "city",
      "postalCode",
      "fullAddress",
      "facadePhotoUrls",
      "phone",
      "cuisineCategory",
      "cuisineSubType",
      "restaurantType",
      "businessHours",
      "paymentMethods",
      "contactName",
      "contactPhone",
      "contactEmail",
    ];

    for (const key of priorityKeys) {
      if (flatErrors[key]) {
        // 處理 restaurantName 的嵌套錯誤
        if (key === "restaurantName") return "restaurantName.en";

        // 處理菜系錯誤，滾動到父容器
        if (key === "cuisineCategory" || key === "cuisineSubType")
          return "cuisineType";

        // 處理圖片錯誤
        if (key === "facadePhotoUrls") return "facadePhotoUrls";

        // 處理營業時間錯誤
        if (key === "businessHours") return "businessHoursContainer";

        return key;
      }
    }

    return null;
  };

  /**
   * 處理提交 - 執行單一全面驗證，並在通過後處理圖片上傳
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
            element.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            element.focus?.();
          }
        });
      }

      return; // 阻止提交
    }

    // 4. 驗證通過，處理圖片上傳
    setIsSubmittingForm(true);
    let finalPhotoUrl = formData.facadePhotoUrls?.[0] || ""; // 獲取當前 DB URL 作為基礎

    try {
      if (selectedFile) {
        if (!storage || !appId) {
          setModalMessage("Firebase Storage 未初始化，無法上傳圖片。", "error");
          setIsSubmittingForm(false);
          return;
        }

        setIsUploading(true);

        const restaurantId =
          selectedRestaurantData?.id || `new-restaurant-${Date.now()}`;

        const imageRef = ref(
          storage,
          `public/restaurants/${restaurantId}/facade/${Date.now()}`
        );

        const snapshot = await uploadBytes(imageRef, selectedFile);
        finalPhotoUrl = await getDownloadURL(snapshot.ref);

        // 雖然 useEffect 已經處理了清理，但確保這裡沒有懸空的 Blob URL 也是好事
        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }

        // 清空本地狀態
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setIsUploading(false);
      } else if (
        isUpdateForm &&
        selectedRestaurantData?.originalFacadePhotoUrls?.length > 0 &&
        !finalPhotoUrl
      ) {
        // 如果是更新模式，沒有選新檔案，且 formData 中也沒有 URL (例如被用戶移除但又沒選新的)
        // 這裡會確保 finalPhotoUrl 正確地被設為空字串或舊的 URL
        finalPhotoUrl = selectedRestaurantData.originalFacadePhotoUrls[0] || "";
      } else {
        // 確保 finalPhotoUrl 是一個空字串，而不是 undefined
        finalPhotoUrl = finalPhotoUrl || "";
      }

      const updatedFormData = {
        ...formData,
        facadePhotoUrls: finalPhotoUrl ? [finalPhotoUrl] : [],
      };

      await handleSubmit(event, updatedFormData);
    } catch (error) {
      // 錯誤將由父元件的 Modal 處理
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const subCuisineOptions = cuisineOptions[cuisineChoice.category] || [];

  const getSubmitButtonText = () => {
    return isUpdateForm ? "提交餐廳更新申請" : "新增餐廳";
  };

  return (
    <form onSubmit={localHandleSubmit} className="space-y-8 p-6 bg-white ">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
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
        errors={errors} // 傳遞扁平 errors
        handleCheckboxChange={handleCheckboxChange}
        handleProvinceChange={handleProvinceChange}
        cuisineChoice={cuisineChoice}
        handleCuisineCategoryChange={handleCuisineCategoryChange}
        handleSubCuisineChange={handleSubCuisineChange}
        subCuisineOptions={subCuisineOptions}
        openFilePicker={openFilePicker}
        previewUrl={previewUrl}
        handleRemovePhoto={handleRemovePhoto}
        isUploading={isUploading}
        isSubmittingForm={isSubmittingForm}
        restaurantTypeOptions={restaurantTypeOptions}
        seatingCapacityOptions={seatingCapacityOptions}
        provinceOptions={provinceOptions}
        citiesByProvince={citiesByProvince}
        cuisineOptions={cuisineOptions}
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
        errors={errors} // 傳遞扁平 errors
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
        errors={errors} // 傳遞扁平 errors
      />

      {/* 提交按鈕 */}
      <div className="pt-6 border-t flex justify-center">
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isUploading || isSubmittingForm}
        >
          {getSubmitButtonText()}
        </button>
      </div>
    </form>
  );
};

export default RestaurantForm;
