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
  where,
  limit, // 引入 limit
  startAfter, // 引入 startAfter
  orderBy, // 🚨 新增：引入 orderBy
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

// 圖標：用於載入中
const RefreshIcon = ({ className = "" }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
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

// 分頁設定
const PAGE_SIZE = 10;
const LIMIT_COUNT = PAGE_SIZE + 1; // 查詢 11 筆，保留第 11 筆作為下一頁的錨點

const UpdateRestaurantPage = ({ onBackToHome }) => {
  const { db, currentUser, appId } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [finalSearchQuery, setFinalSearchQuery] = useState("");

  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  // 新增狀態：用於儲存下一個分頁的起始錨點 (第 11 個文件)
  const [lastVisible, setLastVisible] = useState(null);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [selectedRestaurantData, setSelectedRestaurantData] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("");
  const [allErrors, setAllErrors] = useState({});

  // 輔助函數：檢查字串是否包含中文
  const isChinese = (str) => {
    if (!str) return false;
    return /[\u4e00-\u9fff]/.test(str);
  };

  /**
   * 輔助函數：計算範圍查詢的結束字串
   */
  const getEndPrefix = (start) => {
    if (!start) return start;
    const lastChar = start.slice(-1);
    const rest = start.slice(0, -1);
    // 將最後一個字元的 Unicode 值加 1
    const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
    return rest + nextChar;
  };

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  /**
   * 處理搜尋按鈕點擊事件，並重置所有分頁狀態
   */
  const handleSearch = () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery === finalSearchQuery.trim()) return;

    setFinalSearchQuery(trimmedQuery);
    setFilteredSuggestions([]); // 清除舊的建議
    setLastVisible(null); // ⚠️ 重置分頁錨點
  };

  /**
   * 處理「顯示更多」按鈕點擊事件，觸發下一頁的載入
   */
  const loadMore = () => {
    // 只有當 lastVisible 存在時，才執行下一頁查詢
    if (lastVisible) {
      // 重新設定 finalSearchQuery 來觸發 useEffect (如果需要，但這裡直接呼叫 fetchSuggestions 更好)
      // setFinalSearchQuery((prev) => prev.trim());
      fetchSuggestions(true); // 呼叫查詢函數，並標記為載入更多
    }
  };

  /**
   * 核心函數：根據 finalSearchQuery 和 lastVisible 進行分頁查詢
   * isLoadMore: 標記是否為載入更多操作
   */
  const fetchSuggestions = async (isLoadMore = false) => {
    // 只有在 finalSearchQuery 存在，或者正在載入更多（此時 lastVisible 必須存在）時才執行
    if (!db || !appId || (!finalSearchQuery && !isLoadMore)) {
      if (!isLoadMore) {
        setFilteredSuggestions([]);
        setLastVisible(null);
      }
      return;
    }

    // 如果是第一次搜尋，且 finalSearchQuery 為空，則不執行
    const queryText = finalSearchQuery.trim();
    if (!queryText && !isLoadMore) return;

    setLoading(true);

    const restaurantsRef = collection(
      db,
      `artifacts/${appId}/public/data/restaurants`
    );

    const isZh = isChinese(queryText);

    let baseQuery;
    let orderByField; // 🚨 修正：新增排序欄位變數
    let start;
    let end;

    // 1. 構建基礎查詢 (包含 where 條件和 orderBy 條件)
    if (isZh) {
      start = queryText;
      end = getEndPrefix(queryText);
      orderByField = "restaurantName.zh-TW"; // 🚨 修正：設定排序欄位

      baseQuery = query(
        restaurantsRef,
        where(orderByField, ">=", start),
        where(orderByField, "<", end),
        orderBy(orderByField) // 🚨 修正：明確加上 orderBy (升序)
      );
    } else {
      start = queryText.toLowerCase();
      end = getEndPrefix(start);
      orderByField = "name_lowercase_en"; // 🚨 修正：設定排序欄位

      baseQuery = query(
        restaurantsRef,
        where(orderByField, ">=", start),
        where(orderByField, "<", end),
        orderBy(orderByField) // 🚨 修正：明確加上 orderBy (升序)
      );
    }

    // 2. 應用 startAfter 和 limit
    let finalQuery;

    // 🚨 修正：簡化 startAfter 邏輯，直接使用 lastVisible（它是 DocumentSnapshot）
    const startAfterDoc =
      isLoadMore && lastVisible ? [startAfter(lastVisible)] : [];

    finalQuery = query(
      baseQuery,
      ...startAfterDoc, // 傳遞 DocumentSnapshot
      limit(LIMIT_COUNT)
    );

    try {
      const querySnapshot = await getDocs(finalQuery);

      // 提取結果
      const fetchedDocs = querySnapshot.docs;

      // 取得實際結果（前 PAGE_SIZE 筆）
      const newRestaurants = fetchedDocs.slice(0, PAGE_SIZE).map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // 取得下一頁的錨點 (第 11 筆文件)
      const nextLastVisible =
        fetchedDocs.length > PAGE_SIZE
          ? fetchedDocs[PAGE_SIZE - 1] // 🚨 修正索引：第 11 個文件是索引 10，但因為我們 slice(0, PAGE_SIZE)，所以這裡是 PAGE_SIZE (也就是 10)
          : null; // 如果不足 11 筆，則沒有下一頁了

      // 🚨 注意：fetchedDocs.length > PAGE_SIZE 時，第 11 個文件的索引是 PAGE_SIZE (即 10)。
      // 原始代碼中是 fetchedDocs[PAGE_SIZE]，這是正確的。
      // 如果您的 LIST 是從 0 開始，第 11 個是索引 10。

      const actualNextLastVisible =
        fetchedDocs.length > PAGE_SIZE
          ? fetchedDocs[PAGE_SIZE] // 這是第 11 個文件 (索引為 10)
          : null;

      // 更新狀態
      setFilteredSuggestions((prev) =>
        isLoadMore ? [...prev, ...newRestaurants] : newRestaurants
      );
      setLastVisible(actualNextLastVisible); // 🚨 修正：使用正確的 nextLastVisible 變數
    } catch (error) {
      console.error("搜尋餐廳失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  // 處理初始搜尋或搜尋字串變化的 useEffect
  useEffect(() => {
    // 只有當 finalSearchQuery 改變，或者從無到有時，才執行新的搜尋
    // 🚨 修正：只有在非載入更多時，才進行 fetchSuggestions(false)
    if (db && appId && finalSearchQuery && !lastVisible) {
      fetchSuggestions(false);
    } else if (!finalSearchQuery) {
      // 如果 finalSearchQuery 被清空（例如選中餐廳後）
      setFilteredSuggestions([]);
      setLastVisible(null);
    }
    // 由於 loadMore 直接呼叫 fetchSuggestions(true)，這裡不需要監聽 lastVisible
    // 但我們保留 finalSearchQuery 的依賴項以處理新的搜尋
  }, [finalSearchQuery, db, appId]);

  /**
   * 處理 URL 參數，不全量獲取餐廳列表
   */
  useEffect(() => {
    if (!db || !appId) {
      setLoading(false);
      return;
    }

    // 檢查是否有 URL 中的餐廳 ID，如果有，直接載入該餐廳資料
    const restaurantIdFromUrl = searchParams.get("restaurantId");
    if (restaurantIdFromUrl) {
      setLoading(true);
      handleSelectRestaurant(restaurantIdFromUrl)
        .then((success) => {
          if (!success) {
            setModalMessage("URL 中的餐廳 ID 無效，請重新搜尋。");
            setModalType("error");
            setSelectedRestaurantId(null);
            setSelectedRestaurantData(null);
            setFormData({});
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // 如果沒有 URL ID，則停止 loading 狀態，等待用戶搜尋
      setLoading(false);
    }
  }, [db, appId, searchParams]); // 依賴項保持不變

  // 將 handleSelectRestaurant 變為一個返回成功/失敗的函數
  const handleSelectRestaurant = async (restaurantId) => {
    setSelectedRestaurantId(restaurantId);
    setSearchQuery("");
    setFinalSearchQuery(""); // 清空查詢字串
    setFilteredSuggestions([]);
    setLastVisible(null); // ⚠️ 重置分頁錨點

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

        // 儲存原始照片 URL，但清空表單用的 facadePhotoUrls (為了強制用戶新增/更改)
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
        return true; // 成功
      } else {
        setModalMessage("找不到選擇的餐廳資料。");
        setModalType("error");
        setSelectedRestaurantId(null);
        setSelectedRestaurantData(null);
        setFormData({});
        return false; // 失敗
      }
    } catch (error) {
      console.error("獲取選擇餐廳資料失敗:", error);
      setModalMessage(`獲取餐廳資料失敗: ${error.message}`);
      setModalType("error");
      return false; // 失敗
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
      let hasGlobalError = false;

      for (const stepKey of ["step1", "step2", "step3"]) {
        const stepErrors = allErrors[stepKey] || {};
        if (Object.keys(stepErrors).length > 0) {
          hasGlobalError = true;
          break;
        }
      }

      if (hasGlobalError) {
        throw new Error("表單驗證失敗。請檢查紅色標記的欄位並更正錯誤。");
      }

      // 2. Data Preparation
      const dataToValidate = { ...updatedFormDataWithImageUrl };
      delete dataToValidate.noChineseName;
      delete dataToValidate.originalFacadePhotoUrls;
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

      const originalUrls = selectedRestaurantData.originalFacadePhotoUrls || [];

      const excludedFields = ["contactName", "contactPhone", "contactEmail"];

      const originalDataForComparison = {
        ...selectedRestaurantData,
        facadePhotoUrls: originalUrls,
        contactName: selectedRestaurantData.contactName || "",
        contactPhone: selectedRestaurantData.contactPhone || "",
        contactEmail: selectedRestaurantData.contactEmail || "",
      };

      fieldsToCheck.forEach((field) => {
        if (field === "id" || field === "originalFacadePhotoUrls") return;
        if (excludedFields.includes(field)) return;

        const formValue = dataToSubmit[field];
        const originalValue = originalDataForComparison?.[field];

        const v1 = formValue ?? null;
        const v2 = originalValue ?? null;

        if (field === "facadePhotoUrls") {
          const newUrls = Array.isArray(v1) ? v1 : [];

          if (newUrls.length > 0) {
            const mergedUrls = [...originalUrls, ...newUrls];
            changes[field] = { value: mergedUrls, status: "pending" };
          }
          return;
        }

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
        "謝謝你使用ChopsBook，\n" + "ChopsBook已經收到你的\n" + "更新餐廳申請";
      setModalMessage(successMsg);
      setModalType("success");

      setSelectedRestaurantId(null);
      setSelectedRestaurantData(null);
      setFormData({});
      setSearchQuery("");
      setFinalSearchQuery("");
      setFilteredSuggestions([]);
      setLastVisible(null); // 清除錨點
      setAllErrors({});
    } catch (error) {
      console.error("提交餐廳更新申請失敗:", error);

      if (!error.message.includes("表單驗證失敗")) {
        const errorMsg = `提交失敗: ${error.message || "未知錯誤"}`;
        setModalMessage(errorMsg);
        setModalType("error");
      } else {
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

  // 僅當初始載入時顯示全屏 loading
  if (loading && !selectedRestaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  const showSearchLoading =
    loading && finalSearchQuery && !selectedRestaurantId;

  return (
    <div className=" p-4 sm:p-6 lg: flex flex-col items-center justify-start font-inter">
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
            <div className="flex space-x-2">
              <input
                type="text"
                id="searchRestaurant"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // 阻止表單預設提交行為
                    handleSearch();
                  }
                }}
                className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="輸入餐廳名稱的前幾個字 (中文或英文)"
              />
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || showSearchLoading}
                className={`px-6 py-3 text-white font-semibold rounded-md transition-colors flex items-center justify-center ${
                  searchQuery.trim()
                    ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {showSearchLoading ? (
                  <RefreshIcon className="w-5 h-5 mr-2" />
                ) : (
                  "搜尋"
                )}
              </button>
            </div>

            {/* 搜尋結果顯示區塊 */}

            {/* 載入中狀態 */}
            {showSearchLoading && filteredSuggestions.length === 0 ? (
              <div className="mt-4 flex items-center justify-center p-4 bg-white rounded-md border border-gray-200 shadow-sm">
                <RefreshIcon className="w-5 h-5" />
                <span className="ml-2 text-gray-600">正在搜尋...</span>
              </div>
            ) : (
              <>
                {/* 搜尋結果列表 */}
                {finalSearchQuery && filteredSuggestions.length > 0 && (
                  <ul className="bg-white border border-gray-300 w-full mt-4  max-h-96 overflow-y-auto">
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

                {/* 顯示更多按鈕 */}
                {lastVisible && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className={`w-full py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center ${
                        loading
                          ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                          : "bg-indigo-500 text-white hover:bg-indigo-600"
                      }`}
                    >
                      {loading ? (
                        <>
                          <RefreshIcon className="w-4 h-4 mr-2" />
                          正在載入...
                        </>
                      ) : (
                        "顯示更多結果"
                      )}
                    </button>
                  </div>
                )}

                {/* 沒有結果訊息 (僅在搜尋字串非空，且結果列表為空，且不是正在載入時顯示) */}
                {finalSearchQuery &&
                  filteredSuggestions.length === 0 &&
                  !showSearchLoading && (
                    <p className="mt-4 p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                      抱歉，沒有找到名稱以 {finalSearchQuery} 開頭的餐廳。
                    </p>
                  )}
              </>
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
