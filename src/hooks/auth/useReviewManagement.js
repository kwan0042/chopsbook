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
  setDoc, // 已新增 setDoc
} from "firebase/firestore";
import { forbiddenWords } from "../../lib/config/moderationConfig.js"; // Import forbidden words list

/**
 * checkModeration: Simple moderation check for forbidden words.
 * @param {string} text - The text content to check.
 * @returns {string | null} - Returns a warning message if forbidden words are found, otherwise returns null.
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
 * Provides functions for submitting reviews, saving drafts, and content moderation.
 * @param {object} db - Firebase Firestore instance.
 * @param {object} currentUser - The current logged-in user object.
 * @param {string} appId - The application ID.
 * @param {function} setCurrentUser - Callback to update the currentUser state.
 * @param {function} setModalMessage - Callback to display modal messages.
 * @returns {object} An object containing submitReview, saveReviewDraft, and checkModeration.
 */
export const useReviewManagement = (
  db,
  currentUser,
  appId,
  setCurrentUser,
  setModalMessage
) => {
  /**
   * Submits a restaurant review.
   * @param {string} restaurantId - The restaurant ID.
   * @param {string} reviewTitle - The title of the review.
   * @param {number} overallRating - The overall rating (0-5).
   * @param {string} reviewContent - The detailed review content.
   * @param {object} detailedRatings - Detailed ratings object (e.g., { taste: 4.5, drinks: 4.0 }).
   * @param {number} costPerPerson - The average cost per person.
   * @param {string} timeOfDay - The time of day (e.g., 'day', 'night').
   * @param {string} serviceType - The service type (e.g., 'dine-in', 'pickup').
   * @param {Array<object>} uploadedImages - An array of objects with image URLs and descriptions.
   * @param {string} draftId - Optional draft ID if submitting from a draft.
   * @returns {Promise<void>}
   */
  const submitReview = useCallback(
    async (
      restaurantId,
      reviewTitle,
      overallRating,
      reviewContent,
      detailedRatings,
      costPerPerson,
      timeOfDay,
      serviceType,
      uploadedImages,
      draftId = null
    ) => {
      if (!db || !currentUser) {
        throw new Error("請先登入才能提交食評。");
      }

      // 1. Content moderation check on title and content
      const moderationErrorTitle = checkModeration(reviewTitle);
      const moderationErrorContent = checkModeration(reviewContent);
      if (moderationErrorTitle) {
        throw new Error(moderationErrorTitle);
      }
      if (moderationErrorContent) {
        throw new Error(moderationErrorContent);
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
          reviewTitle,
          overallRating,
          reviewContent,
          detailedRatings,
          costPerPerson,
          timeOfDay,
          serviceType,
          uploadedImages,
          createdAt: serverTimestamp(),
          status: "published",
        };

        const docRef = await addDoc(reviewsCollectionRef, newReview);
        const reviewId = docRef.id;

        // 2. Update user's publishedReviews list
        const userDocRef = doc(
          db,
          `artifacts/${appId}/users/${currentUser.uid}`
        );
        await updateDoc(userDocRef, {
          publishedReviews: [...(currentUser.publishedReviews || []), reviewId],
        });
        setCurrentUser((prevUser) => ({
          ...prevUser,
          publishedReviews: [...(prevUser.publishedReviews || []), reviewId],
        }));

        // 3. Update restaurant's review count
        const restaurantDocRef = doc(
          db,
          `artifacts/${appId}/public/data/restaurants`,
          restaurantId
        );
        await updateDoc(restaurantDocRef, {
          reviewCount: increment(1),
        });

        // 4. If submitted from a draft, delete the draft
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
          ).toISOString(), // Expires in 3 days
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
        } else {
          const docRef = await addDoc(draftsCollectionRef, draftToSave);
          draftId = docRef.id;
        }
        return draftId;
      } catch (error) {
        console.error("useReviewManagement: 儲存食評草稿失敗:", error);
        throw error;
      }
    },
    [db, currentUser, appId]
  );

  /**
   * 設定在用戶離開頁面時自動儲存草稿。
   * @param {object} draftData - 完整的草稿資料。
   * @param {string} [draftId] - 現有草稿的 ID。
   */
  const setupDraftAutoSave = useCallback(
    (draftData, draftId) => {
      if (!currentUser || !draftData?.restaurantId) return;

      const handleBeforeUnload = (e) => {
        // 確保非同步操作能在事件結束前完成
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome

        // 使用 navigator.sendBeacon 或 fetch keep-alive
        // 這裡我們直接呼叫 saveReviewDraft，因為它會被包裝在 useEffect 中
        // 並且在組件卸載時觸發
        saveReviewDraft(draftData, draftId).catch(console.error);
      };

      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    },
    [currentUser, saveReviewDraft]
  );

  return { submitReview, saveReviewDraft, checkModeration, setupDraftAutoSave };
};
