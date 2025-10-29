"use client";

import React, {
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { AuthContext } from "../../lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
// 引入必要的 Firebase 函數
import {
  getAuth,
  signOut,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faFacebook } from "@fortawesome/free-brands-svg-icons";

export default function LoginPage() {
  const {
    login,
    signupWithGoogle,
    loginWithFacebook,
    sendPasswordReset,
    setModalMessage,
    loadingUser,
    auth,
  } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredEmail = searchParams.get("registeredEmail");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  // loginResult 現在可能包含 isVerificationError 標誌
  const [loginResult, setLoginResult] = useState(null);

  // ⚠️ 狀態：60 秒冷卻時間狀態和記錄上次發送時間
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimerRef = useRef(null);
  const lastResendTimestampRef = useRef(0); // 記錄上次發送時間戳

  // ----------------------------------------------------------------------
  // 🚀 核心邏輯 1: 處理從註冊頁跳轉過來的狀態 (驗證提示頁面)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (registeredEmail) {
      const decodedEmail = decodeURIComponent(registeredEmail);
      setEmail(decodedEmail);

      // 設置為一個特殊的 loginResult 狀態，用來顯示「驗證提示頁」
      setLoginResult({
        success: false,
        isVerificationError: true, // 使用這個標誌位來控制顯示重發按鈕
        message:
          "🎉 註冊成功！請檢查郵件或垃圾郵件，按下連結進行驗證後 再次登入。",
        // 額外標誌，用於區分是「剛註冊」還是「登入失敗」
        isInitialSignUpPrompt: true,
      });
      // 清除 URL 參數以避免重複觸發，但保持 email 欄位
      router.replace("/login");
    }
    setModalMessage(null);
  }, [registeredEmail, setModalMessage, router]);

  // ----------------------------------------------------------------------
  // 🚀 核心邏輯 2: 處理計時器 (用於重新發送按鈕的冷卻)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (cooldown > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(cooldownTimerRef.current);
  }, [cooldown]);

  // ----------------------------------------------------------------------
  // 🚀 核心邏輯 3: 重新發送驗證郵件 (包含冷卻和獲取用戶邏輯)
  // ----------------------------------------------------------------------
  const resendVerificationEmail = useCallback(async () => {
    const now = Date.now();
    // 檢查冷卻時間 (60 秒)
    if (now - lastResendTimestampRef.current < 60000) {
      const remaining = Math.ceil(
        (60000 - (now - lastResendTimestampRef.current)) / 1000
      );
      setLoginResult((prev) => ({
        ...prev,
        message: `請稍候 ${remaining} 秒再重試發送驗證郵件。`,
      }));
      return;
    }

    // 檢查是否有輸入密碼
    if (!password) {
      setLoginResult((prev) => ({
        ...prev,
        message: "發送驗證郵件前，請先輸入您的密碼。",
      }));
      return;
    }

    setLocalLoading(true);
    setLoginResult((prev) => ({
      ...prev,
      message: "正在嘗試登入以獲取驗證權限...",
    }));

    try {
      const authInstance = getAuth();
      // 關鍵步驟：重新嘗試登入，以獲取未驗證的 User 對象進行發送
      // ⚠️ 這裡如果 email/password 不正確，就會觸發 400 Bad Request
      const userCredential = await signInWithEmailAndPassword(
        authInstance,
        email,
        password
      );
      const user = userCredential.user;

      if (user && !user.emailVerified) {
        // 在發送前，最好再更新一次用戶的 token 以確保是最新的狀態
        await user.reload(); // 確保獲取最新的 emailVerified 狀態
        if (user.emailVerified) {
          // 處理用戶已在別處驗證的情況
          setLoginResult({
            success: false,
            message: "電子郵件已驗證，請嘗試返回登入。",
            isVerificationError: false, // 驗證成功，不再是驗證錯誤狀態
          });
          await signOut(authInstance); // 確保登出，讓用戶走正常的登入流程
          return;
        }

        await sendEmailVerification(user);

        // 設置成功訊息
        setLoginResult({
          success: false,
          isVerificationError: true,
          message: "驗證郵件已成功重新發送！請檢查您的信箱並再次登入。",
        });

        // 設置冷卻時間
        lastResendTimestampRef.current = now;
        setCooldown(60);

        // 關鍵步驟：發送後立即登出該用戶
        await signOut(authInstance);
      } else if (user.emailVerified) {
        // 如果用戶已經驗證了
        setLoginResult({
          success: false,
          message: "電子郵件已驗證，請嘗試返回登入。",
          isVerificationError: false, // 驗證成功，不再是驗證錯誤狀態
        });
        await signOut(authInstance); // 確保登出，讓用戶走正常的登入流程
      } else {
        throw new Error("無法取得有效用戶進行驗證操作。");
      }
    } catch (error) {
      // 🚀 [修正]: 更詳細地處理登入錯誤 (即 400 Bad Request)
      let errorMessage = "無法發送驗證郵件。請檢查您的帳號密碼是否正確。";

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        errorMessage = "帳號或密碼錯誤，無法重新發送驗證郵件。";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "嘗試次數過多，請稍後再試。";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "網絡請求失敗，請檢查網絡連接。";
      } else {
        console.error("重新發送驗證信失敗:", error);
      }

      setLoginResult({
        success: false,
        message: errorMessage,
        isVerificationError: true, // 保持在這個畫面上
      });
    } finally {
      setLocalLoading(false);
    }
  }, [email, password]);

  // ----------------------------------------------------------------------
  // 處理登入提交 (捕獲未驗證錯誤)
  // ----------------------------------------------------------------------
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLocalLoading(true);
      setLoginResult(null);

      try {
        await login(email, password);

        // 登入成功
        setLoginResult({
          success: true,
          message: "登入成功！2秒後自動跳轉到主頁...",
        });
        setTimeout(() => router.push("/"), 2000);
      } catch (error) {
        let errorMessage = "登入失敗，請檢查您的帳號密碼";
        let isVerificationError = false;

        // 🚀 [修改]：捕獲 useAuthOperations 拋出的自定義錯誤 "Email not verified."
        if (error.message === "Email not verified.") {
          errorMessage =
            "電子郵件尚未驗證。請檢查您的信箱並點擊連結後，請輸入密碼嘗試重新發送。";
          isVerificationError = true;
        }

        // 🚀 [保留/備用]：捕獲 Firebase 內建的錯誤碼 (auth/email-not-verified)
        else if (error.code === "auth/email-not-verified") {
          errorMessage =
            "電子郵件尚未驗證。請檢查您的信箱並點擊連結後，請輸入密碼嘗試重新發送。";
          isVerificationError = true;
        }

        // 處理其他登入錯誤
        else {
          if (error.code === "auth/user-not-found") {
            errorMessage = "沒有找到此電子郵件的用戶，請註冊新帳戶。";
          } else if (
            error.code === "auth/wrong-password" ||
            error.code === "auth/invalid-credential"
          ) {
            errorMessage = "密碼錯誤或電子郵件不存在。";
          } else if (error.code === "auth/too-many-requests") {
            errorMessage = "嘗試次數過多，請稍後再試。";
          }
          // 其他錯誤 (如 'auth/user-disabled', 'auth/network-request-failed' 等)
          isVerificationError = false;
        }

        setLoginResult({
          success: false,
          message: errorMessage,
          isVerificationError: isVerificationError, // 根據判斷設定狀態
        });
      } finally {
        setLocalLoading(false);
      }
    },
    [email, password, login, router]
  );

  const handleBackToLogin = () => {
    setLoginResult(null);
    setPassword("");
    // 導航到乾淨的 URL，移除所有 search params
    router.replace("/login");
  };

  // 其他登入/重設密碼邏輯保持不變 (略)
  const handleGoogleLogin = useCallback(async () => {
    setLocalLoading(true);
    setLoginResult(null);
    try {
      await signupWithGoogle();
      router.push("/");
    } catch (error) {
      setLoginResult({
        success: false,
        message: error.message || "Google 登入失敗。",
        isVerificationError: false,
      });
    } finally {
      setLocalLoading(false);
    }
  }, [signupWithGoogle, router]);

  const handleFacebookLogin = useCallback(async () => {
    setLocalLoading(true);
    setLoginResult(null);
    try {
      await loginWithFacebook();
      router.push("/");
    } catch (error) {
      setLoginResult({
        success: false,
        message: error.message || "Facebook 登入失敗。",
        isVerificationError: false,
      });
    } finally {
      setLocalLoading(false);
    }
  }, [loginWithFacebook, router]);

  const handleForgotPassword = useCallback(async () => {
    if (!email) {
      setModalMessage("請先輸入電子郵件。", "warning");
      return;
    }
    setLocalLoading(true);
    try {
      await sendPasswordReset(email);
      setModalMessage(`密碼重設郵件已發送到 ${email}，請檢查信箱。`, "success");
    } catch (error) {
      setModalMessage(`重設密碼失敗: ${error.message}`, "error");
    } finally {
      setLocalLoading(false);
    }
  }, [email, sendPasswordReset, setModalMessage]);

  // ----------------------------------------------------------------------
  // 渲染登入結果 / 驗證提示畫面
  // ----------------------------------------------------------------------
  if (loginResult) {
    // 渲染成功畫面 (loginResult.success === true)
    if (loginResult.success) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-cbbg p-4 font-inter">
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center">
            <h1 className="text-2xl font-bold text-green-600 mb-4">
              登入成功！
            </h1>
            <p className="text-gray-600">{loginResult.message}</p>
          </div>
        </div>
      );
    }

    // 渲染失敗/驗證錯誤畫面 (loginResult.success === false)
    return (
      <div className="min-h-screen flex items-center justify-center bg-cbbg p-4 font-inter">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {loginResult.isVerificationError ? "帳號驗證提示" : "登入失敗"}
          </h1>

          <div className="text-center mb-6">
            <div
              className={`text-lg mb-4 ${
                loginResult.isVerificationError
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              <svg
                className={`w-16 h-16 mx-auto mb-4 ${
                  loginResult.isVerificationError
                    ? "text-blue-500"
                    : "text-red-500"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {/* 使用一個感嘆號圖標來代表錯誤或提示 */}
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-500">{loginResult.message}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 🚀 重新發送按鈕邏輯：只有在 isVerificationError 為 true 時才顯示 */}
            {loginResult.isVerificationError && (
              <>
                <p className="text-sm text-gray-500 text-center">
                  請使用帳號：
                  <span className="font-bold text-gray-700">{email}</span>
                </p>
                {/* 新增密碼輸入欄位，用於重新發送驗證信時的登入步驟 */}
                <div className="mb-4">
                  <label
                    htmlFor="resend-password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    請輸入您的密碼 (用於重新發送驗證信)
                  </label>
                  <input
                    type="password"
                    id="resend-password"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={localLoading || cooldown > 0}
                  />
                </div>
                {/* 重新發送按鈕 */}
                <button
                  onClick={resendVerificationEmail}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                                 ${
                                   cooldown > 0
                                     ? "bg-gray-400"
                                     : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                                 } 
                                 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 mb-2`}
                  disabled={localLoading || cooldown > 0 || !password} // 如果密碼為空，則禁用
                >
                  {localLoading
                    ? "發送中..."
                    : cooldown > 0
                    ? `請稍候 ${cooldown} 秒...`
                    : "重新發送驗證郵件"}
                </button>
              </>
            )}

            <button
              onClick={handleBackToLogin}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loginResult.isVerificationError
                ? "我已驗證，返回登入"
                : "返回登入畫面"}
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

  // ----------------------------------------------------------------------
  // 渲染登入表單畫面
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-cbbg p-4 font-inter">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          登入
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
              disabled={localLoading || loadingUser}
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
              disabled={localLoading || loadingUser}
            />
          </div>
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              disabled={localLoading || loadingUser}
            >
              忘記密碼？
            </button>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={localLoading || loadingUser}
          >
            {localLoading ? "登入中..." : "登入"}
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
          <div className="mt-4 space-y-2">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={localLoading || loadingUser}
            >
              <FontAwesomeIcon icon={faGoogle} className="mr-2" />
              使用 Google 登入
            </button>
            {/* <button
              onClick={handleFacebookLogin}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={localLoading || loadingUser}
            >
              <FontAwesomeIcon icon={faFacebook} className="mr-2" />
              使用 Facebook 登入
            </button> */}
          </div>
        </div>
        {/* --- 第三方登入按鈕結束 --- */}

        <p className="mt-6 text-center text-sm text-gray-600">
          還沒有帳戶？
          <Link href="/sign-up" passHref>
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-500 ml-1 focus:outline-none"
              disabled={localLoading || loadingUser}
            >
              註冊新帳戶
            </button>
          </Link>
        </p>
      </div>
    </div>
  );
}
