// src/app/user/[userId]/page.js
"use client";

import React, { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "@/lib/auth-context";
import {
  // 移除 collection, query, getDocs, where, documentId,
  doc,
  getDoc,
} from "firebase/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";
import Activities from "@/components/user/Activities";
import ProfileSection from "@/components/user/ProfileSection";
import { checkModeration } from "@/lib/config/moderationConfig";
import Link from "next/link";

/**
 * User Profile Page: 顯示用戶的個人主頁內容。
 * 這是 /user/[userId] 路徑下的預設頁面。
 */
export default function UserReviewsPage({ params }) {
  const { userId } = React.use(params);
  const {
    currentUser,
    loadingUser,
    setModalMessage,
    db,
    appId,
    updateUserProfile,
  } = useContext(AuthContext);

  const isMyProfile = currentUser?.uid === userId;

  const [profileUser, setProfileUser] = useState(null);
  const [loadingProfileUser, setLoadingProfileUser] = useState(true);

  const [publishedReviews, setPublishedReviews] = useState([]);
  const [recentFavorites, setRecentFavorites] = useState([]);
  const [mostLikedReviews, setMostLikedReviews] = useState([]);
  const [mostCheckIns, setMostCheckIns] = useState([]);

  // ✅ 步驟 1: 將資料獲取邏輯提取為一個獨立的 useCallback 函數
  const loadUserProfile = useCallback(async () => {
    if (!db || !userId) {
      setLoadingProfileUser(false);
      return;
    }
    setLoadingProfileUser(true); // 重新載入時設置為 true
    const userDocRef = doc(db, `artifacts/${appId}/users/${userId}`);

    try {
      // --- 【Firebase Read 追蹤點 1: getDoc 讀取 (用戶資料)】 ---
      console.log(
        "FIREBASE_READ_TRACKER: Performing single getDoc read for user profile."
      );
      // ---------------------------------------------------------------

      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setProfileUser({ id: docSnap.id, ...userData });

        // 獲取列表資料 (假設列表資料可能依賴於個人資料中的某些字段)
        fetchReviewsAndFavorites(userData);
      } else {
        setProfileUser(null);
      }
      setLoadingProfileUser(false);
    } catch (error) {
      console.error("獲取用戶資料失敗:", error);
      setModalMessage(`獲取用戶資料失敗: ${error.message}`);
      setLoadingProfileUser(false);
    }
  }, [db, userId, appId, setModalMessage]);

  // 1. 獲取當前頁面顯示的用戶的個人資料 (在組件掛載時呼叫)
  useEffect(() => {
    loadUserProfile();
    // 💡 移除：由於是單次讀取，不需要清理函數
    return () => {};
  }, [loadUserProfile]); // 依賴 loadUserProfile

  // ✅ 核心修正：將所有資料獲取邏輯整合到一個函式中
  const fetchReviewsAndFavorites = async (userData) => {
    if (!db || !userId) return;

    // ... (獲取食評和最愛餐廳的 API 邏輯保持不變) ...
    // ================== 獲取最近食評 (API 路由) ==================
    try {
      // ✅ 使用 API 路由獲取最近的食評
      const apiUrl = `/api/reviews/user-reviews?userId=${userId}&appId=${appId}`;
      console.log(`API_READ_TRACKER: Fetching recent reviews from: ${apiUrl}`); // 追蹤 API 請求

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.statusText}`);
      }

      const data = await response.json();

      // 注意: API 路由中的讀取次數，必須在 API 路由的伺服器端程式碼中加入 console.log 或回傳。
      console.log(
        "API_READ_TRACKER: Recent reviews fetch complete. Total reviews:",
        data.reviews.length
      );

      // API 已經處理了排序和限制，我們直接使用返回的 reviews 陣列
      setPublishedReviews(data.reviews);
    } catch (error) {
      console.error("獲取評論失敗:", error);
      setModalMessage(`獲取評論失敗: ${error.message}`);
      setPublishedReviews([]);
    }
    // ================== 獲取最愛餐廳 (使用 API 路由) ==================
    if (
      userData.favoriteRestaurants &&
      userData.favoriteRestaurants.length > 0
    ) {
      try {
        const apiUrl = "/api/restaurants";
        console.log(
          `API_READ_TRACKER: Fetching favorite restaurants from: ${apiUrl}`
        ); // 追蹤 API 請求

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            favoriteRestaurantIds: userData.favoriteRestaurants,
          }),
        });

        if (!response.ok) {
          throw new Error(`API 請求失敗: ${response.statusText}`);
        }

        const data = await response.json();

        // 注意: API 路由中的讀取次數，必須在 API 路由的伺服器端程式碼中加入 console.log 或回傳。
        console.log(
          "API_READ_TRACKER: Favorite restaurants fetch complete. Total restaurants:",
          data.restaurants.length
        );

        const restaurants = data.restaurants.slice(0, 3); // 只取前 3 個
        setRecentFavorites(restaurants);
      } catch (error) {
        console.error("獲取最愛餐廳失敗:", error);
        setModalMessage(`獲取最愛餐廳失敗: ${error.message}`);
        setRecentFavorites([]);
      }
    } else {
      setRecentFavorites([]);
    }
  };

  // 舊有的監聽器，現在不需要了，因為我們從主文件獲取資料 (保留以避免修改其他邏輯)
  useEffect(() => {
    setMostLikedReviews([]);
    setMostCheckIns([]);
  }, [userId]);

  const handleUpdate = useCallback(
    async (updates) => {
      for (const key in updates) {
        if (key === "intro") {
          const moderationCheck = checkModeration(updates[key]);
          if (moderationCheck) {
            setModalMessage(moderationCheck, "warning");
            return;
          }
        }
      }
      try {
        await updateUserProfile(userId, updates);

        // ✅ 步驟 2: 更新成功後，手動呼叫重新載入資料
        console.log("用戶資料更新成功，正在手動重新載入用戶檔案...");
        await loadUserProfile();

        setModalMessage("個人檔案更新成功!", "success"); // 顯示成功訊息
      } catch (error) {
        setModalMessage(`更新失敗: ${error.message}`, "error");
        console.error("更新失敗:", error);
      }
    },
    [userId, updateUserProfile, setModalMessage, loadUserProfile] // 依賴 loadUserProfile
  );

  if (loadingUser || loadingProfileUser) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  const hasProfileContent =
    profileUser?.intro ||
    profileUser?.occupation ||
    profileUser?.favoriteCuisine ||
    profileUser?.tastes ||
    profileUser?.city;

  return (
    <div className="space-y-8 flex-grow">
      {/* 整合後的個人檔案區塊 */}
      {(isMyProfile || hasProfileContent) && (
        <ProfileSection
          title="個人檔案"
          isEditable={isMyProfile}
          onSave={handleUpdate}
          mainField={{
            key: "intro",
            label: "個人簡介",
            value: profileUser?.intro,
            isTextArea: true,
            placeholder: "例如：我是一個熱愛美食的冒險家...",
          }}
          sideFields={[
            {
              key: "occupation",
              label: "職業",
              value: profileUser?.occupation,
              placeholder: "例如：科技業",
            },
            {
              key: "city",
              label: "居住城市",
              value: profileUser?.city,
              placeholder: "例如：香港",
            },
            {
              key: "favoriteCuisine",
              label: "最愛菜系",
              value: profileUser?.favoriteCuisine,
              placeholder: "例如：日本料理",
            },
            {
              key: "tastes",
              label: "口味偏好",
              value: profileUser?.tastes,
              placeholder: "例如：喜歡甜點與咖啡",
            },
          ]}
        />
      )}

      {/* 3. 最近食評 */}
      <Activities
        title="最近食評"
        items={publishedReviews}
        noDataMessage="此用戶尚未發布任何食評。"
        type="reviews"
      />

      {/* 4. 最喜愛餐廳*/}
      <Activities
        title="最喜愛餐廳"
        items={recentFavorites}
        noDataMessage="此用戶尚未收藏任何餐廳。"
        type="favorites"
      />

      {/* 5. 最多讚的食評 */}
      {/* <Activities
        title="最多讚的食評"
        items={mostLikedReviews}
        noDataMessage="此用戶的食評還沒有獲得任何讚。"
        type="mostLiked"
      /> */}

      {/* 6. 最多到訪餐廳 */}
      {/* <Activities
        title="最多到訪餐廳"
        items={mostCheckIns}
        noDataMessage="此用戶尚未到訪任何餐廳。"
        type="checkIns"
      /> */}
    </div>
  );
}
