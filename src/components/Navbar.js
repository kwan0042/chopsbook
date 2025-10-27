// src/components/Navbar.js
"use client";

import React, {
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react"; // <--- 1. 導入 useEffect 和 useRef
import { AuthContext } from "@/lib/auth-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faBookmark } from "@fortawesome/free-solid-svg-icons";
import { useRouter, usePathname } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";

// 從新的 hook 檔案中導入 RankDisplay 組件
import { RankDisplay } from "@/hooks/cx-ranks";

const Navbar = ({ onShowFilterModal, onSearch }) => {
  const { currentUser, setModalMessage, favoriteRestaurantsCount, app } =
    useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // <--- 2. 創建一個 Ref 來指向 Navbar 根元素
  const navRef = useRef(null);

  const isAdmin = currentUser && currentUser.isAdmin;

  const isRestaurantsPage = pathname === "/restaurants";

  // <--- 3. 處理點擊外部關閉選單的邏輯
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 檢查點擊是否發生在 nav 元素之外，並且選單是開啟的
      if (
        navRef.current &&
        !navRef.current.contains(event.target) &&
        isMobileMenuOpen // 只在選單開啟時才執行關閉
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    // 註冊事件監聽器到整個 document
    document.addEventListener("mousedown", handleClickOutside);

    // 清理函式：在組件卸載時移除事件監聽器
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]); // 依賴 isMobileMenuOpen

  // 為了避免重複的邏輯，將所有會導致導航的處理器中的 setIsMobileMenuOpen(false) 移除，因為它們已在 handleClickOutside 或 handleMobileMenuItemClick 中處理。
  // 但由於 Link 或 Button 的 onClick 事件會在導航之前觸發，我們可以保留它們來確保即時關閉，或者全部依賴 handleMobileMenuItemClick。為了簡潔，我們只保留 handleMobileMenuItemClick 的用法。

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const params = new URLSearchParams();
      if (searchText) {
        params.set("search", searchText);
      }
      router.push(`/restaurants?${params.toString()}`);

      // ✨ 修正：提交搜尋後清除搜尋框內容
      setSearchText("");
      // 新增：提交搜尋後關閉行動選單 (如果開啟的話)
      setIsMobileMenuOpen(false); // 保持這個，因為搜尋是表單提交，不經過單個連結點擊
    },
    [searchText, router] // 移除不必要的依賴 onSearch, isRestaurantsPage，並確保 setSearchText 隱含地穩定
  );

  const handleGoHome = useCallback(() => {
    router.push("/");
    setIsMobileMenuOpen(false); // 點擊 Logo 回首頁也關閉選單
  }, [router]);

  // 修改此處：導向動態路徑 /user/[userId]
  const handleGoToPersonalPage = useCallback(() => {
    if (currentUser) {
      router.push(`/user/${currentUser.uid}`);
      setIsMobileMenuOpen(false); // 新增：關閉行動選單
    } else {
      setModalMessage("請先登入才能訪問個人主頁。");
    }
  }, [currentUser, router, setModalMessage]);

  const handleGoToLoginPage = useCallback(() => {
    router.push("/login");
    setIsMobileMenuOpen(false); // 新增：關閉行動選單
  }, [router]);

  const handleLogout = useCallback(async () => {
    if (app) {
      const auth = getAuth(app);
      try {
        await signOut(auth);
        router.push("/");
        setIsMobileMenuOpen(false); // 新增：關閉行動選單
      } catch (error) {
        console.error("登出失敗:", error);
        setModalMessage("登出失敗，請稍後再試。", "error");
      }
    }
  }, [app, router, setModalMessage]);

  const handleGoToRestaurants = useCallback(() => {
    router.push("/restaurants");
    setIsMobileMenuOpen(false); // 新增：關閉行動選單
  }, [router]);

  // 行動選單項目點擊處理器，用於關閉選單
  // 保持這個函式，用於點擊 Link/Button 後立即關閉，讓使用者體驗更流暢
  const handleMobileMenuItemClick = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // <--- 4. 將 ref 傳遞給 nav 元素
  return (
    <nav
      ref={navRef}
      className="bg-gray-900 text-white sticky top-0 z-50 shadow-md"
    >
      {/* 保持 flex-col 作為預設 (適用於 sm 以下)，並在 lg 及以上使用 flex-row */}
      <div className="flex flex-col lg:flex-row items-center w-full p-3 px-4 sm:px-4 lg:px-4 lg:justify-between">
        <div className="flex items-center justify-between w-full lg:w-[30%] mb-2 lg:mb-0 lg:justify-start">
          <button
            onClick={handleGoHome}
            className="flex items-center bg-transparent border-none "
            aria-label="回首頁"
          >
            <div className="relative w-[60px] h-[30px] px-2 pb-2">
              <Image
                src="/Chopsbook_logo_white_v2.png"
                alt="ChopsBook logo"
                fill={true}
                sizes="60px"
                // ---------------------
                className="object-contain"
              />
            </div>

            <h1 className="text-base font-bold text-yellow-500 hover:text-yellow-400 pr-3 transition duration-200">
              ChopsBook <a className="text-xs">Beta</a>
            </h1>
          </button>

          <div className="ml-3 border-l border-white pl-3">
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleGoToPersonalPage}
                  className="text-white hover:text-yellow-500 transition duration-200  rounded-full"
                  aria-label="個人主頁"
                >
                  <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
                </button>
                <span className="text-gray-200 font-bold text-xs sm:text-sm hidden xl:hidden 2xl:inline whitespace-nowrap flex-shrink-0">
                  {currentUser.username}
                </span>

                {currentUser.rank !== undefined && (
                  <RankDisplay rank={currentUser.rank} />
                )}

                <div className="relative flex items-center group">
                  <FontAwesomeIcon
                    icon={faBookmark}
                    className="text-xl text-yellow-500 cursor-pointer hover:text-white transition-colors"
                    title="我的收藏"
                    onClick={() =>
                      router.push(`/user/${currentUser.uid}/favorite-list`)
                    }
                  />
                  {favoriteRestaurantsCount !== undefined && (
                    <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {favoriteRestaurantsCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-500 font-bold text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                >
                  登出
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoToLoginPage}
                className="flex flex-col items-start group relative text-white hover:text-yellow-500 transition duration-200 focus:outline-none text-sm"
              >
                <span className="text-gray-200 font-bold group-hover:text-yellow-500 transition duration-200">
                  登入
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 🎯 修改 1: 將搜尋欄和菜單按鈕放在同一行，並確保它們在 lg 以前可以換行 */}
        <div className="w-full lg:w-auto flex items-center justify-center my-2 lg:my-0 lg:flex-grow">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-xl flex flex-grow"
          >
            <input
              type="text"
              placeholder="搜尋餐廳、菜系、地點..."
              className="h-10 px-3 py-2 rounded-l-md w-full bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-transparent flex-grow"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 h-10 p-2.5 rounded-r-md transition duration-200 flex-shrink-0"
            >
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
          </form>

          {/* 🎯 修改 2: 將 Filter 和 Menu 按鈕放在一起 */}
          <div className="flex items-center space-x-2 ml-2">
            {!isRestaurantsPage && (
              <button
                type="button"
                onClick={onShowFilterModal}
                className="bg-gray-700 hover:bg-gray-600 text-white h-10 p-2.5 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 flex-shrink-0"
                aria-label="打開篩選器"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V19l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </button>
            )}

            {/* 🎯 修改 3: 菜單按鈕只在 md 尺寸以下顯示 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 flex-shrink-0 h-10 w-10 flex items-center justify-center"
              aria-label="打開菜單"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 🎯 修改 4: 右側連結區塊 - md 尺寸以上顯示，md 以下隱藏 */}
        <div className=" items-center w-full lg:w-[30%] justify-end space-x-2 mt-2 lg:mt-0 hidden lg:flex">
          <Link
            href={`/review`}
            className="hover:text-yellow-500 transition duration-200 bg-transparent border-none text-white cursor-pointer pl-3 m-0 text-sm"
          >
            <span>寫食評</span>
          </Link>
          <button
            onClick={() => {
              router.push("/merchant");
            }}
            className="hover:text-yellow-500 transition duration-200 bg-transparent border-none text-white cursor-pointer pl-3 m-0 text-sm"
          >
            餐廳管理專區
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                router.push("/admin");
              }}
              className="hover:text-yellow-500 transition duration-200 bg-transparent border-none text-white cursor-pointer pl-3 m-0 text-sm"
            >
              管理員頁面
            </button>
          )}
        </div>
      </div>

      {/* 🎯 修改 5: 行動菜單 (只在 md 螢幕以下顯示) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden w-full bg-gray-800 border-t border-gray-700 py-2 px-4 flex flex-col items-center space-y-2">
          {/* 登入/個人主頁 */}
          {currentUser ? (
            <button
              onClick={handleGoToPersonalPage}
              className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 bg-transparent border-none text-white cursor-pointer"
            >
              個人主頁
            </button>
          ) : (
            <button
              onClick={handleGoToLoginPage}
              className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 bg-transparent border-none text-white cursor-pointer"
            >
              登入
            </button>
          )}

          {/* 從頂部右側移入的連結 */}
          <Link
            href={`/review`}
            onClick={handleMobileMenuItemClick}
            className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 bg-transparent border-none text-white cursor-pointer"
          >
            寫食評
          </Link>
          <button
            onClick={() => {
              router.push("/merchant");
              handleMobileMenuItemClick();
            }}
            className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 bg-transparent border-none text-white cursor-pointer"
          >
            餐廳管理專區
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                router.push("/admin");
                handleMobileMenuItemClick();
              }}
              className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 bg-transparent border-none text-white cursor-pointer"
            >
              管理員頁面
            </button>
          )}

          {/* 新增分隔線 */}
          <div className="w-1/2 h-px bg-gray-700 my-1"></div>

          {/* 從底部導航列移入的連結 */}
          <button
            onClick={handleGoToRestaurants}
            className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 bg-transparent border-none text-white cursor-pointer"
          >
            所有餐廳
          </button>
          <Link
            href="/categories"
            onClick={handleMobileMenuItemClick}
            className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 text-white cursor-pointer"
          >
            所有類別
          </Link>
          <Link
            href="/blogs"
            onClick={handleMobileMenuItemClick}
            className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 text-white cursor-pointer"
          >
            所有文章
          </Link>
          <Link
            href="/categories"
            onClick={handleMobileMenuItemClick}
            className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 text-white cursor-pointer"
          >
            餐廳優惠
          </Link>
          <Link
            href="#"
            onClick={handleMobileMenuItemClick}
            className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 text-white cursor-pointer"
          >
            新開業餐廳
          </Link>

          {/* 登出按鈕 (只在行動選單中，如果已登入) */}
          {currentUser && (
            <>
              <div className="w-1/2 h-px bg-gray-700 my-1"></div>
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-500 font-bold text-sm w-full text-center py-1 bg-transparent border-none cursor-pointer"
              >
                登出
              </button>
            </>
          )}
        </div>
      )}

      {/* 🎯 修改 6: 底部導航列 - md 尺寸以上顯示，md 以下隱藏 (保持不移除) */}
      <div className="bg-gray-800 text-white text-sm py-2 px-6 w-full hidden lg:flex flex-wrap justify-center gap-4 sm:gap-6 border-t border-gray-700">
        <button
          onClick={handleGoToRestaurants}
          className="hover:text-yellow-500 transition duration-200 text-sm bg-transparent border-none"
        >
          所有餐廳
        </button>
        <Link
          href="/categories"
          className="hover:text-yellow-500 transition duration-200 text-sm"
        >
          所有類別
        </Link>
        <Link
          href="/blogs"
          className="hover:text-yellow-500 transition duration-200 text-sm"
        >
          所有文章
        </Link>
        <Link
          href="/categories"
          className="hover:text-yellow-500 transition duration-200 text-sm"
        >
          餐廳優惠
        </Link>
        <Link
          href="#"
          className="hover:text-yellow-500 transition duration-200 text-sm"
        >
          新開業餐廳
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
