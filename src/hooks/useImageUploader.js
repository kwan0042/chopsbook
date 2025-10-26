import { useState, useCallback } from "react";
// 引入 Resizer 庫 (需要確保已安裝: npm install react-image-file-resizer)
import Resizer from "react-image-file-resizer";
// 🚨 關鍵修改：導入 Firebase Storage 瀏覽器 SDK
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore"; // 如果你需要寫入 Firestore 評論數據

// 🚨 移除不再需要的 API 終點
// const UPLOAD_API_ENDPOINT = "/api/upload-review-image";

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
      1024, // 最大寬度
      1024, // 最大高度
      "WEBP", // 輸出格式
      80, // 品質
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

// 🚨 關鍵修改：Hook 應能接收 Firebase Storage 實例
const useImageUploader = (currentUser, storage) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageUploadStatus, setImageUploadStatus] = useState("idle"); // idle, uploading, success, error

  const handleImageUpload = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      // 擴展支持常見格式
      const newImages = files
        .filter(
          (file) => file.type === "image/jpeg" || file.type === "image/png"
        )
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
   * 🚨 關鍵修改：直接在前端 Hook 中處理圖片轉換和 Firebase Storage 上傳
   */
  const uploadImagesToFirebase = useCallback(
    async (restaurantId, visitCount) => {
      // 確保有 storage 實例和用戶 ID
      if (!currentUser || uploadedImages.length === 0 || !storage) {
        if (!storage) console.error("Firebase Storage 實例丟失！");
        return [];
      }

      setImageUploadStatus("uploading");

      try {
        const urls = await Promise.all(
          uploadedImages.map(async (image) => {
            // ⭐ 步驟 1: 前端轉換為 WebP Blob
            let fileToUpload = image.file;
            let finalFileName = image.file.name;
            const userId = currentUser.uid;

            try {
              const webpBlob = await resizeAndConvertToWebP(image.file);
              fileToUpload = webpBlob; // 更新為 WebP Blob

              // 替換副檔名為 .webp
              finalFileName = finalFileName.replace(/\.[^/.]+$/, "") + ".webp";
            } catch (error) {
              // 轉換失敗，退回到原始檔案
              console.warn(
                `圖片 ${image.file.name} 轉換為 WebP 失敗，將上傳原始檔案。錯誤:`,
                error
              );
              fileToUpload = image.file;
              finalFileName = image.file.name;
            }

            // ⭐ 步驟 2: 上傳到 Firebase Storage (取代原來的 API 呼叫)

            // 構建 Storage 路徑
            const visitCountFolder = String(visitCount).padStart(3, "0");
            const storagePath = `public/users/${userId}/reviews/${restaurantId}/${visitCountFolder}/${finalFileName}`;

            const imageRef = ref(storage, storagePath);

            // 上傳 Blob
            const snapshot = await uploadBytes(imageRef, fileToUpload, {
              // 根據轉換結果設定 Content-Type
              contentType:
                fileToUpload.type ||
                (fileToUpload instanceof Blob && fileToUpload.size > 0
                  ? "image/webp"
                  : image.file.type),
            });

            // 獲取下載 URL
            const publicUrl = await getDownloadURL(snapshot.ref);

            // 步驟 3: 返回結果給調用者

            // 返回包含 URL 和描述的物件
            return {
              url: publicUrl,
              description: image.description,
              fileName: finalFileName, // 返回檔案名稱，可能在儲存到 Firestore 時有用
            };
          })
        );

        setImageUploadStatus("success");
        return urls;
      } catch (error) {
        console.error("圖片上傳到 Firebase Storage 失敗:", error);
        setImageUploadStatus("error");
        // 拋出一個更具體的錯誤
        throw new Error(`上傳圖片失敗: ${error.message}`);
      }
    },
    [uploadedImages, currentUser, storage] // 🚨 確保 storage 在依賴列表中
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
