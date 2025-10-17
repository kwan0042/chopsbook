// src/components/reviews/ReviewForm.js
"use client";

import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { AuthContext } from "../../lib/auth-context";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  where,
  limit,
  orderBy,
  startAfter,
} from "firebase/firestore";
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
import { faArrowLeft, faSpinner } from "@fortawesome/free-solid-svg-icons";

const ratingCategories = [
  { key: "taste", label: "味道" },
  { key: "environment", label: "環境" },
  { key: "service", label: "服務" },
  { key: "hygiene", label: "衛生" },
  { key: "cp", label: "抵食" },
  { key: "drinks", label: "酒/飲料" },
];

const SEARCH_LIMIT = 10;

const ReviewForm = ({
  onBack,
  draftId,
  restaurantIdFromUrl,
  restaurantNameFromUrl,
  initialDraftData,
  initialRestaurants,
}) => {
  const { db, currentUser, appId, saveReviewDraft } = useContext(AuthContext);
  const router = useRouter();

  const hasCheckedDailyLimit = useRef(false);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);

  const lastDocRef = useRef(null);
  const [hasMoreRestaurants, setHasMoreRestaurants] = useState(false);

  const [searchFailedNoResult, setSearchFailedNoResult] = useState(false);

  const [selectedRestaurant, setSelectedRestaurant] = useState(() => {
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

  // Daily Limit 檢查
  useEffect(() => {
    if (!currentUser || !currentUser.uid) return;
    if (
      hasCheckedDailyLimit.current &&
      process.env.NODE_ENV === "development"
    ) {
      return;
    }
    hasCheckedDailyLimit.current = true;

    const checkDailyLimit = async () => {
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
  }, [currentUser?.uid]);

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

  // 監聽 searchQuery 變更，用於重置狀態
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRestaurants([]);
      setSearchFailedNoResult(false);
      lastDocRef.current = null;
      setHasMoreRestaurants(false);
      setErrors((prev) => ({ ...prev, selectedRestaurant: null }));
    }
  }, [searchQuery]);

  // 核心搜尋邏輯：動態語言切換欄位 + 精確分頁
  const fetchRestaurants = async (isLoadMore = false) => {
    if (!searchQuery.trim() || !db || !appId) return;

    if (!isLoadMore) {
      setLoading(true);
      setFilteredRestaurants([]);
      lastDocRef.current = null;
      setHasMoreRestaurants(false);
      setSearchFailedNoResult(false);
    } else {
      setLoadingMore(true);
      if (!lastDocRef.current) {
        setLoadingMore(false);
        return;
      }
    }

    setErrors((prev) => ({ ...prev, selectedRestaurant: null }));

    try {
      const restaurantsRef = collection(
        db,
        `artifacts/${appId}/public/data/restaurants`
      );

      const queryLimit = SEARCH_LIMIT;
      let queryConstraints = [];

      // 1. 判斷輸入語言
      const isChinese = /[\u4e00-\u9fff]/.test(searchQuery.trim());

      // 2. 根據語言選擇搜尋目標欄位
      const searchTarget = isChinese
        ? "restaurantName.zh-TW" // 中文使用原本的欄位
        : "name_lowercase_en"; // 🚨 變更點：英文使用 name_lowercase_en 欄位

      let normalizedQuery = searchQuery.trim();

      // 🚨 變更點：如果是非中文（英文），則強制轉為小寫
      if (!isChinese) {
        normalizedQuery = normalizedQuery.toLowerCase();
      }
      // 🚨 變更點結束

      // 3. 設置查詢約束 (範圍查詢)
      queryConstraints = [
        where(searchTarget, ">=", normalizedQuery),
        where(searchTarget, "<=", normalizedQuery + "\uf8ff"),
        orderBy(searchTarget), // 必須根據 where 條件進行排序
        orderBy("priority","desc"), // 使用文件 ID 作為次要排序欄位
      ];

      // 增加關鍵的除錯輸出
      const searchLangLabel = isChinese ? "zh-TW" : "en" + " (lowercase)";
      const startValue = normalizedQuery;
      const endValue = normalizedQuery + "\uf8ff";

      console.log("------------------------------------------");
      console.log(`[DEBUG - 查詢] 語言判定結果: ${searchLangLabel}`);
      console.log(`[DEBUG - 查詢] 目標欄位: ${searchTarget}`);
      console.log(`[DEBUG - 查詢] 搜尋關鍵字: ${normalizedQuery}`);
      console.log(
        `[DEBUG - 查詢] 執行的範圍: >= "${startValue}" 且 <= "${endValue}"`
      );
      if (isLoadMore) {
        console.log(`[DEBUG - 查詢] 分頁參數: startAfter 啟用`);
      }
      console.log("------------------------------------------");

      if (isLoadMore && lastDocRef.current) {
        // startAfter 需要的是 DocumentSnapshot
        queryConstraints.push(startAfter(lastDocRef.current));
      }

      queryConstraints.push(limit(queryLimit + 1));
      const finalQuery = query(restaurantsRef, ...queryConstraints);

      // 這個 log 幫助追蹤實際讀取量
      console.log(
        `[Firestore READ] 執行查詢 (${searchTarget}), 預計讀取文件數: ${
          queryLimit + 1
        }`
      );

      const snapshot = await getDocs(finalQuery);

      const newHasMore = snapshot.docs.length > queryLimit;
      setHasMoreRestaurants(newHasMore);

      const restaurantsToAddDocs = newHasMore
        ? snapshot.docs.slice(0, queryLimit)
        : snapshot.docs;

      const restaurantsToAdd = restaurantsToAddDocs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 設置下一次 startAfter 的指標
      if (restaurantsToAddDocs.length > 0) {
        // 保存 DocumentSnapshot
        lastDocRef.current = snapshot.docs[restaurantsToAddDocs.length - 1];
      } else if (!isLoadMore) {
        lastDocRef.current = null;
      }

      setFilteredRestaurants((prev) => {
        return isLoadMore ? [...prev, ...restaurantsToAdd] : restaurantsToAdd;
      });

      console.log(`[DEBUG - 結果] 找到 ${restaurantsToAdd.length} 個結果。`);

      if (restaurantsToAdd.length === 0 && !isLoadMore) {
        setSearchFailedNoResult(true);
      } else {
        setSearchFailedNoResult(false);
      }
    } catch (error) {
      // 捕獲索引錯誤
      if (
        error.code === "failed-precondition" &&
        error.message.includes("The query requires an index")
      ) {
        console.error("搜尋餐廳失敗: 缺少索引或索引正在建構。", error);
        setErrors((prev) => ({
          ...prev,
          selectedRestaurant: `搜尋失敗：Firebase要求複合索引。請確認 **${searchTarget}** (升序) 和 **文件ID (priority)** (升序) 的索引已建立並啟用。`,
        }));
      } else {
        console.error("搜尋餐廳失敗:", error);
        setErrors((prev) => ({
          ...prev,
          selectedRestaurant: `搜尋餐廳時發生錯誤: ${
            error.message || "請稍後再試。"
          }`,
        }));
      }
      setSearchFailedNoResult(false);
      setHasMoreRestaurants(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearchRestaurant = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    fetchRestaurants(false);
  };

  const handleLoadMore = () => {
    fetchRestaurants(true);
  };

  useEffect(() => {
    const fetchUsername = async () => {
      if (!currentUser || !currentUser.uid || !db || !appId) return;

      try {
        const userDocRef = doc(db, `artifacts/${appId}/users`, currentUser.uid);
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
    };
    fetchUsername();
  }, [currentUser?.uid, db, appId]);

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
    setSearchFailedNoResult(false);
    lastDocRef.current = null; // 重置分頁狀態
    setHasMoreRestaurants(false); // 重置分頁狀態
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

  if (
    loading &&
    filteredRestaurants.length === 0 &&
    searchQuery.trim() !== ""
  ) {
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
            searchFailedNoResult={searchFailedNoResult}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredRestaurants={filteredRestaurants}
            selectedRestaurant={selectedRestaurant}
            handleSelectRestaurant={handleSelectRestaurant}
            handleRemoveSelectedRestaurant={handleRemoveSelectedRestaurant}
            handleSearchClick={handleSearchRestaurant}
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
            // 傳遞分頁相關的 props 給子元件
            hasMoreRestaurants={hasMoreRestaurants}
            handleLoadMore={handleLoadMore}
            loadingMore={loadingMore}
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
