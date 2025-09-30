// src/components/UserDetailPage.js
"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../../lib/auth-context";
import Modal from "../../Modal";
import { useRouter } from "next/navigation";

// 圖標：用於返回按鈕
const ArrowLeftIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-5 w-5 ${className}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const UserDetailPage = ({ userId }) => {
  const {
    currentUser,
    loadingUser,
    formatDateTime,
    auth,
    setGlobalModalMessage,
  } = useContext(AuthContext);
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingResetLink, setIsSendingResetLink] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(null);

  const rankOptions = [0, 1, 2, 3, 4, 5, 6, 7];

  // 獲取用戶資料
  useEffect(() => {
    const fetchUserData = async () => {
      if (loadingUser) {
        return;
      }

      setLoading(true);
      setModalMessage("");
      setModalType("");

      if (!currentUser?.isAdmin) {
        setModalMessage("您沒有權限查看此用戶資料。", "error");
        setLoading(false);
        router.push("/admin");
        return;
      }

      try {
        const token = await auth.currentUser.getIdToken();
        // ✅ 修正點: 呼叫一個新的後端 API 端點來獲取用戶資料
        const response = await fetch(`/api/admin/get-user/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "無法載入用戶資料。");
        }

        const data = await response.json();
        setUserData(data);
        setFormData(data); // 初始化表單數據
      } catch (error) {
        console.error("獲取用戶資料失敗:", error);
        setModalMessage(`獲取用戶資料失敗: ${error.message}`, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUser, loadingUser, router, auth, setGlobalModalMessage]);

  // 清除儲存成功訊息的 useEffect
  useEffect(() => {
    if (saveSuccessMessage) {
      const timer = setTimeout(() => setSaveSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccessMessage]);

  // 處理表單欄位變化
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "rank" ? parseInt(value, 10) : value,
    }));
  }, []);

  // 處理「儲存變更」
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setModalMessage("");
    setModalType("");
    setSaveSuccessMessage(null);

    if (!currentUser?.isAdmin) {
      setModalMessage("您沒有權限修改此用戶資料。", "error");
      setIsSaving(false);
      return;
    }

    try {
      const updates = {};
      if (formData.username !== userData.username)
        updates.username = formData.username;
      if (formData.phoneNumber !== userData.phoneNumber)
        updates.phoneNumber = formData.phoneNumber;
      if (formData.rank !== userData.rank) {
        updates.rank = formData.rank;
      }
      if (formData.photoURL !== userData.photoURL)
        updates.photoURL = formData.photoURL;

      if (Object.keys(updates).length > 0) {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`/api/admin/manage-users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "updateUserProfile",
            targetUid: userId,
            updates: updates,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "更新用戶資料失敗。");
        }

        // ✅ 成功後更新前端狀態，這才是安全的做法
        const updatedData = { ...userData, ...updates };
        setUserData(updatedData);
        setFormData(updatedData);

        setSaveSuccessMessage("更改已儲存！");
        setEditing(false);
      } else {
        setModalMessage("沒有任何變更需要儲存。", "info");
        setEditing(false);
      }
    } catch (error) {
      console.error("更新用戶資料失敗:", error);
      setModalMessage(`更新失敗: ${error.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // 處理「重設密碼」
  const handleSendResetPasswordLink = async () => {
    setIsSendingResetLink(true);
    setModalMessage("");
    setModalType("");

    if (!currentUser?.isAdmin) {
      setModalMessage("您沒有權限向其他用戶發送密碼重設電郵。", "error");
      setIsSendingResetLink(false);
      return;
    }

    try {
      if (userData?.email) {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`/api/admin/manage-users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "sendPasswordResetLink",
            email: userData.email,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "發送密碼重設電郵失敗。");
        }
        setModalMessage(`已向 ${userData.email} 發送密碼重設電郵。`, "success");
      } else {
        setModalMessage("該用戶沒有有效的電郵地址可發送重設鏈接。", "error");
      }
    } catch (error) {
      console.error("發送密碼重設電郵失敗:", error);
      setModalMessage(`發送失敗: ${error.message}`, "error");
    } finally {
      setIsSendingResetLink(false);
    }
  };

  const closeModal = () => {
    setModalMessage("");
    setModalType("");
  };

  if (loading || loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">資料載入中...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-xl text-red-600 mb-4">
          {modalMessage || "無法載入用戶資料。"}
        </p>
        <button
          onClick={() => router.push("/admin")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          返回管理員頁面
        </button>
        {modalMessage && (
          <Modal
            message={modalMessage}
            onClose={closeModal}
            isOpen={!!modalMessage}
            type={modalType}
          />
        )}
      </div>
    );
  }

  const canEdit = currentUser?.isAdmin;

  const commonFieldClass =
    "w-full p-3 bg-gray-50 rounded-md border border-gray-200 text-gray-800 h-[48px] flex items-center";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center font-inter">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl relative">
        <button
          onClick={() => router.push("/admin")}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors flex items-center"
          aria-label="返回管理員頁面"
        >
          <ArrowLeftIcon className="mr-2" />
          返回
        </button>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">
          用戶詳細資料
        </h2>
        {saveSuccessMessage && (
          <p className="text-center text-green-600 font-medium mb-4">
            {saveSuccessMessage}
          </p>
        )}

        <div className="flex justify-end mb-4 gap-4">
          {canEdit && !editing && (
            <>
              <button
                onClick={handleSendResetPasswordLink}
                disabled={isSendingResetLink}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md shadow-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingResetLink ? "發送中..." : "發送重設密碼鏈接"}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                編輯資料
              </button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                註冊時間
              </label>
              <p className={commonFieldClass}>
                {formatDateTime(userData.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                用戶ID
              </label>
              <p className={commonFieldClass + " break-all"}>{userId}</p>
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                電郵
              </label>
              <p id="email" className={commonFieldClass}>
                {userData.email}
              </p>
            </div>
            <div>
              <label
                htmlFor="rank"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                等級
              </label>
              {editing ? (
                <select
                  id="rank"
                  name="rank"
                  value={formData.rank}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-[48px]"
                >
                  {rankOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={commonFieldClass}>{userData.rank}</p>
              )}
            </div>
            <div className="flex-grow">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                最愛餐廳清單 (按排序)
              </label>
              <div className="w-full p-3 bg-gray-50 rounded-md border border-gray-200 min-h-[104px] text-gray-800 h-full">
                {userData.favoriteRestaurantNames?.length > 0 ? (
                  <ol className="list-decimal pl-5 space-y-1">
                    {userData.favoriteRestaurantNames.map((name, index) => (
                      <li key={index} className="text-sm">
                        {name}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-gray-500 text-sm">暫無最愛餐廳。</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                最後登入
              </label>
              <p className={commonFieldClass + " break-all"}>
                {formatDateTime(userData.lastLogin)}
              </p>
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                用戶名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username || ""}
                onChange={handleChange}
                disabled={!editing}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 h-[48px]"
              />
            </div>
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                電話
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={handleChange}
                disabled={!editing}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 h-[48px]"
                placeholder="例如：123-456-7890"
              />
            </div>

            <div>
              <label
                htmlFor="photoURL"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                個人相片 (URL)
              </label>
              <input
                type="url"
                id="photoURL"
                name="photoURL"
                value={formData.photoURL || ""}
                onChange={handleChange}
                disabled={!editing}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 h-[48px]"
                placeholder="輸入圖片URL"
              />
              {formData.photoURL && (
                <img
                  src={formData.photoURL}
                  alt="用戶頭像"
                  className="w-24 h-24 rounded-full object-cover mt-2 mx-auto"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://placehold.co/96x96/cccccc/000000?text=無頭像";
                  }}
                />
              )}
            </div>
            <div className="flex-grow">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                已發佈食評清單
              </label>
              <div className="w-full p-3 bg-gray-50 rounded-md border border-gray-200 min-h-[104px] text-gray-800 h-full">
                {userData.publishedReviews?.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {userData.publishedReviews.map((review, index) => (
                      <li key={index}>{review}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">暫無已發佈食評。</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full border-t border-gray-200 my-8"></div>

        {canEdit && editing && (
          <div className="w-full flex justify-between mt-8 mb-4">
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "儲存中..." : "儲存變更"}
            </button>
            <button
              onClick={() => {
                setFormData(userData);
                setEditing(false);
              }}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
          </div>
        )}
      </div>
      {modalMessage && (
        <Modal
          message={modalMessage}
          onClose={closeModal}
          isOpen={!!modalMessage}
          type={modalType}
        />
      )}
    </div>
  );
};

export default UserDetailPage;
