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
      <label className="block text-gray-700 text-base font-bold mb-2">
        上傳圖片 (最多 6 張，僅限 .jpg)
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
            disabled={uploadedImages.length >= 6}
            className="hidden"
          />
        </label>
        <span className="text-gray-600 text-sm">
          已選擇 {uploadedImages.length} / 6 張
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 ">
        {uploadedImages.map((image) => (
          <div key={image.id} className="relative group mt-4">
            <img
              src={image.url}
              alt="Uploaded preview"
              className="w-full h-32 object-cover rounded-md"
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(image.id)}
              className="absolute top-2 right-2 z-10 
                         flex items-center justify-center 
                         w-6 h-6 rounded-full bg-black/50 
                         text-white hover:bg-black/75 
                          group-hover:opacity-100 
                         transition-opacity"
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
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
