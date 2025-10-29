"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
// 🚨 關鍵修改 1：導入 Resizer 庫用於圖片處理
import Resizer from "react-image-file-resizer";
// ✅ 關鍵修改 1: 導入驗證函數
import { validateRestaurantForm } from "@/lib/validation-admin";
// 🚨 僅修改此處：導入新的 Admin 專用表單組件
import RestaurantFormAdmin from "./RestaurantFormAdmin.js";
import { AuthContext } from "@/lib/auth-context"; // <-- 確保路徑正確

// 🎯 修正點 1: 導入 Firebase 相關功能
import { doc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// -------------------------------------------------------------
// 初始狀態定義 (保持與父組件 RestaurantManagement.js 預期的一致)
// -------------------------------------------------------------

const DAYS_OF_WEEK = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
];

const initialBusinessHours = DAYS_OF_WEEK.map((day) => ({
  day: day,
  isOpen: false,
  startTime: "10:00",
  endTime: "20:00",
}));

const initialFormData = {
  restaurantName: { "zh-TW": "", en: "" },
  noChineseName: false, // ✅ 確保此處為布林值
  province: "",
  city: "",
  postalCode: "",
  fullAddress: "",
  facadePhotoUrls: [],
  phone: "",
  website: "",
  category: "",
  subCategory: "",
  restaurantType: [],
  seatingCapacity: "",
  businessHours: initialBusinessHours,
  isHolidayOpen: false,
  holidayHours: "",
  closedDates: "",
  reservationModes: [],
  paymentMethods: [],
  facilitiesServices: [],
  contactName: "", // ✅ 確保包含 ContactInfoSectionAdmin 可能需要的欄位
  contactPhone: "", // ✅ 確保包含 ContactInfoSectionAdmin 可能需要的欄位
  contactEmail: "",
  managerName: "",
  priority: 0,
  avgSpending: "",
  status: "approved",
  isManager: false,
  awards: "",
  otherInfo: "",
  submittedBy: "",
  createdAt: "",
};

// -------------------------------------------------------------
// 🚨 更新：深度清理函數
// -------------------------------------------------------------
const cleanData = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    // 陣列遞迴處理：過濾掉 undefined 和 null 元素
    return obj
      .map((item) => cleanData(item))
      .filter((item) => item !== undefined && item !== null);
  }

  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      // 🚨 關鍵修訂：特殊處理 noChineseName 欄位，確保它不是空陣列，而是布林值
      if (
        key === "noChineseName" &&
        Array.isArray(value) &&
        value.length === 0
      ) {
        newObj[key] = false; // 如果被錯誤處理成空陣列，則恢復為 false
        continue;
      }

      // 僅處理非 undefined 的頂層值 (Firebase 不支援 undefined)
      if (value !== undefined) {
        if (
          typeof value === "object" &&
          value !== null &&
          !(value instanceof Date) &&
          !value.hasOwnProperty("_isServerTimestamp")
        ) {
          const cleanedNested = cleanData(value);
          newObj[key] = cleanedNested;
        } else {
          newObj[key] = value;
        }
      }
    }
  }
  return newObj;
};

