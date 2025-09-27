"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../lib/auth-context";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import Modal from "../Modal";
import LoadingSpinner from "../LoadingSpinner";
import RestaurantForm from "./RestaurantForm";
import { useRouter, useSearchParams } from "next/navigation";
import { validateRestaurantForm } from "../../lib/validation";

// 圖標：用於返回按鈕
const ArrowLeftIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-5 w-5 ${className}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
      clipRule="evenodd"
    />
  </svg>
);

// 營業時間 UI 相關的輔助資料 (確保這裡也能使用)
const DAYS_OF_WEEK = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
];

const UpdateRestaurantPage = ({ onBackToHome }) => {
  const { db, currentUser, appId } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [selectedRestaurantData, setSelectedRestaurantData] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("");
  const [errors, setErrors] = useState({});

  // 格式化日期時間 (雖然在此組件未使用，但保留以防萬一)
  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 獲取所有餐廳，以用於搜尋建議並檢查 URL ID
  useEffect(() => {
    if (!db || !appId) {
      setLoading(false);
      return;
    }
    const fetchAllRestaurants = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, `artifacts/${appId}/public/data/restaurants`)
        );
        const querySnapshot = await getDocs(q);
        const fetchedRestaurants = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setAllRestaurants(fetchedRestaurants);
        setLoading(false);

        // 在這裡直接處理 URL 參數，因為我們已確保 allRestaurants 已經被載入
        const restaurantIdFromUrl = searchParams.get("restaurantId");
        if (restaurantIdFromUrl) {
          const restaurantToSelect = fetchedRestaurants.find(
            (r) => r.id === restaurantIdFromUrl
          );
          if (restaurantToSelect) {
            handleSelectRestaurant(restaurantIdFromUrl);
          } else {
            // URL ID 無效，顯示錯誤訊息並讓使用者從頭搜尋
            setModalMessage("URL 中的餐廳 ID 無效，請重新搜尋。");
            setModalType("error");
            setSelectedRestaurantId(null);
            setSelectedRestaurantData(null);
            setFormData({});
          }
        }
      } catch (error) {
        console.error("獲取餐廳列表失敗:", error);
        setModalMessage(`獲取餐廳列表失敗: ${error.message}`);
        setModalType("error");
        setLoading(false);
      }
    };
    fetchAllRestaurants();
  }, [db, appId, searchParams]); // 調整依賴項，確保 URL 參數變動時會觸發

  // 根據搜尋框輸入過濾建議列表
  useEffect(() => {
    if (searchQuery) {
      const filtered = allRestaurants.filter(
        (r) =>
          r.restaurantName?.["zh-TW"]
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          r.restaurantName?.en
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [searchQuery, allRestaurants]);

  // 處理從建議列表中選擇餐廳
  const handleSelectRestaurant = async (restaurantId) => {
    setSelectedRestaurantId(restaurantId);
    setSearchQuery("");
    setFilteredSuggestions([]);
    setSubmitting(true);
    try {
      const docRef = doc(
        db,
        `artifacts/${appId}/public/data/restaurants`,
        restaurantId
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();

        // **重要變動：資料正規化**
        // 確保 facadePhotoUrls 是陣列
        const facadePhotoUrls = Array.isArray(data.facadePhotoUrls)
          ? data.facadePhotoUrls
          : data.facadePhotoUrl
          ? [data.facadePhotoUrl]
          : [];

        // 確保 businessHours 是包含所有日期的陣列
        const businessHours = DAYS_OF_WEEK.map((day) => {
          const existingHour = Array.isArray(data.businessHours)
            ? data.businessHours.find((bh) => bh.day === day)
            : null;

          return {
            day: day,
            isOpen: existingHour?.isOpen ?? false,
            startTime: existingHour?.startTime ?? "10:00",
            endTime: existingHour?.endTime ?? "20:00",
          };
        });

        // ⚡️ 檢查餐廳是否有中文名稱，以設定 noChineseName 的初始狀態 (新增邏輯)
        const initialNoChineseName = !data.restaurantName?.["zh-TW"];

        const restaurantWithId = {
          id: restaurantId,
          ...data,
          facadePhotoUrls,
          businessHours,
          noChineseName: initialNoChineseName, // ⚡️ 初始化 noChineseName 狀態 (新增邏輯)
        };
        setSelectedRestaurantData(restaurantWithId);
        setFormData(restaurantWithId);
      } else {
        setModalMessage("找不到選擇的餐廳資料。");
        setModalType("error");
        console.log(restaurantId);
        setSelectedRestaurantId(null);
        setSelectedRestaurantData(null);
        setFormData({});
      }
    } catch (error) {
      console.error("獲取選擇餐廳資料失敗:", error);
      setModalMessage(`獲取餐廳資料失敗: ${error.message}`);
      setModalType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // ⚡️ 處理 noChineseName 複選框 (新增邏輯)
    if (name === "noChineseName") {
      setFormData((prev) => {
        const newFormData = { ...prev, [name]: checked };
        // 如果勾選了「沒有中文名稱」，清除中文名稱的值
        if (checked) {
          newFormData.restaurantName = {
            ...prev.restaurantName,
            ["zh-TW"]: "",
          };
        }
        return newFormData;
      });
    } else if (name === "facadePhotoUrl") {
      setFormData((prev) => ({
        ...prev,
        facadePhotoUrls: value ? [value] : [],
      }));
    } else if (name.startsWith("restaurantName.")) {
      const lang = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        restaurantName: {
          ...prev.restaurantName,
          [lang]: value,
        },
        // ⚡️ 如果使用者開始輸入中文名稱，自動取消勾選「沒有中文名稱」 (新增邏輯)
        noChineseName: lang === "zh-TW" && value ? false : prev.noChineseName,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => {
      const currentArray = prev[name] || [];
      if (checked) {
        return { ...prev, [name]: [...currentArray, value] };
      } else {
        return {
          ...prev,
          [name]: currentArray.filter((item) => item !== value),
        };
      }
    });
  };

  const handleSubmit = async (e, updatedFormDataWithImageUrl) => {
    e.preventDefault();
    console.log("1. handleSubmit 函式已開始執行"); // ⚡️ 新增此行
    setSubmitting(true);
    setModalMessage("");
    setModalType("");
    setErrors({}); // 每次提交前先清除舊的錯誤

    const validationErrors = validateRestaurantForm(
      updatedFormDataWithImageUrl
    );

    console.log("2. 驗證結果:", validationErrors); // ⚡️ 新增此行
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitting(false);
      return;
    }

    if (!db || !currentUser || !selectedRestaurantId) {
      const msg = "請先登入並選擇餐廳才能提交更新申請。";
      setModalMessage(msg);
      setModalType("error");
      setSubmitting(false);
      return;
    }

    // 在提交前將特定欄位轉換為數字類型
    const dataToSubmit = { ...updatedFormDataWithImageUrl };
    if (dataToSubmit.avgSpending) {
      dataToSubmit.avgSpending = parseInt(dataToSubmit.avgSpending, 10);
    }
    // 注意：這裡假設電話號碼可能會包含非數字字符，但在 Firebase 結構中應為字串，
    // 因此將其轉換為整數可能會丟失格式（例如 +852）。
    // 由於原始碼使用 parseInt 移除非數字字符並轉為整數，我們保持這個行為。
    if (dataToSubmit.phone) {
      // 保持數字和'+'號，但原始碼中用的是 parseInt，這是一個潛在問題，暫時依照原邏輯處理
      dataToSubmit.phone = parseInt(
        dataToSubmit.phone.toString().replace(/[^0-9]/g, ""),
        10
      );
    }
    if (dataToSubmit.contactPhone) {
      dataToSubmit.contactPhone = parseInt(
        dataToSubmit.contactPhone.toString().replace(/[^0-9]/g, ""),
        10
      );
    }
    if (dataToSubmit.priority) {
      dataToSubmit.priority = parseInt(dataToSubmit.priority, 10);
    }

    // ⚡️ 提交前，移除 transient/helper fields (新增邏輯)
    delete dataToSubmit.noChineseName;

    try {
      const updateApplicationsRef = collection(
        db,
        `artifacts/${appId}/public/data/restaurant_requests`
      );

      const changes = {};
      const fieldsToCheck = Object.keys(dataToSubmit);

      fieldsToCheck.forEach((field) => {
        if (field === "id") return;

        const formValue = dataToSubmit[field];
        const originalValue = selectedRestaurantData?.[field];

        // 確保所有值在比較前都是可比較的
        const v1 = formValue ?? null;
        const v2 = originalValue ?? null;


        if (Array.isArray(v1) && Array.isArray(v2)) {
          if (
            JSON.stringify([...v1].sort()) !==
            JSON.stringify([...v2].sort())
          ) {
            changes[field] = {
              value: v1,
              status: "pending",
            };
          }
        } else if (
          typeof v1 === "object" &&
          typeof v2 === "object" &&
          v1 !== null &&
          v2 !== null
        ) {
          // 針對巢狀物件（如 restaurantName）進行比較
          if (JSON.stringify(v1) !== JSON.stringify(v2)) {
            changes[field] = {
              value: v1,
              status: "pending",
            };
          }
        } else if (
          JSON.stringify(v1) !== JSON.stringify(v2)
        ) {
          changes[field] = {
            value: v1,
            status: "pending",
          };
        }
      });

      if (Object.keys(changes).length === 0) {
        const msg = "您沒有做出任何更改。";
        setModalMessage(msg);
        setModalType("info");
        setSubmitting(false);
        return;
      }

      await addDoc(updateApplicationsRef, {
        restaurantId: selectedRestaurantId,
        changes: changes,
        type: "update", // 新增：標記為更新餐廳請求
        submittedBy: currentUser.uid,
        submittedAt: serverTimestamp(), // 新增：使用新欄位名稱
        status: "pending",
      });
      const successMsg =
        "謝謝你使用ChopsBook，\n" +
        "提供餐廳資訊為廣大嘅美食家作出貢獻。\n" +
        "幕後團隊將火速審批！";
      setModalMessage(successMsg);
      setModalType("success");
      setSelectedRestaurantId(null);
      setSelectedRestaurantData(null);
      setFormData({});
      setSearchQuery("");
      setFilteredSuggestions([]);
    } catch (error) {
      console.error("提交餐廳更新申請失敗:", error);
      const errorMsg = `提交失敗: ${error.message}`;
      setModalMessage(errorMsg);
      setModalType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalMessage("");
    setModalType("");
    if (modalType === "success") {
      onBackToHome();
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center font-inter">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl relative">
        <button
          onClick={onBackToHome}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors flex items-center"
          aria-label="返回商戶專區"
        >
          <ArrowLeftIcon className="mr-2" />
          返回
        </button>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          提交餐廳更新申請
        </h2>
        <p className="text-gray-600 text-center mb-8">
          搜尋並選擇您要更新的餐廳，然後填寫您要修改的資訊。更新將需要管理員審核。
        </p>

        {selectedRestaurantId ? null : (
          <div className="mb-8 relative">
            <label
              htmlFor="searchRestaurant"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              搜尋餐廳名稱
            </label>
            <input
              type="text"
              id="searchRestaurant"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="輸入餐廳名稱 (中文或英文)"
            />
            {searchQuery && filteredSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredSuggestions.map((restaurant) => (
                  <li
                    key={restaurant.id}
                    onClick={() => handleSelectRestaurant(restaurant.id)}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  >
                    {restaurant.restaurantName?.["zh-TW"]} (
                    {restaurant.restaurantName?.en})
                  </li>
                ))}
              </ul>
            )}
            {searchQuery && filteredSuggestions.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">沒有找到匹配的餐廳。</p>
            )}
          </div>
        )}

        {selectedRestaurantId && (
          <RestaurantForm
            formData={formData}
            selectedRestaurantData={selectedRestaurantData}
            handleChange={handleChange}
            handleCheckboxChange={handleCheckboxChange}
            handleSubmit={handleSubmit}
            isLoading={submitting}
            submitButtonText="提交餐廳更新申請"
            isUpdateForm={true}
            errors={errors}
          />
        )}
      </div>
      {modalMessage && (
        <Modal
          message={modalMessage}
          onClose={closeModal}
          isOpen={!!modalMessage}
          duration={modalType === "success" ? 2000 : 0}
          type={modalType}
        />
      )}
    </div>
  );
};

export default UpdateRestaurantPage;
