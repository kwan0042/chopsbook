// src/components/home/TrendingTopicsSection.js

"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/lib/auth-context";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";

const TrendingTopicsSection = () => {
  const { db, appId, loadingUser } = useContext(AuthContext);
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "無";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 🚀 只要最新 4 篇文章
  useEffect(() => {
    if (loadingUser || !db || !appId) {
      setLoadingBlogs(false);
      return;
    }

    const fetchData = async () => {
      setLoadingBlogs(true);
      try {
        const blogsRef = collection(db, `artifacts/${appId}/public/data/blogs`);
        const q = query(
          blogsRef,
          where("status", "==", "published"),
          orderBy("submittedAt", "desc"),
          limit(4) // ✅ Firestore 限制只取 4 篇
        );

        const snapshot = await getDocs(q);
        const fetchedBlogs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBlogs(fetchedBlogs);
      } catch (error) {
        console.error("Failed to load trending topics:", error);
      } finally {
        setLoadingBlogs(false);
      }
    };

    fetchData();
  }, [db, appId, loadingUser]);

  // -------------------------
  // 【新增共用連結組件】
  // -------------------------
  const MoreLink = ({ className }) => (
    <Link
      className={`text-blue-600 hover:text-blue-800 hover:underline transition ${className}`}
      href="/blogs"
    >
      更多文章
    </Link>
  );

  return (
    // 【修改點 1】：移除 bg-white，調整邊距、圓角和陰影，確保網頁版有白色背景
    <section className="pt-4 pb-4 md:pt-8 md:pb-6 px-0 md:px-6 lg:px-8 md:bg-white md:shadow-md rounded-md md:rounded-lg">
      {/* 【核心修改】：將標題和連結放在同一行，並在 md 處切換佈局 */}
      <div className="flex justify-between items-center px-4 md:px-0 mb-4 md:mb-8">
        {/* 標題 (H2) */}
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 md:text-center md:w-full">
          熱門話題或文章
        </h2>
        {/* 更多文章連結 (只在手機顯示) */}
        <div className="md:hidden flex-shrink-0">
          <MoreLink className="text-sm" />
        </div>
      </div>
      {/* ---------------------------------------------------- */}

      {loadingBlogs ? (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
          <p className="text-gray-600 ml-4">載入文章中...</p>
        </div>
      ) : (
        // 【修改點 3】：核心佈局修改：手機版 flex 橫向滾動，網頁版 grid-cols-4
        <div className="flex overflow-x-scroll md:grid md:grid-cols-4 gap-3 md:gap-6 max-w-screen-xl mx-auto px-4 md:px-0 scrollbar-hide">
          {blogs.length > 0 ? (
            blogs.map((blog) => (
              <Link key={blog.id} href={`/blogs/${blog.id}`} passHref>
                {/* 【修改點 4】：卡片樣式調整 - 移除 overflow-hidden, 調整寬度, 縮小 hover:scale */}
                <div
                  className="
                        flex-shrink-0 w-[60vw] w md:w-auto 
                        bg-gray-50 rounded-lg my-1 shadow-sm 
                        transform hover:scale-102 transition duration-300 ease-in-out border border-gray-200 cursor-pointer
                    "
                >
                  <img
                    src={
                      blog.coverImage ||
                      "https://placehold.co/300x180/E6E6FA/000000?text=無圖片"
                    }
                    alt={blog.title}
                    // 圖片高度調整：h-28 (手機) -> h-36 (小平板) -> h-40 (網頁)
                    className="w-full h-28 sm:h-36 md:h-40 object-cover rounded-t-lg"
                  />
                  <div className="p-3">
                    {/* 內邊距縮小 */}
                    {/* 文字變細 (text-base) */}
                    <h3 className="text-base md:text-md h-10 md:h-15 font-semibold text-gray-800 mb-1">
                      {blog.title}
                    </h3>
                    {/* 連結文字縮小 (text-xs) */}
                    <p className="text-gray-500 text-xs md:text-sm font-medium ">
                      {blog.submittedAt
                        ? formatDateTime(blog.submittedAt)
                        : "無"}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            // 處理手機版單欄時的空狀態
            <div className="col-span-full text-center text-gray-500 w-[90vw] md:w-auto">
              目前沒有已發佈的文章。
            </div>
          )}
          {/* 在橫向滾動末端增加間距，防止最後一張卡片貼邊 */}
          <div className="flex-shrink-0 w-4 md:hidden"></div>
        </div>
      )}

      {/* 更多文章連結 (只在網頁版顯示) */}
      {/* 【修改點 5】：將其隱藏，並在 md 處恢復顯示，保持網頁版設計在內容下方有連結 */}
      <div className="hidden md:block text-right pt-3 px-4 md:px-5">
        <MoreLink className="text-base" />
      </div>
    </section>
  );
};

export default TrendingTopicsSection;
