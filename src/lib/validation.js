/**
 * 驗證餐廳表單數據。
 * @param {object} formData - 要驗證的表單數據。
 * @returns {object} 一個錯誤物件。如果沒有錯誤，該物件將為空。
 */
export const validateRestaurantForm = (formData) => {
  const errors = {};

  if (!formData.restaurantName?.["zh-TW"]) {
    errors.restaurantNameZh = "此為必填欄位。";
  }
  if (!formData.restaurantName?.en) {
    errors.restaurantNameEn = "此為必填欄位。";
  }
  if (!formData.province) {
    errors.province = "此為必填欄位。";
  }
  if (!formData.city) {
    errors.city = "此為必填欄位。";
  }
  if (!formData.fullAddress) {
    errors.fullAddress = "此為必填欄位。";
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
  const hasOpenDay = Object.values(formData.businessHours || {}).some(
    (day) => day.isOpen
  );
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

  return errors;
};
