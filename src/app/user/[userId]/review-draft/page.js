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
        const response = await fetch(`/api/user/review?userId=${userId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "未能獲取草稿。");
        }
        setDrafts(data.drafts);
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
    <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg w-full max-w-4xl relative">
      <Link
        href="/user/dashboard"
        className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors flex items-center"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        返回個人頁面
      </Link>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-8">
        我的食評草稿
      </h2>
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
