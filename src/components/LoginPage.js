// src/components/LoginPage.js
"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../lib/auth-context"; // 確保路徑正確
import LoadingSpinner from "./LoadingSpinner"; // 確保路徑正確
import { useRouter } from "next/navigation"; // 導入 useRouter 鉤子

/**
 * MailIcon: 簡單的郵件 SVG 圖示
 */
const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 4v7a2 2 0 002 2h14a2 2 0 002-2v-7m-18 0l-1-1m0 0l-1-1m1-1l1 1m0 0l1 1"
    />
  </svg>
);

/**
 * LockIcon: 簡單的鎖 SVG 圖示
 */
const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 7V6a2 2 0 012-2h2a2 2 0 012 2v1"
    />
  </svg>
);

/**
 * CloseIcon: 簡單的關閉 SVG 圖示
 */
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

/**
 * LoginPage: 用於用戶登入的組件。
 * @param {object} props - 組件屬性。
 * @param {function} props.onClose - 成功登入後關閉模態框的回調函數。
 */
const LoginPage = ({ onClose }) => {
  const { signIn, setModalMessage, auth } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const router = useRouter(); // 初始化 Next.js router

  useEffect(() => {
    setLocalError("");
  }, [email, password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError("");
    setModalMessage("");

    if (!auth) {
      setLocalError("Firebase 身份驗證服務未初始化。請稍後再試。");
      setLoading(false);
      return;
    }

    try {
      await signIn(email, password);
      setModalMessage("登入成功！歡迎回來。");
      onClose(); // 成功登入後關閉模態框
      router.push("/"); // 重新導航到首頁
    } catch (error) {
      console.error("登入失敗:", error);
      let errorMessage = "登入失敗，請檢查您的電子郵件和密碼是否正確。";
      if (error.code === "auth/user-not-found") {
        errorMessage = "沒有找到此電子郵件的用戶。請檢查電子郵件或註冊新帳戶。";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "密碼錯誤。請重新輸入。";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "無效的電子郵件格式。請輸入有效的電子郵件。";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "登入嘗試次數過多。請稍後再試。";
      }
      setLocalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative p-6 sm:p-8 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl max-w-md mx-auto border border-gray-100 font-inter">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors duration-200"
        aria-label="關閉登入視窗"
      >
        <CloseIcon />
      </button>

      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
        歡迎登入
      </h2>
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            電子郵件
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MailIcon />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="您的電子郵件地址"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            密碼
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockIcon />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="您的密碼"
            />
          </div>
        </div>

        {localError && (
          <p className="text-red-600 text-sm text-center font-medium bg-red-50 p-2 rounded-md border border-red-200">
            {localError}
          </p>
        )}

        <div>
          <button
            type="submit"
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" /> 載入中...
              </>
            ) : (
              "登入"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
