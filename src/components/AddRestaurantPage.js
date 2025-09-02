"use client";

import React, { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../lib/auth-context";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import LoadingSpinner from "./LoadingSpinner";
import Modal from "./Modal";
import RestaurantForm from "./RestaurantForm"; // 導入 RestaurantForm
import { useRouter } from "next/navigation";
import { validateRestaurantForm } from "../lib/validation"; // 導入新的驗證函數

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
    restaurantNameZh: "",
    restaurantNameEn: "",
    province: "",
    city: "",
    fullAddress: "",
    phone: "",
    website: "",
    cuisineType: "",
    restaurantType: "",
    avgSpending: "",
    facadePhotoUrl: "",
    seatingCapacity: "",
    businessHours: "",
    reservationModes: [],
    paymentMethods: [],
    facilitiesServices: [],
    otherInfo: "",
    isManager: false,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState(""); // "success" or "error"
  const [errors, setErrors] = useState({}); // 新增 state 來管理驗證錯誤

  const closeModal = () => {
    setModalMessage("");
    setModalType("");
    if (modalType === "success") {
      onBackToHome(); // 新增成功後返回商戶專區
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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

  const handleSubmit = async (e, updatedFormData) => {
    e.preventDefault();
    setLoading(true);
    setModalMessage("");
    setModalType("");
    setErrors({}); // 每次提交前先清除舊的錯誤

    const dataToValidate = updatedFormData || formData;
    const validationErrors = validateRestaurantForm(dataToValidate);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return; // 發現錯誤，停止提交
    }

    if (!db || !currentUser || !appId) {
      setModalMessage("錯誤：數據庫服務未準備或用戶未登入。");
      setModalType("error");
      setLoading(false);
      return;
    }

    const dataToSubmit = updatedFormData || formData;

    try {
      await addDoc(
        collection(db, `artifacts/${appId}/public/data/add_rest_request`),
        {
          ...dataToSubmit,
          submittedBy: currentUser.uid,
          createdAt: serverTimestamp(),
          status: "pending", // 新增的欄位
        }
      );
      setModalMessage(
        "謝謝你使用ChopsBook" +
          "/br" +
          "提供餐廳資訊 為廣大嘅美食家作出貢獻 幕後團隊將火速審批"
      );
      setModalType("success");
      setFormData(initialFormData); // 清空表單
      setErrors({}); // 成功後清空錯誤
    } catch (err) {
      console.error("新增餐廳失敗:", err);
      setModalMessage(`新增餐廳失敗：${err.message}`);
      setModalType("error");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    // 如果用戶未登入，這裡不應顯示，因為父級頁面已處理重定向
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center font-inter">
      <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 w-full max-w-4xl relative">
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
          errors={errors}
        />
      </div>

      {modalMessage && (
        <Modal
          message={modalMessage}
          onClose={closeModal}
          isOpen={!!modalMessage}
          duration={modalType === "success" ? 5000 : 0} // 成功訊息顯示 5 秒
          type={modalType}
        />
      )}
    </div>
  );
};

export default AddRestaurantPage;
