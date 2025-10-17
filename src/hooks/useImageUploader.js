import { useState, useCallback } from "react";
// 不再需要 firebase/storage 的瀏覽器 SDK，因為上傳作業已轉移到後端 API
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Next.js App Router API Route 的路徑
const UPLOAD_API_ENDPOINT = "/api/upload-review-image";

const useImageUploader = (currentUser) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageUploadStatus, setImageUploadStatus] = useState("idle"); // idle, uploading, success, error

  const handleImageUpload = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      // 保持只篩選 'image/jpeg' 的邏輯，但後端可以處理多種格式的轉換。
      const newImages = files
        .filter((file) => file.type === "image/jpeg")
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
   * 將圖片數據發送到 Next.js API Route 進行 Sharp 轉換和 Firebase 儲存。
   */
  const uploadImagesToFirebase = useCallback(
    async (restaurantId, visitCount) => {
      if (!currentUser || uploadedImages.length === 0) return [];

      setImageUploadStatus("uploading");

      try {
        const urls = await Promise.all(
          uploadedImages.map(async (image) => {
            const formData = new FormData();

            // 1. 附上圖片檔案 (名稱 'image' 必須匹配後端 Route Handler)
            formData.append("image", image.file, image.file.name);

            // 2. 附上必要的元數據 (作為字串)
            formData.append("userId", currentUser.uid);
            formData.append("restaurantId", restaurantId);
            formData.append("visitCount", String(visitCount));
            formData.append("description", image.description);

            // 3. 呼叫 Next.js API Route
            const response = await fetch(UPLOAD_API_ENDPOINT, {
              method: "POST",
              body: formData,
              // 瀏覽器會自動設定正確的 Content-Type: multipart/form-data
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
