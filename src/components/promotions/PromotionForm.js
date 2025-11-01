"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import PromotionPreview from "./PromotionPreview"; 

// 輔助組件：Input
const Input = ({ label, name, register, error, type = "text", className = "", required = false, rules = {} }) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      {...register(name, rules)} 
      className={`mt-1 block w-full border ${
        error ? "border-red-500" : "border-gray-300"
      } rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500`}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
  </div>
);

// 輔助組件：TextArea
const TextArea = ({ label, name, register, error, rows = 8, required = false, rules = {} }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      {...register(name, rules)} 
      rows={rows}
      className={`mt-1 block w-full border ${
        error ? "border-red-500" : "border-gray-300"
      } rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 resize-none`}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    <p className="mt-1 text-xs text-gray-500">支援 HTML 標籤（如 &lt;h1&gt;, &lt;p&gt;, &lt;hr /&gt;, &lt;ul&gt;）</p>
  </div>
);


const PromotionForm = ({
  initialData,
  onSave,
  onCancel,
  saving,
  onImageChange,
  previewUrl,
}) => {
  const fileInputRef = useRef(null);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setValue,
  } = useForm({
    mode: "onChange", 
    defaultValues: initialData || {
      title: "",
      subtitle: "",
      content: "",
      coverImage: "",
      promoStart: "",
      promoEnd: "",
      status: "draft",
      priority: 0, 
    },
  });

  // 觀察表單變動以更新預覽
  const watchedFields = watch();

  useEffect(() => {
    // 初始化表單狀態，如果提供 initialData
    if (initialData) {
      setValue("title", initialData.title || "");
      setValue("subtitle", initialData.subtitle || "");
      setValue("content", initialData.content || "");
      setValue("promoStart", initialData.promoStart || "");
      setValue("promoEnd", initialData.promoEnd || "");
      setValue("status", initialData.status || "draft");
      setValue("priority", initialData.priority || 0);
    }
  }, [initialData, setValue]);

  const onSubmit = (data) => {
    // 在儲存時，將狀態設定為 pending (待處理)
    onSave({ ...data, status: "pending" });
  };
  
  // 處理圖片上傳按鈕點擊
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // 原生 RHF 驗證規則定義
  const validationRules = {
      title: { required: "標題為必填項目" },
      subtitle: { required: "副標題為必填項目" },
      content: { required: "活動內容為必填項目" },
      promoStart: { required: "開始日期為必填項目" },
      // promoEnd 不要求必填
      priority: { 
          required: "優先級為必填項目",
          min: { value: 0, message: "最小為 0" },
          validate: value => (!isNaN(value) && Number.isInteger(Number(value))) || "優先級必須是整數數字"
      },
      status: { required: "狀態為必填項目" },
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {initialData ? "編輯推廣活動" : "新增推廣活動"}
      </h1>

      {/* 💡 佈局變更：grid-cols-1 lg:grid-cols-2 實現左右並列 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 左側：編輯區 */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-xl h-full"> 
          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* 標題與副標題 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="推廣標題"
                    name="title"
                    register={register}
                    error={errors.title}
                    required={true}
                    rules={validationRules.title}
                />
                <Input
                    label="推廣副標題 (餐廳名稱/類別)"
                    name="subtitle"
                    register={register}
                    error={errors.subtitle}
                    required={true}
                    rules={validationRules.subtitle}
                />
            </div>
            
            {/* 日期與優先級 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                    label="開始日期 (例如：2025年10月25日)"
                    name="promoStart"
                    register={register}
                    error={errors.promoStart}
                    required={true}
                    rules={validationRules.promoStart}
                />
                <Input
                    label="結束日期 (留空則為長期)"
                    name="promoEnd"
                    register={register}
                    error={errors.promoEnd}
                    required={false}
                    rules={validationRules.promoEnd}
                />
                <Input
                    label="優先級 (數字，越高越前)"
                    name="priority"
                    type="number"
                    register={register}
                    error={errors.priority}
                    required={true}
                    rules={validationRules.priority}
                />
                <Input
                    label="狀態 (草稿/待處理/已發佈)"
                    name="status"
                    register={register}
                    error={errors.status}
                    required={true}
                    rules={validationRules.status}
                />
            </div>

            {/* 封面圖片 */}
            <div className="mb-6 border p-4 rounded-md bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    封面圖片 (建議 4:3 或 16:9 橫向圖片)
                </label>
                <div className="flex items-center space-x-4">
                    {/* 預覽圖 */}
                    {(previewUrl || watchedFields.coverImage) && (
                        <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-gray-200">
                            <img
                                src={previewUrl || watchedFields.coverImage}
                                alt="封面預覽"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    {/* 檔案上傳按鈕 */}
                    <button
                        type="button"
                        onClick={handleFileUploadClick}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
                    >
                        {previewUrl || watchedFields.coverImage ? "更換圖片" : "上傳圖片"}
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={onImageChange}
                        className="hidden"
                    />
                </div>
                {/* 顯示現有圖片 URL (如果沒有上傳新圖片) */}
                {watchedFields.coverImage && !previewUrl && (
                    <p className="mt-2 text-xs text-gray-500 truncate">
                        現有 URL: {watchedFields.coverImage}
                    </p>
                )}
            </div>

            {/* 活動內容 (HTML 格式) */}
            <TextArea
                label="活動內容 (支援 HTML)"
                name="content"
                register={register}
                error={errors.content}
                required={true}
                rules={validationRules.content}
            />

            {/* 動作按鈕 */}
            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={saving}
              >
                取消
              </button>
              <button
                type="submit"
                className={`px-6 py-2 text-sm font-medium rounded-md text-white transition-colors duration-200 ${
                  saving || !isValid
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={saving || !isValid}
              >
                {saving ? "儲存中..." : "儲存為草稿 / 待審批"}
              </button>
            </div>
          </form>
        </div>

        {/* 右側：預覽區 */}
        {/* 💡 設置固定高度 h-[80vh] 和 sticky top-8，確保預覽區可視且與左側對齊 */}
        <div className="lg:col-span-1 h-[80vh] sticky top-8">
            
            <PromotionPreview 
                data={watchedFields} 
                previewUrl={previewUrl}
            />
        </div>
      </div>
    </div>
  );
};

export default PromotionForm;