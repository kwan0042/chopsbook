// src/components/RestaurantListPage.js
"use client";

import React, { useState, useContext, useEffect } from "react";
// Please ensure the path and filename (auth-context.js) for '../lib/auth-context' are completely correct, minding case.
import { AuthContext } from "../lib/auth-context";
import {
  collection,
  query,
  onSnapshot,
  // addDoc, // Not used in this version, as addSampleRestaurants is removed
  // getDocs, // Not used as reviewCount is assumed to be in restaurant document
  // where, // Not used as filtering is client-side for now
} from "firebase/firestore"; // Ensure all necessary Firestore functions are imported
// Please ensure the path and filename (LoadingSpinner.js) for './LoadingSpinner' are completely correct, minding case.
import LoadingSpinner from "./LoadingSpinner";
// The AuthContext already handles the global Modal, so direct import and rendering of Modal is no longer needed here.
// import Modal from "./Modal";

import RestaurantCard from "./RestaurantCard"; // Import RestaurantCard
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThLarge,
  faList,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Helper function: Normalizes a string for case-insensitive and space-agnostic searching.
 * @param {string} str - The original string.
 * @returns {string} The normalized string.
 */
const normalizeString = (str) => {
  if (typeof str !== "string") return "";
  return str.toLowerCase().replace(/\s/g, "");
};

/**
 * Helper function: Determines the operating status of a restaurant based on business hours and custom statuses.
 * This is a simplified determination; actual applications would require more precise business hour parsing.
 * @param {object} restaurant - The restaurant data object.
 * @returns {string} The operating status string (Operating, Temporarily Closed, Closed, Permanently Closed).
 */
const getOperatingStatus = (restaurant) => {
  if (restaurant.isPermanentlyClosed) {
    return "已結業";
  }
  if (restaurant.isTemporarilyClosed) {
    return "暫時休業";
  }

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const dayNames = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  const currentDayName = dayNames[dayOfWeek];

  if (restaurant.businessHours) {
    // This performs a simple string inclusion check to see if today's day of the week is mentioned in the business hours string.
    // A more precise determination would require parsing specific time slots.
    if (
      restaurant.businessHours.includes(currentDayName) ||
      restaurant.businessHours.includes("每日")
    ) {
      return "營業中";
    }
  }
  return "休假中";
};

/**
 * RestaurantListPage: Displays a list of restaurants fetched from Firestore,
 * and can be filtered based on search keywords. Now includes list/grid view toggle functionality.
 * @param {object} props - Component properties.
 * @param {object} props.filters - An object containing filter conditions (e.g., region, cuisineType, priceRange, specialConditions, minRating).
 * @param {function} props.onClearFilters - Callback to clear filters and return to the home page.
 * @param {string} props.searchQuery - The search keyword used to filter restaurants.
 * @param {boolean} props.isGridView - Controls whether to display as a grid view.
 * @param {function} props.toggleView - Callback function to toggle the view.
 */
