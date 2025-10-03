// src/components/home/ClientSideHomeWrapper.js
"use client";

import React, { useState, useContext, useCallback } from "react";
import { AuthContext } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

// 導入所有 Client Component
import FilterModal from "@/components/filters/FilterModal";
import Modal from "@/components/Modal";
import PersonalizedSection from "./PersonalizedSection.jsx";
import InteractivePollSection from "./InteractivePollSection.jsx";
import RandomPickerSection from "./RandomPickerSection.jsx";
import WeeklyRankingsSection from "./WeeklyRankingsSection.jsx";

/**
 * ClientSideHomeWrapper: 處理互動邏輯，並根據 side prop 渲染特定側邊欄的組件。
 */
    
    const ClientSideHomeWrapper = ({ side }) => {
  const { currentUser, setModalMessage, modalMessage,appId } =
    useContext(AuthContext);
  const router = useRouter();

  // 模態框狀態和邏輯只需在一個實例中處理
  const isGlobalLogic = side === "left";
  const [showFilterModal, setShowFilterModal] = useState(false);

  const handleShowFilterModal = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  const handleCloseFilterModal = useCallback(() => {
    setShowFilterModal(false);
  }, []);

  const handleApplyFilters = useCallback(
    (filters) => {
      const params = new URLSearchParams();
      if (Object.keys(filters).length > 0) {
        params.set("filters", JSON.stringify(filters));
      }
      router.push(`/restaurants?${params.toString()}`);
      setShowFilterModal(false);
    },
    [router]
  );

  const closeModal = () => setModalMessage("");

  if (side === "left") {
    // 渲染左側欄的 Client Component
    return (
      <>
        {/* A. 個人化推薦 (PersonalizedSection) - 登入後顯示 */}
        {currentUser && <PersonalizedSection />}

        {/* <WeeklyRankingsSection /> */}

        {/* 模態框：只在這裡渲染一次，避免重複 */}
        <FilterModal
          isOpen={showFilterModal}
          onClose={handleCloseFilterModal}
          onApplyFilters={handleApplyFilters}
        />
        {modalMessage && (
          <Modal
            message={modalMessage}
            onClose={closeModal}
            isOpen={!!modalMessage}
          />
        )}
      </>
    );
  }

  if (side === "right") {
    // 渲染右側欄的 Client Component
    return (
      <>
        {/* B. 互動式投票/問答 (InteractivePollSection) */}
        <InteractivePollSection />

        {/* C. 是但食 (RandomPickerSection) */}
        
      </>
    );
  }

  return null;
};

export default ClientSideHomeWrapper;
