// src/hooks/use-user-rank.js
import React from "react";

// 筷子等級名稱與顏色對應表
export const userRanks = {
  0: { name: "管理員", enName: "Admin", color: "text-white" },
  1: {
    name: "至尊筷子",
    enName: "Supreme Chopsticks",
    color: "text-purple-600",
  },
  2: { name: "鑽石筷子", enName: "Diamond Chopsticks", color: "text-cyan-400" },
  3: {
    name: "白金筷子",
    enName: "Platinum Chopsticks",
    color: "text-blue-300",
  },
  4: { name: "金筷子", enName: "Gold Chopsticks", color: "text-yellow-400" },
  5: { name: "象牙筷子", enName: "Ivory Chopsticks", color: "text-amber-500" },
  6: { name: "玉筷子", enName: "Jade Chopsticks", color: "text-emerald-500" },
  7: { name: "銀筷子", enName: "Silver Chopsticks", color: "text-zinc-500" },
  8: { name: "鐵筷子", enName: "Iron Chopsticks", color: "text-slate-600" },
  9: { name: "竹筷子", enName: "Bamboo Chopsticks", color: "text-green-700" },
  10: { name: "木筷子", enName: "Wooden Chopsticks", color: "text-yellow-800" },
};

// 用於顯示等級圖示和名稱的組件
export const RankDisplay = ({ rank }) => {
  const rankInfo = userRanks[rank] || userRanks[10];
  const isLevel0 = rank === 0;

  return (
    <div className="flex items-center space-x-1 sm:space-x-2 pl-3">
      <div
        className={`relative w-6 h-6 sm:w-6 sm:h-6 flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 
          rank-before
          ${isLevel0 ? "rank-0-effect" : "rank-other-effect"}
        `}
      >
        <svg
          className={`w-4 h-4 sm:w-5 sm:h-5 relative z-10 ${
            isLevel0 ? "text-white" : rankInfo.color
          }`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20 10a2 2 0 0 1 2 2v.5c0 1.694 -2.247 5.49 -3.983 6.983l-.017 .013v.504a2 2 0 0 1 -1.85 1.995l-.15 .005h-8a2 2 0 0 1 -2 -2v-.496l-.065 -.053c-1.76 -1.496 -3.794 -4.965 -3.928 -6.77l-.007 -.181v-.5a2 2 0 0 1 2 -2z" />
          <path d="M18.929 6.003a1 1 0 1 1 .142 1.994l-14 1a1 1 0 1 1 -.142 -1.994z" />
          <path d="M18.79 1.022a1 1 0 1 1 .42 1.956l-14 3a1 1 0 1 1 -.42 -1.956z" />
        </svg>
      </div>
      <span
        // 預設隱藏 (hidden)，sm 保持隱藏 (sm:hidden)，xl 顯示 (xl:inline)
        className={`font-bold text-xs sm:text-sm hidden sm:hidden xl:inline whitespace-nowrap flex-shrink-0 ${
          isLevel0 ? "text-white" : rankInfo.color
        }`}
      >
        {rankInfo.name}
      </span>
    </div>
  );
};
