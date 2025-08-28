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
      // 檢查 currentUser?.uid 確保用戶已登入
      const userProfileDocRef = doc(
        db,
        `artifacts/${appId}/users/${currentUser.uid}/profile`,
        "main"
      );

      // 使用 onSnapshot 監聽用戶資料的即時變化
      unsubscribe = onSnapshot(
        userProfileDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const count = (userData.favoriteRestaurants || []).length;
            setFavoriteRestaurantsCount(count);
            // 由於 toggleFavoriteRestaurant 會直接更新 currentUser，
            // 這裡不再需要 setCurrentUser 更新整個 currentUser，
            // 但如果 AuthCore 的 onAuthStateChanged 邏輯會定期拉取，
            // 這裡的 onSnapshot 可以作為一個更即時的輔助更新機制，
            // 或者確保 AuthCore 也能透過 onSnapshot 更新 currentUser。
            // 為了簡化和確保即時性，toggleFavoriteRestaurant 內部直接更新 currentUser。
          } else {
            setFavoriteRestaurantsCount(0);
          }
        },
        (error) => {
          console.error("useRestaurantFavorites: 監聽收藏餐廳失敗:", error);
          setFavoriteRestaurantsCount(0);
          setModalMessage(`加載收藏數量失敗: ${error.message}`);
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
        // 檢查 currentUser?.uid
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
        let message;
        if (currentFavorites.includes(restaurantId)) {
          newFavorites = currentFavorites.filter((id) => id !== restaurantId);
          
        } else {
          newFavorites = [...currentFavorites, restaurantId];
          
        }

        await updateDoc(userProfileDocRef, {
          favoriteRestaurants: newFavorites,
        });

        // <<< 關鍵修改：在 Firestore 更新後，立即更新 currentUser 狀態
        setCurrentUser((prevUser) => ({
          ...prevUser,
          favoriteRestaurants: newFavorites, // 更新 favoriteRestaurants 陣列
        }));

        setModalMessage(message);
        return true;
      } catch (error) {
        console.error("useRestaurantFavorites: 切換收藏餐廳狀態失敗:", error);
        setModalMessage("收藏操作失敗: " + error.message);
        throw error;
      }
    },
    [db, currentUser?.uid, appId, setCurrentUser, setModalMessage] // 確保 setCurrentUser 是依賴項
  );

  return { toggleFavoriteRestaurant, favoriteRestaurantsCount };
};
