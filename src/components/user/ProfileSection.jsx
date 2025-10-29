// src/components/user/ProfileSection.js
"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faCheck } from "@fortawesome/free-solid-svg-icons";

/**
 * 通用的個人檔案區塊組件，支援多個可編輯欄位，包含主欄位與側邊欄位。
 * @param {object} props
 * @param {string} props.title - 區塊標題
 * @param {boolean} props.isEditable - 是否可編輯
 * @param {function} props.onSave - 儲存時的回調函數
 * @param {object} props.mainField - 主欄位 (e.g., intro)
 * @param {Array<object>} props.sideFields - 側邊欄位陣列 (e.g., occupation, tastes)
 */
const ProfileSection = ({
  title,
  isEditable,
  onSave,
  mainField,
  sideFields,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValues, setInputValues] = useState({});

  useEffect(() => {
    const initialValues = {};
    if (mainField) {
      initialValues[mainField.key] = mainField.value || "";
    }
    sideFields.forEach((field) => {
      initialValues[field.key] = field.value || "";
    });
    setInputValues(initialValues);
  }, [mainField, sideFields]);

  const handleSave = () => {
    const updates = {};
    let hasChanges = false;

    // 檢查主欄位
    if (mainField && inputValues[mainField.key] !== mainField.value) {
      updates[mainField.key] = inputValues[mainField.key];
      hasChanges = true;
    }

    // 檢查側邊欄位
    sideFields.forEach((field) => {
      if (inputValues[field.key] !== field.value) {
        updates[field.key] = inputValues[field.key];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      onSave(updates);
    }
    setIsEditing(false);
  };

  const handleInputChange = (key, value) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveButtonClick = (e) => {
    e.preventDefault(); // <-- 避免按鈕觸發onBlur
    handleSave();
  };

  const handleEditButtonClick = (e) => {
    e.preventDefault(); // <-- 避免按鈕觸發onBlur
    setIsEditing(true);
  };

  const renderField = (field) => {
    if (field.isTextArea) {
      return (
        <div key={field.key} className="flex-1">
          <p className="text-gray-500 text-sm font-medium mb-1 whitespace-pre-wrap">
            {field.label}
          </p>
          {isEditing ? (
            <textarea
              value={inputValues[field.key]}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              // 確保文字換行 (whitespace-normal)
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors h-32 resize-none break-words whitespace-normal"
            />
          ) : (
            // 閱讀模式下也要確保文字換行
            <p className="text-gray-600 whitespace-pre-wrap break-words">
              {inputValues[field.key] || "-"}
            </p>
          )}
        </div>
      );
    }

    return (
      <div key={field.key} className="flex items-center">
        <p className="text-gray-500 text-sm font-medium whitespace-nowrap mr-2">
          {field.label}:
        </p>
        {isEditing ? (
          <input
            type="text"
            value={inputValues[field.key]}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm w-full"
          />
        ) : (
          <p className="text-gray-600 flex-1">
            {inputValues[field.key] || "-"}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="border-white border-5 p-4 pt-2 rounded-lg ">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        {isEditable && (
          <button
            onClick={isEditing ? handleSaveButtonClick : handleEditButtonClick}
            className="text-blue-600 hover:text-blue-800"
          >
            <FontAwesomeIcon
              icon={isEditing ? faCheck : faPenToSquare}
              className="mr-2"
            />
            {isEditing ? "儲存" : "編輯"}
          </button>
        )}
      </div>

      <div className="flex flex-row gap-2 w-full">
        {/* 主欄位 (個人簡介) 
          - flex-1: 允許它壓縮並佔據剩餘空間 (滿足 "可壓縮")
          - min-w-0: 關鍵，確保它不會因為內容導致溢出 (滿足 "flex-row不要溢出父") 
        */}
        <div className="flex-1 min-w-0 md:w-3/4">
          {mainField && renderField(mainField)}
        </div>

        {/* 側邊欄位 (職業、口味、居住城市) 
          - flex-shrink-0: 不壓縮 (滿足 "側邊欄位不壓縮")
        */}
        <div className="space-y-4 flex-shrink-0 md:w-1/4 mx-2">
          {sideFields.map(renderField)}
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
