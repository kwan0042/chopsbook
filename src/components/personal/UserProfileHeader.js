// src/components/profile/UserProfileHeader.js
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faPenToSquare, faCheck } from "@fortawesome/free-solid-svg-icons";

const UserProfileHeader = ({
  currentUser,
  profilePhoto,
  introText,
  isEditingIntro,
  setIsEditingIntro,
  setIntroText,
  handleSaveIntro,
  handleUploadPhoto,
  stats,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between ">
      {/* 左側：頭像與用戶名 */}
      <div className="flex items-center space-x-6 ">
        <div className="relative group cursor-pointer w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
          <img
            src={profilePhoto || "/default-avatar.png"}
            alt="User Profile"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {/* 頭像編輯按鈕 */}
          <label htmlFor="photo-upload" className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <FontAwesomeIcon icon={faCamera} className="text-white text-2xl" />
            <input
              id="photo-upload"
              type="file"
              className="hidden"
              onChange={handleUploadPhoto}
              accept="image/*"
            />
          </label>
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-1">
            {currentUser.username || currentUser.email.split("@")[0]}
          </h2>
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="text-gray-500 font-medium">等級 {currentUser.rank}</span>
            <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors">
              追蹤 (未開放)
            </button>
          </div>
        </div>
      </div>

      {/* 右側：統計數據 */}
      <div className="flex-shrink-0 bg-gray-50 p-6 rounded-lg shadow-inner w-full md:w-auto">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-800">{stats.publishedReviews}</p>
            <p className="text-sm text-gray-500">已發布評論</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800">{stats.photos}</p>
            <p className="text-sm text-gray-500">上傳相片</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800">{stats.likesReceived}</p>
            <p className="text-sm text-gray-500">獲得讚數</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800">{stats.likesGiven}</p>
            <p className="text-sm text-gray-500">給予讚數</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileHeader;