"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import BlogForm from "@/components/admin/blogsManagement/blogForm";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AuthContext } from "@/lib/auth-context";
import { toast } from "react-toastify";
import {
  doc,
  setDoc,
  collection,
  getFirestore,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const BlogNewPage = () => {
  const { loadingUser, auth, db, storage, currentUser, appId } = useContext(AuthContext);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveBlog = useCallback(
    async (formData) => {
      if (saving || loadingUser) return;
      setSaving(true);
      try {
        // 使用從 AuthContext 傳入的 currentUser
        if (!currentUser || !currentUser.uid) {
          throw new Error("使用者資訊未載入。請重新登入。");
        }
        
        // 使用正確的 Firestore 路徑
        const blogsCollectionRef = collection(db, `artifacts/${appId}/public/data/blogs`);
        
        // 確保 blogId 存在
        let finalData = { ...formData };
        if (!finalData.id) {
          const newDocRef = doc(blogsCollectionRef);
          finalData.id = newDocRef.id;
        }

        let coverImageUrl = finalData.coverImage;
        if (coverImage) {
          const imageRef = ref(storage, `public/blogs/${finalData.id}/cover/${coverImage.name}`);
          await uploadBytes(imageRef, coverImage);
          coverImageUrl = await getDownloadURL(imageRef);
        }

        const blogData = {
          ...finalData,
          coverImage: coverImageUrl,
          authorId: currentUser.uid, // 使用 currentUser.uid
          submittedAt: new Date(),
        };

        const docRef = doc(blogsCollectionRef, finalData.id);
        await setDoc(docRef, blogData, { merge: true });

        toast.success("文章已成功發布！");
        router.push("/admin/admin_blogs");
      } catch (error) {
        console.error("儲存文章失敗：", error);
        toast.error(`儲存文章失敗: ${error.message}`);
      } finally {
        setSaving(false);
      }
    },
    [saving, loadingUser, auth, db, storage, coverImage, router, currentUser, appId]
  );

  const handleCancel = useCallback(() => {
    router.push("/admin/admin_blogs");
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
    <BlogForm
      initialData={null}
      onSave={handleSaveBlog}
      onCancel={handleCancel}
      saving={saving}
      onImageChange={handleImageChange}
      previewUrl={previewUrl}
    />
  );
};

export default BlogNewPage;
