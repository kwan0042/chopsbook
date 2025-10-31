import React, { useState, useCallback, useRef } from "react";
// 🎯 新增: 引入圖片裁剪組件和圖片處理庫
import Cropper from "react-easy-crop";
import Resizer from "react-image-file-resizer";

import {
  categoryOptions,
  provinceOptions,
  citiesByProvince,
  restaurantTypeOptions,
  seatingCapacityOptions,
} from "../../../data/restaurant-options";

// 🔥 新增輔助函式：使用 Canvas API 進行實際圖片裁剪
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    // 確保能夠處理跨域圖片
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // 設置 Canvas 尺寸為裁剪區域的尺寸
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // 在 Canvas 上繪製裁剪後的圖像
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    // 將 Canvas 內容輸出為 Blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error("Canvas is empty");
          return;
        }
        // 裁剪後的 Blob 物件
        resolve(blob);
      },
      "image/jpeg", // 使用 JPEG 格式來確保 Resizer 能夠正確處理
      1
    );
  });
}
// 🔥 輔助函式結束

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
  subCategoryOptions,
  handleSubCuisineChange,
  // 圖片相關 props (保留父組件的狀態)
  // openFilePicker, // 不再需要，由內部控制
  previewUrl, // 顯示最終的圖片 URL
  // handleRemovePhoto, // 不再需要，由內部控制並回調父組件
  isUploading,
  isSubmittingForm,
  // 🔥 關鍵修改: 新增一個回調，用於將裁剪好的文件傳回給父組件
  onPhotoCroppedAndReady, // (croppedFile, previewUrl) => {}
  // 🔥 新增：接受父組件的移除照片回調 (用於更新父組件狀態和表單數據)
  handleRemovePhoto: parentHandleRemovePhoto,
}) => {
  // -------------------- 🔥 圖片裁剪/上傳 內部狀態管理 🔥 --------------------
  const fileInputRef = useRef(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false); // 控制 Pop-up
  const [imageSrc, setImageSrc] = useState(null); // 用於 Cropper 的原始圖片 URL
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); // 用於顯示檔案名稱

  // 1. 觸發文件選擇
  const openFilePicker = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // 2. 處理文件選擇 (開啟 Pop-up)
  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file); // 設置檔案名稱供顯示
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result); // 設置圖片源供 Cropper 使用
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setIsCropperOpen(true); // 🎯 開啟裁剪 Pop-up
      };
      reader.readAsDataURL(file);
    }
    // 重設 input value 確保可以重複選擇同一個檔案
    event.target.value = null;
  }, []);

  // 3. 裁剪完成時設置裁剪區域像素
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 4. 清除內部裁剪狀態 (關閉 Pop-up)
  const clearCropState = useCallback(() => {
    setImageSrc(null);
    setSelectedFile(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropperOpen(false); // 🎯 關閉裁剪 Pop-up
  }, []);

  // 5. 執行裁剪和圖片轉換 (Resizer)
  const onCropImage = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      // 🔥 步驟 1: 使用 Canvas API 執行實際裁剪，取得裁剪後的 Blob
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      // 將 Blob 轉為 File，用於傳入 Resizer
      const croppedFile = new File([croppedBlob], "cropped_image.jpeg", {
        type: croppedBlob.type,
      });

      // 🔥 步驟 2: 將裁剪後的 File (croppedFile) 傳給 Resizer 進行 WebP 轉碼和壓縮
      Resizer.imageFileResizer(
        croppedFile, // <-- 傳入裁剪後的 File/Blob
        1200, // 最終圖片寬度 (設置一個合理的值，例如 1200)
        900, // 最終圖片高度 (基於 4:3 比例 1200/4*3=900)
        "WEBP", // 輸出格式
        90, // 質量 (例如 90)
        0, // 旋轉角度
        (uri) => {
          const newFile = new File(
            [uri],
            `${selectedFile.name.split(".")[0]}_cropped.webp`,
            {
              type: "image/webp",
            }
          );

          const newPreviewUrl = URL.createObjectURL(newFile);

          // 🔥 將裁剪好的文件和 URL 傳遞回父組件
          onPhotoCroppedAndReady(newFile, newPreviewUrl);

          // 關閉 Pop-up 並清除臨時狀態
          clearCropState();
        },
        "blob" // 輸出類型: blob (推薦用於上傳)
        // 由於 Resizer 已經會根據比例調整，這裡不再需要傳入 width/height
      );
    } catch (e) {
      console.error("Error cropping and resizing image:", e);
    }
  }, [
    imageSrc,
    croppedAreaPixels,
    selectedFile,
    onPhotoCroppedAndReady,
    clearCropState,
  ]);

  // 6. 處理移除照片 (內部和外部)
  const handleRemovePhoto = useCallback(() => {
    clearCropState(); // 清除內部狀態
    parentHandleRemovePhoto(); // 調用父組件的移除函數
  }, [clearCropState, parentHandleRemovePhoto]);

  // -------------------- 🔥 圖片裁剪/上傳 內部狀態管理 結束 🔥 --------------------

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
      {/* 🎯 Pop-up/Modal 視窗 - 裁剪器 */}
      {isCropperOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 sm:p-6">
          {/* 🔥 修正 1: 主容器設為 flex-col, 限制高度, 設置最大寬度 */}
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800">
                裁剪門面相片 (16:9 WebP)
              </h3>
              <button
                onClick={clearCropState}
                className="text-gray-500 hover:text-gray-800"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            {/* Modal Body - Cropper Area */}
            {/* 🔥 修正 2: 設置 flex-grow, min-h-[300px], overflow-hidden 以佔據剩餘空間 */}
            <div className="relative flex-grow min-h-[300px] overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9} // 設置 4:3 比例
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={true}
                // 🔥 修正 3: 使用 "cover" 來確保圖片盡可能填滿區域
                objectFit="cover"
              />
            </div>

            {/* Modal Footer - Controls & Actions */}
            {/* 🔥 修正 4: 確保 footer 不會縮小 (flex-shrink-0) */}
            <div className="p-4 border-t flex flex-col space-y-3 flex-shrink-0">
              {/* 縮放滑桿 */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700 font-medium whitespace-nowrap">
                  縮放:
                </span>
                <input
                  type="range"
                  value={zoom}
                  min={0.5} // 修正縮放問題
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                />
              </div>

              {/* 動作按鈕 */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={clearCropState}
                  className="p-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={onCropImage} // 執行裁剪並生成 4:3 WebP
                  disabled={isUploading || isSubmittingForm}
                  className="p-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 font-semibold"
                >
                  確認並裁剪
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 餐廳詳細信息表單 (其餘部分不變) */}
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
              onChange={handleNoChineseNameChange}
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
          {/* 🎯 隱藏的文件輸入框 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: "none" }}
          />
          {/* 圖片操作區塊 */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              id="facadePhotoUrlDisplay"
              name="facadePhotoUrl"
              // 顯示選中檔案名或預覽 URL
              value={selectedFile ? selectedFile.name : previewUrl || ""}
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
              onClick={openFilePicker} // 🎯 調用內部 openFilePicker
              className="p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              disabled={isUploading || isSubmittingForm || isCropperOpen}
            >
              {previewUrl && !selectedFile ? "更改" : "瀏覽"}
            </button>

            {(previewUrl || selectedFile) && (
              <button
                type="button"
                onClick={handleRemovePhoto} // 🎯 調用內部 handleRemovePhoto
                className="p-3 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 whitespace-nowrap"
                aria-label="移除照片"
                disabled={isCropperOpen}
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
                // 移除 style 屬性，交給 max-w-full 和 max-h-96 處理
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
          {/* 移除備用顯示，因為 selectedFile 僅用於裁剪過渡狀態 */}
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
