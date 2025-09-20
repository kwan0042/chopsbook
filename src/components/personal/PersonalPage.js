// src/components/PersonalPage.js
"use client";

import React, { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "@/lib/auth-context";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import UserProfileHeader from "@/components/personal/UserProfileHeader";
import PersonalPageNav from "@/components/personal/PersonalPageNav";
import ProfileContent from "@/components/personal/ProfileContent";
// import UserAwards from "@/components/personal/UserAwards";

const PersonalPage = ({ onBackToHome }) => {
  const {
    currentUser,
    loadingUser,
    setModalMessage,
    formatDateTime,
    db, // Make sure db is included
    appId, // Make sure appId is included
  } = useContext(AuthContext);
  const router = useRouter();

  const [selectedNav, setSelectedNav] = useState("reviews");
  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const [introText, setIntroText] = useState(currentUser?.intro || "");
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.photoURL || "");

  const [publishedReviews, setPublishedReviews] = useState([]);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);

  // Define draftReviews state here
  const [draftReviews, setDraftReviews] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  // Fetch draft reviews
  useEffect(() => {
    if (!db || !currentUser) {
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
  }, [db, currentUser, appId, setModalMessage]);

  // Mock function to fetch published reviews
  const fetchPublishedReviews = useCallback(() => {
    setLoadingContent(true);
    // Placeholder for fetching published reviews from Firestore
    const mockReviews = [
      {
        id: "1",
        restaurantName: "美味麵館",
        reviewContent: "麵條Q彈，湯頭濃郁，非常推薦！",
        createdAt: new Date(),
      },
      {
        id: "2",
        restaurantName: "星光咖啡廳",
        reviewContent: "氣氛好，適合閱讀。",
        createdAt: new Date(),
      },
    ];
    setPublishedReviews(mockReviews);
    setLoadingContent(false);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (selectedNav === "reviews") {
      fetchPublishedReviews();
    }
  }, [selectedNav, currentUser, fetchPublishedReviews]);

  const handleSaveIntro = useCallback(async () => {
    if (!currentUser) {
      setModalMessage("請先登入。");
      return;
    }
    setLoadingContent(true);
    try {
      // Logic to save introText to Firestore
      setModalMessage("個人介紹已更新。");
    } catch (error) {
      setModalMessage(`更新個人介紹失敗: ${error.message}`);
      console.error("更新失敗:", error);
    } finally {
      setIsEditingIntro(false);
      setLoadingContent(false);
    }
  }, [currentUser, introText, setModalMessage]);

  const handleUploadPhoto = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setLoadingContent(true);
      try {
        // Logic to upload photo to Firebase Storage
        const newPhotoUrl = "https://example.com/new-photo.jpg";
        setProfilePhoto(newPhotoUrl);
        setModalMessage("頭像已更新。");
      } catch (error) {
        setModalMessage(`頭像上傳失敗: ${error.message}`);
        console.error("上傳失敗:", error);
      } finally {
        setLoadingContent(false);
      }
    },
    [setModalMessage]
  );

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
        <p className="ml-4 text-gray-700">載入用戶資訊...</p>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center font-inter">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-6xl relative">
        <button
          onClick={onBackToHome}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
          aria-label="返回首頁"
        >
          &times;
        </button>

        <UserProfileHeader
          currentUser={currentUser}
          profilePhoto={profilePhoto}
          introText={introText}
          isEditingIntro={isEditingIntro}
          setIsEditingIntro={setIsEditingIntro}
          setIntroText={setIntroText}
          handleSaveIntro={handleSaveIntro}
          handleUploadPhoto={handleUploadPhoto}
          stats={{
            publishedReviews: 12,
            photos: 25,
            likesReceived: 345,
            likesGiven: 210,
          }}
        />

        {/* <UserAwards currentUser={currentUser} /> */}

        <PersonalPageNav
          selectedNav={selectedNav}
          setSelectedNav={setSelectedNav}
        />

        <div className="mt-8 border-t border-gray-200 pt-8">
          <ProfileContent
            selectedNav={selectedNav}
            currentUser={currentUser}
            loadingContent={loadingContent || loadingDrafts} // Add loadingDrafts here
            publishedReviews={publishedReviews}
            draftReviews={draftReviews}
            setModalMessage={setModalMessage}
            db={db}
            appId={appId}
            formatDateTime={formatDateTime}
          />
        </div>

        <div className="text-center mt-8">
          <button
            onClick={onBackToHome}
            className="mt-6 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
          >
            返回主頁
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalPage;
