"use client";

import React, { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../../lib/auth-context";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import LoadingSpinner from "../LoadingSpinner";
import Modal from "../Modal";
import RestaurantForm from "./RestaurantForm"; // 導入 RestaurantForm
import { useRouter } from "next/navigation";
// 由於驗證已移至 RestaurantForm 內部，這裡不再需要 validateRestaurantForm
// import { validateRestaurantForm } from "../../lib/validation";

// 圖標：用於返回按鈕
const ArrowLeftIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-5 w-5 ${className}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
      clipRule="evenodd"
    />
  </svg>
);

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

/**
 * AddRestaurantPage: 用於新增餐廳的表單頁面。
 *
 * @param {object} props - 組件屬性。
 * @param {function} props.onBackToHome - 返回商戶專區的回調函數。
 */
const AddRestaurantPage = ({ onBackToHome }) => {
  const { db, currentUser, appId } = useContext(AuthContext);
  const router = useRouter();

  // 初始表單數據
  const initialFormData = {
    restaurantName: {
      "zh-TW": "",
      en: "",
    },
    noChineseName: false,
    province: "",
    city: "",
    postalCode: "",
    fullAddress: "",
    phone: "",
    website: "",
    cuisineType: { category: "", subType: "" }, // 確保 cuisineType 是一個物件
    restaurantType: [],
    avgSpending: "",
    facadePhotoUrls: [],
    seatingCapacity: "",
    businessHours: DAYS_OF_WEEK.map((day) => ({
      day,
      isOpen: false,
      startTime: "10:00",
      endTime: "20:00",
    })),
    closedDates: "",
    isHolidayOpen: false,
    holidayHours: "",
    reservationMode: "", // 使用 reservationMode 統一名稱
    paymentMethods: [],
    facilitiesAndServices: [], // 使用 facilitiesAndServices 統一名稱
    otherInfo: "",
    isManager: false,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    awards: "",
    priority: 0,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState(""); // "success" or "error"
  // 錯誤狀態在 RestaurantForm 內部管理，但我們需要它來檢查最終狀態
  // 結構為 { step1: {...}, step2: {...}, step3: {...} }
  const [allErrors, setAllErrors] = useState({});

  const closeModal = () => {
    setModalMessage("");
    setModalType("");
    if (modalType === "success") {
      onBackToHome(); // 新增成功後返回商戶專區
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "noChineseName") {
      setFormData((prev) => {
        const newFormData = { ...prev, [name]: checked };
        if (checked) {
          newFormData.restaurantName = {
            ...prev.restaurantName,
            ["zh-TW"]: "",
          };
        }
        return newFormData;
      });
    }
    // 處理 cuisineType 的物件更新，這裡需要特殊處理，避免覆蓋 subType
    else if (name === "cuisineType" && typeof value === "object") {
      setFormData((prev) => ({
        ...prev,
        cuisineType: value,
      }));
    } else if (name.startsWith("restaurantName")) {
      const lang = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        restaurantName: {
          ...prev.restaurantName,
          [lang]: value,
        },
        noChineseName: lang === "zh-TW" && value ? false : prev.noChineseName,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => {
      const currentArray = prev[name] || [];
      if (checked) {
        return { ...prev, [name]: [...currentArray, value] };
      } else {
        return {
          ...prev,
          [name]: currentArray.filter((item) => item !== value),
        };
      }
    });
  };

  /**
   * 接收 RestaurantForm 內部驗證的結果
   */
  const handleUpdateStepErrors = (stepKey, stepErrors) => {
    setAllErrors((prev) => ({
      ...prev,
      [stepKey]: Object.keys(stepErrors).length > 0 ? stepErrors : undefined,
    }));
  };

  /**
   * 最終提交處理：接收來自 RestaurantForm 驗證成功後的數據
   */
  const handleSubmit = async (e, updatedFormDataWithImageUrl) => {
    e.preventDefault();
    setLoading(true);
    setModalMessage("");
    setModalType("");

    // 由於 RestaurantForm 已經在內部執行了驗證並在有錯誤時阻止了傳遞到這裡，
    // 因此這裡我們主要檢查 Firestore 服務狀態。

    if (!db || !currentUser || !appId) {
      setModalMessage("錯誤：數據庫服務未準備或用戶未登入。");
      setModalType("error");
      setLoading(false);
      return;
    }

    const dataToSubmit = { ...updatedFormDataWithImageUrl };

    // 提交前，移除 transient/helper field
    delete dataToSubmit.noChineseName;
    delete dataToSubmit.tempSelectedFile;
    delete dataToSubmit.originalFacadePhotoUrls; // 確保新增時不會有此欄位

    // 核心：在提交前將特定欄位轉換為數字類型
    if (dataToSubmit.avgSpending) {
      dataToSubmit.avgSpending = parseInt(dataToSubmit.avgSpending, 10);
    }
    if (dataToSubmit.phone) {
      dataToSubmit.phone = String(dataToSubmit.phone).replace(/[^0-9]/g, "");
    }
    if (dataToSubmit.contactPhone) {
      dataToSubmit.contactPhone = String(dataToSubmit.contactPhone).replace(
        /[^0-9]/g,
        ""
      );
    }
    if (dataToSubmit.priority) {
      dataToSubmit.priority = parseInt(dataToSubmit.priority, 10);
    }

    // 確保 cuisineType 結構正確 (RestaurantForm 已經處理，這裡只是冗餘檢查)
    if (
      dataToSubmit.cuisineType &&
      typeof dataToSubmit.cuisineType === "string"
    ) {
      dataToSubmit.cuisineType = {
        category: dataToSubmit.cuisineType,
        subType: "",
      };
    }

    try {
      await addDoc(
        collection(db, `artifacts/${appId}/public/data/restaurant_requests`),
        {
          ...dataToSubmit,
          type: "add",
          submittedBy: currentUser.uid,
          submittedAt: serverTimestamp(),
          status: "pending",
        }
      );
      setModalMessage(
        "謝謝你使用ChopsBook，\n" +
          "提供餐廳資訊為廣大嘅美食家作出貢獻。\n" +
          "幕後團隊將火速審批！"
      );
      setModalType("success");
      setFormData(initialFormData); // 清空表單
      setAllErrors({}); // 成功後清空錯誤
    } catch (err) {
      console.error("新增餐廳失敗:", err);
      setModalMessage(`新增餐廳失敗：${err.message}`);
      setModalType("error");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start font-inter">
      {/* 核心修改：使用 w-full 搭配 max-w-7xl 讓表單在大型螢幕上更寬 */}
      <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 w-full max-w-7xl relative">
        <button
          onClick={onBackToHome}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors flex items-center"
          aria-label="返回商戶專區"
        >
          <ArrowLeftIcon className="mr-2" />
          返回
        </button>
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          新增餐廳
        </h2>
        <RestaurantForm
          formData={formData}
          handleChange={handleChange}
          handleCheckboxChange={handleCheckboxChange}
          handleSubmit={handleSubmit}
          isLoading={loading}
          submitButtonText="新增餐廳"
          isUpdateForm={false}
          errors={allErrors} // 傳遞錯誤狀態
          handleUpdateStepErrors={handleUpdateStepErrors} // 傳遞錯誤回調
        />
      </div>

      {modalMessage && (
        <Modal
          message={modalMessage}
          onClose={closeModal}
          isOpen={!!modalMessage}
          duration={modalType === "success" ? 5000 : 0}
          type={modalType}
        />
      )}
    </div>
  );
};

export default AddRestaurantPage;
