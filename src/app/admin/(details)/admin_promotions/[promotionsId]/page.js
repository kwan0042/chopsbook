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
  // 【新增】管理儲存狀態
  const [saving, setSaving] = useState(false);

  const fetchWithToken = useCallback(async (url, options = {}) => {
    const user = getAuth().currentUser;
    if (!user) {
      throw new Error("使用者未登入。");
    }
    const token = await user.getIdToken();
    const headers = { ...options.headers, Authorization: `Bearer ${token}` };
    const response = await fetch(url, { ...options, headers });

    // =======================================================
    // 【關鍵修正】: 避免在回應無內容時嘗試解析 JSON
    // =======================================================
    if (!response.ok) {
      // 處理錯誤：嘗試解析 JSON 錯誤訊息，否則使用狀態文字
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || response.statusText;
      throw new Error(errorMessage);
    }

    // 檢查回應是否可能為空 (如 204 No Content，或無內容類型)
    const contentType = response.headers.get("content-type");
    if (
      response.status === 204 ||
      (contentType && !contentType.includes("application/json"))
    ) {
      return {}; // 返回空物件，避免解析錯誤
    }

    // 如果有內容且是成功的狀態碼，則解析 JSON
    return response.json();
    // =======================================================
  }, []);

  const fetchArticle = useCallback(async () => {
    if (!blogId || loadingUser) {
      setLoading(false);
      return;
    }
    try {
      // 這裡的 fetchWithToken 會成功解析 JSON
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

  // 【新增】文章儲存/更新邏輯
  const handleSave = useCallback(
    async (formData) => {
      setSaving(true); // 開始儲存
      try {
        if (!formData.id) {
          throw new Error("文章ID遺失，無法更新。");
        }

        // 確保 timestamp 格式正確，將 Date 物件轉換為時間戳 (如果您的 API 需要)
        const dataToSave = {
          ...formData,
          submittedAt:
            formData.submittedAt instanceof Date
              ? formData.submittedAt.getTime()
              : formData.submittedAt,
          reviewedAt:
            formData.reviewedAt instanceof Date
              ? formData.reviewedAt.getTime()
              : formData.reviewedAt,
          updatedAt: Date.now(), // 紀錄更新時間
        };

        // 執行 API 更新操作
        // 這裡調用 fetchWithToken，現在它會正確處理空回應
        await fetchWithToken(`/api/blogs?id=${formData.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSave),
        });

        toast.success(
          `文章 "${formData.title}" 已成功更新為 ${
            formData.status === "draft" ? "草稿" : "待審核"
          }！`
        );
        // 重新載入文章資料以更新 UI
        await fetchArticle();
      } catch (error) {
        console.error("文章更新失敗:", error);
        toast.error(`文章更新失敗: ${error.message}`);
      } finally {
        setSaving(false); // 結束儲存
      }
    },
    [fetchWithToken, fetchArticle]
  );

  // 【新增】取消邏輯
  const handleCancel = useCallback(() => {
    router.push("/admin/admin_blogs");
  }, [router]);

  if (loading || loadingUser || !initialData) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <p className="text-gray-600 ml-4">正在載入文章資料...</p>
      </div>
    );
  }

  return (
    <BlogForm
      initialData={initialData}
      onSave={handleSave}
      onCancel={handleCancel}
      saving={saving}
    />
  );
};

export default BlogDetailPage;
