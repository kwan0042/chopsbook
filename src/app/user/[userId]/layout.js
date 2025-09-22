"use client";

import React, { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "@/lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import UserProfileHeader from "@/components/personal/UserProfileHeader";
import PersonalPageNav from "@/components/personal/PersonalPageNav";
import UserStatsCard from "@/components/personal/UserStatsCard";
import Modal from "@/components/Modal";
import PersonalControls from "@/components/personal/PersonalControls";

/**
 * User Profile Layout: 用於包裝所有用戶個人主頁的子路由。
 * 統一管理用戶資料獲取、頁首、導航欄和側邊欄。
 */
export default function UserProfileLayout({ children, params }) {
  // 修正：使用 React.use() 來解構 Promise
  const { userId } = React.use(params);

  const {
    currentUser,
    loadingUser,
    setModalMessage,
    db,
    appId,
    updateUserProfile,
  } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  const isMyProfile = currentUser?.uid === userId;

  const [profileUser, setProfileUser] = useState(null);
  const [loadingProfileUser, setLoadingProfileUser] = useState(true);

  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const [introText, setIntroText] = useState(currentUser?.intro || "");
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.photoURL || "");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!db || !userId) {
        setLoadingProfileUser(false);
        return;
      }
      setLoadingProfileUser(true);
      try {
        const userDocRef = doc(db, `artifacts/${appId}/users/${userId}`);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() };
          setProfileUser(userData);
          setIntroText(userData.intro || "");
          setProfilePhoto(userData.photoURL || "");
        } else {
          setModalMessage("找不到此用戶的個人主頁。");
          setProfileUser(null);
        }
      } catch (error) {
        setModalMessage(`獲取用戶資料失敗: ${error.message}`);
        setProfileUser(null);
        console.error("獲取用戶資料失敗:", error);
      } finally {
        setLoadingProfileUser(false);
      }
    };
    fetchUserProfile();
  }, [db, userId, appId, setModalMessage]);

  const handleSaveIntro = useCallback(async () => {
    if (!isMyProfile) return;
    try {
      await updateUserProfile({ intro: introText });
      setModalMessage("個人介紹已更新。");
      setIsEditingIntro(false);
    } catch (error) {
      setModalMessage(`更新個人介紹失敗: ${error.message}`);
      console.error("更新失敗:", error);
    }
  }, [isMyProfile, introText, setModalMessage, updateUserProfile]);

  const handleUploadPhoto = useCallback(
    async (e) => {
      if (!isMyProfile) return;
      const file = e.target.files[0];
      if (!file) return;
      setModalMessage("頭像上傳中，請稍候...");
      try {
        const newPhotoUrl = "https://example.com/new-photo.jpg";
        await updateUserProfile({ photoURL: newPhotoUrl });
        setProfilePhoto(newPhotoUrl);
        setModalMessage("頭像已更新。");
      } catch (error) {
        setModalMessage(`頭像上傳失敗: ${error.message}`);
        console.error("上傳失敗:", error);
      }
    },
    [isMyProfile, setModalMessage, updateUserProfile]
  );

  if (loadingUser || loadingProfileUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <LoadingSpinner />
        <p className="mt-4 text-gray-700">載入用戶資訊...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 text-red-600">
        用戶不存在或無法載入。
      </div>
    );
  }

  const userStats = {
    reviewsCount: profileUser.reviewsCount || 0,
    photosCount: profileUser.photosCount || 0,
    likesReceived: profileUser.likesReceived || 0,
    favoriteRestaurants: profileUser.favoriteRestaurants?.length || 0,
  };

  const currentNav = pathname.split("/").pop();

  return (
    <div className=" bg-cbbg p-4 sm:p-6 lg:p-8 flex flex-col items-center font-inter ">
      <div className="w-full px-20 relative ">
        <UserProfileHeader
          currentUser={profileUser}
          profilePhoto={profilePhoto}
          introText={introText}
          isEditingIntro={isEditingIntro}
          setIsEditingIntro={setIsEditingIntro}
          setIntroText={setIntroText}
          handleSaveIntro={handleSaveIntro}
          handleUploadPhoto={handleUploadPhoto}
          isMyProfile={isMyProfile}
          stats={userStats}
        />

        <div className="mt-2 ">
          <div className="flex flex-col md:flex-row gap-8">
            {/* 左側控制區塊，僅在自己的主頁時顯示 */}

            <div className="md:w-1/4 flex-shrink-0 mt-5">
              {isMyProfile && <PersonalControls userId={userId} />}
              <div className="mb-4">
                <div className="bg-white rounded-xl shadow-xl sticky top-8 p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    用戶數據
                  </h2>
                  <UserStatsCard stats={userStats} />
                </div>
              </div>
            </div>

            {/* 主內容區 */}
            <div className="flex-1">
              <PersonalPageNav
                selectedNav={currentNav}
                setSelectedNav={(nav) => router.push(`/user/${userId}/${nav}`)}
                isMyProfile={isMyProfile}
                userId={userId}
              />

              <div className="mt-8">{children}</div>
            </div>

            {/* 右側欄位 */}
          </div>
        </div>
      </div>
      <Modal />
    </div>
  );
}
