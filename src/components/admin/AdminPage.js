// src/components/AdminPage.js
"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../lib/auth-context";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import Modal from "../Modal";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../LoadingSpinner";

// 導入新的管理組件
import RestaurantManagement from "./RestaurantManagement";
import UserRequestManagement from "./UserRequestManagement";
import ReviewManagement from "./ReviewManagement";
import RatingsPage from "./RatingsPage";
import UserManagement from "./UserManagement";

const AdminPage = ({ onBackToHome }) => {
  const {
    currentUser,
    db,
    updateUserAdminStatus,
    appId,
    formatDateTime,
    loadingUser,
  } = useContext(AuthContext);
  const router = useRouter();

  const [modalMessage, setModalMessage] = useState("");
  const [activeSection, setActiveSection] = useState("users");

  const closeModal = () => setModalMessage("");

  useEffect(() => {
    if (loadingUser) {
      return;
    }

    if (!currentUser) {
      router.push("/login");
      setModalMessage("請先登入才能訪問管理員頁面。");
      return;
    }

    if (!currentUser?.isAdmin) {
      setModalMessage("您沒有權限訪問此管理員頁面。");
      const timer = setTimeout(() => {
        window.location.href = "/";
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentUser, loadingUser, router]);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
        <p className="text-lg text-gray-700 ml-4">正在檢查您的權限...</p>
      </div>
    );
  }

  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-red-600">
          {modalMessage || "正在驗證您的權限..."}
        </p>
        <Modal
          message={modalMessage}
          onClose={closeModal}
          isOpen={!!modalMessage}
          type="error"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 p-4 font-inter">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 lg:p-8">
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
        <nav className="bg-white rounded-lg shadow-md mb-8 p-2 border border-gray-200">
          <ul className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4">
            <li>
              <button
                onClick={() => setActiveSection("users")}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeSection === "users"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                用戶管理
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("restaurants")}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeSection === "restaurants"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                餐廳管理
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("requests")}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeSection === "requests"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                用家請求管理
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("reviews")}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeSection === "reviews"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                食評管理
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("ratings")}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  activeSection === "ratings"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                評級頁面 (未開發)
              </button>
            </li>
          </ul>
        </nav>
        {activeSection === "users" && (
          <UserManagement setParentModalMessage={setModalMessage} />
        )}
        {activeSection === "restaurants" && <RestaurantManagement />}
        {activeSection === "requests" && (
          <UserRequestManagement setParentModalMessage={setModalMessage} />
        )}
        {activeSection === "reviews" && <ReviewManagement />}
        {activeSection === "ratings" && <RatingsPage />}

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
            <li>• 使用上方的導航欄切換不同的管理區塊</li>
          </ul>
        </div>
      </div>
      <Modal message={modalMessage} onClose={closeModal} />
    </div>
  );
};

export default AdminPage;
