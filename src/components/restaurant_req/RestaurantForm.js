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

  // --- 圖片處理狀態 (維持不變，但用途改變) ---
  // 核心狀態：儲存使用者選中的本地檔案物件 (現在這個檔案是裁剪好的 WEBP Blob/File)
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  // 🔥 移除 fileInputRef，因為它已移至子組件內部
  // const fileInputRef = useRef(null);

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

  // (略：handleNameEnChange, handleNoChineseNameChange 邏輯不變)

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

  const handleNoChineseNameChange = (e) => {
    const isChecked = e.target.checked;

    // 1. 更新 noChineseName 狀態 (布林值)
    // 🎯 修正：傳遞 type="checkbox" 和 checked 屬性，以正確觸發父組件的專門邏輯
    handleChange({
      target: {
        name: "noChineseName",
        type: "checkbox", // <--- 關鍵新增
        checked: isChecked, // <--- 關鍵修改
        value: isChecked,
      },
    });

    // 2. 移除原有的第二次 handleChange (清空中文名)，
    //    因為這個連動邏輯現在已轉移到父組件 (AddRestaurantPage.js) 的 handleChange 中執行。

    // 3. 執行錯誤清除連動邏輯 (保留並簡化，因為 setErrors 是這個組件的本地狀態)
    if (isChecked) {
      setErrors((prevErrors) => {
        // 確保 errors 是正確的扁平結構
        const newErrors = { ...prevErrors };

        // 移除扁平化後的錯誤 (例如: "restaurantName.zh-TW")
        delete newErrors["restaurantName.zh-TW"];

        // 移除嵌套的錯誤 (如果父組件傳入的 initialErrors 是嵌套結構)
        if (newErrors.restaurantName?.["zh-TW"]) {
          const newRestaurantNameErrors = { ...newErrors.restaurantName };
          delete newRestaurantNameErrors["zh-TW"];

          // 如果 restaurantName 錯誤物件清空了，則移除頂層 key
          if (Object.keys(newRestaurantNameErrors).length === 0) {
            delete newErrors.restaurantName;
          } else {
            newErrors.restaurantName = newRestaurantNameErrors;
          }
        }
        return newErrors;
      });
    }
  };

  // ===========================================
  // 🔥 關鍵新增: 接收裁剪後的圖片檔案和預覽 URL
  // ===========================================
  const handlePhotoCroppedAndReady = useCallback(
    (croppedFile, newPreviewUrl) => {
      // 1. 儲存裁剪好的檔案物件 (用於提交時上傳)
      setSelectedFile(croppedFile);

      // 2. 儲存 Blob URL (用於顯示預覽)
      setPreviewUrl(newPreviewUrl);

      // 3. 選了新檔案，清空 formData 中的 URL，直到上傳成功為止 (確保預覽更新)
      //    (這一行邏輯已在子組件中處理，但為確保父組件狀態一致性，在此也執行一次)
      handleChange({ target: { name: "facadePhotoUrls", value: [] } });
    },
    [handleChange]
  );

  // ===========================================
  // 圖片預覽邏輯 (最終修正版 - 嚴格遵守 Update 模式不顯示舊圖)
  // ===========================================
  useEffect(() => {
    // 檢查是否有選中的本地檔案 (優先級最高：本地檔案 > DB URL)
    if (selectedFile) {
      // 1. 為本地檔案創建一個可供瀏覽器顯示的 URL (Blob URL)
      // 🚨 注意: 這裡的 newPreviewUrl 應該已經在 handlePhotoCroppedAndReady 中設置，
      //      這裡只需要確保 cleanup 邏輯正確執行。

      // 由於 selectedFile 是一個 Blob/File，我們需要確保我們正在清理它產生的 Blob URL。
      // 由於 Blob URL 已經在 handlePhotoCroppedAndReady 中設置到 previewUrl，
      // 這裡只需要確保 cleanup 函式正確執行。
      if (previewUrl && previewUrl.startsWith("blob:")) {
        return () => {
          URL.revokeObjectURL(previewUrl);
        };
      }
      return;
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
  }, [selectedFile, formData.facadePhotoUrls, previewUrl]);

  // ---------------------------------------------
  // 圖片處理邏輯 (只保留父組件所需的邏輯)
  // ---------------------------------------------

  // 🔥 移除 openFilePicker, handleFileChange
  // 因為它們已移至子組件內部，負責觸發文件選擇和 Pop-up 開啟。

  // handleRemovePhoto: 處理移除相片 (僅操作狀態，不操作 Ref)
  const handleRemovePhoto = useCallback(() => {
    // 1. 清除本地檔案狀態 (觸發 useEffect 清理 Blob URL)
    setSelectedFile(null);

    // 2. 清除預覽 URL
    setPreviewUrl("");

    // 3. 清空 formData 中的 URL (這是告訴父組件：用戶明確要刪除圖片)
    handleChange({ target: { name: "facadePhotoUrls", value: [] } });
  }, [handleChange]);
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
        // 情況 A: 用戶選了**裁剪好的 WEBP 檔案**，開始上傳
        if (!storage || !appId) {
          setModalMessage("Firebase Storage 未初始化，無法上傳圖片。", "error");
          setIsSubmittingForm(false);
          return;
        }

        setIsUploading(true);

        const restaurantId =
          selectedRestaurantData?.id || `new-restaurant-${Date.now()}`;

        // 🚨 檔案名稱使用 selectedFile 的名稱，它應該已經是 WEBP 結尾
        const imageRef = ref(
          storage,
          `public/restaurants/${restaurantId}/facade/${selectedFile.name}`
        );

        const snapshot = await uploadBytes(imageRef, selectedFile);
        finalPhotoUrl = await getDownloadURL(snapshot.ref);

        // 清理本地狀態
        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null); // 清除已上傳的檔案

        // 🔥 移除 fileInputRef 的操作，因為它已經被移除了
        // if (fileInputRef.current) {
        //   fileInputRef.current.value = "";
        // }

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
      {/* 🔥 移除隱藏的 file input，它已移至子組件內部 */}
      {/* <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      /> */}

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
        handleNameEnChange={handleNameEnChange}
        handleNoChineseNameChange={handleNoChineseNameChange}
        handleProvinceChange={handleProvinceChange}
        handleCuisineCategoryChange={handleCuisineCategoryChange}
        handleSubCuisineChange={handleSubCuisineChange}
        subCategoryOptions={currentSubcategoryOptions} // 修正: 使用當前計算出的選項
        // 🔥 移除 openFilePicker，現在由子組件內部處理
        // openFilePicker={openFilePicker}
        previewUrl={previewUrl}
        handleRemovePhoto={handleRemovePhoto} // 🎯 保留，但它現在只會清除 formData 和本地狀態
        isUploading={isUploading}
        isSubmittingForm={isSubmittingForm}
        restaurantTypeOptions={restaurantTypeOptions}
        seatingCapacityOptions={seatingCapacityOptions}
        provinceOptions={provinceOptions}
        citiesByProvince={citiesByProvince}
        CategoryOptions={categoryOptions}
        // 🔥 關鍵新增: 接收裁剪後檔案的回調函數
        onPhotoCroppedAndReady={handlePhotoCroppedAndReady}
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
