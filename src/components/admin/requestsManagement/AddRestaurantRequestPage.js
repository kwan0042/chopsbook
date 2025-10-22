"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "@/lib/auth-context";
import {
  doc,
  writeBatch,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
// 🚨 假定 serverTimestamp() 已從 firebase/firestore 導入，用於寫入時間戳
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter, useParams } from "next/navigation";
import Modal from "@/components/Modal";
import { restaurantFields, formatDataForDisplay } from "@/lib/translation-data";
import { Image } from "next/image";

// 輔助欄位名稱，用於覆蓋 restaurantFields 中可能不準確的名稱
const fieldDisplayNames = {
  submittedBy: "建立會員 (電郵/UID)",
  isManager: "是否為經理",
};

// 將欄位分組到不同區塊 (🚨 順序和內容已更新)
const restaurantSections = {
  contactInfo: {
    // 🚨 第一個區塊
    zh: "聯絡資訊",
    fields: [
      "submittedBy", // 🚨 建立會員
      "isManager", // 🚨 是否為經理
      "contactName", // 🚨 聯絡人姓名
      "contactPhone", // 🚨 聯絡人電話
    ],
  },
  photos: {
    // 🚨 第二個區塊
    zh: "門面照片",
    fields: ["facadePhotoUrls"],
  },
  basicInfo: {
    // 🚨 第三個區塊
    zh: "基本資訊",
    fields: [
      "restaurantName",
      "category",
      "subCategory",
      "restaurantType",
      "phone", // 餐廳電話 (從舊 Contact 區塊移入)
      "contactEmail", // 餐廳電郵 (從舊 Contact 區塊移入)
      "website", // 網站 (從舊 Contact 區塊移入)
    ],
  },
  location: {
    // 🚨 第四個區塊
    zh: "位置資訊",
    fields: ["province", "city", "fullAddress"],
  },
  details: {
    // 🚨 第五個區塊
    zh: "其他詳細資訊",
    fields: [
      "seatingCapacity",
      "paymentMethods",
      "reservationModes",
      "otherInfo",
      "facilitiesServices",
    ],
  },
  // 移除：isPermanentlyClosed, isTemporarilyClosed, avgSpending, createdAt
};

/**
 * 輔助函數：處理多語言餐廳名稱顯示
 * @param {object} nameObject - 餐廳名稱的多語言物件
 * @returns {string} 顯示名稱
 */
const formatRestaurantName = (nameObject) => {
  if (nameObject && typeof nameObject === "object") {
    return nameObject["zh-TW"] || nameObject.en || "N/A";
  }
  return "N/A";
};

/**
 * 輔助組件：用於顯示圖片或連結
 * @param {object} props - 包含 field 和 value
 * @returns {JSX.Element} 顯示內容
 */
