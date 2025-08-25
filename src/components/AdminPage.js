// src/components/AdminPage.js
"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../lib/auth-context";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import Modal from "./Modal"; // 導入 Modal 組件

const AdminPage = ({ onBackToHome }) => {
  const { currentUser, db, updateUserAdminStatus, appId } =
    useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [modalMessage, setModalMessage] = useState(""); // 用於顯示訊息的 Modal 狀態

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
      setUsers([]); // 清空之前的用戶列表

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
          const uid = userDoc.id; // userDoc.id 是用戶的 UID

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
              });
            } else {
              // 如果 'profile/main' 子文檔缺失，嘗試從根用戶文檔獲取資料
              const userDataFromRootDoc = userDoc.data();
              fetchedUsersData.push({
                uid: uid,
                email: userDataFromRootDoc.email || `未知郵箱`,
                isAdmin: userDataFromRootDoc.isAdmin || false,
                createdAt: userDataFromRootDoc.createdAt || "未知時間",
              });
            }
          } catch (profileError) {
            // 即使子文檔獲取失敗，也應添加帶有默認/最少數據的用戶
            fetchedUsersData.push({
              uid: uid,
              email: `獲取失敗 (錯誤)`,
              isAdmin: false, // 錯誤時默認為非管理員
              createdAt: "未知時間",
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

      // 更新本地狀態
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
    } finally {
      setUpdating(false);
    }
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
    <div className="min-h-screen bg-gray-100 p-4 font-inter">
      <div className="max-w-6xl mx-auto">
        {/* 頁面標題和返回按鈕 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">管理員控制台</h1>
          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            返回首頁
          </button>
        </div>

        {/* 當前管理員資訊 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            當前管理員
          </h2>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-lg">
                {currentUser?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{currentUser?.email}</p>
              <p className="text-sm text-gray-500">管理員權限</p>
            </div>
          </div>
        </div>

        {/* 用戶管理表格 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">用戶管理</h2>
            <p className="text-sm text-gray-600 mt-1">管理用戶的管理員權限</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用戶
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    註冊時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    權限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      沒有找到任何用戶資料。
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-semibold text-sm">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.uid.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("zh-TW")
                          : "未知"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isAdmin
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.isAdmin ? "管理員" : "普通用戶"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.uid === currentUser?.uid ? (
                          <span className="text-gray-400">當前用戶</span>
                        ) : (
                          <div className="flex space-x-2">
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 使用說明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">使用說明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>
              • 您可以在 Firebase Console 中直接修改用戶的{" "}
              <code className="bg-blue-100 px-1 rounded">isAdmin</code> 字段
            </li>
            <li>• 或者使用上方的按鈕來修改用戶權限</li>
            <li>• 管理員權限變更會立即生效</li>
            <li>• 請謹慎操作，確保不會意外移除自己的管理員權限</li>
          </ul>
        </div>
      </div>
      <Modal message={modalMessage} onClose={closeModal} /> {/* 顯示 Modal */}
    </div>
  );
};

export default AdminPage;
