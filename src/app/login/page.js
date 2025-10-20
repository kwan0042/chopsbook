// src/app/login/page.js
"use client";

import React, { useContext, useState, useCallback, useEffect } from "react";
import { AuthContext } from "../../lib/auth-context"; // 確保路徑正確
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, signOut } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faFacebook } from "@fortawesome/free-brands-svg-icons";

export default function LoginPage() {
  const {
    login,
    signupWithGoogle,
    loginWithFacebook,
    sendPasswordReset, // <--- 1. 引入 sendPasswordReset
    setModalMessage, // <--- 2. 引入 setModalMessage (用於提示)
    loadingUser,
    currentUser,
  } = useContext(AuthContext);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [loginResult, setLoginResult] = useState(null);

  useEffect(() => {
    if (currentUser && !loginResult) {
      if (!currentUser.emailVerified) {
        const auth = getAuth();
        signOut(auth)
          .then(() => {
            setLoginResult({
              success: false,
              message: "你的電子郵件尚未驗證，請檢查信箱並完成驗證。",
              isEmailUnverified: true,
            });
          })
          .catch((error) => {
            console.error("登出失敗:", error);
            setLoginResult({
              success: false,
              message:
                "你的電子郵件尚未驗證，但登出時發生錯誤。請重新整理頁面。",
              isEmailUnverified: true,
            });
          });
      } else {
        setLoginResult({
          success: true,
          message: "登入成功！2秒後自動跳轉到主頁...",
        });
      }
    }
  }, [currentUser, loginResult]);

  useEffect(() => {
    if (currentUser && loginResult?.success) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 2000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [currentUser, loginResult, router]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLocalLoading(true);
      setLoginResult(null);

      try {
        await login(email, password);
      } catch (error) {
        let errorMessage = "登入失敗，請檢查您的帳號密碼";
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
        } else if (error.message) {
          errorMessage = error.message;
        }
        setLoginResult({
          success: false,
          message: errorMessage,
          errorCode: error.code,
        });
      } finally {
        setLocalLoading(false);
      }
    },
    [email, password, login]
  );

  const handleGoogleLogin = useCallback(async () => {
    setLocalLoading(true);
    setLoginResult(null);
    try {
      await signupWithGoogle();
    } catch (error) {
      console.error("Google 登入失敗:", error);
      let errorMessage = "Google 登入失敗，請稍後再試。";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Google 登入視窗已被關閉。";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "已有一個進行中的登入視窗。";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setLoginResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setLocalLoading(false);
    }
  }, [signupWithGoogle]);

  const handleFacebookLogin = useCallback(async () => {
    setLocalLoading(true);
    setLoginResult(null);
    try {
      await loginWithFacebook();
    } catch (error) {
      console.error("Facebook 登入失敗:", error);
      let errorMessage = "Facebook 登入失敗，請稍後再試。";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Facebook 登入視窗已被關閉。";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "已有一個進行中的登入視窗。";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setLoginResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setLocalLoading(false);
    }
  }, [loginWithFacebook]);

  // <--- 3. 新增處理忘記密碼的函式
  const handleForgotPassword = useCallback(async () => {
    if (!email) {
      setModalMessage("請先在電子郵件欄位輸入您的信箱。", "info");
      return;
    }

    setLocalLoading(true);
    setLoginResult(null);
    try {
      // sendPasswordReset 已經透過 AuthContext 暴露
      await sendPasswordReset(email);
      // sendPasswordReset 成功後會透過 AuthContext 內建的 modal 顯示成功訊息
    } catch (error) {
      // 錯誤處理邏輯通常放在 useAuthOperations 內，但這裡可以再次確保
      console.error("密碼重設失敗:", error);
      setModalMessage("發送密碼重設郵件失敗，請確保電子郵件正確。", "error");
    } finally {
      setLocalLoading(false);
    }
  }, [email, sendPasswordReset, setModalMessage]);
  // 3. 結束

  const handleBackToLogin = () => {
    setLoginResult(null);
    setEmail("");
    setPassword("");
  };

  if (loginResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cbbg p-4 font-inter">
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
              <button
                onClick={handleBackToLogin}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                返回登入畫面
              </button>
              <div className="mt-6 text-center">
                <Link href="/sign-up" passHref>
                  <button
                    type="button"
                    className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                  >
                    註冊新帳戶
                  </button>
                </Link>
              </div>
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
    <div className="min-h-screen flex items-center justify-center bg-cbbg p-4 font-inter">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          登入 Chopsbook
        </h1>

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
            <div className="flex justify-between items-center">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                密碼
              </label>
              {/* <--- 4. 將 Link 改成 Button，並調用 handleForgotPassword 函式 */}
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                disabled={loadingUser || localLoading}
              >
                忘記密碼？
              </button>
              {/* 4. 結束 */}
            </div>
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
            ) : loginResult?.isEmailUnverified ? (
              "你還未驗證電郵"
            ) : (
              "登入"
            )}
          </button>
        </form>

        {/* --- 分隔線和第三方登入按鈕 --- */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                或使用第三方服務
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full mt-4 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={loadingUser || localLoading}
          >
            <FontAwesomeIcon icon={faGoogle} className="mr-2" />
            使用 Google 登入
          </button>

          {/* 新增的 Facebook 登入按鈕 */}
          {/* <button
            onClick={handleFacebookLogin}
            className="w-full mt-4 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={loadingUser || localLoading}
          >
            <FontAwesomeIcon icon={faFacebook} className="mr-2 text-blue-600" />
            使用 Facebook 登入
          </button> */}
        </div>
        {/* --- 分隔線和第三方登入按鈕結束 --- */}

        <p className="mt-6 text-center text-sm text-gray-600">
          還沒有帳戶？
          <Link href="/sign-up" passHref>
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-500 ml-1 focus:outline-none"
              disabled={loadingUser || localLoading}
            >
              註冊
            </button>
          </Link>
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
