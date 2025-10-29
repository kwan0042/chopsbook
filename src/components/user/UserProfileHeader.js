// src/components/personal/UserProfileHeader.js
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faPenToSquare,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

const UserProfileHeader = ({
  currentUser,
  profilePhoto,
  introText,
  isEditingIntro,
  setIsEditingIntro,
  setIntroText,
  handleSaveIntro,
  handleUploadPhoto,
  isMyProfile,
  stats,
}) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUploadPhoto(file);
    }
  };

  const isGoogleUser = currentUser?.providerData?.some(
    (provider) => provider.providerId === "google.com"
  );

  const displayPhoto = isGoogleUser
    ? currentUser.pIconUrl
    : profilePhoto || "/default-avatar.webp";

  return (
    <div className="flex flex-col md:flex-row items-center justify-between ">
      <div className="flex items-center md:space-x-6 justify-start  w-full mb-4 md:mb-0">
        <div className="relative group cursor-pointer w-20 h-20 mb:w-28 mb:h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
          <img
            src={displayPhoto}
            alt="User Profile"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {isMyProfile && (
            <label
              htmlFor="photo-upload"
              className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <FontAwesomeIcon
                icon={faCamera}
                className="text-white text-2xl"
              />
              <input
                id="photo-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />
            </label>
          )}
          {isGoogleUser && (
            <div className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow-md">
              <FontAwesomeIcon icon={faGoogle} className="text-blue-500" />
            </div>
          )}
        </div>
        <div className=" text-left md:text-left mx-4">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
            {currentUser.username || currentUser.email.split("@")[0]}
          </h2>
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="text-gray-500 font-medium">
              等級 {currentUser.rank}
            </span>
            <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors">
              追蹤 (未開放)
            </button>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 bg-gray-50 p-6 rounded-lg shadow-inner w-full md:w-auto">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-800">
              {stats.publishedReviews}
            </p>
            <p className="text-sm text-gray-500">已發布評論</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800">{stats.photos}</p>
            <p className="text-sm text-gray-500">上傳相片</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800">
              {stats.likesReceived}
            </p>
            <p className="text-sm text-gray-500">獲得讚數</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800">
              {stats.likesGiven}
            </p>
            <p className="text-sm text-gray-500">給予讚數</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileHeader;
