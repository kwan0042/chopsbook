import React from "react";
import HomePage from "@/components/home/HomePage";

/**
 * HomePage：Next.js App Router 的主頁面組件。
 * 這裡只負責渲染主頁的獨特內容，而 Navbar 和 Modal 邏輯則由 AppLayout 處理。
 */
export default function Page() {
  return <HomePage />;
}
