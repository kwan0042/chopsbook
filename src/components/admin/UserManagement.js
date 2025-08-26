// src/components/admin/UserManagement.js
"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../lib/auth-context"; // 確保路徑正確
import { doc, collection, getDocs, getDoc } from "firebase/firestore"; // 確保導入了 getDoc
import LoadingSpinner from "../LoadingSpinner"; // 確保路徑正確
import { useRouter } from "next/navigation";

/**
 * UserManagement: 管理員用戶管理區塊組件。
 * 負責顯示所有用戶列表、提供更新管理員權限和查看用戶詳細資料的功能。
 *
 * @param {object} props - 組件屬性。
 * @param {function} props.setParentModalMessage - 用於在 AdminPage 中顯示模態框訊息的回調。
 */
const UserManagement = ({ setParentModalMessage }) => {
  // 從 AuthContext 獲取所需的功能
  const { currentUser, db, updateUserAdminStatus, appId, formatDateTime } =
    useContext(AuthContext);
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true); // 更改為 loadingUsers，避免與父組件衝突
  const [updatingUserStatus, setUpdatingUserStatus] = useState(false); // 更改為 updatingUserStatus，避免衝突

  // 獲取所有用戶資料
  useEffect(() => {
    const fetchUsers = async () => {
      if (!db || !appId) {
        // 不再需要檢查 currentUser.isAdmin，因為 AdminPage 會先檢查
        setLoadingUsers(false);
        setParentModalMessage(
          "Firebase 資料庫服務未初始化或應用程式ID不可用。"
        );
        return;
      }

      // AdminPage 已經確認 currentUser?.isAdmin，這裡不再重複檢查。
      // 但如果用戶在沒有權限的情況下直接訪問此組件，仍需要處理。
      // 由於父組件已經處理了權限檢查，這裡可以假設有權限。
      // 如果需要更嚴格的組件級別保護，可以在這裡再次檢查 isAdmin。

      setLoadingUsers(true);
      setUsers([]);

      try {
        const usersUidCollectionRef = collection(
          db,
          `artifacts/${appId}/users`
        );
        const usersUidSnapshot = await getDocs(usersUidCollectionRef);

        const fetchedUsersData = [];
        if (usersUidSnapshot.empty) {
          setParentModalMessage("沒有找到任何用戶資料。");
        }

        for (const userDoc of usersUidSnapshot.docs) {
          const uid = userDoc.id;

          const profileDocRef = doc(
            db,
            `artifacts/${appId}/users/${uid}/profile/main`
          );

          try {
            // 已修正：直接使用 Firestore 的 getDoc 函數
            const profileDocSnap = await getDoc(profileDocRef);

            if (profileDocSnap.exists()) {
              const profileData = profileDocSnap.data();
              // 確保 publishedReviews 和 favoriteRestaurants 是陣列
              const publishedReviews = Array.isArray(
                profileData.publishedReviews
              )
                ? profileData.publishedReviews
                : [];
              const favoriteRestaurants = Array.isArray(
                profileData.favoriteRestaurants
              )
                ? profileData.favoriteRestaurants
                : [];

              fetchedUsersData.push({
                uid: uid,
                email: profileData.email || `未知郵箱`,
                isAdmin: profileData.isAdmin || false,
                createdAt: profileData.createdAt || "未知時間",
                username:
                  profileData.username ||
                  (profileData.email ? profileData.email.split("@")[0] : "N/A"),
                rank: profileData.rank || "7",
                lastLogin: profileData.lastLogin || "N/A",
                publishedReviews,
                favoriteRestaurants,
              });
            } else {
              // 如果 profile/main 不存在，但根 UID 文檔存在，也提取一些基礎資訊
              const userDataFromRootDoc = userDoc.data();
              const publishedReviews = Array.isArray(
                userDataFromRootDoc.publishedReviews
              )
                ? userDataFromRootDoc.publishedReviews
                : [];
              const favoriteRestaurants = Array.isArray(
                userDataFromRootDoc.favoriteRestaurants
              )
                ? userDataFromRootDoc.favoriteRestaurants
                : [];
              fetchedUsersData.push({
                uid: uid,
                email: userDataFromRootDoc.email || `未知郵箱`,
                isAdmin: userDataFromRootDoc.isAdmin || false,
                createdAt: userDataFromRootDoc.createdAt || "未知時間",
                username:
                  userDataFromRootDoc.username ||
                  (userDataFromRootDoc.email
                    ? userDataFromRootDoc.email.split("@")[0]
                    : "N/A"),
                rank: userDataFromRootDoc.rank || "7",
                lastLogin: userDataFromRootDoc.lastLogin || "N/A",
                publishedReviews,
                favoriteRestaurants,
              });
            }
          } catch (profileError) {
            console.error(
              `獲取用戶 ${uid} 的 profile/main 失敗:`,
              profileError
            );
            fetchedUsersData.push({
              uid: uid,
              email: `獲取失敗 (錯誤)`,
              isAdmin: false,
              createdAt: "未知時間",
              username: "N/A",
              rank: "N/A",
              lastLogin: "N/A",
            });
          }
        }
        setUsers(fetchedUsersData);
      } catch (error) {
        setParentModalMessage(`獲取用戶資料失敗: ${error.message}`);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [db, appId, setParentModalMessage]); // 確保所有依賴項都包含在內

  // 更新用戶管理員權限
  const handleUpdateAdminStatus = async (userId, newIsAdmin) => {
    try {
      setUpdatingUserStatus(true);
      await updateUserAdminStatus(userId, newIsAdmin);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.uid === userId ? { ...user, isAdmin: newIsAdmin } : user
        )
      );

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

  // 導航到用戶詳細頁面 (現在使用查詢參數)
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

  // 渲染用戶表格
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
                      <div className="flex flex-col space-y-2">
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
