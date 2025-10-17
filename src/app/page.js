// src/app/page.js
// 預設為 Server Component (SSR)，專注於 SEO 和靜態內容。

import React from "react";
// Server Component / 靜態內容區塊
import PromotionsSection from "@/components/home/PromotionsSection";
import LatestReviewsSection from "@/components/home/LatestReviewsSection";
import TrendingCateSection from "@/components/home/TrendingCateSection";
import TrendingTopicsSection from "@/components/home/TrendingTopicsSection";

// Client Component (用於互動或需要 Context/狀態的區塊)
import HeroSectionClient from "@/components/home/HeroSection";
import ClientSideHomeWrapper from "@/components/home/ClientSideHomeWrapper";
import HeroSection from "@/components/home/HeroSection";

// --- SEO 最佳化：定義靜態 Metadata ---
export const metadata = {
  title: "ChopsBook - 多倫多餐廳食評交流平台",
  description:
    "ChopsBook 是多倫多專業餐廳評論與美食分享平台，助您發掘異國佳餚與家鄉味道，查看真實用戶評論與熱門菜式，記錄與分享餐廳體驗，找到最適合自己的美食。",
  icons: {
    icon: "/chopsbook_icon.ico",
    shortcut: "/chopsbook_icon.ico",
  },
  keywords: [
    "多倫多餐廳",
    "餐廳評論",
    "美食指南",
    "Toronto 美食",
    "異國佳餚",
    "家鄉味道",
    "ChopsBook",
  ],
  authors: [
    {
      name: "ChopsBook",
      url: "https://www.chopsbook.com",
    },
  ],
  openGraph: {
    title: "ChopsBook - 多倫多餐廳食評交流平台",
    description:
      "探索多倫多熱門餐廳與菜式，查看真實用戶評論與精選照片，找到最適合自己的美食，分享餐廳體驗與心得。",
    url: "https://www.chopsbook.com",
    siteName: "ChopsBook",
    type: "website",
    locale: "zh_TW",
    images: [
      {
        url: "/images/og-homepage.png",
        width: 1200,
        height: 630,
        alt: "ChopsBook 多倫多首頁預覽圖",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChopsBook - 多倫多餐廳食評交流平台",
    description:
      "探索多倫多熱門餐廳與菜式，查看真實用戶評論與精選照片，找到最適合自己的美食，分享餐廳體驗與心得。",
    images: ["/images/og-homepage.png"],
    creator: "@ChopsBookOfficial",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.chopsbook.com",
    languages: {
      "zh-HK": "https://www.chopsbook.com",
      "zh-TW": "https://www.chopsbook.com",
      en: "https://www.chopsbook.com/en",
    },
  },
};
// ------------------------------------

export default async function HomePageServer() {
  return (
    <div className="min-h-screen flex flex-col font-inter">
      <main className="flex-grow mb-4">
        {/* SEO H1 標籤：放在 Server Component，確保即時索引 */}
        <h1 className="sr-only">ChopsBook - 多倫多餐廳食評交流平台</h1>

        <HeroSection />

        <div className="mx-auto py-10 px-2 sm:px-2 lg:px-12">
          <div className="grid grid-cols-6 md:grid-cols-6 gap-4">
            {/* 1. 左側欄位 (col-span-1)：Client Component (個人化推薦 / 排名) */}
            <div className="col-span-1 grid grid-cols-1 gap-4 h-fit">
              {/* 💡 傳遞 side="left" 渲染左側欄的 Client 區塊 */}
              <ClientSideHomeWrapper side="left" />
            </div>

            {/* 2. 中央內容區 (col-span-4)：Server Component (推廣 / 熱門話題) */}
            <div className="col-span-4 grid grid-cols-1 gap-4">
              <PromotionsSection />
              <TrendingTopicsSection />
            </div>

            {/* 3. 右側欄位 (col-span-1)：Server & Client Component 混合 */}
            <div className="col-span-1 grid grid-cols-1 gap-4 h-fit">
              {/* 最新評論 (Server Component - 靜態 SEO 內容) */}
              <LatestReviewsSection />

              {/* 💡 傳遞 side="right" 渲染右側欄的 Client 區塊 (投票/是但食) */}
              <ClientSideHomeWrapper side="right" />
            </div>
          </div>

          <TrendingCateSection />
        </div>
      </main>
    </div>
  );
}
