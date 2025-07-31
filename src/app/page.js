"use client"; // 此指令標記此檔案為客戶端組件。
// 此檔案中定義的所有組件也將是客戶端組件。
// 這是必要的，因為我們使用了 React Hooks (useState, useEffect, createContext, useContext)
// 並與瀏覽器 API (Firebase SDK) 互動。

import React, { useState, useEffect, createContext, useContext } from "react";
// 從新的 lib/firebase.js 檔案導入 Firebase 初始化和服務獲取函數
import {
  initializeFirebaseApp,
  getFirebaseDb,
  getFirebaseAuth,
  getFirebaseAnalytics,
} from "../lib/firebase";

import {
  // 從 Firebase Auth SDK 導入特定函數
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInAnonymously,
  signInWithCustomToken,
} from "firebase/auth";
import {
  // 從 Firebase Firestore SDK 導入特定函數
  collection,
  query,
  onSnapshot,
  doc,
  addDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";

// Canvas 環境提供的全域變數，用於 Firebase 配置。
// 我們檢查它們是否已定義，以提供本地開發/測試的備用值。
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// 這是你在本地開發/測試時使用的 Firebase 配置。
// 在 Canvas 環境中運行時，__firebase_config 將會覆蓋此配置。
const localFirebaseConfig = {
  apiKey: "AIzaSyBtXmTdeY4bTn558wLhZ-9GkVejWxe_3lk",
  authDomain: "chopsbook.firebaseapp.com",
  projectId: "chopsbook",
  storageBucket: "chopsbook.firebasestorage.app",
  messagingSenderId: "357146304445",
  appId: "1:357146304445:web:b97659b3ad6e276e62fcd4",
  measurementId: "G-H4M0D99T60",
};

const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;

// Firebase 服務實例。這些變數將在 AuthProvider 內部被賦值。
let appInstance;
let dbInstance;
let authInstance;
let analyticsInstance; // 新增 Analytics 實例變數

// AuthContext: 一個 React Context，用於在組件樹中共享認證狀態和 Firebase 實例，
// 避免層層傳遞 props。
const AuthContext = createContext(null);

// --- 輔助組件 ---

/**
 * Modal 組件：一個自訂的模態對話框，用於向使用者顯示訊息。
 * 這取代了瀏覽器原生的 alert/confirm，以提供一致的使用者介面。
 * @param {object} props - 組件屬性。
 * @param {string} props.message - 要在模態框中顯示的訊息。
 * @param {function} props.onClose - 模態框關閉時的回調函數。
 */
const Modal = ({ message, onClose }) => {
  if (!message) return null; // 如果沒有提供訊息，則不渲染。

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
        <p className="text-lg font-semibold mb-4">{message}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
        >
          確定
        </button>
      </div>
    </div>
  );
};

/**
 * LoadingSpinner 組件：顯示一個簡單的旋轉動畫，指示載入狀態。
 */
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

// --- 認證提供者組件 ---

/**
 * AuthProvider：管理 Firebase 初始化和使用者認證狀態。
 * 它透過 AuthContext 向其子組件提供 currentUser、載入狀態和認證函數（登入、註冊、登出）。
 * @param {object} props - 組件屬性。
 * @param {React.ReactNode} props.children - 將消費此 Context 的子組件。
 */
