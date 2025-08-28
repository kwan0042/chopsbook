//v3-src/components/admin/UserRequestManagement.js
"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../lib/auth-context";
import { collection, query, onSnapshot, doc, getDoc } from "firebase/firestore"; // 導入 doc, getDoc
import LoadingSpinner from "../LoadingSpinner";
import { useRouter } from "next/navigation";

const UserRequestManagement = () => {
  // 移除 onBackToAdmin props, 因為它沒有被使用
  const { db, currentUser, appId, formatDateTime, loadingUser } =
    useContext(AuthContext);
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // 獲取所有待處理的請求
  useEffect(() => {
    if (loadingUser || !db || !appId) {
      setLoading(false);
      return;
    }

    const addRequestsCollectionPath = `artifacts/${appId}/public/data/add_rest_request`;
    const updateRequestsCollectionPath = `artifacts/${appId}/public/data/update_rest_request`;
    const restaurantsCollectionPath = `artifacts/${appId}/public/data/restaurants`;

    const addRequestsQuery = query(collection(db, addRequestsCollectionPath));
    const updateRequestsQuery = query(
      collection(db, updateRequestsCollectionPath)
    );

    // 用於儲存餐廳名稱的快取，避免重複查詢
    const restaurantNameCache = new Map();

    const unsubscribeNew = onSnapshot(
      addRequestsQuery,
      (snapshot) => {
        const newRequests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "add",
          displayStatus: getStatusDisplay(doc.data().status), // 處理狀態顯示
        }));
        // 使用函數式更新確保基於最新狀態進行操作
        setRequests((currentRequests) => {
          const otherRequests = currentRequests.filter(
            (req) => req.type !== "add"
          );
          const combinedRequests = [...otherRequests, ...newRequests];
          // 排序：最新的請求顯示在最上面
          return combinedRequests.sort(
            (a, b) =>
              (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)
          );
        });
        setLoading(false);
      },
      (error) => {
        console.error("即時監聽新請求失敗:", error);
        setLoading(false);
      }
    );

    const unsubscribeUpdate = onSnapshot(
      updateRequestsQuery,
      async (snapshot) => {
        const updateRequestsPromises = snapshot.docs.map(async (docSnap) => {
          const reqData = docSnap.data();
          let restaurantName = "N/A";

          // 如果是更新請求，需要從主餐廳資料中獲取名稱
          if (reqData.restaurantId) {
            // 嘗試從快取中獲取
            if (restaurantNameCache.has(reqData.restaurantId)) {
              restaurantName = restaurantNameCache.get(reqData.restaurantId);
            } else {
              // 快取中沒有則查詢 Firestore
              const restaurantDocRef = doc(
                db,
                restaurantsCollectionPath,
                reqData.restaurantId
              );
              const restaurantDocSnap = await getDoc(restaurantDocRef);
              if (restaurantDocSnap.exists()) {
                const rData = restaurantDocSnap.data();
                restaurantName =
                  rData.restaurantNameZh || rData.restaurantNameEn || "N/A";
                restaurantNameCache.set(reqData.restaurantId, restaurantName); // 存入快取
              }
            }
          }

          return {
            id: docSnap.id,
            ...reqData,
            type: "update",
            originalRestaurantName: restaurantName, // 儲存原始餐廳名稱
            displayStatus: getStatusDisplay(reqData.status), // 處理狀態顯示
          };
        });

        const updateRequests = await Promise.all(updateRequestsPromises);

        // 使用函數式更新確保基於最新狀態進行操作
        setRequests((currentRequests) => {
          const otherRequests = currentRequests.filter(
            (req) => req.type !== "update"
          );
          const combinedRequests = [...otherRequests, ...updateRequests];
          // 排序：最新的請求顯示在最上面
          return combinedRequests.sort(
            (a, b) =>
              (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)
          );
        });
        setLoading(false);
      },
      (error) => {
        console.error("即時監聽更新請求失敗:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeNew();
      unsubscribeUpdate();
    };
  }, [db, appId, loadingUser]);

  // 輔助函數：將狀態翻譯成中文
  const getStatusDisplay = (status) => {
    switch (status) {
      case "pending":
        return "待處理";
      case "reviewed":
        return "已審批";
      default:
        return "待處理";
    }
  };

  // 處理導航到詳細頁面
  const handleViewRequestDetails = (requestId, type) => {
    // 使用新的動態路由，並將請求類型作為參數傳遞
    router.push(`/admin/requests/${requestId}?type=${type}`);
  };

  // 根據請求類型獲取餐廳名稱
  const getRestaurantName = (request) => {
    if (request.type === "add") {
      return request.restaurantNameZh || request.restaurantNameEn || "N/A";
    }
    if (request.type === "update") {
      // 對於更新請求，使用之前獲取到的原始餐廳名稱
      return request.originalRestaurantName || "N/A";
    }
    return "N/A";
  };

  if (loading) {
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
                  目前沒有待處理的請求。
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr
                  key={request.id}
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
                    {formatDateTime(request.createdAt)}
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
    </div>
  );
};

export default UserRequestManagement;
