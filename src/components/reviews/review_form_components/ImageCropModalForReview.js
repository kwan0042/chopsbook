// src/components/reviews/review_form_components/ImageCropModalForReview.js

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import Resizer from "react-image-file-resizer";
// 假設您的 image-utils 在專案根目錄的 lib/image-utils.js
import { getCroppedImg } from "@/lib/image-utils";

// 預設寬高為食評照片的合理尺寸 (例如 1024x1024 或更高)
const TARGET_WIDTH = 1024;
const TARGET_HEIGHT = 1024;
const TARGET_QUALITY = 80;

/**
 * 圖片裁剪模態框 (專用於食評圖片)
 * 允許用戶將圖片裁剪成 1:1 比例的正方形。
 *
 * @param {File} photoFile - 用戶選擇的原始圖片檔案
 * @param {function} onClose - 關閉模態框的回調函數
 * @param {function} onImageCropped - 裁剪完成後傳回最終 Blob 的回調函數 (參數: croppedBlob)
 */
const ImageCropModalForReview = ({ photoFile, onClose, onImageCropped }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. 記錄裁剪區域
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 2. 執行裁剪、壓縮並上傳
  const handleCropAndFinish = async () => {
    if (!croppedAreaPixels || isProcessing) {
      onClose();
      return;
    }

    setIsProcessing(true);

    try {
      // 1. 裁剪圖片 (獲取裁剪後的原始像素 Blob)
      const imageURL = URL.createObjectURL(photoFile);
      const croppedImageBlob = await getCroppedImg(imageURL, croppedAreaPixels);
      URL.revokeObjectURL(imageURL); // 釋放 URL 物件

      // 2. 使用 Resizer 調整大小和格式 (轉為 WEBP)
      const resizedBlob = await new Promise((resolve, reject) => {
        Resizer.imageFileResizer(
          croppedImageBlob,
          TARGET_WIDTH,
          TARGET_HEIGHT,
          "WEBP", // 輸出格式
          TARGET_QUALITY, // 品質
          0,
          (uri) => {
            if (uri) {
              resolve(uri);
            } else {
              reject(new Error("Resizer 轉換失敗"));
            }
          },
          "blob" // 輸出類型
        );
      });

      // 3. 將最終的 Blob 傳回父組件
      onImageCropped(resizedBlob);
      onClose(); // 成功後關閉
    } catch (error) {
      console.error("圖片裁剪或壓縮失敗:", error);
      alert("圖片處理失敗，請稍後再試。");
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white p-6 rounded-lg w-11/12 md:w-2/3 lg:w-1/2 max-w-2xl max-h-[90vh] flex flex-col items-center relative shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          裁剪圖片 (1:1 正方形)
        </h2>

        {/* 裁剪區容器 */}
        <div className="relative w-full aspect-square mb-4 border border-gray-300 rounded-md">
          {/* 🚨 關鍵設定：aspect={1} 和 cropShape="rect" (預設) */}
          <Cropper
            image={URL.createObjectURL(photoFile)}
            crop={crop}
            zoom={zoom}
            aspect={1} // 食評照片常用的 1:1 比例
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="rect" // 預設為矩形裁剪
            showGrid={true}
          />
        </div>

        {/* 縮放滑桿 */}
        <div className="w-full mb-4">
          <label
            htmlFor="zoom-range-review"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            縮放
          </label>
          <input
            id="zoom-range-review"
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={isProcessing}
          />
        </div>

        {/* 按鈕組 */}
        <div className="flex justify-end w-full space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            disabled={isProcessing}
          >
            取消
          </button>
          <button
            onClick={handleCropAndFinish}
            className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                處理中...
              </>
            ) : (
              "確認裁剪"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModalForReview;
