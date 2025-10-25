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
import NewRestaurantModal from "@/components/admin/restaurantManagement/NewRestaurantModal.js";
// 🚨 新增：引入編輯餐廳模態窗，這是您指定的組件
import EditRestaurantModal from "@/components/admin/restaurantManagement/EditRestaurantModal.js";
import { AuthContext } from "@/lib/auth-context";

// --- 介面和常數 ---
const RESTAURANTS_PER_PAGE = 10;
// 這裡根據您提供的 DB 結構定義所有可編輯的欄位
const RESTAURANT_FIELDS = [
  // 核心資訊
  { key: "restaurantName.zh-TW", label: "名稱 (中)" },
  { key: "restaurantName.en", label: "名稱 (英)" },
  { key: "name_lowercase_en", label: "名稱 (英小寫)" },
  { key: "category", label: "類別" },
  { key: "subCategory", label: "子類別" },
  { key: "restaurantType", label: "餐廳類型 (JSON)", type: "json" },

  // 財務與權重 (Number)
  { key: "priority", label: "權重", type: "number" },
  { key: "avgSpending", label: "平均消費", type: "number" },

  // 地址與聯絡資訊 (Text)
  { key: "fullAddress", label: "地址" },
  { key: "city", label: "城市" },
  { key: "province", label: "省份" },
  { key: "postalCode", label: "郵編" },
  { key: "phone", label: "電話" },
  { key: "contactPhone", label: "聯絡人電話" },
  { key: "contactName", label: "聯絡人姓名" },
  { key: "contactEmail", label: "聯絡人 Email" },
  { key: "website", label: "網址" },

  // 狀態與設定 (Boolean / Text / JSON)
  { key: "status", label: "狀態" },
  { key: "isManager", label: "餐廳擁有人註冊", type: "boolean" },
  { key: "isHolidayOpen", label: "假期開放", type: "boolean" },
  { key: "seatingCapacity", label: "座位數" },
  { key: "reservationModes", label: "預訂模式 (JSON)", type: "json" },
  { key: "paymentMethods", label: "支付方式 (JSON)", type: "json" },
  { key: "facilitiesServices", label: "設施服務 (JSON)", type: "json" },

  // 圖片與時間 (JSON / Text)
  { key: "facadePhotoUrls", label: "門面照片 (JSON)", type: "json" },
  { key: "businessHours", label: "營業時間 (JSON)", type: "json" },
  { key: "holidayHours", label: "假期營業時間" },
  { key: "closedDates", label: "關閉日期" },

  // 其他資訊
  { key: "awards", label: "獎項" },
  { key: "otherInfo", label: "其他資訊" },

  // 內部欄位
  { key: "submittedBy", label: "提交者 ID" },
  { key: "updatedAt", label: "最後更新日期" },
];

// 🎯 核心修改 1: 表格只顯示的欄位 (精簡版)
const DISPLAY_FIELDS = [
  // 🚨 新增：合併後的餐廳名稱欄位
  { key: "combinedRestaurantName", label: "餐廳名稱" },
  // 移除 { key: "restaurantName.zh-TW", label: "名稱 (中)" }
  // 移除 { key: "restaurantName.en", label: "名稱 (英)" }
  { key: "updatedAt", label: "最後更新日期" }, // 假設有 updatedAt 欄位
  { key: "createdAt", label: "建立日期" }, // 假設有 createdAt 欄位
  { key: "submittedBy", label: "提交者" },
];
// -------------------

const getNestedValue = (obj, path) => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

