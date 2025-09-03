"use client";

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../lib/auth-context";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import RestaurantForm from "../components/RestaurantForm";
import { useRouter, useSearchParams } from "next/navigation";

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
            setModalMessage("URL 中的餐廳 ID 無效，請重新搜尋。", "error");
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
  }, [db, appId]); // 只在 db 和 appId 變化時執行一次

  // 根據搜尋框輸入過濾建議列表
  useEffect(() => {
    if (searchQuery) {
      const filtered = allRestaurants.filter(
        (r) =>
          r.restaurantNameZh
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          r.restaurantNameEn?.toLowerCase().includes(searchQuery.toLowerCase())
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
        const restaurantWithId = { id: restaurantId, ...data };
        setSelectedRestaurantData(restaurantWithId);
        setFormData(restaurantWithId);
      } else {
        setModalMessage("找不到選擇的餐廳資料。", "error");
        console.log(restaurantId);
        setSelectedRestaurantId(null);
        setSelectedRestaurantData(null);
        setFormData({});
      }
    } catch (error) {
      console.error("獲取選擇餐廳資料失敗:", error);
      setModalMessage(`獲取餐廳資料失敗: ${error.message}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "facadePhotoUrl") {
      setFormData((prev) => ({
        ...prev,
        facadePhotoUrls: value ? [value] : [],
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
    setSubmitting(true);
    setModalMessage("");
    setModalType("");

    console.log("handleSubmit triggered in UpdateRestaurantPage.");

    if (!db || !currentUser || !selectedRestaurantId) {
      const msg = "請先登入並選擇餐廳才能提交更新申請。";
      console.log("Validation failed (DB/User/Restaurant ID missing):", msg);
      setModalMessage(msg, "error");
      setSubmitting(false);
      return;
    }

    if (
      !updatedFormDataWithImageUrl.restaurantNameZh ||
      !updatedFormDataWithImageUrl.contactName ||
      !updatedFormDataWithImageUrl.contactPhone
    ) {
      const msg = "請填寫所有標記為必填的欄位 (餐廳名稱, 聯絡姓名, 聯絡電話)。";
      console.log("Validation failed (required fields missing):", msg);
      setModalMessage(msg, "error");
      setSubmitting(false);
      return;
    }

    try {
      const updateApplicationsRef = collection(
        db,
        `artifacts/${appId}/public/data/update_rest_request`
      );

      const changes = {};
      const fieldsToCheck = Object.keys(updatedFormDataWithImageUrl);
      fieldsToCheck.forEach((field) => {
        if (field === "id") return;

        const formValue = updatedFormDataWithImageUrl[field];
        const originalValue = selectedRestaurantData?.[field];

        if (Array.isArray(formValue) && Array.isArray(originalValue)) {
          if (
            JSON.stringify([...formValue].sort()) !==
            JSON.stringify([...originalValue].sort())
          ) {
            changes[field] = {
              value: formValue,
              status: "pending",
            };
          }
        } else if (
          JSON.stringify(formValue) !== JSON.stringify(originalValue)
        ) {
          changes[field] = {
            value: formValue,
            status: "pending",
          };
        }
      });

      if (Object.keys(changes).length === 0) {
        const msg = "您沒有做出任何更改。";
        setModalMessage(msg, "info");
        setSubmitting(false);
        return;
      }

      await addDoc(updateApplicationsRef, {
        restaurantId: selectedRestaurantId,
        changes: changes,
        submittedBy: currentUser.uid,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      const successMsg =
        "謝謝你使用ChopsBook 提供餐廳資訊 為廣大嘅美食家作出貢獻 幕後團隊將火速審批";
      console.log("Submission successful:", successMsg);
      setModalMessage(successMsg, "success");
      setSelectedRestaurantId(null);
      setSelectedRestaurantData(null);
      setFormData({});
      setSearchQuery("");
      setFilteredSuggestions([]);
    } catch (error) {
      console.error("提交餐廳更新申請失敗:", error);
      const errorMsg = `提交失敗: ${error.message}`;
      console.log("Submission failed, setting modal message:", errorMsg);
      setModalMessage(errorMsg, "error");
    } finally {
      setSubmitting(false);
      console.log("handleSubmit finished, submitting set to false.");
    }
  };

  const closeModal = () => {
    console.log("Closing modal.");
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
                    {restaurant.restaurantNameZh} ({restaurant.restaurantNameEn}
                    )
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
