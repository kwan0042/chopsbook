// src/lib/validation.js

/**
 * 整合所有欄位 (Step 1, 2, 3) 的驗證函式，執行一次性全面驗證。
 *
 * @param {object} data - 餐廳表單資料 (包含所有步驟的欄位)
 * @param {boolean} [isUpdateForm=false] - 是否為更新表單 (用於照片驗證)。
 * @param {string[]} [originalFacadePhotoUrls=[]] - 原始圖片 URL (用於照片驗證)。
 * @returns {object} 彙總的錯誤物件，key 為欄位名稱，value 為錯誤訊息或錯誤陣列。
 */

// 🚨 導入 SUB_CATEGORY_MAP：請根據您的檔案結構調整路徑！
import { SUB_CATEGORY_MAP } from "../data/restaurant-options";

export const validateRestaurantForm = (
  data,
  isUpdateForm = false,
  originalFacadePhotoUrls = []
) => {
  const errors = {};

  // ===================================
  // === Step 1: 餐廳詳細資料 驗證邏輯 ===
  // ===================================

  // 照片相關變數
  const hasOriginalPhoto = originalFacadePhotoUrls.length > 0;
  const hasSelectedFile = !!data.tempSelectedFile;
  const hasPhotoUrlInFormData =
    data.facadePhotoUrls && data.facadePhotoUrls.length > 0;

  // 1. 餐廳名稱
  if (!data.restaurantName?.en?.trim()) {
    errors.restaurantName = { en: "英文名稱為必填項目。" };
  }
  if (!data.noChineseName && !data.restaurantName?.["zh-TW"]?.trim()) {
    errors.restaurantName = {
      ...errors.restaurantName,
      "zh-TW": "中文名稱為必填項目，或勾選「沒有中文名稱」。",
    };
  }

  // 2. 地址
  if (!data.province) errors.province = "省份為必填項目。";
  if (!data.city) errors.city = "城市為必填項目。";
  if (!data.postalCode) errors.postalCode = "郵政編碼為必填項目。";
  if (!data.fullAddress) errors.fullAddress = "詳細地址為必填項目。";

  // 3. 聯絡電話 (餐廳電話)
  if (!data.phone || String(data.phone).trim().length === 0) {
    errors.phone = "餐廳電話為必填項目。";
    // 修正：驗證餐廳電話格式，假設為 10 位數字。
  } else if (!/^\d{10}$/.test(String(data.phone).trim())) {
    errors.phone = "餐廳電話必須是 10 位數字（區號 + 號碼）。";
  }

  // 4. 類型 (使用獨立欄位 category 和 subCategory)
  if (!data.category) {
    errors.category = "請選擇菜系類別。";
  } else {
    // 獲取當前主菜系是否有子選項
    const subOptions = SUB_CATEGORY_MAP[data.category] || [];

    // 🚨 修正核心邏輯：如果主菜系有子選項 (subOptions.length > 0)，則子菜系必填
    // 檢查 subCategory 是否為空字串或未定義 (注意：在沒有子菜系時，表單組件會將其設為 "")
    // 這裡我們只檢查：如果應該有子菜系，但用戶沒有選擇一個有效值，則報錯。
    if (
      subOptions.length > 0 &&
      (!data.subCategory || data.subCategory === "")
    ) {
      errors.subCategory = `選擇 ${data.category} 後，請選擇子菜系。`;
    }
  }

  // 餐廳類型 (現在是 Array)
  if (!data.restaurantType || data.restaurantType.length === 0) {
    errors.restaurantType = "餐廳類型為必填項目。";
  }

  // 5. 門面照片
  const hasValidPhotoInfo =
    hasPhotoUrlInFormData || hasSelectedFile || hasOriginalPhoto;
  if (!isUpdateForm && !hasValidPhotoInfo) {
    errors.facadePhotoUrls = "請上傳一張餐廳門面照片。";
  }

  // ===========================================
  // === Step 2: 營業、服務與付款 驗證邏輯 ===
  // ===========================================

  const businessHoursErrors = [];

  // 1. 營業時間 (Business Hours)
  if (data.businessHours && Array.isArray(data.businessHours)) {
    data.businessHours.forEach((bh, index) => {
      const dayErrors = {};
      if (bh.isOpen) {
        if (!bh.startTime) {
          dayErrors.startTime = "請選擇開始時間。";
        }
        if (!bh.endTime) {
          dayErrors.endTime = "請選擇結束時間。";
        }
      }
      businessHoursErrors[index] =
        Object.keys(dayErrors).length > 0 ? dayErrors : null;
    });

    const hasOpenDay = data.businessHours.some((bh) => bh.isOpen);
    if (!hasOpenDay) {
      errors.businessHours = "請至少標記一天營業時間。";
    }
  } else {
    errors.businessHours = "營業時間為必填項目。";
  }

  // 如果存在具體的時間段錯誤，則用陣列覆蓋（或新增）
  if (
    Array.isArray(businessHoursErrors) &&
    businessHoursErrors.some((err) => err !== null)
  ) {
    errors.businessHours = businessHoursErrors;
  }

  // 2. 付款方式
  if (!data.paymentMethods || data.paymentMethods.length === 0) {
    errors.paymentMethods = "請至少選擇一種付款方式。";
  }

  // ===================================
  // === Step 3: 聯絡人資訊 驗證邏輯 ===
  // ===================================

  // 1. 聯絡人姓名
  if (!data.contactName?.trim()) {
    errors.contactName = "聯絡人姓名為必填項目。";
  }

  // 2. 聯絡人電話
  if (!data.contactPhone || String(data.contactPhone).trim().length === 0) {
    errors.contactPhone = "聯絡人電話為必填項目。";
  } else if (!/^\d{10}$/.test(String(data.contactPhone).trim())) {
    errors.contactPhone = "聯絡人電話必須是 10 位數字（區號 + 號碼）。";
  }

  // 3. 聯絡人 Email (非必填，但若填寫需驗證格式)
  if (data.contactEmail && data.contactEmail.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.contactEmail.trim())) {
      errors.contactEmail = "電子郵件格式不正確。";
    }
  }

  return errors;
};
