// src/components/AuthModal.js
"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../lib/auth-context"; // 從 AuthContext 導入 - 請確保 src/lib/auth-context.js 存在且導出 AuthContext
import Modal from "./Modal"; // 導入通用 Modal 組件 - 請確保 src/components/Modal.js 存在且導出 Modal

/**
 * AuthModal 組件：處理使用者登入和註冊的彈出式視窗。
 * @param {object} props - 組件屬性。
 * @param {boolean} props.isOpen - 控制 Modal 是否顯示。
 * @param {function} props.onClose - 關閉 Modal 的回調函數。
 * @param {'login' | 'register'} props.initialMode - Modal 啟動時的初始模式 ('login' 或 'register')。
 */
const AuthModal = ({ isOpen, onClose, initialMode }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(
    initialMode === "register"
  ); // 根據 initialMode 設定初始狀態
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [modalMessage, setLocalModalMessage] = useState(""); // 本地模態框訊息，避免與全域衝突
  // 從 AuthContext 獲取 login 和 signup 函數
  const { login, signup, currentUser } = useContext(AuthContext);

  // 當 initialMode 改變時，更新 isRegistering 狀態
  useEffect(() => {
    setIsRegistering(initialMode === "register");
  }, [initialMode]);

  // 如果 Modal 關閉，清空表單
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setLocalModalMessage("");
    }
  }, [isOpen]);

  // 如果用戶已經登入，則自動關閉 Modal (避免登入後仍然顯示登入視窗)
  useEffect(() => {
    if (currentUser && isOpen) {
      onClose();
    }
  }, [currentUser, isOpen, onClose]);

  if (!isOpen) return null; // 如果 Modal 不開啟，則不渲染

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingAuth(true);
    try {
      if (isRegistering) {
        await signup(email, password); // 使用從 context 獲取的 signup
        setLocalModalMessage("註冊成功！請登入。");
        setIsRegistering(false); // 註冊成功後切換回登入模式
      } else {
        await login(email, password); // 使用從 context 獲取的 login
        onClose(); // 登入成功後關閉 Modal
      }
    } catch (error) {
      console.error("認證失敗:", error);
      setLocalModalMessage(`認證失敗: ${error.message}`); // 顯示 Firebase 錯誤訊息
    } finally {
      setLoadingAuth(false);
    }
  };

  const closeLocalModal = () => setLocalModalMessage("");

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
          aria-label="關閉"
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
      <Modal message={modalMessage} onClose={closeLocalModal} />
    </div>
  );
};

export default AuthModal;
