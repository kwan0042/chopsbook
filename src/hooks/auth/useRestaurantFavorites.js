// src/hooks/auth/useRestaurantFavorites.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";

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
  setCurrentUser, // 確保這裡接收了 setCurrentUser
  setModalMessage
) => {
  const [favoriteRestaurantsCount, setFavoriteRestaurantsCount] = useState(0);

  // useEffect 監聽收藏列表的變化並更新數量
  useEffect(() => {
    let unsubscribe = () => {};

    if (db && currentUser?.uid && appId) {
      // 修正：將路徑改為與 useAuthCore 相同的單一用戶文件路徑
      const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}`);

      // 使用 onSnapshot 監聽用戶資料的即時變化
      unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const count = (userData.favoriteRestaurants || []).length;
            setFavoriteRestaurantsCount(count);
            
            // 可選：為了確保 UI 100% 同步，這裡可以手動更新整個 currentUser 物件
            // 但這可能會導致過多的 re-render，因此在大多數情況下，
            // toggleFavoriteRestaurant 內部和 AuthCore 的處理已經足夠。
            // setCurrentUser(userData);
          } else {
            setFavoriteRestaurantsCount(0);
          }
        },
        (error) => {
          console.error("useRestaurantFavorites: 監聽收藏餐廳失敗:", error);
          setFavoriteRestaurantsCount(0);
        }
      );
    } else {
      setFavoriteRestaurantsCount(0);
    }

    return () => unsubscribe();
  }, [db, currentUser?.uid, appId, setModalMessage]); // 依賴項包含 db, currentUser.uid, appId

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
      // 修正：將路徑改為與 useAuthCore 相同的單一用戶文件路徑
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
          message = "已從收藏移除！";
        } else {
          newFavorites = [...currentFavorites, restaurantId];
          message = "已加入收藏！";
        }

        // 使用 updateDoc 僅更新 favoriteRestaurants 欄位
        await updateDoc(userDocRef, {
          favoriteRestaurants: newFavorites,
        });

        // 關鍵修改：在 Firestore 更新後，立即更新 currentUser 狀態
        // 為了確保 UI 即時響應，這是必要的
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