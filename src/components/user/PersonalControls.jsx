// src/components/user/PersonalControls.jsx
import React from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faCog, faHeart } from "@fortawesome/free-solid-svg-icons";

/**
 * PersonalControls: 用於顯示個人主頁的控制區塊。
 */
const PersonalControls = ({ userId }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-4 hidden md:block">
      <h2 className="text-lg font-bold text-gray-800 mb-4">我的控制台</h2>
      <ul className="space-y-4 text-lg">
        <li>
          <Link
            href={`/review`}
            className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
          >
            <FontAwesomeIcon icon={faPencilAlt} className="mr-3 w-5" />
            <span>寫食評</span>
          </Link>
        </li>
        <li>
          <Link
            href={`/user/${userId}/review-draft`}
            className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
          >
            <FontAwesomeIcon icon={faPencilAlt} className="mr-3 w-5" />
            <span>我的草稿</span>
          </Link>
        </li>
        <li>
          <Link
            href={`/user/${userId}/settings`}
            className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
          >
            <FontAwesomeIcon icon={faCog} className="mr-3 w-5" />
            <span>用戶設定</span>
          </Link>
        </li>
        <li>
          <Link
            href={`/user/${userId}/favorites`}
            className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
          >
            <FontAwesomeIcon icon={faHeart} className="mr-3 w-5" />
            <span>我的喜愛</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default PersonalControls;
