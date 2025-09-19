"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/lib/auth-context";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";
import Navbar from "@/components/Navbar";

// 使用 Tailwind CSS 來進行樣式設計，不需要外部 CSS 檔案
const BlogsPage = () => {
  const { db, appId, loadingUser, formatDateTime } = useContext(AuthContext);
  const [allBlogs, setAllBlogs] = useState([]); // 儲存所有文章
  const [filteredBlogs, setFilteredBlogs] = useState([]); // 顯示在頁面上的文章（已篩選但未分頁）
  const [displayedBlogs, setDisplayedBlogs] = useState([]); // 顯示在當前頁面的文章
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const [availableTags, setAvailableTags] = useState([]); // ✅ 修正：定義 setAvailableTags

  const [currentPage, setCurrentPage] = useState(1); // 當前頁碼
  const itemsPerPage = 24; // 每頁顯示的文章數量

  useEffect(() => {
    if (loadingUser || !db || !appId) {
      if (!loadingUser) {
        setLoading(false);
      }
      return;
    }

    const fetchPublishedBlogs = async () => {
      try {
        setLoading(true);
        const blogsRef = collection(db, `artifacts/${appId}/public/data/blogs`);
        const q = query(
          blogsRef,
          where("status", "==", "published"),
          orderBy("submittedAt", "desc")
        );
        const querySnapshot = await getDocs(q);

        const fetchedBlogs = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          };
        });

        const tags = fetchedBlogs.reduce((acc, blog) => {
          if (blog.tags && Array.isArray(blog.tags)) {
            blog.tags.forEach((tag) => {
              if (tag && !acc.includes(tag)) {
                acc.push(tag);
              }
            });
          }
          return acc;
        }, []);

        setAllBlogs(fetchedBlogs);
        setAvailableTags(tags.sort());
        setFilteredBlogs(fetchedBlogs);
      } catch (error) {
        console.error("載入已發布文章失敗:", error);
        toast.error("無法載入文章列表，請稍後再試。");
      } finally {
        setLoading(false);
      }
    };

    fetchPublishedBlogs();
  }, [db, appId, loadingUser]);

  useEffect(() => {
    // 根據搜尋關鍵字和選定的標籤篩選文章
    const keyword = searchKeyword.toLowerCase();
    const filtered = allBlogs.filter((blog) => {
      const matchesKeyword =
        blog.title.toLowerCase().includes(keyword) ||
        (blog.summary && blog.summary.toLowerCase().includes(keyword));

      const matchesTag =
        !selectedTag || (blog.tags && blog.tags.includes(selectedTag));

      return matchesKeyword && matchesTag;
    });
    setFilteredBlogs(filtered);
    setCurrentPage(1); // 當篩選條件改變時，重設到第一頁
  }, [searchKeyword, selectedTag, allBlogs]);

  useEffect(() => {
    // 根據當前頁碼來顯示文章
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedBlogs(filteredBlogs.slice(startIndex, endIndex));
  }, [currentPage, filteredBlogs, itemsPerPage]);

  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage); // 計算總頁數

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
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

  if (loading || loadingUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
        <p className="ml-4 text-gray-600">載入中...</p>
      </div>
    );
  }

  if (allBlogs.length === 0) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen p-8 text-center text-gray-500">
          <p>目前沒有已發布的文章。</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          所有文章
        </h1>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
          <input
            type="text"
            placeholder="搜尋標題或摘要..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full sm:w-1/2 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full sm:w-1/4 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          >
            <option value="">所有主題</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        {displayedBlogs.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>沒有找到與 {searchKeyword} 相關的文章。</p>
          </div>
        ) : (
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
                      {formatDateTime(blog.submittedAt).split(" ")[0]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ✅ 新增：分頁控制項 */}
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
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一頁
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default BlogsPage;
