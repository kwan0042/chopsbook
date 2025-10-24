// src/app/restaurants/[restaurantId]/reviews/[reviewId]/page.js
import { notFound } from "next/navigation";
import { getReviewById } from "@/components/reviews/ReviewService";
import ReviewCardInteractive from "@/components/reviews/ReviewCardInteractive";
import Link from "next/link";

const appId = process.env.FIREBASE_ADMIN_APP_ID;

export default async function ReviewDetailPage(context) {
  const params = await context.params; // 如果 Next.js 版本真係要求 await
  const { reviewId } = params;
  const review = await getReviewById(reviewId, appId);
  if (!review) notFound();

  return (
    <div className="w-full mx-auto  md:p-8">
      <article className="sr-only">
        <h1>{review.reviewTitle}</h1>
        <p>{review.reviewContent}</p>
        <p>
          餐廳：
          {review.restaurantName?.["zh-TW"] ||
            review.restaurantName?.en ||
            "餐廳名稱未知"}
        </p>
      </article>
      {/* 返回按鈕 */}
      <div className="md:pl-8 ">
        <Link
          href={`/restaurants/${review.restaurantId}/reviews`}
          className="inline-block px-4 py-2 rounded-lg bg-cbbg text-gray-800 hover:bg-gray-200 transition"
        >
          ← 返回評論列表
        </Link>
      </div>
      <ReviewCardInteractive
        review={review}
        restaurantDisplayName={review.restaurantName}
      />
    </div>
  );
}