const PhotoDisplay = ({ field, value }) => {
  // 檢查是否為照片欄位
  const isPhotoField = field === "facadePhotoUrls";

  if (!isPhotoField) {
    // 如果不是照片欄位，回傳格式化的文字
    return (
      <pre className="text-gray-800 break-words whitespace-pre-wrap">
        {field === "restaurantName"
          ? formatRestaurantName(value)
          : formatDataForDisplay(value)}
      </pre>
    );
  }

  // 處理單一 URL 或 URL 陣列
  const urls = Array.isArray(value) ? value : value ? [value] : [];

  if (urls.length === 0) {
    return <p className="text-gray-500 italic">無圖片</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {urls.map((url, index) => (
        <div
          key={index}
          className="border border-gray-300 rounded-md overflow-hidden shadow-sm"
        >
          {/* 簡單的圖片 URL 驗證，防止 XSS 或無效內容 */}
          {typeof url === "string" && url.startsWith("http") ? (
            <Image
              src={url}
              alt={`${field} ${index + 1}`}
              className="w-full h-auto object-cover max-h-40"
              loading="lazy"
            />
          ) : (
            <p className="text-red-500 text-xs break-words p-2">無效圖片 URL</p>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * AddRestaurantRequestPage: 餐廳新增審批頁面。
 * 專門處理 requestType === "add" 的請求。
 */
const AddRestaurantRequestPage = ({ requestId }) => {
  const { db, appId, setModalMessage, formatDateTime, currentUser } =
    useContext(AuthContext);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setLocalModalMessage] = useState("");
  const [modalType, setModalType] = useState("");
  const changesSectionRef = useRef(null);

  useEffect(() => {
    // 只有在 db 和 requestId 都可用時才開始載入資料
    if (!db || !requestId) {
      // 保持載入狀態，直到參數可用
      return;
    }

    const collectionPath = `artifacts/${appId}/public/data/restaurant_requests`;
    const requestDocRef = doc(db, collectionPath, requestId);

    console.log("正在載入請求資料。請求 ID:", requestId);
    console.log("Firestore 集合路徑:", collectionPath);

    // 實時監聽請求資料
    const unsubscribe = onSnapshot(
      requestDocRef,
      async (requestDocSnap) => {
        if (!requestDocSnap.exists()) {
          setLocalModalMessage("找不到指定的請求或已處理。");
          setModalType("info");
          setLoading(false);
          setRequestData(null);
          return;
        }

        const reqData = { ...requestDocSnap.data(), id: requestDocSnap.id };
        // 額外檢查 document 的類型是否為 'add'
        if (reqData.type !== "add") {
          setLocalModalMessage("此頁面只處理新增餐廳的申請。");
          setModalType("info");
          setLoading(false);
          setRequestData(null);
          return;
        }

        setRequestData({ ...reqData, type: "add" });
        setLoading(false);
      },
      (error) => {
        console.error("實時監聽請求資料失敗:", error);
        setLocalModalMessage(`實時監聽資料失敗: ${error.message}`);
        setModalType("error");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [db, appId, requestId]);

  const handleApprove = async () => {
    if (isSubmitting || !requestData) return;
    try {
      setIsSubmitting(true);
      const batch = writeBatch(db);

      // 🚨 解構賦值，排除不需要寫入主表的屬性: id, type, submittedAt
      const {
        id,
        type,
        submittedAt,
        contactName, // 需要條件性處理
        contactPhone, // 需要條件性處理
        contactEmail, // 需要條件性處理
        isManager, // 需要條件性處理
        ...newRestaurantData
      } = requestData;

      // 🚨 根據 isManager 條件性地重建聯絡資訊物件
      let finalRestaurantData = {
        ...newRestaurantData,
        isManager: isManager || false,
      }; // 確保 isManager 存在

      if (isManager) {
        // 如果是經理，則保留聯絡資訊
        finalRestaurantData = {
          ...finalRestaurantData,
          contactName: contactName || null,
          contactPhone: contactPhone || null,
          contactEmail: contactEmail || null,
        };
      }
      // 否則， contactName, contactPhone, contactEmail 不會被寫入 finalRestaurantData (因為已在解構時被排除)

      // 將餐廳資料寫入主表，使用新生成的ID
      const restaurantDocRef = doc(
        collection(db, `artifacts/${appId}/public/data/restaurants`)
      );

      // 🚨 使用 finalRestaurantData，並添加 createdAt 和 status
      batch.set(restaurantDocRef, {
        ...finalRestaurantData,
        status: "approved",
        createdAt: serverTimestamp(), // 🚨 新增的欄位
      });

      // 更新請求狀態
      const requestDocRef = doc(
        db,
        `artifacts/${appId}/public/data/restaurant_requests`,
        requestId
      );
      batch.update(requestDocRef, {
        status: "reviewed",
        reviewedAt: new Date(),
        reviewedBy: currentUser.email || currentUser.uid,
      });

      await batch.commit();
      setLocalModalMessage("已成功批准此請求並創建新餐廳！");
      setModalType("success");
      setTimeout(() => router.push("/admin"), 2000);
    } catch (error) {
      console.error("批准請求失敗:", error);
      setLocalModalMessage(`批准失敗: ${error.message}`);
      setModalType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (isSubmitting || !requestData) return;
    try {
      setIsSubmitting(true);
      const batch = writeBatch(db); // 使用批次寫入以確保原子性

      const requestCollectionPath = `artifacts/${appId}/public/data/restaurant_requests`;
      const requestDocRef = doc(db, requestCollectionPath, requestId);
      batch.update(requestDocRef, {
        status: "rejected",
        reviewedBy: currentUser.email || currentUser.uid,
        reviewedAt: new Date(),
      });

      await batch.commit(); // 執行批次寫入

      setLocalModalMessage("已成功否決此請求。");
      setModalType("success");
      setTimeout(() => router.push("/admin"), 2000);
    } catch (error) {
      console.error("否決請求失敗:", error);
      setLocalModalMessage(`否決失敗: ${error.message}`);
      setModalType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !requestData) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <p className="text-gray-600 ml-4">載入請求資料中...</p>
        {modalMessage && (
          <Modal
            message={modalMessage}
            onClose={() => {
              setLocalModalMessage("");
              setModalType("");
            }}
            isOpen={!!modalMessage}
            type={modalType}
          />
        )}
      </div>
    );
  }

  const requestStatus = requestData?.status;
  const dataToDisplay = requestData;
  const restaurantId = "N/A";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            審批新餐廳申請
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            檢視並審批或否決用戶提交的新餐廳資料
          </p>
        </div>
        <button
          onClick={() => router.push("/admin")}
          className="text-gray-500 hover:text-gray-700 transition-colors flex items-center font-medium py-2 px-3 rounded-md border border-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          返回
        </button>
      </div>
      <div className="p-6">
        <div>
          <div
            className="border border-gray-200 rounded-lg overflow-hidden h-full"
            ref={changesSectionRef}
          >
            <div className="px-6 py-3 bg-gray-50 text-xl font-semibold text-gray-800 border-b border-gray-200">
              <h3>申請的餐廳資料</h3>
            </div>
            <div className="p-4 space-y-6">
              <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                <span>
                  原始提交者:{" "}
                  <span className="font-bold">
                    {dataToDisplay?.submittedBy || "N/A"}
                  </span>
                </span>
                <span>
                  提交時間:{" "}
                  <span className="font-bold">
                    {formatDateTime(dataToDisplay?.submittedAt)}
                  </span>
                </span>
              </div>
              {/* 🚨 根據新順序和欄位渲染區塊 */}
              {Object.entries(restaurantSections).map(
                ([sectionKey, sectionData]) => {
                  const sectionFields = sectionData.fields.filter(
                    (field) => dataToDisplay && field in dataToDisplay
                  );
                  // 🚨 僅在有資料時渲染區塊
                  if (sectionFields.length === 0) return null;

                  return (
                    <div key={sectionKey} className="space-y-4">
                      <h4 className="text-lg font-bold text-gray-700 border-b border-gray-200 pb-1 mt-4">
                        {sectionData.zh}
                      </h4>
                      {/* 🚨 核心改動：大螢幕三列，小螢幕單列 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {sectionFields.map((field) => (
                          <div
                            key={field}
                            className="p-3 bg-gray-50 rounded-md"
                          >
                            <p className="font-medium text-gray-600">
                              {/* 🚨 使用 fieldDisplayNames 覆蓋顯示名稱 */}
                              {fieldDisplayNames[field] ||
                                restaurantFields[field]?.zh ||
                                field}
                            </p>
                            {/* 🚨 使用 PhotoDisplay 組件 */}
                            <PhotoDisplay
                              field={field}
                              value={dataToDisplay?.[field]}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        {requestStatus === "pending" && (
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              批准此申請
            </button>
            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              否決此申請
            </button>
          </div>
        )}
        {isSubmitting && (
          <p className="text-center mt-4 text-gray-500">正在處理請求...</p>
        )}
      </div>

      {modalMessage && (
        <Modal
          message={modalMessage}
          onClose={() => {
            setLocalModalMessage("");
            setModalType("");
          }}
          isOpen={!!modalMessage}
          duration={modalType === "success" ? 2000 : 0}
          type={modalType}
        />
      )}
    </div>
  );
};

export default AddRestaurantRequestPage;
