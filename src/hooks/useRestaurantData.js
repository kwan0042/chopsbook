"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  orderBy,
  where,
  doc, // ⬅️ 新增
  getDoc, // ⬅️ 新增
} from "firebase/firestore";

/**
 * Custom Hook to fetch all necessary data for a restaurant page.
 * @param {object} firestoreDb - Firestore database instance from AuthContext.
 * @param {string} appId - The application ID.
 * @param {string} restaurantId - The ID of the restaurant to fetch data for.
 */
export const useRestaurantData = (firestoreDb, appId, restaurantId) => {
  const [data, setData] = useState({
    restaurant: null, // ⬅️ 關鍵修改：新增餐廳基本資料狀態
    promotions: [],
    topMenus: [],
    topPhotos: [],
    recentReviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!firestoreDb || !restaurantId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // 追蹤 Firestore 讀取量的局部變數
      let totalReads = 0;

      try {
        const fetchCollection = async (collectionPath, constraints = []) => {
          const collectionRef = collection(firestoreDb, collectionPath);
          const q = query(collectionRef, ...constraints);
          const querySnapshot = await getDocs(q);

          // 累加讀取的文件數量
          totalReads += querySnapshot.size;

          return querySnapshot.docs.map((doc) => {
            const data = doc.data();
            const convertedData = { ...data };
            // 修正: 正確地將 Firestore Timestamp 轉換為 JavaScript Date 物件
            if (
              convertedData.createdAt &&
              typeof convertedData.createdAt.toDate === "function"
            ) {
              convertedData.createdAt = convertedData.createdAt.toDate();
            }
            return {
              id: doc.id,
              ...convertedData,
            };
          });
        };

        // ⬅️ 新增：獲取單個餐廳文件的函數
        const fetchRestaurantDetails = async () => {
          const docRef = doc(
            firestoreDb,
            `artifacts/${appId}/public/data/restaurants`,
            restaurantId
          );
          const docSnap = await getDoc(docRef);

          totalReads += 1; // 增加一次讀取

          if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
          } else {
            return null;
          }
        };

        const [restaurantDetails, promos, menus, photos, reviews] =
          await Promise.all([
            fetchRestaurantDetails(), // ⬅️ 呼叫此函數
            fetchCollection(
              `artifacts/${appId}/public/data/restaurants/${restaurantId}/promotions`
            ),
            fetchCollection(
              `artifacts/${appId}/public/data/restaurants/${restaurantId}/menus`
            ),
            fetchCollection(
              `artifacts/${appId}/public/data/restaurants/${restaurantId}/facadePhotoUrls`
            ),
            fetchCollection(`artifacts/${appId}/public/data/reviews`, [
              where("restaurantId", "==", restaurantId),
              where("status", "==", "published"),
              orderBy("createdAt", "desc"),
            ]),
          ]);

        // 錯誤處理：如果找不到餐廳文件
        if (!restaurantDetails) {
          setError("找不到此餐廳資料。");
          setLoading(false);
          return;
        }

        setData({
          restaurant: restaurantDetails, // ⬅️ 關鍵修改：儲存餐廳基本資料
          promotions: promos,
          topMenus: menus.slice(0, 3),
          topPhotos: photos.slice(0, 10),
          recentReviews: reviews, // 這裡我們不需要 slice，在 UI 處理就好
        });

        // 成功獲取數據後，輸出總讀取量到控制台
        console.log(
          `[Firestore Read Count] Restaurant Data Load Success - Total Documents Read: ${totalReads} documents.`
        );
      } catch (err) {
        console.error("Failed to fetch restaurant data:", err);
        setError("無法載入餐廳數據。請稍後再試。");
        // 錯誤時，也輸出讀取量
        console.log(
          `[Firestore Read Count] Restaurant Data Load Error - Documents Read Before Failure: ${totalReads} documents.`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [firestoreDb, appId, restaurantId]);

  // 保持原始的 Hook 返回值 (現在包含 restaurant, loading, error)
  return { ...data, loading, error };
};
