// src/components/UserDetailPage.js
"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";
// 請再次確認此路徑及檔名 (auth-context.js) 在您的專案中是否完全正確 (例如：src/lib/auth-context.js)。
// 如果 UserDetailPage.js 在 src/components，那麼 AuthContext.js 應在 src/lib。
import { AuthContext } from "../lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
// 請再次確認此路徑及檔名 (Modal.js) 在您的專案中是否完全正確 (例如：src/components/Modal.js)。
import Modal from "./Modal";
// next/navigation 是 Next.js 的內建模組。請確保您的 Next.js 專案環境已正確設定且依賴 (npm install) 已安裝。
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
    db,
    appId,
    loadingUser,
    updateUserProfile,
    sendPasswordResetLink,
  } = useContext(AuthContext);
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false); // 控制編輯模式
  const [formData, setFormData] = useState({}); // 用於編輯時的表單數據
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState(""); // "success" or "error"
  const [favoriteRestaurantNames, setFavoriteRestaurantNames] = useState([]); // 儲存收藏餐廳的名稱
  const [loadingFavorites, setLoadingFavorites] = useState(true); // 收藏餐廳名稱的載入狀態
  const [isSaving, setIsSaving] = useState(false); // 儲存按鈕的載入狀態
  const [isSendingResetLink, setIsSendingResetLink] = useState(false); // 發送重設鏈接按鈕的載入狀態
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(null); // 新增：儲存成功訊息

  // 等級選項 (數字，0 代表管理員)
  const rankOptions = [0, 1, 2, 3, 4, 5, 6, 7]; // 0 通常代表管理員, 1-7 為普通等級

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

  // 獲取用戶資料
  useEffect(() => {
    const fetchUserData = async () => {
      if (!db || !appId || loadingUser) {
        return;
      }

      setLoading(true);
      setModalMessage("");
      setModalType("");

      // 檢查用戶權限：只有管理員可以查看所有用戶資料，普通用戶只能查看自己的資料
      if (!currentUser?.isAdmin) {
        setModalMessage("您沒有權限查看此用戶資料。");
        setModalType("error");
        setLoading(false);
        router.push("/admin");
        return;
      }

      try {
        const userProfileDocRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/profile`,
          "main"
        );
        const docSnap = await getDoc(userProfileDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setFormData(data); // 初始化表單數據

          // --- 獲取收藏餐廳名稱的邏輯 ---
          setLoadingFavorites(true);
          if (data.favoriteRestaurants && data.favoriteRestaurants.length > 0) {
            const restaurantNamesPromises = data.favoriteRestaurants.map(
              async (restaurantId) => {
                const restaurantDocRef = doc(
                  db,
                  `artifacts/${appId}/public/data/restaurants`,
                  restaurantId
                );
                const restaurantDocSnap = await getDoc(restaurantDocRef);
                if (restaurantDocSnap.exists()) {
                  const restaurantData = restaurantDocSnap.data();
                  return (
                    restaurantData.restaurantNameZh ||
                    restaurantData.restaurantNameEn ||
                    `未知餐廳 (ID: ${restaurantId})`
                  );
                } else {
                  return `已刪除餐廳 (ID: ${restaurantId})`; // 如果餐廳不存在
                }
              }
            );
            const names = await Promise.all(restaurantNamesPromises);
            setFavoriteRestaurantNames(names);
          } else {
            setFavoriteRestaurantNames([]);
          }
          setLoadingFavorites(false);
        } else {
          setModalMessage("找不到該用戶的資料。");
          setModalType("error");
          setLoadingFavorites(false); // 確保在無用戶資料時也關閉載入狀態
        }
      } catch (error) {
        console.error("獲取用戶資料失敗:", error);
        setModalMessage(`獲取用戶資料失敗: ${error.message}`);
        setModalType("error");
        setLoadingFavorites(false); // 確保在錯誤發生時也關閉載入狀態
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, db, appId, currentUser, loadingUser, router]);

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
    // 將等級轉換為數字，如果不是數字則保留原值
    setFormData((prev) => ({
      ...prev,
      [name]: name === "rank" ? parseInt(value, 10) : value,
    }));
  }, []);

  // 處理「儲存變更」
  const handleSaveChanges = async () => {
    setIsSaving(true); // 開始儲存，設置載入狀態
    setModalMessage("");
    setModalType("");
    setSaveSuccessMessage(null); // 清除之前的成功訊息

    // 權限檢查
    if (!currentUser?.isAdmin) {
      setModalMessage("您沒有權限修改此用戶資料。");
      setModalType("error");
      setIsSaving(false);
      return;
    }

    try {
      const updates = {};
      // 僅在值發生變化時才添加到 updates 物件
      if (formData.username !== userData.username)
        updates.username = formData.username;
      if (formData.phoneNumber !== userData.phoneNumber)
        updates.phoneNumber = formData.phoneNumber;
      // 處理等級更新
      if (formData.rank !== userData.rank) {
        updates.rank = formData.rank;
      }
      if (formData.photoURL !== userData.photoURL)
        updates.photoURL = formData.photoURL;

      if (Object.keys(updates).length > 0) {
        await updateUserProfile(userId, updates);
        setUserData((prev) => ({ ...prev, ...updates })); // 更新本地顯示數據
        setModalMessage("用戶資料更新成功！");
        setModalType("success");
        setSaveSuccessMessage("更改已儲存！"); // 顯示儲存成功訊息
        setEditing(false); // 儲存成功後退出編輯模式
      } else {
        setModalMessage("沒有任何變更需要儲存。");
        setModalType("info");
        setEditing(false); // 沒有變更也退出編輯模式
      }
    } catch (error) {
      console.error("更新用戶資料失敗:", error);
      setModalMessage(`更新失敗: ${error.message}`);
      setModalType("error");
    } finally {
      setIsSaving(false); // 儲存操作結束，解除載入狀態
    }
  };

  // 處理「重設密碼」
  const handleSendResetPasswordLink = async () => {
    setIsSendingResetLink(true); // 開始發送，設置載入狀態
    setModalMessage("");
    setModalType("");

    if (!currentUser?.isAdmin) {
      setModalMessage("您沒有權限向其他用戶發送密碼重設電郵。");
      setModalType("error");
      setIsSendingResetLink(false);
      return;
    }

    try {
      if (userData?.email) {
        await sendPasswordResetLink(userData.email);
        setModalMessage(`已向 ${userData.email} 發送密碼重設電郵。`);
        setModalType("success");
      } else {
        setModalMessage("該用戶沒有有效的電郵地址可發送重設鏈接。");
        setModalType("error");
      }
    } catch (error) {
      console.error("發送密碼重設電郵失敗:", error);
      setModalMessage(`發送失敗: ${error.message}`);
      setModalType("error");
    } finally {
      setIsSendingResetLink(false); // 發送操作結束，解除載入狀態
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

  // 顯示 rank 的文字描述

  // 統一的輸入/顯示欄位樣式
  const commonFieldClass =
    "w-full p-3 bg-gray-50 rounded-md border border-gray-200 text-gray-800 h-[48px] flex items-center"; // 固定高度

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
        <h2 className="text-4xl font-extrabold text-gray-900 mb-2 text-center">
          用戶詳細資料
        </h2>
        {saveSuccessMessage && (
          <p className="text-center text-green-600 font-medium mb-4">
            {saveSuccessMessage}
          </p>
        )}

        {/* 編輯/儲存/取消按鈕區域 (右上角) */}
        <div className="flex justify-end mb-4 gap-4">
          {canEdit &&
            !editing && ( // 非編輯模式下顯示「發送重設密碼鏈接」和「編輯資料」
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

        {/* 主要用戶詳細資料網格 (左側和右側) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 左側欄位 */}
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
                  value={formData.rank} // 直接使用數字值
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-[48px]"
                >
                  {rankOptions.map((option) => (
                    <option key={option} value={option}>
                      {option} {/* 顯示文本 */}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={commonFieldClass}>{userData.rank}</p>
              )}
            </div>

            {/* 最愛餐廳清單 (現在位於左側欄下方，高約兩個欄位的高度) */}
            <div className="flex-grow">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                最愛餐廳清單 (按排序)
              </label>
              <div className="w-full p-3 bg-gray-50 rounded-md border border-gray-200 min-h-[104px] text-gray-800 h-full">
                {" "}
                {/* 調整 min-h 以適應兩個欄位高度 */}
                {loadingFavorites ? (
                  <p className="text-gray-500 text-sm">載入收藏餐廳中...</p>
                ) : favoriteRestaurantNames.length > 0 ? (
                  <ol className="list-decimal pl-5 space-y-1">
                    {favoriteRestaurantNames.map((name, index) => (
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

          {/* 右側欄位 */}
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
            {/* 個人相片 (URL) 現在也位於右側欄，以平衡佈局 */}
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
            {/* 已發佈食評清單 (現在位於右側欄下方，高約兩個欄位的高度) */}
            <div className="flex-grow">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                已發佈食評清單
              </label>
              <div className="w-full p-3 bg-gray-50 rounded-md border border-gray-200 min-h-[104px] text-gray-800 h-full">
                {" "}
                {/* 調整 min-h 以適應兩個欄位高度 */}
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

        {/* 保存資料與取消按鈕 (獨立一行，位於最下方) */}
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
