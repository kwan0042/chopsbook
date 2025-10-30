import { useState, useCallback } from "react";
// 引入 Resizer 庫 (需要確保已安裝: npm install react-image-file-resizer)
import Resizer from "react-image-file-resizer";
// 🚨 關鍵修改：導入 Firebase Storage 瀏覽器 SDK
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore"; // 如果你需要寫入 Firestore 評論數據

// 輔助函式：使用 Resizer 在瀏覽器端將 File 轉換為 WebP Blob
// **注意: 此處邏輯不再用於上傳前，而是用於舊邏輯回退或非裁剪圖片**
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

  // 🚨 新增：用於裁剪的狀態
  const [imageToCrop, setImageToCrop] = useState(null); // 待裁剪的 File 物件
  const [originalFileRef, setOriginalFileRef] = useState(null); // 原始 File 物件的參考，用於命名

  const handleImageUpload = useCallback(
    (e) => {
      // 確保總數不超過 6 張
      if (uploadedImages.length >= 6) {
        e.target.value = null; // 重置 input
        return;
      }

      const files = Array.from(e.target.files);

      // 篩選出第一張合格的圖片
      const newFile = files.filter(
        (file) => file.type === "image/jpeg" || file.type === "image/png"
      )[0];

      if (newFile) {
        // 🚨 關鍵修改：將檔案存入待裁剪狀態，觸發模態框
        setOriginalFileRef(newFile); // 保存原始檔案用於後續命名
        setImageToCrop(newFile);
      }

      // 重置 input 值，允許用戶再次選擇相同檔案
      e.target.value = null;
    },
    [uploadedImages.length]
  );

  // 🚨 新增：處理裁剪完成的 Blob
  const handleCroppedImage = useCallback(
    (croppedBlob) => {
      // 🚨 修復點：確保 croppedBlob 存在且是一個 Blob 物件，否則不進行處理
      if (!croppedBlob) {
        console.warn("handleCroppedImage 被呼叫但未收到有效的 Blob。");
        setImageToCrop(null); // 清除待裁剪狀態
        setOriginalFileRef(null);
        return;
      }

      // 檢查總數是否已滿
      if (uploadedImages.length >= 6) return;

      const fileId = Date.now() + Math.random();

      // 🚨 修復點：URL.createObjectURL 接收 Blob 或 File
      const newImagePreview = {
        file: originalFileRef, // 原始檔案的參考
        croppedBlob: croppedBlob, // 裁剪並壓縮後的 WebP Blob
        description: "",
        url: URL.createObjectURL(croppedBlob), // 用於本地預覽 (URL.createObjectURL(Blob))
        id: fileId,
      };

      setUploadedImages((prev) => [...prev, newImagePreview]);

      // 清除待裁剪狀態
      setImageToCrop(null);
      setOriginalFileRef(null);
    },
    [uploadedImages.length, originalFileRef]
  );

  // 🚨 新增：專門用於取消裁剪或處理失敗後清除狀態的函數
  const clearImageToCrop = useCallback(() => {
    setImageToCrop(null);
    setOriginalFileRef(null);
  }, []);

  const handleImageDescriptionChange = useCallback((id, description) => {
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, description } : img))
    );
  }, []);

  // 在移除圖片時，確保刪除本地預覽 URL
  const handleRemoveImage = useCallback((id) => {
    setUploadedImages((prev) =>
      prev.filter((img) => {
        if (img.id === id) {
          URL.revokeObjectURL(img.url); // 釋放本地 URL
          return false;
        }
        return true;
      })
    );
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
            // ⭐ 步驟 1: 優先使用裁剪後的 Blob (croppedBlob)
            let fileToUpload = image.croppedBlob || image.file;
            let originalFile = image.file; // 用於獲取原始檔案名稱
            let finalFileName = originalFile.name;
            const userId = currentUser.uid;

            // 如果沒有 croppedBlob（例如舊草稿格式），則執行 WebP 轉換
            if (!image.croppedBlob) {
              try {
                const webpBlob = await resizeAndConvertToWebP(originalFile);
                fileToUpload = webpBlob;
              } catch (error) {
                console.warn(
                  `圖片 ${originalFile.name} 轉換為 WebP 失敗，將上傳原始檔案。錯誤:`,
                  error
                );
                // 使用原始檔案
                fileToUpload = originalFile;
              }
            }

            // 替換副檔名為 .webp (假設裁剪/轉換後的 Blob 是 webp)
            if (
              fileToUpload instanceof Blob &&
              fileToUpload.type === "image/webp"
            ) {
              finalFileName = finalFileName.replace(/\.[^/.]+$/, "") + ".webp";
            } else {
              // 如果是原始檔案，使用其原有副檔名
              finalFileName = originalFile.name;
            }

            // ⭐ 步驟 2: 上傳到 Firebase Storage (取代原來的 API 呼叫)

            // 構建 Storage 路徑
            const visitCountFolder = String(visitCount).padStart(3, "0");
            const storagePath = `public/users/${userId}/reviews/${restaurantId}/${visitCountFolder}/${finalFileName}`;

            const imageRef = ref(storage, storagePath);

            // 上傳 Blob
            const snapshot = await uploadBytes(imageRef, fileToUpload, {
              // 根據轉換結果設定 Content-Type
              contentType: fileToUpload.type,
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

  // 在重置圖片時，確保刪除所有本地預覽 URL
  const resetImages = useCallback(() => {
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.url));
    setUploadedImages([]);
    setImageUploadStatus("idle");
    clearImageToCrop(); // 清除待裁剪狀態
  }, [uploadedImages, clearImageToCrop]);

  return {
    uploadedImages,
    imageUploadStatus,
    handleImageUpload,
    handleImageDescriptionChange,
    handleRemoveImage,
    uploadImagesToFirebase,
    resetImages,

    // 🚨 導出新的狀態和處理函數
    imageToCrop,
    handleCroppedImage,
    clearImageToCrop, // 導出清除函數
  };
};

export default useImageUploader;
