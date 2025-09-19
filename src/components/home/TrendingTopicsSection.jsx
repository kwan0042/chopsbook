// src/components/TrendingTopicsSection.js

"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/lib/auth-context";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"; // Import `getDocs`
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";


const TrendingTopicsSection = () => {
  const { db, appId, loadingUser } = useContext(AuthContext);
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(blogs.length / itemsPerPage);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
  };

  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const displayedBlogs = blogs.slice(start, end);

  // This `useEffect` now runs a one-time data fetch
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
          orderBy("submittedAt", "desc")
        );

        // ✅ Key change: Use getDocs for a one-time fetch
        const snapshot = await getDocs(q);

        const fetchedBlogs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBlogs(fetchedBlogs);
        setLoadingBlogs(false);
        setCurrentPage(0);
      } catch (error) {
        console.error("Failed to load trending topics:", error);
        setLoadingBlogs(false);
      }
    };

    fetchData();
  }, [db, appId, loadingUser]);

  return (
    <section className="pt-8 pb-6  bg-white shadow-md rounded-lg">
      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
        熱門話題或文章
      </h2>

      {loadingBlogs ? (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
          <p className="text-gray-600 ml-4">載入文章中...</p>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          {/* Previous page button */}
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="p-4 mr-2 text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Content grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-screen-xl mx-auto">
            {displayedBlogs.length > 0 ? (
              displayedBlogs.map((blog) => (
                <Link key={blog.id} href={`/blogs/${blog.id}`} passHref>
                  <div className="bg-gray-50 rounded-lg shadow-sm overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out border border-gray-200 cursor-pointer">
                    <img
                      src={
                        blog.coverImage ||
                        "https://placehold.co/300x180/E6E6FA/000000?text=無圖片"
                      }
                      alt={blog.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-lg h-15 font-semibold text-gray-800 mb-2">
                        {blog.title}
                      </h3>
                      <p className="text-blue-700 text-sm font-medium hover:underline">
                        查看詳情 &rarr;
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                目前沒有已發佈的文章。
              </div>
            )}
          </div>

          {/* Next page button */}
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            className="p-2 ml-2 text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}
      <div className="text-right pt-3 px-5">
        <Link className="text-blue-600 hover:text-blue-800 hover:underline transition" href="/blogs">更多文章</Link>
      </div>
    </section>
  );
};

export default TrendingTopicsSection;
