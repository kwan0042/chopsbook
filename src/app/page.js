import React from "react";
import HomePage from "@/components/home/HomePage";

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
      "en": "https://www.chopsbook.com/en",
    },
  },
};


export default function Page() {
  return <HomePage />;
}
