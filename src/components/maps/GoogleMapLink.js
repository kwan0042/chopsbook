"use client";
import React from "react";

const GoogleMapLink = ({ name, address, className }) => {
  // 🔍 名 + 地址 一齊搜尋，用逗號分隔效果最準
  const query = encodeURIComponent(
    name && address ? `${name}, ${address}` : name || address
  );
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className || "text-blue-600 hover:underline text-sm"}
    >
      查看地圖
    </a>
  );
};

export default GoogleMapLink;
