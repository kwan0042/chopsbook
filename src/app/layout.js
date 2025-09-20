import { AuthProvider } from "../lib/auth-context";
import Navbar from "../components/Navbar"; // ✅ 引入 Navbar 元件
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
      <body>
        <AuthProvider>
          <Navbar /> {/* ✅ 在這裡使用 Navbar 元件 */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
