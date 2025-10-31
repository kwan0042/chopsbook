// src/app/user/[userId]/review-draft/page.js
"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/lib/auth-context";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import DraftsListClient from "@/components/reviews/DraftsListClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const DraftsPage = ({ params }) => {
  const { currentUser, loadingUser } = useContext(AuthContext);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 修正：使用 React.use(params) 處理 Promise
  const { userId } = React.use(params);

  useEffect(() => {
    if (loadingUser || !currentUser) {
      return;
    }

    if (currentUser.uid !== userId) {
      setError("你沒有權限查看此用戶的草稿。");
      setLoading(false);
      return;
    }

    const fetchDrafts = async () => {
      try {
        // 🚨 關鍵修正：將 URL 更新為新的路徑
        const response = await fetch(
          `/api/user/review-drafts?userId=${userId}`
        );

        // ** (為了解決之前可能的 JSON 錯誤，這裡建議使用更健壯的處理) **
        if (!response.ok) {
          let errorData = {};
          try {
            errorData = await response.json();
          } catch {
            // 如果無法解析 JSON，返回通用錯誤
            throw new Error(
              `伺服器錯誤 (HTTP ${response.status})，無法獲取詳細錯誤訊息。`
            );
          }
          throw new Error(
            errorData.message || `未能獲取草稿 (HTTP ${response.status})。`
          );
        }

        // 成功時解析 JSON
        const data = await response.json();

        setDrafts(data.drafts || []);
      } catch (err) {
        console.error("獲取草稿失敗:", err);
        setError(err.message || "獲取草稿時發生錯誤。");
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, [userId, currentUser, loadingUser]);

  if (loadingUser || loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px] bg-gray-50 rounded-xl shadow-md p-8 w-full max-w-4xl">
        <LoadingSpinner />
        <p className="ml-4 text-gray-700">載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-red-50 text-red-700 rounded-xl shadow-md p-8 w-full max-w-4xl">
        <p className="font-semibold text-lg">{error}</p>
        <Link href="/" className="mt-4 text-blue-600 hover:underline">
          返回主頁
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-lg w-full relative">
      <div className="flex w-full">
        <Link
          href={`/user/${userId}`}
          className="md:w-[20%] text-gray-500 hover:text-gray-700 transition-colors flex items-center"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          返回個人頁面
        </Link>
        <h2
          className="w-[80%] text-2xl font-bold text-gray-900 my-6 text-center
      "
        >
          我的食評草稿
        </h2>
        <div className="md:w-[20%]"></div>
      </div>
      {drafts.length === 0 ? (
        <p className="text-gray-600 text-center mt-4">
          你目前沒有任何草稿。
          <br />
          現在就去{" "}
          <Link href="/review-form" className="text-indigo-600 hover:underline">
            撰寫食評
          </Link>
          {"吧！"}
        </p>
      ) : (
        <DraftsListClient drafts={drafts} />
      )}
    </div>
  );
};

export default DraftsPage;
