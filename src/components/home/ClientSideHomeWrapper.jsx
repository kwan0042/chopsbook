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

// 💡 修改：將 UpdateAnnouncement 導入為 ScrollingAnnouncement
import ScrollingAnnouncement from "@/components/home/ScrollingAnnouncement.jsx";
import AnnouncementModal from "@/components/home/AnnouncementModal.jsx";

// ====================================================================
// 💡 JSDOC: 定義公告數據結構
/**
 * @typedef {Object} AnnouncementData
 * @property {number} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} date
 * @property {string} [imageUrl]
 * @property {React.ReactNode} [details]
 */

// 💡 所有的公告數據列表 (取代 LATEST_UPDATE_DATA)
/** @type {AnnouncementData[]} */
const ANNOUNCEMENTS_LIST = [
  {
    id: 101,
    title: "✨ 最新功能：餐廳收藏與分享",
    subtitle: "現在您可以儲存喜愛的餐廳並與朋友分享清單！",
    date: "2025年10月25日",
    details: (
      <div className="prose max-w-none">
        <h4 className="text-xl font-bold text-gray-900 mb-3">
          收藏與分享功能已上線！
        </h4>
        <p>我們聽到了用戶的聲音！從今天起，您可以收藏和分享餐廳清單。</p>
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
    id: 103,
    title: "🎁 慶祝用戶突破十萬！領取 $50 優惠券",
    subtitle: "所有用戶可領取 $50 優惠券。",
    date: "2025年10月20日",
    details: (
      <div className="prose max-w-none">
        <p>為感謝廣大用戶支持，即日起登錄即可領取限時 $50 優惠券！</p>
      </div>
    ),
  },
  {
    id: 104,
    title: "📢 隱私政策更新 (已於 10/18 生效)",
    subtitle: "新的隱私政策已於 10/18 生效。",
    date: "2025年10月18日",
    details: (
      <div className="prose max-w-none">
        <p>我們已更新了服務條款和隱私政策。建議您花時間閱讀變更內容。</p>
      </div>
    ),
  },
];

// 構造用於 ScrollingAnnouncement 的緊湊型數據 (text + onClick)
const compactAnnouncements = ANNOUNCEMENTS_LIST.map((announcement) => ({
  text: announcement.title, // 只顯示標題
  // 點擊時，將完整的公告數據傳給 handleOpenAnnouncementModal
  onClick: () => handleOpenAnnouncementModal(announcement),
}));
// ====================================================================

/**
 * ClientSideHomeWrapper: 處理互動邏輯，並根據 side prop 渲染特定側邊欄的組件。
 */
const ClientSideHomeWrapper = ({ side }) => {
  const { currentUser, setModalMessage, modalMessage, appId } =
    useContext(AuthContext);
  const router = useRouter();

  const isGlobalLogic = side === "left";
  const [showFilterModal, setShowFilterModal] = useState(false);

  // 💡 公告 Modal 狀態
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const handleShowFilterModal = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  const handleCloseFilterModal = useCallback(() => {
    setShowFilterModal(false);
  }, []);

  // 💡 處理公告 Modal 開啟/關閉
  /** @param {AnnouncementData} data */
  const handleOpenAnnouncementModal = useCallback((data) => {
    setSelectedAnnouncement(data);
  }, []);

  const handleCloseAnnouncementModal = useCallback(() => {
    setSelectedAnnouncement(null);
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
        {/* 💡 B1. 使用新的 ScrollingAnnouncement，並傳入緊湊數據 */}
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

        {/* 💡 新增：公告詳情 Modal (只在左側欄渲染一次) */}
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
