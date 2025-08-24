// src/app/login/page.js
"use client";

import React, { useContext, useState, useCallback } from "react";
import { AuthContext } from "../../lib/auth-context"; // 注意路徑變為相對路徑
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  // 將 signIn 和 signUp 改為 login 和 signup，以匹配 AuthContext 提供的函式名稱
  const { login, signup, loadingUser, modalMessage, setModalMessage } =
    useContext(AuthContext); // 使用 loadingUser
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false); // 控制是登入還是註冊模式
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLocalLoading(true);
      setModalMessage(""); // 清除之前的訊息

      try {
        if (isRegisterMode) {
          await signup(email, password); // 使用正確的 signup 函式
          setModalMessage("註冊成功！請登入。");
          setIsRegisterMode(false); // 註冊成功後切換回登入模式
        } else {
          await login(email, password); // 使用正確的 login 函式
          setModalMessage("登入成功！");
          router.push("/"); // 登入成功後導航到首頁
        }
      } catch (error) {
        // 錯誤已由 AuthProvider 中的 setModalMessage 處理
        console.error("處理認證失敗:", error);
      } finally {
        setLocalLoading(false);
      }
    },
    // 更新依賴陣列為 login 和 signup
    [email, password, isRegisterMode, login, signup, router, setModalMessage]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isRegisterMode ? "註冊帳戶" : "登入 Chopsbook"}
        </h1>

        {/* 顯示來自 AuthContext 的訊息 */}
        {modalMessage && (
          <p
            className={`mb-4 text-center text-sm ${
              modalMessage.includes("成功") ? "text-green-600" : "text-red-600"
            }`}
          >
            {modalMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              電子郵件
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loadingUser || localLoading} // 使用 loadingUser
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              密碼
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loadingUser || localLoading} // 使用 loadingUser
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={loadingUser || localLoading} // 使用 loadingUser
          >
            {localLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : isRegisterMode ? (
              "註冊"
            ) : (
              "登入"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isRegisterMode ? "已經有帳戶了？" : "還沒有帳戶？"}
          <button
            type="button"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="font-medium text-indigo-600 hover:text-indigo-500 ml-1 focus:outline-none"
            disabled={loadingUser || localLoading} // 使用 loadingUser
          >
            {isRegisterMode ? "登入" : "註冊"}
          </button>
        </p>
        <div className="mt-4 text-center">
          <Link href="/" passHref>
            <button
              className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
              disabled={loadingUser || localLoading} // 使用 loadingUser
            >
              返回首頁
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
