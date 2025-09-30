// src/app/layout.js
import { AuthProvider } from "@/lib/auth-context";
import AppLayout from "@/components/AppLayout"; // ✅ 引入新的 AppLayout
import "./globals.css";

export const metadata = {icons: {
  icon: "/chopsbook_icon.ico",
  shortcut: "/chopsbook_icon.ico",
},}


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
