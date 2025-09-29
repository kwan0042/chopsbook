// src/lib/validation.js

/**
 * 整合所有欄位 (Step 1, 2, 3) 的驗證函式，執行一次性全面驗證。
 *
 * @param {object} data - 餐廳表單資料 (包含所有步驟的欄位)
 * @param {boolean} [isUpdateForm=false] - 是否為更新表單 (用於照片驗證)。
 * @param {string[]} [originalFacadePhotoUrls=[]] - 原始圖片 URL (用於照片驗證)。
 * @returns {object} 彙總的錯誤物件，key 為欄位名稱，value 為錯誤訊息或錯誤陣列。
 */
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
  } else if (!/^\d{10}$/.test(String(data.contactPhone).trim())) {
    errors.contactPhone = "聯絡人電話必須是 10 位數字（區號 + 號碼）。";
  }

  // 4. 類型
  if (!data.cuisineType?.category) {
    errors.cuisineCategory = "請選擇菜系。";
  }

  if (!data.cuisineType?.subType) {
    errors.cuisineSubType = "請選擇菜類別。";
  }
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
