"use client";

import React, {
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { AuthContext } from "../../lib/auth-context";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

export default function RegisterPage() {
  const { signup, loadingUser, db, appId } = useContext(AuthContext);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isRestaurantOwner, setIsRestaurantOwner] = useState(false);
  const [ownedRest, setOwnedRest] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [localMessage, setLocalMessage] = useState("");

  // 移除所有與 Firestore 搜尋相關的狀態和 hooks
  const searchResults = []; // 為了避免錯誤，保留並設為空陣列
  const isSearching = false; // 同樣為了避免錯誤

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLocalLoading(true);
      setLocalMessage("");

      try {
        // 更新 signup 函數以傳遞聯絡電話和餐廳擁有人狀態
        // 移除 ownedRestId，現在只傳遞 ownedRest
        await signup(
          email,
          password,
          phoneNumber,
          isRestaurantOwner,
          ownedRest
        );
        // 註冊成功後，直接導航到登入頁面
        router.push("/login");
      } catch (error) {
        let errorMessage = "註冊失敗，請稍後再試";
        if (error.code === "auth/email-already-in-use") {
          errorMessage = "此電子郵件已被使用。請使用其他電子郵件或嘗試登入。";
        } else if (error.code === "auth/weak-password") {
          errorMessage = "密碼強度不足。請使用至少6個字符的密碼。";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "無效的電子郵件格式。請輸入有效的電子郵件。";
        } else if (error.code === "auth/too-many-requests") {
          errorMessage = "嘗試次數過多。請稍後再試。";
        } else if (error.code === "auth/user-disabled") {
          errorMessage = "此帳戶已被停用。請聯繫管理員。";
        } else if (error.message) {
          errorMessage = error.message;
        }
        setLocalMessage(errorMessage);
      } finally {
        setLocalLoading(false);
      }
    },
    [email, password, phoneNumber, isRestaurantOwner, ownedRest, signup, router]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
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
                餐廳名稱
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
