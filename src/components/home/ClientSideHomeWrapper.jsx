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

// 導入公告相關 Client Component
import ScrollingAnnouncement from "@/components/home/ScrollingAnnouncement.jsx";
import AnnouncementModal from "@/components/home/AnnouncementModal.jsx";

// ====================================================================
// 💡 JSDOC: 定義公告數據結構 (保留，因為 Hook 也要使用)
/**
 * @typedef {Object} AnnouncementData
 * @property {number} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} date
 * @property {string} [imageUrl]
 * @property {React.ReactNode} [details]
 */

// 💡 所有的公告數據列表 (移入 Hook 內部)
/** @type {AnnouncementData[]} */
const ANNOUNCEMENTS_LIST = [
  {
    id: 101,
    title: "✨ 最新功能：餐廳收藏與分享",
    subtitle: "現在您可以儲存喜愛的餐廳！",
    date: "2025年10月25日",
    details: (
      <div className="prose max-w-none">
        <h4 className="text-xl font-bold text-gray-900 mb-3">
          收藏與分享功能已上線！
        </h4>
        <p>我們聽到了用戶的聲音！從今天起，您可以收藏喜愛的餐廳。</p>
      </div>
    ),
  },
  {
    id: 102,
    title: "🔔 系統維護通知 (凌晨 2 點暫停 30 分鐘)",
    subtitle: "服務將於 10/26 凌晨 2 點暫停 30 分鐘。",
    date: "2025年10月24日",
    details: (
      <div className="prose max-w-none">
        <p>
          為了提供更穩定的服務，我們將於 **2025/10/26 凌晨 02:00 - 02:30**
          進行系統升級維護。期間服務可能短暫中斷，請見諒！
        </p>
      </div>
    ),
  },

  {
    id: 104,
    title: "📢 隱私政策更新 (已於 10/25 生效)",
    subtitle: "新的隱私政策已於 10/25 生效。",
    date: "2025年10月18日",
    details: (
      <div className="prose max-w-none">
        <p>我們已更新了服務條款和隱私政策。建議您花時間閱讀變更內容。</p>
      </div>
    ),
  },
];

// 💡 提取所有公告邏輯到自定義 Hook
const useAnnouncements = () => {
  // 💡 公告 Modal 狀態
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // 💡 處理公告 Modal 開啟/關閉
  /** @param {AnnouncementData} data */
  const handleOpenAnnouncementModal = useCallback((data) => {
    setSelectedAnnouncement(data);
  }, []);

  const handleCloseAnnouncementModal = useCallback(() => {
    setSelectedAnnouncement(null);
  }, []);

  // 構造用於 ScrollingAnnouncement 的緊湊型數據 (text + onClick)
  // 此處使用 useCallback 確保 compactAnnouncements 只有在依賴項 (handleOpenAnnouncementModal) 變化時才重新創建，但因為 handleOpenAnnouncementModal 已經被 useCallback 包裹且依賴為空，所以這裡可以只使用普通的 map。
  const compactAnnouncements = ANNOUNCEMENTS_LIST.map((announcement) => ({
    text: announcement.title, // 只顯示標題
    // 點擊時，將完整的公告數據傳給 handleOpenAnnouncementModal
    onClick: () => handleOpenAnnouncementModal(announcement),
  }));

  return {
    selectedAnnouncement,
    compactAnnouncements,
    handleOpenAnnouncementModal, // 雖然在 Wrapper 中沒直接用到，但 Hook 內有依賴
    handleCloseAnnouncementModal,
  };
};

// ====================================================================

/**
 * ClientSideHomeWrapper: 處理互動邏輯，並根據 side prop 渲染特定側邊欄的組件。
 */
const ClientSideHomeWrapper = ({ side }) => {
  const { currentUser, setModalMessage, modalMessage, appId } =
    useContext(AuthContext);
  const router = useRouter();

  // 💡 使用新的 Hook
  const {
    selectedAnnouncement,
    compactAnnouncements,
    handleCloseAnnouncementModal,
  } = useAnnouncements();

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
        {/* 💡 B1. 使用 Hook 提供的緊湊數據 */}
        <ScrollingAnnouncement announcements={compactAnnouncements} />

        {/* A. 個人化推薦 (PersonalizedSection) - 登入後顯示 */}
        {currentUser && <PersonalizedSection />}

        {/* B2. 互動式投票或問答 (你原有的) */}
        {/* <InteractivePollSection /> */}

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

        {/* 💡 新增：公告詳情 Modal (使用 Hook 提供的狀態和關閉函數) */}
        <AnnouncementModal
          isVisible={!!selectedAnnouncement}
          onClose={handleCloseAnnouncementModal}
          data={selectedAnnouncement}
        />
      </>
    );
  }

  if (side === "right") {
    // 渲染右側欄的 Client Component
    return (
      <>
        {/* B. 互動式投票/問答 (InteractivePollSection) */}
        {/* <InteractivePollSection /> */}

        {/* C. 是但食 (RandomPickerSection) */}
      </>
    );
  }

  return null;
};

export default ClientSideHomeWrapper;
