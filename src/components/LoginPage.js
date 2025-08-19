// src/components/LoginPage.js
"use client";

import React, { useState, useContext } from "react";
import { AuthContext } from "../lib/auth-context"; // 確保路徑正確
import Modal from "./Modal"; // 確保路徑正確

/**
 * LoginPage: 處理使用者登入和註冊。
 */
const LoginPage = ({ onBackToHome }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false); // 在登入和註冊表單之間切換。
  const [loadingAuth, setLoadingAuth] = useState(false); // 認證操作的載入狀態。
  const { login, signup } = useContext(AuthContext); // 從 Context 訪問認證函數。
  const [modalMessage, setModalMessage] = useState(""); // 用於特定登入/註冊訊息的本地模態框。

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingAuth(true);
    setModalMessage(""); // 清除之前的錯誤訊息
    try {
      if (isRegistering) {
        await signup(email, password);
        setModalMessage("註冊成功！請登入。");
        setIsRegistering(false); // 註冊成功後切換回登入模式。
      } else {
        await login(email, password);
        // 成功登入後，AuthContext 會更新 currentUser，這將觸發 App 組件渲染 HomePage。
      }
    } catch (error) {
      // 錯誤已由 AuthProvider 的全域模態框處理並顯示，此處無需重複設置。
      // 但如果你希望在此頁面顯示更精確的錯誤，可以取消此行註釋：
      // setModalMessage(`操作失敗: ${error.message}`);
    } finally {
      setLoadingAuth(false);
    }
  };

  const closeModal = () => setModalMessage("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
        {" "}
        {/* 為定位關閉按鈕添加了 relative */}
        <button
          onClick={onBackToHome}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
          aria-label="返回首頁"
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {isRegistering ? "註冊" : "登入"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              電子郵件
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="你的電子郵件"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              密碼
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="你的密碼"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 w-full"
              disabled={loadingAuth}
            >
              {loadingAuth ? "處理中..." : isRegistering ? "註冊" : "登入"}
            </button>
          </div>
        </form>
        <p className="text-center text-gray-600 text-sm mt-6">
          {isRegistering ? "已經有帳號了？" : "還沒有帳號？"}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-600 hover:text-blue-800 font-bold ml-1 focus:outline-none"
          >
            {isRegistering ? "登入" : "註冊"}
          </button>
        </p>
      </div>
      <Modal message={modalMessage} onClose={closeModal} />
    </div>
  );
};

export default LoginPage;
