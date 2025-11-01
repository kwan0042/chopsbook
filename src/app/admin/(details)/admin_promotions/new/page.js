"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import PromotionForm from "@/components/promotions/PromotionForm"; // 導入新的表單組件
import LoadingSpinner from "@/components/LoadingSpinner";
import { AuthContext } from "@/lib/auth-context";
import { toast } from "react-toastify";
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const PromotionNewPage = () => {
  const { loadingUser, auth, db, storage, currentUser, appId } =
    useContext(AuthContext);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState(null); // 上傳的 File 物件
  const [previewUrl, setPreviewUrl] = useState(null); // 預覽 URL (Blob URL)

  // 數據庫路徑
  const promotionsCollectionPath = `artifacts/${
    appId || "default-app-id"
  }/public/data/promotions`;

  // 檢查使用者是否已登入
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user && !loadingUser) {
        toast.error("未授權，請重新登入。");
        router.push("/admin");
      }
    });
    return () => unsubscribe();
  }, [auth, loadingUser, router]);

  // 處理圖片變更 (不需要拖放)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      // 創建 Blob URL 作為預覽
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setCoverImage(null);
      setPreviewUrl(null);
    }
  };

  const handleSavePromotion = useCallback(
    async (formData) => {
      if (saving || loadingUser) return;
      setSaving(true);

      // 確保使用者已登入
      const adminUserId = currentUser?.uid;
      if (!adminUserId) {
        setSaving(false);
        toast.error("使用者資訊未載入。請重新登入。");
        return;
      }

      try {
        const promotionsCollectionRef = collection(
          db,
          promotionsCollectionPath
        );

        let finalData = { ...formData };

        // 1. 處理新文檔 ID
        if (!finalData.id) {
          const newDocRef = doc(promotionsCollectionRef);
          finalData.id = newDocRef.id;
        }

        let coverImageUrl = finalData.coverImage;

        // 2. 處理圖片上傳
        if (coverImage) {
          // 圖片儲存路徑: public/promotions/[docId]/cover/[filename]
          const imageRef = ref(
            storage,
            `public/promotions/${finalData.id}/cover/${coverImage.name}`
          );
          await uploadBytes(imageRef, coverImage);
          coverImageUrl = await getDownloadURL(imageRef);
        }

        // 3. 準備寫入數據
        const promotionData = {
          ...finalData,
          coverUrl: coverImageUrl || "", // 使用 coverUrl 匹配前端組件
          coverImage: coverImageUrl || "", // 為了兼容性保留 coverImage
          submittedBy: adminUserId,
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp(), // 每次儲存都更新時間
          // 預設 status: "pending" 已在 PromotionForm.js 的 onSubmit 處理
        };

        const docRef = doc(promotionsCollectionRef, finalData.id);
        await setDoc(docRef, promotionData, { merge: true });

        toast.success("推廣活動已提交審批！");
        router.push("/admin/admin_promotions");
      } catch (error) {
        console.error("儲存推廣活動失敗：", error);
        toast.error(`儲存推廣活動失敗: ${error.message}`);
      } finally {
        setSaving(false);
      }
    },
    [
      saving,
      loadingUser,
      db,
      storage,
      coverImage,
      router,
      currentUser,
      promotionsCollectionPath,
    ]
  );

  const handleCancel = useCallback(() => {
    router.push("/admin/admin_promotions");
  }, [router]);

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <p className="text-gray-600 ml-4">正在載入使用者資訊...</p>
      </div>
    );
  }

  return (
    <PromotionForm
      initialData={null}
      onSave={handleSavePromotion}
      onCancel={handleCancel}
      saving={saving}
      onImageChange={handleImageChange}
      previewUrl={previewUrl}
    />
  );
};

export default PromotionNewPage;
