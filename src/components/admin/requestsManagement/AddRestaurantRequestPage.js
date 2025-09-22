"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "@/lib/auth-context";
import {
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  setDoc,
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  increment, // 引入 Firestore 的 increment 函數
} from "firebase/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter, useParams } from "next/navigation";
import Modal from "@/components/Modal";
import { restaurantFields, formatDataForDisplay } from "@/lib/translation-data";

// 將欄位分組到不同區塊
const restaurantSections = {
  basicInfo: {
    zh: "基本資訊",
    fields: [
      "restaurantName", // 修正：使用新的 restaurantName 欄位
      "cuisineType",
      "restaurantType",
      "isManager",
      "isPermanentlyClosed",
      "isTemporarilyClosed",
      "avgSpending",
      "submittedBy",
      "createdAt",
    ],
  },
  contactInfo: {
    zh: "聯絡資訊",
    fields: ["contactName", "contactPhone", "phone", "contactEmail", "website"],
  },
  location: {
    zh: "位置資訊",
    fields: ["province", "city", "fullAddress"],
  },
  details: {
    zh: "其他詳細資訊",
    fields: [
      "seatingCapacity",
      "paymentMethods",
      "reservationModes",
      "otherInfo",
      "facilitiesServices",
    ],
  },
  photos: {
    zh: "照片",
    fields: ["facadePhotoUrls", "facadePhotoUrl"],
  },
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

  // 輔助函數：處理多語言餐廳名稱顯示
  const formatRestaurantName = (nameObject) => {
    if (nameObject && typeof nameObject === "object") {
      return nameObject["zh-TW"] || nameObject.en || "N/A";
    }
    return "N/A";
  };

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

      // 解構賦值，排除 `id` 屬性
      const { id, ...newRestaurantData } = requestData;

      // 將餐廳資料寫入主表，使用新生成的ID
      const restaurantDocRef = doc(
        collection(db, `artifacts/${appId}/public/data/restaurants`)
      );

      // 使用不帶 id 的 newRestaurantData
      batch.set(restaurantDocRef, { ...newRestaurantData, status: "approved" });

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

      // 新增：在批次中更新總數
      // const countDocRef = doc(
      //   db,
      //   `artifacts/${appId}/public/data/count/reviewedRequests`
      // );
      // batch.update(countDocRef, {
      //   count: increment(1),
      // });

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

      // 新增：在批次中更新總數
      // const countDocRef = doc(
      //   db,
      //   `artifacts/${appId}/public/data/count/reviewedRequests`
      // );
      // batch.update(countDocRef, {
      //   count: increment(1),
      // });

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
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                <span>
                  提交者:{" "}
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
              {Object.entries(restaurantSections).map(
                ([sectionKey, sectionData]) => {
                  const sectionFields = sectionData.fields.filter(
                    (field) => dataToDisplay && field in dataToDisplay
                  );
                  if (sectionFields.length === 0) return null;

                  return (
                    <div key={sectionKey} className="space-y-2">
                      <h4 className="text-lg font-bold text-gray-700 border-b border-gray-200 pb-1">
                        {sectionData.zh}
                      </h4>
                      {sectionFields.map((field) => (
                        <div key={field} className="p-3 bg-gray-50 rounded-md">
                          <p className="font-medium text-gray-600">
                            {restaurantFields[field]?.zh || field}
                          </p>
                          <pre className="text-gray-800 break-words whitespace-pre-wrap">
                            {field === "restaurantName"
                              ? formatRestaurantName(dataToDisplay?.[field])
                              : formatDataForDisplay(dataToDisplay?.[field])}
                          </pre>
                        </div>
                      ))}
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
