"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../lib/auth-context";
import { collection, query, getDocs, doc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import LoadingSpinner from "../LoadingSpinner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReviewModerationCheck from "./ReviewModerationCheck";
import StarRating from "./StarRating";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark, faSun } from "@fortawesome/free-solid-svg-icons";
import {
  IconCoffee,
  IconSunset2,
  IconMoon,
  IconBuildingStore,
  IconMoped,
  IconPaperBag,
} from "@tabler/icons-react";

// Back button icon
const ArrowLeftIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-5 w-5 ${className}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const ratingCategories = [
  { key: "taste", label: "味道" },
  { key: "environment", label: "環境" },
  { key: "service", label: "服務" },
  { key: "hygiene", label: "衛生" },
  { key: "cp", label: "抵食" },
  { key: "drinks", label: "酒/飲料" },
];

const ReviewForm = ({ onBack, draftId }) => {
  const {
    db,
    currentUser,
    appId,
    submitReview,
    saveReviewDraft,
    setModalMessage,
  } = useContext(AuthContext);
  const router = useRouter();

  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const [reviewTitle, setReviewTitle] = useState("");
  const [overallRating, setOverallRating] = useState(0);
  const [showDetailedRatings, setShowDetailedRatings] = useState(false);
  const [reviewContent, setReviewContent] = useState("");
  const [costPerPerson, setCostPerPerson] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [ratings, setRatings] = useState(() => {
    const initialRatings = {};
    ratingCategories.forEach((cat) => {
      initialRatings[cat.key] = 0;
    });
    return initialRatings;
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [moderationWarning, setModerationWarning] = useState(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [lastSubmittedRestaurantId, setLastSubmittedRestaurantId] =
    useState(null);

  // 修正點：新增狀態來儲存從 Firestore 讀取的用戶名
  const [username, setUsername] = useState(null);

  // Helper function to check for unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return (
      reviewTitle ||
      reviewContent ||
      selectedRestaurant ||
      overallRating > 0 ||
      costPerPerson ||
      timeOfDay ||
      serviceType ||
      uploadedImages.length > 0 ||
      Object.values(ratings).some((rating) => rating > 0)
    );
  }, [
    reviewTitle,
    reviewContent,
    selectedRestaurant,
    overallRating,
    costPerPerson,
    timeOfDay,
    serviceType,
    uploadedImages,
    ratings,
  ]);

  // 處理瀏覽器關閉或刷新頁面
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges()) {
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // 計算並更新總體評級
  useEffect(() => {
    let sumOfRatings = 0;
    let count = 0;
    const coreRatings = ["taste", "environment", "service", "hygiene", "cp"];

    coreRatings.forEach((key) => {
      if (ratings[key] > 0) {
        sumOfRatings += ratings[key];
        count++;
      }
    });

    if (ratings.drinks > 0) {
      sumOfRatings += ratings.drinks;
      count++;
    }

    if (count > 0) {
      setOverallRating(sumOfRatings / count);
    } else {
      setOverallRating(0);
    }
  }, [ratings]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!db || !appId) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, `artifacts/${appId}/public/data/restaurants`)
        );
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRestaurants(fetched);
        setLoading(false);
      } catch (error) {
        console.error("獲取餐廳列表失敗:", error);
        setModalMessage(`獲取餐廳列表失敗: ${error.message}`);
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [db, appId, setModalMessage]);

  useEffect(() => {
    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase();
      setFilteredRestaurants(
        restaurants.filter(
          (r) =>
            r.restaurantNameZh?.toLowerCase().includes(normalizedQuery) ||
            r.restaurantNameEn?.toLowerCase().includes(normalizedQuery)
        )
      );
    } else {
      setFilteredRestaurants([]);
    }
  }, [searchQuery, restaurants]);

  // 修正點：新增 useEffect 以從 Firestore 讀取用戶名
  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser && db && appId) {
        try {
          const userDocRef = doc(
            db,
            `artifacts/${appId}/users`,
            currentUser.uid
          );
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUsername(userData.username); // 從 Firestore 中讀取 username
          } else {
            // 如果用戶文件不存在，可以設定一個預設值
            setUsername("匿名用戶");
          }
        } catch (error) {
          console.error("讀取用戶名失敗:", error);
          setUsername("匿名用戶"); // 讀取失敗也設定預設值
        }
      }
    };
    fetchUsername();
  }, [currentUser, db, appId]);

  useEffect(() => {
    const loadDraft = async () => {
      if (draftId && db && currentUser && !loading && !isDraftLoaded) {
        try {
          setSubmitting(true);
          const draftDocRef = doc(
            db,
            `artifacts/${appId}/users/${currentUser.uid}/draft_reviews`,
            draftId
          );
          const docSnap = await getDoc(draftDocRef);
          if (docSnap.exists()) {
            const draft = docSnap.data();
            setSelectedRestaurant(
              restaurants.find((r) => r.id === draft.restaurantId)
            );
            setReviewTitle(draft.reviewTitle || "");
            setOverallRating(draft.overallRating || 0);
            setReviewContent(draft.reviewContent || "");

            // 合併草稿與預設評分，確保所有細項都存在
            const mergedRatings = ratingCategories.reduce((acc, cat) => {
              acc[cat.key] = draft.ratings?.[cat.key] || 0;
              return acc;
            }, {});
            setRatings(mergedRatings);

            setCostPerPerson(draft.costPerPerson || "");
            setTimeOfDay(draft.timeOfDay || "");
            setServiceType(draft.serviceType || "");
            if (draft.ratings && Object.keys(draft.ratings).length > 0)
              setShowDetailedRatings(true);
            setIsDraftLoaded(true);
          } else {
            setModalMessage("找不到該草稿。");
            router.replace("/personal/reviews");
          }
        } catch (error) {
          console.error("載入草稿失敗:", error);
          setModalMessage(`載入草稿失敗: ${error.message}`);
        } finally {
          setSubmitting(false);
        }
      }
    };
    if (
      !loading &&
      restaurants.length > 0 &&
      currentUser &&
      draftId &&
      !isDraftLoaded
    )
      loadDraft();
  }, [
    draftId,
    db,
    currentUser,
    loading,
    restaurants,
    appId,
    setModalMessage,
    router,
    isDraftLoaded,
  ]);

  const handleRatingChange = useCallback((categoryKey, value) => {
    setRatings((prev) => ({ ...prev, [categoryKey]: parseFloat(value) }));
  }, []);
  const handleOverallRatingChange = useCallback((value) => {
    setOverallRating(parseFloat(value));
    setShowDetailedRatings(false);
  }, []);
  const handleSelectRestaurant = useCallback((restaurant) => {
    setSelectedRestaurant(restaurant);
    setSearchQuery("");
    setFilteredRestaurants([]);
  }, []);
  const handleRemoveSelectedRestaurant = useCallback(() => {
    setSelectedRestaurant(null);
  }, []);
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files
      .filter((file) => file.type === "image/jpeg")
      .slice(0, 5 - uploadedImages.length);
    if (newImages.length + uploadedImages.length > 5)
      setModalMessage("最多只能上傳 5 張圖片。");
    const newImagePreviews = newImages.map((file) => ({
      file,
      description: "",
      url: URL.createObjectURL(file),
      id: Date.now() + Math.random(),
    }));
    setUploadedImages((prev) => [...prev, ...newImagePreviews]);
  };
  const handleImageDescriptionChange = (id, description) => {
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, description } : img))
    );
  };
  const handleRemoveImage = (id) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };
  const handleSaveDraft = async () => {
    if (!currentUser) {
      setModalMessage("請先登入才能儲存草稿。");
      return;
    }
    if (!selectedRestaurant) {
      setModalMessage("請選擇要評價的餐廳。");
      return;
    }
    setSubmitting(true);
    try {
      const draftData = {
        restaurantId: selectedRestaurant.id,
        restaurantName:
          selectedRestaurant.restaurantNameZh ||
          selectedRestaurant.restaurantNameEn,
        reviewTitle,
        reviewContent,
        overallRating,
        costPerPerson,
        timeOfDay,
        serviceType,
        ratings,
      };
      const newDraftId = await saveReviewDraft(draftData, draftId);
      if (!draftId) router.replace(`/personal/reviews?draftId=${newDraftId}`);
    } catch (error) {
      setModalMessage(`儲存草稿失敗: ${error.message}`);
      console.error("儲存草稿失敗:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setModalMessage("請先登入才能提交食評。");
      return;
    }
    if (!selectedRestaurant) {
      setModalMessage("請選擇要評價的餐廳。");
      return;
    }
    if (!reviewTitle.trim() || !reviewContent.trim()) {
      setModalMessage("評論標題和內容都不能為空。");
      return;
    }
    if (overallRating === 0) {
      setModalMessage("請給出一個總體評級。");
      return;
    }
    if (!timeOfDay) {
      setModalMessage("請選擇用餐時間。");
      return;
    }
    if (!serviceType) {
      setModalMessage("請選擇服務類型。");
      return;
    }
    if (moderationWarning) {
      setModalMessage("請修改食評內容以符合社群規範後再提交。");
      return;
    }

    setSubmitting(true);
    try {
      // 1. 上傳圖片到 Firebase Storage
      const storage = getStorage();
      const uploadedImageUrls = await Promise.all(
        uploadedImages.map(async (image) => {
          const storageRef = ref(
            storage,
            `public/users/${currentUser.uid}/reviews/${selectedRestaurant.id}/${image.file.name}`
          );
          const snapshot = await uploadBytes(storageRef, image.file);
          const url = await getDownloadURL(snapshot.ref);
          return { url, description: image.description };
        })
      );

      const submittedRestaurantId = selectedRestaurant.id;

      // 2. 向新的 API Route 發送請求
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId: submittedRestaurantId,
          reviewTitle,
          overallRating,
          reviewContent,
          ratings,
          costPerPerson,
          timeOfDay,
          serviceType,
          uploadedImageUrls,
          userId: currentUser.uid,
          // 修正點：使用從 Firestore 讀取的 username 狀態
          username: username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit review.");
      }

      // 3. 請求成功後的處理
      setSelectedRestaurant(null);
      setReviewTitle("");
      setOverallRating(0);
      setShowDetailedRatings(false);
      setReviewContent("");
      setRatings(() => {
        const initialRatings = {};
        ratingCategories.forEach((cat) => {
          initialRatings[cat.key] = 0;
        });
        return initialRatings;
      });
      setCostPerPerson("");
      setTimeOfDay("");
      setServiceType("");
      setUploadedImages([]);
      setModerationWarning(null);
      setLastSubmittedRestaurantId(submittedRestaurantId);
      if (draftId) router.replace("/personal/reviews");
      setShowUpdatePrompt(true);
    } catch (error) {
      setModalMessage(`提交食評失敗: ${error.message}`);
      console.error("提交食評失敗:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModerationResult = useCallback((warning) => {
    setModerationWarning(warning);
  }, []);

  const handleBackButtonClick = () => {
    if (hasUnsavedChanges()) {
      setShowConfirmModal(true);
    } else {
      onBack();
    }
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    await handleSaveDraft();
    onBack();
  };

  const handleCancelSave = () => {
    setShowConfirmModal(false);
    onBack();
  };

  if (!currentUser) return null;
  if (loading || (draftId && submitting && !isDraftLoaded)) {
    return (
      <div className="flex items-center justify-center min-h-[500px] bg-gray-50 rounded-xl shadow-md p-8 w-full max-w-4xl">
        <LoadingSpinner />
        <p className="ml-4 text-gray-700">載入中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl relative">
      <button
        onClick={handleBackButtonClick}
        className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors flex items-center"
        aria-label="返回"
      >
        <ArrowLeftIcon className="mr-2" />
        返回
      </button>

      {/* 離開確認彈窗 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full text-center">
            <p className="text-lg font-semibold mb-4 text-gray-800">
              你有未儲存的草稿，是否要儲存？
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleCancelSave}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                否
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                是
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">
        撰寫食評
      </h2>
      {showUpdatePrompt ? (
        <div className="text-center p-8">
          <h3 className="text-xl font-bold text-green-600 mb-4">
            感謝您的貢獻！
          </h3>
          <p className="text-gray-700 mb-4">您的食評已成功提交。</p>
          <p className="text-gray-700 mb-6">
            餐廳的資料是否有需要更新的地方？點擊下方連結，立即協助我們更新餐廳資訊！
          </p>
          <Link
            href={`/merchant/update?restaurantId=${lastSubmittedRestaurantId}`}
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-bold rounded-md shadow-md hover:bg-indigo-700 transition duration-300"
          >
            去更新餐廳資訊
          </Link>
          <button
            onClick={onBack}
            className="block w-full mt-4 text-gray-500 hover:text-gray-700"
          >
            返回個人頁面
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitReview} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4  ">
            <div className="col-span-2">
              <label className="block text-gray-700 text-base font-bold mb-2">
                選擇餐廳 <span className="text-red-500">*</span>
              </label>
              {selectedRestaurant ? (
                <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-indigo-50 text-indigo-800 h-10">
                  <span className="font-semibold text-base">
                    {selectedRestaurant.restaurantNameZh ||
                      selectedRestaurant.restaurantNameEn}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveSelectedRestaurant}
                    className="text-indigo-600 hover:text-indigo-800 focus:outline-none"
                  >
                    移除
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="搜尋餐廳名稱 (中文或英文)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                  />
                  {searchQuery && filteredRestaurants.length > 0 && (
                    <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredRestaurants.map((r) => (
                        <li
                          key={r.id}
                          onClick={() => handleSelectRestaurant(r)}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        >
                          {r.restaurantNameZh} ({r.restaurantNameEn})
                        </li>
                      ))}
                    </ul>
                  )}
                  {searchQuery && filteredRestaurants.length === 0 && (
                    <p className="mt-2 text-base text-red-500">
                      沒有找到匹配的餐廳。
                      <a href="/merchant/add" className="text-blue-500">
                        新增餐廳？
                      </a>
                    </p>
                  )}
                </>
              )}
            </div>
            <div>
              <label
                htmlFor="costPerPerson"
                className="block text-gray-700 text-base font-bold mb-2"
              >
                每人消費金額
              </label>
              <input
                id="costPerPerson"
                type="number"
                min="0"
                value={costPerPerson}
                onChange={(e) => setCostPerPerson(e.target.value)}
                className="text-sm w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                placeholder="例如: 150"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 text-base font-bold mb-2">
              用餐時間 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  value: "morning",
                  label: "早上",
                  icon: <IconCoffee stroke={2} className="text-2xl" />,
                },
                {
                  value: "noon",
                  label: "中午",
                  icon: <FontAwesomeIcon icon={faSun} className="text-2xl" />,
                },
                {
                  value: "afternoon",
                  label: "下午",
                  icon: <IconSunset2 stroke={2} className="text-2xl" />,
                },
                {
                  value: "night",
                  label: "晚上",
                  icon: <IconMoon stroke={2} className="text-2xl" />,
                },
              ].map((item) => (
                <label
                  key={item.value}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    timeOfDay === item.value
                      ? "bg-blue-100 border-2 border-blue-500 shadow-md"
                      : "bg-gray-50 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="radio"
                    name="timeOfDay"
                    value={item.value}
                    checked={timeOfDay === item.value}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className="hidden"
                  />
                  {item.icon}
                  <span className="mt-2 text-sm font-medium text-gray-800">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-base font-bold mb-2">
              服務類型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  value: "dineIn",
                  label: "堂食",
                  icon: <IconBuildingStore stroke={2} className="text-xl" />,
                },
                {
                  value: "delivery",
                  label: "外賣",
                  icon: <IconMoped stroke={2} className="text-xl" />,
                },
                {
                  value: "pickUp",
                  label: "自取",
                  icon: <IconPaperBag stroke={2} className="text-xl" />,
                },
              ].map((item) => (
                <label
                  key={item.value}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    serviceType === item.value
                      ? "bg-blue-100 border-2 border-blue-500 shadow-md"
                      : "bg-gray-50 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="radio"
                    name="serviceType"
                    value={item.value}
                    checked={serviceType === item.value}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="hidden"
                  />
                  {item.icon}
                  <span className="mt-2 text-sm font-medium text-gray-800">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-base font-bold mb-2">
              總體評級 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-3">
              <StarRating
                value={overallRating}
                onValueChange={handleOverallRatingChange}
              />

              <button
                type="button"
                onClick={() => setShowDetailedRatings(!showDetailedRatings)}
                className="text-sm ml-auto px-4 py-2 text-blue-600 font-semibold rounded-md border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                {showDetailedRatings ? "隱藏細項" : "詳細評分"}
              </button>
            </div>
          </div>

          {showDetailedRatings && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h4 className="text-base font-bold text-gray-800">細項評分</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ratingCategories.map((category) => (
                  <div key={category.key} className="flex items-center ">
                    <span className="text-sm w-fit text-gray-800 ">
                      {category.label}：
                    </span>
                    <div className=" text-sm flex-1 flex items-center justify-end space-x-3 mr-11">
                      <StarRating
                        value={ratings[category.key]}
                        onValueChange={(val) =>
                          handleRatingChange(category.key, val)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <label
              htmlFor="reviewTitle"
              className="block text-gray-700 text-base font-bold mb-2"
            >
              評論標題 <span className="text-red-500">*</span>
            </label>
            <input
              id="reviewTitle"
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              className="text-sm w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10 "
              placeholder="給評論一個簡短的標題..."
              required
            />
          </div>

          <div>
            <label
              htmlFor="reviewContent"
              className="block text-gray-700 text-base font-bold mb-2"
            >
              評論詳情 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reviewContent"
              rows="6"
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              className="text-sm w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="分享您的用餐體驗..."
              required
            ></textarea>
            <ReviewModerationCheck
              content={reviewContent}
              onModerationResult={handleModerationResult}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              上傳圖片 (最多 5 張，僅限 .jpg)
            </label>
            <div className="flex items-center space-x-4">
              <label className="text-sm flex-shrink-0 cursor-pointer bg-blue-500 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-blue-600 transition-colors">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                選擇圖片
                <input
                  type="file"
                  accept=".jpg,.jpeg"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadedImages.length >= 5}
                  className="hidden"
                />
              </label>
              <span className="text-gray-600 text-sm">
                已選擇 {uploadedImages.length} / 5 張
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mt-4">
              {uploadedImages.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.url}
                    alt="Uploaded preview"
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image.id)}
                    className="absolute top-1 right-1 p-1 text-gray-500 hover:text-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                  <input
                    type="text"
                    value={image.description}
                    onChange={(e) =>
                      handleImageDescriptionChange(image.id, e.target.value)
                    }
                    className="w-full mt-2 p-1 text-sm border border-gray-300 rounded-md"
                    placeholder="菜式名 (選填)"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting || !selectedRestaurant}
              className="px-6 py-3 bg-yellow-500 text-white font-bold rounded-md shadow-md hover:bg-yellow-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "儲存中..." : "儲存草稿"}
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                !selectedRestaurant ||
                !reviewTitle.trim() ||
                !reviewContent.trim() ||
                overallRating === 0 ||
                !timeOfDay ||
                !serviceType ||
                moderationWarning
              }
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-md shadow-md hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "提交中..." : "提交食評"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReviewForm;
