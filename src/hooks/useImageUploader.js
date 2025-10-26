import { useState, useCallback } from "react";
// 引入 Resizer 庫
import Resizer from "react-image-file-resizer";

// 不再需要 firebase/storage 的瀏覽器 SDK，因為上傳作業已轉移到後端 API
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Next.js App Router API Route 的路徑
const UPLOAD_API_ENDPOINT = "/api/upload-review-image";

// 輔助函式：使用 Resizer 在瀏覽器端將 File 轉換為 WebP Blob
const resizeAndConvertToWebP = (imageFile) => {
  return new Promise((resolve, reject) => {
    // 檢查 Resizer 是否存在，以防未引入
    if (typeof Resizer === "undefined") {
      reject(new Error("Resizer 庫未引入"));
      return;
    }

    Resizer.imageFileResizer(
      imageFile, // 原始檔案 (File 或 Blob)
      1024, // 最大寬度 (與你後端 Sharp 設置相同)
      1024, // 最大高度
      "WEBP", // 輸出格式
      80, // 品質 (與你後端 Sharp 設置相同)
      0, // 旋轉
      (uri) => {
        // uri 是一個 Blob 物件
        if (uri) {
          resolve(uri);
        } else {
          // 轉換結果為 null
          reject(new Error("Resizer 轉換失敗，返回 null"));
        }
      },
      "blob" // 輸出類型為 Blob
    );
  });
};

const useImageUploader = (currentUser) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageUploadStatus, setImageUploadStatus] = useState("idle"); // idle, uploading, success, error

  const handleImageUpload = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      // 保持只篩選 'image/jpeg' 的邏輯，但後端可以處理多種格式的轉換。
      const newImages = files
        .filter(
          (file) => file.type === "image/jpeg" || file.type === "image/png"
        ) // 擴展支持常見格式
        .slice(0, 5 - uploadedImages.length);

      const newImagePreviews = newImages.map((file) => ({
        file,
        description: "",
        url: URL.createObjectURL(file), // 用於本地預覽
        id: Date.now() + Math.random(),
      }));

      setUploadedImages((prev) => [...prev, ...newImagePreviews]);
    },
    [uploadedImages.length]
  );

  const handleImageDescriptionChange = useCallback((id, description) => {
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, description } : img))
    );
  }, []);

  const handleRemoveImage = useCallback((id) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  /**
   * 將圖片數據發送到 Next.js API Route 進行 Firebase 儲存。
   * (Sharp 轉換已轉移到前端 Resizer)
   */
  const uploadImagesToFirebase = useCallback(
    async (restaurantId, visitCount) => {
      if (!currentUser || uploadedImages.length === 0) return [];

      setImageUploadStatus("uploading");

      try {
        const urls = await Promise.all(
          uploadedImages.map(async (image) => {
            // ⭐ 步驟 1: 前端轉換為 WebP Blob
            let fileToUpload = image.file;
            let finalFileName = image.file.name;

            try {
              const webpBlob = await resizeAndConvertToWebP(image.file);
              fileToUpload = webpBlob; // 更新為 WebP Blob

              // 替換副檔名為 .webp
              finalFileName = finalFileName.replace(/\.[^/.]+$/, "") + ".webp";
            } catch (error) {
              // 如果轉換失敗，則退回到上傳原始檔案，並在控制台警告
              console.warn(
                `圖片 ${image.file.name} 轉換為 WebP 失敗，將上傳原始檔案。錯誤:`,
                error
              );
              // 注意：如果上傳原始檔案，後端 route.js 必須移除 sharp 相關邏輯，否則仍會 500
              fileToUpload = image.file;
              finalFileName = image.file.name;
            }

            // ⭐ 步驟 2: 構建 FormData 並上傳
            const formData = new FormData();

            // 1. 附上圖片 Blob/File，現在使用轉換後的檔案和新的名稱
            // 'image' 必須匹配後端 Route Handler
            formData.append("image", fileToUpload, finalFileName);

            // 2. 附上必要的元數據 (作為字串)
            formData.append("userId", currentUser.uid);
            formData.append("restaurantId", restaurantId);
            formData.append("visitCount", String(visitCount));
            formData.append("description", image.description);

            // 3. 呼叫 Next.js API Route
            const response = await fetch(UPLOAD_API_ENDPOINT, {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              // 從回應中獲取錯誤訊息
              const errorData = await response.json();
              throw new Error(
                `上傳 API 失敗: ${response.status} - ${
                  errorData.message || "未知錯誤"
                }`
              );
            }

            // 預期後端 API 返回 WebP 圖片的 URL
            const result = await response.json();

            // 返回包含 WebP URL 和描述的物件
            return { url: result.url, description: image.description };
          })
        );

        setImageUploadStatus("success");
        return urls;
      } catch (error) {
        console.error("上傳圖片失敗:", error);
        setImageUploadStatus("error");
        throw error;
      }
    },
    [uploadedImages, currentUser]
  );

  const resetImages = useCallback(() => {
    setUploadedImages([]);
    setImageUploadStatus("idle");
  }, []);

  return {
    uploadedImages,
    imageUploadStatus,
    handleImageUpload,
    handleImageDescriptionChange,
    handleRemoveImage,
    uploadImagesToFirebase,
    resetImages,
  };
};

export default useImageUploader;