const RestaurantManagement = () => {
  const { formatDateTime } = useContext(AuthContext);

  const safeFormatDateTime = (timestamp) => {
    // 處理 Admin SDK 返回的數字 (Unix Timestamp)
    return formatDateTime
      ? formatDateTime({ seconds: timestamp }).split(" ")[0]
      : new Date(timestamp * 1000).toLocaleDateString();
  };
  const [restaurants, setRestaurants] = useState([]);
  // 🎯 移除 editedRestaurants，因為表格內不再編輯
  // const [editedRestaurants, setEditedRestaurants] = useState({});
  const [loading, setLoading] = useState(false);

  // 🚨 核心修改 1: 新增餐廳模態窗狀態
  const [showAddModal, setShowAddModal] = useState(false);

  // 🎯 核心新增 1: 正在編輯的餐廳 ID (用於開啟 EditRestaurantModal)
  const [editTargetId, setEditTargetId] = useState(null);

  // 🚨 圖片相關狀態 (僅供 NewRestaurantModal 使用)
  // 🚨 核心修改 1: 此狀態也將傳遞給 EditRestaurantModal
  const [selectedFile, setSelectedFile] = useState(null);

  // 🚨 新增：使用者在輸入框中輸入的值
  const [searchQuery, setSearchQuery] = useState("");

  // 🚨 實際用於觸發查詢的值
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("");

  const [anchorId, setAnchorId] = useState(null); // 儲存下一頁的錨點 ID
  const [pageHistory, setPageHistory] = useState([]); // 儲存 (Page 1, Page 2, ...) 的錨點 ID
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const anchorIdRef = useRef(null);
  anchorIdRef.current = anchorId;

  // --- 圖片處理函數 (僅供 NewRestaurantModal 使用) ---

  // 模擬圖片上傳和處理 (此處僅處理狀態，實際應調用上傳 API)
  // 🚨 核心修改 2: 此函數也將傳遞給 EditRestaurantModal
  const handleFileChange = useCallback((file) => {
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  // 🚨 核心修改 3: 此函數也將傳遞給 EditRestaurantModal
  const handleRemovePhoto = useCallback(() => {
    setSelectedFile(null);
  }, []);

  // --- 資料獲取邏輯 (Fetch Data) ---
  const fetchRestaurants = useCallback(
    async (
      anchorIdToUse // 使用從 useEffect 傳入的錨點
    ) => {
      setLoading(true);

      const params = new URLSearchParams({
        limit: RESTAURANTS_PER_PAGE,
      });

      // 🚨 使用已提交的查詢值
      if (submittedSearchQuery.trim()) {
        params.append("search", submittedSearchQuery.trim());
      }

      // 只有在非搜尋模式下，並且不是第 1 頁時，才傳送 anchorId
      if (!submittedSearchQuery.trim() && anchorIdToUse) {
        params.append("anchorId", anchorIdToUse);
      }

      const url = `/api/admin/restaurants?${params.toString()}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch restaurants");

        const data = await res.json();

        setRestaurants(data.restaurants);
        // 🎯 移除重設編輯狀態 setEditedRestaurants({});
        // 搜尋模式下，hasMore 應為 false
        setHasMore(data.hasMore && !submittedSearchQuery.trim());

        // 🚨 更新下一頁錨點
        const nextAnchor = submittedSearchQuery.trim()
          ? null
          : data.restaurants.length > 0
          ? data.restaurants[data.restaurants.length - 1].id
          : null;
        setAnchorId(nextAnchor);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        alert("載入餐廳資料失敗: " + error.message);
        setRestaurants([]); // 載入失敗時清空列表
      } finally {
        setLoading(false);
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

    fetchRestaurants(anchorIdToUse);
  }, [fetchRestaurants, submittedSearchQuery, currentPage]);

  // --- 表格操作邏輯 (Table Operations) ---

  /**
   * 🎯 新增的邏輯：處理刪除餐廳
   */
  const handleDelete = async (restaurantId, restaurantName) => {
    if (
      !window.confirm(
        `確定要永久刪除餐廳 "${restaurantName}" (ID: ${restaurantId}) 嗎？此操作不可逆！`
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      // 假設您的 API 刪除端點為 /api/admin/restaurants，使用 DELETE 方法，並在 body 中傳遞 restaurantId
      const res = await fetch("/api/admin/restaurants", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ restaurantId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`API 刪除失敗: ${errorData.message || res.statusText}`);
      }

      // 刪除成功後，從列表中移除該餐廳
      setRestaurants((prev) => prev.filter((r) => r.id !== restaurantId));
      
      alert(`餐廳 ${restaurantName} 刪除成功！`);
      // 由於列表數量可能減少，可以考慮重新載入當前頁或讓使用者自己決定
      if (restaurants.length - 1 === 0 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        // 簡單起見，直接在客戶端更新列表
      }
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      alert("刪除失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🎯 核心新增 2：處理 Edit 按鈕 (開啟編輯 Modal)
   */
  const handleEditRestaurant = (restaurantId) => {
    // 🚨 DEBUG 1: 檢查按鈕點擊是否觸發
    console.log(`[RM Debug 1] Edit button clicked for ID: ${restaurantId}`); 
    setEditTargetId(restaurantId);
    setSelectedFile(null); // 確保在開啟新編輯時，清除上次的 selectedFile
  };

  /**
   * 🎯 核心新增 3：處理 Edit Modal 關閉 (不論是否儲存，都關閉 Modal)
   * @param {boolean} wasSaved - 標示 Modal 關閉是否伴隨成功儲存
   */
  const handleEditModalClose = (wasSaved = false) => {
    // 🚨 DEBUG 2: 檢查 Modal 關閉是否觸發
    console.log(`[RM Debug 2] Edit Modal closing. Was saved: ${wasSaved}`);
    setEditTargetId(null); // 關閉 Modal
    setSelectedFile(null); // 清除 EditModal 可能留下的檔案
    if (wasSaved) {
      // 如果成功儲存，重新載入當前頁面以更新表格數據
      const anchorIdToUse =
        currentPage > 1 ? pageHistory[currentPage - 2] : null;
      // 🚨 直接調用 fetchRestaurants，保持在當前頁，而不是跳回第一頁
      fetchRestaurants(anchorIdToUse);
    }
  };

  /**
   * 處理 Modal 表單提交 (當 NewRestaurantModal 成功寫入 Firestore 後調用)
   */
  const handleModalSubmit = async (newRestaurantData) => {
    alert("新增餐廳成功！");
    setShowAddModal(false); // 關閉模態窗
    setSelectedFile(null); // 清除檔案狀態

    // 重新載入以顯示新餐廳 (回到第一頁)
    setSubmittedSearchQuery("");
    setCurrentPage(1);
    setPageHistory([]);
    // fetchRestaurants 會被 useEffect 觸發
  };

  /**
   * 處理分頁：下一頁
   */
  const handleNextPage = () => {
    if (hasMore && !loading && !submittedSearchQuery.trim()) {
      const currentAnchor = anchorIdRef.current;

      if (currentAnchor) {
        setPageHistory((prev) => [...prev, currentAnchor]);
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

    // 🚨 核心修改 6：更新 submittedSearchQuery，這將觸發 useEffect 進行查詢
    setSubmittedSearchQuery(searchQuery.trim());

    // 重新設定所有分頁狀態
    setAnchorId(null);
    setPageHistory([]);
    setCurrentPage(1); // 這是唯一的觸發點
  };

  /**
   * 處理新增按鈕 (開啟 Modal)
   */
  const handleAddNewRestaurant = () => {
    // 🚨 開啟 Modal
    setShowAddModal(true);

    // 清除可能殘留的檔案狀態
    setSelectedFile(null);

    // 清空當前搜尋狀態 (非必要，但能確保視覺上專注於新增)
    setSearchQuery("");
    setSubmittedSearchQuery("");

    // 確保頁面回到基礎狀態
    setCurrentPage(1);
    setPageHistory([]);
  };

  // 組合餐廳數據：原始數據 (editedRestaurants 已移除)
  const combinedRestaurants = useMemo(() => {
    // 🎯 由於編輯邏輯已移至 Modal，這裡只返回原始數據
    return restaurants.map((r) => ({
      id: r.id,
      data: r,
      // 為了通用性，保留 isModified 欄位，但目前永遠為 false
      isModified: false,
    }));
  }, [restaurants]);

  // 找出正在編輯的餐廳完整數據
  const editingRestaurantData = useMemo(() => {
    const data = restaurants.find((r) => r.id === editTargetId) || null;
    // 🚨 DEBUG 3: 檢查是否找到餐廳數據
    if (editTargetId) {
      console.log(`[RM Debug 3] Current editTargetId: ${editTargetId}`);
      console.log(`[RM Debug 3] editingRestaurantData found: ${!!data}`);
      if (!data) {
        console.error(`[RM Debug 3] Data not found for ID: ${editTargetId}. The item might not be in the current 'restaurants' list.`);
      }
    }
    return data;
  }, [restaurants, editTargetId]);

  // 🚨 DEBUG 4: 檢查渲染條件的最終結果
  const shouldRenderEditModal = !!editTargetId && !!editingRestaurantData;
  console.log(`[RM Debug 4] Modal Render Condition: ${shouldRenderEditModal}`);
  if (shouldRenderEditModal) {
    console.log(`[RM Debug 4] Modal will render for ID: ${editTargetId}`);
    // 🚨 DEBUG 4b: 檢查傳遞給 Modal 的數據結構
    console.log(`[RM Debug 4b] Initial Data (data property) keys:`, Object.keys(editingRestaurantData.data || {}));
  }


  // --- 渲染 (Render) ---

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200 min-w-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">
        餐廳管理
      </h2>

      {/* 搜尋欄位 + 新增按鈕 */}
      <form onSubmit={handleSearchSubmit} className="mb-6 flex space-x-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜尋餐廳名稱 (中/英)"
          className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          disabled={loading || showAddModal || !!editTargetId} // 編輯/新增時禁用
        />
        <button
          type="submit"
          disabled={loading || showAddModal || !!editTargetId}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out disabled:opacity-50"
        >
          搜尋
        </button>
        {/* 增加新增餐廳按鈕 */}
        <button
          type="button"
          onClick={handleAddNewRestaurant}
          disabled={loading || showAddModal || !!editTargetId}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out disabled:opacity-50"
        >
          新增餐廳
        </button>
      </form>

      {/* 搜尋提示 */}
      {submittedSearchQuery && (
        <p className="mb-4 text-sm text-gray-600">
          目前搜尋結果：
          <span className="font-semibold text-blue-700">
            {submittedSearchQuery}
          </span>
          （共 {combinedRestaurants.length} 筆）
        </p>
      )}

      {/* 載入中 Spinner */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
          <LoadingSpinner />
        </div>
      )}

      {/* 餐廳表格 (精簡化) */}
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        {/* 🚨 移除 overflow-x-auto，改為固定寬度表格，強制不橫向滾動 */}
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-[5]">
            <tr>
              {/* ID 寬度 10% */}
              <th className="w-[12%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider truncate">
                ID
              </th>
              {/* 🎯 核心修改 2: 處理標題欄位寬度 */}
              {DISPLAY_FIELDS.map((field) => (
                <th
                  key={field.key}
                  // 🚨 根據欄位名稱設定寬度
                  className={`${
                    field.key === "combinedRestaurantName"
                      ? "w-[20%]"
                      : field.key === "submittedBy"
                      ? "w-[20%]" // 🎯 核心修改 1: 設置 submittedBy 為 w-[20%]
                      : "w-[10%]" // 剩下的欄位 (createdAt, updatedAt) 平分剩餘空間 (100-10-30-15 = 45; 45/3=15; 重新計算: 10(ID)+30(名稱)+15(操作)=55; 45/3=15)
                    // 重新分配：10(ID) + 30(名稱) + 20(SubmittedBy) + 15(updatedAt) + 15(createdAt) = 90. 10% 給操作 (15%太寬)
                    // 為了避免複雜計算，統一給定一個基於總寬度的百分比，並確保總和不超過 100%
                  } px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider truncate`}
                >
                  {field.label}
                </th>
              ))}
              {/* 操作寬度 15% */}
              <th className="w-[12%] px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {combinedRestaurants.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={DISPLAY_FIELDS.length + 2}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  {submittedSearchQuery.trim()
                    ? "找不到符合條件的餐廳。"
                    : "沒有餐廳資料。"}
                </td>
              </tr>
            ) : (
              combinedRestaurants.map((item) => {
                const restaurantName =
                  getNestedValue(item.data, "restaurantName.en") || item.id;

                // 檢查是否正在被編輯 (EditModal 開啟中)
                const isBeingEdited = item.id === editTargetId;

                return (
                  <tr
                    key={item.id}
                    // 🚨 僅顯示 isBeingEdited 狀態，isModified 永遠為 false
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
                    {/* 🎯 核心修改 3: 顯示欄位數據 */}
                    {DISPLAY_FIELDS.map((field) => {
                      // 🚨 特殊處理合併後的餐廳名稱
                      if (field.key === "combinedRestaurantName") {
                        const zhName =
                          getNestedValue(item.data, "restaurantName.zh-TW") ||
                          "-";
                        const enName =
                          getNestedValue(item.data, "restaurantName.en") ||
                          "No English Name";

                        // 組合顯示內容
                        const combinedTitle = `${zhName} / ${enName}`;

                        return (
                          <td
                            key={field.key}
                            className="px-4 py-2 text-sm text-gray-900"
                            title={combinedTitle} // hover 顯示完整內容
                          >
                            <div className="font-semibold">{zhName}</div>
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {enName}
                            </div>
                          </td>
                        );
                      }

                      // 處理其他欄位 (與您提供的原始邏輯相同)
                      const rawValue = getNestedValue(item.data, field.key);
                      let displayValue = rawValue;

                      // 特殊處理日期
                      if (
                        field.key === "createdAt" ||
                        field.key === "updatedAt"
                      ) {
                        let dateToFormat = rawValue;

                        // 🎯 關鍵修正：檢查是否為序列化後的 Firestore Timestamp 物件
                        if (
                          typeof rawValue === "object" &&
                          rawValue !== null &&
                          (rawValue._seconds || rawValue.seconds) // 檢查帶底線或不帶底線的 seconds
                        ) {
                          // 從序列化物件中提取秒和納秒 (使用您 console.log 發現的帶底線屬性)
                          const seconds =
                            rawValue._seconds || rawValue.seconds || 0;
                          const nanoseconds =
                            rawValue._nanoseconds || rawValue.nanoseconds || 0;

                          // 轉換為毫秒並創建標準的 JS Date 物件
                          const milliseconds =
                            seconds * 1000 + nanoseconds / 1000000;
                          dateToFormat = new Date(milliseconds);
                        }
                        const formattedDateTime = formatDateTime(dateToFormat);
                        // 傳遞一個標準的 JS Date 物件（或未被序列化的原生 Timestamp 實例）給 formatDateTime
                        displayValue = formattedDateTime.split(" ")[0];
                      }

                      if (displayValue === null || displayValue === undefined) {
                        displayValue = "-";
                      }

                      return (
                        <td
                          key={field.key}
                          className="px-4 py-2 text-sm text-gray-900 truncate"
                          title={displayValue} // hover 顯示完整內容
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                    {/* 操作按鈕 */}
                    <td className="px-6 py-4 text-center text-sm font-medium">
                      {/* 🎯 編輯按鈕 (開啟 Modal) */}
                      <button
                        onClick={() => handleEditRestaurant(item.id)} // 🚨 這裡會觸發 DEBUG 1
                        disabled={
                          loading || showAddModal || !!editTargetId // 這裡使用 !!editTargetId 禁用所有編輯按鈕
                        }
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
                        onClick={() => handleDelete(item.id, restaurantName)}
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
      {/* 只有在非搜尋、非模態窗開啟模式下才顯示分頁 */}
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

      {/* 🚨 渲染 NewRestaurantModal */}
      {showAddModal && (
        <NewRestaurantModal
          RESTAURANT_FIELDS={RESTAURANT_FIELDS}
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedFile(null);
          }}
          onSubmit={handleModalSubmit}
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          onRemovePhoto={handleRemovePhoto}
        />
      )}

      {/* 🎯 渲染 EditRestaurantModal */}
      {shouldRenderEditModal && ( // 🚨 使用 shouldRenderEditModal 進行渲染，這是 DEBUG 4 的結果
        <EditRestaurantModal
          RESTAURANT_FIELDS={RESTAURANT_FIELDS} // 傳遞所有欄位定義
          isOpen={!!editTargetId} // 判斷是否開啟
          onClose={handleEditModalClose} // 處理關閉
          restaurantId={editTargetId} // 正在編輯的 ID
          initialData={editingRestaurantData} // 初始數據 (傳遞完整的餐廳數據)
          // 🚨 核心修改 4: 傳遞圖片相關的 props 給 EditRestaurantModal
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          onRemovePhoto={handleRemovePhoto}
        />
      )}
    </div>
  );
};

export default RestaurantManagement;