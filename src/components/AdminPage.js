// src/components/AdminPage.js
"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation"; // 導入 useRouter
import { AuthContext } from "../lib/auth-context"; // Path from components to lib
import Modal from "./Modal"; // Path from components to components
import LoadingSpinner from "./LoadingSpinner"; // Path from components to components
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  setDoc, // For copying application to restaurant
  getDocs, // For fetching all users (if needed for CRM)
} from "firebase/firestore";

/**
 * 輔助函數：將 Date 物件格式化為 "YYYY-MM-DD HH:MM:SS" 字串。
 * @param {Date} date - 要格式化的 Date 物件。
 * @returns {string} 格式化後的日期時間字串。
 */
const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * AdminPage: 提供管理員功能，包括用戶、餐廳和餐廳申請的 CRUD 操作。
 * @param {object} props - 組件屬性。
 * @param {function} props.onBackToHome - 返回主頁的回調函數。
 */
const AdminPage = ({ onBackToHome }) => {
  const {
    db,
    appId,
    currentUser,
    setModalMessage: setGlobalModalMessage,
  } = useContext(AuthContext);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("applications"); // 'applications', 'update_applications', 'restaurants', 'users'
  const [applications, setApplications] = useState([]); // 新餐廳申請
  const [updateApplications, setUpdateApplications] = useState([]); // 餐廳更新申請
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState(""); // 本地模態框訊息
  const [isGridView, setIsGridView] = useState(false); // 控制餐廳列表是否為網格視圖

  const closeModal = () => setModalMessage("");

  // Fetch Restaurant Applications (新餐廳申請)
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const q = query(
      collection(db, `artifacts/${appId}/public/data/restaurant_applications`)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setApplications(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching new applications:", error);
        setModalMessage(`獲取新餐廳申請失敗: ${error.message}`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db, appId]);

  // Fetch Restaurant Update Applications (餐廳更新申請)
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const q = query(
      collection(
        db,
        `artifacts/${appId}/public/data/restaurant_update_applications`
      )
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUpdateApplications(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching update applications:", error);
        setModalMessage(`獲取餐廳更新申請失敗: ${error.message}`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db, appId]);

  // Fetch Restaurants
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const q = query(
      collection(db, `artifacts/${appId}/public/data/restaurants`)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRestaurants(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching restaurants:", error);
        setModalMessage(`獲取餐廳失敗: ${error.message}`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db, appId]);

  // Fetch Users (User Profiles stored in Firestore)
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const q = query(collection(db, `artifacts/${appId}/users`));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setModalMessage(`獲取用戶失敗: ${error.message}`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db, appId]);

  // --- New Restaurant Applications Actions ---

  const handleApproveApplication = async (application) => {
    if (!db || !currentUser) {
      setModalMessage("Firebase DB 未初始化或未登入。");
      return;
    }
    setLoading(true);
    try {
      const restaurantRef = doc(
        db,
        `artifacts/${appId}/public/data/restaurants`,
        application.id
      );

      const now = new Date();
      const formattedApprovedAt = formatDateTime(now);
      const adminUserId = currentUser.uid;

      const approvedRestaurantData = {
        restaurantNameZh: application.restaurantNameZh || "",
        restaurantNameEn: application.restaurantNameEn || "",
        city: application.city || "",
        province: application.province || "",
        fullAddress: application.fullAddress || "",
        phone: application.phone || "",
        website: application.website || "",
        cuisineType: application.cuisineType || "",
        restaurantType: application.restaurantType || "",
        avgSpending: application.avgSpending || 0,
        facadePhotoUrls: application.facadePhotoUrls || [], // 確保處理多個圖片URL
        seatingCapacity: application.seatingCapacity || "",
        businessHours: application.businessHours || "",
        reservationModes: application.reservationModes || [],
        paymentMethods: application.paymentMethods || [],
        facilitiesServices: application.facilitiesServices || [],
        otherInfo: application.otherInfo || "",
        isManager: application.isManager || false,
        contactName: application.contactName || "",
        contactPhone: application.contactPhone || "",
        contactEmail: application.contactEmail || "",
        rating: application.rating || 0,
        reviewCount: application.reviewCount || 0,
        approvedAt: formattedApprovedAt,
        approvedBy: adminUserId,
        isTemporarilyClosed: application.isTemporarilyClosed || false,
        isPermanentlyClosed: application.isPermanentlyClosed || false,
      };
      await setDoc(restaurantRef, approvedRestaurantData); // Use setDoc to set a specific ID
      await deleteDoc(
        doc(
          db,
          `artifacts/${appId}/public/data/restaurant_applications`,
          application.id
        )
      );
      setModalMessage(
        `餐廳 '${
          approvedRestaurantData.restaurantNameZh ||
          approvedRestaurantData.restaurantNameEn
        }' 已成功批准並新增到餐廳列表。`
      );
    } catch (error) {
      console.error("Error approving application:", error);
      setModalMessage(`批准新餐廳申請失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectApplication = async (applicationId) => {
    if (!db) {
      setModalMessage("Firebase DB 未初始化。");
      return;
    }
    setLoading(true);
    try {
      await deleteDoc(
        doc(
          db,
          `artifacts/${appId}/public/data/restaurant_applications`,
          applicationId
        )
      );
      setModalMessage("新餐廳申請已成功拒絕。");
    } catch (error) {
      console.error("Error rejecting application:", error);
      setModalMessage(`拒絕新餐廳申請失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Restaurant Update Applications Actions ---

  const handleApproveUpdateApplication = async (updateApp) => {
    if (!db || !currentUser) {
      setModalMessage("Firebase DB 未初始化或未登入。");
      return;
    }
    setLoading(true);
    try {
      const restaurantRef = doc(
        db,
        `artifacts/${appId}/public/data/restaurants`,
        updateApp.restaurantId
      );

      const now = new Date();
      const formattedApprovedAt = formatDateTime(now);
      const adminUserId = currentUser.uid;

      // 使用 updateApp.updatedData 來更新餐廳
      await updateDoc(restaurantRef, {
        ...updateApp.updatedData, // 應用所有提交的更新資料
        updatedAt: formattedApprovedAt, // 記錄批准更新的時間
        updatedBy: adminUserId, // 記錄批准更新的管理員
      });
      await deleteDoc(
        doc(
          db,
          `artifacts/${appId}/public/data/restaurant_update_applications`,
          updateApp.id
        )
      );
      setModalMessage(
        `餐廳 '${
          updateApp.updatedData.restaurantNameZh ||
          updateApp.updatedData.restaurantNameEn
        }' 的更新已成功批准。`
      );
    } catch (error) {
      console.error("Error approving update application:", error);
      setModalMessage(`批准更新申請失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectUpdateApplication = async (updateApplicationId) => {
    if (!db) {
      setModalMessage("Firebase DB 未初始化。");
      return;
    }
    setLoading(true);
    try {
      await deleteDoc(
        doc(
          db,
          `artifacts/${appId}/public/data/restaurant_update_applications`,
          updateApplicationId
        )
      );
      setModalMessage("餐廳更新申請已成功拒絕。");
    } catch (error) {
      console.error("Error rejecting update application:", error);
      setModalMessage(`拒絕更新申請失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Restaurant Management Actions (保持不變) ---

  const handleDeleteRestaurant = async (restaurantId) => {
    if (!db) {
      setModalMessage("Firebase DB 未初始化。");
      return;
    }
    setLoading(true);
    try {
      await deleteDoc(
        doc(db, `artifacts/${appId}/public/data/restaurants`, restaurantId)
      );
      setModalMessage("餐廳已成功刪除。");
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      setModalMessage(`刪除餐廳失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRestaurant = async (restaurant) => {
    if (!db) {
      setModalMessage("Firebase DB 未初始化。");
      return;
    }
    setModalMessage(
      `更新餐廳 '${
        restaurant.restaurantNameZh || restaurant.restaurantNameEn
      }' 功能尚待開發。(直接更新)`
    );
  };

  // --- User Management Actions (保持不變) ---
  const handleDeleteUser = async (userId) => {
    if (!db) {
      setModalMessage("Firebase DB 未初始化。");
      return;
    }
    setLoading(true);
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/users`, userId));
      setModalMessage("用戶檔案已成功刪除。");
    } catch (error) {
      console.error("Error deleting user profile:", error);
      setModalMessage(`刪除用戶檔案失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (user) => {
    if (!db) {
      setModalMessage("Firebase DB 未初始化。");
      return;
    }
    setModalMessage(`更新用戶 '${user.email || user.id}' 功能尚待開發。`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full relative mb-8">
        <button
          onClick={onBackToHome}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
          aria-label="返回首頁"
        >
          &times;
        </button>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
          管理員面板
        </h2>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed text-center">
          在這裡管理餐廳申請、更新申請、現有餐廳和用戶資料。
        </p>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("applications")}
            className={`py-3 px-6 text-lg font-semibold transition-colors duration-200 ${
              activeTab === "applications"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            新餐廳申請 ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab("update_applications")}
            className={`py-3 px-6 text-lg font-semibold transition-colors duration-200 ${
              activeTab === "update_applications"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            更新申請 ({updateApplications.length})
          </button>
          <button
            onClick={() => setActiveTab("restaurants")}
            className={`py-3 px-6 text-lg font-semibold transition-colors duration-200 ${
              activeTab === "restaurants"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            現有餐廳 ({restaurants.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`py-3 px-6 text-lg font-semibold transition-colors duration-200 ${
              activeTab === "users"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            用戶管理 ({users.length})
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === "applications" && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              待批新餐廳申請
            </h3>
            {applications.length === 0 ? (
              <p className="text-center text-gray-600">
                目前沒有待處理的新餐廳申請。
              </p>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <p className="font-semibold text-lg">
                      {app.restaurantNameZh || app.restaurantNameEn}
                    </p>
                    <p className="text-gray-700 text-sm">
                      提交者: {app.submittedBy}
                    </p>
                    <p className="text-gray-700 text-sm">
                      聯絡電話: {app.contactPhone}
                    </p>
                    <p className="text-gray-700 text-sm">
                      菜系: {app.cuisineType}
                    </p>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => handleApproveApplication(app)}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm transition duration-200"
                      >
                        批准
                      </button>
                      <button
                        onClick={() => handleRejectApplication(app.id)}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm transition duration-200"
                      >
                        拒絕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "update_applications" && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              待批餐廳更新申請
            </h3>
            {updateApplications.length === 0 ? (
              <p className="text-center text-gray-600">
                目前沒有待處理的餐廳更新申請。
              </p>
            ) : (
              <div className="space-y-4">
                {updateApplications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <p className="font-semibold text-lg">
                      更新餐廳 ID: {app.restaurantId}
                      <br />
                      餐廳名稱:{" "}
                      {app.updatedData?.restaurantNameZh ||
                        app.updatedData?.restaurantNameEn ||
                        "N/A"}
                    </p>
                    <p className="text-gray-700 text-sm">
                      提交者: {app.submittedBy}
                    </p>
                    <p className="text-gray-700 text-sm">
                      提交時間: {app.submittedAt}
                    </p>
                    <p className="text-gray-700 text-sm font-bold mt-2">
                      修改內容預覽:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 text-sm ml-4">
                      {Object.keys(app.updatedData).map((key) => {
                        // 比較原始數據和更新數據，只顯示有變更的項目
                        if (
                          JSON.stringify(app.originalData?.[key]) !==
                          JSON.stringify(app.updatedData[key])
                        ) {
                          return (
                            <li key={key}>
                              **{key}**: 原值:{" "}
                              {JSON.stringify(app.originalData?.[key] || "無")}{" "}
                              {">"} {/* 已修正 JSX 語法 */}
                              新值: {JSON.stringify(app.updatedData[key])}
                            </li>
                          );
                        }
                        return null; // 如果沒有變更則不顯示
                      })}
                    </ul>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => handleApproveUpdateApplication(app)}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm transition duration-200"
                      >
                        批准更新
                      </button>
                      <button
                        onClick={() => handleRejectUpdateApplication(app.id)}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm transition duration-200"
                      >
                        拒絕更新
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "restaurants" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">現有餐廳</h3>
              <button
                onClick={() => setIsGridView(!isGridView)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm transition duration-200"
              >
                {isGridView ? "切換到列表模式" : "切換到網格模式"}
              </button>
            </div>
            {restaurants.length === 0 ? (
              <p className="text-center text-gray-600">目前沒有餐廳資料。</p>
            ) : (
              <div
                className={
                  isGridView
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {restaurants.map((rest) => (
                  <div
                    key={rest.id}
                    className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <p className="font-semibold text-lg">
                      {rest.restaurantNameZh || rest.restaurantNameEn}
                    </p>
                    <p className="text-gray-700 text-sm">
                      菜系: {rest.cuisineType}
                    </p>
                    <p className="text-gray-700 text-sm">
                      地址: {rest.fullAddress}
                    </p>
                    <div className="mt-3 flex space-x-2">
                      {/* 直接更新按鈕在 AdminPage 中，但實際更新會透過 updateDoc */}
                      <button
                        onClick={() => handleUpdateRestaurant(rest)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm transition duration-200"
                      >
                        更新 (直接)
                      </button>
                      <button
                        onClick={() => handleDeleteRestaurant(rest.id)}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm transition duration-200"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">用戶管理</h3>
            {users.length === 0 ? (
              <p className="text-center text-gray-600">
                目前沒有用戶檔案資料。
              </p>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <p className="font-semibold text-lg">用戶 ID: {user.id}</p>
                    {user.email && (
                      <p className="text-gray-700 text-sm">
                        Email: {user.email}
                      </p>
                    )}
                    {user.username && (
                      <p className="text-gray-700 text-sm">
                        用戶名: {user.username}
                      </p>
                    )}
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => handleUpdateUser(user)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm transition duration-200"
                      >
                        更新
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm transition duration-200"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Modal message={modalMessage} onClose={closeModal} />
    </div>
  );
};

export default AdminPage;
