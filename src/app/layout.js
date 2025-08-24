// src/app/layout.js
"use client"; // 根佈局也需要是客戶端組件，因為它包含了 AuthProvider

import { AuthProvider } from "../lib/auth-context"; // 確保路徑和檔名正確
import "./globals.css"; // 導入全局 CSS 樣式，通常在這裡進行

// 你可以在這裡定義 Metadata，但為了簡潔，我們只保留必要的佈局結構。
// export const metadata = {
//   title: 'ChopsBook - 加拿大餐廳評論',
//   description: '探索加拿大最好的餐廳。',
// };

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>
        {/* AuthProvider 將包裹所有子頁面和組件，確保 AuthContext 全局可用 */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
