/**
 * 將 Firestore 餐廳欄位鍵映射到可讀的中文和英文名稱。
 */
export const restaurantFields = {
  avgSpending: { zh: "平均消費", en: "Avg. Spending" },
  businessHours: { zh: "營業時間", en: "Business Hours" },
  city: { zh: "城市", en: "City" },
  contactName: { zh: "聯絡人姓名", en: "Contact Name" },
  contactPhone: { zh: "聯絡人電話", en: "Contact Phone" },
  cuisineType: { zh: "菜系類型", en: "Cuisine Type" },
  facadePhotoUrls: { zh: "門面照片URL", en: "Facade Photos" },
  fullAddress: { zh: "完整地址", en: "Full Address" },
  isManager: { zh: "是否為經理", en: "Is Manager" },
  isPermanentlyClosed: { zh: "永久歇業", en: "Permanently Closed" },
  isTemporarilyClosed: { zh: "暫時歇業", en: "Temporarily Closed" },
  otherInfo: { zh: "其他資訊", en: "Other Info" },
  paymentMethods: { zh: "支付方式", en: "Payment Methods" },
  phone: { zh: "餐廳電話", en: "Restaurant Phone" },
  province: { zh: "省份", en: "Province" },
  rating: { zh: "總體評分", en: "Overall Rating" },
  reservationModes: { zh: "預約方式", en: "Reservation Modes" },
  restaurantNameEn: { zh: "餐廳英文名稱", en: "Restaurant Name (En)" },
  restaurantNameZh: { zh: "餐廳中文名稱", en: "Restaurant Name (Zh)" },
  restaurantType: { zh: "餐廳類型", en: "Restaurant Type" },
  reviewCount: { zh: "評論數", en: "Review Count" },
  seatingCapacity: { zh: "座位容量", en: "Seating Capacity" },
  updatedAt: { zh: "更新時間", en: "Updated At" },
  updatedBy: { zh: "更新者", en: "Updated By" },
  website: { zh: "網站", en: "Website" },
  submittedBy: { zh: "建立會員", en: "created User" },
  createdAt: { zh: "建立時間", en: "Create at" },
  facilitiesServices: { zh: "設施/服務", en: "Facilities & Services" },
  contactEmail: { zh: "餐廳電郵", en: "contactEmail" },
  facadePhotoUrl: { zh: "餐廳門面圖片", en: "Facade Photol" },
};

/**
 * 將 Firestore 評論欄位鍵映射到可讀的中文和英文名稱。
 */
export const reviewFields = {
  costPerPerson: { zh: "人均消費", en: "Cost Per Person" },
  createdAt: { zh: "評論時間", en: "Created At" },
  detailedRatings: {
    zh: "詳細評分",
    en: "Detailed Ratings",
    nestedFields: {
      cp: { zh: "CP值", en: "Value" },
      drinks: { zh: "飲品/酒", en: "Drinks" },
      environment: { zh: "環境", en: "Environment" },
      hygiene: { zh: "衛生", en: "Hygiene" },
      service: { zh: "服務", en: "Service" },
      taste: { zh: "口味", en: "Taste" },
    },
  },
  overallRating: { zh: "總體評分", en: "Overall Rating" },
  restaurantId: { zh: "餐廳ID", en: "Restaurant ID" },
  reviewContent: { zh: "評論內容", en: "Review Content" },
  reviewTitle: { zh: "評論標題", en: "Review Title" },

  serviceType: {
    zh: "用餐類型",
    en: "Service Type",
    typeFields: {
      delivery: { zh: "外賣", en: "delivery" },
      dineIn: { zh: "堂食", en: "dine-in" },
      pickUp: { zh: "自取", en: "pickup" },
    },
  },
  status: { zh: "狀態", en: "Status" },
  timeOfDay: {
    zh: "用餐時段",
    en: "Time of Day",
    typeFields: {
      morning: { zh: "早上", en: "Morning" },
      noon: { zh: "中午", en: "Noon" },
      afternoon: { zh: "下午", en: "Afternoon" },
      night: { zh: "晚上", en: "Night" },
    },
  },
  uploadedImages: { zh: "評論圖片", en: "Uploaded Images" },
  userId: { zh: "用戶ID", en: "User ID" },
  username: { zh: "用戶名稱", en: "Username" },
};

/**
 * 根據提供的單一值，格式化數據以供顯示。
 * 此函式專為格式化個別欄位值而設計。
 * @param {*} value - 原始單一值。
 * @returns {string} - 格式化後的文字。
 */
export const formatDataForDisplay = (value) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return "無";
    return value.join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }
  if (value === null || value === undefined || value === "") {
    return "無";
  }
  if (typeof value === "object" && value.toDate) {
    // 處理 Firebase Timestamp 物件
    return value.toDate().toLocaleString();
  }
  if (typeof value === "object") {
    // 處理一般物件
    return JSON.stringify(value, null, 2);
  }
  return value.toString();
};
