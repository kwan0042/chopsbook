import { useState, useCallback } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const useImageUploader = (currentUser) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageUploadStatus, setImageUploadStatus] = useState("idle"); // idle, uploading, success, error

  const handleImageUpload = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      const newImages = files
        .filter((file) => file.type === "image/jpeg")
        .slice(0, 5 - uploadedImages.length);

      const newImagePreviews = newImages.map((file) => ({
        file,
        description: "",
        url: URL.createObjectURL(file),
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

  const uploadImagesToFirebase = useCallback(
    async (restaurantId, visitCount) => {
      if (!currentUser) return [];

      if (uploadedImages.length === 0) return [];

      setImageUploadStatus("uploading");
      const storage = getStorage();

      try {
        const urls = await Promise.all(
          uploadedImages.map(async (image) => {
            // 在路徑中加入 visitCount，並格式化為三位數
            const visitCountFolder = String(visitCount).padStart(3, "0");
            const storageRef = ref(
              storage,
              `public/users/${currentUser.uid}/reviews/${restaurantId}/${visitCountFolder}/${image.file.name}`
            );

            const snapshot = await uploadBytes(storageRef, image.file);
            const url = await getDownloadURL(snapshot.ref);
            return { url, description: image.description };
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
