//v3-components/admin/UserRequestManagement.js
"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../lib/auth-context";
import { collection, query, onSnapshot } from "firebase/firestore";
import LoadingSpinner from "../LoadingSpinner";
import { useRouter } from "next/navigation";

const UserRequestManagement = ({ onBackToAdmin }) => {
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

    const addRequestsQuery = query(
      collection(db, `artifacts/${appId}/public/data/add_rest_request`)
    );
    const updateRequestsQuery = query(
      collection(db, `artifacts/${appId}/public/data/update_rest_request`)
    );

    const unsubscribeNew = onSnapshot(
      addRequestsQuery,
      (snapshot) => {
        const newRequests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "add",
        }));
        setRequests((currentRequests) => {
          const otherRequests = currentRequests.filter(
            (req) => req.type !== "add"
          );
          return [...otherRequests, ...newRequests];
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
      (snapshot) => {
        const updateRequests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "update",
        }));
        setRequests((currentRequests) => {
          const otherRequests = currentRequests.filter(
            (req) => req.type !== "update"
          );
          return [...otherRequests, ...updateRequests];
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
      return (
        request.changes?.restaurantNameZh?.value ||
        request.changes?.restaurantNameEn?.value ||
        "N/A"
      );
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
                請求
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
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
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
