// src/components/AuthModal.js
"use client";

import React, { useState, useContext } from "react";
// 確保路徑正確，AuthContext 在 src/lib/auth-context.js
import { AuthContext } from "../lib/auth-context";
// 確保路徑正確，Modal 在 src/components/Modal.js (同一個資料夾)
import Modal from "./Modal";

const AuthModal = ({ isOpen, onClose, initialMode = "login" }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [modalMessage, setModalMessage] = useState(""); // 用於顯示 AuthModal 內部的訊息

  const { login, signup } = useContext(AuthContext); // 從 AuthContext 取得登入和註冊函數

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingAuth(true);
    setModalMessage(""); // 清除之前的錯誤訊息

    try {
      if (mode === "register") {
        await signup(email, password);
        setModalMessage("註冊成功！您現在可以登入了。");
        setMode("login"); // 註冊成功後切換到登入模式
      } else {
        await login(email, password);
        // 登入成功後，通常父元件會處理關閉 AuthModal
        // AuthContext 的全域 Modal 會顯示登入成功訊息
        onClose(); // 手動關閉 AuthModal
      }
      // 清空輸入欄位
      setEmail("");
      setPassword("");
    } catch (error) {
      // AuthContext 已經有一個全域的 Modal 來處理錯誤訊息，
      // 所以這裡可以選擇不重複設置 modalMessage，或者設置一個更具體的局部錯誤。
      // 目前 AuthContext 會處理顯示錯誤給用戶。
      console.error("AuthModal 處理錯誤:", error);
    } finally {
      setLoadingAuth(false);
    }
  };

  // 關閉 AuthModal 內部訊息的函數
  const closeLocalModal = () => setModalMessage("");

  if (!isOpen) return null; // 如果 isOpen 為 false，則不渲染 Modal

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto font-inter">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {mode === "register" ? "註冊帳號" : "登入帳號"}
        </h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
          aria-label="關閉"
        >
          &times;
        </button>

        {/* 顯示 AuthModal 內部的訊息，例如註冊成功提示 */}
        {modalMessage && (
          <Modal
            message={modalMessage}
            onClose={closeLocalModal}
            isOpen={!!modalMessage}
          />
        )}

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
              placeholder="請輸入您的電子郵件"
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
              placeholder="請輸入您的密碼"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loadingAuth}
            >
              {loadingAuth
                ? "處理中..."
                : mode === "register"
                ? "註冊"
                : "登入"}
            </button>
          </div>
        </form>
        <p className="text-center text-gray-600 text-sm mt-6">
          {mode === "register" ? "已經有帳號了？" : "還沒有帳號？"}
          <button
            onClick={() => setMode(mode === "register" ? "login" : "register")}
            className="text-blue-600 hover:text-blue-800 font-bold ml-1 focus:outline-none"
          >
            {mode === "register" ? "登入" : "註冊"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
