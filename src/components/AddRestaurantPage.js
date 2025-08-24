// src/components/AddRestaurantPage.js
"use client";

import React, { useState, useContext } from "react";
import { AuthContext } from "../lib/auth-context"; // 從 components 上溯一層到 src, 再下溯到 lib
import { collection, addDoc } from "firebase/firestore";
import Modal from "./Modal"; // 與 AddRestaurantPage 在同一 components 目錄下
import LoadingSpinner from "./LoadingSpinner"; // 與 AddRestaurantPage 在同一 components 目錄下

const AddRestaurantPage = ({ onBackToHome }) => {
  const { db, currentUser, appId } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    restaurantNameZh: "",
    restaurantNameEn: "",
    city: "",
    province: "",
    fullAddress: "",
    phone: "",
    website: "",
    cuisineType: "",
    restaurantType: "",
    avgSpending: "",
    facadePhotoUrl: "",
    seatingCapacity: "",
    businessHours: "",
    reservationModes: [],
    paymentMethods: [],
    facilitiesServices: [],
    otherInfo: "",
    isManager: false,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });

  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Dropdown 選項
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => {
      const currentArray = prev[name];
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db || !currentUser) {
      setModalMessage("請先登入才能提交資料。");
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
      // 提交到 Firestore 的 'restaurant_applications' 集合
      const applicationsRef = collection(
        db,
        `artifacts/${appId}/public/data/restaurant_applications`
      );
      await addDoc(applicationsRef, {
        ...formData,
        submittedAt: new Date(),
        submittedBy: currentUser.uid,
      });
      setModalMessage("餐廳資訊已成功提交，感謝您的申請！");
      // 重置表單
      setFormData({
        restaurantNameZh: "",
        restaurantNameEn: "",
        city: "",
        province: "",
        fullAddress: "",
        phone: "",
        website: "",
        cuisineType: "",
        restaurantType: "",
        avgSpending: "",
        facadePhotoUrls: [],
        seatingCapacity: "",
        businessHours: "",
        reservationModes: [],
        paymentMethods: [],
        facilitiesServices: [],
        otherInfo: "",
        isManager: false,
        contactName: "",
        contactPhone: "",
        contactEmail: "",
      });
    } catch (error) {
      console.error("提交餐廳資訊失敗:", error);
      setModalMessage(`提交失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalMessage("");
    if (modalMessage.includes("成功")) {
      onBackToHome(); // 提交成功後返回主頁
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl relative">
        <button
          onClick={onBackToHome}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
          aria-label="返回首頁"
        >
          &times;
        </button>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          新增餐廳資訊
        </h2>
        <p className="text-gray-600 text-center mb-8">
          請填寫以下表格，幫助我們更好地了解您的餐廳。
        </p>

        {loading && <LoadingSpinner />}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Restaurant Details */}
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
                  value={formData.restaurantNameZh}
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
                  value={formData.restaurantNameEn}
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
                  value={formData.province}
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
                  value={formData.city}
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
                value={formData.fullAddress}
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
                  value={formData.phone}
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
                  value={formData.website}
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
                  value={formData.cuisineType}
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
                  value={formData.restaurantType}
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
                  value={formData.avgSpending}
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
                  value={formData.facadePhotoUrl}
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
                value={formData.seatingCapacity}
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
                value={formData.businessHours}
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
                      checked={formData.reservationModes.includes(option)}
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
                      checked={formData.paymentMethods.includes(option)}
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
                      checked={formData.facilitiesServices.includes(option)}
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
                value={formData.otherInfo}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="關於餐廳的任何其他重要資訊，例如特殊飲食需求、榮譽等。"
              ></textarea>
            </div>
          </div>

          {/* Section 2: Contact Person Information */}
          <div className="pt-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              聯絡人資訊
            </h3>
            <div className="mb-4">
              <label className="flex items-center text-gray-700 text-sm font-bold">
                <input
                  type="checkbox"
                  name="isManager"
                  checked={formData.isManager}
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
                  value={formData.contactName}
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
                  value={formData.contactPhone}
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
                value={formData.contactEmail}
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
              {loading ? "提交中..." : "提交餐廳資訊"}
            </button>
          </div>
        </form>
      </div>
      <Modal message={modalMessage} onClose={closeModal} />
    </div>
  );
};

export default AddRestaurantPage;
