// src/components/admin/restaurantManagement/EditRestaurantModal.js
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
} from "react";
// 🚨 關鍵修改 1: 導入 Resizer 庫用於圖片處理
import Resizer from "react-image-file-resizer";
// ✅ 關鍵修改 2: 導入 Admin 專用驗證函數
import { validateRestaurantForm } from "@/lib/validation-admin";
// 🚨 僅修改此處：導入 Admin 專用表單組件
import RestaurantFormAdmin from "./RestaurantFormAdmin.js";
import { AuthContext } from "@/lib/auth-context"; // <-- 確保路徑正確

// 🎯 導入 Firebase 相關功能
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
// 🔥 關鍵修改：導入 deleteObject 函式
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"; 
import LoadingSpinner from "@/components/LoadingSpinner";

// -------------------------------------------------------------
// 組件本身
// -------------------------------------------------------------
// ... (props 註解略)
const EditRestaurantModal = ({
  RESTAURANT_FIELDS, // 保持傳入，儘管在此檔案中未使用
  isOpen,
  onClose,
  restaurantId,
  initialData,
  selectedFile,
  onFileChange,
  onRemovePhoto,
}) => {
  // 🎯 關鍵修改 1: 將 formData 初始化為 null，並在 useEffect 中設置
  const [formData, setFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 🎯 使用 AuthContext 獲取當前用戶
  const { appId, storage, db, currentUser } = useContext(AuthContext);

  // 判斷表單數據是否被修改 (必須依賴 initialData 和 formData 都在)
  const isModified = useMemo(() => {
    if (!formData || !initialData) return false;

    // 排除 updatedAt, createdAt, id, submittedBy 進行比較
    const cleanFormData = { ...formData };
    delete cleanFormData.updatedAt;
    delete cleanFormData.createdAt;
    delete cleanFormData.id;
    delete cleanFormData.submittedBy;

    const cleanInitialData = { ...initialData };
    delete cleanInitialData.updatedAt;
    delete cleanInitialData.createdAt;
    delete cleanInitialData.id;
    delete cleanInitialData.submittedBy;

    return (
      JSON.stringify(cleanFormData) !== JSON.stringify(cleanInitialData) ||
      selectedFile !== null
    );
  }, [formData, initialData, selectedFile]);

  // ---------------------------------------------
  // 通用表單變更處理 (與 NewRestaurantModal 相同)
  // ---------------------------------------------
  const handleChange = useCallback(
    ({ target: { name, value, type, checked }, isSpecial = false }) => {
      // 🚨 關鍵修改 3: 移除錯誤狀態清除邏輯
      // 保持錯誤顯示，直到用戶再次提交或關閉 Modal

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

      // 由於您已經決定在提交時處理錯誤，這段即時清除錯誤的邏輯可以被移除
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
    // 🎯 檢查是否有修改，如果沒有，直接返回 (但提交按鈕應該被禁用)
    if (!isModified && !selectedFile) {
      alert("沒有任何變更。");
      onClose(false);
      return;
    }

    // 🚨 關鍵修改 4: 執行 Admin 專用驗證
    setErrors({}); // 提交前清空舊的錯誤狀態

    // 準備驗證所需的數據
    const dataForValidation = {
      ...finalFormData,
      tempSelectedFile: selectedFile, // 將選中的檔案傳給驗證函數
    };
    const originalPhotoUrls = initialData.facadePhotoUrls || [];

    // 執行 Admin 專用驗證。 isUpdate = true
    const validationErrors = validateRestaurantForm(
      dataForValidation,
      true, // 這是編輯模式
      originalPhotoUrls
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // 驗證失敗，不執行後續邏輯
      return;
    }
    // 驗證成功，繼續執行 Firebase 寫入邏輯

    setIsSubmitting(true);
    // 獲取現有的 URL 列表 (可能為空)
    let finalPhotoUrls = finalFormData.facadePhotoUrls || [];

    // 🔥 新增：在開始上傳前，獲取舊的圖片 URL 以便成功上傳後刪除
    const oldPhotoUrl = initialData.facadePhotoUrls?.[0]; // 假設只允許一張門面照

    try {
      // ----------------------------------------------------
      // Step 1: 構建 Firestore Document Reference
      // ----------------------------------------------------
      const restaurantsColPath = `artifacts/${appId}/public/data/restaurants`;
      // 🎯 關鍵變更: 使用傳入的 restaurantId 構建現有的 Document Reference
      const existingRestaurantDocRef = doc(
        db,
        restaurantsColPath,
        restaurantId
      );

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
              70, // 🚨 品質 (70 是較好的平衡點，可根據需求調整)
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

        // 🚨 關鍵修改 A：確保路徑結尾是 .webp
        const imageRef = ref(
          storage,
          `public/restaurants/${restaurantId}/facade/${Date.now()}.webp`
        );

        // 🚨 關鍵修改 B：使用轉換後的 Blob，並明確指定 Content-Type
        const snapshot = await uploadBytes(imageRef, fileToUpload, {
          contentType: "image/webp", // 強制設定 Content-Type 為 WebP
        });

        const newPhotoUrl = await getDownloadURL(snapshot.ref);

        // 🎯 由於是編輯，我們通常替換門面照片 (假設只允許一張)
        finalPhotoUrls = [newPhotoUrl];
        
        // ----------------------------------------------------
        // 🔥 Step 2c: 刪除舊的圖片檔案 (如果存在)
        // ----------------------------------------------------
        if (oldPhotoUrl && storage) {
          try {
            // 嘗試從 URL 提取 Storage 路徑
            // URL 格式: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media...
            const pathPrefix = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/`;
            if (oldPhotoUrl.startsWith(pathPrefix)) {
              let storagePath = oldPhotoUrl.substring(pathPrefix.length);
              storagePath = storagePath.split('?')[0]; // 移除查詢參數
              storagePath = decodeURIComponent(storagePath); // 解碼 (e.g. %2F -> /)

              const oldImageRef = ref(storage, storagePath);
              await deleteObject(oldImageRef);
              console.log("舊圖片已成功從 Storage 刪除:", storagePath);
            } else {
              console.warn("無法解析舊圖片 URL 的儲存路徑，跳過刪除:", oldPhotoUrl);
            }
          } catch (deleteError) {
            // 記錄錯誤，但繼續執行，因為新圖已上傳，不應阻擋 Firestore 更新
            console.error("刪除舊圖片時發生錯誤 (可能檔案不存在或權限問題):", deleteError.message);
          }
        }

        // 清理本地狀態
        setIsUploading(false);
        onRemovePhoto(); // 清除父組件的 selectedFile 狀態
      } else if (
        // 檢查用戶是否在沒有上傳新圖片的情況下清空了圖片列表
        finalPhotoUrls.length === 0 &&
        initialData.facadePhotoUrls &&
        initialData.facadePhotoUrls.length > 0
      ) {
        // finalPhotoUrls 已經是 []，不需要額外設置
      }

      // ----------------------------------------------------
      // Step 3: 構建最終資料並寫入 Firestore
      // ----------------------------------------------------
      const submittedByUid = currentUser?.uid || "admin_manual_entry";

      // 🎯 僅更新修改過的欄位 (或所有欄位，如果 setDoc 是覆蓋模式)
      // 由於 NewModal 使用 setDoc 是全覆蓋，我們也使用 setDoc 保持一致性。
      const finalDataForFirestore = {
        ...finalFormData,
        id: restaurantId, // 將 ID 寫入 document 內
        facadePhotoUrls: finalPhotoUrls,
        // 🚨 編輯時保留 submittedBy，只更新 updatedAt
        updatedAt: serverTimestamp(),
        // 狀態保持不變
        // status: finalFormData.status,
      };

      // 🎯 關鍵變更: 使用 setDoc 並指定現有的 Document Reference 進行更新
      await setDoc(existingRestaurantDocRef, finalDataForFirestore);

      // 成功後，調用父組件傳入的 onClose 進行後續處理 (例如: 重新整理列表)
      onClose(true); // 傳遞 true 表示成功儲存，觸發列表刷新
    } catch (error) {
      console.error("更新餐廳表單時發生錯誤:", error);
      alert("更新失敗: " + error.message);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false); // 確保在 finally 中重設
    }
  };

  // 🎯 關鍵修改 2: 處理 initialData 同步到 formData
  useEffect(() => {
    if (isOpen && initialData) {
      // Modal 開啟時，將傳入的初始數據同步為表單數據
      setFormData(initialData);
      setErrors({});
    } else if (!isOpen) {
      // Modal 關閉時，清理所有狀態
      setFormData(null); // 清理數據，等待下次開啟時重新設置
      setErrors({});
      if (onRemovePhoto) {
        onRemovePhoto();
      }
      setIsSubmitting(false);
      setIsUploading(false);
    }
    // 僅在 isOpen 或 initialData 變動時觸發
  }, [isOpen, initialData, onRemovePhoto]);

  // 🚨 核心檢查點: 如果 Modal 沒有開啟，或者還沒有載入初始數據，則不渲染
  if (!isOpen || !formData) return null;

  return (
    // 模擬 Modal 背景遮罩
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex items-start justify-center p-4">
      {/* 模擬 Modal 內容容器 */}
      <div className="bg-white rounded-lg shadow-xl relative w-full max-w-5xl mt-12 mb-12">
        <div className="overflow-y-auto max-h-[90vh] p-8 min-h-[500px]">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">
            編輯餐廳資訊 (Admin) ID:{" "}
            <span className="text-blue-600">{restaurantId}</span>
          </h3>

          <button
            onClick={() => onClose(false)} // 傳遞 false 表示未儲存 (或取消)
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition z-20 text-3xl font-light leading-none"
            disabled={isSubmitting || isUploading}
            aria-label="Close modal"
          >
            &times;
          </button>

          {isSubmitting && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
              <LoadingSpinner />
            </div>
          )}

          {/* 🚨 使用 RestaurantFormAdmin 組件 */}
          <RestaurantFormAdmin
            formData={formData}
            handleChange={handleChange}
            handleCheckboxChange={handleCheckboxChange}
            handleSubmit={handleFormSubmit}
            // 🎯 關鍵變更: 設置為 true，讓表單知道是編輯模式
            isUpdateForm={true}
            initialErrors={errors} // ✅ 傳遞驗證後的錯誤
            isSubmitting={isSubmitting}
            isUploading={isUploading}
            selectedFile={selectedFile}
            onFileChange={onFileChange}
            onRemovePhoto={onRemovePhoto}
            isModified={isModified} // 將修改狀態傳遞給子組件，用於禁用提交按鈕
          />
        </div>
      </div>
    </div>
  );
};

export default EditRestaurantModal;