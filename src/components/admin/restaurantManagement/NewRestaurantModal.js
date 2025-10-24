// src/components/admin/restaurantManagement/NewRestaurantModal.js
"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
// 🚨 關鍵修改 1：導入 Resizer 庫用於圖片處理
import Resizer from "react-image-file-resizer";
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
  noChineseName: false,
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
              : type === "checkbox"
              ? checked
              : value,
        }));
      }

      setErrors((prev) => {
        const errorKey = name.replace(".", "_");
        if (prev[errorKey]) {
          const { [errorKey]: removed, ...rest } = prev;
          return rest;
        }
        return prev;
      });
    },
    [setFormData, setErrors]
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
    [setFormData]
  );

  // 最終提交處理：當 RestaurantFormAdmin 驗證成功後調用
  const handleFormSubmit = async (finalFormData) => {
    setIsSubmitting(true);
    let finalPhotoUrl = finalFormData.facadePhotoUrls?.[0] || "";

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
        ...finalFormData,
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
      setErrors({});
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
    // 模擬 Modal 背景遮罩
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex items-start justify-center p-4">
      {/* 模擬 Modal 內容容器 */}
      <div className="bg-white rounded-lg shadow-xl relative w-full max-w-5xl mt-12 mb-12">
        <div className="overflow-y-auto max-h-[90vh] p-8 min-h-[500px]">
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
            // setErrors={setErrors} // 這裡不需要傳遞 setErrors，因為父組件已經接管了提交
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
