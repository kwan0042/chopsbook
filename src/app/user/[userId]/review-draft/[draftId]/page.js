"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/lib/auth-context";
import LoadingSpinner from "@/components/LoadingSpinner";
import ReviewForm from "@/components/reviews/ReviewForm";
import { doc, getDoc, collection, query, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

const EditDraftPage = ({ params }) => {
  const router = useRouter();
  const { currentUser, db, appId, loadingUser } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialDraftData, setInitialDraftData] = useState(null);
  const [initialRestaurant, setInitialRestaurant] = useState(null);

  // 💥 修正警告的關鍵點：在組件函數內部使用 React.use() 解構 params
  // 這將等待 Promise 完成，並取得底層的 params 對象。
  const { userId, draftId } = React.use(params);
  // -----------------------------------------------------------

  useEffect(() => {
    const fetchData = async () => {
      // 確保所有依賴項都已準備好
      if (loadingUser || !currentUser || !db || !appId) {
        return;
      }

      // Authorization check
      if (currentUser.uid !== userId) {
        setError("你沒有權限編輯此草稿。");
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch the specific draft data (先讀取草稿)
        const draftDocRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/draft_reviews`,
          draftId
        );
        const draftDoc = await getDoc(draftDocRef);

        // 🔹 log 草稿文件讀取量
        console.log(
          `[Firestore READ] /user/[userId]/review-draft/[draftId] - Draft: ${
            draftDoc.exists() ? 1 : 0
          } doc`
        );

        if (!draftDoc.exists()) {
          setError("找不到指定的草稿。");
          setLoading(false);
          return;
        }

        const draftData = draftDoc.data();
        setInitialDraftData(draftData);

        // 2. Fetch the associated single restaurant (只讀取關聯餐廳)
        const restaurantId = draftData.restaurantId;
        if (restaurantId) {
          const restaurantDocRef = doc(
            db,
            `artifacts/${appId}/public/data/restaurants`,
            restaurantId
          );
          const restaurantDoc = await getDoc(restaurantDocRef);

          // 🔹 log 單一餐廳讀取量
          console.log(
            `[Firestore READ] /user/[userId]/review-draft/[draftId] - Restaurant: ${
              restaurantDoc.exists() ? 1 : 0
            } doc`
          );

          if (restaurantDoc.exists()) {
            setInitialRestaurant({
              id: restaurantDoc.id,
              ...restaurantDoc.data(),
            });
          }
        }
      } catch (err) {
        console.error("載入草稿或餐廳資料失敗:", err);
        setError("載入數據時發生錯誤。");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, draftId, currentUser, db, appId, loadingUser]); // 依賴項已修正

  const handleBack = () => {
    router.push(`/user/${currentUser.uid}/review-draft`);
  };

  if (loadingUser || loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px] bg-gray-50 rounded-xl shadow-md p-8 w-full max-w-4xl">
        <LoadingSpinner />
        <p className="ml-4 text-gray-700">載入草稿...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-red-50 text-red-700 rounded-xl shadow-md p-8 w-full max-w-4xl">
        <p className="font-semibold text-lg">{error}</p>
        <button
          onClick={handleBack}
          className="mt-4 text-blue-600 hover:underline"
        >
          返回草稿列表
        </button>
      </div>
    );
  }

  const initialRestaurantsForForm = initialRestaurant
    ? [initialRestaurant]
    : [];

  return (
    <div className="min-h-screen flex items-center  p-4">
      <ReviewForm
        onBack={handleBack}
        draftId={draftId}
        initialDraftData={initialDraftData}
        initialRestaurants={initialRestaurantsForForm}
      />
    </div>
  );
};

export default EditDraftPage;
