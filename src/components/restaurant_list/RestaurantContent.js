// RestaurantContent.js
"use client";
import React, { useState, useCallback, useEffect, useContext } from "react";
import { useSearchParams } from "next/navigation";
import FilterSidebar from "../filters/FilterSidebar";
import RestaurantListPage from "./RestaurantListPage";
import Modal from "../Modal";
import { AuthContext } from "../../lib/auth-context";

const RestaurantContent = () => {
  const { modalMessage, setModalMessage } = useContext(AuthContext);
  const searchParams = useSearchParams();

  const initialFilters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};

  const initialSearchQuery = searchParams.get("search") || "";
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isGridView, setIsGridView] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRestaurants = useCallback(
    async (signal) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        for (const key in appliedFilters) {
          const value = appliedFilters[key];
          if (Array.isArray(value)) {
            value.forEach((item) => params.append(`${key}[]`, item));
          } else if (value !== "" && value !== undefined && value !== null) {
            params.append(key, value);
          }
        }
        if (searchQuery) {
          params.append("search", searchQuery);
        }
        const response = await fetch(`/api/filter?${params.toString()}`, {
          signal,
        });
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        const data = await response.json();
        if (!signal.aborted) {
          setRestaurants(data.restaurants);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch restaurants:", error);
          setRestaurants([]);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [appliedFilters, searchQuery]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchRestaurants(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchRestaurants]);

  const handleApplyFilters = useCallback((filters) => {
    setAppliedFilters(filters);
    setSearchQuery("");
  }, []);

  const handleResetFilters = useCallback(() => {
    setAppliedFilters({});
    setSearchQuery("");
  }, []);

  const handleRemoveFilter = useCallback((key, valueToRemove) => {
    setAppliedFilters((prevFilters) => {
      const newFilters = { ...prevFilters };
      if (key === "favoriteRestaurantIds") {
        delete newFilters.favoriteRestaurantIds;
      } else if (Array.isArray(newFilters[key])) {
        newFilters[key] = newFilters[key].filter(
          (item) => item !== valueToRemove
        );
        if (newFilters[key].length === 0) {
          delete newFilters[key];
        }
      } else if (key === "minAvgSpending" || key === "maxAvgSpending") {
        delete newFilters.minAvgSpending;
        delete newFilters.maxAvgSpending;
      } else if (key === "minSeatingCapacity" || key === "maxSeatingCapacity") {
        delete newFilters.minSeatingCapacity;
        delete newFilters.maxSeatingCapacity;
      } else {
        delete newFilters[key];
      }
      return newFilters;
    });
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setAppliedFilters({});
  }, []);

  const toggleView = useCallback(() => {
    setIsGridView((prev) => !prev);
  }, []);

  const closeModal = () => setModalMessage("");

  const isFavoritesFilterActive =
    appliedFilters.favoriteRestaurantIds &&
    appliedFilters.favoriteRestaurantIds.length > 0;

  return (
    // 1. We remove the `h-full` and `pt-[140px]` from the outer container here.
    // The parent `main` is already handling the full screen height.
    // This allows the child to simply grow and fill the space.
    <div className="flex flex-col font-inter mb-6">
      {/* 2. Content Area: We apply `pt-[140px]` here to push the content down,
            and `flex-grow` to allow it to expand to fill the available space. */}
      <div className="flex-grow pt-[140px]">
        <div className="max-w-screen-xl mx-auto flex gap-x-8">
          {/* 3. Sidebar Container: We use relative positioning. */}
          <div className="w-1/4 flex-shrink-0 relative">
            {/* 4. The Sticky Sidebar: We remove the complex `calc()`
               and rely on `h-full` with `overflow-y-auto` to handle its height.
               This makes it flexible and scrollable. */}
            <div className="sticky top-[140px] h-[calc(100vh-140px)] overflow-y-auto">
              <FilterSidebar
                key={JSON.stringify(appliedFilters)}
                initialFilters={appliedFilters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>

          {/* 5. Main Content Area: It will fill the remaining horizontal space. */}
          <div className="flex-grow pb-8 px-4 sm:px-6 lg:px-8">
            <RestaurantListPage
              filters={appliedFilters}
              onClearFilters={handleResetFilters}
              onRemoveFilter={handleRemoveFilter}
              searchQuery={searchQuery}
              isGridView={isGridView}
              toggleView={toggleView}
              restaurants={restaurants}
              loading={loading}
              isFavoritesFilterActive={isFavoritesFilterActive}
            />
          </div>
        </div>
      </div>

      {modalMessage && (
        <Modal
          message={modalMessage}
          onClose={closeModal}
          isOpen={!!modalMessage}
        />
      )}
    </div>
  );
};

export default RestaurantContent;
