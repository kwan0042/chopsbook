// 假設此文件路徑為 src/app/sign-up/page.js
"use client";

import React, { useContext, useState, useCallback } from "react";
import { AuthContext } from "../../lib/auth-context";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons"; // 導入 Google 品牌圖標

export default function RegisterPage() {
  const {
    signup,
    signupWithGoogle, // 從 AuthContext 取得 Google 註冊函數
    loadingUser,
  } = useContext(AuthContext);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isRestaurantOwner, setIsRestaurantOwner] = useState(false);
  const [ownedRest, setOwnedRest] = useState("");
  const [restEmail, setRestEmail] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [localMessage, setLocalMessage] = useState("");

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLocalLoading(true);
      setLocalMessage("");

      try {
        await signup(
          email,
          password,
          phoneNumber,
          isRestaurantOwner,
          ownedRest,
          restEmail
        );

        // 🚀 關鍵修改 1: 註冊成功後，跳轉到 /login，並傳遞 email
        const encodedEmail = encodeURIComponent(email);
        router.push(`/login?registeredEmail=${encodedEmail}`);
        
      } catch (error) {
        let errorMessage = "註冊失敗，請稍後再試。";

        // 優先處理 Firebase 錯誤碼，提供中文描述
        if (error.code === "auth/email-already-in-use") {
          errorMessage = "此電子郵件已被使用。請使用其他電子郵件或嘗試登入。";
        } else if (error.code === "auth/weak-password") {
          errorMessage = "密碼強度不足。請使用至少6個字符的密碼。";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "無效的電子郵件格式。請輸入有效的電子郵件。";
        } else if (error.code === "auth/too-many-requests") {
          errorMessage = "嘗試次數過多。請稍後再試。";
        } else if (error.message) {
          errorMessage = error.message;
        }

        setLocalMessage(errorMessage);
      } finally {
        setLocalLoading(false);
      }
    },
    [
      email,
      password,
      phoneNumber,
      isRestaurantOwner,
      ownedRest,
      restEmail,
      signup,
      router,
    ]
  );

  const handleGoogleSignup = useCallback(async () => {
    setLocalLoading(true);
    setLocalMessage("");
    try {
      await signupWithGoogle();
      // 成功後導航到首頁
      router.push("/");
      
    } catch (error) {
      let errorMessage = "Google 註冊/登入失敗，請稍後再試。";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Google 登入視窗已被關閉。";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "已有一個進行中的登入視窗。";
      }
      setLocalMessage(errorMessage);
    } finally {
      setLocalLoading(false);
    }
  }, [router, signupWithGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cbbg p-4 font-inter">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          註冊帳戶
        </h1>
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
              電子郵件 <span className="text-red-500">*</span>
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
              密碼 <span className="text-red-500">*</span>
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
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700"
            >
              聯絡電話
            </label>
            <input
              type="tel"
              id="phoneNumber"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loadingUser || localLoading}
            />
          </div>
          <div className="flex items-center">
            <input
              id="isRestaurantOwner"
              name="isRestaurantOwner"
              type="checkbox"
              checked={isRestaurantOwner}
              onChange={(e) => setIsRestaurantOwner(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={loadingUser || localLoading}
            />
            <label
              htmlFor="isRestaurantOwner"
              className="ml-2 block text-sm text-gray-900"
            >
              我是餐廳擁有人
            </label>
          </div>
          {isRestaurantOwner && (
            <div className="relative">
              <label
                htmlFor="restaurantName"
                className="block text-sm font-medium text-gray-700"
              >
                餐廳名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="restaurantName"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={ownedRest}
                onChange={(e) => setOwnedRest(e.target.value)}
                placeholder="輸入餐廳名稱"
                disabled={loadingUser || localLoading}
                required={isRestaurantOwner}
              />
            </div>
          )}
          {isRestaurantOwner && (
            <div className="relative">
              <label
                htmlFor="restaurantEmail"
                className="block text-sm font-medium text-gray-700"
              >
                餐廳聯絡電郵 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="restaurantEmail"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={restEmail}
                onChange={(e) => setRestEmail(e.target.value)}
                placeholder="餐廳/公司聯絡電郵"
                disabled={loadingUser || localLoading}
                required={isRestaurantOwner}
              />
            </div>
          )}
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
            ) : (
              "註冊"
            )}
          </button>
        </form>

        {/* --- 分隔線和 Google 註冊按鈕 --- */}
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
            onClick={handleGoogleSignup}
            className="w-full mt-4 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={loadingUser || localLoading}
          >
            <FontAwesomeIcon icon={faGoogle} className="mr-2" />
            使用 Google 註冊
          </button>
        </div>
        {/* --- 分隔線和 Google 註冊按鈕結束 --- */}

        <p className="mt-6 text-center text-sm text-gray-600">
          已經有帳戶了？
          <button
            type="button"
            className="font-medium text-indigo-600 hover:text-indigo-500 ml-1 focus:outline-none"
            onClick={() => router.push("/login")}
            disabled={loadingUser || localLoading}
          >
            登入
          </button>
        </p>
        <div className="mt-4 text-center">
          <button
            className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => router.push("/")}
            disabled={loadingUser || localLoading}
          >
            返回首頁
          </button>
        </div>
      </div>
    </div>
  );
}