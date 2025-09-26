// src/components/Navbar.js
"use client";

import React, { useContext, useState, useCallback } from "react";
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

  const isAdmin = currentUser && currentUser.isAdmin;

  const isRestaurantsPage = pathname === "/restaurants";

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (isRestaurantsPage) {
        if (onSearch) {
          onSearch(searchText);
        }
      } else {
        const params = new URLSearchParams();
        if (searchText) {
          params.set("search", searchText);
        }
        router.push(`/restaurants?${params.toString()}`);
      }
    },
    [onSearch, searchText, isRestaurantsPage, router]
  );

  const handleGoHome = useCallback(() => {
    router.push("/");
  }, [router]);

  // 修改此處：導向動態路徑 /user/[userId]
  const handleGoToPersonalPage = useCallback(() => {
    if (currentUser) {
      router.push(`/user/${currentUser.uid}`);
    } else {
      setModalMessage("請先登入才能訪問個人主頁。");
    }
  }, [currentUser, router, setModalMessage]);

  const handleGoToLoginPage = useCallback(() => {
    router.push("/login");
  }, [router]);

  const handleLogout = useCallback(async () => {
    if (app) {
      const auth = getAuth(app);
      try {
        await signOut(auth);
        router.push("/");
      } catch (error) {
        console.error("登出失敗:", error);
        setModalMessage("登出失敗，請稍後再試。", "error");
      }
    }
  }, [app, router, setModalMessage]);

  const handleGoToRestaurants = useCallback(() => {
    router.push("/restaurants");
  }, [router]);

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-md">
      <div className="flex flex-col lg:flex-row items-center w-full p-3 px-4 sm:px-4 lg:px-4 lg:justify-between">
        <div className="flex items-center justify-between w-full lg:w-[30%] mb-2 lg:mb-0 lg:justify-start">
          <button
            onClick={handleGoHome}
            className="flex items-center bg-transparent border-none "
            aria-label="回首頁"
          >
            <Image
              src="/Chopsbook_logo_white_v2.png"
              width={60}
              height={30}
              alt="ChopsBook logo"
              className="px-2 pb-2"
            />

            <h1 className="text-base font-bold text-yellow-500 hover:text-yellow-400 pr-3 transition duration-200">
              ChopsBook
            </h1>
          </button>

          <div className="ml-3 border-l border-white pl-3">
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleGoToPersonalPage}
                  className="text-white hover:text-yellow-500 transition duration-200 p-1 rounded-full"
                  aria-label="個人主頁"
                >
                  <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
                </button>
                <span className="text-gray-200 text-sm hidden sm:block">
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
                  className="text-red-400 hover:text-red-500 transition duration-200 text-sm px-2"
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

        <form
          onSubmit={handleSearchSubmit}
          className="flex-grow w-full lg:w-[40%] flex items-center justify-center my-2 lg:my-0"
        >
          <div className="max-w-xl w-full flex">
            <input
              type="text"
              placeholder="搜尋餐廳、菜系、地點..."
              className="h-10 px-3 py-2 rounded-l-md w-full bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-transparent"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 h-10 p-2.5 rounded-r-md transition duration-200"
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
            {!isRestaurantsPage && (
              <button
                type="button"
                onClick={onShowFilterModal}
                className="bg-gray-700 hover:bg-gray-600 text-white h-10 p-2.5 rounded-md ml-2 transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
          </div>
        </form>

        <div className="flex items-center w-full lg:w-[30%] justify-end space-x-2 mt-2 lg:mt-0">
          
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

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="ml-2 lg:hidden p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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

      {isMobileMenuOpen && (
        <div className="lg:hidden w-full bg-gray-800 border-t border-gray-700 py-2 px-4 flex flex-col items-center space-y-2">
          {currentUser && (
            <button
              onClick={handleGoToPersonalPage}
              className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 bg-transparent border-none text-white cursor-pointer"
            >
              個人主頁
            </button>
          )}
          <button
            onClick={() => {
              router.push("/merchant");
            }}
            className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 bg-transparent border-none text-white cursor-pointer"
          >
            餐廳專區
          </button>
          <button
            onClick={() => {
              router.push("/personal/reviews");
            }}
            className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 bg-transparent border-none text-white cursor-pointer"
          >
            寫食評
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                router.push("/admin");
              }}
              className="hover:text-yellow-500 transition duration-200 text-sm w-full text-center py-1 bg-transparent border-none text-white cursor-pointer"
            >
              管理員頁面
            </button>
          )}
        </div>
      )}

      <div className="bg-gray-800 text-white text-sm py-2 px-6 w-full flex flex-wrap justify-center gap-4 sm:gap-6 border-t border-gray-700">
        <button
          onClick={handleGoToRestaurants}
          className="hover:text-yellow-500 transition duration-200 text-sm bg-transparent border-none"
        >
          所有餐廳
        </button>
        <a
          href="#"
          className="hover:text-yellow-500 transition duration-200 text-sm"
        >
          所有類別
        </a>
        <a
          href="#"
          className="hover:text-yellow-500 transition duration-200 text-sm"
        >
          特價優惠
        </a>
        <a
          href="#"
          className="hover:text-yellow-500 transition duration-200 text-sm"
        >
          最新上架
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
