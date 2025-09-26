// src/app/layout.js
import { AuthProvider } from "@/lib/auth-context";
import AppLayout from "@/components/AppLayout"; // ✅ 引入新的 AppLayout
import "./globals.css";

export const metadata = {
  title: "ChopsBook - 加拿大餐廳評論",
  description: "探索加拿大最好的餐廳。",
  icons: {
    icon: "/chopsbookIcon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body >
        <AuthProvider>
          <AppLayout>{children}</AppLayout> {/* ✅ 在這裡使用 AppLayout */}
        </AuthProvider>
      </body>
    </html>
  );
}
