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
  const { currentUser, loadingUser, setModalMessage } = useContext(AuthContext);
  const { userId } = useParams();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [allFavoriteIds, setAllFavoriteIds] = useState([]);

  const isMyProfile = currentUser?.uid === userId;
  const ITEMS_PER_PAGE = 10;

  const handleRemoveFavorite = useCallback((restaurantId) => {
    setRestaurants((prevRestaurants) =>
      prevRestaurants.filter((rest) => rest.id !== restaurantId)
    );
    setAllFavoriteIds((prevIds) => prevIds.filter((id) => id !== restaurantId));
  }, []);

  const fetchFavorites = useCallback(
    async (pageToFetch) => {
      const startIndex = pageToFetch * ITEMS_PER_PAGE;
      const favoriteIdsToFetch = allFavoriteIds.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
      );

      if (favoriteIdsToFetch.length === 0) {
        setLoading(false);
        if (pageToFetch === 0) setRestaurants([]);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch("/api/restaurants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ favoriteRestaurantIds: favoriteIdsToFetch }),
        });

        if (!response.ok) {
          throw new Error("無法載入收藏餐廳。");
        }

        const data = await response.json();
        if (pageToFetch === 0) {
          setRestaurants(data.restaurants);
        } else {
          setRestaurants((prevRestaurants) => [
            ...prevRestaurants,
            ...data.restaurants,
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch favorite restaurants:", err);
        setModalMessage("載入收藏餐廳時發生錯誤。");
      } finally {
        setLoading(false);
      }
    },
    [allFavoriteIds, setModalMessage]
  );

  useEffect(() => {
    if (currentUser?.uid === userId && currentUser?.favoriteRestaurants) {
      setAllFavoriteIds(currentUser.favoriteRestaurants);
    }
  }, [currentUser, userId]);

  useEffect(() => {
    if (allFavoriteIds.length > 0) {
      fetchFavorites(page);
    }
  }, [allFavoriteIds, page, fetchFavorites]);

  const hasMore = (page + 1) * ITEMS_PER_PAGE < allFavoriteIds.length;

  const handleNextPage = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

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

  if (!isMyProfile) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800">未授權</h2>
        <p className="mt-2 text-gray-600">您無權查看此頁面。</p>
      </div>
    );
  }

  if (allFavoriteIds.length === 0 && !loading) {
    return (
      <div className="text-center text-gray-500 p-4">
        目前沒有收藏的餐廳。
        <div className="mt-4">
          <Link href="/" className="text-blue-500 hover:underline">
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
        我的收藏 ({allFavoriteIds.length} 間)
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
