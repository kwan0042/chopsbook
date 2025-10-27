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
      {/* 外層：手機版垂直堆疊 (flex-col space-y-4)，網站版水平分散 (md:flex-row md:justify-between) */}
      {/* 外層：無論手機版還是網頁版，都強制垂直堆疊 (flex-col) */}
      <div className="flex flex-col space-y-4">
        {/* 1. 條款 (永遠在最上方，佔據一整行) */}
        <div className="w-full">
          <p
            // 條款文字在所有螢幕尺寸都居中對齊
            className="text-sm md:text-base text-center py-3"
          >
            請參閱我們的
            <a
              href="/help/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline px-1 font-bold"
            >
              使用條款
            </a>
            和
            <a
              href="/help/review-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="underline pl-1 font-bold"
            >
              食評政策
            </a>
            。
          </p>
        </div>

        {/* 2. 草稿和提交 (永遠在下方一行，水平排列) */}
        <div className="flex justify-center space-x-4 w-full">
          {/* 草稿按鈕 */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={submitting || !selectedRestaurant || isDailyLimitReached}
            // 讓兩個按鈕平分寬度
            className="px-6 py-3 text-sm md:text-base bg-yellow-500 text-white font-bold rounded-md shadow-md hover:bg-yellow-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-1 max-w-[50%]"
          >
            {submitting ? "儲存中..." : "儲存草稿"}
          </button>

          {/* 提交按鈕 */}
          <button
            type="submit"
            disabled={submitting || moderationWarning || isDailyLimitReached}
            // 讓兩個按鈕平分寬度
            className="px-6 py-3 text-sm md:text-base bg-green-600 text-white font-bold rounded-md shadow-md hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-1 max-w-[50%]"
          >
            {submitting ? "發布中..." : "同意並發布"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewFormButtons;