const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    // 優先使用 Canvas 環境提供的 Firebase 配置，否則使用本地定義的配置。
    const currentFirebaseConfig =
      typeof __firebase_config !== "undefined"
        ? JSON.parse(__firebase_config)
        : localFirebaseConfig;

    // 初始化 Firebase 應用程式、Firestore 和 Auth 服務。
    try {
      // 使用 initializeFirebaseApp 確保應用程式只初始化一次。
      appInstance = initializeFirebaseApp(currentFirebaseConfig);
      // 從已初始化的應用程式實例獲取 Firestore 和 Auth 服務實例。
      dbInstance = getFirebaseDb(appInstance);
      authInstance = getFirebaseAuth(appInstance);
      // 初始化並獲取 Analytics 服務實例
      analyticsInstance = getFirebaseAnalytics(appInstance);
    } catch (error) {
      console.error("Firebase 初始化失敗:", error);
      setModalMessage(`Firebase 初始化失敗: ${error.message}`);
      setLoading(false);
      return;
    }

    // 訂閱 Firebase 認證狀態的變化。
    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (user) {
        // 如果使用者已登入，將其設為當前使用者。
        setCurrentUser(user);
      } else {
        // 如果沒有使用者登入，嘗試使用自訂 token (來自 Canvas)
        // 或如果沒有提供 token 則匿名登入。
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
          } else {
            await signInAnonymously(authInstance);
          }
        } catch (error) {
          console.error("Firebase 認證失敗:", error);
          setModalMessage(`Firebase 認證失敗: ${error.message}`);
        }
      }
      setLoading(false); // 認證狀態檢查完成後，停止載入。
    });

    // 組件卸載時清理訂閱。
    return () => unsubscribe();
  }, []); // 空依賴陣列確保此 effect 只在組件掛載時執行一次。

  // 處理使用者登入的函數。
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(authInstance, email, password);
    } catch (error) {
      console.error("登入失敗:", error);
      setModalMessage(`登入失敗: ${error.message}`);
      throw error; // 重新拋出錯誤，以便調用組件可以處理。
    }
  };

  // 處理新使用者註冊的函數。
  const signup = async (email, password) => {
    try {
      await createUserWithEmailAndPassword(authInstance, email, password);
    } catch (error) {
      console.error("註冊失敗:", error);
      setModalMessage(`註冊失敗: ${error.message}`);
      throw error; // 重新拋出錯誤。
    }
  };

  // 處理使用者登出的函數。
  const logout = async () => {
    try {
      await signOut(authInstance);
    } catch (error) {
      console.error("登出失敗:", error);
      setModalMessage(`登出失敗: ${error.message}`);
    }
  };

  // 關閉模態訊息的函數。
  const closeModal = () => setModalMessage("");

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        signup,
        logout,
        db: dbInstance,
        auth: authInstance,
        appId,
      }}
    >
      {children}
      <Modal message={modalMessage} onClose={closeModal} />
    </AuthContext.Provider>
  );
};

// --- 頁面組件 ---

/**
 * LoginPage：處理使用者登入和註冊。
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
    try {
      if (isRegistering) {
        await signup(email, password);
        setModalMessage("註冊成功！請登入。");
        setIsRegistering(false); // 註冊成功後切換回登入模式。
      } else {
        await login(email, password);
        // 成功登入後，AuthProvider 的 onAuthStateChanged 將更新 currentUser，
        // 這將觸發主 App 組件渲染 HomePage。
      }
    } catch (error) {
      // 錯誤已由 AuthProvider 的全域模態框處理並顯示，此處無需重複設置。
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

/**
 * Navbar 組件：頂部導航欄，包含語言、評論、認證和商家連結。
 * @param {object} props - 組件屬性。
 * @param {function} props.onShowLogin - 顯示登入頁面的回調。
 * @param {object} props.currentUser - 當前已認證的使用者物件。
 * @param {function} props.onLogout - 登出使用者的回調。
 */
const Navbar = ({ onShowLogin, currentUser, onLogout }) => {
  return (
    <nav className="bg-gray-900 text-white p-3 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-50">
      {/* Top Nav: Logo, Search, Account, Cart */}
      <div className="flex items-center justify-between w-full sm:w-auto mb-3 sm:mb-0">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 mr-4">
          <h1 className="text-2xl font-bold text-yellow-500">ChopsBook</h1>
          <span className="ml-2 text-sm text-gray-300 hidden sm:block">
            .ca
          </span>
        </div>

        {/* Search Bar (integrated into Navbar) */}
        <div className="flex-grow flex items-center mx-4 max-w-xl">
          <input
            type="text"
            placeholder="搜尋餐廳、菜系、地點..."
            className="p-2 rounded-l-md w-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 p-2 rounded-r-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Account & Cart Links */}
        <div className="flex items-center space-x-4 ml-4">
          {currentUser ? (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-200">
                你好,{" "}
                {currentUser.email
                  ? currentUser.email.split("@")[0]
                  : currentUser.uid.substring(0, 5) + "..."}
              </span>
              <button
                onClick={onLogout}
                className="text-red-400 hover:text-red-500 transition duration-200"
              >
                登出
              </button>
            </div>
          ) : (
            <button
              onClick={onShowLogin}
              className="text-white hover:text-yellow-500 transition duration-200 text-sm"
            >
              登入/登記
            </button>
          )}
          <a
            href="#"
            className="text-white hover:text-yellow-500 transition duration-200 text-sm hidden md:block"
          >
            我的訂單
          </a>
          <a
            href="#"
            className="flex items-center text-white hover:text-yellow-500 transition duration-200 text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            購物車
          </a>
        </div>
      </div>

      {/* Secondary Nav Bar (Categories/Links) */}
      <div className="bg-gray-800 text-white text-sm py-2 px-6 w-full flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 rounded-b-md">
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          所有類別
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          特價優惠
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          最新上架
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          寫食評
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          更新餐廳資料
        </a>
        <a href="#" className="hover:text-yellow-500 transition duration-200">
          商戶專區
        </a>
        <select className="bg-gray-800 border border-gray-600 rounded-md py-0.5 px-1 text-gray-300 text-xs">
          <option>繁體中文</option>
          <option>English</option>
        </select>
      </div>
    </nav>
  );
};

