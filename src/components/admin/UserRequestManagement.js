"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../lib/auth-context";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import LoadingSpinner from "../LoadingSpinner";
import { useRouter } from "next/navigation";

const UserRequestManagement = () => {
  const { db, appId, formatDateTime, loadingUser } = useContext(AuthContext);
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("pending");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [pageCursors, setPageCursors] = useState([null]);

  // 輔助函數：將狀態翻譯成中文
  const getStatusDisplay = (status) => {
    switch (status) {
      case "pending":
        return "待處理";
      case "reviewed":
        return "已審批";
      case "rejected":
        return "已否決";
      default:
        return "待處理";
    }
  };

  // 處理導航到詳細頁面 (在新分頁中打開)
  const handleViewRequestDetails = (requestId, type) => {
    window.open(`/admin/admin_requests/${requestId}?type=${type}`, "_blank");
  };

  // 根據請求類型獲取餐廳名稱
  const getRestaurantName = (request) => {
    if (request.type === "add" || request.type === "update") {
      if (
        request.restaurantName &&
        typeof request.restaurantName === "object"
      ) {
        return (
          request.restaurantName["zh-TW"] || request.restaurantName.en || "N/A"
        );
      }
      return "N/A";
    }
    return "N/A";
  };

  // 處理切換視圖模式，並重設分頁狀態
  const handleViewModeChange = (mode) => {
    if (viewMode !== mode) {
      setRequests([]);
      setLoading(true);
      setPage(0);
      setPageCursors([null]);
      setHasMore(true);
      setViewMode(mode);
    }
  };

  // 核心資料獲取邏輯
  useEffect(() => {
    if (loadingUser || !db || !appId) {
      setLoading(false);
      return;
    }

    const requestsRef = collection(
      db,
      `artifacts/${appId}/public/data/restaurant_requests`
    );
    const restaurantsCollectionPath = `artifacts/${appId}/public/data/restaurants`;
    const pageSize = 10; // 每頁顯示 10 筆資料，可依需求調整

    let unsubscribe;

    const fetchData = async () => {
      try {
        setLoading(true);

        if (viewMode === "pending") {
          // 待處理請求模式：使用即時監聽器
          const q = query(
            requestsRef,
            where("status", "==", "pending"),
            orderBy("submittedAt", "desc")
          );

          unsubscribe = onSnapshot(q, async (snapshot) => {
            const fetchedRequests = await Promise.all(
              snapshot.docs.map(async (docSnap) => {
                const reqData = docSnap.data();
                const type = reqData.type;
                let restaurantName;

                if (type === "update" && reqData.restaurantId) {
                  const restaurantDocRef = doc(
                    db,
                    restaurantsCollectionPath,
                    reqData.restaurantId
                  );
                  const restaurantDocSnap = await getDoc(restaurantDocRef);
                  if (restaurantDocSnap.exists()) {
                    const rData = restaurantDocSnap.data();
                    restaurantName =
                      rData.restaurantName?.["zh-TW"] ||
                      rData.restaurantName?.en ||
                      "N/A";
                  } else {
                    restaurantName = "N/A";
                  }
                } else {
                  restaurantName =
                    reqData.restaurantName?.["zh-TW"] ||
                    reqData.restaurantName?.en ||
                    "N/A";
                }

                return {
                  id: docSnap.id,
                  ...reqData,
                  originalRestaurantName: restaurantName,
                  displayStatus: getStatusDisplay(reqData.status),
                };
              })
            );
            setRequests(fetchedRequests);
            setHasMore(false);
            setLoading(false);
          });
        } else {
          // 已審批請求模式：使用分頁查詢
          const lastVisible = pageCursors[page];

          let q = query(
            requestsRef,
            where("status", "in", ["reviewed", "rejected"]),
            orderBy("submittedAt", "desc"),
            limit(pageSize + 1) // 額外多取一筆，以判斷是否還有下一頁
          );
          if (lastVisible) {
            q = query(q, startAfter(lastVisible));
          }

          const querySnapshot = await getDocs(q);

          // 判斷是否還有更多資料
          const hasMoreData = querySnapshot.docs.length > pageSize;
          setHasMore(hasMoreData);

          const docsToDisplay = hasMoreData
            ? querySnapshot.docs.slice(0, pageSize)
            : querySnapshot.docs;

          const newRequests = await Promise.all(
            docsToDisplay.map(async (docSnap) => {
              const reqData = docSnap.data();
              const type = reqData.type;
              let restaurantName;

              if (type === "update" && reqData.restaurantId) {
                const restaurantDocRef = doc(
                  db,
                  restaurantsCollectionPath,
                  reqData.restaurantId
                );
                const restaurantDocSnap = await getDoc(restaurantDocRef);
                if (restaurantDocSnap.exists()) {
                  const rData = restaurantDocSnap.data();
                  restaurantName =
                    rData.restaurantName?.["zh-TW"] ||
                    rData.restaurantName?.en ||
                    "N/A";
                } else {
                  restaurantName = "N/A";
                }
              } else {
                restaurantName =
                  reqData.restaurantName?.["zh-TW"] ||
                  reqData.restaurantName?.en ||
                  "N/A";
              }

              return {
                id: docSnap.id,
                ...reqData,
                originalRestaurantName: restaurantName,
                displayStatus: getStatusDisplay(reqData.status),
              };
            })
          );
          setRequests(newRequests);

          if (querySnapshot.docs.length > 0 && pageCursors.length <= page + 1) {
            setPageCursors((prev) => [
              ...prev,
              querySnapshot.docs[querySnapshot.docs.length - 1],
            ]);
          }
          setLoading(false); // 在非即時監聽模式下，在此處設定載入狀態為 false
        }
      } catch (error) {
        console.error("載入資料失敗:", error);
        setLoading(false); // 確保在出錯時也停止載入
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [db, appId, loadingUser, viewMode, page]);

  const handleNextPage = () => {
    if (hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    setPage((prevPage) => Math.max(0, prevPage - 1));
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <p className="text-gray-600 ml-4">載入請求資料中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">用家請求管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            管理所有待處理的新餐廳申請與餐廳資訊更新請求。
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewModeChange("pending")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              viewMode === "pending"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            待處理請求
          </button>
          <button
            onClick={() => handleViewModeChange("reviewed")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              viewMode === "reviewed"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            已審批請求
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                餐廳名稱
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                請求類型
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                請求者 ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                狀態
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                提交時間
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">動作</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  {viewMode === "pending"
                    ? "目前沒有待處理的請求。"
                    : "目前沒有已審批或已否決的請求。"}
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr
                  key={`${request.type}-${request.id}`}
                  className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  onClick={() =>
                    handleViewRequestDetails(request.id, request.type)
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {getRestaurantName(request)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.type === "add" ? "新餐廳申請" : "更新申請"}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {request.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {request.submittedBy || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : request.status === "reviewed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {request.displayStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                    {formatDateTime(request.submittedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewRequestDetails(request.id, request.type);
                      }}
                      className="px-4 py-2 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
                    >
                      查看詳細
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewMode === "reviewed" && (
        <div className="flex justify-center space-x-4 p-4">
          {page > 0 && (
            <button
              onClick={handlePrevPage}
              className={`px-6 py-2 rounded-md text-white transition-colors duration-200 shadow-sm ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
              disabled={loading}
            >
              上一頁
            </button>
          )}
          {hasMore && (
            <button
              onClick={handleNextPage}
              className={`px-6 py-2 rounded-md text-white transition-colors duration-200 shadow-sm ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
              disabled={loading}
            >
              {loading ? "載入中..." : "下一頁"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserRequestManagement;
