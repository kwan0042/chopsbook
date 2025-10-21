// src/app/layout.js
import { AuthProvider } from "@/lib/auth-context";
import AppLayout from "@/components/AppLayout"; // ✅ 引入新的 AppLayout
import Script from "next/script";
import "./globals.css";

export const metadata = {
  icons: {
    icon: "/chopsbook_icon.ico",
    shortcut: "/chopsbook_icon.ico",
  },
  metadataBase: new URL("https://chopsbook.com"),
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <head>
        {/* ✅ GA4 追蹤代碼（全站生效） */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-8MS5RD1TCD"
        ></Script>
        <Script id="ga4" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];function 
          gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-8MS5RD1TCD');`}
        </Script>
      </head>
      <body>
        <AuthProvider>
          <AppLayout>{children}</AppLayout> {/* ✅ 在這裡使用 AppLayout */}
        </AuthProvider>
      </body>
    </html>
  );
}