/**
 * HeroSection：顯示帶有行動呼籲的大型橫幅。
 */
const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-r from-blue-700 to-blue-900 text-white py-20 px-4 sm:px-6 lg:px-8 text-center shadow-lg mx-auto max-w-full">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage:
            "url('https://placehold.co/1920x600/1A5276/FFFFFF?text=ChopsBook+美食探索')",
        }}
      ></div>
      <div className="relative z-10 max-w-4xl mx-auto">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
          發現加拿大最受歡迎的餐廳
        </h2>
        <p className="text-lg sm:text-xl mb-8 opacity-90">
          從多倫多到溫哥華，尋找您的下一頓美味佳餚。
        </p>
        <button className="bg-yellow-500 text-gray-900 hover:bg-yellow-600 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105">
          立即開始探索
        </button>
      </div>
    </section>
  );
};

/**
 * SearchBar：提供用於按類別、地點等搜尋餐廳的輸入欄位。
 * 此組件現在被整合到 Navbar 中，所以這裡將是一個佔位符或被移除。
 */
const SearchBar = () => {
  return null; // SearchBar 已整合到 Navbar 中，此處不再渲染。
};

/**
 * PromotionsSection：顯示各種促銷或特別優惠。
 */
const PromotionsSection = () => {
  const promotions = [
    {
      id: 1,
      title: "夏日特惠：飲品買一送一！",
      imageUrl: "https://placehold.co/300x180/FFD700/000000?text=夏日特惠",
    },
    {
      id: 2,
      title: "新用戶專享：首單八折！",
      imageUrl: "https://placehold.co/300x180/ADFF2F/000000?text=新用戶優惠",
    },
    {
      id: 3,
      title: "週末限定：家庭套餐優惠！",
      imageUrl: "https://placehold.co/300x180/8A2BE2/FFFFFF?text=週末限定",
    },
    {
      id: 4,
      title: "會員專享：積分雙倍！",
      imageUrl: "https://placehold.co/300x180/FF6B6B/FFFFFF?text=會員優惠",
    },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white shadow-md rounded-lg mb-8">
      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
        最新推廣與精選
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-screen-xl mx-auto">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="bg-gray-50 rounded-lg shadow-sm overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out border border-gray-200"
          >
            <img
              src={promo.imageUrl}
              alt={promo.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {promo.title}
              </h3>
              <p className="text-blue-700 text-sm font-medium hover:underline cursor-pointer">
                查看詳情 &rarr;
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * FoodCategoriesSection：顯示不同的食物類別。
 * 目前，它將渲染 RestaurantListPage 作為分類列表的佔位符。
 */
const FoodCategoriesSection = () => {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white shadow-md rounded-lg mb-8">
      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
        探索不同食物類別
      </h2>
      <RestaurantListPage />
    </section>
  );
};

/**
 * RestaurantListPage：顯示從 Firestore 獲取的餐廳列表。
 * 包括一個用於測試目的的添加範例資料按鈕。
 */
const RestaurantListPage = () => {
  const { db, currentUser, appId } = useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState("");
  // 對於已認證的使用者使用 currentUser?.uid，否則使用通用字串。
  const userId = currentUser?.uid || "anonymous";

  useEffect(() => {
    if (!db) {
      // 在繼續之前檢查 db 實例
      setLoading(false);
      return;
    }

    // Firestore 中公共 'restaurants' 集合的參考。
    // 資料儲存在 artifacts/{appId}/public/data/restaurants 下
    const restaurantCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/restaurants`
    );
    const q = query(restaurantCollectionRef);

    // 使用 onSnapshot 監聽餐廳資料的實時更新。
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const restaurantList = snapshot.docs.map((doc) => ({
          id: doc.id, // Firestore 文件 ID
          ...doc.data(), // 文件資料
        }));
        setRestaurants(restaurantList);
        setLoading(false);
      },
      (error) => {
        console.error("獲取餐廳資料失敗:", error);
        setModalMessage(`獲取餐廳資料失敗: ${error.message}`);
        setLoading(false);
      }
    );

    // 組件卸載時清理 Firestore 訂閱。
    return () => unsubscribe();
  }, [db, appId]); // 如果 db 或 appId 更改，則重新訂閱。currentUser 不是公共資料的直接依賴項。

  /**
   * addSampleRestaurants：向 Firestore 添加預定義的範例餐廳資料。
   * 這用於初始設定和測試。在實際應用程式中，此資料將透過
   * 管理介面管理或導入。
   */
  const addSampleRestaurants = async () => {
    if (!db) {
      // 確保 db 已初始化
      setModalMessage("Firebase 資料庫尚未初始化。");
      return;
    }
    // 僅允許在認證後 (即使是匿名認證) 添加範例資料。
    if (!currentUser) {
      setModalMessage("請先登入才能新增資料。");
      return;
    }

    setLoading(true);
    try {
      const restaurantCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/restaurants`
      );
      const sampleRestaurants = [
        {
          name: "楓葉小館",
          cuisine: "加拿大菜",
          address: "多倫多市中心楓葉大道123號",
          phone: "416-123-4567",
          rating: 4.5,
          reviewCount: 25,
          imageUrl: "https://placehold.co/400x200/FF5733/FFFFFF?text=楓葉小館",
        },
        {
          name: "海鮮碼頭",
          cuisine: "海鮮",
          address: "溫哥華海濱路456號",
          phone: "604-987-6543",
          rating: 4.8,
          reviewCount: 40,
          imageUrl: "https://placehold.co/400x200/3366FF/FFFFFF?text=海鮮碼頭",
        },
        {
          name: "法式浪漫",
          cuisine: "法國菜",
          address: "蒙特婁老城區藝術街789號",
          phone: "514-234-5678",
          rating: 4.2,
          reviewCount: 18,
          imageUrl: "https://placehold.co/400x200/6633FF/FFFFFF?text=法式浪漫",
        },
        {
          name: "亞洲風味",
          cuisine: "亞洲菜",
          address: "卡加利市區美食廣場101號",
          phone: "403-567-8901",
          rating: 4.0,
          reviewCount: 30,
          imageUrl: "https://placehold.co/400x200/33CC66/FFFFFF?text=亞洲風味",
        },
      ];

      // 將每個範例餐廳作為新文件添加到集合中。
      for (const restaurant of sampleRestaurants) {
        await addDoc(restaurantCollectionRef, restaurant);
      }
      setModalMessage("已新增範例餐廳資料！");
    } catch (error) {
      console.error("新增範例餐廳失敗:", error);
      setModalMessage(`新增範例餐廳失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setModalMessage("");

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
        所有餐廳
      </h2>
      <p className="text-sm text-gray-600 text-center mb-4">
        當前使用者 ID:{" "}
        <span className="font-mono bg-gray-200 px-2 py-1 rounded">
          {userId}
        </span>
      </p>
      <div className="flex justify-center mb-8">
        <button
          onClick={addSampleRestaurants}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          新增範例餐廳資料 (僅供測試)
        </button>
      </div>

      {restaurants.length === 0 ? (
        <p className="text-center text-gray-600 text-xl">
          目前沒有餐廳資料。請點擊上方按鈕新增範例資料。
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out"
            >
              <img
                src={
                  restaurant.imageUrl ||
                  `https://placehold.co/400x200/CCCCCC/333333?text=${restaurant.name}`
                }
                alt={restaurant.name}
                className="w-full h-48 object-cover"
                // 圖片載入錯誤時的備用方案
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://placehold.co/400x200/CCCCCC/333333?text=${restaurant.name}`;
                }}
              />
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {restaurant.name}
                </h3>
                <p className="text-gray-700 mb-1">
                  <span className="font-semibold">菜系:</span>{" "}
                  {restaurant.cuisine}
                </p>
                <p className="text-gray-700 mb-1">
                  <span className="font-semibold">地址:</span>{" "}
                  {restaurant.address}
                </p>
                <p className="text-gray-700 mb-1">
                  <span className="font-semibold">電話:</span>{" "}
                  {restaurant.phone}
                </p>
                <div className="flex items-center mt-3">
                  <span className="text-yellow-500 text-xl mr-2">⭐</span>
                  <span className="text-gray-800 font-bold text-lg">
                    {restaurant.rating?.toFixed(1) || "N/A"}
                  </span>
                  <span className="text-gray-600 text-sm ml-2">
                    ({restaurant.reviewCount || 0} 評論)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal message={modalMessage} onClose={closeModal} />
    </div>
  );
};

