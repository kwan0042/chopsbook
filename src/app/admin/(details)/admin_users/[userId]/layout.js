export default function UserLayout({ children }) {
  // 不要繼承上層的 layout，乾淨頁面
  return <>{children}</>;
}
