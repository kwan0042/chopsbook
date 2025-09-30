// src/components/personal/ImageCropModal.js
import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import Resizer from "react-image-file-resizer";
import { getCroppedImg } from "@/lib/image-utils";

const ImageCropModal = ({ photoFile, onClose, onImageCropped }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropAndUpload = async () => {
    if (!croppedAreaPixels) {
      onClose();
      return;
    }

    try {
      // 1. 裁剪圖片
      const croppedImageBlob = await getCroppedImg(
        URL.createObjectURL(photoFile),
        croppedAreaPixels
      );

      // 2. 使用 Resizer 調整大小和格式
      const resizedBlob = await new Promise((resolve, reject) => {
        Resizer.imageFileResizer(
          croppedImageBlob,
          112, // 寬度
          112, // 高度
          "WEBP", // 推薦使用 WEBP 格式
          80, // 品質
          0,
          (uri) => {
            resolve(uri);
          },
          "blob"
        );
      });

      // 3. 將最終的 Blob 傳回父組件進行上傳
      onImageCropped(resizedBlob);
    } catch (error) {
      console.error("圖片裁剪或壓縮失敗:", error);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white p-6 rounded-lg w-11/12 md:w-1/2 lg:w-1/3 max-h-[80vh] flex flex-col items-center relative">
        <h2 className="text-xl font-bold mb-4">裁剪您的頭像</h2>
        <div className="relative w-full aspect-square mb-4">
          <Cropper
            image={URL.createObjectURL(photoFile)}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="round"
          />
        </div>
        <div className="w-full mb-4">
          <label
            htmlFor="zoom-range"
            className="block text-sm font-medium text-gray-700"
          >
            縮放
          </label>
          <input
            id="zoom-range"
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div className="flex justify-end w-full space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={handleCropAndUpload}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            上傳
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
