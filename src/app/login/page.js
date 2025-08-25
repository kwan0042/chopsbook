// src/app/login/page.js
"use client";

import React, { useContext, useState, useCallback, useEffect } from "react";
import { AuthContext } from "../../lib/auth-context"; // 注意路徑變為相對路徑
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  // 將 signIn 和 signUp 改為 login 和 signup，以匹配 AuthContext 提供的函式名稱
  const { login, signup, loadingUser, currentUser } = useContext(AuthContext); // 移除 modalMessage 和 setModalMessage
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false); // 控制是登入還是註冊模式
  const [localLoading, setLocalLoading] = useState(false);
  const [loginResult, setLoginResult] = useState(null); // 新增：登入結果狀態
  const [localMessage, setLocalMessage] = useState(""); // 本地訊息狀態

  // 監控 loginResult 狀態變化
  useEffect(() => {
    console.log("LoginPage: loginResult state changed:", loginResult);
  }, [loginResult]);

  // 監聽認證狀態變化，當用戶登入成功後設置成功狀態
  useEffect(() => {
    console.log(
      "useEffect triggered - currentUser:",
      currentUser,
      "loginResult:",
      loginResult
    );
    if (currentUser && !loginResult) {
      console.log("User authenticated, setting success state...");
      setLoginResult({
        success: true,
        message: "登入成功！2秒後自動跳轉到主頁...",
      });
    }
  }, [currentUser, loginResult]);

  // 監聽認證狀態變化，當用戶登入成功後自動跳轉
  useEffect(() => {
    console.log(
      "Countdown useEffect triggered - currentUser:",
      currentUser,
      "loginResult:",
      loginResult
    );
    if (currentUser && loginResult?.success) {
      console.log("User authenticated, starting countdown...");
      const timer = setTimeout(() => {
        console.log("Countdown completed, navigating to home...");
        router.push("/");
      }, 2000);
      return () => {
        console.log("Cleaning up countdown timer...");
        clearTimeout(timer);
      };
    }
  }, [currentUser, loginResult, router]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      console.log("handleSubmit called, isRegisterMode:", isRegisterMode);
      setLocalLoading(true);
      setLocalMessage(""); // 清除之前的訊息
      setLoginResult(null); // 清除之前的登入結果

      try {
        if (isRegisterMode) {
          console.log("Attempting signup...");
          await signup(email, password); // 使用正確的 signup 函式
          setLocalMessage("註冊成功！請登入。");
          setIsRegisterMode(false); // 註冊成功後切換回登入模式
          // 清除表單
          setEmail("");
          setPassword("");
        } else {
          console.log("Attempting login...");
          await login(email, password); // 使用正確的 login 函式
          console.log("Login successful, waiting for auth state change...");
          // 不再手動設置 loginResult，讓 useEffect 監聽認證狀態變化
        }
      } catch (error) {
        // 錯誤已由 AuthProvider 中的 setModalMessage 處理
        console.error("處理認證失敗:", error);
        console.log("Error code:", error.code);
        console.log("Error message:", error.message);
        console.log("Error object:", error);

        // 根據錯誤類型和模式提供更具體的錯誤訊息
        let errorMessage = isRegisterMode
          ? "註冊失敗，請稍後再試"
          : "登入失敗，請檢查您的帳號密碼";

        if (error.code === "auth/user-not-found") {
          errorMessage =
            "沒有找到此電子郵件的用戶。請檢查電子郵件或註冊新帳戶。";
        } else if (error.code === "auth/wrong-password") {
          errorMessage = "密碼錯誤。請重新輸入。";
        } else if (error.code === "auth/invalid-credential") {
          errorMessage = "電子郵件或密碼錯誤。請檢查您的登入資訊。";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "無效的電子郵件格式。請輸入有效的電子郵件。";
        } else if (error.code === "auth/too-many-requests") {
          errorMessage = "嘗試次數過多。請稍後再試。";
        } else if (error.code === "auth/user-disabled") {
          errorMessage = "此帳戶已被停用。請聯繫管理員。";
        } else if (error.code === "auth/network-request-failed") {
          errorMessage = "網路連線失敗。請檢查您的網路連線。";
        } else if (error.code === "auth/email-already-in-use") {
          errorMessage = "此電子郵件已被使用。請使用其他電子郵件或嘗試登入。";
        } else if (error.code === "auth/weak-password") {
          errorMessage = "密碼強度不足。請使用至少6個字符的密碼。";
        } else if (error.message) {
          errorMessage = error.message;
        }

        console.log("Final error message:", errorMessage);

        if (isRegisterMode) {
          // 註冊失敗時，直接顯示錯誤訊息
          console.log(
            "Setting local message for signup failure:",
            errorMessage
          );
          setLocalMessage(errorMessage);
        } else {
          // 登入失敗時，設置登入結果狀態
          console.log("Setting loginResult for login failure:", {
            success: false,
            message: errorMessage,
            errorCode: error.code,
          });

          // 強制更新狀態，確保 useEffect 能觸發
          setTimeout(() => {
            console.log("Executing setTimeout callback to set loginResult");
            setLoginResult({
              success: false,
              message: errorMessage,
              errorCode: error.code,
            });
          }, 100);
        }
      } finally {
        setLocalLoading(false);
        console.log("handleSubmit completed, localLoading set to false");
      }
    },
    // 更新依賴陣列為 login 和 signup
    [email, password, isRegisterMode, login, signup]
  );

  // 新增：重置登入結果，回到登入表單
  const handleBackToLogin = () => {
    setLoginResult(null);
    setEmail("");
    setPassword("");
  };

  // 如果正在顯示登入結果，則顯示結果頁面
  console.log(
    "LoginPage render - loginResult:",
    loginResult,
    "currentUser:",
    currentUser
  );
  if (loginResult) {
    console.log("Rendering login result page:", loginResult);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {loginResult.success ? "登入成功" : "登入失敗"}
          </h1>

          <div className="text-center mb-6">
            <div
              className={`text-lg mb-4 ${
                loginResult.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {loginResult.success ? (
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <p>{loginResult.message}</p>
            </div>
          </div>

          {!loginResult.success && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      登入失敗
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{loginResult.message}</p>
                      {loginResult.errorCode && (
                        <p className="mt-1 text-xs text-red-600">
                          錯誤代碼: {loginResult.errorCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 保留註冊按鈕 */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLoginResult(null);
                    setIsRegisterMode(true);
                  }}
                  className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                >
                  註冊新帳戶
                </button>
              </div>

              <button
                onClick={handleBackToLogin}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                返回登入畫面
              </button>
            </div>
          )}

          <div className="mt-4 text-center">
            <Link href="/" passHref>
              <button className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none">
                返回首頁
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isRegisterMode ? "註冊帳戶" : "登入 Chopsbook"}
        </h1>

        {/* 顯示來自 AuthContext 的訊息 */}
        {localMessage && (
          <p
            className={`mb-4 text-center text-sm ${
              localMessage.includes("成功") ? "text-green-600" : "text-red-600"
            }`}
          >
            {localMessage}
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
              disabled={loadingUser || localLoading}
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
              disabled={loadingUser || localLoading}
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={loadingUser || localLoading}
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
            disabled={loadingUser || localLoading}
          >
            {isRegisterMode ? "登入" : "註冊"}
          </button>
        </p>
        <div className="mt-4 text-center">
          <Link href="/" passHref>
            <button
              className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
              disabled={loadingUser || localLoading}
            >
              返回首頁
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
