// src/components/admin/blogsManagement/blogManagement.js

"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/lib/auth-context";
import {
  collection,
  query,
  doc,
  getDocs,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { Switch } from "@/components/ui/switch";

const BlogManagement = () => {
  const { db, appId, formatDateTime, loadingUser, getToken } =
    useContext(AuthContext);
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [pageCursors, setPageCursors] = useState([null]);
  const [isUpdating, setIsUpdating] = useState(false);

  // 輔助函數：將狀態翻譯成中文
  const getStatusDisplay = (status) => {
    switch (status) {
      case "pending":
        return "待處理";
      case "published":
        return "已發佈";
      case "rejected":
        return "已否決";
      case "draft":
        return "草稿";
      default:
        return "待處理";
    }
  };

  // 處理導航到文章編輯頁面
  const handleViewArticleDetails = (articleId) => {
    router.push(`/admin/admin_blogs/${articleId}`);
  };

  // 處理狀態變更
  const handleStatusChange = async (articleId, newStatus) => {
    if (isUpdating) return;

    setIsUpdating(true);
    const token = await getToken();

    try {
      const response = await fetch("/api/blogs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: articleId,
          status: newStatus,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(`文章狀態已更新為 ${getStatusDisplay(newStatus)}！`, {
          position: "top-right",
        });

        // ✅ 關鍵修正：在後端成功更新後，立即更新前端的 articles 狀態
        setArticles((prevArticles) =>
          prevArticles.map((article) =>
            article.id === articleId
              ? {
                  ...article,
                  status: newStatus,
                  displayStatus: getStatusDisplay(newStatus),
                }
              : article
          )
        );
      } else {
        throw new Error(result.error || "狀態更新失敗");
      }
    } catch (error) {
      console.error("更新文章狀態失敗:", error);
      toast.error(error.message || "更新失敗，請稍後再試。", {
        position: "top-right",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // 核心資料獲取邏輯
  useEffect(() => {
    if (loadingUser || !db || !appId) {
      setLoading(false);
      return;
    }

    const articlesRef = collection(db, `artifacts/${appId}/public/data/blogs`);
    const pageSize = 10;

    // 由於我們改用一次性讀取，所以不需要即時監聽器
    let unsubscribe = () => {};

    const fetchData = async () => {
      try {
        setLoading(true);

        const lastVisible = pageCursors[page];

        let q = query(
          articlesRef,
          orderBy("submittedAt", "desc"),
          limit(pageSize + 1)
        );
        if (lastVisible) {
          q = query(
            articlesRef,
            orderBy("submittedAt", "desc"),
            startAfter(lastVisible),
            limit(pageSize + 1)
          );
        }

        const querySnapshot = await getDocs(q);
        const hasMoreData = querySnapshot.docs.length > pageSize;
        setHasMore(hasMoreData);

        const docsToDisplay = hasMoreData
          ? querySnapshot.docs.slice(0, pageSize)
          : querySnapshot.docs;

        const newArticles = docsToDisplay.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          displayStatus: getStatusDisplay(docSnap.data().status),
        }));
        setArticles(newArticles);

        if (querySnapshot.docs.length > 0 && pageCursors.length <= page + 1) {
          setPageCursors((prev) => [
            ...prev,
            querySnapshot.docs[querySnapshot.docs.length - 1],
          ]);
        }
        setLoading(false);
      } catch (error) {
        console.error("載入文章資料失敗:", error);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [db, appId, loadingUser, page, pageCursors]);

  const handleNextPage = () => {
    if (hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    setPage((prevPage) => Math.max(0, prevPage - 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <p className="text-gray-600 ml-4">載入文章資料中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">部落格管理</h2>
          <p className="text-sm text-gray-600 mt-1">管理所有部落格文章。</p>
        </div>
        <div className="flex space-x-2">
          <Link
            href="/admin/admin_blogs/new"
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 bg-green-600 text-white hover:bg-green-700"
          >
            新增文章
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                文章標題
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                作者
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                狀態
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                提交時間
              </th>
              <th scope="col" className="relative px-6 py-3 text-center">
                詳細
              </th>
              <th scope="col" className="relative px-6 py-3 text-center">
                發佈
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articles.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  目前沒有任何文章。
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr
                  key={article.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 cursor-pointer"
                    onClick={() => handleViewArticleDetails(article.id)}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {article.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {article.id}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 cursor-pointer"
                    onClick={() => handleViewArticleDetails(article.id)}
                  >
                    {article.authorId || "N/A"}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-center text-sm cursor-pointer"
                    onClick={() => handleViewArticleDetails(article.id)}
                  >
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        article.status === "pending" ||
                        article.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : article.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {article.displayStatus}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 cursor-pointer"
                    onClick={() => handleViewArticleDetails(article.id)}
                  >
                    {formatDateTime(article.submittedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewArticleDetails(article.id);
                      }}
                      className="px-4 py-2 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
                    >
                      編輯
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {/* 只有在文章狀態為 published 或 pending 時才顯示開關 */}
                    {(article.status === "published" ||
                      article.status === "pending") && (
                      <Switch
                        checked={article.status === "published"}
                        onCheckedChange={(checked) => {
                          const newStatus = checked ? "published" : "pending";
                          handleStatusChange(article.id, newStatus);
                        }}
                        disabled={isUpdating}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center space-x-4 p-4">
        {page > 0 && (
          <button
            onClick={handlePrevPage}
            className={`px-6 py-2 rounded-md text-white transition-colors duration-200 shadow-sm ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            disabled={loading}
          >
            上一頁
          </button>
        )}
        {hasMore && (
          <button
            onClick={handleNextPage}
            className={`px-6 py-2 rounded-md text-white transition-colors duration-200 shadow-sm ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            disabled={loading}
          >
            {loading ? "載入中..." : "下一頁"}
          </button>
        )}
      </div>
    </div>
  );
};

export default BlogManagement;
