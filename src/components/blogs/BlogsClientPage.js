"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import BlogFilters from "@/components/blogs/BlogFilters";
import LoadingSpinner from "@/components/LoadingSpinner";

const BlogsClientPage = ({
  initialBlogs,
  availableTags,
  itemsPerPage,
  currentPage,
  totalPages,
  initialKeyword,
  initialTag,
  nextCursor, // 接收下一頁的遊標 (Last Doc's submittedAt_id)
}) => {
  const { formatDateTime } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 由於數據都是 SSR 獲取，這裡只用來顯示
  const [displayedBlogs] = useState(initialBlogs);

  // 處理 Loading 狀態
  const [isLoading, setIsLoading] = useState(false);

  // 處理 Next.js 路由事件，提供更好的載入體驗
  useEffect(() => {
    // 由於 App Router 移除了 router.events，這裡我們使用一個簡單的計時器
    // 來模擬載入狀態，或依賴 Next.js 內建的 loading.js 檔案。
    // 這裡我們只在點擊事件中手動設置 setIsLoading(true)。
    // 為了符合原有設計，我們保留了這個狀態。
    return () => {};
  }, []);

  // 處理換頁邏輯 (觸發 SSR)
  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      const params = new URLSearchParams(searchParams);
      params.set("page", pageNumber);
      params.set("keyword", initialKeyword); // 保持篩選條件
      params.set("tag", initialTag); // 保持篩選條件

      // 設置遊標：只有當頁碼變大時才需要傳輸 nextCursor
      if (pageNumber > currentPage) {
        // 下一頁：使用 Server Component 計算好的 nextCursor
        params.set("lastCursor", nextCursor);
      } else {
        // 上一頁或非第一頁的跳頁：清除遊標，讓 Server Component 從頭開始計算
        // 這是使用基於遊標分頁時，處理 "上一頁" 的必要折衷。
        params.delete("lastCursor");
      }

      // 觸發 SSR 重新讀取
      setIsLoading(true);
      router.push(`/blogs?${params.toString()}`, { scroll: true });
    }
  };

  // 處理篩選邏輯 (觸發 SSR)
  const handleFilter = ({ searchKeyword: newKeyword, selectedTag: newTag }) => {
    const params = new URLSearchParams();
    params.set("page", 1); // 篩選時重設到第一頁
    params.set("keyword", newKeyword);
    params.set("tag", newTag);
    params.delete("lastCursor"); // 篩選時清除遊標

    // 觸發 SSR 重新讀取
    setIsLoading(true);
    router.push(`/blogs?${params.toString()}`);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2 rounded-md mx-1 transition-colors duration-200 ${
            i === currentPage
              ? "bg-blue-600 text-white font-bold"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  const safeFormatDateTime = (timestamp) => {
    // 處理 Admin SDK 返回的數字 (Unix Timestamp)
    return formatDateTime
      ? formatDateTime({ seconds: timestamp }).split(" ")[0]
      : new Date(timestamp * 1000).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
        <p className="ml-4 text-gray-600">載入中...</p>
      </div>
    );
  }

  if (displayedBlogs.length === 0) {
    return (
      <div className="container bg-cbbg mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          所有文章
        </h1>
        <BlogFilters
          availableTags={availableTags}
          onFilter={handleFilter}
          initialKeyword={initialKeyword}
          initialTag={initialTag}
        />
        <div className="text-center text-gray-500 mt-8">
          <p>目前沒有已發布的文章，或沒有找到相關的文章。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container bg-cbbg mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        所有文章
      </h1>

      <BlogFilters
        availableTags={availableTags}
        onFilter={handleFilter}
        initialKeyword={initialKeyword}
        initialTag={initialTag}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedBlogs.map((blog) => (
          <div
            key={blog.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105"
          >
            {blog.coverImage ? (
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                <p>無封面圖</p>
              </div>
            )}
            <div className="p-4 grid grid-cols-4 grid-rows-3 ">
              <div className="col-span-4 row-span-2">
                <h2 className="text-xl font-semibold mb-2 text-gray-800 line-clamp-2">
                  {blog.title}
                </h2>
              </div>
              <div className="col-span-2 row-span-1">
                <a href={`/blogs/${blog.id}`}>
                  <div className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                    查看詳情
                  </div>
                </a>
              </div>
              <div className="col-span-2 row-span-1 w-full h-full flex items-center justify-end">
                <span className="text-gray-400">
                  {safeFormatDateTime(blog.submittedAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 分頁控制項 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一頁
          </button>
          {renderPageNumbers()}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={
              currentPage === totalPages || displayedBlogs.length < itemsPerPage
            }
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
};

export default BlogsClientPage;
