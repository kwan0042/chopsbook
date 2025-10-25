import React from "react";
import {
  categoryOptions,
  provinceOptions,
  citiesByProvince,
  restaurantTypeOptions,
  seatingCapacityOptions,
} from "../../../data/restaurant-options";

// 這是處理餐廳基本資料的區塊
const RestaurantDetailsSection = ({
  // 核心 Props
  inputRefs,
  formData,
  handleChange,
  handleNameEnChange,
  errors,
  handleCheckboxChange,
  handleProvinceChange,
  // 🎯 關鍵修改 1: 接受新的 noChineseName 專用處理函數
  handleNoChineseNameChange,
  // 菜系相關 props (更新為使用獨立欄位)
  handleCuisineCategoryChange,
  handleSubCuisineChange,
  subCategoryOptions,
  // 圖片相關 props (已完整包含)
  openFilePicker,
  previewUrl,
  handleRemovePhoto,
  selectedFile,
  isUploading,
  isSubmittingForm,
}) => {
  // 根據選擇的省份動態獲取城市列表
  const citiesForSelectedProvince = citiesByProvince[formData.province] || [
    "選擇城市",
  ];

  // 判斷當前選擇的主菜系是否有子菜系
  const hasSubCategories = subCategoryOptions && subCategoryOptions.length > 0;

  // 確保 restaurantType 始終是一個陣列，即使它在 formData 中是 undefined 或 null
  const selectedRestaurantTypes = formData.restaurantType || [];

  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div ref={(el) => (inputRefs.current["restaurantName.zh-TW"] = el)}>
          {" "}
          <label
            htmlFor="restaurantNameZh"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            餐廳名稱 (中文) <span className="text-red-500">*</span>
            {errors.restaurantName?.["zh-TW"] && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.restaurantName?.["zh-TW"]}
              </span>
            )}
          </label>
          <input
            type="text"
            id="restaurantNameZh"
            name="restaurantName.zh-TW"
            value={formData.restaurantName?.["zh-TW"] || ""}
            onChange={handleChange}
            disabled={formData.noChineseName}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
              errors.restaurantName?.["zh-TW"]
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            } disabled:bg-gray-100 disabled:text-gray-500`}
            placeholder="例如：楓葉小館"
          />
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="noChineseName"
              name="noChineseName"
              checked={formData.noChineseName || false}
              onChange={(e) => {
                const isChecked = e.target.checked;
                // 🎯 關鍵修改 2: 使用專用的 handleNoChineseNameChange 處理 Checkbox 狀態
                handleNoChineseNameChange(e);

                // 保持清除中文名稱的邏輯 (這部分是正確的)
                if (isChecked) {
                  handleChange({
                    target: { name: "restaurantName.zh-TW", value: "" },
                  });
                }
              }}
              className="form-checkbox h-4 w-4 text-blue-600 rounded"
            />
            <label
              htmlFor="noChineseName"
              className="ml-2 text-sm text-gray-600"
            >
              沒有中文名稱 (允許此欄位為空)
            </label>
          </div>
        </div>
        <div ref={(el) => (inputRefs.current["restaurantName.en"] = el)}>
          {" "}
          <label
            htmlFor="restaurantNameEn"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            餐廳名稱 (英文) <span className="text-red-500">*</span>
            {errors.restaurantName?.en && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.restaurantName?.en}
              </span>
            )}
          </label>
          <input
            type="text"
            id="restaurantNameEn"
            name="restaurantName.en"
            value={formData.restaurantName?.en || ""}
            onChange={handleNameEnChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
              errors.restaurantName?.en
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="例如：Maple Leaf Bistro"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div ref={(el) => (inputRefs.current["province"] = el)}>
          {" "}
          <label
            htmlFor="province"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            省份
            {/* 🚨 移除: <span className="text-red-500">*</span> */}
            {errors.province && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.province}
              </span>
            )}
          </label>
          <select
            id="province"
            name="province"
            value={formData.province || ""}
            onChange={handleProvinceChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
              errors.province
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          >
            <option value="" disabled>
              選擇省份
            </option>
            {provinceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div ref={(el) => (inputRefs.current["city"] = el)}>
          {" "}
          <label
            htmlFor="city"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            城市
            {/* 🚨 移除: <span className="text-red-500">*</span> */}
            {errors.city && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.city}
              </span>
            )}
          </label>
          <select
            id="city"
            name="city"
            value={formData.city || ""}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
              errors.city
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}
            disabled={!formData.province}
          >
            <option value="" disabled>
              選擇城市
            </option>
            {citiesForSelectedProvince.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="mt-4"
        ref={(el) => (inputRefs.current["fullAddress"] = el)}
      >
        {" "}
        <label
          htmlFor="fullAddress"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          完整地址
          {/* 🚨 移除: <span className="text-red-500">*</span> */}
          {errors.fullAddress && (
            <span className="text-red-500 font-normal text-xs ml-2">
              {errors.fullAddress}
            </span>
          )}
        </label>
        <textarea
          id="fullAddress"
          name="fullAddress"
          value={formData.fullAddress || ""}
          onChange={handleChange}
          rows="3"
          className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
            errors.fullAddress
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}
          placeholder="請輸入餐廳完整地址，包含街號、門牌號"
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div ref={(el) => (inputRefs.current["postalCode"] = el)}>
          {" "}
          <label
            htmlFor="postalCode"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            郵遞區號
            {/* 🚨 移除: <span className="text-red-500">*</span> */}
            {errors.postalCode && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.postalCode}
              </span>
            )}
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode || ""}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
              errors.postalCode
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="例如：A1A 1A1"
          />
        </div>

        <div ref={(el) => (inputRefs.current["facadePhotoUrls"] = el)}>
          {" "}
          <label
            htmlFor="facadePhotoUrlDisplay"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            門面相片
            {/* 🚨 移除: <span className="text-red-500">*</span> */}
            {errors.facadePhotoUrls && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.facadePhotoUrls}
              </span>
            )}
          </label>
          {/* 圖片操作區塊 */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              id="facadePhotoUrlDisplay"
              name="facadePhotoUrl"
              value={selectedFile ? selectedFile.name : previewUrl || ""} // 當有本地檔案時顯示檔案名稱，否則顯示 URL
              readOnly
              className={`flex-grow p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600 focus:outline-none ${
                errors.facadePhotoUrls
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="請選擇或查看圖片"
            />
            <button
              type="button"
              onClick={openFilePicker}
              className="p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              disabled={isUploading || isSubmittingForm}
            >
              {previewUrl && !selectedFile ? "更改" : "瀏覽"}
            </button>

            {(previewUrl || selectedFile) && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="p-3 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 whitespace-nowrap"
                aria-label="移除照片"
              >
                移除
              </button>
            )}
          </div>
          {/* 🔥 圖片預覽顯示區塊 🔥 */}
          {previewUrl && (
            <div className="mt-4 border border-gray-300 p-4 rounded-lg relative bg-gray-100 flex justify-center items-center">
              <img
                src={previewUrl} // <-- 這是將 URL 轉換為圖片的關鍵
                alt="餐廳門面預覽"
                className="max-w-full max-h-96 object-contain rounded"
                style={{ width: "auto", height: "auto" }}
              />

              {/* 圖片上傳中覆蓋層 */}
              {isUploading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded">
                  <p className="text-lg font-semibold text-blue-600 animate-pulse">
                    圖片上傳中...
                  </p>
                </div>
              )}
            </div>
          )}
          {/* 當預覽 URL 為空但有本地檔案物件時，顯示名稱 (備用) */}
          {selectedFile && !previewUrl && (
            <p className="text-sm text-gray-600 mt-2">
              已選擇檔案:{" "}
              <span className="font-semibold">{selectedFile.name}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div ref={(el) => (inputRefs.current["phone"] = el)}>
          {" "}
          <label
            htmlFor="phone"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            電話
            {/* 🚨 移除: <span className="text-red-500">*</span> */}
            {errors.phone && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.phone}
              </span>
            )}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone || ""}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
              errors.phone
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="請輸入電話號碼 (例如：1234 5678)"
          />
        </div>
        <div ref={(el) => (inputRefs.current["website"] = el)}>
          {" "}
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

      {/* 級聯菜系選擇 */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
        ref={(el) => (inputRefs.current["cuisineTypeContainer"] = el)} // 修正: 為了滾動到父容器
      >
        {" "}
        <div>
          <label
            htmlFor="category" // 修正: ID 使用 category
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            菜系類別
            {/* 🚨 移除: <span className="text-red-500">*</span> */}
            {errors.category && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.category}
              </span>
            )}
          </label>
          <select
            id="category"
            name="category" // 修正: name 使用 category
            value={formData.category} // 修正: 直接綁定 formData.category
            onChange={handleCuisineCategoryChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
              errors.category
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            ref={(el) => (inputRefs.current["category"] = el)} // 修正: 設置 ref
          >
            <option value="" disabled>
              選擇菜系類別
            </option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="subCategory" // 修正: ID 使用 subCategory
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            子菜系
            {/* 🚨 移除: <span className="text-red-500">*</span> */}
            {errors.subCategory && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.subCategory}
              </span>
            )}
          </label>
          <select
            id="subCategory"
            name="subCategory" // 修正: name 使用 subCategory
            value={formData.subCategory || (hasSubCategories ? "" : "")} // 修正: 直接綁定 formData.subCategory
            onChange={handleSubCuisineChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
              errors.subCategory
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            } disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}
            disabled={!formData.category || !hasSubCategories} // 修正: 禁用邏輯
            ref={(el) => (inputRefs.current["subCategory"] = el)} // 修正: 設置 ref
          >
            {/* 修正: 根據有無子菜系顯示不同的預設選項 */}
            <option value="" disabled={hasSubCategories}>
              {hasSubCategories ? "選擇子菜系" : "不適用"}
            </option>
            {hasSubCategories ? (
              subCategoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))
            ) : (
              // 當沒有子菜系時，確保有一個 "不適用" 的選項，但我們將其值設為 "" 以便於數據庫處理
              <option value="">不適用</option>
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
        <div ref={(el) => (inputRefs.current["restaurantType"] = el)}>
          {" "}
          <label
            htmlFor="restaurantType"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            餐廳類型 (多選)
            {errors.restaurantType && (
              <span className="text-red-500 font-normal text-xs ml-2">
                {errors.restaurantType}
              </span>
            )}
          </label>
          {/* 修正後的 Checkbox 區塊 - 核心修改在這裡 */}
          <div
            className={`
                p-3 border rounded-md focus:outline-none focus:ring-2 
                /* 保持手機版樣式: 垂直捲動，固定高度 */
                h-40 overflow-y-auto 
                
                /* --- Web 版 (md: 以上) 樣式 --- */
                /* 添加 Grid 4 欄佈局 */
                md:grid md:grid-cols-4 md:gap-x-4
                
                ${
                  errors.restaurantType
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }
            `}
          >
            {restaurantTypeOptions.map((option) => (
              <div
                key={option}
                /* 在手機版 (預設) 添加垂直間距 mb-1 */
                /* 在 Web 版 (md: 以上) 移除垂直間距 md:mb-0，讓 Grid 的 gap 處理間距 */
                className="flex items-center mb-1 md:mb-0"
              >
                <input
                  type="checkbox"
                  id={`restaurantType-${option}`}
                  name="restaurantType" // 確保使用陣列名稱
                  value={option}
                  // 關鍵修正：使用 selectedRestaurantTypes (已確保是陣列) 來呼叫 includes
                  checked={selectedRestaurantTypes.includes(option)}
                  onChange={handleCheckboxChange}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded"
                />
                <label
                  htmlFor={`restaurantType-${option}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div ref={(el) => (inputRefs.current["seatingCapacity"] = el)}>
          {" "}
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
            <option value="" disabled>
              選擇座位數
            </option>
            {seatingCapacityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div ref={(el) => (inputRefs.current["avgSpending"] = el)}>
          {" "}
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
      </div>
    </div>
  );
};

export default RestaurantDetailsSection;
