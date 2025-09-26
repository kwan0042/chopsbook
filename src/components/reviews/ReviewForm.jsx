// src/components/reviews/ReviewForm.js
"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../lib/auth-context";
import { collection, query, getDocs, doc, getDoc } from "firebase/firestore";
import LoadingSpinner from "../LoadingSpinner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateReviewForm } from "@/lib/reviewValidation";
import useImageUploader from "@/hooks/useImageUploader";
import ReviewFormFields from "./review_form_components/ReviewFormFields";
import ReviewRatingSection from "./review_form_components/ReviewRatingSection";
import ReviewDishSection from "./review_form_components/ReviewDishSection";
import ReviewImageUploader from "./review_form_components/ReviewImageUploader";
import ReviewFormButtons from "./review_form_components/ReviewFormButtons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const ratingCategories = [
  { key: "taste", label: "味道" },
  { key: "environment", label: "環境" },
  { key: "service", label: "服務" },
  { key: "hygiene", label: "衛生" },
  { key: "cp", label: "抵食" },
  { key: "drinks", label: "酒/飲料" },
];

const ReviewForm = ({
  onBack,
  draftId,
  restaurantIdFromUrl,
  restaurantNameFromUrl,
  initialDraftData, // 從父組件接收草稿數據
  initialRestaurants, // 從父組件接收餐廳列表
}) => {
  const { db, currentUser, appId, saveReviewDraft } = useContext(AuthContext);
  const router = useRouter();

  // 根據是否有 initialRestaurants 來決定初始載入狀態
  const [loading, setLoading] = useState(!initialRestaurants);
  const [restaurants, setRestaurants] = useState(initialRestaurants || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(() => {
    // 優先使用草稿數據
    if (initialDraftData) {
      return (
        (initialRestaurants &&
          initialRestaurants.find(
            (r) => r.id === initialDraftData.restaurantId
          )) || {
          id: initialDraftData.restaurantId,
          restaurantName: { "zh-TW": initialDraftData.restaurantName },
        }
      );
    }
    // 其次使用 URL 參數
    if (restaurantIdFromUrl && restaurantNameFromUrl) {
      return {
        id: restaurantIdFromUrl,
        restaurantName: { "zh-TW": restaurantNameFromUrl },
      };
    }
    return null;
  });

  const [reviewTitle, setReviewTitle] = useState(
    initialDraftData?.reviewTitle || ""
  );
  const [overallRating, setOverallRating] = useState(
    initialDraftData?.overallRating || 0
  );
  const [showDetailedRatings, setShowDetailedRatings] = useState(
    !!(
      initialDraftData?.ratings &&
      Object.keys(initialDraftData.ratings).length > 0
    )
  );
  const [reviewContent, setReviewContent] = useState(
    initialDraftData?.reviewContent || ""
  );
  const [costPerPerson, setCostPerPerson] = useState(
    initialDraftData?.costPerPerson || ""
  );
  const [timeOfDay, setTimeOfDay] = useState(initialDraftData?.timeOfDay || "");
  const [serviceType, setServiceType] = useState(
    initialDraftData?.serviceType || ""
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [recommendedDishes, setRecommendedDishes] = useState(
    initialDraftData?.recommendedDishes || [""]
  );
  const [ratings, setRatings] = useState(() => {
    const initialRatings = {};
    ratingCategories.forEach((cat) => {
      initialRatings[cat.key] = initialDraftData?.ratings?.[cat.key] || 0;
    });
    return initialRatings;
  });

  const [submitting, setSubmitting] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(!!initialDraftData);
  const [moderationWarning, setModerationWarning] = useState(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [lastSubmittedRestaurantId, setLastSubmittedRestaurantId] =
    useState(null);
  const [username, setUsername] = useState(null);
  const [errors, setErrors] = useState({});
  const [isDailyLimitReached, setIsDailyLimitReached] = useState(false);

  const {
    uploadedImages,
    handleImageUpload,
    handleImageDescriptionChange,
    handleRemoveImage,
    uploadImagesToFirebase,
    resetImages,
  } = useImageUploader(currentUser);

  useEffect(() => {
    const checkDailyLimit = async () => {
      if (!currentUser || !currentUser.uid) return;
      try {
        const response = await fetch("/api/reviews/get-daily-limit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.uid }),
        });
        const data = await response.json();
        if (data.isLimitReached) {
          setIsDailyLimitReached(true);
        } else {
          setIsDailyLimitReached(false);
        }
      } catch (error) {
        console.error("Error checking daily limit:", error);
      }
    };
    checkDailyLimit();
  }, [currentUser]);

  const hasUnsavedChanges = useCallback(() => {
    const isInitialState =
      !draftId &&
      !restaurantIdFromUrl &&
      !reviewTitle &&
      !reviewContent &&
      !selectedRestaurant &&
      uploadedImages.length === 0 &&
      overallRating === 0 &&
      costPerPerson === "" &&
      timeOfDay === "" &&
      serviceType === "" &&
      Object.values(ratings).every((rating) => rating === 0) &&
      recommendedDishes.length === 1 &&
      recommendedDishes[0] === "";
    return !isInitialState;
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
    recommendedDishes,
  ]);

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

  // 1. 新增：如果沒有傳入 initialRestaurants，則自行獲取資料
  useEffect(() => {
    if (initialRestaurants) {
      // 如果有初始資料，就不需要再獲取
      setRestaurants(initialRestaurants);
      setLoading(false);
      return;
    }

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
      } catch (error) {
        console.error("獲取餐廳列表失敗:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [db, appId, initialRestaurants]);

  // 2. 搜尋邏輯：依賴 restaurants 狀態
  useEffect(() => {
    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase();
      setFilteredRestaurants(
        restaurants.filter(
          (r) =>
            r.restaurantName?.["zh-TW"]
              ?.toLowerCase()
              .includes(normalizedQuery) ||
            r.restaurantName?.en?.toLowerCase().includes(normalizedQuery)
        )
      );
    } else {
      setFilteredRestaurants([]);
    }
  }, [searchQuery, restaurants]);

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
            setUsername(userData.username);
          } else {
            setUsername("匿名用戶");
          }
        } catch (error) {
          console.error("讀取用戶名失敗:", error);
          setUsername("匿名用戶");
        }
      }
    };
    fetchUsername();
  }, [currentUser, db, appId]);

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
    setErrors((prev) => ({ ...prev, selectedRestaurant: null }));
  }, []);

  const handleRemoveSelectedRestaurant = useCallback(() => {
    setSelectedRestaurant(null);
  }, []);

  const handleSaveDraft = async () => {
    if (!currentUser) return;
    if (!selectedRestaurant) {
      setErrors((prev) => ({
        ...prev,
        selectedRestaurant: "請選擇要評價的餐廳。",
      }));
      return;
    }
    setSubmitting(true);
    try {
      const draftData = {
        restaurantId: selectedRestaurant.id,
        restaurantName:
          selectedRestaurant.restaurantName?.["zh-TW"] ||
          selectedRestaurant.restaurantName?.en,
        reviewTitle,
        reviewContent,
        overallRating,
        costPerPerson,
        timeOfDay,
        serviceType,
        ratings,
        recommendedDishes: recommendedDishes.filter(
          (dish) => dish.trim() !== ""
        ),
      };
      const newDraftId = await saveReviewDraft(draftData, draftId);
      router.replace(`/user/${currentUser.uid}/review-draft`);
    } catch (error) {
      console.error("儲存草稿失敗:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const formData = {
      reviewTitle,
      overallRating,
      timeOfDay,
      serviceType,
      selectedRestaurant,
      costPerPerson,
    };
    const validationErrors = validateReviewForm(formData);
    if (validationErrors) {
      setErrors(validationErrors);
      const firstErrorKey = Object.keys(validationErrors)[0];
      const element = document.getElementById(firstErrorKey);
      if (element)
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const submittedRestaurantId = selectedRestaurant.id;
      const visitCountResponse = await fetch("/api/reviews/get-visit-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          restaurantId: submittedRestaurantId,
        }),
      });
      const visitCountData = await visitCountResponse.json();
      if (!visitCountResponse.ok) {
        throw new Error(visitCountData.message || "Failed to get visit count.");
      }
      const { visitCount } = visitCountData;
      const uploadedImageUrls = await uploadImagesToFirebase(
        submittedRestaurantId,
        visitCount
      );
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: submittedRestaurantId,
          reviewTitle,
          overallRating,
          reviewContent,
          ratings,
          costPerPerson,
          timeOfDay,
          serviceType,
          recommendedDishes: recommendedDishes.filter(
            (dish) => dish.trim() !== ""
          ),
          uploadedImageUrls,
          userId: currentUser.uid,
          username: username,
        }),
      });
      const data = await response.json();
      if (data.isLimitReached) {
        setIsDailyLimitReached(true);
        setSubmitting(false);
        return;
      }
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit review.");
      }
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
      resetImages();
      setRecommendedDishes([""]);
      setModerationWarning(null);
      setLastSubmittedRestaurantId(submittedRestaurantId);
      if (draftId) router.replace(`/user/${currentUser.uid}/review-draft`);
      setShowUpdatePrompt(true);
    } catch (error) {
      console.error("提交食評失敗:", error);
    } finally {
      setSubmitting(false);
    }
  };

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

  // 顯示載入狀態
  if (loading) {
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
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        返回
      </button>

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
          <ReviewFormFields
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredRestaurants={filteredRestaurants}
            selectedRestaurant={selectedRestaurant}
            handleSelectRestaurant={handleSelectRestaurant}
            handleRemoveSelectedRestaurant={handleRemoveSelectedRestaurant}
            costPerPerson={costPerPerson}
            setCostPerPerson={setCostPerPerson}
            timeOfDay={timeOfDay}
            setTimeOfDay={setTimeOfDay}
            serviceType={serviceType}
            setServiceType={setServiceType}
            reviewTitle={reviewTitle}
            setReviewTitle={setReviewTitle}
            reviewContent={reviewContent}
            setReviewContent={setReviewContent}
            errors={errors}
            setErrors={setErrors}
            isRestaurantPreselected={!!restaurantIdFromUrl}
          />
          <ReviewRatingSection
            overallRating={overallRating}
            handleOverallRatingChange={handleOverallRatingChange}
            showDetailedRatings={showDetailedRatings}
            setShowDetailedRatings={setShowDetailedRatings}
            ratings={ratings}
            handleRatingChange={handleRatingChange}
            ratingCategories={ratingCategories}
            errors={errors}
          />
          <ReviewDishSection
            recommendedDishes={recommendedDishes}
            setRecommendedDishes={setRecommendedDishes}
          />
          <ReviewImageUploader
            uploadedImages={uploadedImages}
            handleImageUpload={handleImageUpload}
            handleImageDescriptionChange={handleImageDescriptionChange}
            handleRemoveImage={handleRemoveImage}
          />
          <ReviewFormButtons
            submitting={submitting}
            moderationWarning={moderationWarning}
            isDailyLimitReached={isDailyLimitReached}
            handleSaveDraft={handleSaveDraft}
            selectedRestaurant={selectedRestaurant}
          />
        </form>
      )}
    </div>
  );
};

export default ReviewForm;
