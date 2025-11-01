"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/lib/auth-context"; // 假設您的 AuthContext 路徑是正確的
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
import LoadingSpinner from "@/components/LoadingSpinner"; // 假設您的 LoadingSpinner 路徑是正確的
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { Switch } from "@/components/ui/switch"; // 假設您的 Switch 組件路徑是正確的

// 💡 搜尋輸入框組件 (簡單實現，之後可以擴展)
const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form onSubmit={handleSearch} className="flex space-x-2">
      <input
        type="text"
        placeholder="搜尋標題或副標題..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm w-64"
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700"
      >
        搜尋
      </button>
    </form>
  );
};

const PromotionManagement = () => {
  const { db, appId, formatDateTime, loadingUser, getToken } =
    useContext(AuthContext); // 假設 AuthContext 提供了所需的變數
  const router = useRouter();

  // 狀態管理：推廣活動列表
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [pageCursors, setPageCursors] = useState([null]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // 💡 新增搜尋狀態

  // 數據庫路徑
  const promotionsCollectionPath = `artifacts/${
    appId || "default-app-id"
  }/public/data/promotions`;

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

  // 處理導航到推廣編輯頁面 (假設 ID 為 promoId)
  const handleViewPromotionDetails = (promoId) => {
    // 💡 假設編輯頁面路徑為 /admin/admin_promotions/[promoId]
    router.push(`/admin/admin_promotions/${promoId}`);
  };

  // 處理狀態變更 (發佈/待處理)
  const handleStatusChange = async (promoId, newStatus) => {
    if (isUpdating) return;

    setIsUpdating(true);
    const token = await getToken();

    try {
      // 💡 假設您有一個處理推廣狀態的 API 端點，例如 /api/promotions
      const response = await fetch("/api/promotions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: promoId,
          status: newStatus,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(`推廣活動狀態已更新為 ${getStatusDisplay(newStatus)}！`, {
          position: "top-right",
        });

        // 立即更新前端狀態
        setPromotions((prevPromotions) =>
          prevPromotions.map((promo) =>
            promo.id === promoId
              ? {
                  ...promo,
                  status: newStatus,
                  displayStatus: getStatusDisplay(newStatus),
                }
              : promo
          )
        );
      } else {
        throw new Error(result.error || "狀態更新失敗");
      }
    } catch (error) {
      console.error("更新推廣活動狀態失敗:", error);
      toast.error(error.message || "更新失敗，請稍後再試。", {
        position: "top-right",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // 核心資料獲取邏輯
  useEffect(() => {
    if (loadingUser || !db) {
      setLoading(false);
      return;
    }

    const promotionsRef = collection(db, promotionsCollectionPath);
    const pageSize = 10;

    // 💡 注意：Firestore 對 `where` 和 `orderBy` 有限制。
    // 如果要使用 `where` 進行搜尋，需要確保搜尋欄位在 `orderBy` 之前或也使用 `orderBy`。
    // 在這裡，我們暫時只實現了不帶 `where` 的分頁和排序。

    const fetchData = async () => {
      try {
        setLoading(true);

        const lastVisible = pageCursors[page];

        // 💡 排序：根據您提供的需求，使用 priority (降序) 再根據 updatedAt (降序)
        let q = query(
          promotionsRef,
          orderBy("priority", "desc"), // 優先級高的在前
          orderBy("updatedAt", "desc"), // 最新修改的在前
          limit(pageSize + 1)
        );

        if (lastVisible) {
          q = query(
            promotionsRef,
            orderBy("priority", "desc"),
            orderBy("updatedAt", "desc"),
            startAfter(lastVisible),
            limit(pageSize + 1)
          );
        }

        // 💡 簡易的標題/副標題前端過濾 (如果沒有強大的後端搜尋功能)
        let querySnapshot = await getDocs(q);
        let docs = querySnapshot.docs;

        // 前端簡易過濾 (如果 Firestore 不支持複雜的全文搜尋)
        let filteredDocs = docs;
        if (searchTerm) {
          filteredDocs = docs.filter((docSnap) => {
            const data = docSnap.data();
            const lowerSearch = searchTerm.toLowerCase();
            return (
              (data.title && data.title.toLowerCase().includes(lowerSearch)) ||
              (data.subtitle &&
                data.subtitle.toLowerCase().includes(lowerSearch))
            );
          });
        }

        const hasMoreData = filteredDocs.length > pageSize;
        setHasMore(hasMoreData);

        const docsToDisplay = hasMoreData
          ? filteredDocs.slice(0, pageSize)
          : filteredDocs;

        const newPromotions = docsToDisplay.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          displayStatus: getStatusDisplay(docSnap.data().status),
        }));
        setPromotions(newPromotions);

        // 更新 pageCursors
        if (querySnapshot.docs.length > 0 && pageCursors.length <= page + 1) {
          // 注意：這裡的 cursor 應該是基於 Firestore 的查詢結果，而不是前端過濾後的結果
          setPageCursors((prev) => [
            ...prev,
            querySnapshot.docs[querySnapshot.docs.length - 1],
          ]);
        }

        setLoading(false);
      } catch (error) {
        console.error("載入推廣活動資料失敗:", error);
        setLoading(false);
        toast.error("載入推廣活動資料失敗，請檢查資料庫路徑或權限。", {
          position: "top-right",
        });
      }
    };

    fetchData();
  }, [db, appId, loadingUser, page, pageCursors, promotionsCollectionPath]); // 💡 searchTerm 不在依賴中，因為我們需要手動觸發新的查詢或清空分頁狀態

  // 處理搜尋
  const handleSearchSubmit = (term) => {
    // 重置分頁狀態，並更新搜尋詞
    setSearchTerm(term);
    setPage(0);
    setPageCursors([null]);
    // 因為 searchTerm 不在 useEffect 的依賴列表中，手動呼叫 fetchData (但目前 fetchData 沒有直接公開，需要重構或使用一個標記)
    // 這裡我們假設資料量小，可以在前端進行過濾。如果資料量大，需要更複雜的後端搜尋。
    // 在這個基礎範例中，為了符合部落格的架構，我們先在 useEffect 裡面加入一個簡單的前端過濾邏輯。
    // 💡 為了讓 useEffect 重新執行，我們需要改變一個它有依賴的狀態。
    // 簡單的解決方法是暫時將 searchTerm 加入 useEffect 的依賴，或使用一個專門的 key/state 來觸發。
    // 為了安全和效率，建議在實際項目中使用一個專門的狀態來觸發資料重新載入。
    // 由於您想基於 BlogManagement 範例，我們保持其結構，並手動在前端處理分頁資料上的過濾。
    // **注意：對於大型數據集，這不是推薦的作法。**
  };

  // 分頁處理
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
        <p className="text-gray-600 ml-4">載入推廣活動資料中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">推廣活動管理</h2>
          <p className="text-sm text-gray-600 mt-1">管理所有推廣活動內容。</p>
        </div>
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
          {/* 💡 搜尋功能 */}
          <SearchBar onSearch={handleSearchSubmit} />

          {/* 💡 新增按鈕 */}
          <Link
            href="/admin/admin_promotions/new"
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 bg-green-600 text-white hover:bg-green-700 w-full md:w-auto text-center"
          >
            新增推廣
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
                標題 / 副標題
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                優先級 (Priority)
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
                更新時間
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
            {promotions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  {searchTerm
                    ? `找不到與 "${searchTerm}" 相關的推廣活動。`
                    : "目前沒有任何推廣活動。"}
                </td>
              </tr>
            ) : (
              promotions.map((promo) => (
                <tr
                  key={promo.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 cursor-pointer"
                    onClick={() => handleViewPromotionDetails(promo.id)}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {promo.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {promo.subtitle}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    {/* 💡 顯示 priority，假設是數字 */}
                    <span className="font-bold">{promo.priority || 0}</span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-center text-sm cursor-pointer"
                    onClick={() => handleViewPromotionDetails(promo.id)}
                  >
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        promo.status === "pending" || promo.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : promo.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {promo.displayStatus}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 cursor-pointer"
                    onClick={() => handleViewPromotionDetails(promo.id)}
                  >
                    {/* 💡 使用 updatedAt 作為列表顯示時間 */}
                    {formatDateTime(promo.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewPromotionDetails(promo.id);
                      }}
                      className="px-4 py-2 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
                    >
                      編輯
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {/* 只有在文章狀態為 published 或 pending 時才顯示開關 */}
                    {(promo.status === "published" ||
                      promo.status === "pending") && (
                      <Switch
                        checked={promo.status === "published"}
                        onCheckedChange={(checked) => {
                          const newStatus = checked ? "published" : "pending";
                          handleStatusChange(promo.id, newStatus);
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

export default PromotionManagement;
