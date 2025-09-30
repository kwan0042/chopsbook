// src/components/restaurant_req/UpdateRestaurantPage.js

"use client";

import React, { useState, useContext, useEffect, useCallback } from "react";
import { AuthContext } from "../../lib/auth-context";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import Modal from "../Modal";
import LoadingSpinner from "../LoadingSpinner";
import RestaurantForm from "./RestaurantForm";
import { useRouter, useSearchParams } from "next/navigation";

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

const DAYS_OF_WEEK = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
];

const UpdateRestaurantPage = ({ onBackToHome }) => {
  const { db, currentUser, appId } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [selectedRestaurantData, setSelectedRestaurantData] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("");
  // 核心狀態：儲存所有步驟的錯誤 { step1: { error1... }, step2: { error2... }, step3: { error3... } }
  // 儘管現在是單頁，我們仍使用此結構傳遞給子組件
  const [allErrors, setAllErrors] = useState({});

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    if (!db || !appId) {
      setLoading(false);
      return;
    }
    const fetchAllRestaurants = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, `artifacts/${appId}/public/data/restaurants`)
        );
        const querySnapshot = await getDocs(q);
        const fetchedRestaurants = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setAllRestaurants(fetchedRestaurants);
        setLoading(false);

        const restaurantIdFromUrl = searchParams.get("restaurantId");
        if (restaurantIdFromUrl) {
          const restaurantToSelect = fetchedRestaurants.find(
            (r) => r.id === restaurantIdFromUrl
          );
          if (restaurantToSelect) {
            handleSelectRestaurant(restaurantIdFromUrl);
          } else {
            setModalMessage("URL 中的餐廳 ID 無效，請重新搜尋。");
            setModalType("error");
            setSelectedRestaurantId(null);
            setSelectedRestaurantData(null);
            setFormData({});
          }
        }
      } catch (error) {
        console.error("獲取餐廳列表失敗:", error);
        setModalMessage(`獲取餐廳列表失敗: ${error.message}`);
        setModalType("error");
        setLoading(false);
      }
    };
    fetchAllRestaurants();
  }, [db, appId, searchParams]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = allRestaurants.filter(
        (r) =>
          r.restaurantName?.["zh-TW"]
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          r.restaurantName?.en
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [searchQuery, allRestaurants]);

  const handleSelectRestaurant = async (restaurantId) => {
    setSelectedRestaurantId(restaurantId);
    setSearchQuery("");
    setFilteredSuggestions([]);
    setSubmitting(true);
    setAllErrors({}); // 清除所有錯誤
    try {
      const docRef = doc(
        db,
        `artifacts/${appId}/public/data/restaurants`,
        restaurantId
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();

        // 儲存原始照片 URL，但清空表單用的 facadePhotoUrls
        const originalFacadePhotoUrls = data.facadePhotoUrls || [];
        const facadePhotoUrlsForForm = []; // 清空，要求用戶重新上傳或確認

        const businessHours = DAYS_OF_WEEK.map((day) => {
          const existingHour = Array.isArray(data.businessHours)
            ? data.businessHours.find((bh) => bh.day === day)
            : null;

          return {
            day: day,
            isOpen: existingHour?.isOpen ?? false,
            startTime: existingHour?.startTime ?? "10:00",
            endTime: existingHour?.endTime ?? "20:00",
          };
        });

        const initialNoChineseName = !data.restaurantName?.["zh-TW"];

        // 清空聯絡人資訊，強制用戶輸入本次更新的聯絡人
        const contactName = "";
        const contactPhone = "";
        const contactEmail = "";

        const restaurantWithId = {
          id: restaurantId,
          ...data,
          originalFacadePhotoUrls: originalFacadePhotoUrls,
          facadePhotoUrls: facadePhotoUrlsForForm,
          businessHours,
          noChineseName: initialNoChineseName,
          contactName: contactName,
          contactPhone: contactPhone,
          contactEmail: contactEmail,
        };
        setSelectedRestaurantData(restaurantWithId);
        setFormData(restaurantWithId);
      } else {
        setModalMessage("找不到選擇的餐廳資料。");
        setModalType("error");
        setSelectedRestaurantId(null);
        setSelectedRestaurantData(null);
        setFormData({});
      }
    } catch (error) {
      console.error("獲取選擇餐廳資料失敗:", error);
      setModalMessage(`獲取餐廳資料失敗: ${error.message}`);
      setModalType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      let newFormData = { ...prev };

      if (name === "noChineseName") {
        newFormData[name] = checked;
        if (checked) {
          newFormData.restaurantName = {
            ...prev.restaurantName,
            ["zh-TW"]: "",
          };
        }
      } else if (name === "facadePhotoUrls") {
        newFormData.facadePhotoUrls = Array.isArray(value) ? value : [];
      } else if (name.startsWith("restaurantName.")) {
        const lang = name.split(".")[1];
        newFormData.restaurantName = {
          ...prev.restaurantName,
          [lang]: value,
        };
        if (lang === "zh-TW" && value) {
          newFormData.noChineseName = false;
        }
      } else {
        newFormData[name] = type === "checkbox" ? checked : value;
      }

      return newFormData;
    });
  };

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;

    setFormData((prev) => {
      const currentArray = prev[name] || [];
      const newArray = checked
        ? [...currentArray, value]
        : currentArray.filter((item) => item !== value);

      const newFormData = { ...prev, [name]: newArray };

      return newFormData;
    });
  };

  /**
   * 核心函數：接收子組件的錯誤並更新到父組件的 allErrors 狀態
   * 由於現在是單頁面，這個函數只負責將子組件的錯誤結構化儲存
   */
  const handleUpdateStepErrors = useCallback((stepKey, stepErrors) => {
    setAllErrors((prev) => ({
      ...prev,
      [stepKey]: Object.keys(stepErrors).length > 0 ? stepErrors : undefined, // 確保沒有錯誤時，保持物件整潔
    }));
  }, []);

  /**
   * 最終提交：檢查所有步驟的錯誤狀態，並在有錯誤時阻止提交。
   */
  const handleSubmit = async (e, updatedFormDataWithImageUrl) => {
    e.preventDefault();
    setSubmitting(true);
    setModalMessage("");
    setModalType("");

    try {
      if (!db || !currentUser || !selectedRestaurantId) {
        throw new Error("請先登入並選擇餐廳才能提交更新申請。");
      }

      // 1. 檢查所有步驟的錯誤 (從 allErrors 狀態中提取)
      // 注意：在單頁模式下，RestaurantForm 會在本地執行 validateAll 並更新 allErrors
      // 這裡只需要檢查 allErrors 是否有任何錯誤
      let hasGlobalError = false;

      for (const stepKey of ["step1", "step2", "step3"]) {
        // 使用 step key (非 ID)
        const stepErrors = allErrors[stepKey] || {};
        if (Object.keys(stepErrors).length > 0) {
          hasGlobalError = true;
          break;
        }
      }

      if (hasGlobalError) {
        // 錯誤訊息已在 RestaurantForm 內部處理，這裡只需要拋出錯誤阻止提交
        throw new Error("表單驗證失敗。請檢查紅色標記的欄位並更正錯誤。");
      }

      // 2. Data Preparation
      const dataToValidate = { ...updatedFormDataWithImageUrl };
      delete dataToValidate.noChineseName;
      delete dataToValidate.originalFacadePhotoUrls;
      // 確保在提交到資料庫前，我們不再需要 tempSelectedFile
      delete dataToValidate.tempSelectedFile;
      const dataToSubmit = { ...dataToValidate };

      if (dataToSubmit.avgSpending) {
        dataToSubmit.avgSpending = parseInt(dataToSubmit.avgSpending, 10);
      }
      if (dataToSubmit.priority) {
        dataToSubmit.priority = parseInt(dataToSubmit.priority, 10);
      }

      if (dataToSubmit.phone) {
        dataToSubmit.phone = String(dataToSubmit.phone);
      }
      if (dataToSubmit.contactPhone) {
        dataToSubmit.contactPhone = String(dataToSubmit.contactPhone);
      }

      // 3. Change Detection
      const updateApplicationsRef = collection(
        db,
        `artifacts/${appId}/public/data/restaurant_requests`
      );

      const changes = {};
      const fieldsToCheck = Object.keys(dataToSubmit);

      const originalDataForComparison = {
        ...selectedRestaurantData,
        // 用原始照片 URL 進行比對
        facadePhotoUrls: selectedRestaurantData.originalFacadePhotoUrls,
        // 聯絡人資料比較：由於我們在表單裡清空了，這裡必須從原始資料中拿來比較
        contactName: selectedRestaurantData.contactName || "",
        contactPhone: selectedRestaurantData.contactPhone || "",
        contactEmail: selectedRestaurantData.contactEmail || "",
      };

      fieldsToCheck.forEach((field) => {
        if (field === "id" || field === "originalFacadePhotoUrls") return;

        const formValue = dataToSubmit[field];
        const originalValue = originalDataForComparison?.[field];

        const v1 = formValue ?? null;
        const v2 = originalValue ?? null;

        if (Array.isArray(v1) && Array.isArray(v2)) {
          if (
            JSON.stringify([...v1].sort()) !== JSON.stringify([...v2].sort())
          ) {
            changes[field] = { value: v1, status: "pending" };
          }
        } else if (
          typeof v1 === "object" &&
          typeof v2 === "object" &&
          v1 !== null &&
          v2 !== null
        ) {
          if (JSON.stringify(v1) !== JSON.stringify(v2)) {
            changes[field] = { value: v1, status: "pending" };
          }
        } else if (JSON.stringify(v1) !== JSON.stringify(v2)) {
          changes[field] = { value: v1, status: "pending" };
        }
      });

      // 4. Handle No Changes
      if (Object.keys(changes).length === 0) {
        const msg = "您沒有做出任何更改。";
        setModalMessage(msg);
        setModalType("info");
        return;
      }

      // 5. Submission
      await addDoc(updateApplicationsRef, {
        restaurantId: selectedRestaurantId,
        changes: changes,
        type: "update",
        submittedBy: currentUser.uid,
        submittedAt: serverTimestamp(),
        status: "pending",
      });

      // 6. Success Message
      const successMsg =
        "謝謝你使用ChopsBook，\n" +
        "提供餐廳資訊為廣大嘅美食家作出貢獻。\n" +
        "幕後團隊將火速審批！";
      setModalMessage(successMsg);
      setModalType("success");

      setSelectedRestaurantId(null);
      setSelectedRestaurantData(null);
      setFormData({});
      setSearchQuery("");
      setFilteredSuggestions([]);
      setAllErrors({});
    } catch (error) {
      console.error("提交餐廳更新申請失敗:", error);

      if (!error.message.includes("表單驗證失敗")) {
        const errorMsg = `提交失敗: ${error.message || "未知錯誤"}`;
        setModalMessage(errorMsg);
        setModalType("error");
      } else {
        // 處理來自 RestaurantForm 的驗證失敗訊息
        setModalMessage(error.message);
        setModalType("error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalMessage("");
    setModalType("");
    if (modalType === "success") {
      onBackToHome();
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    // 更改主要容器以支援全寬，移除 max-w-7xl 等寬度限制
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start font-inter">
      {/* 核心修改點：將 max-w-4xl 替換為 w-full，讓表單容器佔滿可用寬度 */}
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-7xl relative">
        <button
          onClick={onBackToHome}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors flex items-center"
          aria-label="返回商戶專區"
        >
          <ArrowLeftIcon className="mr-2" />
          返回
        </button>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">
          提交餐廳更新申請
        </h2>
        <p className="text-gray-600 text-center mb-8">
          搜尋並選擇您要更新的餐廳，然後填寫您要修改的資訊。更新將需要管理員審核。
        </p>
        {selectedRestaurantId ? null : (
          <div className="mb-8 relative">
            <label
              htmlFor="searchRestaurant"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              搜尋餐廳名稱
            </label>
            <input
              type="text"
              id="searchRestaurant"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="輸入餐廳名稱 (中文或英文)"
            />
            {searchQuery && filteredSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredSuggestions.map((restaurant) => (
                  <li
                    key={restaurant.id}
                    onClick={() => handleSelectRestaurant(restaurant.id)}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  >
                    {restaurant.restaurantName?.["zh-TW"]} (
                    {restaurant.restaurantName?.en})
                  </li>
                ))}
              </ul>
            )}
            {searchQuery && filteredSuggestions.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">沒有找到匹配的餐廳。</p>
            )}
          </div>
        )}

        {selectedRestaurantId && (
          <RestaurantForm
            formData={formData}
            selectedRestaurantData={selectedRestaurantData}
            handleChange={handleChange}
            handleCheckboxChange={handleCheckboxChange}
            handleSubmit={handleSubmit}
            isLoading={submitting}
            submitButtonText="提交餐廳更新申請"
            isUpdateForm={true}
            errors={allErrors} // 將所有錯誤傳遞給子組件
            handleUpdateStepErrors={handleUpdateStepErrors} // 傳遞錯誤更新回調
          />
        )}
      </div>
      {modalMessage && (
        <Modal
          message={modalMessage}
          onClose={closeModal}
          isOpen={!!modalMessage}
          duration={modalType === "success" ? 2000 : 0}
          type={modalType}
        />
      )}
    </div>
  );
};

export default UpdateRestaurantPage;
