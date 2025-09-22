import React from "react";

const ReviewFormButtons = ({
  submitting,
  moderationWarning,
  isDailyLimitReached,
  handleSaveDraft,
  selectedRestaurant,
}) => {
  return (
    <div className="flex flex-col space-y-4">
      {isDailyLimitReached && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">
            您今天已提交 10 篇食評，已達到每日上限。
          </span>
        </div>
      )}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={submitting || !selectedRestaurant || isDailyLimitReached}
          className="px-6 py-3 bg-yellow-500 text-white font-bold rounded-md shadow-md hover:bg-yellow-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "儲存中..." : "儲存草稿"}
        </button>
        <button
          type="submit"
          disabled={submitting || moderationWarning || isDailyLimitReached}
          className="px-6 py-3 bg-green-600 text-white font-bold rounded-md shadow-md hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "提交中..." : "提交食評"}
        </button>
      </div>
    </div>
  );
};

export default ReviewFormButtons;
