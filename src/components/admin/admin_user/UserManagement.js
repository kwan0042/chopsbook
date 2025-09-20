// src/components/UserManagement.js
"use client";

import React, { useState, useContext, useEffect, useCallback } from "react";
import { AuthContext } from "../../../lib/auth-context";
import { collection, onSnapshot, query, doc, getDoc } from "firebase/firestore";
import LoadingSpinner from "../../LoadingSpinner";
import { useRouter } from "next/navigation";
import Modal from "../../Modal";

/**
 * UserManagement: 管理員用戶管理區塊組件。
 * 負責顯示所有用戶列表、提供更新管理員權限和查看用戶詳細資料的功能。
 */
const UserManagement = () => {
  const { currentUser, db, appId, formatDateTime, auth } =
    useContext(AuthContext);
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingUserStatus, setUpdatingUserStatus] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("");

  const closeModal = () => {
    setModalMessage("");
    setModalType("");
  };

  // 實時獲取所有用戶資料，包含來自 privateData 的數據
  useEffect(() => {
    if (!db || !appId) {
      setLoadingUsers(false);
      setModalMessage("Firebase 資料庫服務未初始化或應用程式ID不可用。");
      setModalType("error");
      return;
    }

    setLoadingUsers(true);

    const usersCollectionRef = collection(db, `artifacts/${appId}/users`);
    const q = query(usersCollectionRef);

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        if (querySnapshot.empty) {
          setUsers([]);
          setLoadingUsers(false);
          setModalMessage("沒有找到任何用戶資料。", "info");
          return;
        }

        const userPromises = querySnapshot.docs.map(async (userDoc) => {
          const publicData = userDoc.data();
          const uid = userDoc.id;

          const privateDocRef = doc(
            db,
            `artifacts/${appId}/users/${uid}/privateData/${uid}`
          );
          const privateDocSnap = await getDoc(privateDocRef);
          const privateData = privateDocSnap.exists()
            ? privateDocSnap.data()
            : {};

          const mergedData = {
            ...publicData,
            ...privateData,
            uid,
            email: privateData.email || `未知郵箱`,
            isAdmin: privateData.isAdmin || false,
            isSuperAdmin: privateData.isSuperAdmin || false,
            username:
              publicData.username ||
              (privateData.email ? privateData.email.split("@")[0] : "N/A"),
            rank: publicData.rank ?? "7",
            lastLogin: publicData.lastLogin || "N/A",
            publishedReviews: Array.isArray(publicData.publishedReviews)
              ? publicData.publishedReviews
              : [],
            favoriteRestaurants: Array.isArray(publicData.favoriteRestaurants)
              ? publicData.favoriteRestaurants
              : [],
          };
          return mergedData;
        });

        const fetchedUsers = await Promise.all(userPromises);
        setUsers(fetchedUsers);
        setLoadingUsers(false);
      },
      (error) => {
        console.error("實時監聽用戶資料失敗:", error);
        setModalMessage(`實時監聽用戶資料失敗: ${error.message}`, "error");
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [db, appId]);

  const handleUpdateAdminStatus = useCallback(
    async (user, newIsAdmin) => {
      if (!auth?.currentUser) {
        setModalMessage("您尚未登入。", "error");
        return;
      }

      if (user.isSuperAdmin && !currentUser?.isSuperAdmin) {
        setModalMessage("您沒有權限修改超級管理員的權限。", "error");
        return;
      }

      if (user.uid === currentUser.uid) {
        setModalMessage("您不能修改自己的管理員權限。", "error");
        return;
      }

      setUpdatingUserStatus(true);
      try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch("/api/admin/set-claims", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            targetUserUid: user.uid,
            newClaims: { isAdmin: newIsAdmin, isSuperAdmin: user.isSuperAdmin },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "更新權限失敗");
        }

        // 強制刷新當前登入管理員的 ID Token，以即時反映權限變更
        await auth.currentUser.getIdToken(true);

        // ✅ 修正點: 手動更新前端狀態
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.uid === user.uid ? { ...u, isAdmin: newIsAdmin } : u
          )
        );

        setModalMessage(
          `用戶權限已更新為: ${newIsAdmin ? "管理員" : "普通用戶"}`,
          "success"
        );
      } catch (error) {
        setModalMessage(`更新失敗: ${error.message}`, "error");
        console.error("更新管理員權限失敗:", error);
      } finally {
        setUpdatingUserStatus(false);
      }
    },
    [auth, currentUser]
  );

  const handleViewUserDetails = useCallback(
    (uid) => {
      router.push(`/admin/editUsers?uid=${uid}`);
    },
    [router]
  );

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <p className="text-gray-600 ml-4">載入用戶資料中...</p>
      </div>
    );
  }

  return (
    <>
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
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
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
                          user.isSuperAdmin
                            ? "bg-red-100 text-red-800"
                            : user.isAdmin
                            ? "bg-green-100 text-green-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {user.isSuperAdmin
                          ? "超級管理員"
                          : user.isAdmin
                          ? "管理員"
                          : "普通用戶"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {user.uid === currentUser?.uid ? (
                        <span className="text-gray-400">當前用戶</span>
                      ) : currentUser?.isSuperAdmin || !user.isSuperAdmin ? (
                        <div className="flex flex-col items-center space-y-2">
                          <button
                            onClick={() => handleUpdateAdminStatus(user, true)}
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
                            onClick={() => handleUpdateAdminStatus(user, false)}
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
                      ) : (
                        <span className="text-gray-400">無權限</span>
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
      <Modal message={modalMessage} onClose={closeModal} type={modalType} />
    </>
  );
};

export default UserManagement;
