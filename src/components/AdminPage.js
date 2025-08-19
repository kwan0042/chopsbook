// src/components/AdminPage.js
"use client";

import React, { useState, useEffect, useContext } from "react";
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
 * AdminPage: 提供管理員功能，包括用戶、餐廳和餐廳申請的 CRUD 操作。
 * @param {object} props - 組件屬性。
 * @param {function} props.onBackToHome - 返回主頁的回調函數。
 */
const AdminPage = ({ onBackToHome }) => {
  const {
    db,
    appId,
    setModalMessage: setGlobalModalMessage,
  } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("applications"); // 'applications', 'restaurants', 'users'
  const [applications, setApplications] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState(""); // 本地模態框訊息

  const closeModal = () => setModalMessage("");

  // Fetch Restaurant Applications
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
        console.error("Error fetching applications:", error);
        setModalMessage(`獲取申請失敗: ${error.message}`);
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
  // Assuming a 'users' collection where doc.id is the user's UID
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const q = query(collection(db, `artifacts/${appId}/public/data/users`));
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

  // --- Restaurant Applications Actions ---

  const handleApproveApplication = async (application) => {
    if (!db) {
      setModalMessage("Firebase DB 未初始化。");
      return;
    }
    setLoading(true);
    try {
      const restaurantRef = doc(
        db,
        `artifacts/${appId}/public/data/restaurants`,
        application.id
      );
      // Copy relevant data from application to the main restaurants collection
      // You might want to pick specific fields from application to store in restaurants
      const approvedRestaurantData = {
        name: application.restaurantNameZh || application.restaurantNameEn,
        cuisine: application.cuisineType,
        address: application.fullAddress,
        phone: application.phone,
        website: application.website || "",
        imageUrl: application.facadePhotoUrl || "",
        seatingCapacity: application.seatingCapacity,
        businessHours: application.businessHours,
        reservationModes: application.reservationModes,
        paymentMethods: application.paymentMethods,
        facilitiesServices: application.facilitiesServices,
        avgSpending: application.avgSpending,
        // Add default or initial values for fields like rating, reviewCount if not present
        rating: 0, // Initial rating
        reviewCount: 0, // Initial review count
        // You might want to store who approved it and when
        approvedAt: new Date(),
        approvedBy: "admin_user_id_placeholder", // Replace with actual admin user ID
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
        `餐廳 '${approvedRestaurantData.name}' 已成功批准並新增到餐廳列表。`
      );
    } catch (error) {
      console.error("Error approving application:", error);
      setModalMessage(`批准申請失敗: ${error.message}`);
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
      setModalMessage("餐廳申請已成功拒絕。");
    } catch (error) {
      console.error("Error rejecting application:", error);
      setModalMessage(`拒絕申請失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Restaurant Management Actions ---

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
    // In a real app, you'd show a form to edit the restaurant data.
    // For this example, we'll just show a placeholder.
    setModalMessage(`更新餐廳 '${restaurant.name}' 功能尚待開發。`);
    // Example: await updateDoc(doc(db, `artifacts/${appId}/public/data/restaurants`, restaurant.id), { someField: 'newValue' });
  };

  // --- User Management Actions ---
  // Note: Managing actual Firebase Auth users (creating/deleting them) should be done via Firebase Admin SDK
  // on a secure backend server, not directly from client-side code for security reasons.
  // Here, we're managing 'user profiles' stored in Firestore.

  const handleDeleteUser = async (userId) => {
    if (!db) {
      setModalMessage("Firebase DB 未初始化。");
      return;
    }
    setLoading(true);
    try {
      // Deleting user profile from Firestore
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
    // In a real app, you'd show a form to edit the user data.
    setModalMessage(`更新用戶 '${user.email || user.id}' 功能尚待開發。`);
  };

  // Assuming `currentUser` from AuthContext would be used to check admin roles
  // For simplicity, let's assume if currentUser exists, they can access this page.
  // In a real app, implement role-based access control.
  // const isAdmin = currentUser && currentUser.email === 'admin@example.com';

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
          在這裡管理餐廳申請、現有餐廳和用戶資料。
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
            餐廳申請 ({applications.length})
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
              待批餐廳申請
            </h3>
            {applications.length === 0 ? (
              <p className="text-center text-gray-600">
                目前沒有待處理的餐廳申請。
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

        {activeTab === "restaurants" && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">現有餐廳</h3>
            {restaurants.length === 0 ? (
              <p className="text-center text-gray-600">目前沒有餐廳資料。</p>
            ) : (
              <div className="space-y-4">
                {restaurants.map((rest) => (
                  <div
                    key={rest.id}
                    className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <p className="font-semibold text-lg">{rest.name}</p>
                    <p className="text-gray-700 text-sm">
                      菜系: {rest.cuisine}
                    </p>
                    <p className="text-gray-700 text-sm">
                      地址: {rest.address}
                    </p>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => handleUpdateRestaurant(rest)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm transition duration-200"
                      >
                        更新
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
