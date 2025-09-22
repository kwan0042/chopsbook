"use client";

import React, { useState, useContext, useEffect, useRef } from "react";
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
  businessHours: {
    // 新增此區塊
    zh: "營業時間",
    fields: ["businessHours"],
  },
  photos: {
    zh: "照片",
    fields: ["facadePhotoUrls", "facadePhotoUrl"],
  },
};

/**
 * EditRestaurantRequestPage: 餐廳資訊更新審批頁面。
 * 專門處理 requestType === "update" 的請求。
 */
const EditRestaurantRequestPage = ({ requestId }) => {
  const { db, appId, setModalMessage, formatDateTime, currentUser } =
    useContext(AuthContext);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [originalRestaurantData, setOriginalRestaurantData] = useState(null);
  const [requestData, setRequestData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setLocalModalMessage] = useState("");
  const [modalType, setModalType] = useState("");
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
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
          console.log(requestId);
          setLocalModalMessage("找不到指定的請求或已處理。");
          setModalType("info");
          setLoading(false);
          setRequestData(null);
          return;
        }

        const reqData = { ...requestDocSnap.data(), id: requestDocSnap.id };
        // 額外檢查 document 的類型是否為 'update'
        if (reqData.type !== "update") {
          setLocalModalMessage("此頁面只處理更新餐廳的申請。");
          setModalType("info");
          setLoading(false);
          setRequestData(null);
          return;
        }

        setRequestData({ ...reqData, type: "update" });

        // 獲取原始餐廳資料
        if (reqData.restaurantId) {
          const restaurantDocRef = doc(
            db,
            `artifacts/${appId}/public/data/restaurants/${reqData.restaurantId}`
          );
          const restaurantDocSnap = await getDoc(restaurantDocRef);
          if (restaurantDocSnap.exists()) {
            setOriginalRestaurantData(restaurantDocSnap.data());
          } else {
            setOriginalRestaurantData(null);
          }
        } else {
          setOriginalRestaurantData(null);
        }

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

  // 處理儲存所有變更的邏輯
  const handleSaveChanges = async () => {
    if (isSubmitting || !requestData) return;

    // 檢查是否有任何項目處於待處理狀態
    const hasPendingChanges = Object.keys(requestData.changes || {}).some(
      (key) => requestData.changes[key].status === "pending"
    );

    if (hasPendingChanges) {
      setShowIncompleteWarning(true);
      if (changesSectionRef.current) {
        changesSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const batch = writeBatch(db);

      if (!originalRestaurantData) {
        setLocalModalMessage("原始餐廳資料已不存在，無法批准。");
        setModalType("error");
        setIsSubmitting(false);
        return;
      }

      const restaurantDocRef = doc(
        db,
        `artifacts/${appId}/public/data/restaurants/${requestData.restaurantId}`
      );

      const approvedChanges = {};
      Object.keys(requestData.changes || {}).forEach((field) => {
        if (requestData.changes[field].status === "approved") {
          approvedChanges[field] = requestData.changes[field].value;
        }
      });

      if (Object.keys(approvedChanges).length > 0) {
        batch.update(restaurantDocRef, approvedChanges);
      }

      // 更新請求狀態，保留文件
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

      setLocalModalMessage("已成功儲存所有已批准的變更。", "success"); // 新增成功提示
      setTimeout(() => router.push("/admin"), 2000); // 延遲跳轉
    } catch (error) {
      console.error("儲存所有變更失敗:", error);
      setLocalModalMessage(`儲存失敗: ${error.message}`);
      setModalType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAll = async () => {
    if (isSubmitting || !requestData) return;
    try {
      setIsSubmitting(true);
      const requestCollectionPath = `artifacts/${appId}/public/data/restaurant_requests`;
      const requestDocRef = doc(db, requestCollectionPath, requestId);
      await updateDoc(requestDocRef, {
        status: "rejected",
        reviewedBy: currentUser.email || currentUser.uid,
        reviewedAt: new Date(),
      });
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

  // 處理單一欄位的批准
  const handleApproveField = async (field) => {
    if (isSubmitting || !requestData) return;
    try {
      setIsSubmitting(true);
      const requestDocRef = doc(
        db,
        `artifacts/${appId}/public/data/restaurant_requests`,
        requestId
      );
      await updateDoc(requestDocRef, {
        [`changes.${field}.status`]: "approved",
      });
      setShowIncompleteWarning(false);
    } catch (error) {
      console.error("批准欄位失敗:", error);
      setLocalModalMessage(`批准失敗: ${error.message}`);
      setModalType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 處理單一欄位的否決
  const handleRejectField = async (field) => {
    if (isSubmitting || !requestData) return;
    try {
      setIsSubmitting(true);
      const requestDocRef = doc(
        db,
        `artifacts/${appId}/public/data/restaurant_requests`,
        requestId
      );
      await updateDoc(requestDocRef, {
        [`changes.${field}.status`]: "rejected",
      });
      setShowIncompleteWarning(false);
    } catch (error) {
      console.error("否決欄位失敗:", error);
      setLocalModalMessage(`否決失敗: ${error.message}`);
      setModalType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 新增：重置所有審批狀態
  const handleReset = async () => {
    if (isSubmitting || !requestData) return;
    try {
      setIsSubmitting(true);
      const requestDocRef = doc(
        db,
        `artifacts/${appId}/public/data/restaurant_requests`,
        requestId
      );
      const updates = Object.keys(requestData.changes || {}).reduce(
        (acc, key) => {
          acc[`changes.${key}.status`] = "pending";
          return acc;
        },
        {}
      );
      await updateDoc(requestDocRef, updates);
      setShowIncompleteWarning(false);
    } catch (error) {
      console.error("重置狀態失敗:", error);
      setLocalModalMessage(`重置失敗: ${error.message}`);
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
  const dataToDisplay = requestData?.changes;
  const restaurantId = requestData?.restaurantId || "N/A";

  const getBackgroundColor = (status) => {
    if (status === "approved") return "bg-green-100";
    if (status === "rejected") return "bg-red-100";
    return "bg-yellow-100";
  };

  // 新增：對用戶提交的變更進行排序，確保渲染順序穩定
  const sortedChanges = dataToDisplay
    ? Object.entries(dataToDisplay).sort(([keyA], [keyB]) =>
        keyA.localeCompare(keyB)
      )
    : [];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            審批餐廳更新請求
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            檢視並審批或否決用戶提交的餐廳更新資料
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

      <div className="px-6 py-3">
        <div className=" bg-gray-100 p-4 rounded-lg">
          <h3 className="text-base font-semibold text-gray-700">
            餐廳 ID:{" "}
            <span className="text-gray-900 font-bold">{restaurantId}</span>
          </h3>
          {requestStatus === "reviewed" && (
            <div className="mt-4 p-3 bg-green-100 rounded-md text-gray-700">
              <p>已審核</p>
              <p className="text-sm mt-1">
                Reviewed by:{" "}
                <span className="font-medium">{requestData.reviewedBy}</span>
              </p>
              <p className="text-sm">
                Reviewed at:{" "}
                <span className="font-medium">
                  {formatDateTime(requestData.reviewedAt)}
                </span>
              </p>
            </div>
          )}

          {requestStatus === "pending" && (
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-yellow-600">此請求尚未處理。</p>
              <div className="space-x-2">
                <button
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  儲存所有變更
                </button>
                <button
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors duration-200 shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  重置
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="px-6 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：現有餐廳資料（分區顯示） */}
          <div className="border border-gray-200 rounded-lg overflow-hidden h-full">
            <h3 className="px-6 py-3 bg-gray-50 text-lg font-semibold text-gray-800 border-b border-gray-200">
              現有餐廳資料
            </h3>
            <div className="p-4 space-y-6">
              {originalRestaurantData ? (
                Object.entries(restaurantSections).map(
                  ([sectionKey, sectionData]) => {
                    const sectionFields = sectionData.fields.filter(
                      (field) => field in originalRestaurantData
                    );
                    if (sectionFields.length === 0) return null;

                    return (
                      <div key={sectionKey} className="space-y-2">
                        <h4 className="text-base font-bold text-gray-700 border-b border-gray-200 pb-1">
                          {sectionData.zh}
                        </h4>
                        {sectionFields.map((field) => (
                          <div
                            key={field}
                            className="p-3 bg-gray-50 rounded-md"
                          >
                            <p className="font-medium text-gray-600">
                              {restaurantFields[field]?.zh || field}
                            </p>
                            <pre className="text-gray-800 break-words whitespace-pre-wrap">
                              {field === "restaurantName"
                                ? formatRestaurantName(
                                    originalRestaurantData?.[field]
                                  )
                                : formatDataForDisplay(
                                    originalRestaurantData?.[field]
                                  )}
                            </pre>
                          </div>
                        ))}
                      </div>
                    );
                  }
                )
              ) : (
                <div className="text-gray-500 italic p-3 bg-gray-50 rounded-md">
                  原始餐廳資料已不存在。
                </div>
              )}
            </div>
          </div>

          {/* 右側：用戶提交的變更（並排比較） */}
          <div
            className="border border-yellow-400 rounded-lg overflow-hidden h-full"
            ref={changesSectionRef}
          >
            <div className="px-6 py-3 bg-yellow-50 text-lg font-semibold text-gray-800 border-b border-yellow-400 flex justify-between items-center">
              <h3>用戶提交的變更</h3>
              {showIncompleteWarning && (
                <span className="text-red-500 text-sm font-semibold">
                  審批未完成，未能儲存
                </span>
              )}
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                <span>
                  提交者:{" "}
                  <span className="font-bold">
                    {requestData?.submittedBy || "N/A"}
                  </span>
                </span>
                <span>
                  提交時間:{" "}
                  <span className="font-bold">
                    {formatDateTime(requestData?.submittedAt)}
                  </span>
                </span>
              </div>
              {/* 修正：使用排序後的陣列進行 map */}
              {sortedChanges.length > 0 ? (
                sortedChanges.map(([key, valueObject]) => (
                  <div
                    key={key}
                    className={`p-4 bg-white rounded-lg shadow-sm transition-all duration-300 border border-gray-200`}
                  >
                    <p className="font-bold text-gray-700 text-base mb-2">
                      {restaurantFields[key]?.zh || key}
                    </p>
                    <div className="grid grid-cols-2 gap-4 items-start">
                      {/* 左側：現有值 */}
                      <div className="bg-gray-100 p-3 rounded-md h-full">
                        <p className="font-medium text-gray-600 mb-1">
                          原始值:
                        </p>
                        <pre className="text-gray-800 break-words whitespace-pre-wrap text-sm">
                          {key === "restaurantName"
                            ? formatRestaurantName(
                                originalRestaurantData?.[key]
                              )
                            : formatDataForDisplay(
                                originalRestaurantData?.[key]
                              )}
                        </pre>
                      </div>
                      {/* 右側：變更值 */}
                      <div
                        className={`${getBackgroundColor(
                          valueObject.status
                        )} p-3 rounded-md h-full transition-colors duration-300`}
                      >
                        <p className="font-medium text-gray-600 mb-1">新值:</p>
                        <pre className="text-gray-800 break-words whitespace-pre-wrap text-sm">
                          {key === "restaurantName"
                            ? formatRestaurantName(valueObject.value)
                            : formatDataForDisplay(valueObject.value)}
                        </pre>
                      </div>
                    </div>
                    {requestStatus === "pending" && (
                      <div className="mt-4 text-right space-x-2">
                        <button
                          onClick={() => handleApproveField(key)}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          批准此項
                        </button>
                        <button
                          onClick={() => handleRejectField(key)}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          否決此項
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic p-3 bg-white rounded-md">
                  此請求沒有待審批的更改。
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        {requestStatus === "pending" && (
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={handleSaveChanges}
              disabled={isSubmitting}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              儲存所有變更
            </button>
            <button
              onClick={handleRejectAll}
              disabled={isSubmitting}
              className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              否決此請求
            </button>
          </div>
        )}
        {isSubmitting && (
          <p className="text-center mt-4 text-gray-500">正在處理請求...</p>
        )}
      </div>
      <Modal
        message={modalMessage}
        type={modalType}
        onClose={() => setLocalModalMessage("")}
      />
    </div>
  );
};

export default EditRestaurantRequestPage;
