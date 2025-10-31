// src/hooks/auth/useUtils.js

"use client";

import { useCallback } from "react";

/**
 * isValidEmail: 驗證電郵格式是否有效。
 * @param {string} email - 要驗證的電郵字串。
 * @returns {boolean} - 如果電郵格式有效則返回 true，否則返回 false。
 */
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
};

/**
 * formatDateTime: 格式化日期時間，並強制使用多倫多時區來顯示。
 * @param {Date | object | string} date - 日期物件、Firestore Timestamp 或日期字串。
 * @returns {string} - 格式化後的多倫多日期時間字串或 "N/A"。
 */
export const formatDateTime = (date) => {
  if (!date) return "N/A";
  try {
    let d;
    // 嘗試解析 Firestore Timestamp 對象 (標準或序列化後的格式)
    if (typeof date === "object") {
      // 1. 檢查標準屬性 (原生 Firestore Timestamp)
      if (date.seconds && date.nanoseconds) {
        d = new Date(date.seconds * 1000 + date.nanoseconds / 1000000);
      } 
      // 2. 檢查序列化後的屬性 (帶底線的 POJO) <-- 已添加
      else if (date._seconds && date._nanoseconds) {
        d = new Date(date._seconds * 1000 + date._nanoseconds / 1000000);
      } else {
        // 3. 回退到標準 Date 構造函數 (處理原生 Timestamp 實例的 valueOf 或其他物件/字串)
        d = new Date(date);
      }
    } else {
      // 處理日期字串
      d = new Date(date);
    }

    if (isNaN(d.getTime())) {
      return "無效日期";
    }

    // 強制使用多倫多時區，並以台灣格式顯示
    return d.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "America/Toronto", // 強制使用多倫多時區
    });
  } catch (e) {
    console.error("格式化日期失敗:", e);
    return "格式化失敗";
  }
};

/**
 * formatDate: 格式化日期，並強制使用多倫多時區來顯示。
 * @param {Date | object | string} date - 日期物件、Firestore Timestamp 或日期字串。
 * @returns {string} - 格式化後的多倫多日期字串或 "N/A"。
 */
export const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    let d;
    // 嘗試解析 Firestore Timestamp 對象 (標準或序列化後的格式)
    if (typeof date === "object") {
      // 1. 檢查標準屬性 (原生 Firestore Timestamp)
      if (date.seconds && date.nanoseconds) {
        d = new Date(date.seconds * 1000 + date.nanoseconds / 1000000);
      } 
      // 2. 檢查序列化後的屬性 (帶底線的 POJO) <-- 已添加
      else if (date._seconds && date._nanoseconds) {
        d = new Date(date._seconds * 1000 + date._nanoseconds / 1000000);
      } else {
        // 3. 回退到標準 Date 構造函數
        d = new Date(date);
      }
    } else {
      // 處理日期字串
      d = new Date(date);
    }

    if (isNaN(d.getTime())) {
      return "無效日期";
    }

    // 強制使用多倫多時區，並以台灣格式顯示
    return d.toLocaleString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Toronto", // 強制使用多倫多時區
    });
  } catch (e) {
    console.error("格式化日期失敗:", e);
    return "格式化失敗";
  }
};