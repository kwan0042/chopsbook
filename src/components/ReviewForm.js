// src/components/ReviewForm.js
"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../lib/auth-context";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  where,
} from "firebase/firestore";
import LoadingSpinner from "./LoadingSpinner";
import { useRouter } from "next/navigation";
import ReviewModerationCheck from "./ReviewModerationCheck"; // 導入新的審核組件

// 圖標：用於返回按鈕
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

// 評分項目配置
const ratingCategories = [
  { key: "taste", label: "味道" },
  { key: "environment", label: "環境" },
  { key: "service", label: "服務" },
  { key: "hygiene", label: "衛生" },
  { key: "value", label: "抵食" },
  // 可根據需要在此處添加更多評分項目
];

/**
 * ReviewForm: 用於撰寫食評的表單組件。
 * 允許用戶選擇餐廳、評分多個項目並輸入食評內容。
 * 支援儲存草稿和提交食評功能。
 * @param {object} props - 組件屬性。
 * @param {function} props.onBack - 返回上一頁的回調函數。
 * @param {string} [props.draftId] - 要載入的草稿食評 ID (選填)。
 */
const ReviewForm = ({ onBack, draftId }) => {
  const {
    db,
    currentUser,
    appId,
    submitReview,
    saveReviewDraft,
    setModalMessage,
    checkModeration,
  } = useContext(AuthContext);
  const router = useRouter();

  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [reviewContent, setReviewContent] = useState("");
  const [ratings, setRatings] = useState(() => {
    const initialRatings = {};
    ratingCategories.forEach((cat) => {
      initialRatings[cat.key] = 0;
    });
    return initialRatings;
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false); // 標記是否已載入草稿
  const [moderationWarning, setModerationWarning] = useState(null); // 新增：審核警告狀態

  // 獲取所有餐廳列表
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

  // 根據搜尋關鍵字篩選餐廳建議
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

  // 載入草稿 (如果提供了 draftId)
  useEffect(() => {
    const loadDraft = async () => {
      if (draftId && db && currentUser && !loading && !isDraftLoaded) {
        try {
          setSubmitting(true); // 設置為載入狀態
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
            setReviewContent(draft.reviewContent || "");
            setRatings(draft.ratings || ratings); // 合併現有預設值與草稿值
            setIsDraftLoaded(true);
            setModalMessage("草稿已載入！");
          } else {
            setModalMessage("找不到該草稿。");
            router.replace("/personal/reviews"); // 清除 URL 中的 draftId
          }
        } catch (error) {
          console.error("載入草稿失敗:", error);
          setModalMessage(`載入草稿失敗: ${error.message}`);
        } finally {
          setSubmitting(false); // 結束載入狀態
        }
      }
    };

    // 只有當餐廳列表載入完成、有用戶、有 draftId 且草稿尚未載入時才觸發
    if (
      !loading &&
      restaurants.length > 0 &&
      currentUser &&
      draftId &&
      !isDraftLoaded
    ) {
      loadDraft();
    }
  }, [
    draftId,
    db,
    currentUser,
    loading,
    restaurants,
    appId,
    setModalMessage,
    router,
    ratings,
    isDraftLoaded,
  ]);

  const handleRatingChange = useCallback((categoryKey, value) => {
    setRatings((prev) => ({
      ...prev,
      [categoryKey]: parseFloat(value),
    }));
  }, []);

  const handleSelectRestaurant = useCallback((restaurant) => {
    setSelectedRestaurant(restaurant);
    setSearchQuery(""); // 清空搜尋欄
    setFilteredRestaurants([]); // 清空建議列表
  }, []);

  const handleRemoveSelectedRestaurant = useCallback(() => {
    setSelectedRestaurant(null);
  }, []);

  const handleSaveDraft = async () => {
    if (!currentUser) {
      setModalMessage("請先登入才能儲存草稿。");
      return;
    }
    if (!selectedRestaurant) {
      setModalMessage("請選擇要評價的餐廳。");
      return;
    }
    // 食評內容為空時也允許儲存草稿
    // if (!reviewContent.trim()) {
    //   setModalMessage("食評內容不能為空。");
    //   return;
    // }

    setSubmitting(true);
    try {
      const draftData = {
        restaurantId: selectedRestaurant.id,
        restaurantName:
          selectedRestaurant.restaurantNameZh ||
          selectedRestaurant.restaurantNameEn,
        reviewContent,
        ratings,
      };
      const newDraftId = await saveReviewDraft(draftData, draftId);
      // 如果是新草稿，更新 URL 讓用戶可以繼續編輯
      if (!draftId) {
        router.replace(`/personal/reviews?draftId=${newDraftId}`);
      }
      // setModalMessage 已由 AuthContext 設置
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
    if (!reviewContent.trim()) {
      setModalMessage("食評內容不能為空。");
      return;
    }

    // 在提交前檢查審核警告
    if (moderationWarning) {
      setModalMessage("請修改食評內容以符合社群規範後再提交。");
      return;
    }

    setSubmitting(true);
    try {
      await submitReview(
        selectedRestaurant.id,
        ratings,
        reviewContent,
        draftId
      );
      // setModalMessage 已由 AuthContext 設置

      // 清空表單
      setSelectedRestaurant(null);
      setReviewContent("");
      setRatings(() => {
        const initialRatings = {};
        ratingCategories.forEach((cat) => {
          initialRatings[cat.key] = 0;
        });
        return initialRatings;
      });
      // 清除 URL 中的 draftId (如果是從草稿提交)
      if (draftId) {
        router.replace("/personal/reviews");
      }
      // 可以選擇返回個人頁面或顯示成功訊息
      onBack(); // 提交成功後返回個人頁面
    } catch (error) {
      setModalMessage(`提交食評失敗: ${error.message}`);
      console.error("提交食評失敗:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // 接收 ReviewModerationCheck 的審核結果
  const handleModerationResult = useCallback((warning) => {
    setModerationWarning(warning);
  }, []);

  if (!currentUser) {
    // 如果用戶未登入，由 /personal/reviews 頁面處理重定向
    return null;
  }

  // 顯示載入狀態
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
        onClick={onBack}
        className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors flex items-center"
        aria-label="返回"
      >
        <ArrowLeftIcon className="mr-2" />
        返回
      </button>
      <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
        撰寫食評
      </h2>

      <form onSubmit={handleSubmitReview} className="space-y-6">
        {/* 選擇餐廳 */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            選擇餐廳 <span className="text-red-500">*</span>
          </label>
          {selectedRestaurant ? (
            <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-indigo-50 text-indigo-800">
              <span className="font-semibold">
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
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <p className="mt-2 text-sm text-gray-500">
                  沒有找到匹配的餐廳。
                </p>
              )}
            </>
          )}
        </div>

        {/* 評分項目 */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            評分 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ratingCategories.map((category) => (
              <div key={category.key} className="flex items-center">
                <span className="w-24 text-gray-800">{category.label}：</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={ratings[category.key]}
                  onChange={(e) =>
                    handleRatingChange(category.key, e.target.value)
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-3 font-semibold text-gray-800 min-w-[30px]">
                  {ratings[category.key].toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 食評內容 */}
        <div>
          <label
            htmlFor="reviewContent"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            食評內容 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reviewContent"
            rows="6"
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder="分享您的用餐體驗..."
            required
          ></textarea>
          {/* 整合 ReviewModerationCheck 組件 */}
          <ReviewModerationCheck
            content={reviewContent}
            onModerationResult={handleModerationResult}
          />
        </div>

        {/* 按鈕組 */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={submitting || !selectedRestaurant} // 內容為空也允許儲存草稿
            className="px-6 py-3 bg-yellow-500 text-white font-bold rounded-md shadow-md hover:bg-yellow-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "儲存中..." : "儲存草稿"}
          </button>
          <button
            type="submit"
            disabled={
              submitting ||
              !selectedRestaurant ||
              !reviewContent.trim() ||
              moderationWarning
            } // 存在審核警告時禁用提交按鈕
            className="px-6 py-3 bg-green-600 text-white font-bold rounded-md shadow-md hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "提交中..." : "提交食評"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
