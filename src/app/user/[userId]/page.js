"use client";

import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/lib/auth-context";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProfileContent from "@/components/personal/ProfileContent";
import Link from "next/link";

/**
 * User Profile Page: 顯示用戶的個人主頁內容。
 * 這是 /user/[userId] 路徑下的預設頁面，專門用於顯示已發布的評論。
 * 所有公共 UI (Header, Nav, Sidebar) 都由 layout.js 管理。
 */
export default function UserReviewsPage({ params }) {
  // 修正：使用 React.use() 來解構 Promise
  const { userId } = React.use(params);

  const {
    currentUser,
    loadingUser,
    setModalMessage,
    formatDateTime,
    db,
    appId,
  } = useContext(AuthContext);

  const isMyProfile = currentUser?.uid === userId;

  const [publishedReviews, setPublishedReviews] = useState([]);
  const [draftReviews, setDraftReviews] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

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

  // 3. 獲取最近動態 (假設有一個 activities 集合)
  useEffect(() => {
    if (!db || !userId) {
      setLoadingActivities(false);
      return;
    }
    // 假設有一個名為 'activities' 的集合，記錄所有動態
    const activitiesCollectionRef = collection(db, "activities");
    const q = query(
      activitiesCollectionRef,
      orderBy("timestamp", "desc"),
      limit(5) // 只獲取最近 5 則
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedActivities = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentActivities(fetchedActivities);
        setLoadingActivities(false);
      },
      (error) => {
        console.error("獲取最近動態失敗:", error);
        setLoadingActivities(false);
      }
    );
    return () => unsubscribe();
  }, [db, userId]);

  if (loadingContent || loadingDrafts || loadingActivities) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  // 渲染動態的輔助函數
  const renderActivity = (activity) => {
    switch (activity.type) {
      case "like":
        return (
          <>
            讚賞了
            <Link
              href={`/review/${activity.reviewId}`}
              className="text-blue-600 hover:underline ml-1"
            >
              {activity.reviewTitle || "某則食評"}
            </Link>
          </>
        );
      case "follow":
        return (
          <>
            追蹤了
            <Link
              href={`/user/${activity.targetUserId}`}
              className="text-blue-600 hover:underline ml-1"
            >
              {activity.targetUsername || "某位用戶"}
            </Link>
          </>
        );
      case "favorite":
        return (
          <>
            收藏了
            <Link
              href={`/restaurant/${activity.restaurantId}`}
              className="text-blue-600 hover:underline ml-1"
            >
              {activity.restaurantName || "某間餐廳"}
            </Link>
          </>
        );
      case "review":
        return (
          <>
            發佈了
            <Link
              href={`/review/${activity.reviewId}`}
              className="text-blue-600 hover:underline ml-1"
            >
              {activity.reviewTitle || "新食評"}
            </Link>
          </>
        );
      default:
        return "進行了一項新動態";
    }
  };

  return (
    <ProfileContent
      selectedNav="reviews"
      currentUser={{ id: userId }}
      loadingContent={loadingContent || loadingDrafts || loadingActivities}
      publishedReviews={publishedReviews}
      draftReviews={draftReviews}
      setModalMessage={setModalMessage}
      db={db}
      appId={appId}
      formatDateTime={formatDateTime}
      isMyProfile={isMyProfile}
      recentActivities={recentActivities}
      renderActivity={renderActivity}
    />
  );
}
