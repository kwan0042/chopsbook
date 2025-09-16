"use client";

import React, { useState, useContext } from "react";
import { AuthContext } from "@/lib/auth-context";
import { useForm } from "react-hook-form";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const BlogNewPage = () => {
  // 在這裡新增 currentUser
  const { db, appId, storage, loadingUser, currentUser } =
    useContext(AuthContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const previewTitle = watch("title");
  const previewContent = watch("content");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file);
      const fileUrl = URL.createObjectURL(file);
      setCoverPreviewUrl(fileUrl);
    }
  };

  const onSubmit = async (data) => {
    // 檢查 currentUser 是否存在
    if (loadingUser || !db || !appId || !storage || !currentUser) {
      toast.error("無法提交文章：使用者未登入或資料載入中。");
      return;
    }

    setLoading(true);
    let coverImageUrl = null;
    let blogId = null;

    try {
      const blogCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/blogs`
      );
      const docRef = await addDoc(blogCollectionRef, {});
      blogId = docRef.id;

      if (coverImageFile) {
        const imageRef = ref(storage, `public/blogs/${blogId}/cover`);
        const snapshot = await uploadBytes(imageRef, coverImageFile);
        coverImageUrl = await getDownloadURL(snapshot.ref);
      }

      const articleData = {
        title: data.title,
        content: data.content,
        coverImage: coverImageUrl,
        authorId: currentUser.uid,
        status: "pending",
        submittedAt: serverTimestamp(),
      };
      await updateDoc(
        doc(db, `artifacts/${appId}/public/data/blogs`, blogId),
        articleData
      );

      toast.success("文章已成功提交！");
      router.push("/admin/admin_blogs");
    } catch (error) {
      console.error("添加文章或圖片失敗:", error);
      toast.error("添加文章失敗，請重試。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-800">新增部落格文章</h2>
        <p className="text-sm text-gray-600 mt-1">
          在此填寫文章內容，並預覽發布後的樣貌。
        </p>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* 左側：預覽區 */}
        <div className="w-full lg:w-1/2 p-6 border-b lg:border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            {/* 預覽封面圖 */}
            {coverPreviewUrl && (
              <img
                src={coverPreviewUrl}
                alt="封面預覽"
                className="w-full h-auto object-cover rounded-lg mb-4"
              />
            )}
            {/* 預覽標題 */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {previewTitle || "預覽標題"}
            </h1>
            {/* 預覽作者與日期 */}
            <div className="text-sm text-gray-500 mb-6">
              作者: Admin • {new Date().toLocaleDateString("zh-TW")}
            </div>
            {/* 預覽內容 */}
            <p className="text-gray-700 leading-relaxed">
              {previewContent || "這裡會即時顯示您輸入的文章內容。"}
            </p>
          </div>
        </div>

        {/* 右側：編輯表單 */}
        <div className="w-full lg:w-1/2 p-6 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                文章標題
              </label>
              <input
                id="title"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                {...register("title", { required: "文章標題為必填項目" })}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700"
              >
                詳細內容
              </label>
              <input
                id="content"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                {...register("content", { required: "文章內容為必填項目" })}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.content.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="coverImage"
                className="block text-sm font-medium text-gray-700"
              >
                封面圖
              </label>
              <input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                取消
              </button>
              <button
                type="submit"
                className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : "發布文章"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlogNewPage;
