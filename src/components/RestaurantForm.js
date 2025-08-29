"use client";

import React, { useContext, useState, useRef, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { AuthContext } from "../lib/auth-context";
import {
  cuisineOptions,
  restaurantTypeOptions,
  seatingCapacityOptions,
  reservationModeOptions,
  paymentMethodOptions,
  facilitiesServiceOptions,
  provinceOptions,
} from "../data/restaurant-options";

const RestaurantForm = ({
  formData,
  handleChange,
  handleCheckboxChange,
  handleSubmit,
  isUpdateForm = false,
  selectedRestaurantData,
}) => {
  const { storage, setModalMessage, appId } = useContext(AuthContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const fileInputRef = useRef(null);

  // 這個 useEffect 確保當 formData.facadePhotoUrls[0] 外部改變時（例如在更新模式下加載數據），selectedFile 被清除。
  // 同時，當用戶選擇新檔案後，selectedFile 會存在，此時不應該清除
  useEffect(() => {
    // 如果 formData 已經有圖片 URL 並且用戶尚未選擇新檔案
    if (formData.facadePhotoUrls?.[0] && !selectedFile) {
      // 在編輯模式下，如果數據已包含 URL，用戶未選擇新圖片，確保檔案輸入框是空的
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [formData.facadePhotoUrls?.[0], selectedFile]); // 監聽陣列的第一個元素，同時也監聽 selectedFile

  // 點擊「瀏覽」按鈕時觸發隱藏的文件輸入
  const openFilePicker = () => {
    if (!isUploading && !isSubmittingForm) {
      fileInputRef.current?.click();
    }
  };

  // 當用戶選擇檔案時儲存檔案到狀態
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setModalMessage(`已選擇檔案: ${file.name}`, "info");
      // 用戶選擇新檔案後，清除 formData 中的現有圖片 URL，等待上傳成功後再填充
      handleChange({ target: { name: "facadePhotoUrl", value: "" } }); // 將 facadePhotoUrl 設為空字串，通過 handleChange 觸發父組件更新 formData.facadePhotoUrls 為空陣列
    } else {
      setSelectedFile(null);
      setModalMessage("未選擇任何檔案", "info");
      // 如果取消選擇，也清除 formData 中的圖片 URL
      handleChange({ target: { name: "facadePhotoUrl", value: "" } });
    }
  };

  // 表單的實際提交處理函數，負責上傳圖片（如果選中）並調用父組件的 handleSubmit
  const localHandleSubmit = async (event) => {
    event.preventDefault(); // 阻止表單的默認提交行為

    setIsSubmittingForm(true); // 開始整體表單提交流程
    let finalPhotoUrl = formData.facadePhotoUrls?.[0] || ""; // 初始化最終的圖片 URL，可能來自現有數據

    try {
      if (selectedFile) {
        // 如果有選擇新檔案，則先上傳
        if (!storage || !appId) {
          setModalMessage("Firebase Storage 未初始化，無法上傳圖片。", "error");
          setIsSubmittingForm(false);
          return;
        }

        setIsUploading(true); // 設置圖片上傳狀態
        setModalMessage("正在上傳圖片...", "info"); // 顯示上傳進度訊息

        // 為圖片創建一個唯一的檔案路徑
        // 使用 selectedRestaurantData?.id 來確保在更新時使用已有的 ID
        const restaurantId =
          selectedRestaurantData?.id || `new-restaurant-${Date.now()}`;

        const imageRef = ref(
          storage,
          `public/restaurants/${restaurantId}/facade/${Date.now()}`
        );

        // 上傳檔案
        const snapshot = await uploadBytes(imageRef, selectedFile);
        finalPhotoUrl = await getDownloadURL(snapshot.ref); // 獲取圖片的下載 URL

        // 清除選中的檔案狀態，但不在此處顯示「圖片上傳成功！」的 Modal
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // 清空文件輸入框
        }
        // 移除此處的 setModalMessage("圖片上傳成功！", "success");
      } else {
        // 如果沒有選擇新檔案，則 finalPhotoUrl 保持現有值
        setModalMessage("正在提交表單...", "info"); // 顯示表單提交進度訊息
      }

      // 創建包含潛在更新的 facadePhotoUrls 的最終表單數據對象
      const updatedFormData = {
        ...formData,
        // 確保 facadePhotoUrls 始終是陣列
        facadePhotoUrls: finalPhotoUrl ? [finalPhotoUrl] : [],
      };

      // 調用父組件傳入的 handleSubmit 函數，並將事件和最終數據傳遞過去
      await handleSubmit(event, updatedFormData);
    } catch (error) {
      console.error("表單提交失敗:", error);
      setModalMessage(`表單提交失敗: ${error.message}`, "error");
    } finally {
      setIsUploading(false); // 結束圖片上傳狀態
      setIsSubmittingForm(false); // 結束整體表單提交狀態
    }
  };

  return (
    <form onSubmit={localHandleSubmit} className="space-y-6">
      {isUpdateForm && selectedRestaurantData && (
        <p className="text-lg font-semibold text-gray-800 mb-4">
          您正在為以下餐廳提交更新申請：
          <br />
          **{selectedRestaurantData?.restaurantNameZh}** (
          {selectedRestaurantData?.restaurantNameEn})
        </p>
      )}

      {/* 餐廳詳細資料 */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">餐廳詳細資料</h3>
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

          {/* 門面相片顯示與瀏覽按鈕 */}
          <div className="mt-4">
            <label
              htmlFor="facadePhotoUrlDisplay" // 更改為描述性 ID
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              門面相片 URL
            </label>
            <div className="flex items-center space-x-2">
              <input // 這是一個只讀的 input，用於顯示 URL
                type="text"
                id="facadePhotoUrlDisplay" // 保持 ID 為 facadePhotoUrlDisplay
                name="facadePhotoUrl" // 這裡使用 name "facadePhotoUrl" 來觸發 handleChange 邏輯
                value={formData.facadePhotoUrls?.[0] || ""} // 存取陣列的第一個元素
                readOnly // 關鍵：設為只讀
                className="flex-grow p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600 focus:outline-none"
                placeholder="圖片將在此處顯示其上傳後的 URL"
              />
              <button
                type="button"
                onClick={openFilePicker}
                className="p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading || isSubmittingForm}
              >
                瀏覽
              </button>
            </div>
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-2">
                已選擇檔案:{" "}
                <span className="font-semibold">{selectedFile.name}</span>
              </p>
            )}
            {/* 隱藏的檔案輸入框 */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
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
              <label key={option} className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  name="reservationModes"
                  value={option}
                  checked={formData.reservationModes?.includes(option) || false}
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
              <label key={option} className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  name="paymentMethods"
                  value={option}
                  checked={formData.paymentMethods?.includes(option) || false}
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
              <label key={option} className="flex items-center text-gray-700">
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
        <h3 className="text-2xl font-bold text-gray-800 mb-4">聯絡人資訊</h3>
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
          disabled={isSubmittingForm}
        >
          {isSubmittingForm ? "提交中..." : "提交餐廳更新申請"}
        </button>
      </div>
    </form>
  );
};

export default RestaurantForm;
