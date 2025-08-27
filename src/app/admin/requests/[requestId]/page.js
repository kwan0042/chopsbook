// v3-src/app/admin/requests/[requestId]/page.js
"use client";

import { useSearchParams, useParams } from "next/navigation";
import AddRestaurantRequestPage from "../../../../components/admin/AddRestaurantRequestPage";
import EditRestaurantRequestPage from "../../../../components/admin/EditRestaurantRequestPage";
import React from "react";

const RequestPage = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const requestId = params.requestId;
  const requestType = searchParams.get("type");

  if (!requestId || !requestType) {
    return (
      <div className="p-8 text-center text-red-500">
        <h1 className="text-xl font-bold">錯誤：缺少必要的請求資訊。</h1>
        <p className="mt-2">請從管理頁面重新選擇一個請求。</p>
      </div>
    );
  }

  // 根據請求類型渲染正確的組件，並將 requestId 作為 props 傳遞
  switch (requestType) {
    case "add":
      return <AddRestaurantRequestPage requestId={requestId} />;
    case "update":
      return <EditRestaurantRequestPage requestId={requestId} />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          <h1 className="text-xl font-bold">錯誤：未知的請求類型。</h1>
          <p className="mt-2">無法處理類型為 {requestType} 的請求。</p>
        </div>
      );
  }
};

export default RequestPage;
