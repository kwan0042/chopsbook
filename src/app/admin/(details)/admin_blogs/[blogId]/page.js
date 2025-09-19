"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";
import BlogForm from "@/components/admin/blogsManagement/blogForm";
import { AuthContext } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";
import { getAuth } from "firebase/auth";

const BlogDetailPage = () => {
  const { loadingUser, auth } = useContext(AuthContext);
  const router = useRouter();
  const { blogId } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWithToken = useCallback(async (url, options = {}) => {
    const user = getAuth().currentUser;
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
  }, []);

  const fetchArticle = useCallback(async () => {
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
      setInitialData(processedData);
    } catch (error) {
      console.error("載入文章失敗：", error);
      toast.error(`載入文章失敗: ${error.message}`);
      router.push("/admin/admin_blogs");
    } finally {
      setLoading(false);
    }
  }, [blogId, loadingUser, router, fetchWithToken]);

  useEffect(() => {
    if (!auth) return;
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
  }, [auth, fetchArticle, loadingUser, router]);

  if (loading || loadingUser || !initialData) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <p className="text-gray-600 ml-4">正在載入文章資料...</p>
      </div>
    );
  }

  return <BlogForm initialData={initialData} />;
};

export default BlogDetailPage;
