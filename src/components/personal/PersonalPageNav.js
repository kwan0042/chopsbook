// src/components/profile/PersonalPageNav.js
import React from "react";

const PersonalPageNav = ({ selectedNav, setSelectedNav }) => {
  const navItems = [
    { id: "reviews", label: "我的評論" },
    { id: "favorite-list", label: "最愛餐廳" },
    { id: "awards", label: "我的獎項" },
    // 更多導航選項
  ];

  return (
    <div className="mt-8 border-b border-gray-200">
      <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500">
        {navItems.map((item) => (
          <li key={item.id} className="me-2">
            <button
              onClick={() => setSelectedNav(item.id)}
              className={`inline-block p-4 border-b-2 rounded-t-lg transition-colors duration-200 ${
                selectedNav === item.id
                  ? "text-indigo-600 border-indigo-600 font-bold"
                  : "hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PersonalPageNav;