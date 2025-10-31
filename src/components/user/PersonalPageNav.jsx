import React from "react";
import Link from "next/link";

/**
 * PersonalPageNav: 用於個人頁面導航的組件。
 * @param {string} selectedNav - 當前選中的導航項目的 id (e.g., "overview", "reviews")。
 * @param {string} userId - 當前頁面所屬的用戶 ID。
 */
const PersonalPageNav = ({ selectedNav, userId }) => {
  const navItems = [
    { id: "overview", label: "總覽" },
    { id: "reviews", label: "食評" },
    { id: "favorite-list", label: "最愛餐廳" },
    { id: "awards", label: "成就" },
    // 更多導航選項
  ];

  return (
    <div className="flex justify-start  border-b border-gray-200">
      {navItems.map((item) => (
        <Link
          key={item.id}
          // 修正：根據不同的 id 生成正確的 href
          href={
            item.id === "overview"
              ? `/user/${userId}`
              : `/user/${userId}/${item.id}`
          }
          className={`py-2 px-4 text-base font-medium transition-colors duration-200 ease-in-out
          ${
            selectedNav === item.id
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-blue-500"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default PersonalPageNav;
