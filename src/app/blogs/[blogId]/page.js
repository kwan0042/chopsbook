// src/components/blog/BlogPage.js

"use client";

import React, { useState, useEffect, useRef, useContext } from "react";
import { doc, getDoc } from "firebase/firestore"; 
import { useParams } from "next/navigation";
import { AuthContext } from "../../../lib/auth-context";
import Image  from "next/image";

// Utility function to format timestamp
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

// The main BlogPage component
const BlogPage = () => {
  const { blogId } = useParams();
  const { db, authReady, appId } = useContext(AuthContext);
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const parsedContentCache = useRef(null);

  useEffect(() => {
    // Ensure all dependencies are ready before starting the fetch
    if (!authReady || !db || !appId || !blogId) {
      if (authReady) {
        console.error(
          "Required dependencies are missing. db:",
          !!db,
          "appId:",
          !!appId,
          "blogId:",
          !!blogId
        );
        setError("無法載入文章：必要的服務或文章ID缺失。");
        setLoading(false);
      }
      return;
    }

    console.log("BlogPage: Firebase 服務已準備，開始讀取文章。");
    setLoading(true);

    const blogDocRef = doc(
      db,
      `artifacts/${appId}/public/data/blogs/${blogId}`
    );

    // 💡 核心修改：使用 getDoc 進行單次讀取
    const fetchBlogData = async () => {
      try {
        const docSnap = await getDoc(blogDocRef); // 執行單次讀取

        if (docSnap.exists()) {
          const data = docSnap.data();
          setBlog({ id: docSnap.id, ...data });
          setError(null);
        } else {
          // If the document does not exist, set a specific error message
          setError("找不到此文章。");
        }
      } catch (err) {
        console.error("載入文章時發生錯誤:", err);
        setError("載入文章時發生錯誤。");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogData();

    // 💡 清理函數：現在沒有監聽器需要取消訂閱，但我們可以保留一個空的清理函數以保持 React 習慣
    return () => {};
  }, [authReady, db, appId, blogId]);

  // Handle the case where the user navigates without a blogId
  if (!blogId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="text-gray-500 text-lg">無效的文章 ID。</div>
      </div>
    );
  }

  const parseAndRenderContent = () => {
    if (!blog || !blog.content) return <p>沒有內容</p>;

    if (
      parsedContentCache.current &&
      parsedContentCache.current.content === blog.content
    ) {
      return parsedContentCache.current.rendered;
    }

    const blocks = [];
    const imageRegex = /<img src="([^"]+)"[^>]*\/>/g;
    let lastIndex = 0;
    let match;
    while ((match = imageRegex.exec(blog.content)) !== null) {
      if (match.index > lastIndex) {
        blocks.push({
          type: "text",
          content: blog.content.substring(lastIndex, match.index),
        });
      }
      blocks.push({ type: "image", content: match[0], url: match[1] });
      lastIndex = imageRegex.lastIndex;
    }
    if (lastIndex < blog.content.length) {
      blocks.push({ type: "text", content: blog.content.substring(lastIndex) });
    }

    const renderedElements = [];
    let skipNext = false;
    for (let i = 0; i < blocks.length; i++) {
      if (skipNext) {
        skipNext = false;
        continue;
      }

      const block = blocks[i];
      if (block.type === "text") {
        renderedElements.push(
          <div
            key={i}
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: block.content }}
          ></div>
        );
      } else if (block.type === "image") {
        const nextBlock = blocks[i + 1];
        const isGrouped = nextBlock && nextBlock.type === "image";

        if (isGrouped) {
          skipNext = true;
          renderedElements.push(
            <div
              key={`group-${i}`}
              className="flex flex-col md:flex-row items-start gap-4 my-4"
            >
              <div className="w-full md:w-1/2">
                <Image
                  src={block.url}
                  alt="文章內文圖片"
                  className="w-full h-auto rounded-lg shadow-md"
                />
              </div>
              <div className="w-full md:w-1/2">
                <Image
                  src={nextBlock.url}
                  alt="文章內文圖片"
                  className="w-full h-auto rounded-lg shadow-md"
                />
              </div>
            </div>
          );
        } else {
          renderedElements.push(
            <div key={i} className="my-4">
              <Image
                src={block.url}
                alt="文章內文圖片"
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
          );
        }
      }
    }

    parsedContentCache.current = {
      content: blog.content,
      rendered: renderedElements,
    };
    return renderedElements;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="text-gray-500 text-lg">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-center bg-cbbg min-h-screen p-6 font-sans">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 p-6">
          <Image src={blog?.coverImage} alt={blog?.title}/>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            {blog?.title || "沒有標題"}
          </h1>
          <div className="text-sm text-gray-500 mb-6 border-b pb-4">
            作者: Admin •{" "}
            {blog?.submittedAt ? formatDateTime(blog.submittedAt) : "無"}
          </div>
          <div className="prose max-w-none text-gray-700 leading-relaxed">
            {parseAndRenderContent()}
          </div>
          {Array.isArray(blog?.tags) && blog.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogPage;
