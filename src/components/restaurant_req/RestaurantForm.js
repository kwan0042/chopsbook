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
  categoryOptions,
  restaurantTypeOptions,
  seatingCapacityOptions,
  reservationModeOptions,
  paymentMethodOptions,
  facilitiesServiceOptions,
  provinceOptions,
  citiesByProvince,
  SUB_CATEGORY_MAP,
  subcategoryOptions, // 確保這個選項集是正確的 (雖然不再需要整個 array，但保留導入)
} from "@/data/restaurant-options";

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
  // 修正：初始狀態應該只依賴 formData，因為 Update 模式下的舊圖將在 useEffect 中被忽略
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

  // ===========================================
  // 圖片預覽邏輯 (最終修正版 - 嚴格遵守 Update 模式不顯示舊圖)
  // ===========================================
  useEffect(() => {
    // 檢查是否有選中的本地檔案 (優先級最高：本地檔案 > DB URL)
    if (selectedFile) {
      // 1. 為本地檔案創建一個可供瀏覽器顯示的 URL (Blob URL)
      const newPreviewUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(newPreviewUrl);

      // 2. Cleanup 函式
      return () => {
        URL.revokeObjectURL(newPreviewUrl);
      };
    }

    // 如果 selectedFile 為 null (沒有本地檔案)
    const dbUrl = formData.facadePhotoUrls?.[0] || "";

    if (dbUrl) {
      // 情況 A: formData 中有 URL (上傳成功後 set 進去的，或初始資料帶有的舊圖)
      setPreviewUrl(dbUrl);
    } else {
      // 情況 B: 既沒有本地檔案，formData 中也沒有 URL (用戶已清空或初次創建)
      setPreviewUrl("");
    }
  }, [selectedFile, formData.facadePhotoUrls]);

  // ---------------------------------------------
  // 圖片處理邏輯 (保持不變)
  // ---------------------------------------------
  const openFilePicker = () => {
    if (!isUploading && !isSubmittingForm) {
      fileInputRef.current?.click();
    }
  };

  // handleFileChange: 處理檔案選擇 (保持不變)
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file);
      // 選了新檔案，清空 formData 中的 URL，直到上傳成功為止 (確保預覽更新)
      handleChange({ target: { name: "facadePhotoUrls", value: [] } });
    } else {
      // 取消選擇或清除時
      setSelectedFile(null);

      // 確保取消選擇時，如果 formData 中有舊圖，它仍會被保留並顯示。
      // 但由於我們在 useEffect 中只依賴 formData.facadePhotoUrls，
      // 如果我們在這裡不修改它，它會恢復到上次的狀態。
      // 為了和 "移除" 操作的邏輯統一，讓它變成 [] 是最安全的方式，
      // 因為用戶在 UI 上已經看到清空的結果，提交時則依靠 formData.facadePhotoUrls 來判斷是否清空。
      // 這裡維持原來的邏輯：選了新檔案就清空，取消選擇就清空本地狀態，讓 useEffect 根據 formData 決定是否顯示舊圖。
      // 🚨 修正：用戶按取消後，如果之前有圖片，應該讓它顯示回舊圖。
      // 這裡我們不操作 formData.facadePhotoUrls，讓 useEffect 處理。
    }
  };

  // handleRemovePhoto: 處理移除相片 (保持不變)
  const handleRemovePhoto = () => {
    // 清除本地檔案狀態 (觸發 useEffect 清理 Blob URL)
    setSelectedFile(null);

    // 清除檔案輸入框的值
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // 清空 formData 中的 URL (🚨 這是告訴父組件：用戶明確要刪除圖片，即使在 Update 模式下也是如此)
    handleChange({ target: { name: "facadePhotoUrls", value: [] } });
  };
  // ---------------------------------------------

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

  // 修正: 直接更新 formData.category (保持不變)
  const handleCuisineCategoryChange = (e) => {
    const newCategory = e.target.value;

    // 1. 更新 category
    handleChange({
      target: {
        name: "category",
        value: newCategory,
      },
    });

    // 2. 清空 subCategory (因為主菜系變了，細分菜系必須重選)
    handleChange({
      target: {
        name: "subCategory",
        value: "",
      },
    });
  };

  // 修正: 直接更新 formData.subCategory (保持不變)
  const handleSubCuisineChange = (e) => {
    const newSubType = e.target.value;

    handleChange({
      target: {
        name: "subCategory",
        value: newSubType,
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

  // 輔助函數：找出第一個錯誤的欄位 Ref Key (保持不變)
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
      "category",
      "subCategory",
      "restaurantType",
      "businessHours",
      "paymentMethods",
      "contactName",
      "contactPhone",
      "contactEmail",
      "managerName",
    ];

    for (const key of priorityKeys) {
      if (flatErrors[key]) {
        // 處理 restaurantName 的嵌套錯誤
        if (key === "restaurantName") return "restaurantName.en";

        // 處理菜系錯誤，滾動到父容器
        if (key === "category" || key === "subCategory")
          return "cuisineTypeContainer";

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
   * 🚨 關鍵邏輯：驗證時傳遞 isUpdateForm
   */
  const localHandleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setGlobalErrorMsg("");

    // 1. 執行全面同步驗證
    // 🚨 關鍵修正：傳遞 isUpdateForm
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
    let finalPhotoUrl = formData.facadePhotoUrls?.[0] || ""; // 獲取當前 DB URL 作為基礎 (如果已上傳或從舊數據載入)

    try {
      if (selectedFile) {
        // 情況 A: 用戶選了新檔案，開始上傳
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

        // 清理本地狀態
        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setIsUploading(false);
      } else {
        // 情況 B: 沒有選新檔案
        // finalPhotoUrl 可能是空字串（如果用戶按了移除）或一個舊的 URL（如果用戶沒動）
        finalPhotoUrl = finalPhotoUrl;
      }

      const updatedFormData = {
        ...formData,
        // 如果 finalPhotoUrl 有值，則傳遞 [URL]；否則傳遞 [] (表示清空)
        facadePhotoUrls: finalPhotoUrl ? [finalPhotoUrl] : [],
      };

      await handleSubmit(event, updatedFormData);
    } catch (error) {
      // 錯誤將由父元件的 Modal 處理
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // 修正: 根據 formData.category 決定 subcategoryOptions (保持不變)
  const currentSubcategoryOptions = SUB_CATEGORY_MAP[formData.category] || [];

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
        handleCuisineCategoryChange={handleCuisineCategoryChange}
        handleSubCuisineChange={handleSubCuisineChange}
        subCategoryOptions={currentSubcategoryOptions} // 修正: 使用當前計算出的選項
        openFilePicker={openFilePicker}
        previewUrl={previewUrl}
        handleRemovePhoto={handleRemovePhoto}
        isUploading={isUploading}
        isSubmittingForm={isSubmittingForm}
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
