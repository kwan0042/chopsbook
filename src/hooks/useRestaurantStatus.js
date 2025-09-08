// src/hooks/useRestaurantStatus.js
import { useState, useEffect } from "react";

// 輔助函數：格式化時間字串為 Date 物件
const parseTime = (timeStr) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  now.setHours(hours);
  now.setMinutes(minutes);
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now;
};

/**
 * 自訂 Hook，用於判斷餐廳的營業狀態並回傳狀態文字與顏色。
 * @param {Object} restaurant - 餐廳資料物件，包含 businessHours, isPermanentlyClosed, isTemporarilyClosed。
 * @returns {Object} - 包含狀態文字和顏色類別的物件。
 */
const useRestaurantStatus = (restaurant) => {
  const [status, setStatus] = useState({
    text: "未知狀態",
    color: "text-gray-600",
  });

  useEffect(() => {
    // 輔助函數：根據營業狀態字串返回 Tailwind CSS 顏色類別
    const getStatusInfo = (statusText) => {
      switch (statusText) {
        case "營業中":
          return { text: "營業中", color: "text-green-600" };
        case "已休息":
          return { text: "已休息", color: "text-blue-500" };
        case "休息日":
          return { text: "休息日", color: "text-blue-500" };
        case "暫時休業":
          return { text: "暫時休業", color: "text-orange-500" };
        case "已結業":
          return { text: "已結業", color: "text-red-600" };
        default:
          return { text: "未知狀態", color: "text-gray-600" };
      }
    };

    const checkStatus = () => {
      // 檢查特殊狀態，這些狀態優先於營業時間判斷
      if (restaurant?.isPermanentlyClosed) {
        setStatus(getStatusInfo("已結業"));
        return;
      }
      if (restaurant?.isTemporarilyClosed) {
        setStatus(getStatusInfo("暫時休業"));
        return;
      }

      // 如果沒有營業時間資料，設為未知
      if (
        !restaurant?.businessHours ||
        !Array.isArray(restaurant.businessHours)
      ) {
        setStatus(getStatusInfo("未知狀態"));
        return;
      }

      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = 星期日, 1 = 星期一, ..., 6 = 星期六
      const dayNames = [
        "星期日",
        "星期一",
        "星期二",
        "星期三",
        "星期四",
        "星期五",
        "星期六",
      ];
      const currentDayName = dayNames[dayOfWeek];

      const todayHours = restaurant.businessHours.find(
        (h) => h.day === currentDayName
      );

      // 如果找不到今天的營業時間或當天標記為不營業
      if (!todayHours || !todayHours.isOpen) {
        setStatus(getStatusInfo("休息日"));
        return;
      }

      // 檢查當前時間是否在營業時間範圍內
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const startTime =
        parseTime(todayHours.startTime)?.getHours() * 60 +
        parseTime(todayHours.startTime)?.getMinutes();
      const endTime =
        parseTime(todayHours.endTime)?.getHours() * 60 +
        parseTime(todayHours.endTime)?.getMinutes();

      // 處理跨夜營業的情況
      if (endTime < startTime) {
        if (currentTime >= startTime || currentTime < endTime) {
          setStatus(getStatusInfo("營業中"));
        } else {
          setStatus(getStatusInfo("已休息"));
        }
      } else {
        // 正常當日營業的情況
        if (currentTime >= startTime && currentTime < endTime) {
          setStatus(getStatusInfo("營業中"));
        } else {
          setStatus(getStatusInfo("已休息"));
        }
      }
    };

    // 初始檢查
    checkStatus();

    // 每分鐘重新檢查一次
    const intervalId = setInterval(checkStatus, 60000);

    // 清除定時器，避免記憶體洩漏
    return () => clearInterval(intervalId);
  }, [restaurant]);

  return status;
};

export default useRestaurantStatus;
