// src/components/AdminPage.js
"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../lib/auth-context";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import Modal from "./Modal";
import { useRouter } from "next/navigation";

const AdminPage = ({ onBackToHome }) => {
  const { currentUser, db, updateUserAdminStatus, appId } =
    useContext(AuthContext);
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // 輔助函數：將 ISO 日期字串格式化為更易讀的格式
  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return "無效日期";
      }
      return date.toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch (e) {
      console.error("格式化日期失敗:", e);
      return "格式化失敗";
    }
  };

  // 獲取所有用戶資料
  useEffect(() => {
    const fetchUsers = async () => {
      if (!db) {
        setLoading(false);
        setModalMessage("Firebase 資料庫服務未初始化。");
        return;
      }
      if (!currentUser?.isAdmin) {
        setLoading(false);
        setModalMessage("您沒有權限訪問此頁面。");
        return;
      }

      setLoading(true);
      setUsers([]);

      try {
        const effectiveAppId = appId || "default-app-id";
        const usersUidCollectionRef = collection(
          db,
          `artifacts/${effectiveAppId}/users`
        );
        const usersUidSnapshot = await getDocs(usersUidCollectionRef);

        const fetchedUsersData = [];
        if (usersUidSnapshot.empty) {
          setModalMessage("沒有找到任何用戶資料。");
        }

        for (const userDoc of usersUidSnapshot.docs) {
          const uid = userDoc.id;

          const profileDocRef = doc(
            db,
            `artifacts/${effectiveAppId}/users/${uid}/profile/main`
          );

          try {
            const profileDocSnap = await getDoc(profileDocRef);

            if (profileDocSnap.exists()) {
              const profileData = profileDocSnap.data();
              fetchedUsersData.push({
                uid: uid,
                email: profileData.email || `未知郵箱`,
                isAdmin: profileData.isAdmin || false,
                createdAt: profileData.createdAt || "未知時間",
                username:
                  profileData.username ||
                  (profileData.email ? profileData.email.split("@")[0] : "N/A"),
                rank: profileData.rank || "7", // 等級已更新為預設 '7'
                lastLogin: profileData.lastLogin || "N/A",
              });
            } else {
              const userDataFromRootDoc = userDoc.data();
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
                rank: userDataFromRootDoc.rank || "7", // 等級已更新為預設 '7'
                lastLogin: userDataFromRootDoc.lastLogin || "N/A",
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
        setModalMessage(`獲取用戶資料失敗: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [db, currentUser, appId]);

  // 更新用戶管理員權限
  const handleUpdateAdminStatus = async (userId, newIsAdmin) => {
    try {
      setUpdating(true);
      await updateUserAdminStatus(userId, newIsAdmin);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.uid === userId ? { ...user, isAdmin: newIsAdmin } : user
        )
      );

      setModalMessage(
        `用戶權限已更新為: ${newIsAdmin ? "管理員" : "普通用戶"}`
      );
    } catch (error) {
      setModalMessage("更新失敗: " + error.message);
      console.error("更新管理員權限失敗:", error);
    } finally {
      setUpdating(false);
    }
  };

  // 導航到用戶詳細頁面 (現在使用查詢參數)
  const handleViewUserDetails = (uid) => {
    router.push(`/admin/editUsers?uid=${uid}`);
  };

  const closeModal = () => setModalMessage("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入用戶資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 p-4 font-inter">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 lg:p-8">
        {/* 頁面標題和返回按鈕 */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 sm:mb-0">
            管理員控制台
          </h1>
          <button
            onClick={onBackToHome}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-md flex items-center space-x-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span>返回首頁</span>
          </button>
        </div>

        {/* 當前管理員資訊 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-6 mb-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
            <span className="text-blue-700 font-bold text-2xl">
              {currentUser?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-semibold text-xl text-gray-900">
              {currentUser?.email}
            </p>
            <p className="text-sm text-blue-700 mt-1">您是當前登入的管理員。</p>
          </div>
        </div>

        {/* 用戶管理表格 */}
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
                      colSpan="6" // 更新 colSpan 以匹配新的欄位數量
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
                              disabled={updating || user.isAdmin}
                              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                user.isAdmin
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-green-600 text-white hover:bg-green-700"
                              }`}
                            >
                              設為管理員
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateAdminStatus(user.uid, false)
                              }
                              disabled={updating || !user.isAdmin}
                              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                !user.isAdmin
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-red-600 text-white hover:bg-red-700"
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

        {/* 使用說明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8 shadow-sm">
          <h3 className="text-xl font-semibold text-blue-800 mb-3">使用說明</h3>
          <ul className="text-sm text-blue-700 space-y-2 list-disc pl-5">
            <li>
              • 您可以在 Firebase Console 中直接修改用戶的{" "}
              <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded-md text-xs font-mono">
                isAdmin
              </code>{" "}
              字段
            </li>
            <li>• 或者使用本頁面中的按鈕來修改用戶權限</li>
            <li>• 管理員權限變更會立即生效</li>
            <li>• 請謹慎操作，確保不會意外移除自己的管理員權限</li>
            <li>• 點擊「查看詳細」按鈕可以查看和編輯用戶的個人資料</li>
          </ul>
        </div>
      </div>
      <Modal message={modalMessage} onClose={closeModal} />
    </div>
  );
};

export default AdminPage;
