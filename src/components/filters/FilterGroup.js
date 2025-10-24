"use client";

import React from "react";

// Icons are now rendered inline to avoid import issues
const ChevronUpIconUrl = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
    className="w-4 h-4 text-gray-500 transition-transform duration-200"
  >
    <path
      fill="currentColor"
      d="M201.4 137.4c12.5-12.5 32.8-12.5 45.3 0l160 160c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L224 205.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160z"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
    className="w-4 h-4 text-gray-500 transition-transform duration-200"
  >
    <path
      fill="currentColor"
      d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"
    />
  </svg>
);

const FilterGroup = ({ title, isCollapsed, onToggle, children }) => {
  return (
    <div className="border-b pb-4 border-gray-200">
      <div
        className="flex justify-between items-center cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        onClick={onToggle}
      >
        <h4 className="text-base font-semibold text-gray-800">{title}</h4>
        {isCollapsed ? <ChevronDownIcon /> : <ChevronUpIconUrl />}
      </div>
      {!isCollapsed && <div className="mt-3">{children}</div>}
    </div>
  );
};

export default FilterGroup;
