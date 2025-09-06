// src/components/ReviewModerationCheck.js
"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../lib/auth-context"; // 確保路徑正確

/**
 * ReviewModerationCheck: 用於檢查食評內容是否包含敏感字眼的組件。
 * 它會顯示警告訊息並返回是否通過審核的狀態。
 * 這個組件設計為未來可擴展，例如集成 LLM 或第三方審核服務。
 *
 * @param {object} props - 組件屬性。
 * @param {string} props.content - 要檢查的食評內容。
 * @param {function} props.onModerationResult - 審核結果的回調函數 (string | null)。
 */
const ReviewModerationCheck = ({ content, onModerationResult }) => {
  const { checkModeration } = useContext(AuthContext);
  const [moderationWarning, setModerationWarning] = useState(null);

  useEffect(() => {
    if (content && content.trim().length > 0) {
      const result = checkModeration(content);
      setModerationWarning(result);
      onModerationResult(result); // 回傳審核結果給父組件
    } else {
      setModerationWarning(null);
      onModerationResult(null);
    }
  }, [content, checkModeration, onModerationResult]);

  if (!moderationWarning) {
    return null; // 如果沒有警告，則不顯示任何內容
  }

  return (
    <div
      className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 text-sm"
      role="alert"
    >
      <strong className="font-bold">內容警告：</strong>
      <span className="block sm:inline">{moderationWarning}</span>
      <p className="mt-2 text-xs">請修改您的食評內容以符合社群規範。</p>
    </div>
  );
};

export default ReviewModerationCheck;
