// src/hooks/auth/useRestaurantFavorites.js
"use client";

import { useCallback } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";

/**
 * useRestaurantFavorites Hook:
 * 提供管理用戶收藏餐廳的函數。
 * @param {object} db - Firebase Firestore 實例。
 * @param {object} currentUser - 當前登入用戶物件。
 * @param {string} appId - 應用程式 ID。
 * @param {function} setCurrentUser - 更新 currentUser 狀態的回調。
 * @param {function} setModalMessage - 用於顯示模態框訊息的回調。
 * @returns {object} 包含 toggleFavoriteRestaurant 的物件。
 */
export const useRestaurantFavorites = (
  db,
  currentUser,
  appId,
  setCurrentUser,
  setModalMessage
) => {
  /**
   * 切換餐廳在用戶收藏列表中的狀態（新增或移除）。
   * @param {string} restaurantId - 要收藏或取消收藏的餐廳 ID。
   * @returns {Promise<boolean>} - 如果操作成功則返回 true。
   */
  const toggleFavoriteRestaurant = useCallback(
    async (restaurantId) => {
      if (!db || !currentUser) {
        setModalMessage("請先登入才能收藏或取消收藏餐廳。");
        return false;
      }

      const userId = currentUser.uid;
      const userProfileDocRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/profile`,
        "main"
      );

      try {
        const docSnap = await getDoc(userProfileDocRef);
        let currentFavorites = [];

        if (docSnap.exists()) {
          const userData = docSnap.data();
          currentFavorites = userData.favoriteRestaurants || [];
        }

        let newFavorites;
        if (currentFavorites.includes(restaurantId)) {
          newFavorites = currentFavorites.filter((id) => id !== restaurantId);
          setModalMessage("已從收藏移除。");
        } else {
          newFavorites = [...currentFavorites, restaurantId];
          setModalMessage("已添加到收藏。");
        }

        await updateDoc(userProfileDocRef, {
          favoriteRestaurants: newFavorites,
        });

        setCurrentUser((prevUser) => ({
          ...prevUser,
          favoriteRestaurants: newFavorites,
        }));
        return true;
      } catch (error) {
        console.error("useRestaurantFavorites: 切換收藏餐廳狀態失敗:", error);
        setModalMessage("收藏操作失敗: " + error.message);
        throw error;
      }
    },
    [db, currentUser, appId, setCurrentUser, setModalMessage]
  );

  return { toggleFavoriteRestaurant };
};
