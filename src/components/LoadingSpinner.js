// src/components/LoadingSpinner.js
import React from "react";

const LoadingSpinner = ({ size = "md", className = "" }) => {
  let spinnerSizeClasses = "";
  let dotSizeClasses = "";

  switch (size) {
    case "sm":
      spinnerSizeClasses = "w-4 h-4";
      dotSizeClasses = "w-1 h-1";
      break;
    case "md":
      spinnerSizeClasses = "w-6 h-6";
      dotSizeClasses = "w-1.5 h-1.5";
      break;
    case "lg":
      spinnerSizeClasses = "w-8 h-8";
      dotSizeClasses = "w-2 h-2";
      break;
    default:
      spinnerSizeClasses = "w-6 h-6";
      dotSizeClasses = "w-1.5 h-1.5";
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${spinnerSizeClasses} relative`}>
        <div
          className={`absolute top-0 left-0 animate-bounce delay-0 rounded-full bg-current ${dotSizeClasses}`}
        ></div>
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 animate-bounce delay-150 rounded-full bg-current ${dotSizeClasses}`}
        ></div>
        <div
          className={`absolute top-0 right-0 animate-bounce delay-300 rounded-full bg-current ${dotSizeClasses}`}
        ></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
