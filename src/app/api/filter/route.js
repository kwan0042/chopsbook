import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// 判斷營業時間邏輯
const isRestaurantOpen = (businessHours, date, time) => {
  if (!businessHours || Object.keys(businessHours).length === 0) return false;

  const correctedDate = new Date(`${date}T12:00:00`);
  const dayOfWeek = correctedDate.getDay();

  const dayMapping = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  const currentDay = dayMapping[dayOfWeek];

  const hoursToday = businessHours.find((h) => h.day === currentDay);
  if (!hoursToday || !hoursToday.isOpen) return false;

  const [openHour, openMinute] = hoursToday.startTime.split(":").map(Number);
  const [closeHour, closeMinute] = hoursToday.endTime.split(":").map(Number);
  const [queryHour, queryMinute] = time.split(":").map(Number);

  const openTimeInMinutes = openHour * 60 + openMinute;
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  let queryTimeInMinutes = queryHour * 60 + queryMinute;

  if (closeTimeInMinutes < openTimeInMinutes) {
    if (queryTimeInMinutes < openTimeInMinutes) {
      queryTimeInMinutes += 24 * 60;
    }
    return (
      queryTimeInMinutes >= openTimeInMinutes &&
      queryTimeInMinutes <= closeTimeInMinutes + 24 * 60
    );
  } else {
    return (
      queryTimeInMinutes >= openTimeInMinutes &&
      queryTimeInMinutes <= closeTimeInMinutes
    );
  }
};

const parseSeatingCapacity = (seatingCapacityData) => {
  let min = 0;
  let max = Infinity;

  if (typeof seatingCapacityData === "string") {
    if (seatingCapacityData.includes("+")) {
      min = parseInt(seatingCapacityData.replace("+", ""), 10);
      max = Infinity;
    } else if (seatingCapacityData.includes("-")) {
      const parts = seatingCapacityData.split("-");
      min = parseInt(parts[0], 10);
      max = parseInt(parts[1], 10);
    } else {
      min = parseInt(seatingCapacityData, 10);
      max = min;
    }
  } else if (typeof seatingCapacityData === "number") {
    min = seatingCapacityData;
    max = seatingCapacityData;
  }

  const result = {
    min: isNaN(min) ? 0 : min,
    max: isNaN(max) ? Infinity : max,
  };
  return result;
};

const passesSeatingFilter = (restaurant, partySize) => {
  if (isNaN(partySize) || partySize <= 0) {
    return true;
  }

  const seatingCapacityData = restaurant.seatingCapacity;
  const { max: restaurantMaxCapacity } =
    parseSeatingCapacity(seatingCapacityData);

  const pass = partySize <= restaurantMaxCapacity;
  return pass;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {};
    for (const [key, value] of searchParams.entries()) {
      if (key.endsWith("[]")) {
        filters[key.replace("[]", "")] = searchParams.getAll(key);
      } else {
        filters[key] = value;
      }
    }

    const {
      limit = 10,
      startAfterDocId,
      search,
      favoriteRestaurantIds,
      province,
      city,
      minAvgSpending,
      maxAvgSpending,
      minRating,
      partySize,
      reservationModes,
      paymentMethods,
      facilities,
      reservationDate,
      reservationTime,
      category,
      businessHours,
    } = filters;

    const appId = process.env.FIREBASE_ADMIN_APP_ID;
    const restaurantsColRef = db.collection(
      `artifacts/${appId}/public/data/restaurants`
    );
    let q = restaurantsColRef;

    // --- 修正人均消費和排序邏輯以符合 Firestore 規則 ---
    // 1. 先進行排序
    if (minAvgSpending || maxAvgSpending) {
      q = q.orderBy("avgSpending", "asc");
    }
    q = q.orderBy("__name__", "asc");

    // 2. 再進行 Firestore 伺服器端篩選
    if (province) {
      q = q.where("province", "==", province);
    }
    if (city) {
      q = q.where("city", "==", city);
    }
    if (minAvgSpending) {
      q = q.where("avgSpending", ">=", parseInt(minAvgSpending, 10));
    }
    if (maxAvgSpending) {
      q = q.where("avgSpending", "<=", parseInt(maxAvgSpending, 10));
    }
    if (minRating) {
      q = q.where("rating", ">=", parseFloat(minRating));
    }
    // --- 修正結束 ---

    let snapshot;
    if (startAfterDocId) {
      const startAfterDoc = await restaurantsColRef.doc(startAfterDocId).get();
      if (startAfterDoc.exists) {
        q = q.startAfter(startAfterDoc);
      }
    }
    q = q.limit(200);
    snapshot = await q.get();

    let restaurantsFromDb = [];
    snapshot.forEach((doc) => {
      restaurantsFromDb.push({ id: doc.id, ...doc.data() });
    });

    let filteredRestaurants = restaurantsFromDb.filter((restaurant) => {
      const passesCategory =
        (category || []).length === 0 ||
        (category || []).every((cat) => restaurant.cuisineType?.includes(cat));

      const passesReservationModes =
        (reservationModes || []).length === 0 ||
        (reservationModes || []).every((mode) =>
          restaurant.reservationModes?.includes(mode)
        );

      const passesPaymentMethods =
        (paymentMethods || []).length === 0 ||
        (paymentMethods || []).every((method) =>
          restaurant.paymentMethods?.includes(method)
        );

      const passesFacilities =
        (facilities || []).length === 0 ||
        (facilities || []).every((facility) =>
          restaurant.facilitiesServices?.includes(facility)
        );

      const passesFavorites =
        !favoriteRestaurantIds ||
        favoriteRestaurantIds.length === 0 ||
        favoriteRestaurantIds.includes(restaurant.id);

      const passesSeating = passesSeatingFilter(
        restaurant,
        parseInt(partySize, 10)
      );

      const passesTimeFilter =
        !reservationDate && !reservationTime
          ? true
          : isRestaurantOpen(
              restaurant.businessHours,
              reservationDate || new Date().toISOString().split("T")[0],
              reservationTime || "12:00"
            );

      return (
        passesCategory &&
        passesReservationModes &&
        passesPaymentMethods &&
        passesFacilities &&
        passesFavorites &&
        passesSeating &&
        passesTimeFilter
      );
    });

    if (search) {
      const normalizedQuery = search.toLowerCase();
      filteredRestaurants = filteredRestaurants.filter(
        (restaurant) =>
          (restaurant.restaurantName?.["zh-TW"] || "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          (restaurant.restaurantName?.en || "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          (restaurant.cuisineType || "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          (restaurant.fullAddress || "").toLowerCase().includes(normalizedQuery)
      );
    }

    const finalLimit = parseInt(limit, 10);
    const paginatedRestaurants = filteredRestaurants.slice(0, finalLimit);
    const hasMore = filteredRestaurants.length > finalLimit;
    const lastDocId =
      paginatedRestaurants.length > 0
        ? paginatedRestaurants[paginatedRestaurants.length - 1].id
        : null;

    return NextResponse.json({
      success: true,
      restaurants: paginatedRestaurants,
      hasMore,
      lastDocId,
    });
  } catch (error) {
    console.error("API Filter Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
