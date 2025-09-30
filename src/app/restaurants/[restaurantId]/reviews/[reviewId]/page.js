// src/app/restaurants/[restaurantId]/reviews/[reviewId]/page.js
import { notFound } from "next/navigation";
import ReviewCardInteractive from "@/components/reviews/ReviewCardInteractive";

/**
 * 從 API 獲取單個評論資料 (Server Side)
 * @param {string} reviewId
 * @returns {Promise<Object|null>}
 */
async function getReviewData(reviewId) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const res = await fetch(`${baseUrl}/api/reviews/${reviewId}`, {
      cache: "no-store",
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch review: ${res.status}`);

    return await res.json();
  } catch (error) {
    console.error("Error fetching review data:", error);
    return null;
  }
}

// Review 頁面
export default async function ReviewDetailPage({ params }) {
  const { reviewId, restaurantId } = await params;
  const review = await getReviewData(reviewId);
  if (!review) notFound();

  const restaurantDisplayName =
    typeof review.restaurantName === "object" && review.restaurantName !== null
      ? review.restaurantName["zh-TW"] ||
        review.restaurantName["en"] ||
        "餐廳名稱未知"
      : review.restaurantName;

  return (
    <div className="w-full  mx-auto p-4 md:p-8">
      <ReviewCardInteractive
        review={review}
        restaurantDisplayName={restaurantDisplayName}
      />
    </div>
  );
}
