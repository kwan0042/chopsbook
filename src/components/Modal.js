// src/components/Modal.js
import React, { useEffect } from "react";

const Modal = ({ isOpen, onClose, message, duration = 0 }) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer); // 清除定時器以避免記憶體洩漏
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center relative">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">{message}</h3>
        {/* 如果需要手動關閉按鈕，可以在這裡添加 */}
        {duration === 0 && (
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            關閉
          </button>
        )}
      </div>
    </div>
  );
};

export default Modal;
