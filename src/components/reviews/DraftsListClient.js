// src/components/reviews/DraftsListClient.js
"use client";

import React, { useState, useContext } from "react";
import Link from "next/link";
import { doc, deleteDoc } from "firebase/firestore";
import { AuthContext } from "@/lib/auth-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../LoadingSpinner";

const DraftsListClient = ({ drafts: initialDrafts }) => {
  const { currentUser, db, appId } = useContext(AuthContext);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteDraft = async (draftId) => {
    if (!currentUser || !db) return;

    setDeletingId(draftId);
    try {
      const draftDocRef = doc(
        db,
        `artifacts/${appId}/users/${currentUser.uid}/draft_reviews`,
        draftId
      );
      await deleteDoc(draftDocRef);
      setDrafts(drafts.filter((draft) => draft.id !== draftId));
    } catch (error) {
      console.error("Error deleting draft:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (!drafts.length) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-md max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">草稿箱</h2>
        <p className="text-gray-600">目前沒有儲存的草稿。</p>
        <Link
          href="/"
          className="mt-6 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          開始撰寫食評
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-white rounded-xl shadow-lg max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
        我的草稿
      </h1>
      <p className="text-gray-600 text-center mb-8">
        在這裡，你可以找到所有已儲存的食評草稿。點擊編輯或刪除。
      </p>
      <div className="space-y-4">
        {drafts.map((draft) => (
          <div
            key={draft.id}
            className="p-4 border border-gray-200 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 break-words">
                {draft.reviewTitle || "無標題"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium text-gray-700">餐廳：</span>
                {draft.restaurantName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                儲存時間：{new Date(draft.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <Link
                // FIX: Update the href to the correct dynamic route
                href={`/user/${currentUser.uid}/review-draft/${draft.id}`}
                className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                aria-label="編輯草稿"
              >
                <FontAwesomeIcon icon={faEdit} className="mr-1" />
                編輯
              </Link>
              <button
                onClick={() => handleDeleteDraft(draft.id)}
                className="p-2 text-red-500 hover:text-red-700 transition-colors relative"
                disabled={deletingId === draft.id}
                aria-label="刪除草稿"
              >
                {deletingId === draft.id ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrashAlt} className="mr-1" />
                    刪除
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DraftsListClient;
