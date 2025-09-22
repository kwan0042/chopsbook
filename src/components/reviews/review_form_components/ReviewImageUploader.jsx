import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";

const ReviewImageUploader = ({
  uploadedImages,
  handleImageUpload,
  handleImageDescriptionChange,
  handleRemoveImage,
}) => {
  return (
    <div>
      <label className="block text-gray-700 text-sm font-bold mb-2">
        上傳圖片 (最多 5 張，僅限 .jpg)
      </label>
      <div className="flex items-center space-x-4">
        <label className="text-sm flex-shrink-0 cursor-pointer bg-blue-500 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-blue-600 transition-colors">
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          選擇圖片
          <input
            type="file"
            accept=".jpg,.jpeg"
            multiple
            onChange={handleImageUpload}
            disabled={uploadedImages.length >= 5}
            className="hidden"
          />
        </label>
        <span className="text-gray-600 text-sm">
          已選擇 {uploadedImages.length} / 5 張
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mt-4">
        {uploadedImages.map((image) => (
          <div key={image.id} className="relative group">
            <img
              src={image.url}
              alt="Uploaded preview"
              className="w-full h-32 object-cover rounded-md"
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(image.id)}
              className="absolute top-1 right-1 p-1 text-gray-500 hover:text-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <input
              type="text"
              value={image.description}
              onChange={(e) =>
                handleImageDescriptionChange(image.id, e.target.value)
              }
              className="w-full mt-2 p-1 text-sm border border-gray-300 rounded-md"
              placeholder="菜式名 (選填)"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewImageUploader;
