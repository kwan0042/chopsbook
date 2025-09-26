// src/app/user/[userId]/review-draft/[draftId]/page.js
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
  const [restaurants, setRestaurants] = useState([]);

  // **FIX:** Correctly unwrap the params promise using React.use()
  const { userId, draftId } = React.use(params);

  useEffect(() => {
    const fetchData = async () => {
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
        // Fetch all restaurants
        const restaurantsRef = collection(
          db,
          `artifacts/${appId}/public/data/restaurants`
        );
        const restaurantSnapshot = await getDocs(query(restaurantsRef));
        const fetchedRestaurants = restaurantSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRestaurants(fetchedRestaurants);

        // Fetch the specific draft data
        const draftDocRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/draft_reviews`,
          draftId
        );
        const draftDoc = await getDoc(draftDocRef);

        if (!draftDoc.exists()) {
          setError("找不到指定的草稿。");
          setLoading(false);
          return;
        }

        const draftData = draftDoc.data();
        setInitialDraftData(draftData);
      } catch (err) {
        console.error("載入草稿或餐廳列表失敗:", err);
        setError("載入數據時發生錯誤。");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, draftId, currentUser, db, appId, loadingUser]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <ReviewForm
        onBack={handleBack}
        draftId={draftId}
        initialDraftData={initialDraftData}
        initialRestaurants={restaurants}
      />
    </div>
  );
};

export default EditDraftPage;
