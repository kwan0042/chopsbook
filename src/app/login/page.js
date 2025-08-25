// src/app/login/page.js
"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../lib/auth-context.js"; // 已確認的相對路徑
// 已徹底移除 useRouter 的引入，改用 window.location.href 進行導航

// 內聯 SVG 圖標定義
const MailIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
    <path d="m22 7-8.97 5.72C11 13.14 7 13.14 2 7"></path>
  </svg>
);

const LockIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const PhoneIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.57 2.06.88 4.18.9 6.31a.9.9 0 0 1-1.25 1.13c-.84-.5-1.93-.2-2.39.23a10.03 10.03 0 0 0 5.43 5.43c.43-.46.73-1.55.22-2.39a.9.9 0 0 1 1.13-1.25c2.13.02 4.25.33 6.31.9a2 2 0 0 1 1.72 2z"></path>
  </svg>
);

const UserIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LogInIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
    <polyline points="10 17 15 12 10 7"></polyline>
    <line x1="15" y1="12" x2="3" y2="12"></line>
  </svg>
);

const UserPlusIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <line x1="22" y1="11" x2="16" y2="11"></line>
    <line x1="19" y1="8" x2="19" y2="14"></line>
  </svg>
);

const XIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const RefreshCwIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 0 1-9 9c-2.49 0-4.83-1.09-6.49-3L3 17"></path>
    <path d="M3 12a9 9 0 0 1 9-9c2.49 0 4.83 1.09 6.49 3L21 7"></path>
    <path d="M10 7v5h5"></path>
  </svg>
);

const LoginPage = () => {
  const {
    login,
    signup,
    loadingUser,
    setModalMessage,
    currentUser,
    sendPasswordReset,
  } = useContext(AuthContext);
  // router 已移除，改用 window.location.href

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // 移除了 phoneNumber 和 username 狀態
  // const [phoneNumber, setPhoneNumber] = useState('');
  // const [username, setUsername] = useState('');
  const [error, setError] = useState("");
  const [emailVerifiedMessage, setEmailVerifiedMessage] = useState("");
  const [hasCheckedEmailVerified, setHasCheckedEmailVerified] = useState(false);

  // 新增狀態用於「忘記密碼」功能
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  // 偵測 currentUser 的電郵驗證狀態，並在驗證成功後跳轉
  useEffect(() => {
    if (!loadingUser && currentUser && !hasCheckedEmailVerified) {
      if (currentUser.emailVerified) {
        setEmailVerifiedMessage("電郵已成功驗證！3秒後將跳轉至主頁。");
        setHasCheckedEmailVerified(true);
        const timer = setTimeout(() => {
          window.location.href = "/"; // 改用 window.location.href 導航
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [currentUser, loadingUser, hasCheckedEmailVerified]); // router 已移除

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRegistering) {
      if (password !== confirmPassword) {
        setError("密碼和確認密碼不一致！");
        return;
      }
      try {
        await signup(email, password); // 更新 signup 呼叫，不再傳遞 phoneNumber 和 username
        // AuthContext 中的 setModalMessage 會顯示成功訊息和電郵驗證提示
        // 註冊成功後，讓用戶知道需要檢查電郵，不立即跳轉
      } catch (err) {
        setError(err.message);
      }
    } else {
      try {
        await login(email, password);
        // 登入成功後，直接跳轉到主頁
        window.location.href = "/"; // 改用 window.location.href 導航
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // 處理忘記密碼功能
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetMessage("");

    if (!resetEmail) {
      setResetError("請輸入您的電子郵件地址。");
      return;
    }

    try {
      await sendPasswordReset(resetEmail);
      setResetMessage("重設密碼電郵已發送！請檢查您的郵箱。");
      setResetEmail(""); // 清空輸入框
    } catch (err) {
      setResetError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4 font-inter">
      <div className="bg-white rounded-xl shadow-2xl p-8 md:p-10 w-full max-w-md relative">
        {/* 取消按鈕 */}
        <button
          onClick={() => (window.location.href = "/")} // 改用 window.location.href 導航
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="取消並返回主頁"
        >
          <XIcon size={24} />
        </button>

        {/* 標題 */}
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {isRegistering ? "註冊帳戶" : "登入"}
        </h2>

        {/* 登入/註冊切換按鈕 */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => {
              setIsRegistering(false);
              setShowForgotPassword(false);
              setError("");
            }}
            className={`px-6 py-2 rounded-l-lg transition-all duration-300 ${
              !isRegistering
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            登入
          </button>
          <button
            onClick={() => {
              setIsRegistering(true);
              setShowForgotPassword(false);
              setError("");
            }}
            className={`px-6 py-2 rounded-r-lg transition-all duration-300 ${
              isRegistering
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            註冊
          </button>
        </div>

        {/* 錯誤訊息顯示 */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* 電郵驗證成功訊息顯示 */}
        {emailVerifiedMessage && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4 text-sm"
            role="alert"
          >
            {emailVerifiedMessage}
          </div>
        )}

        {/* 忘記密碼功能 */}
        {showForgotPassword ? (
          <div className="space-y-5">
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-4">
              重設密碼
            </h3>
            {resetError && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 text-sm"
                role="alert"
              >
                {resetError}
              </div>
            )}
            {resetMessage && (
              <div
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4 text-sm"
                role="alert"
              >
                {resetMessage}
              </div>
            )}
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="relative">
                <MailIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  placeholder="請輸入您的註冊電郵"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loadingUser}
                className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition-all duration-300 flex items-center justify-center ${
                  loadingUser
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                }`}
              >
                <RefreshCwIcon className="mr-2" size={20} />
                發送重設電郵
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                返回登入
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 電子郵件 */}
            <div className="relative">
              <MailIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                placeholder="電子郵件"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* 密碼 */}
            <div className="relative">
              <LockIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="password"
                placeholder="密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* 忘記密碼連結 (只在登入模式下顯示) */}
            {!isRegistering && (
              <div className="text-right text-sm">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  忘記密碼？
                </button>
              </div>
            )}

            {/* 確認密碼 (僅註冊時顯示) */}
            {isRegistering && (
              <div className="relative">
                <LockIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="password"
                  placeholder="確認密碼"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            )}

            {/* 註冊時不再詢問電話號碼和用戶名稱 */}
            {/* {isRegistering && (
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  placeholder="電話號碼 (選填)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            )} */}

            {/* {isRegistering && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="用戶名稱 (選填)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            )} */}

            {/* 提交按鈕 */}
            <button
              type="submit"
              disabled={loadingUser}
              className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition-all duration-300 flex items-center justify-center ${
                loadingUser
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-lg"
              }`}
            >
              {loadingUser && (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              )}
              {isRegistering ? (
                <>
                  <UserPlusIcon className="mr-2" size={20} />
                  註冊
                </>
              ) : (
                <>
                  <LogInIcon className="mr-2" size={20} />
                  登入
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
