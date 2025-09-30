"use client";

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

export default function ImageModal({ selectedImage, setSelectedImage }) {
  if (!selectedImage) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"
      onClick={() => setSelectedImage(null)} // 點擊背景關閉
    >
      <div
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()} // 點擊此區域不關閉
      >
        <button
          onClick={() => setSelectedImage(null)}
          className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors z-50"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <Image
          src={selectedImage.url}
          alt={selectedImage.description || "放大圖片"}
          width={800}
          height={600}
          className="rounded-lg shadow-lg"
          style={{ objectFit: "contain", maxHeight: "80vh", maxWidth: "90vw" }}
          unoptimized={process.env.NODE_ENV === "development"}
        />
        {selectedImage.description && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white text-sm p-2 rounded-lg z-50">
            {selectedImage.description}
          </div>
        )}
      </div>
    </div>
  );
}
