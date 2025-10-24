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

  const hasValidPhotoInfo = isUpdateForm
    ? hasOriginalPhoto || hasSelectedFile || hasPhotoUrlInFormData
    : hasSelectedFile || hasPhotoUrlInFormData;

  // 1. 餐廳名稱 (所有模式下必填)
  if (!data.restaurantName?.en?.trim()) {
    errors.restaurantName = { en: "英文名稱為必填項目。" };
  }
  if (!data.noChineseName && !data.restaurantName?.["zh-TW"]?.trim()) {
    errors.restaurantName = {
      ...errors.restaurantName,
      "zh-TW": "中文名稱為必填項目，或勾選「沒有中文名稱」。",
    };
  }

  // 2. 地址 (🚨 僅在 Create 模式下必填)

  if (!data.province) errors.province = "省份為必填項目。";
  if (!data.city) errors.city = "城市為必填項目。";
  if (!data.postalCode) errors.postalCode = "郵政編碼為必填項目。";
  if (!data.fullAddress) errors.fullAddress = "詳細地址為必填項目。";

  // 3. 聯絡電話 (餐廳電話) (🚨 僅在 Create 模式下必填)
  // 如果是更新模式且該欄位沒有填寫，則跳過驗證。
  const shouldValidateRestaurantPhone =
    !isUpdateForm || (data.phone && String(data.phone).trim().length > 0);

  const rawPhone = String(data.phone || "").trim();

  // 1. **新增檢查步驟：檢查是否存在非法字符 (例如字母)**
  // 這個正則表達式允許數字、空格、括號、橫線、點和加號。如果存在其他字符（例如 q），則報錯。
  const ILLEGAL_PHONE_CHARS_REGEX = /[^0-9\s()\-+.+]/;

  if (!isUpdateForm) {
    // 新增模式 (Admin) - 電話為必填
    if (!rawPhone) {
      errors.phone = "餐廳電話為必填項目。";
    } else {
      // 🚨 關鍵修改 1：檢查是否存在非法字符
      if (ILLEGAL_PHONE_CHARS_REGEX.test(rawPhone)) {
        errors.phone =
          "餐廳電話包含無效字符（只能包含數字、空格、括號、橫線或點）。";
        return errors; // 驗證失敗，直接返回
      }

      // 2. 清理：移除所有格式化字符，只保留數字
      const cleanPhone = rawPhone.replace(/\D/g, "");

      // 檢查格式：10 位本地號碼，或 11 位且以 '1' 開頭 (+1 國碼)
      if (
        cleanPhone.length !== 10 &&
        !(cleanPhone.length === 11 && cleanPhone.startsWith("1"))
      ) {
        errors.phone =
          "餐廳電話格式不正確。請輸入 10 位數字，或標準的 +1 國碼格式。";
      }
    }
  } else {
    // 編輯模式 (Admin) - 如果有填寫，則檢查格式
    if (rawPhone) {
      // 🚨 關鍵修改 2：檢查是否存在非法字符
      if (ILLEGAL_PHONE_CHARS_REGEX.test(rawPhone)) {
        errors.phone =
          "餐廳電話包含無效字符（只能包含數字、空格、括號、橫線或點）。";
        return errors; // 驗證失敗，直接返回
      }

      // 2. 清理：移除所有格式化字符，只保留數字
      const cleanPhone = rawPhone.replace(/\D/g, "");

      // 檢查格式
      if (
        cleanPhone.length !== 10 &&
        !(cleanPhone.length === 11 && cleanPhone.startsWith("1"))
      ) {
        errors.phone =
          "餐廳電話格式不正確。請輸入 10 位數字，或標準的 +1 國碼格式。";
      }
    }
  }

  // 4. 菜系類別 (category) (🚨 僅在 Create 模式下必填)
  if (!isUpdateForm || data.category) {
    if (!data.category) {
      errors.category = "請選擇菜系類別。";
    } else {
      // 獲取當前主菜系是否有子選項
      const subOptions = SUB_CATEGORY_MAP[data.category] || [];

      // 🚨 修正核心邏輯：如果主菜系有子選項 (subOptions.length > 0)，
      // 且在 Create 模式下或 Update 模式下 Category 已選，則子菜系必填
      // 檢查 subCategory 是否為空字串或未定義 (注意：在沒有子菜系時，表單組件會將其設為 "")
      if (
        subOptions.length > 0 &&
        (!data.subCategory || data.subCategory === "")
      ) {
        errors.subCategory = `選擇 ${data.category} 後，請選擇子菜系。`;
      }
    }
  }

  // 餐廳類型 (restaurantType) (現在是 Array) (🚨 僅在 Create 模式下必填)
  if (
    !isUpdateForm &&
    (!data.restaurantType || data.restaurantType.length === 0)
  ) {
    errors.restaurantType = "餐廳類型為必填項目。";
  }

  // 5. 門面照片 (facadePhotoUrls) (🚨 僅在 Create 模式下必填)
  // 圖片在 Update 模式下是完全可選的。
  // 只有在 Create 模式下，我們才需要確保有圖片（舊圖或新選中的圖）。
  // if (!isUpdateForm && !hasValidPhotoInfo) {
  //   errors.facadePhotoUrls = "請上傳一張餐廳門面照片。";
  // }

  // ===========================================
  // === Step 2: 營業、服務與付款 驗證邏輯 ===
  // ===========================================

  const businessHoursErrors = [];

  // 1. 營業時間 (Business Hours) (🚨 僅在 Create 模式下必填)
  if (!isUpdateForm) {
    if (!data.businessHours || !Array.isArray(data.businessHours)) {
      errors.businessHours = "營業時間為必填項目。";
    } else {
      const hasOpenDay = data.businessHours.some((bh) => bh.isOpen);
      if (!hasOpenDay) {
        errors.businessHours = "請至少標記一天營業時間。";
      }

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

      // 如果存在具體的時間段錯誤，則用陣列覆蓋（或新增）
      if (
        Array.isArray(businessHoursErrors) &&
        businessHoursErrors.some((err) => err !== null)
      ) {
        errors.businessHours = businessHoursErrors;
      }
    }
  }

  // 2. 付款方式 (🚨 僅在 Create 模式下必填)
  if (
    !isUpdateForm &&
    (!data.paymentMethods || data.paymentMethods.length === 0)
  ) {
    errors.paymentMethods = "請至少選擇一種付款方式。";
  }

  // 3. 餐廳負責人姓名 (managerName) - 如果 isManager 勾選，則必填
  if (data.isManager && !data.managerName?.trim()) {
    errors.managerName = "餐廳負責人姓名為必填項目。";
  }

  // 4. 聯絡人 Email (非必填，但若填寫需驗證格式)
  if (data.isManager) {
    if (!data.contactEmail) {
      errors.contactEmail = "請輸入公司電郵";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      errors.contactEmail = "電郵格式不正確";
    }
  }

  return errors;
};
