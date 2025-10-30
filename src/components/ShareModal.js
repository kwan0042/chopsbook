// src/components/ShareModal.js
"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faLine,
  faThreads,
  faInstagram,
  faWhatsapp,
  faXTwitter,
  faWeixin,
  faReddit, // 範例，如果你想新增 Reddit
  faTelegram, // 範例，如果你想新增 Telegram
} from "@fortawesome/free-brands-svg-icons";
import {
  faEnvelope,
  faClipboard,
  faCommentDots,
} from "@fortawesome/free-solid-svg-icons"; // 新增短訊圖標
import Image from "next/image";

const ShareModal = ({ isOpen, onClose, restaurantName, shareUrl }) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("無法複製連結:", err);
    }
  };

  const weixinShareUrl = `weixin://dl/chat?text=${encodeURIComponent(
    `快來看看這家超棒的餐廳：${restaurantName} ${shareUrl}`
  )}`;

  const xiaohongshuShareUrl = `https://www.xiaohongshu.com/explore?share_url=${encodeURIComponent(
    shareUrl
  )}`;

  const smsShareUrl = `sms:?&body=${encodeURIComponent(
    `快來看看這家超棒的餐廳：${restaurantName} ${shareUrl}`
  )}`;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
          aria-label="關閉"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          分享 {restaurantName}
        </h2>

        <div className="space-y-4">
          {/* 複製連結 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              餐廳連結
            </label>
            <div className="flex items-center border rounded-md overflow-hidden">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-grow p-2 text-sm bg-gray-100 border-none focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 text-sm transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faClipboard} className="mr-2" />
                {isCopied ? "已複製!" : "複製"}
              </button>
            </div>
          </div>

          {/* 社交媒體分享按鈕 */}
          <div>
            <p className="text-gray-700 text-sm font-bold mb-2">分享至</p>
            <div className="flex flex-wrap justify-center gap-2">
              {/* 1. WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `快來看看這家超棒的餐廳：${restaurantName} ${shareUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white bg-[#25D366] rounded-sm h-12 w-12 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="分享至 WhatsApp"
              >
                <FontAwesomeIcon icon={faWhatsapp} size="xl" />
              </a>

              {/* 2. Instagram - 已修改為嘗試直接分享 Story 協議 (僅在App安裝的行動裝置上有效) */}
              <a
                href={`instagram://story/share?link=${encodeURIComponent(
                  shareUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white bg-[#E1306C] rounded-sm h-12 w-12 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="分享至 Instagram Story"
              >
                <FontAwesomeIcon icon={faInstagram} size="xl" />
              </a>

              {/* 3. Threads */}
              <a
                href={`https://www.threads.net/intent/post?text=${encodeURIComponent(
                  `快來看看這家超棒的餐廳：${restaurantName} ${shareUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white bg-black rounded-sm h-12 w-12 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="分享至 Threads"
              >
                <FontAwesomeIcon icon={faThreads} size="xl" />
              </a>

              {/* 4. Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  shareUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white bg-[#1877F2] rounded-sm h-12 w-12 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="分享至 Facebook"
              >
                <FontAwesomeIcon icon={faFacebook} size="xl" />
              </a>

              {/* 5. X (原 Twitter) */}
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                  `快來看看這家超棒的餐廳：${restaurantName} ${shareUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white bg-black rounded-sm h-12 w-12 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="分享至 X"
              >
                <FontAwesomeIcon icon={faXTwitter} size="xl" />
              </a>

              {/* 6. Line */}
              <a
                href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
                  shareUrl
                )}&text=${encodeURIComponent(
                  `快來看看這家超棒的餐廳：${restaurantName}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white bg-[#00B900] rounded-sm h-12 w-12 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="分享至 Line"
              >
                <FontAwesomeIcon icon={faLine} size="xl" />
              </a>

              {/* 7. WeChat */}
              <a
                href={weixinShareUrl}
                className="text-white bg-[#09B838] rounded-sm h-12 w-12 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="分享至 微信"
              >
                <FontAwesomeIcon icon={faWeixin} size="xl" />
              </a>

              {/* 8. 小紅書 */}
              <a
                href={xiaohongshuShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white bg-[#FF2442] rounded-sm h-12 w-12 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="分享至 小紅書"
              >
                <Image height={40} width={40} alt="小紅書" src="/lrn.png" />
              </a>

              {/* 9. 短訊 */}
              <a
                href={smsShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white bg-gray-500 rounded-sm h-12 w-12 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="透過短訊分享"
              >
                <FontAwesomeIcon icon={faCommentDots} size="xl" />
              </a>

              {/* 最後. Email */}
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  `推薦這家餐廳給你：${restaurantName}`
                )}&body=${encodeURIComponent(
                  `我發現了一家很棒的餐廳，快來看看吧！\n\n${restaurantName}\n${shareUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white bg-gray-500 rounded-sm h-12 w-12 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="透過電子郵件分享"
              >
                <FontAwesomeIcon icon={faEnvelope} size="xl" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
