"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/lib/auth-context";
import {
  collection,
  query,
  onSnapshot,
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

const BlogManagement = () => {
  const { db, appId, formatDateTime, loadingUser } = useContext(AuthContext);
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("pending"); // 可選值: 'pending', 'reviewed'
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [pageCursors, setPageCursors] = useState([null]);

  // 輔助函數：將狀態翻譯成中文
  const getStatusDisplay = (status) => {
    switch (status) {
      case "pending":
        return "待處理";
      case "reviewed":
        return "已審批";
      case "rejected":
        return "已否決";
      default:
        return "待處理";
    }
  };

  // 處理導航到文章編輯頁面
  const handleViewArticleDetails = (articleId) => {
    window.open(`/admin/admin_blog/${articleId}`, "_blank");
  };

  // 處理切換視圖模式，並重設分頁狀態
  const handleViewModeChange = (mode) => {
    if (viewMode !== mode) {
      setArticles([]);
      setLoading(true);
      setPage(0);
      setPageCursors([null]);
      setHasMore(true);
      setViewMode(mode);
    }
  };

  // 核心資料獲取邏輯
  useEffect(() => {
    if (loadingUser || !db || !appId) {
      setLoading(false);
      return;
    }

    const articlesRef = collection(db, `artifacts/${appId}/public/data/blogs`);
    const pageSize = 10; // 每頁顯示 10 筆資料

    let unsubscribe;

    const fetchData = async () => {
      try {
        setLoading(true);

        if (viewMode === "pending") {
          // 待處理模式：使用即時監聽器
          const q = query(
            articlesRef,
            where("status", "==", "pending"),
            orderBy("submittedAt", "desc")
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedArticles = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
              displayStatus: getStatusDisplay(docSnap.data().status),
            }));
            setArticles(fetchedArticles);
            setHasMore(false); // 待處理模式不需要分頁，所以永遠為 false
            setLoading(false);
          });
        } else {
          // 已審批模式：使用分頁查詢
          const lastVisible = pageCursors[page];

          let q = query(
            articlesRef,
            where("status", "in", ["reviewed", "rejected"]),
            orderBy("submittedAt", "desc"),
            limit(pageSize + 1) // 額外多取一筆，以判斷是否還有下一頁
          );
          if (lastVisible) {
            q = query(q, startAfter(lastVisible));
          }

          const querySnapshot = await getDocs(q);

          // 判斷是否還有更多資料
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
        }
      } catch (error) {
        console.error("載入文章資料失敗:", error);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [db, appId, loadingUser, viewMode, page]);

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
          <p className="text-sm text-gray-600 mt-1">
            管理所有待處理與已審批的部落格文章。
          </p>
        </div>
        <div className="flex space-x-2">
          <Link
            href="/admin/admin_blogs/new"
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 bg-green-600 text-white hover:bg-green-700"
          >
            新增文章
          </Link>
          <button
            onClick={() => handleViewModeChange("pending")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              viewMode === "pending"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            待處理文章
          </button>
          <button
            onClick={() => handleViewModeChange("reviewed")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              viewMode === "reviewed"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            已審批文章
          </button>
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
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">動作</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articles.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  {viewMode === "pending"
                    ? "目前沒有待處理的文章。"
                    : "目前沒有已審批或已否決的文章。"}
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr
                  key={article.id}
                  className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => handleViewArticleDetails(article.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="text-sm font-medium text-gray-900">
                      {article.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {article.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {article.authorId || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        article.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : article.status === "reviewed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {article.displayStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
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
                      查看詳細
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewMode === "reviewed" && (
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
      )}
    </div>
  );
};

export default BlogManagement;
