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
      <div className="md:flex md:justify-between md:space-x-4">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={submitting || !selectedRestaurant || isDailyLimitReached}
          // ✅ 修正 1: 手機版 text-sm，網頁版 md:text-base (或您預期的網頁版大小)
          className="px-6 py-3 text-sm md:text-base bg-yellow-500 text-white font-bold rounded-md shadow-md hover:bg-yellow-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "儲存中..." : "儲存草稿"}
        </button>
        <div className="md:flex">
          <p
            // ✅ 修正 2: 手機版 text-sm，網頁版 md:text-base
            className=" py-3 flex items-center justify-center text-sm md:text-base" // 類似按鈕的樣式
          >
            請參閱我們的
            <a
              href="/help/terms"
              target="_blank" // 確保在新視窗開啟
              rel="noopener noreferrer"
              // 連結文字將繼承父層的 text-sm md:text-base
              className="underline px-1 font-bold"
            >
              使用條款
            </a>
            和
            <a
              href="/help/review-guide"
              target="_blank" // 確保在新視窗開啟
              rel="noopener noreferrer"
              // 連結文字將繼承父層的 text-sm md:text-base
              className="underline pl-1 font-bold"
            >
              食評政策
            </a>
            。
          </p>

          <button
            type="submit"
            disabled={submitting || moderationWarning || isDailyLimitReached}
            // ✅ 修正 3: 手機版 text-sm，網頁版 md:text-base
            className=" px-6 py-3 text-sm md:text-base bg-green-600 text-white font-bold rounded-md shadow-md hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "發布中..." : "同意並發布"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewFormButtons;
