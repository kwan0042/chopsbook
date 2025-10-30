import React from "react";
import StarRating from "../StarRating";

const ReviewRatingSection = ({
  overallRating,
  handleOverallRatingChange,
  showDetailedRatings,
  setShowDetailedRatings,
  ratings,
  handleRatingChange,
  ratingCategories,
  errors,
}) => {
  return (
    <>
      <div>
        <label
          htmlFor="overallRating"
          className="block text-gray-700 text-base font-bold mb-2"
        >
          總體評級 <span className="text-red-500">*</span>
        </label>
        <div className="md:flex items-center md:space-x-3 space-y-3 ">
          <StarRating
            value={overallRating}
            onValueChange={handleOverallRatingChange}
          />
          <span className=" py-2 md:py-0 text-base font-bold text-gray-800 transition-opacity duration-200">
            / 5
          </span>
          <span className=" py-2 md:py-0 mx-2 text-xs font-bold text-gray-800 transition-opacity duration-200">
            (第一粒星星可以多按一下，令評分至零。)
          </span>
          <button
            type="button"
            onClick={() => setShowDetailedRatings(!showDetailedRatings)}
            className="my-3 md:my-0 text-sm ml-auto px-4 py-2 text-blue-600 font-semibold rounded-md border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            {showDetailedRatings ? "隱藏細項" : "詳細評分"}
          </button>
        </div>
        {errors.overallRating && (
          <p className="mt-1 text-sm text-red-500">{errors.overallRating}</p>
        )}
      </div>
      {showDetailedRatings && (
        <div className="bg-gray-50 md:p-4 rounded-lg space-y-4">
          <div className="flex items-center space-x-3">
            <h4 className="text-base font-bold text-gray-800">細項評分</h4>{" "}
            <span className="text-xs w-fit text-gray-800">
              （0分項不會計算）
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ratingCategories.map((category) => (
              <div key={category.key} className="flex items-center">
                <div className="w-[20%]">
                <span className="text-sm w-full text-gray-800">
                  {category.label}:
                </span>
                </div>
                <div className="text-sm flex-1 flex items-center space-1 mr-1 md:mr-11 min-w-0">
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
    </>
  );
};

export default ReviewRatingSection;
