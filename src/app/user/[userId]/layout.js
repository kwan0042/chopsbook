// src/app/user/[userId]/layout.js
"use client";

import React, { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "@/lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import UserProfileHeader from "@/components/user/UserProfileHeader";
import PersonalPageNav from "@/components/user/PersonalPageNav";
import UserStatsCard from "@/components/user/UserStatsCard";
import Modal from "@/components/Modal";
import PersonalControls from "@/components/user/PersonalControls";
import ImageCropModal from "@/components/user/ImageCropModal";

/**
 * User Profile Layout: 用於包裝所有用戶個人主頁的子路由。
 * 統一管理用戶資料獲取、頁首、導航欄和側邊欄。
 */
export default function UserProfileLayout({ children, params }) {
  // Corrected line: Use React.use() to unwrap the params object
  const { userId } = React.use(params);

  const {
    currentUser,
    loadingUser,
    setModalMessage,
    db,
    appId,
    storage,
    updateUserProfile,
  } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  const isMyProfile = currentUser?.uid === userId;

  const [profileUser, setProfileUser] = useState(null);
  const [loadingProfileUser, setLoadingProfileUser] = useState(true);

  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const [introText, setIntroText] = useState(currentUser?.intro || "");
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.pIconUrl || "");

  const [photoFileToCrop, setPhotoFileToCrop] = useState(null);

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
          setProfilePhoto(userData.pIconUrl || "");
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
      await updateUserProfile(userId, { intro: introText });
      setModalMessage("個人介紹已更新。");
      setIsEditingIntro(false);
    } catch (error) {
      setModalMessage(`更新個人介紹失敗: ${error.message}`);
      console.error("更新失敗:", error);
    }
  }, [isMyProfile, introText, setModalMessage, updateUserProfile, userId]);

  const handleUploadPhoto = useCallback(
    (file) => {
      if (!isMyProfile || !file) return;
      setPhotoFileToCrop(file);
    },
    [isMyProfile]
  );

  const handleImageCropped = useCallback(
    async (croppedBlob) => {
      if (!isMyProfile || !croppedBlob) return;
      setModalMessage("頭像上傳中，請稍候...");
      try {
        const storageRef = ref(
          storage,
          `public/users/${currentUser.uid}/icon/pIcon.webp`
        );
        const snapshot = await uploadBytes(storageRef, croppedBlob);
        const newPIconUrl = await getDownloadURL(snapshot.ref);

        await updateUserProfile(userId, { pIconUrl: newPIconUrl });
        setProfilePhoto(newPIconUrl);
        setModalMessage("頭像已更新。");
      } catch (error) {
        setModalMessage(`頭像上傳失敗: ${error.message}`);
        console.error("上傳失敗:", error);
      } finally {
        setPhotoFileToCrop(null);
      }
    },
    [
      isMyProfile,
      setModalMessage,
      updateUserProfile,
      currentUser,
      storage,
      userId,
    ]
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

  const pathSegments = pathname.split("/");
  const lastSegment = pathSegments[pathSegments.length - 1];
  const selectedNav = lastSegment === userId ? "overview" : lastSegment;

  return (
    <div className=" h-fit bg-cbbg p-4 sm:p-6 lg:p-8 flex flex-col items-center font-inter ">
      <div className="w-full md:px-20 relative ">
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
            <div className="md:w-1/4 flex-shrink-0 md:mt-5">
              <div className="md:h-19 pt-4">{/* Expbar */}</div>
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

            <div className="flex-1">
              <PersonalPageNav
                selectedNav={selectedNav}
                setSelectedNav={(nav) => router.push(`/user/${userId}/${nav}`)}
                isMyProfile={isMyProfile}
                userId={userId}
              />

              <div className="mt-8">{children}</div>
            </div>
          </div>
        </div>
      </div>
      <Modal />
      {photoFileToCrop && (
        <ImageCropModal
          photoFile={photoFileToCrop}
          onClose={() => setPhotoFileToCrop(null)}
          onImageCropped={handleImageCropped}
        />
      )}
    </div>
  );
}
