// src/app/user/[userId]/page.js
"use client";

import React, { useContext, useEffect, useState,use } from "react";
import { AuthContext } from "@/lib/auth-context";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProfileContent from "@/components/personal/ProfileContent";

/**
 * User Profile Page: 顯示用戶的個人主頁內容。
 * 這是 /user/[userId] 路徑下的預設頁面，專門用於顯示已發布的評論。
 * 所有公共 UI (Header, Nav, Sidebar) 都由 layout.js 管理。
 */
export default function UserReviewsPage({ params }) {
  const { userId } = use(params);

  // 使用者認證相關資訊
  const {
    currentUser,
    loadingUser,
    setModalMessage,
    formatDateTime,
    db,
    appId,
  } = useContext(AuthContext);

  // 判斷是否為自己的主頁
  const isMyProfile = currentUser?.uid === userId;

  // 評論相關狀態
  const [publishedReviews, setPublishedReviews] = useState([]);
  const [draftReviews, setDraftReviews] = useState([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  // 1. 獲取當前頁面顯示的用戶的已發布食評
  useEffect(() => {
    if (!db || !userId) {
      setLoadingContent(false);
      return;
    }
    const reviewsCollectionRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/published_reviews`
    );
    const q = query(reviewsCollectionRef);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedReviews = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPublishedReviews(fetchedReviews);
        setLoadingContent(false);
      },
      (error) => {
        console.error("獲取已發布評論失敗:", error);
        setModalMessage(`獲取評論失敗: ${error.message}`);
        setLoadingContent(false);
      }
    );
    return () => unsubscribe();
  }, [db, userId, appId, setModalMessage]);

  // 2. 獲取當前頁面顯示的用戶的草稿食評 (只在是自己的主頁時獲取)
  useEffect(() => {
    if (!isMyProfile || !db || !currentUser) {
      setLoadingDrafts(false);
      return;
    }

    const draftsCollectionRef = collection(
      db,
      `artifacts/${appId}/users/${currentUser.uid}/draft_reviews`
    );
    const q = query(draftsCollectionRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedDrafts = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((draft) => {
            const expiresAt = draft.expiresAt
              ? new Date(draft.expiresAt)
              : new Date(0);
            return new Date() < expiresAt;
          });
        setDraftReviews(fetchedDrafts);
        setLoadingDrafts(false);
      },
      (error) => {
        console.error("獲取草稿食評失敗:", error);
        setModalMessage(`獲取草稿食評失敗: ${error.message}`);
        setLoadingDrafts(false);
      }
    );

    return () => unsubscribe();
  }, [isMyProfile, db, currentUser, appId, setModalMessage]);

  if (loadingContent || loadingDrafts) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ProfileContent
      selectedNav="reviews"
      currentUser={{ id: userId }} // 只傳遞必要的 id
      loadingContent={loadingContent || loadingDrafts}
      publishedReviews={publishedReviews}
      draftReviews={draftReviews}
      setModalMessage={setModalMessage}
      db={db}
      appId={appId}
      formatDateTime={formatDateTime}
      isMyProfile={isMyProfile}
    />
  );
}
