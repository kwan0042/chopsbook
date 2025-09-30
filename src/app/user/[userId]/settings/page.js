// src/app/user/[userId]/settings/page.js
// 這是 Server Component，不帶 'use client'
import SettingsForm from "@/components/user/settings/SettingsForm.js";

// Next.js 會將 params 傳入 Server Component
export default async function UserSettingsPage({ params }) {
  
  const unwrappedParams = await params;
  const { userId } = unwrappedParams;

  // 將解包後的 userId 傳遞給 Client Component
  return <SettingsForm userId={userId} />;
}
