/**
 * 驗證餐廳表單數據。
 * @param {object} formData - 要驗證的表單數據。
 * @returns {object} 一個錯誤物件。如果沒有錯誤，該物件將為空。
 */
export const validateRestaurantForm = (formData) => {
  const errors = {};

  // ⚡️ 1. 處理中文名稱驗證邏輯
  // 只有當 'noChineseName' 未被勾選時，才要求中文名稱是必填的。
  if (!formData.noChineseName && !formData.restaurantName?.["zh-TW"]) {
    // 錯誤鍵名應與 RestaurantForm 中用於顯示錯誤的鍵名一致
    // 您的 RestaurantForm 使用了 errors.restaurantName?.["zh-TW"]，但這裡使用了 errors.restaurantNameZh
    // 為了兼容性，我將使用您原始的鍵名，並在備註中提出結構優化建議。
    errors.restaurantNameZh = "此為必填欄位。";
  }

  // ⚡️ 2. 處理英文名稱驗證 (這通常是必須的)
  if (!formData.restaurantName?.en) {
    errors.restaurantNameEn = "此為必填欄位。";
  }

  // 以下為未修改的必填驗證
  if (!formData.province) {
    errors.province = "此為必填欄位。";
  }
  if (!formData.city) {
    errors.city = "此為必填欄位。";
  }
  if (!formData.fullAddress) {
    errors.fullAddress = "此為必填欄位。";
  }
  if (!formData.postalCode) {
    // 郵遞區號看起來應該也是必填的
    errors.postalCode = "此為必填欄位。";
  }
  if (!formData.phone) {
    errors.phone = "此為必填欄位。";
  }
  if (!formData.cuisineType) {
    errors.cuisineType = "此為必填欄位。";
  }
  if (!formData.restaurantType) {
    errors.restaurantType = "此為必填欄位。";
  }

  // 更新後的營業時間驗證邏輯
  // 注意：這裡假設 formData.businessHours 是 array
  const businessHoursArray = formData.businessHours || [];
  const hasOpenDay = businessHoursArray.some((day) => day.isOpen);
  if (!hasOpenDay) {
    errors.businessHours = "請至少選擇一天營業。";
  }

  if (!formData.contactName) {
    errors.contactName = "此為必填欄位。";
  }
  if (!formData.contactPhone) {
    errors.contactPhone = "此為必填欄位。";
  }

  // 對 paymentMethods 的新驗證
  if (!formData.paymentMethods || formData.paymentMethods.length === 0) {
    errors.paymentMethods = "請至少選擇一種付款方式。";
  }

  // 📝 備註：您的 RestaurantForm 期望的錯誤鍵名 (例如 errors.restaurantName?.["zh-TW"])
  // 與此處使用的鍵名 (errors.restaurantNameZh) 不一致。
  // 為確保錯誤訊息能在 UI 上正確顯示，您可能需要調整：
  // 1. 在 RestaurantForm 中將顯示邏輯改為檢查 errors.restaurantNameZh。
  // 2. 或在這裡將巢狀錯誤結構重新引入 (建議)：
  /*
  if (!formData.noChineseName && !formData.restaurantName?.["zh-TW"]) {
      errors.restaurantName = { 
          ...errors.restaurantName, 
          "zh-TW": "此為必填欄位。" 
      };
  }
  */

  return errors;
};
