"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useContext,
} from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
// 🚨 移除 NewRestaurantModal 導入，因為這是 ReviewManagement
// import NewRestaurantModal from "@/components/admin/restaurantManagement/NewRestaurantModal.js";
// 🚨 移除 EditRestaurantModal 導入，因為這是 ReviewManagement
// import EditRestaurantModal from "@/components/admin/restaurantManagement/EditRestaurantModal.js";

// 🎯 假設您有一個針對食評的編輯 Modal
import EditReviewModal from "@/components/admin/reviewManagement/EditReviewModal";
// 🎯 如果沒有新增食評的需求，NewRestaurantModal 也不應存在

import { AuthContext } from "@/lib/auth-context";

// --- 介面和常數 ---
const REVIEWS_PER_PAGE = 10;
// 這裡假設我們有一個食評欄位的定義
const REVIEW_FIELDS = {}; // 假設一個空物件或您自己的欄位定義

// 🎯 核心修改 1: 表格只顯示的欄位 (食評數據結構)
const DISPLAY_FIELDS = [
  // 餐廳名稱是透過 API 聯結後的欄位
  { key: "restaurantName", label: "餐廳名稱" }, // 假設 API 返回這個欄位
  { key: "reviewTitle", label: "食評標題" },
  { key: "overallRating", label: "總評分" },
  { key: "username", label: "用戶名稱" },
  { key: "createdAt", label: "建立日期" },
  { key: "status", label: "狀態" }, // 例如 published/pending
];
// -------------------

const getNestedValue = (obj, path) => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