/**
 * TestDBForm 組件：提供一個簡單的表單來測試 Firebase Firestore 的資料讀寫。
 * 允許使用者新增測試資料並顯示現有資料。
 */
const TestDBForm = () => {
  const { db, currentUser, appId } = useContext(AuthContext);
  const [testInput, setTestInput] = useState("");
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState("");
  const userId = currentUser?.uid || "anonymous";

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    // 監聽公共測試資料集合
    const testCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/test_data`
    );
    const q = query(testCollectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dataList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTestData(dataList);
        setLoading(false);
      },
      (error) => {
        console.error("獲取測試資料失敗:", error);
        setModalMessage(`獲取測試資料失敗: ${error.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, appId]);

  const handleAddTestData = async (e) => {
    e.preventDefault();
    if (!db || !currentUser) {
      setModalMessage("請先登入才能新增測試資料。");
      return;
    }
    if (!testInput.trim()) {
      setModalMessage("請輸入一些文字以新增測試資料。");
      return;
    }

    setLoading(true);
    try {
      const testCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/test_data`
      );
      await addDoc(testCollectionRef, {
        text: testInput,
        timestamp: new Date(),
        userId: currentUser.uid,
      });
      setTestInput(""); // 清空輸入欄位
      setModalMessage("測試資料已成功新增！");
    } catch (error) {
      console.error("新增測試資料失敗:", error);
      setModalMessage(`新增測試資料失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setModalMessage("");

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <section className="container mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-xl shadow-lg mt-8">
      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
        測試資料庫連線
      </h2>
      <p className="text-sm text-gray-600 text-center mb-4">
        此區塊用於測試與 Firebase Firestore 的資料讀寫。
      </p>
      <div className="max-w-md mx-auto mb-8">
        <form
          onSubmit={handleAddTestData}
          className="flex flex-col sm:flex-row gap-4"
        >
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="輸入測試文字..."
            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            disabled={loading}
          >
            {loading ? "新增中..." : "新增測試資料"}
          </button>
        </form>
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        現有測試資料
      </h3>
      {testData.length === 0 ? (
        <p className="text-center text-gray-600">
          目前沒有測試資料。請新增一些。
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testData.map((item) => (
            <div key={item.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-gray-800 font-medium">{item.text}</p>
              <p className="text-gray-500 text-sm">
                新增於:{" "}
                {item.timestamp
                  ? new Date(item.timestamp.toDate()).toLocaleString()
                  : "N/A"}
              </p>
              <p className="text-gray-500 text-sm">
                使用者 ID:{" "}
                {item.userId ? item.userId.substring(0, 8) + "..." : "N/A"}
              </p>
            </div>
          ))}
        </div>
      )}
      <Modal message={modalMessage} onClose={closeModal} />
    </section>
  );
};

