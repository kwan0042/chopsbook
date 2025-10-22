// src/components/admin/RestaurantManagement.js
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
// 🚨 僅修改此處：引入新增餐廳模態窗，使用正確的文件名稱 NewRestaurantModal
import NewRestaurantModal from "@/components/admin/restaurantManagement/NewRestaurantModal.js";

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
  
];
// -------------------

/**
 * 遞歸地從物件中獲取值 (支援 'a.b.c' 格式)
 */
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

/**
 * 遞歸地設置物件中的值 (支援 'a.b.c' 格式)
 */
const setNestedValue = (obj, path, value) => {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (
      !current[part] ||
      typeof current[part] !== "object" ||
      Array.isArray(current[part])
    ) {
      current[part] = {}; // 確保路徑上的父級是物件
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
};

const RestaurantManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [editedRestaurants, setEditedRestaurants] = useState({});
  const [loading, setLoading] = useState(false);

  // 🚨 核心修改 1/4: 新增模態窗狀態
  const [showAddModal, setShowAddModal] = useState(false);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false); // 模態窗提交狀態

  // 🚨 核心修改 2/4: 新增圖片相關狀態 (NewRestaurantModal 需要這些)
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false); // 模擬上傳狀態

  // 🚨 新增：使用者在輸入框中輸入的值 (不會觸發查詢)
  const [searchQuery, setSearchQuery] = useState("");

  // 🚨 核心修改 3/4：實際用於觸發查詢的值 (只在按下按鈕時更新)
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("");

  const [anchorId, setAnchorId] = useState(null); // 儲存下一頁的錨點 ID
  const [pageHistory, setPageHistory] = useState([]); // 儲存 (Page 1, Page 2, ...) 的錨點 ID
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // 🚨 關鍵修正 (1/5): 使用 Ref 來追蹤 anchorId 的最新值，避免其進入 useEffect 依賴列表
  const anchorIdRef = useRef(null);
  anchorIdRef.current = anchorId;

  // --- 輔助函數：將複雜類型數據轉換為字串以便在 input 中顯示 ---
  const dataToDisplayValue = (data, fieldKey, fieldType) => {
    const value = getNestedValue(data, fieldKey);
    if (value === null || value === undefined) return "";

    if (fieldType === "json") {
      try {
        // 陣列或物件轉換為 JSON 字串，並美化格式以方便編輯
        return JSON.stringify(value, null, 2);
      } catch (e) {
        console.error(`Error stringifying ${fieldKey}:`, value);
        return String(value);
      }
    }
    return value;
  };

  // --- 圖片處理函數 (新增，以便傳遞給 NewRestaurantModal) ---

  // 模擬圖片上傳和處理 (此處僅處理狀態，實際應調用上傳 API)
  const handleFileChange = useCallback((file) => {
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleRemovePhoto = useCallback(() => {
    setSelectedFile(null);
    // 這裡可以加入 API 刪除圖片的邏輯
  }, []);

  // --- 資料獲取邏輯 (Fetch Data) ---
  // 🚨 核心修改 2：fetchRestaurants 依賴 submittedSearchQuery
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
        setEditedRestaurants({}); // 重設編輯狀態
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
    // 🚨 核心修改 3：依賴項變更為 submittedSearchQuery
    [submittedSearchQuery]
  );

  // 🚨 核心修改 4：調整 useEffect 邏輯和依賴項 (移除對 isAddingNew 的檢查)
  useEffect(() => {
    // 避免在載入中重複觸發
    if (loading) return;

    let anchorIdToUse = null;
    const isSearching = submittedSearchQuery.trim();

    // 1. 初始載入 / 搜尋 (currentPage = 1)
    if (currentPage === 1) {
      // 如果是搜尋或回到了第一頁，清除歷史紀錄
      if (isSearching || pageHistory.length > 0) {
        setPageHistory([]);
      }
      anchorIdToUse = null;
    }
    // 2. 載入 Page N (N > 1) 且非搜尋模式
    else if (!isSearching) {
      // 對於 Page N，我們需要 Page N-1 的錨點。
      anchorIdToUse = pageHistory[currentPage - 2];

      if (!anchorIdToUse) {
        console.warn(
          "Missing anchorId for page transition. Re-fetching initial page."
        );
        setCurrentPage(1);
        return;
      }
    }

    // 🚨 注意：搜尋模式下 (isSearching為true)，currentPage>1 不會觸發查詢，因為 anchorIdToUse 會是 null

    // 執行查詢
    fetchRestaurants(anchorIdToUse);

    // 🚨 核心修改 5：只依賴於 submittedSearchQuery 和 currentPage
  }, [fetchRestaurants, submittedSearchQuery, currentPage]); // isAddingNew 已移除

  // --- 表格操作邏輯 (Table Operations) ---

  const handleInputChange = (restaurantId, fieldKey, value, fieldType) => {
    const originalRestaurant = restaurants.find((r) => r.id === restaurantId);
    if (!originalRestaurant) return; // 只有非新增模式才需要處理這個

    const currentEdit = editedRestaurants[restaurantId] || {
      data: originalRestaurant,
      isModified: false,
      display: {},
    };

    const newDisplay = { ...currentEdit.display, [fieldKey]: value };
    // 確保編輯時數據是從原始數據開始的 (深拷貝)
    const newEditedData = JSON.parse(JSON.stringify(originalRestaurant));

    let processedValue = value;
    let isValid = true;

    if (fieldType === "number") {
      processedValue = value === "" ? 0 : parseInt(value, 10);
      if (isNaN(processedValue)) processedValue = 0;
    } else if (fieldType === "boolean") {
      processedValue = value === "true" || value === true; // 允許布林值本身
    } else if (fieldType === "json") {
      try {
        processedValue = JSON.parse(value);
      } catch (e) {
        // 如果 JSON 無效，不更新 processedValue，但保留 display value
        isValid = false;
      }
    }

    if (fieldType !== "json" || isValid) {
      setNestedValue(newEditedData, fieldKey, processedValue);
    }

    // 檢查修改狀態
    const isModified =
      JSON.stringify(newEditedData) !== JSON.stringify(originalRestaurant);

    setEditedRestaurants((prev) => ({
      ...prev,
      [restaurantId]: {
        data: newEditedData,
        isModified: isModified,
        display: newDisplay,
      },
    }));
  };

  // 處理現有餐廳的儲存邏輯 (原 handleSave 簡化，只處理 PUT)
  const handleSave = async (restaurantId) => {
    const editEntry = editedRestaurants[restaurantId];
    if (!editEntry || !editEntry.isModified) {
      alert("沒有變更，無需儲存。");
      return;
    }

    if (restaurantId === "new") {
      // 🚨 移除新增邏輯，應該由 handleModalSubmit 處理
      console.error("嘗試在表格中儲存新增的項目，這應該不會發生。");
      return;
    }

    const { data } = editEntry;

    // 檢查 JSON 格式 (與原邏輯相同)
    const invalidJsonFields = RESTAURANT_FIELDS.filter(
      (f) => f.type === "json"
    ).some((f) => {
      const displayValue =
        editEntry.display[f.key] || dataToDisplayValue(data, f.key, f.type);
      if (!displayValue.trim()) return false;
      try {
        JSON.parse(displayValue);
        return false;
      } catch (e) {
        return true;
      }
    });

    if (invalidJsonFields) {
      alert("JSON 格式錯誤，請修正後再儲存。");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/restaurants", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: restaurantId, data }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`API 儲存失敗: ${errorData.message || res.statusText}`);
      }

      const result = await res.json();
      const savedRestaurant = result.restaurant || {
        ...data,
        id: restaurantId,
      };

      setRestaurants((prev) =>
        prev.map((r) => (r.id === restaurantId ? savedRestaurant : r))
      );
      setEditedRestaurants((prev) => {
        const newState = { ...prev };
        delete newState[restaurantId];
        return newState;
      });
      console.log(`餐廳 ${restaurantId} 儲存成功！`);
    } catch (error) {
      console.error("Error saving restaurant:", error);
      alert("儲存失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (restaurantId) => {
    // 🚨 移除新增模式的重設邏輯
    setEditedRestaurants((prev) => {
      const newState = { ...prev };
      delete newState[restaurantId];
      return newState;
    });
    console.log("已重設此餐廳的修改。");
  };

  /**
   * 🚨 核心修改 5/4: 處理 Modal 表單提交
   */
  const handleModalSubmit = async (newRestaurantData) => {
    setIsModalSubmitting(true);
    // 🚨 模態窗提交時，確保將 facadePhotoUrls 圖片數據放入
    // 實際的圖片上傳邏輯應該在這裡執行，然後將實際 URL 放入 newRestaurantData
    // 為了簡化，我們假設圖片已經被處理/上傳 (您在 NewRestaurantModal.js 中處理了檔案，但這裡沒有上傳 API)

    // 這裡我們假設圖片上傳成功，並將一個模擬 URL 加入數據
    let finalData = { ...newRestaurantData };

    if (selectedFile && !newRestaurantData.facadePhotoUrls.length) {
      // 模擬上傳邏輯
      setIsUploading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 模擬上傳延遲
      finalData.facadePhotoUrls = [
        `http://example.com/uploaded/${Date.now()}-${selectedFile.name}`,
      ];
      setIsUploading(false);
    }

    try {
      const res = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`API 新增失敗: ${errorData.message || res.statusText}`);
      }

      alert("新增餐廳成功！");
      setShowAddModal(false); // 關閉模態窗
      setSelectedFile(null); // 清除檔案狀態

      // 重新載入以顯示新餐廳 (回到第一頁)
      setSubmittedSearchQuery("");
      setCurrentPage(1);
      setPageHistory([]);
      // fetchRestaurants 會被 useEffect 觸發
    } catch (error) {
      console.error("Error adding new restaurant:", error);
      alert("新增失敗: " + error.message);
    } finally {
      setIsModalSubmitting(false);
    }
  };

  /**
   * 處理分頁：下一頁
   * 點擊時，將當前的 anchorId (下一頁的起點) 存入歷史紀錄，並增加頁碼
   */
  const handleNextPage = () => {
    // 🚨 確保不在搜尋模式下
    if (hasMore && !loading && !submittedSearchQuery.trim()) {
      // 使用最新的 anchorId (即當前頁的最後一個文件 ID)
      const currentAnchor = anchorIdRef.current;

      if (currentAnchor) {
        // 1. 將當前錨點加入歷史紀錄 (這是 Page N+1 查詢時要使用的錨點)
        setPageHistory((prev) => [...prev, currentAnchor]);

        // 2. 增加頁碼，觸發 useEffect
        setCurrentPage((prev) => prev + 1);
      }
    }
  };

  /**
   * 處理分頁：上一頁
   * 點擊時，減少頁碼並縮短 pageHistory
   */
  const handlePrevPage = () => {
    // 🚨 確保不在搜尋模式下
    if (currentPage > 1 && !loading && !submittedSearchQuery.trim()) {
      // 1. 減少頁碼
      const newPage = currentPage - 1;

      // 2. 縮短歷史紀錄，只保留到新頁碼的前一頁
      setPageHistory((prev) => prev.slice(0, newPage - 1));

      // 3. 更新頁碼，觸發 useEffect
      setCurrentPage(newPage);
    }
  };

  /**
   * 處理搜尋
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (loading) return;

    // 清空編輯狀態
    setEditedRestaurants({});

    // 🚨 核心修改 6：更新 submittedSearchQuery，這將觸發 useEffect 進行查詢
    setSubmittedSearchQuery(searchQuery.trim());

    // 重新設定所有分頁狀態
    setAnchorId(null);
    setPageHistory([]);
    setCurrentPage(1); // 這是唯一的觸發點
  };

  /**
   * 🚨 核心修改 7/4: 處理新增按鈕 (開啟 Modal)
   */
  const handleAddNewRestaurant = () => {
    // 🚨 開啟 Modal
    setShowAddModal(true);

    // 清除可能殘留的檔案狀態
    setSelectedFile(null);

    // 清空當前搜尋狀態 (非必要，但能確保視覺上專注於新增)
    setSearchQuery("");
    setSubmittedSearchQuery("");

    // 清空編輯狀態
    setEditedRestaurants({});

    // 確保頁面回到基礎狀態
    setCurrentPage(1);
    setPageHistory([]);
  };

  // 組合餐廳數據：原始數據 + 編輯中的數據 (移除新增模式的判斷)
  const combinedRestaurants = useMemo(() => {
    // 🚨 由於新增邏輯已移至 Modal，這裡只處理現有數據和編輯狀態
    return restaurants.map((r) => {
      const editedEntry = editedRestaurants[r.id];
      const data = editedEntry ? editedEntry.data : r;
      const isModified = editedEntry ? editedEntry.isModified : false;
      return {
        id: r.id,
        isModified,
        data,
      };
    });
  }, [restaurants, editedRestaurants]);

  // --- 渲染 (Render) ---

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200 min-w-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">
        餐廳管理 (Admin - 完整編輯)
      </h2>

      {/* 搜尋欄位 + 新增按鈕 */}
      <form onSubmit={handleSearchSubmit} className="mb-6 flex space-x-4">
        <input
          type="text"
          value={searchQuery}
          // 🚨 這裡只更新 searchQuery，不會觸發 useEffect
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜尋餐廳名稱 (中/英)"
          className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          disabled={loading || showAddModal}
        />
        <button
          type="submit"
          disabled={loading || showAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out disabled:opacity-50"
        >
          搜尋
        </button>
        {/* 增加新增餐廳按鈕 */}
        <button
          type="button"
          onClick={handleAddNewRestaurant}
          // 🚨 這裡的 disabled 修正：當 loading 或 Modal 開啟時禁用
          disabled={loading || showAddModal}
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
      {(loading || isModalSubmitting || isUploading) && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
          <LoadingSpinner />
        </div>
      )}

      {/* 餐廳表格 */}
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-[5]">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                ID
              </th>
              {RESTAURANT_FIELDS.map((field) => (
                <th
                  key={field.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                >
                  {field.label}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {combinedRestaurants.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={RESTAURANT_FIELDS.length + 2}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  {submittedSearchQuery.trim()
                    ? "找不到符合條件的餐廳。"
                    : "沒有餐廳資料。"}
                </td>
              </tr>
            ) : (
              combinedRestaurants.map((item) => {
                const isJsonInvalid = RESTAURANT_FIELDS.filter(
                  (f) => f.type === "json"
                ).some((f) => {
                  const displayValue =
                    editedRestaurants[item.id]?.display?.[f.key] ||
                    dataToDisplayValue(item.data, f.key, f.type);
                  if (!displayValue.trim()) return false;
                  try {
                    JSON.parse(displayValue);
                    return false;
                  } catch (e) {
                    return true;
                  }
                });

                // 🚨 移除 isNewRow 判斷，因為新增邏輯已移至 Modal
                const isNewRow = false;

                return (
                  <tr
                    key={item.id}
                    className={
                      item.isModified
                        ? "bg-yellow-50 hover:bg-yellow-100 transition-colors"
                        : "hover:bg-gray-50 transition-colors"
                    }
                  >
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500 w-16 truncate max-w-xs">
                      {item.id}
                      {item.createdAt}
                    </td>
                    {RESTAURANT_FIELDS.map((field) => {
                      const fieldType = field.type || "text";

                      const valueToDisplay =
                        editedRestaurants[item.id]?.display?.[field.key] ??
                        dataToDisplayValue(item.data, field.key, fieldType);

                      const isFieldJsonInvalid =
                        fieldType === "json" &&
                        editedRestaurants[item.id]?.display?.[field.key] &&
                        valueToDisplay.trim()
                          ? (() => {
                              try {
                                JSON.parse(valueToDisplay);
                                return false;
                              } catch (e) {
                                return true;
                              }
                            })()
                          : false;

                      return (
                        <td
                          key={field.key}
                          className="px-4 py-2 text-sm text-gray-900 min-w-[150px]"
                        >
                          {fieldType === "boolean" ? (
                            <select
                              // 🚨 這裡改為直接從 item.data 獲取，因為 handleInputChange 處理了布林值的修改
                              value={(
                                getNestedValue(item.data, field.key) ?? false
                              ).toString()}
                              onChange={(e) =>
                                handleInputChange(
                                  item.id,
                                  field.key,
                                  e.target.value,
                                  fieldType
                                )
                              }
                              className="p-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 w-full min-w-[70px]"
                            >
                              <option value="true">是</option>
                              <option value="false">否</option>
                            </select>
                          ) : fieldType === "json" ? (
                            <textarea
                              value={valueToDisplay}
                              onChange={(e) =>
                                handleInputChange(
                                  item.id,
                                  field.key,
                                  e.target.value,
                                  fieldType
                                )
                              }
                              className={`p-1 border rounded w-full h-32 text-xs font-mono resize-y ${
                                isFieldJsonInvalid
                                  ? "border-red-500 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-blue-500"
                              }`}
                              placeholder={`請輸入有效的 JSON 陣列或物件...`}
                            />
                          ) : (
                            <input
                              type={fieldType === "number" ? "number" : "text"}
                              value={valueToDisplay}
                              onChange={(e) =>
                                handleInputChange(
                                  item.id,
                                  field.key,
                                  e.target.value,
                                  fieldType
                                )
                              }
                              className="p-1 border border-gray-300 rounded w-full focus:ring-blue-500 focus:border-blue-500"
                              min={fieldType === "number" ? 0 : undefined}
                            />
                          )}
                          {isFieldJsonInvalid && (
                            <p className="text-red-500 text-xs mt-1">
                              JSON 格式錯誤！
                            </p>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-40">
                      <button
                        onClick={() => handleSave(item.id)}
                        disabled={!item.isModified || loading || isJsonInvalid}
                        className={`ml-2 py-1 px-3 rounded text-white font-semibold transition duration-150 ${
                          !item.isModified || isJsonInvalid
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        } disabled:opacity-50`}
                      >
                        儲存
                      </button>
                      <button
                        onClick={() => handleReset(item.id)}
                        disabled={!item.isModified || loading}
                        className="ml-2 py-1 px-3 rounded bg-red-500 hover:bg-red-600 text-white font-semibold transition duration-150 disabled:opacity-50"
                      >
                        重設
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
      {!submittedSearchQuery.trim() && !showAddModal && (
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

      {/* 🚨 渲染 NewRestaurantModal，使用新的名稱和圖片狀態 */}
      {showAddModal && (
        <NewRestaurantModal
          RESTAURANT_FIELDS={RESTAURANT_FIELDS}
          isOpen={showAddModal} // 必須傳遞 isOpen
          onClose={() => {
            setShowAddModal(false);
            setSelectedFile(null); // 關閉時清空檔案
          }}
          onSubmit={handleModalSubmit}
          isSubmitting={isModalSubmitting}
          // 圖片相關 props
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          onRemovePhoto={handleRemovePhoto}
          isUploading={isUploading}
        />
      )}
    </div>
  );
};

export default RestaurantManagement;