// 由於您要求檢查 ReviewManagement.js，我將組件名稱假設為 ReviewManagement
const ReviewManagement = () => {
  const { formatDateTime } = useContext(AuthContext);

  const safeFormatDateTime = (timestamp) => {
    // 處理 Admin SDK 返回的數字 (Unix Timestamp)
    return formatDateTime
      ? formatDateTime({ seconds: timestamp }).split(" ")[0]
      : new Date(timestamp * 1000).toLocaleDateString();
  };

  // 🎯 核心修改 2: 將 restaurants 更名為 reviews
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🚨 核心修改 3: 移除新增餐廳 Modal 狀態，因為這是食評管理
  const [showAddModal, setShowAddModal] = useState(false);

  // 🎯 核心新增 1: 正在編輯的食評 ID (用於開啟 EditReviewModal)
  // 沿用 editTargetId，但它現在指代 reviewId
  const [editTargetId, setEditTargetId] = useState(null);

  // 🚨 核心修改 4: 移除圖片相關狀態，食評管理不需要這些
  const [selectedFile, setSelectedFile] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("");

  const [pageHistory, setPageHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const anchorIdRef = useRef(null);

  // --- 圖片處理函數 (🚨 核心修改 5: 移除不必要的圖片處理函數) ---
  // 由於 EditReviewModal 應處理自己的圖片狀態，我們移除這些不相關的 props
  const handleFileChange = useCallback(() => {}, []);
  const handleRemovePhoto = useCallback(() => {}, []);

  // --- 資料獲取邏輯 (Fetch Data) ---
  // 🎯 核心修改 6: 將 fetchRestaurants 更名為 fetchReviews
  const fetchReviews = useCallback(
    async (
      anchorIdToUse // 使用從 useEffect 傳入的錨點
    ) => {
      setLoading(true);

      const params = new URLSearchParams({
        limit: REVIEWS_PER_PAGE, // 🎯 核心修正：使用 REVIEWS_PER_PAGE
      });

      if (submittedSearchQuery.trim()) {
        params.append("search", submittedSearchQuery.trim());
      }

      if (!submittedSearchQuery.trim() && anchorIdToUse) {
        params.append("anchorId", anchorIdToUse);
      }

      // 🎯 核心修正：確認 API 路由是 /api/admin/reviews
      const url = `/api/admin/reviews?${params.toString()}`;

      try {
        const res = await fetch(url);
        // 🚨 修正錯誤處理，避免因非 2xx 狀態碼導致的循環
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            `Failed to fetch reviews: ${errorData.message || res.statusText}`
          );
        }

        const data = await res.json();

        // 🎯 核心修正：使用 setReviews
        setReviews(data.reviews);
        setHasMore(data.hasMore && !submittedSearchQuery.trim());

        const nextAnchor = submittedSearchQuery.trim()
          ? null
          : data.reviews.length > 0
          ? data.reviews[data.reviews.length - 1].id // 確保食評列表的最後一項包含 ID
          : null;

        anchorIdRef.current = nextAnchor;
      } catch (error) {
        console.error("Error fetching reviews:", error);
        alert("載入食評資料失敗: " + error.message);
        // 🎯 核心修正：載入失敗時清空列表並重設 loading
        setReviews([]);
        setLoading(false); // 確保在 catch 中也設置 loading 為 false
      } finally {
        setLoading(false); // 確保在 finally 中設置 loading 為 false
      }
    },
    [submittedSearchQuery]
  );

  useEffect(() => {
    if (loading) return;

    let anchorIdToUse = null;
    const isSearching = submittedSearchQuery.trim();

    if (currentPage === 1) {
      if (isSearching || pageHistory.length > 0) {
        setPageHistory([]);
      }
      anchorIdToUse = null;
    } else if (!isSearching) {
      anchorIdToUse = pageHistory[currentPage - 2];

      if (!anchorIdToUse) {
        console.warn(
          "Missing anchorId for page transition. Re-fetching initial page."
        );
        setCurrentPage(1);
        return;
      }
    }

    // 🎯 核心修正：使用 fetchReviews
    fetchReviews(anchorIdToUse);
  }, [fetchReviews, submittedSearchQuery, currentPage]);

  // --- 表格操作邏輯 (Table Operations) ---

  /**
   * 🎯 核心修正 7: 處理刪除食評
   */
  const handleDelete = async (reviewId, reviewTitle) => {
    if (
      !window.confirm(
        `確定要永久刪除食評 "${reviewTitle}" (ID: ${reviewId}) 嗎？此操作不可逆！`
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      // 🎯 核心修正：使用 /api/admin/reviews，並傳遞 reviewId
      const res = await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`API 刪除失敗: ${errorData.message || res.statusText}`);
      }

      // 刪除成功後，從列表中移除該食評
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));

      alert(`食評 ${reviewTitle} 刪除成功！`);
      if (reviews.length - 1 === 0 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("刪除失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🎯 核心修正 8：處理 Edit 按鈕 (開啟編輯 Modal)
   */
  const handleEditReview = (reviewId) => {
    console.log(`[RM Debug 1] Edit button clicked for ID: ${reviewId}`);
    setEditTargetId(reviewId);
  };

  /**
   * 🎯 核心修正 9：處理 Edit Modal 關閉 (不論是否儲存，都關閉 Modal)
   */
  const handleEditModalClose = (wasSaved = false) => {
    console.log(`[RM Debug 2] Edit Modal closing. Was saved: ${wasSaved}`);
    setEditTargetId(null); // 關閉 Modal
    if (wasSaved) {
      const anchorIdToUse =
        currentPage > 1 ? pageHistory[currentPage - 2] : null;
      // 🎯 核心修正：使用 fetchReviews
      fetchReviews(anchorIdToUse);
    }
  };

  /**
   * 處理分頁：下一頁
   */
  const handleNextPage = () => {
    if (hasMore && !loading && !submittedSearchQuery.trim()) {
      const nextAnchorIdToSave = anchorIdRef.current;

      if (nextAnchorIdToSave) {
        setPageHistory((prev) => [...prev, nextAnchorIdToSave]);
        setCurrentPage((prev) => prev + 1);
      }
    }
  };

  /**
   * 處理分頁：上一頁
   */
  const handlePrevPage = () => {
    if (currentPage > 1 && !loading && !submittedSearchQuery.trim()) {
      const newPage = currentPage - 1;

      setPageHistory((prev) => prev.slice(0, newPage - 1));
      setCurrentPage(newPage);
    }
  };

  /**
   * 處理搜尋
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (loading) return;

    setSubmittedSearchQuery(searchQuery.trim());
    anchorIdRef.current = null;
    setPageHistory([]);
    setCurrentPage(1);
  };

  /**
   * 🎯 核心修正 10: 處理新增按鈕 (雖然食評通常不會在這裡新增，但保留結構)
   */
  const handleAddNewReview = () => {
    // 🚨 假設您將使用 showAddModal 來控制一個 Review 新增 Modal
    setShowAddModal(true);

    setSearchQuery("");
    setSubmittedSearchQuery("");
    setCurrentPage(1);
    setPageHistory([]);
  };

  // 🎯 核心修正 11: 組合食評數據
  const combinedReviews = useMemo(() => {
    return reviews.map((r) => ({
      id: r.id,
      data: r,
      isModified: false,
      // 🎯 為表格提供一個顯示用的標題
      reviewName: r.reviewTitle || r.id,
    }));
  }, [reviews]);

  // 🎯 核心修正 12: 找出正在編輯的食評完整數據
  const editingReviewData = useMemo(() => {
    const data = reviews.find((r) => r.id === editTargetId) || null;
    if (editTargetId) {
      console.log(`[RM Debug 3] Current editTargetId: ${editTargetId}`);
      console.log(`[RM Debug 3] editingReviewData found: ${!!data}`);
      if (!data) {
        console.error(
          `[RM Debug 3] Data not found for ID: ${editTargetId}. The item might not be in the current 'reviews' list.`
        );
      }
    }
    return data;
  }, [reviews, editTargetId]);

  const shouldRenderEditModal = !!editTargetId && !!editingReviewData;

  // --- 渲染 (Render) ---

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200 min-w-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">
        食評管理
      </h2>

      {/* 搜尋欄位 + 新增按鈕 */}
      <form onSubmit={handleSearchSubmit} className="mb-6 flex space-x-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜尋食評標題或用戶名稱"
          className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          disabled={loading || showAddModal || !!editTargetId}
        />
        <button
          type="submit"
          disabled={loading || showAddModal || !!editTargetId}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out disabled:opacity-50"
        >
          搜尋
        </button>
        {/* 🎯 移除新增餐廳按鈕，除非您確實需要新增食評 */}
        {/* <button
          type="button"
          onClick={handleAddNewReview}
          disabled={loading || showAddModal || !!editTargetId}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out disabled:opacity-50"
        >
          新增食評
        </button> */}
      </form>

      {/* 搜尋提示 */}
      {submittedSearchQuery && (
        <p className="mb-4 text-sm text-gray-600">
          目前搜尋結果：
          <span className="font-semibold text-blue-700">
            {submittedSearchQuery}
          </span>
          （共 {combinedReviews.length} 筆）
        </p>
      )}

      {/* 載入中 Spinner */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
          <LoadingSpinner />
        </div>
      )}

      {/* 食評表格 */}
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-[5]">
            <tr>
              {/* ID 寬度 10% */}
              <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider truncate ">
                ID
              </th>
              {/* 🎯 核心修正 13: 調整欄位寬度 */}
              {DISPLAY_FIELDS.map((field) => (
                <th
                  key={field.key}
                  className={`${
                    field.key === "restaurantName" ||
                    field.key === "reviewTitle"
                      ? "w-[20%]"
                      : "w-[12%]"
                  } px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider truncate`}
                >
                  {field.label}
                </th>
              ))}
              {/* 操作寬度 10% */}
              <th className="w-[10%] px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {combinedReviews.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={DISPLAY_FIELDS.length + 2}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  {submittedSearchQuery.trim()
                    ? "找不到符合條件的食評。"
                    : "沒有食評資料。"}
                </td>
              </tr>
            ) : (
              combinedReviews.map((item) => {
                const reviewTitle = item.data.reviewTitle || item.id;
                const isBeingEdited = item.id === editTargetId;

                return (
                  <tr
                    key={item.id}
                    className={
                      isBeingEdited
                        ? "bg-blue-50 hover:bg-blue-100 transition-colors"
                        : "hover:bg-gray-50 transition-colors"
                    }
                  >
                    {/* ID */}
                    <td className="px-3 py-4 text-xs text-gray-500 truncate">
                      {item.id}
                    </td>
                    {/* 🎯 核心修正 14: 顯示食評欄位數據 */}
                    {DISPLAY_FIELDS.map((field) => {
                      const rawValue = getNestedValue(item.data, field.key);
                      let displayValue = rawValue;

                      // 特殊處理日期
                      if (
                        field.key === "createdAt" ||
                        field.key === "updatedAt"
                      ) {
                        let dateToFormat = rawValue;
                        if (
                          typeof rawValue === "object" &&
                          rawValue !== null &&
                          (rawValue._seconds || rawValue.seconds)
                        ) {
                          const seconds =
                            rawValue._seconds || rawValue.seconds || 0;
                          const nanoseconds =
                            rawValue._nanoseconds || rawValue.nanoseconds || 0;
                          const milliseconds =
                            seconds * 1000 + nanoseconds / 1000000;
                          dateToFormat = new Date(milliseconds);
                        }
                        const formattedDateTime = formatDateTime(dateToFormat);
                        displayValue = formattedDateTime
                          ? formattedDateTime.split(" ")[0]
                          : "-";
                      }

                      // 特殊處理評分 (如果需要的話)
                      if (field.key === "overallRating") {
                        displayValue = `${rawValue || 0} / 5`;
                      }

                      if (
                        displayValue === null ||
                        displayValue === undefined ||
                        displayValue === ""
                      ) {
                        displayValue = "-";
                      }

                      return (
                        <td
                          key={field.key}
                          className="px-4 py-2 text-sm text-gray-900 truncate"
                          title={displayValue}
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                    {/* 操作按鈕 */}
                    <td className="px-6 py-4 text-center text-sm font-medium">
                      {/* 🎯 編輯按鈕 (開啟 Modal) */}
                      <button
                        onClick={() => handleEditReview(item.id)}
                        disabled={loading || showAddModal || !!editTargetId}
                        className={`py-1 px-3 rounded text-white font-semibold transition duration-150 ${
                          isBeingEdited
                            ? "bg-blue-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        } disabled:opacity-50`}
                      >
                        編輯
                      </button>
                      {/* 🎯 刪除按鈕 */}
                      <button
                        onClick={() => handleDelete(item.id, reviewTitle)} // 傳遞 reviewId 和 reviewTitle
                        disabled={loading || showAddModal || !!editTargetId}
                        className="ml-2 py-1 px-3 rounded bg-red-600 hover:bg-red-700 text-white font-semibold transition duration-150 disabled:opacity-50"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁控制 */}
      {!submittedSearchQuery.trim() && !showAddModal && !editTargetId && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            目前頁碼: <span className="font-semibold">{currentPage}</span>
          </p>
          <div className="space-x-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              上一頁
            </button>
            <button
              onClick={handleNextPage}
              disabled={!hasMore || loading}
              className="px-4 py-2 border rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              下一頁
            </button>
          </div>
        </div>
      )}

      {/* 🚨 移除 NewRestaurantModal 渲染，因為這是 Review 管理 */}
      {/* {showAddModal && (
        <NewRestaurantModal ... />
      )} */}

      {/* 🎯 渲染 EditReviewModal (假設您已創建此組件) */}
      {shouldRenderEditModal && (
        <EditReviewModal
          REVIEW_FIELDS={REVIEW_FIELDS}
          isOpen={!!editTargetId}
          onClose={handleEditModalClose}
          reviewId={editTargetId}
          initialData={editingReviewData}
          // 移除圖片相關 props，除非您的 EditReviewModal 需要
        />
      )}
    </div>
  );
};

export default ReviewManagement;