/**
 * HomePage：ChopsBook 的主登陸頁面。
 * 它包括導航欄、Hero 區塊、搜尋欄、促銷活動和食物類別。
 */
const HomePage = ({ onShowLogin, onLogout, currentUser }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-inter">
      <Navbar
        onShowLogin={onShowLogin}
        currentUser={currentUser}
        onLogout={onLogout}
      />
      <main className="flex-grow">
        <HeroSection />
        {/* 主要內容區域，類似 Amazon 的產品和類別佈局 */}
        <div className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <PromotionsSection />
          <FoodCategoriesSection />
          <TestDBForm />
        </div>
      </main>
      <footer className="bg-gray-800 text-white text-center py-6 text-sm">
        &copy; 2024 ChopsBook. 版權所有.
      </footer>
    </div>
  );
};

// --- 主應用程式組件 (現在是 AuthProvider 的子組件) ---

/**
 * App：主要的應用程式邏輯組件。
 * 它消費 AuthContext 並根據條件渲染 HomePage 或 LoginPage。
 */
const App = () => {
  // 從 AuthContext 獲取當前使用者、載入狀態和登出函數。
  const { currentUser, loading, logout } = useContext(AuthContext);
  const [showLoginPage, setShowLoginPage] = useState(false);

  // 如果 AuthProvider 仍在載入 Firebase，則顯示全域載入指示器。
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      {showLoginPage ? (
        <LoginPage onBackToHome={() => setShowLoginPage(false)} />
      ) : (
        <HomePage
          onShowLogin={() => setShowLoginPage(true)}
          onLogout={logout}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

// --- Next.js 頁面組件 (從 src/app/page.js 預設導出) ---

/**
 * Page：Next.js App Router 的根組件。
 * 它負責向整個應用程式提供 AuthContext。
 */
export default function Page() {
  return (
    <AuthProvider>
      <App /> {/* App 組件現在是 AuthProvider 的子組件 */}
    </AuthProvider>
  );
}
