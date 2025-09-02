"use client";
import { Suspense } from "react";
import RestaurantContent from "../../components/RestaurantContent";
import LoadingSpinner from "../../components/LoadingSpinner";

// 將實際的頁面內容移到 RestaurantContent 元件中，
// 並在此處使用 Suspense 包裹，以正確處理 useSearchParams。
const RestaurantsPage = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RestaurantContent />
    </Suspense>
  );
};

export default RestaurantsPage;
