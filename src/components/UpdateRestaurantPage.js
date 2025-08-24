// src/components/UpdateRestaurantPage.js
"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../lib/auth-context"; // 確保路徑正確
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  addDoc,
} from "firebase/firestore"; // 將 updateDoc 替換為 addDoc
import Modal from "./Modal"; // 確保路徑正確
import LoadingSpinner from "./LoadingSpinner"; // 確保路徑正確

const UpdateRestaurantPage = ({ onBackToHome }) => {
  const { db, currentUser, appId } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [allRestaurants, setAllRestaurants] = useState([]); // 儲存所有餐廳以進行客戶端篩選
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [selectedRestaurantData, setSelectedRestaurantData] = useState(null); // 儲存原始餐廳資料
  const [formData, setFormData] = useState({}); // 儲存表單中的修改內容
  const [loading, setLoading] = useState(true); // 初始載入狀態為 true，因為需要獲取所有餐廳
  const [modalMessage, setModalMessage] = useState("");

  // Dropdown 選項 (與 AddRestaurantPage 保持一致)
  const cuisineOptions = [
    "選擇菜系",
    "加拿大菜",
    "海鮮",
    "法國菜",
    "亞洲菜",
    "意大利菜",
    "美式菜",
    "中餐",
    "日式料理",
    "其他",
  ];
  const restaurantTypeOptions = [
    "選擇餐廳類型",
    "Fine Dining (高級餐飲)",
    "Casual Dining (休閒餐飲)",
    "Cafe (咖啡廳)",
    "Bar (酒吧)",
    "Fast Food (速食)",
    "Food Court (美食廣場)",
    "Dessert Shop (甜品店)",
    "其他",
  ];
  const seatingCapacityOptions = [
    "選擇座位數",
    "1-20",
    "21-50",
    "51-100",
    "101-200",
    "200+",
  ];
  const reservationModeOptions = ["官方網站", "電話預約", "Walk-in", "其他"];
  const paymentMethodOptions = [
    "現金",
    "信用卡",
    "借記卡",
    "微信支付",
    "支付寶",
    "Apple Pay",
    "Google Pay",
    "其他",
  ];
  const facilitiesServiceOptions = [
    "室外座位",
    "電視播放",
    "酒精飲品",
    "Wi-Fi服務",
    "切餅費",
    "可自帶酒水",
    "外賣速遞",
    "停車場",
    "無障礙設施",
    "兒童友善",
  ];
  const provinceOptions = [
    "選擇省份",
    "安大略省",
    "魁北克省",
    "卑詩省",
    "亞伯達省",
    "曼尼托巴省",
    "薩斯喀徹溫省",
    "新斯科細亞省",
    "新不倫瑞克省",
    "紐芬蘭與拉布拉多省",
    "愛德華王子島省",
    "西北地區",
    "育空地區",
    "努納武特地區",
  ];

  // 輔助函數：將 Date 物件格式化為 "YYYY-MM-DD HH:MM:SS" 字串
  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 在組件首次載入時獲取所有餐廳，以用於搜尋建議
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const fetchAllRestaurants = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, `artifacts/${appId}/public/data/restaurants`)
        );
        const querySnapshot = await getDocs(q);
        const fetchedRestaurants = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setAllRestaurants(fetchedRestaurants);
        setLoading(false);
      } catch (error) {
        console.error("獲取餐廳列表失敗:", error);
        setModalMessage(`獲取餐廳列表失敗: ${error.message}`);
        setLoading(false);
      }
    };
    fetchAllRestaurants();
  }, [db, appId]);

  // 根據搜尋框輸入過濾建議列表
  useEffect(() => {
    if (searchQuery) {
      const filtered = allRestaurants.filter(
        (r) =>
          r.restaurantNameZh
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          r.restaurantNameEn?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [searchQuery, allRestaurants]);

  // 處理從建議列表中選擇餐廳
  const handleSelectRestaurant = async (restaurantId) => {
    setSelectedRestaurantId(restaurantId);
    setSearchQuery(""); // 清空搜尋欄位
    setFilteredSuggestions([]); // 清空建議列表
    setLoading(true);
    try {
      const docRef = doc(
        db,
        `artifacts/${appId}/public/data/restaurants`,
        restaurantId
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSelectedRestaurantData(data); // 儲存原始資料
        setFormData(data); // 使用現有資料預填表單
      } else {
        setModalMessage("找不到選擇的餐廳資料。");
        setSelectedRestaurantId(null);
        setSelectedRestaurantData(null);
        setFormData({});
      }
    } catch (error) {
      console.error("獲取選擇餐廳資料失敗:", error);
      setModalMessage(`獲取餐廳資料失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 處理表單欄位變更
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 處理多選框變更
  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => {
      const currentArray = prev[name] || []; // 確保是陣列
      if (checked) {
        return { ...prev, [name]: [...currentArray, value] };
      } else {
        return {
          ...prev,
          [name]: currentArray.filter((item) => item !== value),
        };
      }
    });
  };

  // 處理表單提交 (現在是提交更新申請)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db || !currentUser || !selectedRestaurantId) {
      setModalMessage("請先登入並選擇餐廳才能提交更新申請。");
      return;
    }

    // 簡單的必填欄位驗證
    if (
      !formData.restaurantNameZh ||
      !formData.contactName ||
      !formData.contactPhone
    ) {
      setModalMessage(
        "請填寫所有標記為必填的欄位 (餐廳名稱, 聯絡姓名, 聯絡電話)。"
      );
      return;
    }

    setLoading(true);
    try {
      const updateApplicationsRef = collection(
        db,
        `artifacts/${appId}/public/data/restaurant_update_applications`
      );

      const now = new Date();
      const formattedSubmittedAt = formatDateTime(now);
      const submittedBy = currentUser.uid;

      await addDoc(updateApplicationsRef, {
        restaurantId: selectedRestaurantId, // 記錄要更新的餐廳 ID
        originalData: selectedRestaurantData, // 儲存原始資料以供比對 (可選)
        updatedData: formData, // 儲存更新後的資料 (來自表單)
        submittedAt: formattedSubmittedAt,
        submittedBy: submittedBy,
        status: "pending", // 初始狀態為待審核
      });
      setModalMessage("餐廳更新申請已成功提交，等待管理員審核！");
      // 重置狀態以清空表單
      setSelectedRestaurantId(null);
      setSelectedRestaurantData(null);
      setFormData({});
      setSearchQuery("");
      setFilteredSuggestions([]);
    } catch (error) {
      console.error("提交餐廳更新申請失敗:", error);
      setModalMessage(`提交失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 關閉 Modal 並在成功後返回主頁
  const closeModal = () => {
    setModalMessage("");
    if (modalMessage.includes("成功")) {
      onBackToHome(); // 申請提交成功後返回商戶專區
    }
  };

  if (loading && !selectedRestaurantId && allRestaurants.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl relative">
        <button
          onClick={onBackToHome}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
          aria-label="返回商戶專區"
        >
          &times;
        </button>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          提交餐廳更新申請
        </h2>
        <p className="text-gray-600 text-center mb-8">
          搜尋並選擇您要更新的餐廳，然後填寫您要修改的資訊。更新將需要管理員審核。
        </p>

        {loading && <LoadingSpinner />}

        {/* 搜尋餐廳區塊 */}
        <div className="mb-8 relative">
          <label
            htmlFor="searchRestaurant"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            搜尋餐廳名稱
          </label>
          <input
            type="text"
            id="searchRestaurant"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="輸入餐廳名稱 (中文或英文)"
          />
          {searchQuery && filteredSuggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredSuggestions.map((restaurant) => (
                <li
                  key={restaurant.id}
                  onClick={() => handleSelectRestaurant(restaurant.id)}
                  className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  {restaurant.restaurantNameZh} ({restaurant.restaurantNameEn})
                </li>
              ))}
            </ul>
          )}
          {searchQuery && filteredSuggestions.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">沒有找到匹配的餐廳。</p>
          )}
        </div>

        {selectedRestaurantId && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-lg font-semibold text-gray-800 mb-4">
              您正在為以下餐廳提交更新申請：
              <br />
              **{selectedRestaurantData?.restaurantNameZh}** (
              {selectedRestaurantData?.restaurantNameEn})
            </p>
            {/* 表單欄位 (與 AddRestaurantPage 相同) */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                餐廳詳細資料
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="restaurantNameZh"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    餐廳名稱 (中文) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="restaurantNameZh"
                    name="restaurantNameZh"
                    value={formData.restaurantNameZh || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：楓葉小館"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="restaurantNameEn"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    餐廳名稱 (英文)
                  </label>
                  <input
                    type="text"
                    id="restaurantNameEn"
                    name="restaurantNameEn"
                    value={formData.restaurantNameEn || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：Maple Leaf Bistro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="province"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    省份
                  </label>
                  <select
                    id="province"
                    name="province"
                    value={formData.province || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {provinceOptions.map((option) => (
                      <option
                        key={option}
                        value={option === "選擇省份" ? "" : option}
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="city"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    城市
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：多倫多"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="fullAddress"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  完整地址
                </label>
                <textarea
                  id="fullAddress"
                  name="fullAddress"
                  value={formData.fullAddress || ""}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="請輸入餐廳完整地址，包含街號、門牌號、郵遞區號"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    電話
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：416-123-4567"
                  />
                </div>
                <div>
                  <label
                    htmlFor="website"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    網站
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：https://www.example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="cuisineType"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    菜系
                  </label>
                  <select
                    id="cuisineType"
                    name="cuisineType"
                    value={formData.cuisineType || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {cuisineOptions.map((option) => (
                      <option
                        key={option}
                        value={option === "選擇菜系" ? "" : option}
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="restaurantType"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    餐廳類型
                  </label>
                  <select
                    id="restaurantType"
                    name="restaurantType"
                    value={formData.restaurantType || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {restaurantTypeOptions.map((option) => (
                      <option
                        key={option}
                        value={option === "選擇餐廳類型" ? "" : option}
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="avgSpending"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    人均消費 ($)
                  </label>
                  <input
                    type="number"
                    id="avgSpending"
                    name="avgSpending"
                    value={formData.avgSpending || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：30 (僅數字)"
                    min="0"
                  />
                </div>
                <div>
                  <label
                    htmlFor="facadePhotoUrl"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    門面相片 (URL)
                  </label>
                  <input
                    type="url"
                    id="facadePhotoUrl"
                    name="facadePhotoUrl"
                    value={formData.facadePhotoUrl || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：https://image.com/restaurant.jpg"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="seatingCapacity"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  座位數
                </label>
                <select
                  id="seatingCapacity"
                  name="seatingCapacity"
                  value={formData.seatingCapacity || ""}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {seatingCapacityOptions.map((option) => (
                    <option
                      key={option}
                      value={option === "選擇座位數" ? "" : option}
                    >
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="businessHours"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  營業時間
                </label>
                <textarea
                  id="businessHours"
                  name="businessHours"
                  value={formData.businessHours || ""}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：週一至週五 11:00-22:00, 週六日 10:00-23:00"
                ></textarea>
              </div>

              <div className="mt-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  訂座模式
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {reservationModeOptions.map((option) => (
                    <label
                      key={option}
                      className="flex items-center text-gray-700"
                    >
                      <input
                        type="checkbox"
                        name="reservationModes"
                        value={option}
                        checked={
                          formData.reservationModes?.includes(option) || false
                        }
                        onChange={handleCheckboxChange}
                        className="form-checkbox h-5 w-5 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  接受付款方式
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {paymentMethodOptions.map((option) => (
                    <label
                      key={option}
                      className="flex items-center text-gray-700"
                    >
                      <input
                        type="checkbox"
                        name="paymentMethods"
                        value={option}
                        checked={
                          formData.paymentMethods?.includes(option) || false
                        }
                        onChange={handleCheckboxChange}
                        className="form-checkbox h-5 w-5 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  設施/服務
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {facilitiesServiceOptions.map((option) => (
                    <label
                      key={option}
                      className="flex items-center text-gray-700"
                    >
                      <input
                        type="checkbox"
                        name="facilitiesServices"
                        value={option}
                        checked={
                          formData.facilitiesServices?.includes(option) || false
                        }
                        onChange={handleCheckboxChange}
                        className="form-checkbox h-5 w-5 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="otherInfo"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  其他資料
                </label>
                <textarea
                  id="otherInfo"
                  name="otherInfo"
                  value={formData.otherInfo || ""}
                  onChange={handleChange}
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="關於餐廳的任何其他重要資訊，例如特殊飲食需求、榮譽等。"
                ></textarea>
              </div>
            </div>

            {/* 聯絡人資訊 */}
            <div className="pt-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                聯絡人資訊
              </h3>
              <div className="mb-4">
                <label className="flex items-center text-gray-700 text-sm font-bold">
                  <input
                    type="checkbox"
                    name="isManager"
                    checked={formData.isManager || false}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                  />
                  <span className="ml-2">您是餐廳的負責人嗎？</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contactName"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    value={formData.contactName || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="您的姓名"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="contactPhone"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    電話 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="您的聯絡電話"
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="contactEmail"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  電郵
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail || ""}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="您的電郵地址"
                />
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "提交中..." : "提交餐廳更新申請"}
              </button>
            </div>
          </form>
        )}
      </div>
      <Modal message={modalMessage} onClose={closeModal} />
    </div>
  );
};

export default UpdateRestaurantPage;
