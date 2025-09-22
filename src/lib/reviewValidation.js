// src/lib/reviewValidation.js

/**
 * 驗證食評表單資料。
 * @param {object} formData - 包含表單欄位值的物件。
 * @param {object} formData.selectedRestaurant - 選擇的餐廳物件。
 * @param {string} formData.reviewTitle - 評論標題。
 * @param {number} formData.overallRating - 總體評分。
 * @param {string} formData.timeOfDay - 用餐時間。
 * @param {string} formData.serviceType - 服務類型。
 * @param {string} formData.costPerPerson - 每人平均消費金額。
 * @returns {object|null} 如果有錯誤，返回一個包含錯誤訊息的物件；如果沒有錯誤，返回 null。
 */
export const validateReviewForm = (formData) => {
  const {
    reviewTitle,
    overallRating,
    timeOfDay,
    serviceType,
    selectedRestaurant,
    costPerPerson,
    // 移除 reviewContent 的檢查
  } = formData;
  const errors = {};

  if (!selectedRestaurant) {
    errors.selectedRestaurant = "請選擇要評價的餐廳。";
  }

  if (!reviewTitle.trim()) {
    errors.reviewTitle = "評論標題不能為空。";
  }

  if (overallRating === 0) {
    errors.overallRating = "請給出一個總體評級。";
  }

  if (!timeOfDay) {
    errors.timeOfDay = "請選擇用餐時間。";
  }

  if (!serviceType) {
    errors.serviceType = "請選擇服務類型。";
  }

  if (!costPerPerson || costPerPerson <= 0) {
    errors.costPerPerson = "請輸入每人平均消費金額。";
  }

  // 如果 errors 物件是空的，表示沒有錯誤
  return Object.keys(errors).length > 0 ? errors : null;
};
