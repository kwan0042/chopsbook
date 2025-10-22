// src/components/admin/restaurantManagement/NewRestaurantModal.js
"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
// 🚨 僅修改此處：導入新的 Admin 專用表單組件
import RestaurantFormAdmin from "./RestaurantFormAdmin.js";
import { AuthContext } from "@/lib/auth-context"; // <-- 確保路徑正確

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
  createdAt:"", 
};

// -------------------------------------------------------------
// 組件本身
// -------------------------------------------------------------
const NewRestaurantModal = ({
  isOpen,
  onClose,
  onSubmit: parentOnSubmit,
  isSubmitting,
  selectedFile,
  onFileChange,
  onRemovePhoto,
  isUploading,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  // 🎯 修正點 1: 使用 AuthContext 獲取當前用戶
  const { currentUser } = useContext(AuthContext);

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
  const handleFormSubmit = (finalFormData) => {
    // 🚨 這是從 RestaurantFormAdmin 傳入的最終表單數據

    // 🎯 修正點 2: 檢查 currentUser 並添加 submittedBy 欄位
    let dataWithSubmitter = finalFormData;

    if (currentUser && currentUser.uid) {
      dataWithSubmitter = {
        ...finalFormData,
        submittedBy: currentUser.uid, // 使用當前用戶的 ID
      };
    } else {
      // 警告：如果沒有用戶，應該記錄錯誤或阻止提交
      console.warn(
        "提交表單時 currentUser.uid 不可用，使用預設值 'Admin' 或阻止提交。"
      );
    }

    parentOnSubmit(dataWithSubmitter); // 提交包含 userId 的數據
  };

  // 當 Modal 關閉時，重設表單狀態
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setErrors({});
      if (onRemovePhoto) {
        onRemovePhoto();
      }
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
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            &times;
          </button>

          {/* 🚨 關鍵變更 3: 使用 RestaurantFormAdmin 組件 */}
          <RestaurantFormAdmin
            formData={formData}
            handleChange={handleChange}
            handleCheckboxChange={handleCheckboxChange}
            handleSubmit={handleFormSubmit}
            errors={errors}
            setErrors={setErrors}
            isUpdateForm={false}
            // Admin 模式的狀態
            isSubmitting={isSubmitting}
            isUploading={isUploading}
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
