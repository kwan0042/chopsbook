// src/hooks/auth/useRestaurantFavorites.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";

/**
 * useRestaurantFavorites Hook:
 * 提供管理用戶收藏餐廳的函數，並監聽收藏數量。
 * @param {object} db - Firebase Firestore 實例。
 * @param {object} currentUser - 當前登入用戶物件。
 * @param {string} appId - 應用程式 ID。
 * @param {function} setCurrentUser - 更新 currentUser 狀態的回調。
 * @param {function} setModalMessage - 用於顯示模態框訊息的回調。
 * @returns {object} 包含 toggleFavoriteRestaurant 和 favoriteRestaurantsCount 的物件。
 */
export const useRestaurantFavorites = (
  db,
  currentUser,
  appId,
  setCurrentUser,
  setModalMessage
) => {
  // 收藏數量現在由 toggleFavoriteRestaurant 函數來更新
  const [favoriteRestaurantsCount, setFavoriteRestaurantsCount] = useState(0);

  // ✅ 修正點一：這個 useEffect 現在只在 currentUser 改變時進行一次性讀取
  useEffect(() => {
    // 檢查依賴項，確保有足夠的資訊才執行
    if (!db || !currentUser?.uid || !appId) {
      setFavoriteRestaurantsCount(0);
      return;
    }

    const fetchFavoritesCount = async () => {
      try {
        const userDocRef = doc(
          db,
          `artifacts/${appId}/users/${currentUser.uid}`
        );
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const count = (userData.favoriteRestaurants || []).length;
          setFavoriteRestaurantsCount(count);
        } else {
          setFavoriteRestaurantsCount(0);
        }
      } catch (error) {
        console.error("useRestaurantFavorites: 讀取收藏餐廳數量失敗:", error);
        setFavoriteRestaurantsCount(0);
      }
    };

    fetchFavoritesCount();

  }, [db, currentUser?.uid, appId]);

  /**
   * 切換餐廳在用戶收藏列表中的狀態（新增或移除）。
   * @param {string} restaurantId - 要收藏或取消收藏的餐廳 ID。
   * @returns {Promise<boolean>} - 如果操作成功則返回 true。
   */
  const toggleFavoriteRestaurant = useCallback(
    async (restaurantId) => {
      if (!db || !currentUser?.uid) {
        setModalMessage("請先登入才能收藏或取消收藏餐廳。");
        return false;
      }

      const userId = currentUser.uid;
      const userDocRef = doc(db, `artifacts/${appId}/users/${userId}`);

      try {
        const docSnap = await getDoc(userDocRef);
        let currentFavorites = [];

        if (docSnap.exists()) {
          const userData = docSnap.data();
          currentFavorites = userData.favoriteRestaurants || [];
        }

        let newFavorites;
        let message;
        if (currentFavorites.includes(restaurantId)) {
          newFavorites = currentFavorites.filter((id) => id !== restaurantId);
          
        } else {
          newFavorites = [...currentFavorites, restaurantId];
          
        }

        await updateDoc(userDocRef, {
          favoriteRestaurants: newFavorites,
        });

        // ✅ 修正點二：在 Firestore 更新後，立即更新本地的計數器
        // 這樣 UI 才能即時響應，而不需要即時監聽器
        setFavoriteRestaurantsCount(newFavorites.length);

        // 手動更新 AuthContext 的 currentUser 狀態，確保 UI 響應迅速
        setCurrentUser((prevUser) => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            favoriteRestaurants: newFavorites,
          };
        });

        setModalMessage(message);
        return true;
      } catch (error) {
        console.error("useRestaurantFavorites: 切換收藏餐廳狀態失敗:", error);
        setModalMessage("收藏操作失敗: " + error.message);
        throw error;
      }
    },
    [db, currentUser?.uid, appId, setCurrentUser, setModalMessage]
  );

  return { toggleFavoriteRestaurant, favoriteRestaurantsCount };
};
