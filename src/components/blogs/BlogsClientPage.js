// components/blogs/BlogsClientPage.js
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
  initialKeyword, // 這是 URL 中 "已套用" 的值 (用於初始化和換頁)
  initialTag, // 這是 URL 中 "已套用" 的值 (用於初始化和換頁)
  nextCursor,
}) => {
  const { formatDateTime } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams(); // 1. 狀態：用於顯示的文章列表 (響應 initialBlogs 變化)

  const [displayedBlogs, setDisplayedBlogs] = useState(initialBlogs); // 2. 狀態：用於管理篩選表單中 "未套用" 的值 (父組件管理狀態)

  const [formKeyword, setFormKeyword] = useState(initialKeyword || "");
  const [formTag, setFormTag] = useState(initialTag || ""); // 3. 狀態：處理 Loading 狀態

  const [isLoading, setIsLoading] = useState(false); // 4. 關鍵修復：使用 useEffect 監聽 Props 變化並同步所有狀態

  useEffect(() => {
    // a) 更新文章列表
    setDisplayedBlogs(initialBlogs); // b) 將表單輸入重置為 URL 中 "已套用" 的最新值

    setFormKeyword(initialKeyword || "");
    setFormTag(initialTag || ""); // c) 關閉 Loading

    setIsLoading(false); // 可選：路由改變後，滾動到頁面頂部

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [initialBlogs, currentPage, initialKeyword, initialTag]); // 處理換頁邏輯 (保持不變)

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", pageNumber); // 換頁時，繼續使用 URL 中 "已套用" 的篩選值

      params.set("keyword", initialKeyword || "");
      params.set("tag", (initialTag || "").trim());

      if (pageNumber > currentPage) {
        params.set("lastCursor", nextCursor);
      } else {
        params.delete("lastCursor");
      }

      setIsLoading(true);
      router.push(`/blogs?${params.toString()}`, { scroll: true });
    }
  }; // 核心邏輯：處理點擊 "篩選" 按鈕的邏輯

  const handleApplyFilter = ({
    searchKeyword: newKeyword,
    selectedTag: newTag,
  }) => {
    // 此函數會從 BlogFilters.js 接收最新的關鍵字和標籤

    const cleanTag = newTag ? newTag.trim() : "";

    const params = new URLSearchParams();
    params.set("page", 1);
    params.set("keyword", newKeyword);
    params.set("tag", cleanTag);
    params.delete("lastCursor"); // 觸發 SSR 重新讀取

    setIsLoading(true);
    router.push(`/blogs?${params.toString()}`);
  }; // ⚠️ 刪除您提供的程式碼中冗餘的 handleFilter 函數定義

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
          {i}{" "}
        </button>
      );
    }
    return pageNumbers;
  };

  const safeFormatDateTime = (timestamp) => {
    return formatDateTime
      ? formatDateTime({ seconds: timestamp }).split(" ")[0]
      : new Date(timestamp * 1000).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner /> <p className="ml-4 text-gray-600">載入中...</p>{" "}
      </div>
    );
  } // 渲染沒有文章的狀態

  if (displayedBlogs.length === 0) {
    return (
      <div className="container bg-cbbg mx-auto p-4 md:p-8">
        {" "}
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          所有文章{" "}
        </h1>
        {/* 關鍵修改：統一屬性傳遞 */}{" "}
        <BlogFilters
          availableTags={availableTags} // 傳遞 UI 顯示值 (來自父組件狀態)
          searchKeyword={formKeyword}
          selectedTag={formTag} // 傳遞狀態修改器 (讓子組件可以更新 formKeyword/formTag)
          onKeywordChange={setFormKeyword}
          onTagChange={setFormTag}
          // 傳遞按鈕點擊函數 (統一為 onFilter)
          onFilter={handleApplyFilter} // 移除冗餘的 initialKeyword/initialTag (因為我們用 formKeyword/formTag)
        />{" "}
        <div className="text-center text-gray-500 mt-8">
          <p>目前沒有已發布的文章，或沒有找到相關的文章。</p>{" "}
        </div>{" "}
      </div>
    );
  } // 渲染文章列表

  return (
    <div className="container bg-cbbg mx-auto p-4 md:p-8">
      {" "}
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        所有文章{" "}
      </h1>
      {/* 關鍵修改：統一屬性傳遞 */}{" "}
      <BlogFilters
        availableTags={availableTags} // 傳遞 UI 顯示值 (來自父組件狀態)
        searchKeyword={formKeyword}
        selectedTag={formTag} // 傳遞狀態修改器 (讓子組件可以更新 formKeyword/formTag)
        onKeywordChange={setFormKeyword}
        onTagChange={setFormTag} // 傳遞按鈕點擊函數 (統一為 onFilter)
        onFilter={handleApplyFilter} // 移除冗餘的 initialKeyword/initialTag
      />
      {/* ... (文章列表和分頁控制項渲染保持不變) */}{" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {" "}
        {displayedBlogs.map((blog) => (
          <div
            key={blog.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105"
          >
            {" "}
            {blog.coverImage ? (
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                <p>無封面圖</p>{" "}
              </div>
            )}{" "}
            <div className="p-4 grid grid-cols-4 grid-rows-3 ">
              {" "}
              <div className="col-span-4 row-span-2">
                {" "}
                <h2 className="text-xl font-semibold mb-2 text-gray-800 line-clamp-2">
                  {blog.title}{" "}
                </h2>{" "}
              </div>{" "}
              <div className="col-span-2 row-span-1">
                {" "}
                <a href={`/blogs/${blog.id}`}>
                  {" "}
                  <div className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                    查看詳情{" "}
                  </div>{" "}
                </a>{" "}
              </div>{" "}
              <div className="col-span-2 row-span-1 w-full h-full flex items-center justify-end">
                {" "}
                <span className="text-gray-400">
                  {safeFormatDateTime(blog.submittedAt)}{" "}
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        ))}{" "}
      </div>
      {/* 分頁控制項 */}{" "}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          {" "}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一頁{" "}
          </button>
          {renderPageNumbers()}{" "}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={
              currentPage === totalPages || displayedBlogs.length < itemsPerPage
            }
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一頁{" "}
          </button>{" "}
        </div>
      )}{" "}
    </div>
  );
};

export default BlogsClientPage;
