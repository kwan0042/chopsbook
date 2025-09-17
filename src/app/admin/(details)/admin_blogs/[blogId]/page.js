// src/app/admin/(details)/admin_blogs/[blogId]/page.js

"use client";

import React, { useState, useEffect, useContext } from "react";
import BlogForm from "@/components/admin/blogsManagement/blogForm";
import { AuthContext } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // ✅ 新增 Firebase Storage 客戶端 SDK

const BlogDetailPage = () => {
  const { loadingUser, auth } = useContext(AuthContext);
  const router = useRouter();
  const { blogId } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);

  const fetchWithToken = async (url, options = {}) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("使用者未登入。");
    }
    const token = await user.getIdToken();
    const headers = { ...options.headers, Authorization: `Bearer ${token}` };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || response.statusText;
      throw new Error(errorMessage);
    }
    return response.json();
  };

  useEffect(() => {
    if (!auth) {
      return;
    }

    const fetchArticle = async () => {
      if (!blogId || loadingUser) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetchWithToken(`/api/blogs?id=${blogId}`);
        const data = response.data;
        const processedData = {
          ...data,
          submittedAt: data.submittedAt?._seconds
            ? new Date(data.submittedAt._seconds * 1000)
            : null,
          reviewedAt: data.reviewedAt?._seconds
            ? new Date(data.reviewedAt._seconds * 1000)
            : null,
        };
        setArticle(processedData);
      } catch (error) {
        console.error("載入文章失敗:", error);
        toast.error(`載入文章失敗: ${error.message}`);
        router.push("/admin/admin_blogs");
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchArticle();
      } else {
        if (!loadingUser) {
          toast.error("未授權，請重新登入。");
          router.push("/admin");
        }
      }
    });
    return () => unsubscribe();
  }, [blogId, loadingUser, router, auth]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file);
      setCoverPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (formData) => {
    if (!auth || !auth.currentUser) {
      console.error("無法儲存文章：用戶未登入或認證實例不可用。");
      toast.error("儲存文章失敗：請先登入。");
      setSaving(false);
      return;
    }

    setSaving(true);
    let updatedData = { ...formData, id: blogId };

    try {
      // ✅ 新增: 如果有新選擇的封面圖，則使用前端上傳
      if (coverImageFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `public/blogs/${blogId}/cover`);
        await uploadBytes(storageRef, coverImageFile);
        updatedData.coverImage = await getDownloadURL(storageRef);
      }

      // ✅ 修正: 移除舊的後端上傳邏輯
      // if (coverImageFile) { ... 舊的程式碼 ... }

      await fetchWithToken("/api/blogs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const message =
        updatedData.status === "draft"
          ? "草稿已成功儲存！"
          : "文章已成功更新並發布！";
      toast.success(message);

      router.push("/admin/admin_blogs");
    } catch (error) {
      console.error("儲存文章失敗:", error);
      toast.error(`儲存文章失敗: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading || loadingUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <p className="text-gray-600 ml-4">正在載入文章資料...</p>
      </div>
    );
  }

  if (!article) {
    return <p className="text-center p-8 text-gray-500">找不到文章。</p>;
  }

  return (
    <BlogForm
      initialData={article}
      onSave={handleSave}
      onCancel={handleCancel}
      saving={saving}
      onImageChange={handleImageChange}
      previewUrl={coverPreviewUrl || article.coverImage}
    />
  );
};

export default BlogDetailPage;
