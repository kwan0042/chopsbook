// src/components/admin/blogsManagement/blogForm.js

"use client";

import React, { useState, useEffect } from "react";
// ✅ 關鍵修改：引入 formatDateTime 函式
import { formatDateTime } from "@/hooks/auth/useUtils";

const BlogForm = ({
  initialData,
  onSave,
  onCancel,
  saving,
  onImageChange,
  previewUrl,
}) => {
  const [formData, setFormData] = useState(
    initialData || {
      title: "",
      content: "",
      status: "draft", // 預設狀態設為草稿
      authorId: "",
    }
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // 處理草稿儲存的函式
  const handleSaveAsDraft = () => {
    // 呼叫父元件的 onSave 函式，並傳入 'draft' 狀態
    onSave({ ...formData, status: "draft" });
  };

  // 處理發布文章的函式
  const handlePublish = () => {
    // 呼叫父元件的 onSave 函式，並傳入 'published' 狀態
    onSave({ ...formData, status: "published" });
  };

  // ✅ 關鍵修改：現在直接使用從 useUtils 引入的 formatDateTime
  const formatReviewedAt = (date) => {
    return formatDateTime(date);
  };

  const previewTitle = formData?.title || "預覽標題";
  const previewContent =
    formData?.content || "這裡會即時顯示您輸入的文章內容。";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-800">
          {formData?.id ? "編輯部落格文章" : "新增部落格文章"}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          在此填寫文章內容，並預覽發布後的樣貌。
        </p>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* 左側：預覽區 */}
        <div className="w-full lg:w-1/2 p-6 border-b lg:border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            {/* 審批資訊區塊，只在編輯模式且有 reviewedAt 時顯示 */}
            {formData?.id && formData?.reviewedAt && (
              <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md border border-green-200">
                <p className="font-semibold">已審批</p>
                <p>審批日期: {formatReviewedAt(formData.reviewedAt)}</p>
                <p>
                  審批管理員 ID:{" "}
                  <span className="font-mono text-xs">
                    {formData.reviewedBy}
                  </span>
                </p>
              </div>
            )}

            {/* 預覽封面圖 */}
            {previewUrl && (
              <img
                src={previewUrl}
                alt="封面預覽"
                className="w-full h-auto object-cover rounded-lg mb-4"
              />
            )}

            {/* 預覽標題 */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {previewTitle}
            </h1>

            {/* 預覽作者與日期 */}
            <div className="text-sm text-gray-500 mb-6">
              作者: Admin •{" "}
              {formData.submittedAt
                ? formData.submittedAt.toLocaleDateString("zh-TW")
                : new Date().toLocaleDateString("zh-TW")}
            </div>

            {/* 預覽內容 */}
            <p className="text-gray-700 leading-relaxed">{previewContent}</p>
          </div>
        </div>

        {/* 右側：編輯表單 */}
        <div className="w-full lg:w-1/2 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                文章標題
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700"
              >
                詳細內容
              </label>
              <textarea
                id="content"
                name="content"
                rows="10"
                value={formData.content || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              ></textarea>
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
                onChange={onImageChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
            </div>

            {/* 按鈕區塊：新增「儲存草稿」按鈕 */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={saving}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveAsDraft}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={saving}
              >
                {saving ? "儲存中..." : "儲存草稿"}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={saving}
              >
                {saving ? "發布中..." : "發布文章"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogForm;
