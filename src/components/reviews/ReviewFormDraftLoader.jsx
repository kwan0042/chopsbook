"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import ReviewForm from "./ReviewForm";

/**
 * ReviewFormDraftLoader: 專門負責在客戶端環境中，讀取 URL 中的 draftId。
 * 這能將 useSearchParams() 的邏輯與主組件分離，避免伺服器端渲染時的錯誤。
 */
const ReviewFormDraftLoader = ({ onBack }) => {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  return <ReviewForm onBack={onBack} draftId={draftId} />;
};

export default ReviewFormDraftLoader;
