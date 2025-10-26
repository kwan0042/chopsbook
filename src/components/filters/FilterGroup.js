"use client";

import React from "react";
import { IconCaretUpFilled, IconCaretDownFilled } from "@tabler/icons-react";

const FilterGroup = ({ title, isCollapsed, onToggle, children }) => {
  return (
    <div className="border-b pb-4 border-gray-200">
      <div
        className="flex justify-between items-center cursor-pointer p-2 pr-3 md:pr-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        onClick={onToggle}
      >
        <h4 className="text-base font-semibold text-gray-800 ">{title}</h4>
        {isCollapsed ? <IconCaretDownFilled /> : <IconCaretUpFilled />}
      </div>
      {!isCollapsed && <div className="mt-3">{children}</div>}
    </div>
  );
};

export default FilterGroup;