const RestaurantListPage = ({
  filters = {},
  onClearFilters,
  searchQuery = "",
  isGridView,
  toggleView,
}) => {
  const { db, currentUser, appId, toggleFavoriteRestaurant, setModalMessage } =
    useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  // const userId = currentUser?.uid || "anonymous"; // This is not displayed in the current UI

  // Effect 1: Fetches all restaurant data and applies filter and search logic
  useEffect(() => {
    if (!db) {
      // If db is not initialized yet (e.g., AuthContext still setting up Firebase)
      // Set loading to false only if there's no db after initial render to avoid infinite loading.
      // This might happen if firebaseConfig is invalid or __app_id is missing.
      if (!appId || !db) {
        // Check for both appId and db
        console.warn(
          "Firestore DB or App ID not available. Cannot fetch restaurants."
        );
        setModalMessage("未能連接到數據庫。請檢查設定。");
        setLoading(false);
      }
      return;
    }

    let q = collection(db, `artifacts/${appId}/public/data/restaurants`);

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        // Make this async to allow await inside
        let fetchedRestaurants = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // --- Client-side in-memory filtering logic ---
        // Province filter
        if (filters.province && filters.province !== "選擇省份") {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            normalizeString(restaurant.province || "").includes(
              normalizeString(filters.province)
            )
          );
        }
        // City filter
        if (filters.city) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            normalizeString(restaurant.city || "").includes(
              normalizeString(filters.city)
            )
          );
        }
        // Category (CuisineType) filter
        if (filters.category && filters.category.length > 0) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            filters.category.includes(restaurant.cuisineType)
          );
        }

        // Min Average Spending
        if (filters.minAvgSpending !== undefined) {
          fetchedRestaurants = fetchedRestaurants.filter(
            (restaurant) =>
              restaurant.avgSpending &&
              restaurant.avgSpending >= filters.minAvgSpending
          );
        }
        // Max Average Spending
        if (filters.maxAvgSpending !== undefined) {
          fetchedRestaurants = fetchedRestaurants.filter(
            (restaurant) =>
              restaurant.avgSpending &&
              restaurant.avgSpending <= filters.maxAvgSpending
          );
        }

        // Min Seating Capacity
        if (filters.minSeatingCapacity !== undefined) {
          fetchedRestaurants = fetchedRestaurants.filter(
            (restaurant) =>
              restaurant.seatingCapacity &&
              restaurant.seatingCapacity >= filters.minSeatingCapacity
          );
        }

        // Min Rating
        if (filters.minRating && filters.minRating > 0) {
          fetchedRestaurants = fetchedRestaurants.filter(
            (restaurant) => restaurant.rating >= filters.minRating
          );
        }

        // Business Hours (Operating Status) filter
        if (filters.businessHours) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) => {
            const status = getOperatingStatus(restaurant);
            return filters.businessHours === status;
          });
        }

        // Reservation Modes filter (multi-select: must have at least one selected mode)
        if (filters.reservationModes && filters.reservationModes.length > 0) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            filters.reservationModes.some((mode) =>
              restaurant.reservationModes?.includes(mode)
            )
          );
        }

        // Payment Methods filter (multi-select: must have at least one selected method)
        if (filters.paymentMethods && filters.paymentMethods.length > 0) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            filters.paymentMethods.some((method) =>
              restaurant.paymentMethods?.includes(method)
            )
          );
        }

        // Facilities/Services filter (multi-select: must have ALL selected facilities)
        if (filters.facilities && filters.facilities.length > 0) {
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) =>
            filters.facilities.every((facility) =>
              restaurant.facilities?.includes(facility)
            )
          );
        }

        // Search Query filter (applies to multiple fields)
        if (searchQuery) {
          const normalizedSearchQuery = normalizeString(searchQuery);
          fetchedRestaurants = fetchedRestaurants.filter((restaurant) => {
            const nameZh = normalizeString(restaurant.restaurantNameZh || "");
            const nameEn = normalizeString(restaurant.restaurantNameEn || "");
            const cuisine = normalizeString(restaurant.cuisineType || "");
            const address = normalizeString(restaurant.fullAddress || "");

            return (
              nameZh.includes(normalizedSearchQuery) ||
              nameEn.includes(normalizedSearchQuery) ||
              cuisine.includes(normalizedSearchQuery) ||
              address.includes(normalizedSearchQuery)
            );
          });
        }

        // Fetch review counts for all restaurants
        // Assuming reviewCount is already part of the restaurant document for efficiency.
        // If not, a separate query per restaurant would be needed, which is less efficient.
        const restaurantsWithReviewCounts = fetchedRestaurants.map(
          (restaurant) => ({
            ...restaurant,
            reviewCount: restaurant.reviewCount || 0, // Assume reviewCount is already in restaurant data, default to 0
          })
        );

        setRestaurants(restaurantsWithReviewCounts);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch restaurant data:", error);
        setModalMessage(`獲取餐廳資料失敗: ${error.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, appId, JSON.stringify(filters), searchQuery, setModalMessage]); // JSON.stringify for object dependency

  /**
   * Handles the logic for favoriting/unfavoriting a restaurant.
   * Now directly calls the toggleFavoriteRestaurant function provided by AuthContext.
   * @param {string} restaurantId - The ID of the restaurant to favorite or unfavorite.
   */
  const handleToggleFavorite = async (restaurantId) => {
    try {
      await toggleFavoriteRestaurant(restaurantId);
    } catch (error) {
      // Error message is already handled by AuthContext's setModalMessage
    }
  };

  const hasFiltersOrSearch =
    Object.values(filters).some(
      (value) =>
        (Array.isArray(value) && value.length > 0) ||
        (!Array.isArray(value) &&
          value &&
          value !== "0" &&
          value !== "選擇菜系" &&
          value !== "選擇省份" &&
          value !== "") // Add check for empty string for filters like city
    ) || searchQuery.length > 0;

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {hasFiltersOrSearch ? "搜尋/篩選結果" : "所有餐廳"}
        </h2>
        <div className="flex items-center space-x-4">
          {/* Clear Filter/Search button, only shown if filters or search are active */}
          {hasFiltersOrSearch && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center text-red-600 hover:text-red-800 transition duration-150"
            >
              {/* Using a generic 'X' icon from FontAwesome instead of faTimesCircle which is a full circle */}
              <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
              清除所有篩選/搜尋
            </button>
          )}
          {/* Toggle View button, always shown */}
          {toggleView && (
            <button
              onClick={toggleView}
              className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition duration-150"
              aria-label={isGridView ? "切換到列表視圖" : "切換到網格視圖"}
            >
              <FontAwesomeIcon
                icon={isGridView ? faList : faThLarge}
                className="text-xl"
              />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : restaurants.length === 0 ? (
        <p className="text-center text-gray-600 text-lg mt-10">
          {hasFiltersOrSearch
            ? "沒有餐廳符合搜尋/篩選條件。"
            : "目前沒有餐廳資料。"}
        </p>
      ) : (
        <div
          className={
            isGridView
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              : "flex flex-col space-y-4"
          }
        >
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              isGridView={isGridView}
              isFavorited={
                currentUser?.favoriteRestaurants?.includes(restaurant.id) ||
                false
              } // Get favorite status from currentUser
              onToggleFavorite={handleToggleFavorite} // Pass favorite toggle function
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantListPage;
