// src/hooks/auth/useReviewManagement.js
"use client";

import { useCallback } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  increment,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { forbiddenWords } from "../../lib/config/moderationConfig.js"; // 導入敏感詞彙列表

/**
 * checkModeration: 簡單的敏感詞彙檢查。
 * @param {string} text - 要檢查的文本內容。
 * @returns {string | null} - 如果包含敏感詞彙則返回警告訊息，否則返回 null。
 */
export const checkModeration = (text) => {
  const lowerCaseText = text.toLowerCase();
  for (const word of forbiddenWords) {
    if (lowerCaseText.includes(word)) {
      return `食評包含敏感詞彙: "${word}"`;
    }
  }
  return null;
};

/**
 * useReviewManagement Hook:
 * 提供食評提交、草稿儲存和內容審核相關的函數。
 * @param {object} db - Firebase Firestore 實例。
 * @param {object} currentUser - 當前登入用戶物件。
 * @param {string} appId - 應用程式 ID。
 * @param {function} setCurrentUser - 更新 currentUser 狀態的回調。
 * @param {function} setModalMessage - 用於顯示模態框訊息的回調。
 * @returns {object} 包含 submitReview, saveReviewDraft, checkModeration 的物件。
 */
export const useReviewManagement = (
  db,
  currentUser,
  appId,
  setCurrentUser,
  setModalMessage
) => {
  /**
   * 提交餐廳食評。
   * @param {string} restaurantId - 餐廳 ID。
   * @param {object} ratings - 評分物件 (e.g., { taste: 4.5, environment: 4.0 })。
   * @param {string} reviewContent - 食評內容。
   * @param {string} draftId - 如果是從草稿提交，則提供草稿 ID。
   * @returns {Promise<void>}
   */
  const submitReview = useCallback(
    async (restaurantId, ratings, reviewContent, draftId = null) => {
      if (!db || !currentUser) {
        throw new Error("請先登入才能提交食評。");
      }

      // 1. 內容審核
      const moderationError = checkModeration(reviewContent);
      if (moderationError) {
        throw new Error(moderationError);
      }

      try {
        const reviewsCollectionRef = collection(
          db,
          `artifacts/${appId}/public/data/reviews`
        );

        const newReview = {
          restaurantId,
          userId: currentUser.uid,
          username: currentUser.username || currentUser.email.split("@")[0],
          ratings,
          reviewContent,
          createdAt: serverTimestamp(),
          status: "published",
        };

        const docRef = await addDoc(reviewsCollectionRef, newReview);
        const reviewId = docRef.id;

        // 2. 更新用戶的 publishedReviews 列表
        const userProfileDocRef = doc(
          db,
          `artifacts/${appId}/users/${currentUser.uid}/profile`,
          "main"
        );
        await updateDoc(userProfileDocRef, {
          publishedReviews: [...(currentUser.publishedReviews || []), reviewId],
        });
        setCurrentUser((prevUser) => ({
          ...prevUser,
          publishedReviews: [...(prevUser.publishedReviews || []), reviewId],
        }));

        // 3. 更新餐廳的評論計數 (reviewCount)
        const restaurantDocRef = doc(
          db,
          `artifacts/${appId}/public/data/restaurants`,
          restaurantId
        );
        await updateDoc(restaurantDocRef, {
          reviewCount: increment(1),
        });

        // 4. 如果是從草稿提交，刪除草稿
        if (draftId) {
          const draftDocRef = doc(
            db,
            `artifacts/${appId}/users/${currentUser.uid}/draft_reviews`,
            draftId
          );
          await deleteDoc(draftDocRef);
        }

        setModalMessage("食評已成功提交！感謝您的分享。");
      } catch (error) {
        console.error("useReviewManagement: 提交食評失敗:", error);
        throw error;
      }
    },
    [db, currentUser, appId, setCurrentUser, setModalMessage]
  );

  /**
   * 儲存食評草稿。
   * @param {object} draftData - 草稿內容 (包含 restaurantId, ratings, reviewContent 等)。
   * @param {string} existingDraftId - 如果是更新現有草稿，則提供草稿 ID。
   * @returns {Promise<string>} - 返回草稿的 ID。
   */
  const saveReviewDraft = useCallback(
    async (draftData, existingDraftId = null) => {
      if (!db || !currentUser) {
        throw new Error("請先登入才能儲存食評草稿。");
      }

      try {
        const draftsCollectionRef = collection(
          db,
          `artifacts/${appId}/users/${currentUser.uid}/draft_reviews`
        );

        const draftToSave = {
          ...draftData,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          expiresAt: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000
          ).toISOString(), // 3天後過期
        };

        let draftId;
        if (existingDraftId) {
          const draftDocRef = doc(
            db,
            `artifacts/${appId}/users/${currentUser.uid}/draft_reviews`,
            existingDraftId
          );
          await setDoc(draftDocRef, draftToSave, { merge: true });
          draftId = existingDraftId;
          setModalMessage("食評草稿已更新！");
        } else {
          const docRef = await addDoc(draftsCollectionRef, draftToSave);
          draftId = docRef.id;
          setModalMessage("食評草稿已儲存！");
        }
        return draftId;
      } catch (error) {
        console.error("useReviewManagement: 儲存食評草稿失敗:", error);
        throw error;
      }
    },
    [db, currentUser, appId, setModalMessage]
  );

  return { submitReview, saveReviewDraft, checkModeration };
};
