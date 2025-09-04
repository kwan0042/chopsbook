// src/components/admin/UserManagement.js
"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../lib/auth-context";
import { doc, collection, getDocs, getDoc, query } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import LoadingSpinner from "../LoadingSpinner";
import { useRouter } from "next/navigation";

/**
 * UserManagement: 管理員用戶管理區塊組件。
 * 負責顯示所有用戶列表、提供更新管理員權限和查看用戶詳細資料的功能。
 *
 * @param {object} props - 組件屬性。
 * @param {function} props.setParentModalMessage - 用於在 AdminPage 中顯示模態框訊息的回調。
 */
const UserManagement = ({ setParentModalMessage }) => {
  const { currentUser, db, updateUserAdminStatus, appId, formatDateTime } =
    useContext(AuthContext);
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingUserStatus, setUpdatingUserStatus] = useState(false);

  // 實時獲取所有用戶資料
  useEffect(() => {
    if (!db || !appId) {
      setLoadingUsers(false);
      setParentModalMessage("Firebase 資料庫服務未初始化或應用程式ID不可用。");
      return;
    }

    setLoadingUsers(true);

    // 監聽頂層的 users 集合
    const usersCollectionRef = collection(db, `artifacts/${appId}/users`);
    const q = query(usersCollectionRef);

    // 設置實時監聽
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedUsersData = [];

        if (querySnapshot.empty) {
          setUsers([]);
          setLoadingUsers(false);
          setParentModalMessage("沒有找到任何用戶資料。");
          return;
        }

        // 直接從 querySnapshot.docs 獲取所有用戶資料，無需額外請求
        querySnapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          fetchedUsersData.push({
            uid: userDoc.id,
            ...userData, // 展開所有頂層文檔資料
            email: userData.email || `未知郵箱`,
            isAdmin: userData.isAdmin || false,
            username:
              userData.username ||
              (userData.email ? userData.email.split("@")[0] : "N/A"),
            rank: userData.rank ?? "7",
            lastLogin: userData.lastLogin || "N/A",
            publishedReviews: Array.isArray(userData.publishedReviews)
              ? userData.publishedReviews
              : [],
            favoriteRestaurants: Array.isArray(userData.favoriteRestaurants)
              ? userData.favoriteRestaurants
              : [],
          });
        });

        setUsers(fetchedUsersData);
        setLoadingUsers(false);
      },
      (error) => {
        console.error("實時監聽用戶資料失敗:", error);
        setParentModalMessage(`實時監聽用戶資料失敗: ${error.message}`);
        setLoadingUsers(false);
      }
    );

    // 清理函數：組件卸載時取消訂閱
    return () => unsubscribe();
  }, [db, appId, setParentModalMessage]);

  const handleUpdateAdminStatus = async (userId, newIsAdmin) => {
    try {
      setUpdatingUserStatus(true);
      await updateUserAdminStatus(userId, newIsAdmin);

      setParentModalMessage(
        `用戶權限已更新為: ${newIsAdmin ? "管理員" : "普通用戶"}`
      );
    } catch (error) {
      setParentModalMessage("更新失敗: " + error.message);
      console.error("更新管理員權限失敗:", error);
    } finally {
      setUpdatingUserStatus(false);
    }
  };

  const handleViewUserDetails = (uid) => {
    router.push(`/admin/editUsers?uid=${uid}`);
  };

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <p className="text-gray-600 ml-4">載入用戶資料中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-800">用戶管理</h2>
        <p className="text-sm text-gray-600 mt-1">
          管理應用程式中的用戶權限和資料
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用戶
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                等級
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                最後登入日期
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                身份組
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                詳細資料
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  沒有找到任何用戶資料。
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.uid}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-semibold text-sm">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username || user.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {user.uid.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                    {user.rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                    {formatDateTime(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        user.isAdmin
                          ? "bg-green-100 text-green-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {user.isAdmin ? "管理員" : "普通用戶"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {user.uid === currentUser?.uid ? (
                      <span className="text-gray-400">當前用戶</span>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <button
                          onClick={() =>
                            handleUpdateAdminStatus(user.uid, true)
                          }
                          disabled={updatingUserStatus || user.isAdmin}
                          className={`w-28 px-3 py-1 text-xs rounded-md transition-colors duration-200 ${
                            user.isAdmin
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-green-600 text-white hover:bg-green-700 shadow-sm"
                          }`}
                        >
                          設為管理員
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateAdminStatus(user.uid, false)
                          }
                          disabled={updatingUserStatus || !user.isAdmin}
                          className={`w-28 px-3 py-1 text-xs rounded-md transition-colors duration-200 ${
                            !user.isAdmin
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700 shadow-sm"
                          }`}
                        >
                          取消管理員
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => handleViewUserDetails(user.uid)}
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

export default UserManagement;