// -------------------------------------------------------------
// 組件本身
// -------------------------------------------------------------
const NewRestaurantModal = ({
  isOpen,
  onClose,
  onSubmit: parentOnSubmit, // 這個 prop 可能是用來發送成功通知或更新列表，而不是實際的寫入邏輯
  isSubmitting: isSubmittingProp, // 接收父組件的狀態
  selectedFile,
  onFileChange,
  onRemovePhoto,
  isUploading: isUploadingProp, // 接收父組件的狀態
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  // 🎯 修正點 2: 使用內部狀態來管理提交和上傳狀態 (因為我們在這裡處理 Firebase 邏輯)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 🎯 修正點 3: 使用 AuthContext 獲取當前用戶
  const { appId, storage, db, currentUser } = useContext(AuthContext);

  // ---------------------------------------------
  // 通用表單變更處理 (保留這些函數，因為它們操作 formData)
  // ---------------------------------------------
  const handleChange = useCallback(
    ({ target: { name, value, type, checked }, isSpecial = false }) => {
      // 確保在任何變更時，清除相關錯誤

      if (isSpecial) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      } else if (name.includes(".")) {
        const [parent, child] = name.split(".");
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]:
            type === "number"
              ? value === ""
                ? ""
                : Number(value)
              : type === "checkbox" // <-- 關鍵的布林值處理邏輯
              ? checked
              : value,
        }));
      }

      // 由於我們在這裡執行完整的驗證，這個即時的錯誤清除邏輯可以簡化
      // 但為了保持原樣，僅確保錯誤在變更時被清空一次
    },
    [setFormData, errors] // 依賴 errors 確保 setErrors({}) 邏輯正確
  );

  const handleCheckboxChange = useCallback(
    (event) => {
      const { name, value, checked } = event.target;

      setFormData((prev) => {
        const currentArray = prev[name] || [];
        if (checked) {
          return {
            ...prev,
            [name]: [...currentArray, value],
          };
        } else {
          return {
            ...prev,
            [name]: currentArray.filter((item) => item !== value),
          };
        }
      });
    },
    [setFormData, errors]
  );

  // 最終提交處理：當 RestaurantFormAdmin 驗證成功後調用
  const handleFormSubmit = async (finalFormData) => {
    setIsSubmitting(true);
    setErrors({}); // 清空舊的錯誤狀態

    console.log("Debug: finalFormData before validation:", finalFormData);
    let finalPhotoUrl = finalFormData.facadePhotoUrls?.[0] || "";

    // 🚨 關鍵新增：使用 cleanData 確保數據中沒有 undefined 和陣列中的 null
    const dataToWrite = cleanData(finalFormData);

    // ----------------------------------------------------
    // ✅ 關鍵修改 2: 執行驗證
    // ----------------------------------------------------
    const dataForValidation = {
      ...dataToWrite, // 🚨 使用清理後的數據進行驗證
      tempSelectedFile: selectedFile, // 將選中的檔案傳給驗證函數
    };

    // 在 Admin 新增模式下， originalFacadePhotoUrls 應為 []
    const validationErrors = validateRestaurantForm(
      dataForValidation,
      false, // 總是 false，因為這是 NewRestaurantModal (新增模式)
      []
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      // 驗證失敗，不執行後續邏輯
      return;
    }
    // 驗證成功，繼續執行 Firebase 寫入邏輯

    try {
      // ----------------------------------------------------
      // Step 1: 預先生成 Firestore Document Reference 以取得 restaurantId
      // ----------------------------------------------------
      const restaurantsColRef = collection(
        db,
        `artifacts/${appId}/public/data/restaurants`
      );
      // 使用 doc() 且不帶參數，Firestore 會在本地產生一個唯一的 ID
      const newRestaurantDocRef = doc(restaurantsColRef);
      const restaurantId = newRestaurantDocRef.id; // 這是我們需要的唯一 ID!

      let fileToUpload = selectedFile; // 預設使用原始檔案

      if (selectedFile) {
        // ----------------------------------------------------
        // Step 2a: 處理圖片：格式轉換、尺寸調整和壓縮
        // ----------------------------------------------------
        setIsUploading(true);

        try {
          const resizedWebpBlob = await new Promise((resolve, reject) => {
            // 使用 Resizer 進行轉換：
            // 最大尺寸 1000px，品質 70，輸出 WEBP 格式
            Resizer.imageFileResizer(
              selectedFile, // 原始檔案 (File 或 Blob)
              1000, // 最大寬度
              1000, // 最大高度
              "WEBP", // 輸出格式
              70, // 品質 (70 是較好的平衡點，可根據需求調整)
              0, // 旋轉
              (uri) => {
                resolve(uri); // 返回 Blob
              },
              "blob"
            );
          });

          if (resizedWebpBlob) {
            fileToUpload = resizedWebpBlob; // 更新為壓縮後的 WebP Blob
          } else {
            console.warn("WebP 轉換失敗，將嘗試上傳原始檔案。");
          }
        } catch (resizeError) {
          console.error("圖片尺寸調整和 WebP 轉換失敗:", resizeError);
          alert("圖片處理失敗，請檢查檔案格式！");
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        }

        // ----------------------------------------------------
        // Step 2b: 上傳 WebP 檔案到 Firebase Storage
        // ----------------------------------------------------

        // 🚨 關鍵修改 2：使用生成的 restaurantId 構建 Storage 路徑，並確保副檔名是 .webp
        const imageRef = ref(
          storage,
          `public/restaurants/${restaurantId}/facade/${Date.now()}.webp`
        );

        // 🚨 關鍵修改 3：使用轉換後的 Blob，並明確指定 Content-Type
        const snapshot = await uploadBytes(imageRef, fileToUpload, {
          contentType: "image/webp", // 強制設定 Content-Type 為 WebP
        });

        finalPhotoUrl = await getDownloadURL(snapshot.ref);

        // 清理本地狀態 (此處略過 UI 清理，因為 Modal 關閉時會清理)
        setIsUploading(false);
      } else {
        finalPhotoUrl = finalPhotoUrl; // 保持現有的 URL 或空字串
      }

      // ----------------------------------------------------
      // Step 3: 構建最終資料並寫入 Firestore
      // ----------------------------------------------------
      const submittedByUid = currentUser?.uid || "admin_manual_entry";

      const finalDataForFirestore = {
        ...dataToWrite, // 🚨 使用清理後的數據 (dataToWrite)
        id: restaurantId, // 將 ID 寫入 document 內 (通常不需要，但有助於查詢)
        facadePhotoUrls: finalPhotoUrl ? [finalPhotoUrl] : [],
        submittedBy: submittedByUid,
        createdAt: serverTimestamp(), // 使用 serverTimestamp 確保時間準確
        updatedAt: serverTimestamp(),
        // 預設 Admin 新增的餐廳狀態為 'approved'
        status: "approved",
      };

      // 使用 setDoc 並指定 newRestaurantDocRef，確保使用預先生成的 ID
      await setDoc(newRestaurantDocRef, finalDataForFirestore);

      // 成功後，調用父組件傳入的 onSubmit 進行後續處理 (例如: 重新整理列表)
      parentOnSubmit(finalDataForFirestore);

      onClose(); // 成功後關閉 Modal
    } catch (error) {
      console.error("提交餐廳表單時發生錯誤:", error);
      // 可以在這裡處理錯誤顯示給用戶
    } finally {
      setIsSubmitting(false);
      setIsUploading(false); // 確保在 finally 中重設
    }
  };

  // 當 Modal 關閉時，重設表單狀態
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setErrors({}); // 確保關閉時錯誤狀態被清除
      if (onRemovePhoto) {
        onRemovePhoto();
      }
      setIsSubmitting(false);
      setIsUploading(false);
    }
  }, [isOpen, onRemovePhoto]);

  // 🚨 移除 Modal 組件，改用 div 模擬
  if (!isOpen) return null;

  return (
    // 模擬 Modal 背景遮罩 (fixed inset-0 z-50 overflow-y-auto...)
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex items-start justify-center p-4">
      {/* 模擬 Modal 內容容器 
          ✅ 調整：將 max-w-5xl 移到這裡，並確保內容能滾動 */}
      <div className="bg-white rounded-lg shadow-xl relative w-full max-w-5xl mt-12 mb-12">
        {/* ✅ 調整：移除 min-h-[500px] 和 max-h-[90vh]，讓內層表單控制內容高度和滾動 */}
        <div className="p-4 md:p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">
            新增餐廳資訊 (Admin)
          </h3>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition z-20 text-3xl font-light leading-none"
            disabled={isSubmitting || isUploading}
            aria-label="Close modal"
          >
            &times;
          </button>

          {/* 🚨 關鍵變更 4: 使用 RestaurantFormAdmin 組件 */}
          <RestaurantFormAdmin
            formData={formData}
            handleChange={handleChange}
            handleCheckboxChange={handleCheckboxChange}
            handleSubmit={handleFormSubmit}
            initialErrors={errors} // ✅ 關鍵修改 3: 將驗證錯誤傳遞給表單組件
            isUpdateForm={false}
            isSubmitting={isSubmitting} // 🎯 使用內部狀態
            isUploading={isUploading} // 🎯 使用內部狀態
            selectedFile={selectedFile}
            onFileChange={onFileChange}
            onRemovePhoto={onRemovePhoto}
          />
        </div>
      </div>
    </div>
  );
};

export default NewRestaurantModal;
