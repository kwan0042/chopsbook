// ✅ 這是移除後端 API 依賴的完整程式碼
// src/app/admin/blogs/new/page.js

"use client";

import React, { useState, useContext } from "react";
import BlogForm from "@/components/admin/blogsManagement/blogForm";
import { AuthContext } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // ✅ 新增 Firebase Storage 客戶端 SDK

const BlogNewPage = () => {
  const { loadingUser } = useContext(AuthContext);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file);
      setCoverPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (formData) => {
    if (!formData.title || !formData.content) {
      toast.error("文章標題與內容為必填欄位。");
      setSaving(false);
      return;
    }

    const currentUser = getAuth().currentUser;
    if (loadingUser || !currentUser) {
      toast.error("無法提交文章：使用者未登入或資料載入中。");
      return;
    }

    setSaving(true);

    try {
      // 步驟1: 建立文章草稿並取得 blogId
      const token = await currentUser.getIdToken();
      const createResponse = await fetch("/api/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          status: formData.status,
        }),
      });

      const responseData = await createResponse.json();
      if (!createResponse.ok) {
        const errorMessage = responseData.error || "建立文章失敗";
        throw new Error(errorMessage);
      }
      const { id: blogId } = responseData;

      let coverImageUrl = null;
      // ✅ 新的步驟: 如果有封面圖，使用前端直接上傳
      if (coverImageFile && blogId) {
        const storage = getStorage();
        const storageRef = ref(storage, `public/blogs/${blogId}/cover`);

        await uploadBytes(storageRef, coverImageFile);
        coverImageUrl = await getDownloadURL(storageRef);
      }

      // ✅ 步驟3: 更新文章，將封面圖 URL 寫入
      const finalData = {
        id: blogId,
        ...formData,
      };
      // 將封面圖 URL 併入最終的資料中
      if (coverImageUrl) {
        finalData.coverImage = coverImageUrl;
      }

      const updateResponse = await fetch("/api/blogs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(finalData),
      });

      if (!updateResponse.ok) {
        const updateErrorData = await updateResponse.json();
        const errorMessage = updateErrorData.error || "更新文章失敗";
        throw new Error(errorMessage);
      }

      const message =
        formData.status === "draft" ? "草稿已成功儲存！" : "文章已成功提交！";
      toast.success(message);
      router.push("/admin/admin_blogs");
    } catch (error) {
      console.error("提交文章失敗:", error);
      toast.error(`提交文章失敗：${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const initialData = {
    title: "",
    content: "",
    status: "draft",
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <p className="text-gray-600 ml-4">載入使用者資訊...</p>
      </div>
    );
  }

  return (
    <BlogForm
      initialData={initialData}
      onSave={handleSave}
      onCancel={handleCancel}
      saving={saving}
      onImageChange={handleImageChange}
      previewUrl={coverPreviewUrl}
    />
  );
};

export default BlogNewPage;
