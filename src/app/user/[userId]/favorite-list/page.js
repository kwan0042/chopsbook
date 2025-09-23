// src/app/user/[userId]/favorite-list/page.js
"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams } from "next/navigation";
import { AuthContext } from "@/lib/auth-context";
import LoadingSpinner from "@/components/LoadingSpinner";
import FavRestaurantCard from "@/components/personal/FavRestaurantCard";
import Modal from "@/components/Modal";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function FavoriteListPage() {
  const { currentUser, loadingUser, setModalMessage, appId } =
    useContext(AuthContext);
  const { userId } = useParams();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [allFavoriteIds, setAllFavoriteIds] = useState([]);
  const [totalFavorites, setTotalFavorites] = useState(0);

  const isMyProfile = currentUser?.uid === userId;
  const ITEMS_PER_PAGE = 10;

  const handleRemoveFavorite = useCallback((restaurantId) => {
    setRestaurants((prevRestaurants) =>
      prevRestaurants.filter((rest) => rest.id !== restaurantId)
    );
    setAllFavoriteIds((prevIds) => prevIds.filter((id) => id !== restaurantId));
  }, []);

  const fetchFavorites = useCallback(
    async (idsToFetch) => {
      if (idsToFetch.length === 0) {
        setRestaurants([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch("/api/restaurants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ favoriteRestaurantIds: idsToFetch }),
        });

        if (!response.ok) {
          throw new Error("無法載入收藏餐廳。");
        }

        const data = await response.json();
        setRestaurants((prevRestaurants) => {
          if (page === 0) {
            return data.restaurants;
          } else {
            return [...prevRestaurants, ...data.restaurants];
          }
        });
      } catch (err) {
        console.error("Failed to fetch favorite restaurants:", err);
        setModalMessage("載入收藏餐廳時發生錯誤。");
      } finally {
        setLoading(false);
      }
    },
    [setModalMessage, page]
  );

  useEffect(() => {
    if (isMyProfile && currentUser?.favoriteRestaurants) {
      const storedIds = currentUser.favoriteRestaurants;
      setAllFavoriteIds(storedIds);
      setTotalFavorites(storedIds.length);

      const idsToFetch = storedIds.slice(
        page * ITEMS_PER_PAGE,
        (page + 1) * ITEMS_PER_PAGE
      );
      fetchFavorites(idsToFetch);
    }
  }, [currentUser, isMyProfile, page, fetchFavorites]);

  useEffect(() => {
    if (!isMyProfile && !loadingUser) {
      const fetchOtherUserFavorites = async () => {
        setLoading(true);
        try {
          // ✅ 關鍵修正: 更新 API 路徑並加入 appId 參數
          const response = await fetch(
            `/api/reviews/get-user-favorites?userId=${userId}&appId=${appId}`
          );
          if (!response.ok) {
            throw new Error("無法載入用戶收藏列表");
          }
          const data = await response.json();
          const storedIds = data.favoriteRestaurants || [];
          setAllFavoriteIds(storedIds);
          setTotalFavorites(storedIds.length);

          const idsToFetch = storedIds.slice(
            page * ITEMS_PER_PAGE,
            (page + 1) * ITEMS_PER_PAGE
          );
          fetchFavorites(idsToFetch);
        } catch (error) {
          console.error("Failed to fetch other user favorites:", error);
          setModalMessage("無法載入此用戶的收藏清單。");
          setLoading(false);
        }
      };
      fetchOtherUserFavorites();
    }
  }, [
    isMyProfile,
    loadingUser,
    userId,
    page,
    setModalMessage,
    fetchFavorites,
    appId,
  ]);

  const hasMore = (page + 1) * ITEMS_PER_PAGE < totalFavorites;

  const handleNextPage = () => {
    if (hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    if (!isMyProfile) return;

    const items = Array.from(restaurants);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setRestaurants(items);

    const newFavoriteIds = items.map((restaurant) => restaurant.id);
    updateFavoriteOrderInDB(newFavoriteIds);
  };

  const updateFavoriteOrderInDB = async (newFavoriteIds) => {
    try {
      const response = await fetch("/api/favRanking", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          favoriteIds: newFavoriteIds,
        }),
      });

      if (!response.ok) {
        throw new Error("無法更新收藏順序");
      }
    } catch (error) {
      console.error("Failed to update favorite order:", error);
      setModalMessage("更新收藏順序失敗。");
    }
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!loading && totalFavorites === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        {isMyProfile ? "你" : "此用戶"}目前沒有收藏的餐廳。
        <div className="mt-4">
          <Link href="/restaurants" className="text-blue-500 hover:underline">
            探索新餐廳
          </Link>
        </div>
      </div>
    );
  }

  if (loading && restaurants.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        {isMyProfile ? "我的收藏" : "最愛餐廳"} ({totalFavorites} 間)
      </h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="favorite-list">
          {(provided) => (
            <div
              className="space-y-6"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {restaurants.map((restaurant, index) => (
                <Draggable
                  key={restaurant.id}
                  draggableId={restaurant.id}
                  index={index}
                  isDragDisabled={!isMyProfile}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <FavRestaurantCard
                        restaurant={restaurant}
                        onRemove={handleRemoveFavorite}
                        index={index}
                        isMyProfile={isMyProfile}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex justify-center mt-8">
        {hasMore && (
          <button
            onClick={handleNextPage}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
            disabled={loading}
          >
            載入更多
          </button>
        )}
      </div>
      <Modal />
    </div>
  );
}
